import { GoogleGenAI } from '@google/genai';

let aiClient = null;
let configuredApiKey = null;

function getAIClient() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey.toLowerCase() === 'your_gemini_api_key_here') {
        aiClient = null;
        configuredApiKey = null;
        return null;
    }
    if (!aiClient || configuredApiKey !== apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
        configuredApiKey = apiKey;
    }
    return aiClient;
}

/**
 * Categorization dictionary for rule-based fallback
 */
const CATEGORY_KEYWORDS = {
    Food: ['food', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe', 'tea', 'restaurant', 'pizza', 'burger', 'snack', 'grocery', 'groceries', 'supermarket', 'zomato', 'swiggy', 'mcdonalds'],
    Transportation: ['uber', 'ola', 'taxi', 'cab', 'bus', 'train', 'metro', 'flight', 'petrol', 'fuel', 'diesel', 'parking', 'toll'],
    Shopping: ['amazon', 'flipkart', 'clothes', 'shoes', 'dress', 'mall', 'electronics', 'gadget', 'myntra', 'purchase'],
    Utilities: ['electricity', 'water', 'gas', 'wifi', 'internet', 'recharge', 'mobile', 'bill', 'rent', 'broadband'],
    Entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'hotstar', 'prime', 'game', 'concert', 'outing'],
    Health: ['doctor', 'medicine', 'hospital', 'pharmacy', 'clinic', 'dentist', 'gym', 'fitness', 'medical'],
    Salary: ['salary', 'stipend', 'bonus', 'freelance', 'paycheck', 'dividend', 'profit', 'interest', 'earned', 'credited'],
    Education: ['book', 'course', 'tuition', 'udemy', 'coursera', 'exam', 'fees', 'school', 'college']
};

/**
 * Fallback parser when Gemini API key is not configured or offline
 */
function ruleBasedParseTransaction(text) {
    const lower = text.toLowerCase();
    
    // Determine type: income vs expense
    let type = 'expense';
    const incomeSignals = ['salary', 'credited', 'received', 'earned', 'income', 'stipend', 'refund', 'bonus', 'cashback', 'gift received'];
    if (incomeSignals.some(signal => lower.includes(signal))) {
        type = 'income';
    }

    // Extract amount
    // Matches patterns like ₹500, Rs. 500, $50, 500rs, 500.50
    let amount = null;
    const amountRegex = /(?:₹|rs\.?|\$)?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:rs|inr|usd)?/i;
    const matches = text.match(amountRegex);
    if (matches && matches[1]) {
        amount = parseFloat(matches[1].replace(/,/g, ''));
    }

    // Detect category
    let detectedCategory = type === 'income' ? 'Salary' : 'Other';
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lower.includes(kw))) {
            detectedCategory = category;
            break;
        }
    }

    return {
        amount: amount || 0,
        type,
        category: detectedCategory,
        description: text.trim(),
        date: new Date().toISOString()
    };
}

/**
 * Parse natural language text into a structured transaction
 */
export async function parseTransactionText(text) {
    const client = getAIClient();
    
    if (client) {
        try {
            const prompt = `You are a financial transaction parser.
Extract the transaction details from the following natural language text:
"${text}"

Respond ONLY with a valid JSON object matching this schema, without any markdown formatting or code blocks:
{
  "amount": number (required, extract numeric value only),
  "type": "income" or "expense" (required),
  "category": "Food" | "Transportation" | "Shopping" | "Utilities" | "Entertainment" | "Health" | "Salary" | "Education" | "Investment" | "Other",
  "description": string (clean summary of the transaction),
  "date": string (ISO 8601 date, default to current date if unspecified)
}`;

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const rawText = response.text ? response.text.trim() : '';
            const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(cleaned);
            const amount = Number(parsed.amount);
            const type = String(parsed.type || '').toLowerCase();
            if (!Number.isFinite(amount) || amount < 0 || !['income', 'expense'].includes(type)) {
                throw new Error('Gemini returned invalid transaction fields.');
            }
            const parsedDate = parsed.date ? new Date(parsed.date) : new Date();

            return {
                amount,
                type,
                category: typeof parsed.category === 'string' && parsed.category.trim()
                    ? parsed.category.trim()
                    : 'Other',
                description: typeof parsed.description === 'string' && parsed.description.trim()
                    ? parsed.description.trim()
                    : text.trim(),
                date: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
                source: 'gemini-ai'
            };
        } catch (error) {
            console.warn('Gemini parser failed, falling back to rule-based engine:', error.message);
        }
    }

    const fallbackResult = ruleBasedParseTransaction(text);
    return {
        ...fallbackResult,
        source: 'rule-based-fallback'
    };
}

