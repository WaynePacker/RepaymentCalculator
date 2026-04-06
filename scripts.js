// ============================================
// UNIFIED APP STATE
// ============================================
let appState = {
    loans: [
        { id: 1, amount: 30000 },
        { id: 2, amount: 45000 }
    ],
    expenses: {
        income: [
            { id: 1, source: 'Salary', amount: 5000 }
        ],
        expenses: [
            { id: 1, label: 'Rent', amount: 1500 }
        ]
    },
    settings: {
        deposit: 2000,
        interest: 7.5,
        payment: 800,
        currency: 'USD'
    }
};

let currentSection = 'loans-compare';
let chartInstance = null;

// ============================================
// INITIALIZATION
// ============================================
function initializeApp() {
    // Detect user's locale currency
    const userCurrency = new Intl.DateTimeFormat(navigator.language, { style: 'currency', currency: 'USD' }).resolvedOptions().currency;
    appState.settings.currency = userCurrency || 'USD';
    
    // Set currency selector
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect && appState.settings.currency) {
        currencySelect.value = appState.settings.currency;
    }
    
    // Wire up loan inputs to app state
    wireUpLoanInputs();
    
    // Initialize both sections
    renderLoans();
    renderExpenses();
    
    // Load default section
    switchSection('loans-compare');
}

// ============================================
// CURRENCY UTILITIES
// ============================================
function changeCurrency(currency) {
    appState.settings.currency = currency;
    renderLoans();
    renderExpenses();
    calculateAndDrawChart();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: appState.settings.currency
    }).format(amount);
}

// ============================================
// NAVIGATION & SECTION SWITCHING
// ============================================
function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(section);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });
    
    // Find and activate the nav button for this section
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(`'${section}'`)) {
            btn.classList.add('active');
        }
    });
    
    // Close mobile nav if open
    if (window.innerWidth < 768) {
        toggleMobileNav();
    }
    
    // Track with gtag
    gtag('event', 'view_section', {
        'section_name': section
    });
    
    currentSection = section;
    
    // Render section-specific content
    if (section === 'loans-compare') {
        calculateAndDrawChart();
    } else if (section === 'expenses-manager') {
        updateExpensesSummary();
    }
}

function toggleMobileNav() {
    const nav = document.getElementById('left-nav');
    const overlay = document.getElementById('nav-overlay');
    
    nav.classList.toggle('active');
    overlay.classList.toggle('active');
}

// ============================================
// LOANS COMPARE SECTION
// ============================================
function wireUpLoanInputs() {
    // Update app state when inputs change
    ['deposit', 'interest', 'payment'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = appState.settings[id];
            input.addEventListener('input', (e) => {
                if (validateInput(e.target.value, id)) {
                    appState.settings[id] = Number(e.target.value);
                    calculateAndDrawChart();
                } else {
                    alert(`Invalid ${id}. Cannot be negative or empty.`);
                    e.target.value = appState.settings[id];
                }
            });
        }
    });
}

function renderLoans() {
    const loanListEl = document.getElementById('loan-list');
    if (!loanListEl) return;
    
    loanListEl.innerHTML = '';
    appState.loans.forEach((loan, index) => {
        const div = document.createElement('div');
        div.className = 'loan-item';
        div.innerHTML = `
            <label>Loan ${index + 1} Amount
                <input type="number" value="${loan.amount}" 
                       oninput="updateLoanAmount(${loan.id}, this.value)">
            </label>
            <button class="remove-btn" onclick="removeLoan(${loan.id})">Remove</button>
        `;
        loanListEl.appendChild(div);
    });
}

function updateLoanAmount(id, value) {
    if (!validateInput(value, 'amount')) {
        alert('Amount cannot be negative or empty.');
        renderLoans();
        return;
    }
    
    const loan = appState.loans.find(l => l.id === id);
    if (loan) {
        loan.amount = Number(value);
        calculateAndDrawChart();
    }
}

function addLoan() {
    const newId = appState.loans.length > 0 ? Math.max(...appState.loans.map(l => l.id)) + 1 : 1;
    appState.loans.push({ id: newId, amount: 50000 });
    renderLoans();
    calculateAndDrawChart();
}

function removeLoan(id) {
    appState.loans = appState.loans.filter(l => l.id !== id);
    renderLoans();
    calculateAndDrawChart();
}

