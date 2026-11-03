import express from 'express';
import {
    login,
    signup,
    getProfile,
    updateProfile,
    logout
} from '../controllers/userController.js';
import {
    addTransaction,
    getTransactions,
    deleteTransaction,
    updateTransaction
} from '../controllers/transactionController.js';
import {
    parseTransaction,
    autoLogTransaction,
    getInsights,
    chatAdvisor
} from '../controllers/aiController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// User Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/logout', requireAuth, logout);

// Transaction Routes
router.post('/transaction', requireAuth, addTransaction);
router.get('/transaction/:userId', requireAuth, getTransactions);
router.delete('/transaction/:id', requireAuth, deleteTransaction);
router.put('/transaction/:id', requireAuth, updateTransaction);

// AI Features Routes
router.post('/ai/parse', requireAuth, parseTransaction);
router.post('/ai/auto-log', requireAuth, autoLogTransaction);
router.post('/ai/insights', requireAuth, getInsights);
router.post('/ai/chat', requireAuth, chatAdvisor);

export default router;
