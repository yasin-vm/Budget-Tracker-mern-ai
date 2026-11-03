import {
    parseTransactionText,
    generateSpendingInsights,
    chatWithFinancialAssistant
} from '../services/aiService.js';
import Transaction from '../models/TransactionModel.js';
import Category from '../models/CategoryModel.js';

/**
 * Controller to parse natural language text into transaction data
 */
export const parseTransaction = async (req, res) => {
    try {
        const { text } = req.body;
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Text is required to parse transaction.'
            });
        }

        const parsed = await parseTransactionText(text);
        return res.status(200).json({
            success: true,
            userId: String(req.user._id),
            data: parsed
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Controller to parse natural language AND immediately create transaction
 */
export const autoLogTransaction = async (req, res) => {
    try {
        const { text } = req.body;
        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Non-empty text is required.'
            });
        }

        const parsed = await parseTransactionText(text);

        if (!parsed.amount || parsed.amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Could not detect a valid amount from text.',
                parsed
            });
        }

        const transaction = await Transaction.create({
            userId: req.user._id,
            amount: parsed.amount,
            type: parsed.type || 'expense',
            category: parsed.category || 'Other',
            description: parsed.description || text,
            date: parsed.date || new Date()
        });

        await Category.findOneAndUpdate(
            { name: parsed.category || 'Other' },
            { name: parsed.category || 'Other' },
            { upsert: true }
        );

        return res.status(201).json({
            success: true,
            message: 'Transaction auto-logged successfully via AI',
            data: transaction,
            parsed
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Controller to generate comprehensive AI budget & spending insights
 */
export const getInsights = async (req, res) => {
    try {
        const user = req.user;
        const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });

        const insights = await generateSpendingInsights({ user, transactions });

        return res.status(200).json({
            success: true,
            data: insights
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Controller for conversational AI Financial Assistant
 */
export const chatAdvisor = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message is required for chat.'
            });
        }

        const user = req.user;
        const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });

        const result = await chatWithFinancialAssistant({
            user,
            transactions,
            userMessage: message,
            conversationHistory: history
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
