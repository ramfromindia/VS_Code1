let currentUser = localStorage.getItem("currentUser") || null;

class Expense {
  constructor(id, description, amount, date, recurring = 'none') {
    this.id = id;
    this.description = description;
    this.amount = parseFloat(amount);
    this.date = new Date(date);
    this.recurring = recurring; // none, weekly, monthly
  }
}

class ExpenseManager {
  constructor(user) {
    this.user = user;
    this.expenseMap = new Map();
    this.income = 0;
    this.budgets = {};
    this.load();
  }

  addExpense(category, expense) {
    if (!this.expenseMap.has(category)) this.expenseMap.set(category, []);
    this.expenseMap.get(category).push(expense);
    this.handleRecurring(expense, category);
    this.save();
  }

  handleRecurring(expense, category) {
    if (expense.recurring === 'none') return;
    const interval = expense.recurring === 'weekly' ? 7 : 30;
    const nextDate = new Date(expense.date);
    nextDate.setDate(nextDate.getDate() + interval);
    if (nextDate <= new Date()) {
      const newExpense = new Expense(Date.now(), expense.description, expense.amount, nextDate, expense.recurring);
      this.expenseMap.get(category).push(newExpense);
      this.handleRecurring(newExpense, category); // Recursively add future instances
    }
  }

  deleteExpense(id) {
    for (const [cat, list] of this.expenseMap.entries()) {
      const idx = list.findIndex(e => e.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        if (list.length === 0) this.expenseMap.delete(cat);
        break;
      }
    }
    this.save();
  }

  editExpense(id, newData) {
    for (const expenses of this.expenseMap.values()) {
      const e = expenses.find(x => x.id === id);
      if (e) {
        e.description = newData.description;
        e.amount = parseFloat(newData.amount);
        e.date = new Date(newData.date);
        e.recurring = newData.recurring;
        break;
      }
    }
    this.save();
  }

  getAll() {
    const all = [];
    for (const [cat, arr] of this.expenseMap.entries()) {
      all.push(...arr.map(e => ({ ...e, category: cat })));
    }
    return all;
  }

  filterByDate(from, to) {
    const all = this.getAll();
    if (!from && !to) return all;
    return all.filter(e => {
      const d = new Date(e.date);
      return (!from || d >= new Date(from)) && (!to || d <= new Date(to));
    });
  }

  searchExpenses(query) {
    const all = this.getAll();
    if (!query) return all;
    const lowerQuery = query.toLowerCase();
    return all.filter(e => 
      e.description.toLowerCase().includes(lowerQuery) || 
      e.category.toLowerCase().includes(lowerQuery)
    );
  }

  getCategoryTotals(expenses) {
    const totals = {};
    for (const e of expenses) {
      if (!totals[e.category]) totals[e.category] = 0;
      totals[e.category] += e.amount;
    }
    return totals;
  }

  setIncome(amount) {
    this.income = parseFloat(amount);
    this.save();
  }

  setBudget(category, amount) {
    this.budgets[category] = parseFloat(amount) || 0;
    this.save();
  }

  getBudgetAlerts(totals) {
    const alerts = [];
    for (const [cat, amount] of Object.entries(totals)) {
      if (this.budgets[cat] && amount > this.budgets[cat]) {
        alerts.push(`Warning: ${cat} spending (₹${amount.toFixed(2)}) exceeds budget (₹${this.budgets[cat].toFixed(2)})!`);
      }
    }
    return alerts;
  }

