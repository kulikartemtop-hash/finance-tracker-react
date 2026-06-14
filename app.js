console.log("✅ app.js загружен — стартуем");

// === DOM ELEMENTS ===
const views = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');

const totalBalanceEl = document.getElementById('totalBalance');
const accountsList = document.getElementById('accountsList');
const addAccountBtn = document.getElementById('addAccountBtn');

const smsTextInput = document.getElementById('smsTextInput');
const parseSmsBtn = document.getElementById('parseSmsBtn');

const accountSelect = document.getElementById('accountSelect');
const amountInput = document.getElementById('amountInput');
const categoryInput = document.getElementById('categoryInput');
const subcategoryInput = document.getElementById('subcategoryInput');
const descInput = document.getElementById('descInput');
const addBtn = document.getElementById('addBtn');

const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');

const periodLabel = document.getElementById('periodLabel');
const periodTotal = document.getElementById('periodTotal');
const monthIncomeTotal = document.getElementById('monthIncomeTotal');

const incomeAccountSelect = document.getElementById('incomeAccountSelect');
const incomeAmountInput = document.getElementById('incomeAmountInput');
const incomeDescInput = document.getElementById('incomeDescInput');
const addIncomeBtn = document.getElementById('addIncomeBtn');

const transferFromSelect = document.getElementById('transferFromSelect');
const transferToSelect = document.getElementById('transferToSelect');
const transferAmountInput = document.getElementById('transferAmountInput');
const transferBtn = document.getElementById('transferBtn');

const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
const listViewContainer = document.getElementById('listViewContainer');
const chartViewContainer = document.getElementById('chartViewContainer');
const expenseChartCanvas = document.getElementById('expenseChart');

// === STATE ===
let accounts = [];
let transactions = [];
let customCategories = [
    '🛒 Продукты',
    '🚕 Транспорт',
    '🍔 Кафе',
    '💊 Здоровье',    '🛍️ Покупки',
    '🏠 Дом',
    '📦 Другое'
];
let currentFilter = 'month';
let currentHistoryView = 'list';
let expenseChartInstance = null;

// === INIT ===
function loadData() {
    try {
        const savedAccounts = localStorage.getItem('finance_accounts');
        const savedTransactions = localStorage.getItem('finance_transactions');
        const savedCategories = localStorage.getItem('finance_categories');

        accounts = savedAccounts 
            ? JSON.parse(savedAccounts) 
            : [
                { id: 1, name: 'Т-Банк', balance: 0, icon: '🏦', goals: [] },
                { id: 2, name: 'Сбербанк', balance: 0, icon: '💳', goals: [] },
                { id: 3, name: 'Наличные', balance: 0, icon: '💵', goals: [] }
            ];

        transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        if (savedCategories) customCategories = JSON.parse(savedCategories);

        saveData();
    } catch (e) {
        console.error('[INIT ERROR]:', e);
        localStorage.clear();
        location.reload();
        return;
    }

    renderAccounts();
    updateAllAccountSelects();
    renderExpenses();
    renderIncomesAndTransfers();
}

function saveData() {
    try {
        localStorage.setItem('finance_accounts', JSON.stringify(accounts));
        localStorage.setItem('finance_transactions', JSON.stringify(transactions));
        localStorage.setItem('finance_categories', JSON.stringify(customCategories));
    } catch (e) {
        console.warn('localStorage недоступен (приватный режим)');
    }
}
// === NAVIGATION ===
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(btn.dataset.view).classList.add('active');
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// === ACCOUNTS ===
function renderAccounts() {
    accountsList.innerHTML = '';
    let totalWorkingBalance = 0;

    accounts.forEach(acc => {
        totalWorkingBalance += acc.balance;
        const li = document.createElement('li');
        li.className = 'account-item';

        let goalsHtml = '';
        if (acc.goals && acc.goals.length > 0) {
            goalsHtml = `<div class="goals-section">
                ${acc.goals.map(g => `
                    <div class="goal-item">
                        <span class="goal-name"><i class="fas fa-flag"></i> ${g.name}</span>
                        <span class="goal-amount">${g.currentAmount.toFixed(0)} / ${g.targetAmount.toFixed(0)} ₽</span>
                    </div>
                `).join('')}
                <button class="btn-add-goal" onclick="addGoal(${acc.id})">
                    <i class="fas fa-plus"></i> Добавить цель
                </button>
            </div>`;
        } else {
            goalsHtml = `<button class="btn-add-goal" onclick="addGoal(${acc.id})">
                <i class="fas fa-plus"></i> Добавить цель (не влияет)
            </button>`;
        }

        li.innerHTML = `
            <div class="acc-header">
                <div class="acc-info">
                    <span>${acc.icon}</span>
                    <span>${acc.name}</span>
                </div>
                <span class="acc-balance">${acc.balance.toFixed(2)} ₽</span>
            </div>
            ${goalsHtml}
        `;
        accountsList.appendChild(li);    });

    totalBalanceEl.textContent = totalWorkingBalance.toFixed(2) + ' ₽';
}

