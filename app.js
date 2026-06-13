// Элементы DOM
const cameraInput = document.getElementById('cameraInput');
const scanBtn = document.getElementById('scanBtn');
const loading = document.getElementById('loading');
const progress = document.getElementById('progress');
const amountInput = document.getElementById('amountInput');
const descInput = document.getElementById('descInput');
const categoryInput = document.getElementById('categoryInput');
const addBtn = document.getElementById('addBtn');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const emptyState = document.getElementById('emptyState');

let transactions = [];

// Словарь для автоматического определения категории по ключевым словам
const CATEGORY_KEYWORDS = {
    '🛒 Продукты': ['пятерочка', 'магнит', 'ашан', 'лента', 'перекресток', 'дикси', 'верный', 'чижик', 'продукты', 'супермаркет', 'гипермаркет', 'вкусвилл'],
    '🚕 Транспорт': ['яндекс', 'ситимобил', 'метро', 'такси', 'автобус', 'бензин', 'лукойл', 'роснефть', 'газпром', 'парковка', 'каршеринг'],
    '🍔 Кафе': ['ресторан', 'кафе', 'кофе', 'вкусно', 'бургер', 'шаверма', 'пицца', 'макдоналдс', 'вкусно и точка', 'kfc', 'burger king', 'starbucks'],
    '💊 Здоровье': ['аптека', 'ригла', 'здоровье', 'лекарство', 'врач', 'клиника', 'стоматология', 'доктор'],
    '🛍️ Покупки': ['zara', 'h&m', 'uniqlo', 'globo', 'rendez-vous', 'одежда', 'обувь', 'wildberries', 'ozon', 'маркетплейс'],
    '🏠 Дом': ['квартплата', 'жкх', 'интернет', 'мтс', 'билайн', 'теле2', 'мегафон', 'аренда', 'ремонт']
};

// Функция умного поиска категории в тексте
function detectCategory(text) {
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(keyword => lowerText.includes(keyword))) {
            return category;
        }
    }
    return '📦 Другое';
}

function loadTransactions() {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }
    render();
}

function saveTransactions() {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    render();
}

function render() {    transactionList.innerHTML = '';
    let total = 0;

    if (transactions.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        transactions.forEach(t => {
            total += t.amount;
            const li = document.createElement('li');
            li.className = 'transaction-item';
            // Используем категорию из записи или "Другое" для старых записей
            const category = t.category || '📦 Другое'; 
            
            li.innerHTML = `
                <div class="t-info">
                    <span class="t-desc">${category} • ${t.description}</span>
                    <span class="t-date">${t.date}</span>
                </div>
                <div class="t-right">
                    <span class="t-amount">-${t.amount.toFixed(2)} ₽</span>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">🗑️</button>
                </div>
            `;
            transactionList.appendChild(li);
        });
    }
    totalBalanceEl.textContent = total.toFixed(2) + ' ₽';
}

scanBtn.addEventListener('click', () => {
    cameraInput.click();
});

cameraInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    loading.style.display = 'block';
    scanBtn.disabled = true;

    try {
        const { data: { text } } = await Tesseract.recognize(file, 'rus+eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    progress.textContent = Math.round(m.progress * 100);
                }
            }
        });
        // 1. Ищем сумму
        const amountMatch = text.match(/(\d+[\.,]\d{2})/);
        if (amountMatch) {
            amountInput.value = amountMatch[0].replace(',', '.');
        }

        // 2. Ищем дату
        const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) {
            descInput.value = `Чек от ${dateMatch[0]}`;
        } else {
            descInput.value = 'Покупка по чеку';
        }

        // 3. АВТОМАТИЧЕСКИ определяем категорию по всему распознанному тексту!
        const detectedCategory = detectCategory(text);
        categoryInput.value = detectedCategory;

    } catch (error) {
        console.error(error);
        alert('Ошибка распознавания. Попробуйте сделать фото четче.');
    } finally {
        loading.style.display = 'none';
        scanBtn.disabled = false;
        cameraInput.value = '';
    }
});

addBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const description = descInput.value.trim() || 'Без описания';
    const category = categoryInput.value; // Берем выбранную категорию

    if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
    }

    const newTransaction = {
        id: Date.now(),
        amount: amount,
        description: description,
        category: category, // Сохраняем категорию
        date: new Date().toLocaleDateString('ru-RU')
    };

    transactions.unshift(newTransaction);
    saveTransactions();
    
    amountInput.value = '';    descInput.value = '';
    categoryInput.value = '📦 Другое'; // Сброс категории
});

window.deleteTransaction = function(id) {
    if (confirm('Удалить эту запись?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
    }
};

loadTransactions();