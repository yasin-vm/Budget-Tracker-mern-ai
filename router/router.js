import express from 'express';
import {
    login,
    signup,
    getProfile,
    updateProfile,
    getAllUsers
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

const router = express.Router();

// User Routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/users', getAllUsers);
router.get('/profile/:userId', getProfile);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Transaction Routes
router.post('/transaction', addTransaction);
router.get('/transaction/:userId', getTransactions);
router.delete('/transaction/:id', deleteTransaction);
router.put('/transaction/:id', updateTransaction);

// AI Features Routes
router.post('/ai/parse', parseTransaction);
router.post('/ai/auto-log', autoLogTransaction);
router.post('/ai/insights', getInsights);
router.post('/ai/chat', chatAdvisor);

export default router;
