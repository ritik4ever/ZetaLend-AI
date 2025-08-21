const express = require('express');
const router = express.Router();
const aiService = require('../services/ai-service');

// Real AI risk assessment endpoint
router.post('/assess-risk', async (req, res) => {
    try {
        const { positionData } = req.body;

        if (!positionData) {
            return res.status(400).json({
                error: 'Position data is required'
            });
        }

        const assessment = await aiService.assessRisk(positionData);

        res.json({
            success: true,
            data: assessment,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI assessment error:', error);
        res.status(500).json({
            error: 'AI assessment failed',
            details: error.message
        });
    }
});

// Yield optimization endpoint
router.post('/optimize-yield', async (req, res) => {
    try {
        const { positions } = req.body;

        // AI-powered yield optimization logic here
        const optimization = {
            currentYield: 7.2,
            optimizedYield: 9.8,
            recommendations: [
                'Move 30% of position to Polygon for higher yields',
                'Consider staking rewards on ZetaChain',
                'Rebalance weekly based on market conditions'
            ],
            estimatedGains: '+36% APY improvement'
        };

        res.json({
            success: true,
            data: optimization
        });
    } catch (error) {
        res.status(500).json({
            error: 'Yield optimization failed'
        });
    }
});

module.exports = router;