/**
 * Generate financial insights and recommendations based on user transactions
 */
export async function generateSpendingInsights({ user, transactions }) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netSavings = totalIncome - totalExpense;
    const budgetLimit = user?.budgetLimit || 20000;
    const budgetUtilizationPct = budgetLimit > 0 ? ((totalExpense / budgetLimit) * 100).toFixed(1) : 0;

    // Spending by category
    const categoryTotals = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
        });

    const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    const summaryStats = {
        totalIncome,
        totalExpense,
        netSavings,
        budgetLimit,
        budgetUtilizationPct: Number(budgetUtilizationPct),
        transactionCount: transactions.length,
        topCategories
    };

    const client = getAIClient();
    if (client) {
        try {
            const prompt = `You are an expert personal financial advisor and AI budget analyst.
Analyze the following user's financial profile and recent transactions:

User Name: ${user?.name || 'User'}
Monthly Budget Limit: ₹${budgetLimit}
Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Net Savings: ₹${netSavings}
Budget Utilization: ${budgetUtilizationPct}%
Category Breakdown: ${JSON.stringify(topCategories)}
Recent 15 Transactions: ${JSON.stringify(transactions.slice(0, 15).map(t => ({ amount: t.amount, type: t.type, category: t.category, description: t.description, date: t.date })))}

Provide an insightful, encouraging financial report.
Return ONLY a valid JSON object without markdown fences, with these exact keys:
{
  "healthScore": number (1 to 100, reflecting financial discipline),
  "statusSummary": string (1-2 sentences summarizing their current financial standing),
  "budgetStatus": "Under Budget" | "Near Limit" | "Exceeded",
  "alerts": array of strings (urgent warnings if approaching limit or high single spends),
  "topSpendingObservations": array of strings (2-3 observations about where money is going),
  "savingTips": array of strings (3 actionable, personalized recommendations to save more),
  "forecast": string (prediction for the remainder of the month)
}`;

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const rawText = response.text ? response.text.trim() : '';
            const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
            const aiData = JSON.parse(cleaned);

            return {
                stats: summaryStats,
                aiAnalysis: aiData,
                engine: 'gemini-2.5-flash'
            };
        } catch (error) {
            console.warn('Gemini insights generation failed, using statistical fallback:', error.message);
        }
    }

    // Resilient fallback logic
    let healthScore = 75;
    let budgetStatus = 'Under Budget';
    const alerts = [];
    const observations = [];
    const savingTips = [];

    if (totalExpense > budgetLimit) {
        budgetStatus = 'Exceeded';
        healthScore = 40;
        alerts.push(`You have exceeded your monthly budget of ₹${budgetLimit} by ₹${totalExpense - budgetLimit}!`);
    } else if (Number(budgetUtilizationPct) >= 80) {
        budgetStatus = 'Near Limit';
        healthScore = 60;
        alerts.push(`Warning: You have used ${budgetUtilizationPct}% of your allocated ₹${budgetLimit} budget.`);
    } else {
        healthScore = 85;
    }

    if (topCategories.length > 0) {
        observations.push(`Highest spending is in '${topCategories[0].category}' with ₹${topCategories[0].amount.toFixed(2)}.`);
        if (topCategories.length > 1) {
            observations.push(`Second highest category is '${topCategories[1].category}' with ₹${topCategories[1].amount.toFixed(2)}.`);
        }
    } else {
        observations.push('No expense transactions recorded yet.');
    }

    savingTips.push('Review recurring subscriptions and utility bills to trim avoidable monthly charges.');
    savingTips.push('Try the 50/30/20 rule: 50% needs, 30% wants, and 20% savings and debt repayment.');
    savingTips.push('Set mini weekly caps to avoid front-loading your budget early in the month.');

    return {
        stats: summaryStats,
        aiAnalysis: {
            healthScore,
            statusSummary: `You have spent ₹${totalExpense} out of your ₹${budgetLimit} limit (${budgetUtilizationPct}% utilized).`,
            budgetStatus,
            alerts,
            topSpendingObservations: observations,
            savingTips,
            forecast: totalExpense > budgetLimit ? 'Spending is above target pace. Immediate cutbacks advised.' : 'Spending is within current targets.'
        },
        engine: 'rule-based-fallback'
    };
}

