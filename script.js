const categoryConfig = {
  food: { name: "طعام", color: "#23658a", bg: "#e4f1f6", icon: "🍽" },
  transport: { name: "مواصلات", color: "#2ba9b8", bg: "#e1f4f5", icon: "🚌" },
  bills: { name: "فواتير", color: "#173b57", bg: "#e8eef2", icon: "▱" },
  shopping: { name: "تسوق", color: "#68a6d7", bg: "#edf4f9", icon: "◇" },
  health: { name: "صحة", color: "#5cbdad", bg: "#e7f5f1", icon: "＋" },
  entertainment: { name: "ترفيه", color: "#8fadd1", bg: "#edf3f7", icon: "★" }
};

const defaultTransactions = [
  { name: "سوبر ماركت العائلة", category: "food", amount: 850, date: "2026-11-01" },
  { name: "اشتراك الإنترنت", category: "bills", amount: 320, date: "2026-10-30" },
  { name: "التوصيلات", category: "transport", amount: 180, date: "2026-10-29" },
  { name: "صيدلية النهار", category: "health", amount: 240, date: "2026-10-28" },
  { name: "ملابس شتوية", category: "shopping", amount: 1200, date: "2026-10-27" }
];

const budgetLimits = {
  food: 2200,
  transport: 1500,
  bills: 1800,
  shopping: 1600
};

let transactions = JSON.parse(localStorage.getItem("mybudgetTransactions") || "null") || defaultTransactions;
let settings = JSON.parse(localStorage.getItem("mybudgetSettings") || "null") || { income: 12000, savings: 1500 };
let chart;

const formatMoney = (value) => `${Number(value).toLocaleString("ar-EG")} ج.م`;

function categoryTotals() {
  const totals = Object.keys(categoryConfig).reduce((result, key) => ({ ...result, [key]: 0 }), {});
  transactions.forEach((transaction) => {
    totals[transaction.category] = (totals[transaction.category] || 0) + Number(transaction.amount);
  });
  return totals;
}

function renderSummary() {
  const income = settings.income;
  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const savings = settings.savings;
  document.getElementById("availableBalance").textContent = formatMoney(income - total - savings);
  document.getElementById("totalIncome").textContent = formatMoney(income);
  document.getElementById("savingsAmount").textContent = formatMoney(savings);
  document.getElementById("totalExpenses").textContent = formatMoney(total);
  document.getElementById("expensePercent").textContent = `${((total / income) * 100).toFixed(1)}% من الدخل`;
  document.getElementById("chartTotal").textContent = formatMoney(total);
}

function renderChart() {
  const totals = categoryTotals();
  const activeCategories = Object.keys(categoryConfig).filter((key) => totals[key] > 0);
  const context = document.getElementById("categoryChart");

  if (chart) chart.destroy();
  chart = new Chart(context, {
    type: "doughnut",
    data: {
      labels: activeCategories.map((key) => categoryConfig[key].name),
      datasets: [{
        data: activeCategories.map((key) => totals[key]),
        backgroundColor: activeCategories.map((key) => categoryConfig[key].color),
        borderWidth: 5,
        borderColor: "#ffffff",
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: { label: (item) => ` ${formatMoney(item.raw)}` }
        }
      }
    }
  });

  const total = activeCategories.reduce((sum, key) => sum + totals[key], 0);
  document.getElementById("chartLegend").innerHTML = activeCategories.map((key) => `
    <div class="legend-row">
      <span class="legend-dot" style="background:${categoryConfig[key].color}"></span>
      <span>${categoryConfig[key].name}</span>
      <strong>${formatMoney(totals[key])}</strong>
    </div>
  `).join("");
}