function calculateAndDrawChart() {
    if (currentSection !== 'loans-compare') return;
    
    const deposit = appState.settings.deposit;
    const annualRate = appState.settings.interest;
    const monthlyRate = (annualRate / 100) / 12;
    const payment = appState.settings.payment;

    let maxMonths = 0;
    
    let summaryHTML = `
        <h3>Repayment Summary</h3>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Time to Payoff</th>
                    <th>Total Interest</th>
                    <th>Total Amount Paid</th>
                </tr>
            </thead>
            <tbody>
    `;

    const datasets = appState.loans.map((loan, index) => {
        let balance = loan.amount - deposit;
        const startingPrincipal = balance > 0 ? balance : 0;
        if (balance < 0) balance = 0; 
        
        const dataPoints = [balance];
        let months = 0;
        let totalInterest = 0; 

        const isInfinite = balance > 0 && payment <= (balance * monthlyRate);

        if (balance > 0 && !isInfinite) {
            while (balance > 0 && months < 600) { 
                const interestThisMonth = balance * monthlyRate;
                totalInterest += interestThisMonth; 
                
                balance += interestThisMonth; 
                balance -= payment;                 
                if (balance < 0) balance = 0;       
                
                dataPoints.push(balance);
                months++;
            }
            
            summaryHTML += `
                <tr>
                    <td><strong>Loan ${index + 1} (${formatCurrency(loan.amount)})</strong></td>
                    <td>${(months / 12).toFixed(1)} years</td>
                    <td>${formatCurrency(totalInterest)}</td>
                    <td><strong>${formatCurrency(startingPrincipal + totalInterest)}</strong></td>
                </tr>`;

        } else if (isInfinite) {
            for(let i = 0; i < 120; i++) {
                balance += (balance * monthlyRate) - payment;
                dataPoints.push(balance);
            }
            months = 120; 
            
            summaryHTML += `
                <tr>
                    <td><strong>Loan ${index + 1} (${formatCurrency(loan.amount)})</strong></td>
                    <td colspan="3" class="danger-text">Monthly payment is too low to cover interest. Loan will never be paid off.</td>
                </tr>`;
        } else {
            summaryHTML += `
                <tr>
                    <td><strong>Loan ${index + 1} (${formatCurrency(loan.amount)})</strong></td>
                    <td>0 years</td>
                    <td>${formatCurrency(0)}</td>
                    <td><strong>${formatCurrency(0)}</strong> (Covered by deposit)</td>
                </tr>`;
        }
        
        if (months > maxMonths) maxMonths = months;

        return {
            label: `Loan ${index + 1} (${formatCurrency(loan.amount)})`,
            data: dataPoints,
            borderWidth: 2,
            pointRadius: 0, 
            tension: 0.1    
        };
    });

    summaryHTML += `</tbody></table>`;
    document.getElementById('summary-panel').innerHTML = summaryHTML;

    const labels = [];
    for (let i = 0; i <= maxMonths; i++) {
        labels.push((i / 12).toFixed(1)); 
    }

    if (chartInstance) {
        chartInstance.destroy(); 
    }

    const ctx = document.getElementById('loanChart');
    if (ctx) {
        chartInstance = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        title: { display: true, text: 'Time (Years)', font: { weight: 'bold' } },
                        ticks: { maxTicksLimit: 15 }
                    },
                    y: {
                        title: { display: true, text: 'Remaining Balance (' + appState.settings.currency + ')', font: { weight: 'bold' } },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Wire up loan button
document.addEventListener('DOMContentLoaded', function() {
    const addBtn = document.getElementById('add-loan-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addLoan);
    }
});

// ============================================
// EXPENSES MANAGER SECTION
// ============================================
function addIncomeSource() {
    const source = document.getElementById('income-source');
    const amount = document.getElementById('income-amount');
    
    if (!validateInput(source.value, 'source') || !validateInput(amount.value, 'amount')) {
        alert('Please fill in both source name and amount (non-negative, non-empty).');
        return;
    }
    
    const newId = appState.expenses.income.length > 0 
        ? Math.max(...appState.expenses.income.map(i => i.id)) + 1 
        : 1;
    
    appState.expenses.income.push({
        id: newId,
        source: source.value,
        amount: Number(amount.value)
    });
    
    source.value = '';
    amount.value = '';
    
    renderExpenses();
    updateExpensesSummary();
}

function removeIncomeSource(id) {
    appState.expenses.income = appState.expenses.income.filter(i => i.id !== id);
    renderExpenses();
    updateExpensesSummary();
}

function addExpense() {
    const label = document.getElementById('expense-label');
    const amount = document.getElementById('expense-amount');
    
    if (!validateInput(label.value, 'label') || !validateInput(amount.value, 'amount')) {
        alert('Please fill in both expense label and amount (non-negative, non-empty).');
        return;
    }
    
    const newId = appState.expenses.expenses.length > 0 
        ? Math.max(...appState.expenses.expenses.map(e => e.id)) + 1 
        : 1;
    
    appState.expenses.expenses.push({
        id: newId,
        label: label.value,
        amount: Number(amount.value)
    });
    
    label.value = '';
    amount.value = '';
    
    renderExpenses();
    updateExpensesSummary();
}

function removeExpense(id) {
    appState.expenses.expenses = appState.expenses.expenses.filter(e => e.id !== id);
    renderExpenses();
    updateExpensesSummary();
}

function renderExpenses() {
    // Render Income
    const incomeListEl = document.getElementById('income-list');
    incomeListEl.innerHTML = '';
    appState.expenses.income.forEach(income => {
        const div = document.createElement('div');
        div.className = 'income-item';
        div.innerHTML = `
            <label>${income.source}
                <span style="font-weight: normal;">${formatCurrency(income.amount)}</span>
            </label>
            <button class="remove-btn" onclick="removeIncomeSource(${income.id})">Remove</button>
        `;
        incomeListEl.appendChild(div);
    });
    
    // Render Expenses
    const expenseListEl = document.getElementById('expense-list');
    expenseListEl.innerHTML = '';
    appState.expenses.expenses.forEach(expense => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.innerHTML = `
            <label>${expense.label}
                <span style="font-weight: normal;">${formatCurrency(expense.amount)}</span>
            </label>
            <button class="remove-btn" onclick="removeExpense(${expense.id})">Remove</button>
        `;
        expenseListEl.appendChild(div);
    });
}

function updateExpensesSummary() {
    const totalIncome = appState.expenses.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = appState.expenses.expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalIncome - totalExpenses;
    
    const summaryPanel = document.getElementById('expenses-summary-panel');
    summaryPanel.innerHTML = `
        <h3>Summary</h3>
        <div class="summary-stats">
            <div class="stat-box">
                <div class="stat-label">Total Income</div>
                <div class="stat-value">${formatCurrency(totalIncome)}</div>
            </div>
            <div class="stat-box" style="border-color: #dc3545;">
                <div class="stat-label">Total Expenses</div>
                <div class="stat-value" style="color: #dc3545;">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="stat-box" style="border-color: ${netIncome >= 0 ? '#28a745' : '#dc3545'};">
                <div class="stat-label">Net Income</div>
                <div class="stat-value" style="color: ${netIncome >= 0 ? '#28a745' : '#dc3545'};">${formatCurrency(netIncome)}</div>
            </div>
        </div>
    `;
}

// ============================================
// INPUT VALIDATION
// ============================================
function validateInput(value, type) {
    if (type === 'source' || type === 'label') {
        // Non-empty string
        return value.trim().length > 0;
    }
    if (type === 'amount' || type === 'deposit' || type === 'payment') {
        // Non-negative number
        const num = Number(value);
        return !isNaN(num) && num >= 0 && value.trim() !== '';
    }
    if (type === 'interest') {
        // Non-negative number (percent)
        const num = Number(value);
        return !isNaN(num) && num >= 0 && value.trim() !== '';
    }
    return true;
}

// ============================================
// IMPORT/EXPORT
// ============================================
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "app_state.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Check if it's legacy format (has loans but no expenses)
            if (importedData.loans && !importedData.expenses) {
                // Migrate from old format
                appState.loans = importedData.loans;
                appState.settings = importedData.settings || appState.settings;
            } else {
                // New unified format
                appState = importedData;
            }
            
            // Update UI inputs
            wireUpLoanInputs();
            
            // Re-render all
            renderLoans();
            renderExpenses();
            updateExpensesSummary();
            
            // Switch to loans section after import
            switchSection('loans-compare');
            
            alert('Data imported successfully!');
        } catch (err) {
            alert("Error parsing JSON file. Please ensure it is a valid format.");
            console.error(err);
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================
// PAGE LOAD
// ============================================
document.addEventListener('DOMContentLoaded', initializeApp);
