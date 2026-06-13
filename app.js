// Элементы DOM
const views = document.querySelectorAll('.view');
const navBtns = document.querySelectorAll('.nav-btn');

// Счета
const totalBalanceEl = document.getElementById('totalBalance');
const accountsList = document.getElementById('accountsList');
const addAccountBtn = document.getElementById('addAccountBtn');

// Расходы
const periodLabel = document.getElementById('periodLabel');
const periodTotal = document.getElementById('periodTotal');
const filterBtns = document.querySelectorAll('.filter-btn');
const accountSelect = document.getElementById('accountSelect');
const cameraInput = document.getElementById('cameraInput');
const scanBtn = document.getElementById('scanBtn');
const loading = document.getElementById('loading');
const progress = document.getElementById('progress');
const amountInput = document.getElementById('amountInput');
const descInput = document.getElementById('descInput');
const categoryInput = document.getElementById('categoryInput');
const addBtn = document.getElementById('addBtn');
const transactionList = document.getElementById('transactionList');
const emptyState = document.getElementById('emptyState');

// Доходы и Переводы
const monthIncomeTotal = document.getElementById('monthIncomeTotal');
const incomeTypeSelect = document.getElementById('incomeTypeSelect');
const incomeDescInput = document.getElementById('incomeDescInput');
const incomeAccountSelect = document.getElementById('incomeAccountSelect');
const incomeAmountInput = document.getElementById('incomeAmountInput');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const incomeList = document.getElementById('incomeList');
const emptyIncomeState = document.getElementById('emptyIncomeState');

const transferFromSelect = document.getElementById('transferFromSelect');
const transferToSelect = document.getElementById('transferToSelect');
const transferAmountInput = document.getElementById('transferAmountInput');
const transferBtn = document.getElementById('transferBtn');

// Состояние
let accounts = [];
let transactions = [];
let currentFilter = 'month';

const CATEGORY_KEYWORDS = {
    '🛒 Продукты': ['пятерочка', 'магнит', 'ашан', 'лента', 'перекресток', 'дикси', 'вкусвилл', 'продукты'],
    '🚕 Транспорт': ['яндекс', 'ситимобил', 'метро', 'такси', 'бензин', 'лукойл', 'газпром'],
    '🍔 Кафе': ['ресторан', 'кафе', 'кофе', 'вкусно', 'шаверма', 'пицца', 'kfc', 'burger king'],
    '💊 Здоровье': ['аптека', 'ригла', 'лекарство', 'врач', 'клиника'],    '🛍️ Покупки': ['zara', 'h&m', 'wildberries', 'ozon', 'одежда', 'обувь'],
    '🏠 Дом': ['квартплата', 'жкх', 'интернет', 'мтс', 'билайн', 'аренда']
};

// 1. Инициализация
function loadData() {
    const savedAccounts = localStorage.getItem('finance_accounts');
    const savedTransactions = localStorage.getItem('finance_transactions');
    
    if (savedAccounts) {
        accounts = JSON.parse(savedAccounts);
    } else {
        accounts = [
            { id: 1, name: 'Т-Банк', balance: 0, icon: '🟡' },
            { id: 2, name: 'Сбербанк', balance: 0, icon: '🟢' },
            { id: 3, name: 'Наличные', balance: 0, icon: '💵' }
        ];
        saveData();
    }
    
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
    
    renderAccounts();
    updateAllAccountSelects();
    renderExpenses();
    renderIncomes();
}

function saveData() {
    localStorage.setItem('finance_accounts', JSON.stringify(accounts));
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    renderAccounts();
    renderExpenses();
    renderIncomes();
}

// 2. Навигация
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// 3. Логика Счетовfunction renderAccounts() {
    accountsList.innerHTML = '';
    let total = 0;
    accounts.forEach(acc => {
        total += acc.balance;
        const li = document.createElement('li');
        li.className = 'account-item';
        li.innerHTML = `
            <div class="acc-info"><span class="acc-icon">${acc.icon}</span><span class="acc-name">${acc.name}</span></div>
            <span class="acc-balance">${acc.balance.toFixed(2)} ₽</span>
        `;
        accountsList.appendChild(li);
    });
    totalBalanceEl.textContent = total.toFixed(2) + ' ₽';
}

