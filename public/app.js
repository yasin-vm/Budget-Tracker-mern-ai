const API_BASE = '/api';

// State
let currentUser = null;
let userList = [];
let transactions = [];
let chatHistory = [];

// DOM Elements
const userSelect = document.getElementById('userSelect');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const userAvatarEl = document.getElementById('userAvatar');
const quickCreateUserBtn = document.getElementById('quickCreateUserBtn');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const aiStatusText = document.getElementById('aiStatusText');

// Stats Elements
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const netBalanceEl = document.getElementById('netBalance');
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

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadUsers();
});

function setupEventListeners() {
    userSelect.addEventListener('change', (e) => {
        const found = userList.find(u => u._id === e.target.value);
        if (found) {
            setCurrentUser(found);
        }
    });

    quickCreateUserBtn.addEventListener('click', createDemoUser);
    refreshDataBtn.addEventListener('click', () => loadTransactions(currentUser?._id));

    // AI Transaction Logging
    aiAutoLogBtn.addEventListener('click', handleAiAutoLog);
    aiParseOnlyBtn.addEventListener('click', handleAiParsePreview);

    // AI Insights
    generateInsightsBtn.addEventListener('click', handleGenerateInsights);

    // AI Chat
    chatForm.addEventListener('submit', handleChatSubmit);
    clearChatBtn.addEventListener('click', () => {
        chatHistory = [];
        chatMessages.innerHTML = `
            <div class="chat-bubble assistant">
                Chat cleared. Ask me any financial or budget question!
            </div>
        `;
    });

    // Modal
    openNewTxModal.addEventListener('click', () => txModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => txModal.classList.add('hidden'));
    cancelModalBtn.addEventListener('click', () => txModal.classList.add('hidden'));
    manualTxForm.addEventListener('submit', handleManualTxSubmit);
}

// ----------------- USER MANAGEMENT -----------------
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
            userList = json.data;
            renderUserDropdown();
            setCurrentUser(userList[0]);
        } else {
            await createDemoUser();
        }
    } catch (err) {
        console.error('Error fetching users:', err);
        await createDemoUser();
    }
}

function renderUserDropdown() {
    userSelect.innerHTML = userList.map(u => `
        <option value="${u._id}">${u.name} (@${u.username || 'user'})</option>
    `).join('');
}

function setCurrentUser(user) {
    currentUser = user;
    userSelect.value = user._id;
    userNameEl.textContent = user.name || 'User';
    userEmailEl.textContent = user.email || 'user@example.com';
    userAvatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
    budgetLimitValEl.textContent = `₹${(user.budgetLimit || 20000).toLocaleString()}`;
    loadTransactions(user._id);
}

async function createDemoUser() {
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const demoPayload = {
        name: `Candidate Demo ${randomSuffix}`,
        dob: '2000-01-01',
        phone: 9000000000 + randomSuffix,
        email: `candidate${randomSuffix}@interview.com`,
        username: `candidate_${randomSuffix}`,
        password: 'Password123!',
        budgetLimit: 25000
    };

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(demoPayload)
        });
        const json = await res.json();
        if (json.success && json.data) {
            userList.push(json.data);
            renderUserDropdown();
            setCurrentUser(json.data);
            // Pre-seed a few sample transactions
            await seedSampleTransactions(json.data._id);
        }
    } catch (err) {
        console.error('Error creating demo user:', err);
    }
}

async function seedSampleTransactions(userId) {
    const samples = [
        { userId, type: 'income', amount: 45000, category: 'Salary', description: 'Monthly Tech Internship Stipend', date: new Date() },
        { userId, type: 'expense', amount: 3200, category: 'Food', description: 'Grocery supermarket haul', date: new Date() },
        { userId, type: 'expense', amount: 850, category: 'Transportation', description: 'Uber rides for client meeting', date: new Date() },
        { userId, type: 'expense', amount: 1499, category: 'Entertainment', description: 'Tech conference & streaming subs', date: new Date() }
    ];

    for (const sample of samples) {
        await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sample)
        });
    }
    await loadTransactions(userId);
}