  exportToCSV(currency, rate, symbol) {
    const expenses = this.getAll();
    const headers = ['Category', 'Description', 'Amount', 'Date', 'Recurring'];
    const rows = expenses.map(e => [
      e.category,
      e.description,
      `${symbol}${(e.amount * rate).toFixed(2)}`,
      new Date(e.date).toISOString().split('T')[0],
      e.recurring
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${this.user}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  save() {
    const obj = {};
    for (const [k, v] of this.expenseMap.entries()) obj[k] = v;
    localStorage.setItem(`expenses_${this.user}`, JSON.stringify(obj));
    localStorage.setItem(`income_${this.user}`, this.income);
    localStorage.setItem(`budgets_${this.user}`, JSON.stringify(this.budgets));
  }

  load() {
    const data = JSON.parse(localStorage.getItem(`expenses_${this.user}`) || '{}');
    for (const k in data) {
      this.expenseMap.set(k, data[k].map(e => new Expense(e.id, e.description, e.amount, e.date, e.recurring || 'none')));
    }
    this.income = parseFloat(localStorage.getItem(`income_${this.user}`) || 0);
    this.budgets = JSON.parse(localStorage.getItem(`budgets_${this.user}`) || '{}');
  }
}

let manager = null;
let chart = null;
const rates = { INR: 1, USD: 0.012, EUR: 0.011 };
const symbols = { INR: '₹', USD: '$', EUR: '€' };

function login() {
  const user = document.getElementById("username").value.trim();
  if (!user) return alert("Enter username");
  localStorage.setItem("currentUser", user);
  currentUser = user;
  manager = new ExpenseManager(currentUser);
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("trackerSection").style.display = "block";
  applySavedPrefs();
  renderExpenses();
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

function renderExpenses() {
  const cur = document.getElementById("currencySelect").value;
  const sym = symbols[cur];
  const rate = rates[cur];
  document.getElementById("currencySymbol1").textContent = sym;
  document.getElementById("currencySymbol2").textContent = sym;
  document.getElementById("currencySymbol3").textContent = sym;

  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const query = document.getElementById("searchInput").value;
  let data = manager.filterByDate(from, to);
  data = manager.searchExpenses(query);
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  let total = 0;
  data.forEach(e => {
    const amt = (e.amount * rate).toFixed(2);
    total += +amt;
    const div = document.createElement("div");
    div.className = "expense-item";
    div.innerHTML = `${e.category} - ${e.description} - ${sym}${amt} - ${new Date(e.date).toDateString()} - ${e.recurring} <span class='actions'><button onclick="editExpense('${e.id}')">Edit</button><button onclick="deleteExpense('${e.id}')">Delete</button></span>`;
    list.appendChild(div);
  });

  const income = (manager.income * rate).toFixed(2);
  document.getElementById("incomeAmount").textContent = income;
  document.getElementById("total").textContent = total.toFixed(2);
  document.getElementById("balance").textContent = (income - total).toFixed(2);

  const totals = manager.getCategoryTotals(data);
  const alerts = manager.getBudgetAlerts(totals);
  const alertDiv = document.getElementById("budgetAlerts");
  alertDiv.innerHTML = alerts.map(a => `<p class="alert">${a}</p>`).join('');

  const labels = Object.keys(totals);
  const values = labels.map(k => (totals[k] * rate).toFixed(2));

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("categoryChart"), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Category',
        data: values,
        backgroundColor: ['#ff6384','#36a2eb','#cc65fe','#ffce56','#4bc0c0']
      }]
    }
  });

  localStorage.setItem("pref_currency", cur);
  localStorage.setItem("pref_from", from);
  localStorage.setItem("pref_to", to);
}

function editExpense(id) {
  const e = manager.getAll().find(x => x.id == id);
  if (e) {
    document.getElementById("desc").value = e.description;
    document.getElementById("amount").value = e.amount;
    document.getElementById("date").value = new Date(e.date).toISOString().split('T')[0];
    document.getElementById("category").value = e.category;
    document.getElementById("recurring").value = e.recurring;
    manager.deleteExpense(id);
    renderExpenses();
  }
}

function deleteExpense(id) {
  manager.deleteExpense(id);
  renderExpenses();
}

document.getElementById("addBtn").addEventListener("click", () => {
  const desc = document.getElementById("desc").value;
  const amount = document.getElementById("amount").value;
  const date = document.getElementById("date").value;
  const category = document.getElementById("category").value;
  const recurring = document.getElementById("recurring").value;
  if (!desc || !amount || !date) return alert("Fill all fields");
  const exp = new Expense(Date.now(), desc, amount, date, recurring);
  manager.addExpense(category, exp);
  renderExpenses();
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").value = "";
});

function setIncome() {
  const income = document.getElementById("incomeInput").value;
  if (!income || income <= 0) return alert("Invalid income");
  manager.setIncome(income);
  renderExpenses();
}

function saveBudgets() {
  const categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Other'];
  categories.forEach(cat => {
    const value = document.getElementById(`budget_${cat}`).value;
    if (value) manager.setBudget(cat, value);
  });
  renderExpenses();
}

function exportExpenses() {
  const cur = document.getElementById("currencySelect").value;
  manager.exportToCSV(cur, rates[cur], symbols[cur]);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("pref_theme", isDark ? "dark" : "light");
}

function applySavedPrefs() {
  if (localStorage.getItem("pref_theme") === "dark") {
    document.body.classList.add("dark");
  }
  const currency = localStorage.getItem("pref_currency");
  if (currency) document.getElementById("currencySelect").value = currency;
  const from = localStorage.getItem("pref_from");
  const to = localStorage.getItem("pref_to");
  if (from) document.getElementById("fromDate").value = from;
  if (to) document.getElementById("toDate").value = to;
  const budgets = manager.budgets;
  for (const [cat, amount] of Object.entries(budgets)) {
    const input = document.getElementById(`budget_${cat}`);
    if (input) input.value = amount;
  }
}

if (currentUser) {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("trackerSection").style.display = "block";
  manager = new ExpenseManager(currentUser);
  applySavedPrefs();
  renderExpenses();
} else {
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("trackerSection").style.display = "none";
}