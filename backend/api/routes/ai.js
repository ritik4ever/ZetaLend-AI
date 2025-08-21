const express = require('express');
const GeminiAIService = require('../../ai-service/gemini-integration');
const RiskAssessmentService = require('../../ai-service/risk-assessment');

const router = express.Router();
const geminiService = new GeminiAIService();
const riskService = new RiskAssessmentService();

// 🤖 AI FEATURE: Risk Assessment API
router.post('/assess-risk', async (req, res) => {
    try {
        const { positionId, positionData } = req.body;

        const riskAssessment = await riskService.assessPositionRisk(positionId, positionData);

        res.json({
            success: true,
            data: riskAssessment,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Risk assessment error:', error);
        res.status(500).json({
            success: false,
            error: 'Risk assessment failed',
            message: error.message
        });
    }
});

// 🤖 AI FEATURE: Yield Optimization API
router.post('/optimize-yield', async (req, res) => {
    try {
        const portfolioData = req.body;

        const optimization = await geminiService.optimizeYieldStrategy(portfolioData);

        res.json({
            success: true,
            data: optimization,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Yield optimization error:', error);
        res.status(500).json({
            success: false,
            error: 'Yield optimization failed',
            message: error.message
        });
    }
});

// 🤖 AI FEATURE: Liquidation Prediction API
router.post('/predict-liquidation', async (req, res) => {
    try {
        const positionData = req.body;

        const prediction = await geminiService.predictLiquidation(positionData);

        res.json({
            success: true,
            data: prediction,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Liquidation prediction error:', error);
        res.status(500).json({
            success: false,
            error: 'Liquidation prediction failed',
            message: error.message
        });
    }
});

// 🤖 AI FEATURE: Automated Position Monitoring
router.post('/monitor-positions', async (req, res) => {
    try {
        // In production, this would fetch all active positions from the blockchain
        const mockPositions = [
            {
                id: 1,
                user: '0x123...',
                collateralAmount: 1000,
                borrowedAmount: 600,
                collateralToken: 'ETH',
                borrowToken: 'USDC',
                ltv: 60
            }
        ];

        const monitoringResults = [];

        for (const position of mockPositions) {
            const riskAssessment = await riskService.assessPositionRisk(position.id, position);

            // Auto-alert if high risk
            if (riskAssessment.liquidationProbability > 80) {
                console.log(`🚨 High liquidation risk for position ${position.id}`);
                // In production, send notifications/alerts
            }

            monitoringResults.push({
                positionId: position.id,
                riskScore: riskAssessment.compositeRiskScore,
                liquidationProbability: riskAssessment.liquidationProbability,
                action: riskAssessment.liquidationProbability > 80 ? 'ALERT' : 'MONITOR'
            });
        }

        res.json({
            success: true,
            data: {
                monitoredPositions: monitoringResults.length,
                highRiskPositions: monitoringResults.filter(p => p.action === 'ALERT').length,
                results: monitoringResults
            }
        });
    } catch (error) {
        console.error('Position monitoring error:', error);
        res.status(500).json({
            success: false,
            error: 'Position monitoring failed',
            message: error.message
        });
    }
});

// 🤖 AI FEATURE: Portfolio Rebalancing Recommendations
router.post('/rebalance-portfolio', async (req, res) => {
    try {
        const { userId, currentPositions, riskTolerance } = req.body;

        // Calculate current portfolio metrics
        const portfolioData = {
            assets: currentPositions,
            chains: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
            riskTolerance: riskTolerance || 'medium',
            targetAPY: 8.0
        };

        const rebalanceStrategy = await geminiService.optimizeYieldStrategy(portfolioData);

        res.json({
            success: true,
            data: {
                currentPortfolio: currentPositions,
                recommendedAllocations: rebalanceStrategy.allocations,
                expectedAPYIncrease: rebalanceStrategy.totalExpectedAPY - 6.5, // Current APY
                riskAdjustment: rebalanceStrategy.riskScore,
                rebalanceActions: _generateRebalanceActions(currentPositions, rebalanceStrategy.allocations)
            }
        });
    } catch (error) {
        console.error('Portfolio rebalancing error:', error);
        res.status(500).json({
            success: false,
            error: 'Portfolio rebalancing failed',
            message: error.message
        });
    }
});

function _generateRebalanceActions(current, recommended) {
    // Simplified rebalancing logic
    return [
        {
            action: 'INCREASE',
            chain: 'polygon',
            asset: 'USDC',
            amount: 500,
            reason: 'Higher yield opportunity'
        },
        {
            action: 'DECREASE',
            chain: 'ethereum',
            asset: 'ETH',
            amount: 200,
            reason: 'Risk mitigation'
        }
    ];
}

module.exports = router;