// ----------------- TRANSACTIONS -----------------
async function loadTransactions(userId) {
    if (!userId) return;
    try {
        const res = await fetch(`${API_BASE}/transaction/${userId}`);
        const json = await res.json();
        if (json.success) {
            transactions = json.data || [];
            renderTransactions();
            calculateStats();
        }
    } catch (err) {
        console.error('Failed to load transactions:', err);
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
    const limit = currentUser?.budgetLimit || 20000;
    const pct = limit > 0 ? Math.min(100, Math.round((expenses / limit) * 100)) : 0;

    totalIncomeEl.textContent = `₹${income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    totalExpensesEl.textContent = `₹${expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    netBalanceEl.textContent = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    netBalanceEl.className = balance >= 0 ? 'stat-value text-green' : 'stat-value text-red';

    budgetProgressBar.style.width = `${pct}%`;
    if (pct >= 100) {
        budgetProgressBar.style.background = 'var(--danger)';
    } else if (pct >= 75) {
        budgetProgressBar.style.background = 'var(--warning)';
    } else {
        budgetProgressBar.style.background = 'var(--primary)';
    }

    budgetUtilText.textContent = `${pct}% of ₹${limit.toLocaleString()} budget used`;
}

function renderTransactions() {
    if (!transactions.length) {
        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No transactions found. Add one above!</td>
            </tr>
        `;
        return;
    }

    transactionList.innerHTML = transactions.map(t => {
        const isExp = t.type === 'expense';
        const formattedDate = new Date(t.date || t.createdAt).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `
            <tr>
                <td><span class="badge ${isExp ? 'badge-expense' : 'badge-income'}">${t.type}</span></td>
                <td><strong>${t.category}</strong></td>
                <td>${t.description || '-'}</td>
                <td class="text-muted">${formattedDate}</td>
                <td class="text-right ${isExp ? 'text-red' : 'text-green'} font-weight-bold">
                    ${isExp ? '-' : '+'}₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td class="text-center">
                    <button class="btn btn-text btn-sm" onclick="handleDeleteTx('${t._id}')" title="Delete">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function handleDeleteTx(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        const res = await fetch(`${API_BASE}/transaction/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) {
            loadTransactions(currentUser?._id);
        }
    } catch (err) {
        alert('Failed to delete transaction: ' + err.message);
    }
}
window.handleDeleteTx = handleDeleteTx;

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
        const res = await fetch(`${API_BASE}/ai/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const json = await res.json();
        if (json.success && json.data) {
            const d = json.data;
            aiParseResult.classList.remove('hidden');
            aiParseResult.innerHTML = `
                <div>
                    <strong>AI Detected:</strong> ${d.type.toUpperCase()} of <strong>₹${d.amount}</strong> 
                    in Category: <em>${d.category}</em> (${d.description}) 
                    <span class="badge ${d.source === 'gemini-ai' ? 'badge-income' : 'badge-expense'}">${d.source}</span>
                </div>
                <button class="btn btn-ai btn-sm" onclick="confirmParsedTx(${JSON.stringify(d).replace(/"/g, '&quot;')})">Save This</button>
            `;
        }
    } catch (err) {
        alert('AI Parse error: ' + err.message);
    } finally {
        aiParseOnlyBtn.disabled = false;
        aiParseOnlyBtn.textContent = 'Preview Parse';
    }
}

window.confirmParsedTx = async (parsed) => {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                amount: parsed.amount,
                type: parsed.type,
                category: parsed.category,
                description: parsed.description,
                date: parsed.date || new Date()
            })
        });
        const json = await res.json();
        if (json.success) {
            aiParseResult.classList.add('hidden');
            aiInputText.value = '';
            await loadTransactions(currentUser._id);
        }
    } catch (err) {
        alert('Failed to save parsed transaction: ' + err.message);
    }
};

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
        const res = await fetch(`${API_BASE}/ai/auto-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser._id,
                text
            })
        });
        const json = await res.json();
        if (json.success) {
            aiInputText.value = '';
            aiParseResult.classList.add('hidden');
            await loadTransactions(currentUser._id);
        } else {
            alert(json.message || 'Could not parse transaction.');
        }
    } catch (err) {
        alert('Auto-log error: ' + err.message);
    } finally {
        aiAutoLogBtn.disabled = false;
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
        const res = await fetch(`${API_BASE}/ai/insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });
        const json = await res.json();
        if (json.success && json.data) {
            const { stats, aiAnalysis, engine } = json.data;

            aiStatusText.textContent = `AI Engine: ${engine}`;

            let alertsHtml = '';
            if (aiAnalysis.alerts && aiAnalysis.alerts.length > 0) {
                alertsHtml = `
                    <div class="insight-section">
                        <div class="insight-title" style="color: var(--danger)">⚠️ Priority Alerts</div>
                        <ul class="insight-list">
                            ${aiAnalysis.alerts.map(a => `<li class="insight-item alert-item">${a}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            let tipsHtml = '';
            if (aiAnalysis.savingTips && aiAnalysis.savingTips.length > 0) {
                tipsHtml = `
                    <div class="insight-section">
                        <div class="insight-title">💡 Personalized Saving Recommendations</div>
                        <ul class="insight-list">
                            ${aiAnalysis.savingTips.map(t => `<li class="insight-item"><strong>Tip:</strong> ${t}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            let obsHtml = '';
            if (aiAnalysis.topSpendingObservations && aiAnalysis.topSpendingObservations.length > 0) {
                obsHtml = `
                    <div class="insight-section">
                        <div class="insight-title">📊 Spending Observations</div>
                        <ul class="insight-list">
                            ${aiAnalysis.topSpendingObservations.map(o => `<li class="insight-item">${o}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            insightsContent.innerHTML = `
                <div class="health-score-badge">
                    <div class="score-circle">${aiAnalysis.healthScore || 80}</div>
                    <div>
                        <h4>Financial Health Score</h4>
                        <p class="text-muted">${aiAnalysis.statusSummary}</p>
                        <small>Status: <strong>${aiAnalysis.budgetStatus}</strong> | Engine: <code>${engine}</code></small>
                    </div>
                </div>
                ${alertsHtml}
                ${obsHtml}
                ${tipsHtml}
                <div class="insight-section">
                    <div class="insight-title">🔮 Month-End Forecast</div>
                    <p style="font-size: 0.88rem; color: var(--text-muted);">${aiAnalysis.forecast}</p>
                </div>
            `;
        }
    } catch (err) {
        insightsContent.innerHTML = `<p class="text-red">Error generating insights: ${err.message}</p>`;
    } finally {
        generateInsightsBtn.disabled = false;
        generateInsightsBtn.textContent = 'Analyze Now';
    }
}

// ----------------- AI CHAT ADVISOR -----------------
async function handleChatSubmit(e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    // Append user message
    appendChatBubble('user', message);
    chatInput.value = '';

    chatHistory.push({ role: 'user', content: message });

    // Loading indicator
    const loadingBubble = appendChatBubble('assistant', '<em>AI Financial Advisor is thinking...</em>');

    try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser?._id,
                message,
                history: chatHistory
            })
        });
        const json = await res.json();
        if (json.success && json.data) {
            loadingBubble.innerHTML = json.data.reply.replace(/\n/g, '<br>');
            chatHistory.push({ role: 'assistant', content: json.data.reply });
        } else {
            loadingBubble.textContent = 'Sorry, could not process request: ' + (json.message || 'Unknown error');
        }
    } catch (err) {
        loadingBubble.textContent = 'Error connecting to AI advisor: ' + err.message;
    }
}

function appendChatBubble(role, htmlContent) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = htmlContent;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
}

// ----------------- MANUAL TRANSACTION -----------------
async function handleManualTxSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
        userId: currentUser._id,
        type: document.getElementById('modalType').value,
        amount: parseFloat(document.getElementById('modalAmount').value),
        category: document.getElementById('modalCategory').value.trim(),
        description: document.getElementById('modalDesc').value.trim(),
        date: new Date()
    };

    try {
        const res = await fetch(`${API_BASE}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            txModal.classList.add('hidden');
            manualTxForm.reset();
            await loadTransactions(currentUser._id);
        }
    } catch (err) {
        alert('Failed to save: ' + err.message);
    }
}