window.addGoal = function(accountId) {
    const name = prompt('Название цели:');
    if (!name) return;
    const target = parseFloat(prompt('Целевая сумма (₽):'));
    if (!target || target <= 0) return alert('Сумма > 0');

    const acc = accounts.find(a => a.id === accountId);
    if (!acc.goals) acc.goals = [];
    acc.goals.push({ id: Date.now(), name: name.trim(), targetAmount: target, currentAmount: 0 });
    saveData();
    renderAccounts();
};

function updateAllAccountSelects() {
    [accountSelect, incomeAccountSelect, transferFromSelect, transferToSelect].forEach(select => {
        select.innerHTML = '';
        accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = `${acc.icon} ${acc.name} (${acc.balance.toFixed(2)} ₽)`;
            select.appendChild(opt);
        });
    });
}

addAccountBtn.addEventListener('click', () => {
    const name = prompt('Название счета:');
    if (name && name.trim()) {
        accounts.push({
            id: Date.now(),
            name: name.trim(),
            balance: 0,
            icon: '💰',
            goals: []
        });
        saveData();
        renderAccounts();
        updateAllAccountSelects();
    }
});

// === EXPENSES ===
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderExpenses();
    });
});

viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentHistoryView = btn.dataset.chartType;
        viewToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (currentHistoryView === 'list') {
            listViewContainer.style.display = 'block';
            chartViewContainer.style.display = 'none';
        } else {
            listViewContainer.style.display = 'none';
            chartViewContainer.style.display = 'block';
            renderChart(currentHistoryView);
        }
    });
});

function isDateInFilter(dateStr, filter) {
    const txDate = new Date(dateStr.split('.').reverse().join('-'));
    const today = new Date(); today.setHours(0,0,0,0);
    if (filter === 'today') return txDate.getTime() === today.getTime();
    if (filter === 'week') { const w = new Date(today); w.setDate(today.getDate()-7); return txDate >= w; }
    if (filter === 'month') return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    return true;
}

function renderExpenses() {
    transactionList.innerHTML = '';
    let periodSum = 0;
    const filteredTx = transactions
        .filter(t => t.type === 'expense' && isDateInFilter(t.date, currentFilter))
        .sort((a,b) => b.id - a.id);

    filteredTx.forEach(t => {
        periodSum += t.amount;
        const acc = accounts.find(a => a.id === t.accountId) || { name: '?', icon: '?' };
        const li = document.createElement('li');
        li.className = 'transaction-item';
        const sub = t.subcategory ? `<div class="t-sub"><i class="fas fa-tag"></i> ${t.subcategory}</div>` : '';
        li.innerHTML = `
            <div>
                <div class="t-desc">${t.category}</div>
                ${sub}
                <div class="t-date">${t.description}</div>            </div>
            <div class="t-amount expense">-${t.amount.toFixed(2)} ₽</div>
        `;
        transactionList.appendChild(li);
    });

    emptyState.style.display = filteredTx.length ? 'none' : 'block';
    const periodNames = { 'today': 'Сегодня', 'week': 'За неделю', 'month': 'За месяц' };
    periodLabel.textContent = `Расход ${periodNames[currentFilter].toLowerCase()}`;
    periodTotal.textContent = periodSum.toFixed(2) + ' ₽';

    if (currentHistoryView !== 'list') renderChart(currentHistoryView);
}

function renderChart(type) {
    if (expenseChartInstance) expenseChartInstance.destroy();
    const ctx = expenseChartCanvas.getContext('2d');

    const filteredTx = transactions.filter(t => t.type === 'expense' && isDateInFilter(t.date, currentFilter));
    const dataMap = {};
    filteredTx.forEach(t => {
        const key = t.subcategory ? `${t.category}: ${t.subcategory}` : t.category;
        dataMap[key] = (dataMap[key] || 0) + t.amount;
    });

    const labels = Object.keys(dataMap);
    const data = Object.values(dataMap);
    const colors = ['#6366f1', '#8b5cf6', '#34d399', '#f87171', '#f59e0b', '#ec4899', '#10b981'];

    expenseChartInstance = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: 'Расход (₽)',
                data: data,
                backgroundColor: type === 'pie' ? colors : 'rgba(99, 102, 241, 0.7)',
                borderColor: type === 'pie' ? '#ffffff' : 'rgba(99, 102, 241, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: type === 'pie' ? 'bottom' : 'top', labels: { color: 'var(--text)' } },
                tooltip: { backgroundColor: 'var(--card)', titleColor: 'var(--text)', bodyColor: 'var(--text)' }
            }
        }
    });
}
// === ADD EXPENSE ===
function addExpenseLogic(amount, accountId, category, subcategory, description) {
    if (!amount || amount <= 0) return alert('Сумма должна быть > 0');
    if (!customCategories.includes(category)) customCategories.push(category);

    const acc = accounts.find(a => a.id === accountId);
    if (acc) acc.balance -= amount;

    transactions.push({
        id: Date.now(),
        type: 'expense',
        accountId,
        amount,
        category,
        subcategory: subcategory || '',
        description,
        date: new Date().toLocaleDateString('ru-RU')
    });

    saveData();
    updateAllAccountSelects();
    amountInput.value = '';
    categoryInput.value = '';
    subcategoryInput.value = '';
    descInput.value = '';
}

