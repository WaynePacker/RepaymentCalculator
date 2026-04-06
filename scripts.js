// ============================================
// UNIFIED APP STATE
// ============================================
let appState = {
  loans: [
    { id: 1, amount: 30000 },
    { id: 2, amount: 45000 },
  ],
  expenses: {
    income: [{ id: 1, source: "Salary", amount: 5000 }],
    expenses: [{ id: 1, label: "Rent", amount: 1500 }],
  },
  savings: [
    {
      id: 1,
      name: "Vacation",
      goalAmount: 5000,
      contributionAmount: 200,
      frequency: "monthly",
      interest: 2,
      interestType: "yearly",
    },
  ],
  settings: {
    deposit: 2000,
    interest: 7.5,
    payment: 800,
    currency: "USD",
  },
};

let currentSection = "loans-compare";
let chartInstance = null;

// ============================================
// INITIALIZATION
// ============================================
function initializeApp() {
  // Detect user's locale currency
  const userCurrency = new Intl.DateTimeFormat(navigator.language, {
    style: "currency",
    currency: "USD",
  }).resolvedOptions().currency;
  appState.settings.currency = userCurrency || "USD";

  // Set currency selector
  const currencySelect = document.getElementById("currency-select");
  if (currencySelect && appState.settings.currency) {
    currencySelect.value = appState.settings.currency;
  }

  // Wire up loan inputs to app state
  wireUpLoanInputs();

  // Initialize all sections
  renderLoans();
  renderExpenses();
  renderSavingsGoals();

  // Load default section
  switchSection("loans-compare");
}

// ============================================
// CURRENCY UTILITIES
// ============================================
function changeCurrency(currency) {
  appState.settings.currency = currency;
  renderLoans();
  renderExpenses();
  renderSavingsGoals();
  calculateAndDrawChart();
  calculateAndDrawSavingsChart();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: appState.settings.currency,
  }).format(amount);
}

// ============================================
// NAVIGATION & SECTION SWITCHING
// ============================================
function switchSection(section) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((el) => {
    el.classList.remove("active");
  });

  // Show selected section
  const selectedSection = document.getElementById(section);
  if (selectedSection) {
    selectedSection.classList.add("active");
  }

  // Update nav items - remove active class from all
  document.querySelectorAll(".nav-link-btn").forEach((el) => {
    el.classList.remove("active");
  });

  // Add active class to the clicked button
  const activeButton = document.querySelector(`[data-section="${section}"]`);
  if (activeButton) {
    activeButton.classList.add("active");
  }

  // Close mobile nav if open
  if (window.innerWidth < 768) {
    toggleMobileNav();
  }

  // Update page title for better SEO and accessibility
  updatePageTitle(section);

  // Track with gtag
  gtag("event", "view_section", {
    section_name: section,
  });

  currentSection = section;

  // Render section-specific content
  if (section === "loans-compare") {
    calculateAndDrawChart();
  } else if (section === "expenses-manager") {
    updateExpensesSummary();
  } else if (section === "savings-planner") {
    calculateAndDrawSavingsChart();
  }
}

function updatePageTitle(section) {
  const sectionTitles = {
    "loans-compare": "Loans Compare - Financial Manager",
    "expenses-manager": "Expenses Manager - Financial Manager",
    "savings-planner": "Savings Planner - Financial Manager",
  };
  document.title = sectionTitles[section] || "Financial Manager";
}

function toggleMobileNav() {
  const nav = document.getElementById("left-nav");
  const overlay = document.getElementById("nav-overlay");

  nav.classList.toggle("active");
  overlay.classList.toggle("active");
}

