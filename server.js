import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import router from './router/router.js';
import connectDB from './db/db.js';

const app = express();
const PORT = process.env.PORT || 3000;
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicDirectory));

// Routes
app.use('/api', router);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Budget Tracker & AI Assistant API is healthy',
        timestamp: new Date().toISOString()
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`API endpoints at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Unable to start server:', error.message);
        process.exitCode = 1;
    }
};

startServer();

export default app;
