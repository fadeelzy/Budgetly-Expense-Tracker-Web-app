// Dashboard JavaScript 
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
});

function loadDashboard() {
    // Use Django context variables injected into the template
    const expenses = JSON.parse(document.getElementById("expenses-data").textContent || '[]');
    
    // Update stats
    updateStats(expenses);
    
    // Update recent expenses
    updateRecentExpenses(expenses);
    
    // Update chart
    updateSpendingChart(expenses);
}

function updateStats(expenses) {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const allPeople = new Set();
    expenses.forEach(expense => {
        allPeople.add(expense.paidBy);
        expense.participants.forEach(p => allPeople.add(p));
    });
    
    document.getElementById('total-amount').textContent = `$${totalAmount.toFixed(2)}`;
    document.getElementById('total-people').textContent = allPeople.size;
    document.getElementById('total-transactions').textContent = expenses.length;
}

function updateRecentExpenses(expenses) {
    const expensesList = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        expensesList.innerHTML = `
            <div class="text-center py-8">
                <p class="text-muted-foreground mb-4">No expenses yet</p>
                <a href="/add-expense/" class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Add First Expense
                </a>
            </div>
        `;
        return;
    }
    
    const recentExpenses = expenses.slice(-5).reverse();
    const expensesHTML = recentExpenses.map(expense => `
        <div class="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
                <h3 class="font-medium text-card-foreground">${expense.description}</h3>
                <p class="text-sm text-muted-foreground">
                    Paid by ${expense.paidBy} • ${expense.participants.length} people
                </p>
                <p class="text-xs text-muted-foreground">
                    ${new Date(expense.date).toLocaleDateString()}
                </p>
            </div>
            <div class="text-right">
                <p class="font-bold text-card-foreground">$${expense.amount.toFixed(2)}</p>
                <p class="text-sm text-muted-foreground">
                    $${(expense.amount / expense.participants.length).toFixed(2)} each
                </p>
            </div>
        </div>
    `).join('');
    
    expensesList.innerHTML = `<div class="space-y-4">${expensesHTML}</div>`;
}

function updateSpendingChart(expenses) {
    const ctx = document.getElementById('spending-chart').getContext('2d');
    
    if (expenses.length === 0) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#E5E7EB'],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });
        return;
    }
    
    const spendingByPerson = {};
    expenses.forEach(expense => {
        if (!spendingByPerson[expense.paidBy]) {
            spendingByPerson[expense.paidBy] = 0;
        }
        spendingByPerson[expense.paidBy] += expense.amount;
    });
    
    const colors = [
        'hsl(20, 45%, 15%)', 'hsl(30, 65%, 75%)', 'hsl(20, 35%, 25%)',
        'hsl(20, 25%, 45%)', 'hsl(0, 84.2%, 60.2%)', 'hsl(217.2, 91.2%, 59.8%)',
        'hsl(47.9, 95.8%, 53.1%)', 'hsl(160, 84.1%, 39.4%)', 
        'hsl(270, 95.8%, 53.1%)', 'hsl(24.6, 95%, 53.1%)'
    ];
    
    const labels = Object.keys(spendingByPerson);
    const data = Object.values(spendingByPerson);
    const backgroundColors = labels.map((_, i) => colors[i % colors.length]);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: 'hsl(0, 0%, 100%)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20, usePointStyle: true, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}
