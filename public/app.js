const API_BASE = '/api';

// State
let currentUser = null;
let sessionToken = localStorage.getItem('budgetTrackerToken') || '';
let transactions = [];
let chatHistory = [];
let parsedTransaction = null;
let editingTransactionId = null;
let transactionLoadVersion = 0;

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appLayout = document.getElementById('appLayout');
const loginPanel = document.getElementById('loginPanel');
const signupPanel = document.getElementById('signupPanel');
const loginStatus = document.getElementById('loginStatus');
const signupStatus = document.getElementById('signupStatus');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const userBudgetEl = document.getElementById('userBudget');
const userAvatarEl = document.getElementById('userAvatar');
const accountStatus = document.getElementById('accountStatus');
const logoutBtn = document.getElementById('logoutBtn');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const aiStatusText = document.getElementById('aiStatusText');

// Stats Elements
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const netBalanceEl = document.getElementById('netBalance');
const balanceHealthEl = document.getElementById('balanceHealth');
const budgetLimitValEl = document.getElementById('budgetLimitVal');
const budgetProgressBar = document.getElementById('budgetProgressBar');
const budgetUtilText = document.getElementById('budgetUtilText');

// AI Elements
const aiInputText = document.getElementById('aiInputText');
const aiAutoLogBtn = document.getElementById('aiAutoLogBtn');
const aiParseOnlyBtn = document.getElementById('aiParseOnlyBtn');
const aiParseResult = document.getElementById('aiParseResult');
const generateInsightsBtn = document.getElementById('generateInsightsBtn');
const insightsContent = document.getElementById('insightsContent');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const clearChatBtn = document.getElementById('clearChatBtn');

// Transaction List & Modal
const transactionList = document.getElementById('transactionList');
const txModal = document.getElementById('txModal');
const openNewTxModal = document.getElementById('openNewTxModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const manualTxForm = document.getElementById('manualTxForm');
const modalTitle = txModal.querySelector('.modal-header h3');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

async function requestJSON(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);
    const response = await fetch(url, { ...options, headers });
    const json = await response.json();
    if (!response.ok || json.success === false) {
        if (response.status === 401 && sessionToken && !url.endsWith('/login') && !url.endsWith('/signup')) {
            clearSession();
            showAuthScreen();
        }
        throw new Error(json.message || `Request failed (${response.status})`);
    }
    return json;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await restoreSession();
});

function setupEventListeners() {
    document.getElementById('loginTab').addEventListener('click', () => showAuthTab('login'));
    document.getElementById('signupTab').addEventListener('click', () => showAuthTab('signup'));
    loginPanel.addEventListener('submit', handleLogin);
    signupPanel.addEventListener('submit', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);
    refreshDataBtn.addEventListener('click', () => loadTransactions(currentUser?._id));

    // AI Transaction Logging
    aiAutoLogBtn.addEventListener('click', handleAiAutoLog);
    aiParseOnlyBtn.addEventListener('click', handleAiParsePreview);
    aiInputText.addEventListener('keydown', event => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleAiAutoLog();
        }
    });

    // AI Insights
    generateInsightsBtn.addEventListener('click', handleGenerateInsights);

    // AI Chat
    chatForm.addEventListener('submit', handleChatSubmit);
    clearChatBtn.addEventListener('click', () => {
        chatHistory = [];
        chatMessages.replaceChildren();
        appendChatBubble('assistant', 'Chat cleared. Ask me any financial or budget question!');
    });

    // Modal
    openNewTxModal.addEventListener('click', openCreateTransactionModal);
    closeModalBtn.addEventListener('click', closeTransactionModal);
    cancelModalBtn.addEventListener('click', closeTransactionModal);
    document.getElementById('modalBackdrop').addEventListener('click', closeTransactionModal);
    manualTxForm.addEventListener('submit', handleManualTxSubmit);
    transactionList.addEventListener('click', handleTransactionAction);
    aiParseResult.addEventListener('click', handleParsedTransactionAction);
}

function showAuthTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('signupTab').classList.toggle('active', !isLogin);
    document.getElementById('loginTab').setAttribute('aria-selected', String(isLogin));
    document.getElementById('signupTab').setAttribute('aria-selected', String(!isLogin));
    loginPanel.classList.toggle('hidden', !isLogin);
    signupPanel.classList.toggle('hidden', isLogin);
    loginPanel.setAttribute('aria-hidden', String(!isLogin));
    signupPanel.setAttribute('aria-hidden', String(isLogin));
    loginStatus.textContent = '';
    signupStatus.textContent = '';
}

function showAuthScreen() {
    authScreen.classList.remove('hidden');
    appLayout.classList.add('hidden');
    currentUser = null;
    transactionLoadVersion += 1;
    transactions = [];
    renderTransactions();
    calculateStats();
}

function clearSession() {
    sessionToken = '';
    currentUser = null;
    localStorage.removeItem('budgetTrackerToken');
    localStorage.removeItem('budgetTrackerUser');
}

function saveSession(token, user) {
    sessionToken = token;
    currentUser = user;
    localStorage.setItem('budgetTrackerToken', token);
    localStorage.setItem('budgetTrackerUser', JSON.stringify(user));
    showDashboard(user);
}

async function restoreSession() {
    if (!sessionToken) {
        showAuthScreen();
        return;
    }

    try {
        const { data } = await requestJSON(`${API_BASE}/profile`);
        saveSession(sessionToken, data);
    } catch (err) {
        clearSession();
        showAuthScreen();
    }
}

function showDashboard(user) {
    currentUser = user;
    userNameEl.textContent = user.name || 'User';
    userEmailEl.textContent = user.email || '';
    userBudgetEl.textContent = `Monthly budget: ₹${Number(user.budgetLimit ?? 20000).toLocaleString('en-IN')}`;
    userAvatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
    budgetLimitValEl.textContent = `₹${Number(user.budgetLimit ?? 20000).toLocaleString('en-IN')}`;
    accountStatus.textContent = '';
    authScreen.classList.add('hidden');
    appLayout.classList.remove('hidden');
    loadTransactions(user._id);
}

async function handleLogin(event) {
    event.preventDefault();
    const submitButton = document.getElementById('loginSubmit');
    submitButton.disabled = true;
    loginStatus.textContent = 'Signing in...';
    try {
        const { data, token } = await requestJSON(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('loginUsername').value.trim(),
                password: document.getElementById('loginPassword').value
            })
        });
        saveSession(token, data);
        loginPanel.reset();
    } catch (err) {
        loginStatus.textContent = err.message;
    } finally {
        submitButton.disabled = false;
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const submitButton = document.getElementById('signupSubmit');
    submitButton.disabled = true;
    signupStatus.textContent = 'Creating your account...';
    try {
        const { data, token } = await requestJSON(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('signupName').value.trim(),
                username: document.getElementById('signupUsername').value.trim(),
                email: document.getElementById('signupEmail').value.trim(),
                phone: document.getElementById('signupPhone').value.trim(),
                password: document.getElementById('signupPassword').value,
                budgetLimit: document.getElementById('signupBudget').value
            })
        });
        saveSession(token, data);
        signupPanel.reset();
    } catch (err) {
        signupStatus.textContent = err.message;
    } finally {
        submitButton.disabled = false;
    }
}

async function handleLogout() {
    try {
        await requestJSON(`${API_BASE}/logout`, { method: 'POST' });
    } catch (err) {
        accountStatus.textContent = `Session ended locally; server logout failed: ${err.message}`;
    } finally {
        clearSession();
        showAuthScreen();
        showAuthTab('login');
    }
}

// ----------------- TRANSACTIONS -----------------
async function loadTransactions(userId) {
    const requestVersion = ++transactionLoadVersion;
    if (!userId) {
        transactions = [];
        renderTransactions();
        calculateStats();
        return;
    }
    try {
        const json = await requestJSON(`${API_BASE}/transaction/${userId}`);
        if (requestVersion !== transactionLoadVersion || currentUser?._id !== userId) return;
        transactions = Array.isArray(json.data) ? json.data : [];
        renderTransactions();
        calculateStats();
    } catch (err) {
        if (requestVersion === transactionLoadVersion && currentUser?._id === userId) {
            accountStatus.textContent = `Unable to load transactions: ${err.message}`;
        }
    }
}

