import {
    parseTransactionText,
    generateSpendingInsights,
    chatWithFinancialAssistant
} from '../services/aiService.js';
import Transaction from '../models/TransactionModel.js';
import User from '../models/userModels.js';
import Category from '../models/CategoryModel.js';

/**
 * Controller to parse natural language text into transaction data
 */
export const parseTransaction = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Text is required to parse transaction.'
            });
        }

        const parsed = await parseTransactionText(text);
        return res.status(200).json({
            success: true,
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
        const { userId, text } = req.body;
        if (!userId || !text) {
            return res.status(400).json({
                success: false,
                message: 'userId and text are required.'
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
            userId,
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
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required for insights.'
            });
        }

        const user = await User.findById(userId);
        const transactions = await Transaction.find({ userId }).sort({ date: -1 });

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
        const { userId, message, history = [] } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required for chat.'
            });
        }

        let user = null;
        let transactions = [];

        if (userId) {
            user = await User.findById(userId);
            transactions = await Transaction.find({ userId }).sort({ date: -1 });
        }

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

