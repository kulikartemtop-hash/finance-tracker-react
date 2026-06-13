// Элементы DOM
const cameraInput = document.getElementById('cameraInput');
const scanBtn = document.getElementById('scanBtn');
const loading = document.getElementById('loading');
const progress = document.getElementById('progress');
const amountInput = document.getElementById('amountInput');
const descInput = document.getElementById('descInput');
const addBtn = document.getElementById('addBtn');
const transactionList = document.getElementById('transactionList');
const totalBalanceEl = document.getElementById('totalBalance');
const emptyState = document.getElementById('emptyState');

// Состояние приложения
let transactions = [];

// 1. Загрузка данных из памяти телефона при старте
function loadTransactions() {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }
    render();
}

// 2. Сохранение данных в память телефона
function saveTransactions() {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    render();
}

// 3. Отрисовка интерфейса
function render() {
    transactionList.innerHTML = '';
    let total = 0;

    if (transactions.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        transactions.forEach(t => {
            total += t.amount;
            const li = document.createElement('li');
            li.className = 'transaction-item';
            li.innerHTML = `
                <div class="t-info">
                    <span class="t-desc">${t.description}</span>
                    <span class="t-date">${t.date}</span>
                </div>
                <div class="t-right">
                    <span class="t-amount">-${t.amount.toFixed(2)} ₽</span>                    <button class="btn-delete" onclick="deleteTransaction(${t.id})">🗑️</button>
                </div>
            `;
            transactionList.appendChild(li);
        });
    }
    totalBalanceEl.textContent = total.toFixed(2) + ' ₽';
}

// 4. Обработка сканирования чека
scanBtn.addEventListener('click', () => {
    cameraInput.click();
});

cameraInput.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    loading.style.display = 'block';
    scanBtn.disabled = true;

    try {
        // Запуск Tesseract.js
        const { data: { text } } = await Tesseract.recognize(file, 'rus+eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    progress.textContent = Math.round(m.progress * 100);
                }
            }
        });

        // Простой поиск суммы (ищет числа вида 150.50 или 150,50)
        const amountMatch = text.match(/(\d+[\.,]\d{2})/);
        if (amountMatch) {
            amountInput.value = amountMatch[0].replace(',', '.');
        }

        // Простой поиск даты (ДД.ММ.ГГГГ)
        const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) {
            descInput.value = `Чек от ${dateMatch[0]}`;
        } else {
            descInput.value = 'Покупка по чеку';
        }

    } catch (error) {
        console.error(error);
        alert('Ошибка распознавания. Попробуйте сделать фото четче.');
    } finally {
        loading.style.display = 'none';        scanBtn.disabled = false;
        cameraInput.value = ''; // Сброс инпута для повторного выбора того же файла
    }
});

// 5. Добавление транзакции
addBtn.addEventListener('click', () => {
    const amount = parseFloat(amountInput.value);
    const description = descInput.value.trim() || 'Без описания';

    if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
    }

    const newTransaction = {
        id: Date.now(),
        amount: amount,
        description: description,
        date: new Date().toLocaleDateString('ru-RU')
    };

    transactions.unshift(newTransaction); // Добавляем в начало
    saveTransactions();
    
    // Очистка полей
    amountInput.value = '';
    descInput.value = '';
});

// 6. Удаление транзакции (функция должна быть глобальной для onclick в HTML)
window.deleteTransaction = function(id) {
    if (confirm('Удалить эту запись?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
    }
};

// Запуск при загрузке страницы
loadTransactions();