// ============================================
// LOANS COMPARE SECTION
// ============================================
function wireUpLoanInputs() {
  // Update app state when inputs change
  ["deposit", "interest", "payment"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.value = appState.settings[id];
      input.addEventListener("input", (e) => {
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
  const loanListEl = document.getElementById("loan-list");
  if (!loanListEl) return;

  loanListEl.innerHTML = "";
  appState.loans.forEach((loan, index) => {
    const div = document.createElement("div");
    div.className = "input-group mb-3";
    div.innerHTML = ` 
    
            <span class="input-group-text">Loan ${index + 1} Amount</span>
            <input type="number" class="form-control" value="${loan.amount}" 
                   oninput="updateLoanAmount(${loan.id}, this.value)">
            <button class="remove-btn" onclick="removeLoan(${loan.id})"><i class="fas fa-trash"></i> Remove</button>
   
        `;
    loanListEl.appendChild(div);
  });
}

function updateLoanAmount(id, value) {
  if (!validateInput(value, "amount")) {
    alert("Amount cannot be negative or empty.");
    renderLoans();
    return;
  }

  const loan = appState.loans.find((l) => l.id === id);
  if (loan) {
    loan.amount = Number(value);
    calculateAndDrawChart();
  }
}

function addLoan() {
  const newId =
    appState.loans.length > 0
      ? Math.max(...appState.loans.map((l) => l.id)) + 1
      : 1;
  appState.loans.push({ id: newId, amount: 50000 });
  renderLoans();
  calculateAndDrawChart();
}

function removeLoan(id) {
  appState.loans = appState.loans.filter((l) => l.id !== id);
  renderLoans();
  calculateAndDrawChart();
}

function calculateAndDrawChart() {
  if (currentSection !== "loans-compare") return;

  const deposit = appState.settings.deposit;
  const annualRate = appState.settings.interest;
  const monthlyRate = annualRate / 100 / 12;
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

    const isInfinite = balance > 0 && payment <= balance * monthlyRate;

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
      for (let i = 0; i < 120; i++) {
        balance += balance * monthlyRate - payment;
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
      tension: 0.1,
    };
  });

  summaryHTML += `</tbody></table>`;
  document.getElementById("summary-panel").innerHTML = summaryHTML;

  const labels = [];
  for (let i = 0; i <= maxMonths; i++) {
    labels.push((i / 12).toFixed(1));
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById("loanChart");
  if (ctx) {
    chartInstance = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            title: {
              display: true,
              text: "Time (Years)",
              font: { weight: "bold" },
            },
            ticks: { maxTicksLimit: 15 },
          },
          y: {
            title: {
              display: true,
              text: "Remaining Balance (" + appState.settings.currency + ")",
              font: { weight: "bold" },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

// Wire up loan button
document.addEventListener("DOMContentLoaded", function () {
  const addBtn = document.getElementById("add-loan-btn");
  if (addBtn) {
    addBtn.addEventListener("click", addLoan);
  }
});

// ============================================
// EXPENSES MANAGER SECTION
// ============================================
function addIncomeSource() {
  const source = document.getElementById("income-source");
  const amount = document.getElementById("income-amount");

  if (
    !validateInput(source.value, "source") ||
    !validateInput(amount.value, "amount")
  ) {
    alert(
      "Please fill in both source name and amount (non-negative, non-empty).",
    );
    return;
  }

  const newId =
    appState.expenses.income.length > 0
      ? Math.max(...appState.expenses.income.map((i) => i.id)) + 1
      : 1;

  appState.expenses.income.push({
    id: newId,
    source: source.value,
    amount: Number(amount.value),
  });

  source.value = "";
  amount.value = "";

  renderExpenses();
  updateExpensesSummary();
}

function removeIncomeSource(id) {
  appState.expenses.income = appState.expenses.income.filter(
    (i) => i.id !== id,
  );
  renderExpenses();
  updateExpensesSummary();
}

function addExpense() {
  const label = document.getElementById("expense-label");
  const amount = document.getElementById("expense-amount");

  if (
    !validateInput(label.value, "label") ||
    !validateInput(amount.value, "amount")
  ) {
    alert(
      "Please fill in both expense label and amount (non-negative, non-empty).",
    );
    return;
  }

  const newId =
    appState.expenses.expenses.length > 0
      ? Math.max(...appState.expenses.expenses.map((e) => e.id)) + 1
      : 1;

  appState.expenses.expenses.push({
    id: newId,
    label: label.value,
    amount: Number(amount.value),
  });

  label.value = "";
  amount.value = "";

  renderExpenses();
  updateExpensesSummary();
}

function removeExpense(id) {
  appState.expenses.expenses = appState.expenses.expenses.filter(
    (e) => e.id !== id,
  );
  renderExpenses();
  updateExpensesSummary();
}

function renderExpenses() {
  // Render Income
  const incomeListEl = document.getElementById("income-list");
  incomeListEl.innerHTML = "";
  appState.expenses.income.forEach((income) => {
    const div = document.createElement("div");
    div.className = "income-item";
    div.innerHTML = `
            <label>${income.source}
                <span style="font-weight: normal;">${formatCurrency(income.amount)}</span>
            </label>
            <button class="remove-btn" onclick="removeIncomeSource(${income.id})"><i class="fas fa-trash"></i> Remove</button>
        `;
    incomeListEl.appendChild(div);
  });

  // Render Expenses
  const expenseListEl = document.getElementById("expense-list");
  expenseListEl.innerHTML = "";
  appState.expenses.expenses.forEach((expense) => {
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `
            <label>${expense.label}
                <span style="font-weight: normal;">${formatCurrency(expense.amount)}</span>
            </label>
            <button class="remove-btn" onclick="removeExpense(${expense.id})"><i class="fas fa-trash"></i> Remove</button>
        `;
    expenseListEl.appendChild(div);
  });
}

function updateExpensesSummary() {
  const totalIncome = appState.expenses.income.reduce(
    (sum, i) => sum + i.amount,
    0,
  );
  const totalExpenses = appState.expenses.expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const netIncome = totalIncome - totalExpenses;

  const summaryPanel = document.getElementById("expenses-summary-panel");
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
            <div class="stat-box" style="border-color: ${netIncome >= 0 ? "#28a745" : "#dc3545"};">
                <div class="stat-label">Net Income</div>
                <div class="stat-value" style="color: ${netIncome >= 0 ? "#28a745" : "#dc3545"};">${formatCurrency(netIncome)}</div>
            </div>
        </div>
    `;
}

// ============================================
// SAVINGS PLANNER SECTION
// ============================================
function addSavingsGoal() {
  const name = document.getElementById("goal-name");
  const goalAmount = document.getElementById("goal-amount");
  const contributionAmount = document.getElementById("contribution-amount");
  const frequency = document.getElementById("contribution-frequency");
  const interest = document.getElementById("savings-interest");
  const interestType = document.getElementById("interest-type");

  if (
    !validateInput(name.value, "label") ||
    !validateInput(goalAmount.value, "amount") ||
    !validateInput(contributionAmount.value, "amount")
  ) {
    alert(
      "Please fill in goal name, goal amount, and contribution amount (all non-negative, non-empty).",
    );
    return;
  }

  const newId =
    appState.savings.length > 0
      ? Math.max(...appState.savings.map((s) => s.id)) + 1
      : 1;

  appState.savings.push({
    id: newId,
    name: name.value,
    goalAmount: Number(goalAmount.value),
    contributionAmount: Number(contributionAmount.value),
    frequency: frequency.value,
    interest: Number(interest.value) || 0,
    interestType: interestType.value,
  });

  name.value = "";
  goalAmount.value = "";
  contributionAmount.value = "";
  interest.value = "";

  renderSavingsGoals();
  calculateAndDrawSavingsChart();
}

function removeSavingsGoal(id) {
  appState.savings = appState.savings.filter((s) => s.id !== id);
  renderSavingsGoals();
  calculateAndDrawSavingsChart();
}

function updateSavingsGoal(id, field, value) {
  const goal = appState.savings.find((g) => g.id === id);
  if (!goal) return;

  // Convert to appropriate type
  if (field === "name") {
    goal.name = value;
  } else if (
    field === "goalAmount" ||
    field === "contributionAmount" ||
    field === "interest"
  ) {
    const numValue = parseFloat(value) || 0;
    if (numValue < 0) return; // Prevent negative values
    goal[field] = numValue;
  } else if (field === "frequency" || field === "interestType") {
    goal[field] = value;
  }

  // Trigger recalculation and re-render
  calculateAndDrawSavingsChart();
}

function renderSavingsGoals() {
  const goalsListEl = document.getElementById("savings-goal-list");
  if (!goalsListEl) return;

  goalsListEl.innerHTML = "";
  appState.savings.forEach((goal) => {
    const div = document.createElement("div");
    div.className = "savings-goal-item";
    div.innerHTML = `
            <div class="row g-3 mb-2" style="flex: 1;">
                <div class="col-md-4">
                    <label for="goal-name-${goal.id}" class="form-label fw-semibold">Goal Name</label>
                    <input type="text" id="goal-name-${goal.id}" class="form-control" value="${goal.name}" onchange="updateSavingsGoal(${goal.id}, 'name', this.value)">
                </div>
                <div class="col-md-4">
                    <label for="goal-amount-${goal.id}" class="form-label fw-semibold">Goal Amount</label>
                    <input type="number" id="goal-amount-${goal.id}" class="form-control" value="${goal.goalAmount}" onchange="updateSavingsGoal(${goal.id}, 'goalAmount', this.value)">
                </div>
                <div class="col-md-4">
                    <label for="contrib-amount-${goal.id}" class="form-label fw-semibold">Contribution Amount</label>
                    <input type="number" id="contrib-amount-${goal.id}" class="form-control" value="${goal.contributionAmount}" onchange="updateSavingsGoal(${goal.id}, 'contributionAmount', this.value)">
                </div>
                <div class="col-md-3">
                    <label for="freq-${goal.id}" class="form-label fw-semibold">Frequency</label>
                    <select id="freq-${goal.id}" class="form-select" onchange="updateSavingsGoal(${goal.id}, 'frequency', this.value)">
                        <option value="weekly" ${goal.frequency === "weekly" ? "selected" : ""}>Weekly</option>
                        <option value="monthly" ${goal.frequency === "monthly" ? "selected" : ""}>Monthly</option>
                        <option value="yearly" ${goal.frequency === "yearly" ? "selected" : ""}>Yearly</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="interest-${goal.id}" class="form-label fw-semibold">Interest Rate (%)</label>
                    <input type="number" id="interest-${goal.id}" class="form-control" value="${goal.interest}" onchange="updateSavingsGoal(${goal.id}, 'interest', this.value)" min="0" max="100" step="0.1">
                </div>
                <div class="col-md-3">
                    <label for="interest-type-${goal.id}" class="form-label fw-semibold">Compounding</label>
                    <select id="interest-type-${goal.id}" class="form-select" onchange="updateSavingsGoal(${goal.id}, 'interestType', this.value)">
                        <option value="monthly" ${goal.interestType === "monthly" ? "selected" : ""}>Monthly</option>
                        <option value="yearly" ${goal.interestType === "yearly" ? "selected" : ""}>Yearly</option>
                    </select>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button class="remove-btn w-100" onclick="removeSavingsGoal(${goal.id})"><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
        `;
    goalsListEl.appendChild(div);
  });
}

function calculateAndDrawSavingsChart() {
  if (currentSection !== "savings-planner") return;

  if (appState.savings.length === 0) {
    document.getElementById("savings-summary-panel").innerHTML =
      '<p style="color: #999; font-style: italic;">Add a savings goal to see projections</p>';
    return;
  }

  let maxMonths = 0;
  let summaryHTML = `
        <h3>Savings Projection Summary</h3>
        <table>
            <thead>
                <tr>
                    <th>Goal</th>
                    <th>Time to Goal</th>
                    <th>Total Contributed</th>
                    <th>Total Interest Earned</th>
                    <th>Final Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

  const datasets = appState.savings.map((goal, index) => {
    // Convert contribution frequency to monthly
    let monthlyContribution = 0;
    if (goal.frequency === "weekly") {
      monthlyContribution = (goal.contributionAmount * 52) / 12;
    } else if (goal.frequency === "monthly") {
      monthlyContribution = goal.contributionAmount;
    } else if (goal.frequency === "yearly") {
      monthlyContribution = goal.contributionAmount / 12;
    }

    // Convert interest rate
    let monthlyRate = 0;
    if (goal.interest > 0) {
      if (goal.interestType === "yearly") {
        monthlyRate = goal.interest / 100 / 12;
      } else if (goal.interestType === "monthly") {
        monthlyRate = goal.interest / 100;
      }
    }

    let balance = 0;
    const dataPoints = [balance];
    let months = 0;
    let totalInterestEarned = 0;
    let totalContributed = 0;

    // Calculate until goal is reached (max 1000 months = ~83 years)
    while (balance < goal.goalAmount && months < 1000) {
      // Add contribution
      balance += monthlyContribution;
      totalContributed += monthlyContribution;

      // Add interest on current balance
      const interestThisMonth = balance * monthlyRate;
      balance += interestThisMonth;
      totalInterestEarned += interestThisMonth;

      dataPoints.push(balance);
      months++;
    }

    if (months > maxMonths) maxMonths = months;

    const yearsToGoal = (months / 12).toFixed(1);

    summaryHTML += `
            <tr>
                <td><strong>${goal.name}</strong></td>
                <td>${yearsToGoal} years (${months} months)</td>
                <td>${formatCurrency(totalContributed)}</td>
                <td>${formatCurrency(totalInterestEarned)}</td>
                <td><strong>${formatCurrency(balance)}</strong></td>
            </tr>
        `;

    return {
      label: `${goal.name} (Goal: ${formatCurrency(goal.goalAmount)})`,
      data: dataPoints,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1,
      fill: false,
    };
  });

  summaryHTML += `</tbody></table>`;
  document.getElementById("savings-summary-panel").innerHTML = summaryHTML;

  // Generate labels in years
  const labels = [];
  for (let i = 0; i <= maxMonths; i++) {
    labels.push((i / 12).toFixed(1));
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById("savingsChart");
  if (ctx) {
    chartInstance = new Chart(ctx.getContext("2d"), {
      type: "line",
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            title: {
              display: true,
              text: "Time (Years)",
              font: { weight: "bold" },
            },
            ticks: { maxTicksLimit: 15 },
          },
          y: {
            title: {
              display: true,
              text: "Savings Balance (" + appState.settings.currency + ")",
              font: { weight: "bold" },
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

// ============================================
// INPUT VALIDATION
// ============================================
function validateInput(value, type) {
  if (type === "source" || type === "label") {
    // Non-empty string
    return value.trim().length > 0;
  }
  if (type === "amount" || type === "deposit" || type === "payment") {
    // Non-negative number
    const num = Number(value);
    return !isNaN(num) && num >= 0 && value.trim() !== "";
  }
  if (type === "interest") {
    // Non-negative number (percent)
    const num = Number(value);
    return !isNaN(num) && num >= 0 && value.trim() !== "";
  }
  return true;
}

// ============================================
// IMPORT/EXPORT
// ============================================
function exportData() {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(appState, null, 2));
  const downloadAnchorNode = document.createElement("a");
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
  reader.onload = function (e) {
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
      renderSavingsGoals();
      updateExpensesSummary();

      // Switch to loans section after import
      switchSection("loans-compare");

      alert("Data imported successfully!");
    } catch (err) {
      alert("Error parsing JSON file. Please ensure it is a valid format.");
      console.error(err);
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}

// ============================================
// PAGE LOAD
// ============================================
document.addEventListener("DOMContentLoaded", initializeApp);
