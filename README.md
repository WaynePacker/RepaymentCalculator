# Financial Manager - Free Online Financial Calculator

A comprehensive, feature-rich web application for personal financial planning and analysis. Compare loans, track expenses, and plan savings goals with interactive charts and detailed financial projections. Built with pure HTML, CSS, and JavaScript—no frameworks or build tools required.

## Overview

Financial Manager is a complete financial planning toolkit that helps you make informed financial decisions through visual analysis and detailed calculations. Whether you're comparing loan options, budgeting your income and expenses, or planning for long-term savings goals, this tool provides the insights you need.

## 🎯 Key Features

### 1. **Loans Compare**
- **Multiple Loan Scenarios:** Compare multiple loan amounts side-by-side
- **Custom Calculation Parameters:** Set deposit amount, annual interest rate, and monthly payment
- **Real-Time Visualization:** Interactive line chart showing remaining balance over time
- **Detailed Summary:** View time to payoff, total interest paid, and total out-of-pocket costs for each loan
- **Infinite Debt Detection:** Alerts you when monthly payments are insufficient to cover interest

### 2. **Expenses Manager**
- **Income Tracking:** Add multiple income sources (salary, freelance, investments, etc.)
- **Expense Categorization:** Organize various expense categories
- **Financial Overview:** Get a clear picture of total income, total expenses, and net income
- **Visual Summary:** Color-coded stats box showing income (green), expenses (red), and net income
- **Easy Management:** Add, remove, and track multiple income streams and expenses

### 3. **Savings Planner**
- **Goal Tracking:** Create and manage multiple savings goals
- **Flexible Contributions:** Set fixed contribution amounts with various frequencies (weekly, monthly, yearly)
- **Compound Interest:** Calculate growth with optional interest rates (monthly or yearly compounding)
- **Savings Projection:** View automatic calculations for how long it takes to reach your goals
- **Growth Visualization:** Interactive line charts showing savings growth trajectory
- **Detailed Projections:** See time to goal, total contributed, interest earned, and final balance

## 🌍 Additional Features

- **Multi-Currency Support:** Switch between 10+ currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, MXN)
- **Auto-Locale Detection:** Automatically detects your local currency on first visit
- **Data Persistence:** Export entire app state as JSON and import previously saved scenarios
- **Responsive Design:** Fully optimized for desktop, tablet, and mobile devices
- **Mobile Navigation:** Hamburger menu for seamless navigation on mobile
- **Analytics Integration:** Built-in Google Analytics tracking for section usage
- **Fast & Lightweight:** No external dependencies (except Chart.js for visualization)
- **Accessibility:** Keyboard navigation, semantic HTML, proper ARIA labels

## 🛠️ Technologies & Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Visualization:** [Chart.js](https://www.chartjs.org/) for interactive charts
- **Analytics:** Google Analytics (gtag.js)
- **No Frameworks:** Pure vanilla JavaScript—fast, lightweight, no build step required
- **No Backend:** Entirely client-side; your data stays on your device

## 📊 Use Cases

- **Loan Shopping:** Compare different loan amounts to understand the total cost impact
- **Debt Payoff Planning:** Calculate exact timelines for paying off debts
- **Budget Management:** Track income and expenses to understand cash flow
- **Savings Goal Planning:** Determine how long to reach savings targets with regular contributions
- **Financial Analysis:** Export data for further analysis or record-keeping
- **What-If Scenarios:** Test different financial parameters to see impacts

## 🚀 Getting Started

### Installation
No installation required! This is a zero-dependency web application.

1. Clone or download this repository
2. Open `index.html` directly in any modern browser
3. Start calculating immediately!

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📖 How to Use Each Feature

### Loans Compare
1. Set your **Deposit Amount** (down payment)
2. Enter the **Annual Interest Rate** (%)
3. Set your desired **Monthly Payment**
4. Add multiple **Loan Scenarios** to compare
5. Review the chart showing balance over time
6. Check the summary table for exact figures

### Expenses Manager
1. Add **Income Sources** with amounts
2. Add **Expenses** with categories and amounts
3. View your **Financial Summary** with:
   - Total Income (green)
   - Total Expenses (red)
   - Net Income (conditional green/red)

### Savings Planner
1. Create a **Savings Goal** with:
   - Goal name (e.g., "Emergency Fund")
   - Goal amount ($5,000)
   - Contribution amount ($200)
   - Frequency (weekly/monthly/yearly)
   - Optional interest rate with compounding type
2. View the **Projection Chart** showing savings growth
3. Check the **Summary Table** for:
   - Time to reach goal
   - Total contributions
   - Interest earned
   - Final amount

## 🧮 Calculation Methods

### Loan Repayment Formula
```
Monthly Interest = Current Balance × (Annual Rate / 100 / 12)
New Balance = Current Balance + Monthly Interest - Monthly Payment
```
Calculation continues until balance reaches zero or 600 months (50 years) is reached.

### Savings Growth Calculation
```
Monthly Contribution = Contribution Amount × (Frequency Conversion)
Monthly Interest Rate = Annual Rate / 100 / 12 (if yearly) or Annual Rate / 100 (if monthly)
Balance += Monthly Contribution
Balance += Balance × Monthly Interest Rate
```
Calculation continues until goal amount is reached or 1000 months (83 years) is reached.

## 💾 Export & Import

### Exporting Data
- Click **Export JSON** to download your complete app state
- File includes all loans, expenses, savings goals, and settings
- Useful for backup or sharing scenarios

### Importing Data
- Click **Import JSON** to load a previously saved file
- Supports both legacy format (loans only) and new unified format
- Automatically migrates old data formats

## 🔒 Privacy & Security

- **100% Client-Side:** No server uploads; your data never leaves your device
- **Local Storage:** Use browser's localStorage to persist data (optional with manual import/export)
- **Offline Capable:** Works offline after initial load
- **No Third-Party Data Collection:** Only Google Analytics for usage metrics

## 🎨 Responsive Design

- **Desktop:** Full two-column layout with fixed sidebar navigation
- **Tablet:** Adaptive layout with touch-friendly buttons
- **Mobile:** Single-column layout with hamburger menu navigation
- **All Charts:** Fully responsive and touch-enabled

## 🐛 Known Limitations

- Maximum 600 months (50 years) for loan calculations
- Maximum 1000 months (83 years) for savings calculations
- JavaScript must be enabled in your browser
- Data stored via export/import is JSON format (easily editable)

## 📄 License

This project is open source and available for personal and educational use.

## 🤝 Contributing

Found a bug or have a feature request? Feel free to open an issue or submit a pull request.

## 🙋 Support

For questions, feedback, or issues:
1. Check this README for answers
2. Verify your browser is up-to-date
3. Try clearing your browser cache and reloading
4. Review the exported JSON for data validation

---

**Start managing your finances today with Financial Manager!** 📈💰🎯