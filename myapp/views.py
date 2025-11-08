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

def dashboard(request):
    # -----------------------
    # RESET DATABASE
    # -----------------------
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # Drop the 'expense' collection to reset
    if "expense" in db.list_collection_names():
        db.expense.drop()

    # Optionally, add default/demo expense
    db.expense.insert_one({
        "description": "Sample Expense",
        "amount": 100,
        "paid_by": {"username": "Admin"},
        "participants": [{"username": "User1"}, {"username": "User2"}],
        "date": "2025-11-08T00:00:00"
    })

    # -----------------------
    # FETCH EXPENSES
    # -----------------------
    expenses = Expense.objects().order_by("-date")

    # Total amount
    total_amount = sum(exp.amount for exp in expenses)

    # Collect unique people (both payers and participants)
    people = set()
    for exp in expenses:
        if exp.paid_by:
            people.add(exp.paid_by.username)
        for p in exp.participants:
            people.add(p.username)

    total_people = len(people)
    total_transactions = expenses.count()

    # Spending totals (for chart)
    user_totals = {}
    for exp in expenses:
        user_totals[exp.paid_by.username] = user_totals.get(exp.paid_by.username, 0) + exp.amount

    # Format JSON for dashboard.js
    expenses_data = [
        {
            "description": e.description,
            "amount": float(e.amount),
            "paidBy": e.paid_by.username if e.paid_by else "Unknown",
            "participants": [p.username for p in e.participants],
            "date": e.date.isoformat() if e.date else "",
        }
        for e in expenses
    ]

    context = {
        "expenses": expenses,
        "user_totals": user_totals,
        "expenses_json": json.dumps(expenses_data),
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

        # Get or create "paid by" user
        paid_by_user = User.objects(username=paid_by_username).first()
        if not paid_by_user:
            paid_by_user = User(username=paid_by_username)
            paid_by_user.save()

        # Get or create participants
        participants_users = []
        for username in participants_usernames:
            user = User.objects(username=username).first()
            if not user:
                user = User(username=username)
                user.save()
            participants_users.append(user)

        # Create expense
        expense = Expense(
            description=description,
            amount=amount,
            paid_by=paid_by_user,
            participants=participants_users,
            date=datetime.now()
        )
        expense.save()

        return redirect("dashboard")

    return render(request, "add-expense.html")

def summary(request):
    expenses = Expense.objects()  # fetch all expenses from MongoDB

    total_owed = 0
    total_owing = 0
    balances = defaultdict(float)  # key: user, value: balance

    # calculate balances
    for expense in expenses:
        if len(expense.participants) == 0:
            continue  # avoid division by zero

        amount_per_person = expense.amount / len(expense.participants)

        # the payer gets credit for what they covered
        balances[expense.paid_by.username] += expense.amount - amount_per_person * len(expense.participants)

        # each participant owes their share
        for participant in expense.participants:
            if participant.username != expense.paid_by.username:
                balances[participant.username] -= amount_per_person

    # separate totals
    for bal in balances.values():
        if bal > 0:
            total_owed += bal
        else:
            total_owing += abs(bal)

    # settlement suggestions
    settlements = []
    debtors = {u: b for u, b in balances.items() if b < 0}
    creditors = {u: b for u, b in balances.items() if b > 0}

    # loop until debts are settled
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

            # update balances
            creditors[creditor] -= pay_amount
            debt_amount -= pay_amount

        debtors[debtor] = -debt_amount  # update remaining debt

    context = {
        "total_owed": round(total_owed, 2),
        "total_owing": round(total_owing, 2),
        "active_people": len(balances),
        "balances": balances.items(),
        "settlements": settlements
    }

    return render(request, "summary.html", context)