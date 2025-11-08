from django.shortcuts import render, redirect
from .models import Expense, User
import json
from datetime import datetime
from collections import defaultdict
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Create your views here.
load_dotenv()
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def get_session_collection(request):
    """Get the session-specific collection. Initialize demo data if first visit."""
    session_id = request.session.session_key
    if not session_id:
        request.session.save()  # generates session_key
        session_id = request.session.session_key

    collection_name = f"expenses_{session_id}"

    # Initialize collection only once per session
    if collection_name not in db.list_collection_names():
        db[collection_name].insert_one({
            "description": "Sample Expense",
            "amount": 100,
            "paid_by": {"username": "Admin"},
            "participants": [{"username": "User1"}, {"username": "User2"}],
            "date": datetime.now().isoformat()
        })

    return db[collection_name]


def dashboard(request):
    collection = get_session_collection(request)
    expenses_data = list(collection.find())

    # Calculate totals
    total_amount = sum(exp["amount"] for exp in expenses_data)
    people = set()
    user_totals = {}
    for exp in expenses_data:
        payer = exp.get("paid_by", {}).get("username", "Unknown")
        people.add(payer)
        for p in exp.get("participants", []):
            people.add(p.get("username", "Unknown"))
        user_totals[payer] = user_totals.get(payer, 0) + exp["amount"]

    total_people = len(people)
    total_transactions = len(expenses_data)

    expenses_json = json.dumps([
        {
            "description": e["description"],
            "amount": float(e["amount"]),
            "paidBy": e.get("paid_by", {}).get("username", "Unknown"),
            "participants": [p.get("username", "Unknown") for p in e.get("participants", [])],
            "date": e.get("date", ""),
        }
        for e in expenses_data
    ])

    context = {
        "expenses": expenses_data,
        "user_totals": user_totals,
        "expenses_json": expenses_json,
        "total_amount": total_amount,
        "total_people": total_people,
        "total_transactions": total_transactions,
    }

    return render(request, "dashboard.html", context)


def add_expense(request):
    if request.method == "POST":
        description = request.POST.get("description")
        amount = float(request.POST.get("amount"))
        paid_by_username = request.POST.get("paidBy")
        participants_usernames = request.POST.getlist("participants")

        collection = get_session_collection(request)

        # Save the expense to the session-specific collection
        collection.insert_one({
            "description": description,
            "amount": amount,
            "paid_by": {"username": paid_by_username},
            "participants": [{"username": u} for u in participants_usernames],
            "date": datetime.now().isoformat()
        })

        return redirect("dashboard")

    return render(request, "add-expense.html")


def summary(request):
    collection = get_session_collection(request)
    expenses = list(collection.find())

    total_owed = 0
    total_owing = 0
    balances = defaultdict(float)

    # Calculate balances
    for expense in expenses:
        participants = expense.get("participants", [])
        if not participants:
            continue

        amount_per_person = expense["amount"] / len(participants)
        payer = expense.get("paid_by", {}).get("username", "Unknown")
        balances[payer] += expense["amount"] - amount_per_person * len(participants)

        for p in participants:
            participant_name = p.get("username", "Unknown")
            if participant_name != payer:
                balances[participant_name] -= amount_per_person

    # Separate totals
    for bal in balances.values():
        if bal > 0:
            total_owed += bal
        else:
            total_owing += abs(bal)

    # Settlement suggestions
    settlements = []
    debtors = {u: b for u, b in balances.items() if b < 0}
    creditors = {u: b for u, b in balances.items() if b > 0}

    for debtor, debt_amount in list(debtors.items()):
        debt_amount = abs(debt_amount)
        for creditor, credit_amount in list(creditors.items()):
            if debt_amount == 0:
                break
            if credit_amount == 0:
                continue

            pay_amount = min(credit_amount, debt_amount)
            settlements.append({
                "from": debtor,
                "to": creditor,
                "amount": round(pay_amount, 2)
            })

            creditors[creditor] -= pay_amount
            debt_amount -= pay_amount

        debtors[debtor] = -debt_amount

    context = {
        "total_owed": round(total_owed, 2),
        "total_owing": round(total_owing, 2),
        "active_people": len(balances),
        "balances": balances.items(),
        "settlements": settlements
    }

    return render(request, "summary.html", context)
