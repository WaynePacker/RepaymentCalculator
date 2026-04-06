# Loan Repayment Visualizer

A lightweight, interactive web application built with plain HTML, CSS, and vanilla JavaScript to visualize and compare multiple loan repayment scenarios. 

This tool helps users understand the true cost of a loan by graphing the repayment timeline and calculating the total interest paid based on their deposit, interest rate, and monthly payments.

## 🚀 Features

* **Dynamic Loan Scenarios:** Add or remove multiple loan amounts to compare them side-by-side.
* **Live Visualizations:** Uses [Chart.js](https://www.chartjs.org/) to instantly draw a multi-line graph of the remaining balance over time. The chart updates automatically as you type.
* **Financial Summary Table:** Automatically calculates and displays:
  * Time to payoff (in years)
  * Total interest paid to the bank
  * Total out-of-pocket amount paid (Principal + Interest)
* **Infinite Debt Protection:** Detects if the monthly payment is too low to cover the monthly interest and warns the user instead of freezing the browser.
* **Save & Load:** Export your current global settings and loan scenarios as a `.json` file, and import them later to pick up exactly where you left off.

## 🛠️ Technologies Used

* **HTML5 & CSS3:** For structure and responsive styling.
* **Vanilla JavaScript:** For DOM manipulation, state management, and amortization math. No frontend frameworks (React, Vue, etc.) are required.
* **Chart.js:** Pulled in via CDN for rendering the responsive line chart.

## 📦 How to Run

Because this project uses plain HTML and vanilla JavaScript without any build tools or dependencies, installation is immediate:

1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (Chrome, Firefox, Safari, Edge).
3. *No server or build pipeline is required!*

## 💡 Usage

1. **Set Global Settings:** Enter your initial **Deposit Amount**, the **Annual Interest Rate**, and your intended **Monthly Payment**.
2. **Add Loans:** Add one or more **Loan Amounts** using the "+ Add New Loan Amount" button. 
3. **Compare:** Watch the chart populate automatically. Check the **Repayment Summary** table at the bottom to see the exact breakdown of interest and time for each loan.
4. **Export Data:** Click **Export JSON** at the top right to save your exact setup to your computer.
5. **Import Data:** Click **Import JSON** to load a previously saved `.json` scenario file.

## 🧮 How the Math Works

The application calculates the repayment schedule using a standard monthly amortization loop:
1. **Starting Balance:** `Loan Amount - Deposit`
2. **Monthly Interest:** `Current Balance * (Annual Interest Rate / 100 / 12)`
3. **New Balance:** `Current Balance + Monthly Interest - Monthly Payment`

The loop runs until the balance reaches `0`, tracking the total months and accumulating the total interest paid along the way.