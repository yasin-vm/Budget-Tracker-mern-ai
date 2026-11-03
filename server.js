import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import router from './router/router.js';
import connectDB from './db/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api', router);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Budget Tracker & AI Assistant API is healthy',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API endpoints at http://localhost:${PORT}/api`);
});

export default app;