addBtn.addEventListener('click', () => {
    addExpenseLogic(
        parseFloat(amountInput.value),
        parseInt(accountSelect.value),
        categoryInput.value.trim() || '📦 Другое',
        subcategoryInput.value.trim(),
        descInput.value.trim()
    );
});

// === SMS PARSER ===
parseSmsBtn.addEventListener('click', async () => {
    let text = smsTextInput.value.trim();
    if (!text) {
        try {
            text = await navigator.clipboard.readText();
            smsTextInput.value = text;
        } catch (err) {
            return alert('Скопируйте СМС и вставьте в поле.');
        }
    }
    if (!text) return;
    const amountMatches = text.match(/\d{1,3}(?:\s?\d{3})*(?:[\.,]\d{1,2})?/g);
    let foundAmount = '';
    if (amountMatches) {
        const numbers = amountMatches.map(n => parseFloat(n.replace(/\s/g, '').replace(',', '.')));
        const validAmounts = numbers.filter(n => n > 1 && n < 500000);
        if (validAmounts.length > 0) foundAmount = validAmounts[0].toString();
    }

    const lowerText = text.toLowerCase();
    let detectedCategory = '📦 Другое';
    const keywords = {
        '🛒 Продукты': ['пятерочка', 'магнит', 'ашан'],
        '🚕 Транспорт': ['яндекс', 'такси', 'метро'],
        '🍔 Кафе': ['кафе', 'ресторан', 'кофе']
    };
    for (const [cat, keys] of Object.entries(keywords)) {
        if (keys.some(k => lowerText.includes(k))) {
            detectedCategory = cat;
            break;
        }
    }

    amountInput.value = foundAmount;
    categoryInput.value = detectedCategory;
    descInput.value = `СМС: ${text.substring(0, 30)}...`;
    smsTextInput.value = '';

    if (navigator.vibrate) navigator.vibrate(50);
    alert('✅ СМС распознан!');
});

// === INCOME ===
addIncomeBtn.addEventListener('click', () => {
    const amt = parseFloat(incomeAmountInput.value);
    const accId = parseInt(incomeAccountSelect.value);
    if (!amt || amt <= 0) return alert('Сумма > 0');
    const acc = accounts.find(a => a.id === accId);
    if (acc) acc.balance += amt;
    transactions.push({
        id: Date.now(),
        type: 'income',
        accountId: accId,
        amount: amt,
        description: incomeDescInput.value || 'Доход',
        date: new Date().toLocaleDateString('ru-RU')
    });
    saveData();
    renderAccounts();
    renderExpenses();    incomeAmountInput.value = '';
    incomeDescInput.value = '';
});

// === TRANSFER ===
transferBtn.addEventListener('click', () => {
    const fromId = parseInt(transferFromSelect.value);
    const toId = parseInt(transferToSelect.value);
    const amount = parseFloat(transferAmountInput.value);

    if (fromId === toId) return alert('Выберите разные счета!');
    if (!amount || amount <= 0) return alert('Сумма > 0');

    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    if (fromAcc.balance < amount) return alert(`Недостаточно средств на "${fromAcc.name}"`);

    fromAcc.balance -= amount;
    toAcc.balance += amount;

    transactions.push({
        id: Date.now(),
        type: 'transfer',
        fromAccountId: fromId,
        toAccountId: toId,
        amount: amount,
        description: `${fromAcc.name} → ${toAcc.name}`,
        date: new Date().toLocaleDateString('ru-RU')
    });

    saveData();
    updateAllAccountSelects();
    transferAmountInput.value = '';
    alert(`✅ Переведено ${amount} ₽`);
});

// === DELETE ===
window.deleteItem = function(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (!confirm('Удалить операцию?')) return;

    if (tx.type === 'expense') {
        const acc = accounts.find(a => a.id === tx.accountId);
        if (acc) acc.balance += tx.amount;
    } else if (tx.type === 'income') {
        const acc = accounts.find(a => a.id === tx.accountId);
        if (acc) acc.balance -= tx.amount;
    } else if (tx.type === 'transfer') {        const fromAcc = accounts.find(a => a.id === tx.fromAccountId);
        const toAcc = accounts.find(a => a.id === tx.toAccountId);
        if (fromAcc) fromAcc.balance += tx.amount;
        if (toAcc) toAcc.balance -= tx.amount;
    }

    transactions = transactions.filter(t => t.id !== id);
    saveData();
    updateAllAccountSelects();
    renderExpenses();
};

// === INCOMES STATS ===
function renderIncomesAndTransfers() {
    let monthSum = 0;
    const today = new Date();
    transactions
        .filter(t => t.type === 'income')
        .filter(t => {
            const d = new Date(t.date.split('.').reverse().join('-'));
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        })
        .forEach(t => monthSum += t.amount);
    monthIncomeTotal.textContent = monthSum.toFixed(2) + ' ₽';
}

// === START ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM готов");
    loadData();
});