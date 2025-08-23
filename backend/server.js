const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

// Contract configuration
const CONTRACT_CONFIG = {
    zetaLendAI: "0x353e2E29aF2864E83F7C7001CB3bF7a6E9105021",
    gateway: "0xfEDD7A6e3Ef1cC470fbfbF955a22D793dDC0F44E",
    network: "zetachain_testnet",
    chainId: 7001,
    explorer: "https://athens.explorer.zetachain.com"
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: '🚀 ZetaLend AI Backend Running',
        contract: CONTRACT_CONFIG.zetaLendAI,
        network: CONTRACT_CONFIG.network,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Get contract configuration
app.get('/api/contract', (req, res) => {
    res.json({ success: true, data: CONTRACT_CONFIG });
});

// Mock AI risk assessment
app.post('/api/ai/assess-risk', (req, res) => {
    const { positionData } = req.body;

    setTimeout(() => {
        const ltv = positionData?.borrowed / positionData?.collateral * 100 || 65;

        const mockRisk = {
            riskScore: Math.min(Math.floor(ltv * 1.2), 100),
            liquidationProbability: Math.max(Math.floor((ltv - 60) * 2), 10),
            recommendedLTV: Math.max(Math.floor(75 - ltv * 0.5), 40),
            optimizedChain: 137, // Polygon
            riskFactors: [
                'Market volatility detected',
                'Cross-chain exposure considered',
                ltv > 70 ? 'High LTV ratio detected' : 'Moderate LTV ratio'
            ],
            recommendations: [
                ltv > 70 ? 'Consider reducing position' : 'Position within safe range',
                'Monitor cross-chain bridge health',
                'Set up automated alerts'
            ],
            aiConfidence: Math.floor(Math.random() * 20) + 80,
            timestamp: new Date().toISOString()
        };

        res.json({ success: true, data: mockRisk });
    }, 1000);
});

// Mock yield optimization
app.post('/api/ai/optimize-yield', (req, res) => {
    res.json({
        success: true,
        data: {
            totalExpectedAPY: 7.2,
            allocations: [
                { chain: 'ethereum', percentage: 40, expectedAPY: 5.5, risk: 'low' },
                { chain: 'polygon', percentage: 35, expectedAPY: 8.2, risk: 'medium' },
                { chain: 'bsc', percentage: 25, expectedAPY: 7.8, risk: 'medium' }
            ],
            improvement: '+1.8% APY increase',
            riskReduction: '-15% overall risk',
            timestamp: new Date().toISOString()
        }
    });
});

// Mock liquidation prediction
app.get('/api/ai/liquidation-risk/:positionId', (req, res) => {
    const { positionId } = req.params;

    res.json({
        success: true,
        data: {
            positionId,
            liquidationProbability: Math.floor(Math.random() * 30) + 10,
            healthFactor: (Math.random() * 2 + 1).toFixed(2),
            timeToLiquidation: Math.floor(Math.random() * 168) + 24,
            recommendation: 'Monitor closely',
            factors: ['Price volatility', 'Market conditions'],
            timestamp: new Date().toISOString()
        }
    });
});

app.listen(PORT, () => {
    console.log('🚀 ZetaLend AI Backend Running');
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📱 Contract: ${CONTRACT_CONFIG.zetaLendAI}`);
    console.log(`🌐 Network: ${CONTRACT_CONFIG.network}`);
    console.log(`🔍 Explorer: ${CONTRACT_CONFIG.explorer}/address/${CONTRACT_CONFIG.zetaLendAI}`);
    console.log('✅ All APIs ready!');
});