function calculateStats() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const balance = income - expenses;
    const limit = currentUser?.budgetLimit ?? 20000;
    const usagePct = limit > 0 ? Math.round((expenses / limit) * 100) : 0;
    const progressPct = Math.min(100, usagePct);

    totalIncomeEl.textContent = `₹${income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    totalExpensesEl.textContent = `₹${expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    netBalanceEl.textContent = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    netBalanceEl.className = balance >= 0 ? 'stat-value text-green' : 'stat-value text-red';
    balanceHealthEl.textContent = balance >= 0 ? 'Income exceeds expenses' : 'Expenses exceed income';

    budgetProgressBar.style.width = `${progressPct}%`;
    if (usagePct >= 100) {
        budgetProgressBar.style.background = 'var(--danger)';
    } else if (usagePct >= 75) {
        budgetProgressBar.style.background = 'var(--warning)';
    } else {
        budgetProgressBar.style.background = 'var(--primary)';
    }

    budgetUtilText.textContent = `${usagePct}% of ₹${limit.toLocaleString('en-IN')} budget used`;
}

function renderTransactions() {
    if (!transactions.length) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">${currentUser ? 'No transactions found. Add one above!' : 'Log in to view your transactions.'}</td>
            </tr>
        `;
        return;
    }

    transactionList.innerHTML = transactions.map(t => {
        const isExp = t.type === 'expense';
        const transactionDate = new Date(t.date || t.createdAt);
        const formattedDate = Number.isNaN(transactionDate.getTime()) ? '—' : transactionDate.toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `
            <tr>
                <td><span class="badge ${isExp ? 'badge-expense' : 'badge-income'}">${escapeHTML(t.type)}</span></td>
                <td><strong>${escapeHTML(t.category)}</strong></td>
                <td class="tx-description">${escapeHTML(t.description || '-')}</td>
                <td class="text-muted">${formattedDate}</td>
                <td class="text-right ${isExp ? 'text-red' : 'text-green'} font-weight-bold">
                    ${isExp ? '-' : '+'}₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td class="text-center">
                    <div class="transaction-actions">
                        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${escapeHTML(t._id)}" aria-label="Edit transaction">Edit</button>
                        <button class="btn btn-text btn-sm" data-action="delete" data-id="${escapeHTML(t._id)}" aria-label="Delete transaction" title="Delete">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function dateInputValue(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

function openCreateTransactionModal() {
    if (!currentUser) return;
    editingTransactionId = null;
    manualTxForm.reset();
    document.getElementById('modalDate').value = dateInputValue(new Date());
    modalTitle.textContent = 'Add New Transaction';
    modalSubmitBtn.textContent = 'Save Transaction';
    txModal.classList.remove('hidden');
}

function openEditTransactionModal(transaction) {
    editingTransactionId = transaction._id;
    document.getElementById('modalType').value = transaction.type;
    document.getElementById('modalAmount').value = transaction.amount;
    document.getElementById('modalCategory').value = transaction.category || '';
    document.getElementById('modalDesc').value = transaction.description || '';
    document.getElementById('modalDate').value = dateInputValue(transaction.date || transaction.createdAt);
    modalTitle.textContent = 'Edit Transaction';
    modalSubmitBtn.textContent = 'Update Transaction';
    txModal.classList.remove('hidden');
}

function closeTransactionModal() {
    txModal.classList.add('hidden');
    editingTransactionId = null;
    manualTxForm.reset();
}

async function handleTransactionAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const transaction = transactions.find(item => item._id === button.dataset.id);
    if (!transaction) return;
    if (button.dataset.action === 'edit') {
        openEditTransactionModal(transaction);
    } else if (button.dataset.action === 'delete') {
        await handleDeleteTx(transaction._id);
    }
}

async function handleDeleteTx(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        await requestJSON(`${API_BASE}/transaction/${id}`, { method: 'DELETE' });
        await loadTransactions(currentUser?._id);
    } catch (err) {
        alert('Failed to delete transaction: ' + err.message);
    }
}

