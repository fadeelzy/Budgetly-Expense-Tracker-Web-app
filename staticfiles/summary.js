// Summary JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadSummary();
});

function loadSummary() {
    const expenses = JSON.parse(localStorage.getItem('budgetly-expenses') || '[]');
    
    if (expenses.length === 0) {
        showEmptyState();
        return;
    }
    
    const balances = calculateBalances(expenses);
    updateOverviewStats(balances);
    updateIndividualBalances(balances);
    updateSettlements(balances);
    
    // Show content
    document.getElementById('summary-content').classList.add('hidden');
    document.getElementById('individual-balances').classList.remove('hidden');
}

function showEmptyState() {
    document.getElementById('total-owed').textContent = '$0.00';
    document.getElementById('total-owing').textContent = '$0.00';
    document.getElementById('active-people').textContent = '0';
}

function calculateBalances(expenses) {
    const peopleBalances = {};
    const transactions = {};
    
    // Initialize all people
    const allPeople = new Set();
    expenses.forEach(expense => {
        allPeople.add(expense.paidBy);
        expense.participants.forEach(p => allPeople.add(p));
    });
    
    allPeople.forEach(person => {
        peopleBalances[person] = 0;
        transactions[person] = {};
    });
    
    // Calculate what each person owes/is owed
    expenses.forEach(expense => {
        const sharePerPerson = expense.amount / expense.participants.length;
        
        expense.participants.forEach(participant => {
            if (participant !== expense.paidBy) {
                peopleBalances[participant] -= sharePerPerson;
                peopleBalances[expense.paidBy] += sharePerPerson;
                
                if (!transactions[participant][expense.paidBy]) {
                    transactions[participant][expense.paidBy] = 0;
                }
                transactions[participant][expense.paidBy] += sharePerPerson;
            }
        });
    });
    
    // Create balance objects
    const balanceArray = Array.from(allPeople).map(person => {
        const owes = [];
        const owed = [];
        
        Object.entries(transactions[person]).forEach(([to, amount]) => {
            if (amount > 0) {
                owes.push({ to, amount });
            }
        });
        
        Object.entries(transactions).forEach(([from, toAmounts]) => {
            if (toAmounts[person] > 0) {
                owed.push({ from, amount: toAmounts[person] });
            }
        });
        
        return {
            person,
            balance: peopleBalances[person],
            owes,
            owed
        };
    });
    
    return balanceArray;
}

function updateOverviewStats(balances) {
    const totalOwed = balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
    const totalOwing = balances.reduce((sum, b) => sum + Math.abs(Math.min(0, b.balance)), 0);
    
    document.getElementById('total-owed').textContent = `$${totalOwed.toFixed(2)}`;
    document.getElementById('total-owing').textContent = `$${totalOwing.toFixed(2)}`;
    document.getElementById('active-people').textContent = balances.length;
}

function updateIndividualBalances(balances) {
    const container = document.getElementById('balances-list');
    
    const balancesHTML = balances.map(balance => {
        let badgeClass = 'badge badge-secondary';
        let statusText = 'Settled up';
        
        if (balance.balance > 0) {
            badgeClass = 'badge badge-default';
            statusText = 'Is owed';
        } else if (balance.balance < 0) {
            badgeClass = 'badge badge-destructive';
            statusText = 'Owes';
        }
        
        return `
            <div class="flex items-center justify-between p-4 border border-border rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                        <span class="font-medium text-accent-foreground">
                            ${balance.person.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 class="font-medium text-card-foreground">${balance.person}</h3>
                        <p class="text-sm text-muted-foreground">${statusText}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="${badgeClass}">
                        ${balance.balance > 0 ? '+' : ''}$${Math.abs(balance.balance).toFixed(2)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = balancesHTML;
}

function updateSettlements(balances) {
    const container = document.getElementById('settlements-list');
    
    const settlements = [];
    balances.forEach(balance => {
        balance.owes.forEach(owe => {
            settlements.push({
                from: balance.person,
                to: owe.to,
                amount: owe.amount
            });
        });
    });
    
    if (settlements.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-muted-foreground">
                    🎉 Everyone is settled up! No payments needed.
                </p>
            </div>
        `;
        return;
    }
    
    const settlementsHTML = settlements.map(settlement => `
        <div class="flex items-center justify-between p-4 bg-accent/10 rounded-lg">
            <div class="flex items-center space-x-3">
                <span class="font-medium text-card-foreground">${settlement.from}</span>
                <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span class="font-medium text-card-foreground">${settlement.to}</span>
            </div>
            <span class="badge badge-outline">
                $${settlement.amount.toFixed(2)}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = settlementsHTML;
}