function renderBudgets() {
  const totals = categoryTotals();
  document.getElementById("budgetList").innerHTML = Object.entries(budgetLimits).map(([key, limit]) => {
    const spent = totals[key] || 0;
    const percent = Math.min((spent / limit) * 100, 100);
    const color = percent >= 85 ? "#b9a66d" : categoryConfig[key].color;
    return `
      <div class="budget-item">
        <div class="budget-label">
          <strong>${categoryConfig[key].name}</strong>
          <small>${spent.toLocaleString("ar-EG")} / ${limit.toLocaleString("ar-EG")} ج.م</small>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${percent}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderTransactions() {
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById("transactionList").innerHTML = sorted.slice(0, 5).map((transaction) => {
    const config = categoryConfig[transaction.category];
    const date = new Date(`${transaction.date}T12:00:00`).toLocaleDateString("ar-EG", { month: "long", day: "numeric" });
    return `
      <div class="transaction-row">
        <div class="transaction-icon" style="color:${config.color};background:${config.bg}">${config.icon}</div>
        <div class="transaction-info">
          <strong>${escapeHtml(transaction.name)}</strong>
          <small>${config.name} • ${date}</small>
        </div>
        <div class="transaction-amount">-${formatMoney(transaction.amount)}</div>
      </div>
    `;
  }).join("");
}

function renderFullTransactions() {
  document.getElementById("allTransactions").innerHTML = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((transaction) => {
      const config = categoryConfig[transaction.category];
      return `
        <div class="transaction-row full">
          <div class="transaction-icon" style="color:${config.color};background:${config.bg}">${config.icon}</div>
          <div class="transaction-info"><strong>${escapeHtml(transaction.name)}</strong><small>${config.name} • ${transaction.date}</small></div>
          <div class="transaction-amount">-${formatMoney(transaction.amount)}</div>
        </div>
      `;
    }).join("");
}

function renderBudgetCards() {
  const totals = categoryTotals();
  document.getElementById("budgetCards").innerHTML = Object.entries(budgetLimits).map(([key, limit]) => {
    const spent = totals[key] || 0;
    const percent = Math.min(Math.round((spent / limit) * 100), 100);
    const config = categoryConfig[key];
    return `
      <article class="panel budget-card">
        <div class="budget-card-top"><span class="transaction-icon" style="color:${config.color};background:${config.bg}">${config.icon}</span><strong>${config.name}</strong></div>
        <b>${formatMoney(spent)}</b><small>من ميزانية ${formatMoney(limit)}</small>
        <div class="progress-track"><div class="progress-fill" style="width:${percent}%;background:${config.color}"></div></div>
        <p>${percent}% مستخدم</p>
      </article>
    `;
  }).join("");
}

function renderReports() {
  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const totals = categoryTotals();
  document.getElementById("reportExpenses").textContent = formatMoney(total);
  document.getElementById("reportAverage").textContent = formatMoney(transactions.length ? total / transactions.length : 0);
  document.getElementById("reportCount").textContent = transactions.length;
  document.getElementById("reportCategoryList").innerHTML = Object.keys(categoryConfig)
    .filter((key) => totals[key])
    .map((key) => `<div class="report-row"><span>${categoryConfig[key].name}</span><strong>${formatMoney(totals[key])}</strong></div>`)
    .join("");
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function renderAll() {
  renderSummary();
  renderChart();
  renderBudgets();
  renderTransactions();
  renderFullTransactions();
  renderBudgetCards();
  renderReports();
}

const modal = document.getElementById("expenseModal");
const dateInput = document.getElementById("expenseDate");
dateInput.value = new Date().toISOString().split("T")[0];

function openModal() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("expenseName").focus();
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.getElementById("openExpenseModal").addEventListener("click", openModal);
document.getElementById("closeExpenseModal").addEventListener("click", closeModal);
document.getElementById("cancelExpense").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.getElementById("expenseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  transactions.unshift({
    name: document.getElementById("expenseName").value.trim(),
    amount: Number(document.getElementById("expenseAmount").value),
    category: document.getElementById("expenseCategory").value,
    date: document.getElementById("expenseDate").value
  });
  localStorage.setItem("mybudgetTransactions", JSON.stringify(transactions));
  event.target.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  closeModal();
  renderAll();
});

document.querySelector(".menu-button").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector('[data-section="dashboard"]').click();
});
document.querySelector(".more-button").addEventListener("click", () => {
  document.querySelector('[data-section="settings"]').click();
});

document.querySelectorAll(".nav-item[data-section]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item[data-section]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(".sidebar").classList.remove("open");
    showSection(button.dataset.section);
  });
});

const pageTitles = {
  dashboard: "لوحة التحكم",
  transactions: "المعاملات",
  budgets: "الميزانية",
  reports: "التقارير",
  settings: "الإعدادات"
};

function showSection(section) {
  const dashboard = document.querySelector(".overview-grid");
  const dashboardGrid = document.querySelector(".dashboard-grid");
  dashboard.style.display = section === "dashboard" ? "" : "none";
  dashboardGrid.style.display = section === "dashboard" ? "" : "none";
  document.querySelectorAll(".page-view").forEach((view) => view.classList.remove("active"));
  const target = document.getElementById(`${section}View`);
  if (target) target.classList.add("active");
  document.querySelector(".topbar h1").textContent = pageTitles[section] || "ميزانيتي";
}

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    const section = button.dataset.go;
    document.querySelectorAll(".nav-item[data-section]").forEach((item) => item.classList.toggle("active", item.dataset.section === section));
    showSection(section);
  });
});

document.getElementById("transactionsAddButton").addEventListener("click", openModal);
document.getElementById("notificationButton").addEventListener("click", () => {
  document.getElementById("notificationPopover").classList.toggle("open");
});

document.getElementById("monthSelect").addEventListener("change", (event) => {
  const previous = event.target.value === "previous";
  document.querySelector(".insight-panel h3").textContent = previous
    ? "إنفاقك الشهر الماضي كان أعلى قليلاً من توقعاتك."
    : "مصروفاتك أقل من الشهر الماضي بنسبة 8%!";
});

document.getElementById("settingsIncome").value = settings.income;
document.getElementById("settingsSavings").value = settings.savings;
document.getElementById("settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  settings = {
    income: Number(document.getElementById("settingsIncome").value),
    savings: Number(document.getElementById("settingsSavings").value)
  };
  localStorage.setItem("mybudgetSettings", JSON.stringify(settings));
  renderAll();
  const message = document.getElementById("settingsSaved");
  message.classList.add("visible");
  window.setTimeout(() => message.classList.remove("visible"), 2200);
});

document.getElementById("exportCsvButton").addEventListener("click", () => {
  const rows = [["الاسم", "الفئة", "المبلغ", "التاريخ"], ...transactions.map((item) => [
    item.name, categoryConfig[item.category].name, item.amount, item.date
  ])];
  const csv = "\ufeff" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "mybudget-report.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

renderAll();