function updateAllAccountSelects() {
    const selects = [accountSelect, incomeAccountSelect, transferFromSelect, transferToSelect];
    selects.forEach(select => {
        select.innerHTML = '';
        accounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.id;
            option.textContent = `${acc.icon} ${acc.name} (${acc.balance.toFixed(2)} ₽)`;
            select.appendChild(option);
        });
    });
}

addAccountBtn.addEventListener('click', () => {
    const name = prompt('Введите название счета (например: Альфа-Банк):');
    if (name && name.trim()) {
        accounts.push({ id: Date.now(), name: name.trim(), balance: 0, icon: '💳' });
        saveData();
        updateAllAccountSelects();
    }
});

// 4. Логика Расходов
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderExpenses();
    });
});

function isDateInFilter(dateStr, filter) {
    const txDate = new Date(dateStr.split('.').reverse().join('-'));    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (filter === 'today') return txDate.getTime() === today.getTime();
    if (filter === 'week') { const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7); return txDate >= weekAgo; }
    if (filter === 'month') return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    return true;
}

function renderExpenses() {
    transactionList.innerHTML = '';
    let periodSum = 0;
    const filteredTx = transactions.filter(t => t.type === 'expense' && isDateInFilter(t.date, currentFilter)).sort((a, b) => b.id - a.id);
    
    filteredTx.forEach(t => {
        periodSum += t.amount;
        const acc = accounts.find(a => a.id === t.accountId) || { name: 'Неизвестно', icon: '❓' };
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="t-info">
                <span class="t-desc">${t.category} • ${t.description}</span>
                <span class="t-date">${t.date} • ${acc.icon} ${acc.name}</span>
            </div>
            <div class="t-right">
                <span class="t-amount expense">-${t.amount.toFixed(2)} ₽</span>
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">🗑️</button>
            </div>
        `;
        transactionList.appendChild(li);
    });
    emptyState.style.display = filteredTx.length ? 'none' : 'block';
    const periodNames = { 'today': 'Сегодня', 'week': 'За неделю', 'month': 'За месяц' };
    periodLabel.textContent = `Расход ${periodNames[currentFilter].toLowerCase()}`;
    periodTotal.textContent = periodSum.toFixed(2) + ' ₽';
}

// 5. Сканирование и Добавление Расхода
scanBtn.addEventListener('click', () => cameraInput.click());
cameraInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    loading.style.display = 'block';
    scanBtn.disabled = true;
    try {
        const { data: { text } } = await Tesseract.recognize(file, 'rus+eng', {
            logger: m => { if (m.status === 'recognizing text') progress.textContent = Math.round(m.progress * 100); }
        });
        const amountMatch = text.match(/(\d+[\.,]\d{2})/);
        if (amountMatch) amountInput.value = amountMatch[0].replace(',', '.');
        const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
        descInput.value = dateMatch ? `Чек от ${dateMatch[0]}` : 'Покупка';        
        const lowerText = text.toLowerCase();
        let detectedCategory = '📦 Другое';
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) { detectedCategory = category; break; }
        }
        categoryInput.value = detectedCategory;
    } catch (error) {
        alert('Ошибка распознавания.');
    } finally {
        loading.style.display = 'none';
        scanBtn.disabled = false;
        cameraInput.value = '';
    }
});

addBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const accountId = parseInt(accountSelect.value);
    const description = descInput.value.trim() || 'Без описания';
    const category = categoryInput.value;
    if (!amount || amount <= 0) return alert('Введите корректную сумму');

    const account = accounts.find(a => a.id === accountId);
    if (account) account.balance -= amount;

    transactions.push({ id: Date.now(), type: 'expense', accountId, amount, description, category, date: new Date().toLocaleDateString('ru-RU') });
    saveData();
    updateAllAccountSelects();
    amountInput.value = ''; descInput.value = ''; categoryInput.value = '📦 Другое';
});

window.deleteTransaction = function(id) {
    if (confirm('Удалить запись и вернуть деньги на счет?')) {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.type === 'expense') {
            const account = accounts.find(a => a.id === tx.accountId);
            if (account) account.balance += tx.amount;
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateAllAccountSelects();
        }
    }
};

// 6. Логика Доходов
addIncomeBtn.addEventListener('click', () => {
    const amount = parseFloat(incomeAmountInput.value);
    const accountId = parseInt(incomeAccountSelect.value);
    let category = incomeTypeSelect.value;    let description = incomeDescInput.value.trim();

    if (category === '✍️ Другое' && !description) description = 'Доход';
    if (category !== '✍️ Другое' && description) description = `${category}: ${description}`;
    else if (category !== '✍️ Другое') description = category;

    if (!amount || amount <= 0) return alert('Введите корректную сумму');

    const account = accounts.find(a => a.id === accountId);
    if (account) account.balance += amount;

    transactions.push({ id: Date.now(), type: 'income', accountId, amount, description, category, date: new Date().toLocaleDateString('ru-RU') });
    saveData();
    updateAllAccountSelects();
    incomeAmountInput.value = ''; incomeDescInput.value = ''; incomeTypeSelect.value = '💼 Зарплата';
});

function renderIncomes() {
    incomeList.innerHTML = '';
    let monthSum = 0;
    const today = new Date();
    
    // Фильтруем только доходы за текущий месяц для верхней цифры
    const monthIncomes = transactions.filter(t => {
        if (t.type !== 'income') return false;
        const txDate = new Date(t.date.split('.').reverse().join('-'));
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
    });
    
    monthIncomes.forEach(t => monthSum += t.amount);
    monthIncomeTotal.textContent = monthSum.toFixed(2) + ' ₽';

    // Показываем все доходы в списке (отсортированные по убыванию ID)
    const allIncomes = transactions.filter(t => t.type === 'income').sort((a, b) => b.id - a.id);
    
    allIncomes.forEach(t => {
        const acc = accounts.find(a => a.id === t.accountId) || { name: 'Неизвестно', icon: '❓' };
        const li = document.createElement('li');
        li.className = 'transaction-item';
        li.innerHTML = `
            <div class="t-info">
                <span class="t-desc">${t.description}</span>
                <span class="t-date">${t.date} • ${acc.icon} ${acc.name}</span>
            </div>
            <div class="t-right">
                <span class="t-amount income">+${t.amount.toFixed(2)} ₽</span>
                <button class="btn-delete" onclick="deleteIncome(${t.id})">🗑️</button>
            </div>
        `;
        incomeList.appendChild(li);    });
    emptyIncomeState.style.display = allIncomes.length ? 'none' : 'block';
}

window.deleteIncome = function(id) {
    if (confirm('Удалить эту запись о доходе и списать сумму со счета?')) {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.type === 'income') {
            const account = accounts.find(a => a.id === tx.accountId);
            if (account) account.balance -= tx.amount;
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateAllAccountSelects();
        }
    }
};

// 7. Логика Переводов
transferBtn.addEventListener('click', () => {
    const fromId = parseInt(transferFromSelect.value);
    const toId = parseInt(transferToSelect.value);
    const amount = parseFloat(transferAmountInput.value);

    if (fromId === toId) return alert('Выберите разные счета для перевода!');
    if (!amount || amount <= 0) return alert('Введите корректную сумму');

    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    if (fromAcc.balance < amount) return alert(`Недостаточно средств на счете ${fromAcc.name}`);

    // Выполняем перевод
    fromAcc.balance -= amount;
    toAcc.balance += amount;

    // Записываем как транзакцию типа 'transfer'
    transactions.push({
        id: Date.now(),
        type: 'transfer',
        fromAccountId: fromId,
        toAccountId: toId,
        amount: amount,
        description: `Перевод: ${fromAcc.name} → ${toAcc.name}`,
        date: new Date().toLocaleDateString('ru-RU')
    });

    saveData();
    updateAllAccountSelects();
    transferAmountInput.value = '';
    alert(`Успешно переведено ${amount} ₽`);});

// Запуск
loadData();