// ----------------- AI NATURAL LANGUAGE PARSER -----------------
async function handleAiParsePreview() {
    const text = aiInputText.value.trim();
    if (!text) {
        alert('Please enter a sentence describing your expense or income.');
        return;
    }

    aiParseOnlyBtn.disabled = true;
    aiParseOnlyBtn.textContent = 'Parsing...';

    try {
        const json = await requestJSON(`${API_BASE}/ai/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser?._id, text })
        });
        parsedTransaction = json.data;
        const d = parsedTransaction;
        aiParseResult.classList.remove('hidden');
        aiParseResult.innerHTML = `
            <div>
                <strong>Detected:</strong> ${escapeHTML(d.type).toUpperCase()} of <strong>₹${escapeHTML(d.amount)}</strong>
                in <em>${escapeHTML(d.category)}</em> — ${escapeHTML(d.description)}
                <span class="badge ${d.source === 'gemini-ai' ? 'badge-income' : 'badge-expense'}">${escapeHTML(d.source || 'rule-based-fallback')}</span>
            </div>
            <button class="btn btn-ai btn-sm" data-action="save-parsed" ${currentUser ? '' : 'disabled'}>Save This</button>
        `;
    } catch (err) {
        alert('AI Parse error: ' + err.message);
    } finally {
        aiParseOnlyBtn.disabled = false;
        aiParseOnlyBtn.textContent = 'Preview Parse';
    }
}

async function handleParsedTransactionAction(event) {
    if (!event.target.closest('button[data-action="save-parsed"]') || !parsedTransaction) return;
    if (!currentUser) {
        accountStatus.textContent = 'Log in before saving a transaction.';
        return;
    }
    try {
        await requestJSON(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                amount: parsedTransaction.amount,
                type: parsedTransaction.type,
                category: parsedTransaction.category,
                description: parsedTransaction.description,
                date: parsedTransaction.date || new Date()
            })
        });
        aiParseResult.classList.add('hidden');
        aiInputText.value = '';
        parsedTransaction = null;
        await loadTransactions(currentUser._id);
    } catch (err) {
        alert('Failed to save parsed transaction: ' + err.message);
    }
}

async function handleAiAutoLog() {
    const text = aiInputText.value.trim();
    if (!text) {
        alert('Please enter transaction text (e.g. "Dinner with friends ₹450")');
        return;
    }
    if (!currentUser) {
        alert('Please select or create an active user account.');
        return;
    }

    aiAutoLogBtn.disabled = true;
    aiAutoLogBtn.textContent = '✨ Processing AI...';

    try {
        await requestJSON(`${API_BASE}/ai/auto-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                text
            })
        });
        aiInputText.value = '';
        aiParseResult.classList.add('hidden');
        parsedTransaction = null;
        await loadTransactions(currentUser._id);
    } catch (err) {
        alert('Auto-log error: ' + err.message);
    } finally {
        aiAutoLogBtn.disabled = !currentUser;
        aiAutoLogBtn.textContent = '✨ Auto-Log with AI';
    }
}