/**
 * Chat with AI Budget Assistant with transaction & user context
 */
export async function chatWithFinancialAssistant({ user, transactions, userMessage, conversationHistory = [] }) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const budgetLimit = user?.budgetLimit || 20000;
    const balance = totalIncome - totalExpense;

    const categoryTotals = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const cat = t.category || 'Other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount || 0);
        });

    const client = getAIClient();
    if (client) {
        try {
            const systemContext = `You are a helpful, professional, and friendly AI Financial Assistant embedded inside a MERN Budget Tracker.
User Details:
- Name: ${user?.name || 'User'}
- Budget Limit: ₹${budgetLimit}
- Total Income: ₹${totalIncome}
- Total Expenses: ₹${totalExpense}
- Current Net Savings/Balance: ₹${balance}
- Category Expenses: ${JSON.stringify(categoryTotals)}
- Recent Transactions: ${JSON.stringify(transactions.slice(0, 10).map(t => ({ amount: t.amount, type: t.type, category: t.category, desc: t.description, date: t.date })))}

Answer the user's questions clearly, giving specific figures based on their financial data when asked. Keep answers concise, actionable, and encouraging.`;

            const historyText = conversationHistory
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n');

            const fullPrompt = `${systemContext}\n\nConversation History:\n${historyText}\nUser: ${userMessage}\nAssistant:`;

            const response = await client.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });

            return {
                reply: response.text ? response.text.trim() : 'I am here to help you manage your budget!',
                engine: 'gemini-2.5-flash'
            };
        } catch (error) {
            console.warn('Gemini chat failed, using fallback responder:', error.message);
        }
    }

    // Rule-based conversational fallback
    const lower = userMessage.toLowerCase();
    let reply = `Here is your current financial snapshot: Total income is ₹${totalIncome}, total expenses are ₹${totalExpense}, leaving you with a balance of ₹${balance}. Your monthly budget limit is ₹${budgetLimit}.`;

    if (lower.includes('afford') || lower.includes('buy')) {
        reply = `Your current balance is ₹${balance} and your budget limit is ₹${budgetLimit} (spent: ₹${totalExpense}). If the purchase fits comfortably within your remaining budget of ₹${Math.max(0, budgetLimit - totalExpense)}, you can consider it!`;
    } else if (lower.includes('food') || lower.includes('eat') || lower.includes('restaurant')) {
        const foodSpend = categoryTotals['Food'] || 0;
        reply = `You have spent ₹${foodSpend} on Food so far.`;
    } else if (lower.includes('save') || lower.includes('tip') || lower.includes('reduce')) {
        reply = `Tip: Review your highest expense categories (currently: ${Object.keys(categoryTotals).join(', ') || 'none yet'}). Setting category-level caps will prevent budget overruns.`;
    }

    return {
        reply,
        engine: 'rule-based-fallback'
    };
}
