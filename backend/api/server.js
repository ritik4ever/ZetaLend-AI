const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const lendingRoutes = require('./routes/lending');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/lending', lendingRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get(['/health', '/api/health'], (req, res) => {
    res.json({ status: 'ZetaLend AI Backend Running', timestamp: new Date().toISOString() });
});

// 🤖 AI FEATURE: Automated risk monitoring
cron.schedule('*/5 * * * *', async () => {
    console.log('Running automated risk assessment...');
    try {
        // This would monitor all active positions in production
        const response = await fetch('http://localhost:3001/api/ai/monitor-positions', {
            method: 'POST'
        });
        console.log('Risk monitoring completed');
    } catch (error) {
        console.error('Risk monitoring failed:', error);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 ZetaLend AI Backend running on port ${PORT}`);
    console.log(`🤖 AI Risk Monitoring: Active`);
    console.log(`🔗 Cross-Chain Gateway: Ready`);
});