// ----------------- AI INSIGHTS -----------------
async function handleGenerateInsights() {
    if (!currentUser) return;

    generateInsightsBtn.disabled = true;
    generateInsightsBtn.textContent = 'Analyzing...';
    insightsContent.innerHTML = `<p class="text-muted">🧠 AI is analyzing your cash flow and budget discipline...</p>`;

    try {
        const json = await requestJSON(`${API_BASE}/ai/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });
        if (json.data) {
            const aiAnalysis = json.data.aiAnalysis || {};
            const engine = json.data.engine || 'rule-based-fallback';
            const alerts = Array.isArray(aiAnalysis.alerts) ? aiAnalysis.alerts : [];
            const savingTips = Array.isArray(aiAnalysis.savingTips) ? aiAnalysis.savingTips : [];
            const observations = Array.isArray(aiAnalysis.topSpendingObservations)
                ? aiAnalysis.topSpendingObservations
                : [];

            aiStatusText.textContent = `AI Engine: ${engine}`;

            let alertsHtml = '';
            if (alerts.length > 0) {
                alertsHtml = `
                    <div class="insight-section">
                        <div class="insight-title" style="color: var(--danger)">⚠️ Priority Alerts</div>
                        <ul class="insight-list">
                            ${alerts.map(a => `<li class="insight-item alert-item">${escapeHTML(a)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            let tipsHtml = '';
            if (savingTips.length > 0) {
                tipsHtml = `
                    <div class="insight-section">
                        <div class="insight-title">💡 Personalized Saving Recommendations</div>
                        <ul class="insight-list">
                            ${savingTips.map(t => `<li class="insight-item"><strong>Tip:</strong> ${escapeHTML(t)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            let obsHtml = '';
            if (observations.length > 0) {
                obsHtml = `
                    <div class="insight-section">
                        <div class="insight-title">📊 Spending Observations</div>
                        <ul class="insight-list">
                            ${observations.map(o => `<li class="insight-item">${escapeHTML(o)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            insightsContent.innerHTML = `
                <div class="health-score-badge">
                    <div class="score-circle">${escapeHTML(aiAnalysis.healthScore ?? 80)}</div>
                    <div>
                        <h4>Financial Health Score</h4>
                        <p class="text-muted">${escapeHTML(aiAnalysis.statusSummary)}</p>
                        <small>Status: <strong>${escapeHTML(aiAnalysis.budgetStatus)}</strong> | Engine: <code>${escapeHTML(engine)}</code></small>
                    </div>
                </div>
                ${alertsHtml}
                ${obsHtml}
                ${tipsHtml}
                <div class="insight-section">
                    <div class="insight-title">🔮 Month-End Forecast</div>
                    <p style="font-size: 0.88rem; color: var(--text-muted);">${escapeHTML(aiAnalysis.forecast)}</p>
                </div>
            `;
        }
    } catch (err) {
        insightsContent.textContent = `Error generating insights: ${err.message}`;
    } finally {
        generateInsightsBtn.disabled = !currentUser;
        generateInsightsBtn.textContent = 'Analyze Now';
    }
}

// ----------------- AI CHAT ADVISOR -----------------
async function handleChatSubmit(e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendChatBubble('user', message);
    chatInput.value = '';

    const loadingBubble = appendChatBubble('assistant', 'AI Financial Advisor is thinking...');
    const previousHistory = chatHistory.slice();
    const chatSendBtn = document.getElementById('chatSendBtn');
    chatSendBtn.disabled = true;

    try {
        const json = await requestJSON(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser?._id,
                message,
                history: previousHistory
            })
        });
        loadingBubble.textContent = json.data.reply;
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: json.data.reply });
    } catch (err) {
        loadingBubble.textContent = 'Error connecting to AI advisor: ' + err.message;
    } finally {
        chatSendBtn.disabled = false;
    }
}

function appendChatBubble(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = content;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
}

// ----------------- MANUAL TRANSACTION -----------------
async function handleManualTxSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
        type: document.getElementById('modalType').value,
        amount: parseFloat(document.getElementById('modalAmount').value),
        category: document.getElementById('modalCategory').value.trim(),
        description: document.getElementById('modalDesc').value.trim(),
        date: document.getElementById('modalDate').value
    };

    try {
        const isEditing = Boolean(editingTransactionId);
        const url = isEditing
            ? `${API_BASE}/transaction/${editingTransactionId}`
            : `${API_BASE}/transaction`;
        await requestJSON(url, {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, ...(!isEditing ? { userId: currentUser._id } : {}) })
        });
        closeTransactionModal();
        await loadTransactions(currentUser._id);
    } catch (err) {
        alert(`Failed to ${editingTransactionId ? 'update' : 'save'} transaction: ${err.message}`);
    }
}
