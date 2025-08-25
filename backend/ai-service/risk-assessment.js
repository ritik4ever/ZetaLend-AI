const GeminiAIService = require('./gemini-integration');

class RiskAssessmentService {
    constructor() {
        this.gemini = new GeminiAIService();
        this.riskCache = new Map();
    }

    //  AI FEATURE: Real-time risk monitoring
    async assessPositionRisk(positionId, positionData) {
        const cacheKey = `${positionId}-${Date.now() - (Date.now() % 300000)}`; // 5min cache

        if (this.riskCache.has(cacheKey)) {
            return this.riskCache.get(cacheKey);
        }

        try {
            // Enhance position data with market data
            const enhancedData = await this._enrichPositionData(positionData);

            // Get AI assessment
            const aiAssessment = await this.gemini.assessCrossChainRisk(enhancedData);

            // Calculate composite risk score
            const compositeRisk = this._calculateCompositeRisk(aiAssessment, enhancedData);

            this.riskCache.set(cacheKey, compositeRisk);
            return compositeRisk;

        } catch (error) {
            console.error('Risk assessment error:', error);
            return this._getDefaultRiskAssessment(positionData);
        }
    }

    async _enrichPositionData(positionData) {
        // Simulate fetching real market data
        const marketData = {
            volatility: await this._getAssetVolatility(positionData.collateralToken),
            bridgeHealth: await this._getBridgeHealth(positionData.collateralChain, positionData.borrowChain),
            liquidityDepth: await this._getLiquidityDepth(positionData.borrowToken, positionData.borrowChain),
            correlationRisk: await this._getCorrelationRisk(positionData.collateralToken, positionData.borrowToken)
        };

        return {
            ...positionData,
            ...marketData
        };
    }

    _calculateCompositeRisk(aiAssessment, marketData) {
        const weights = {
            aiRisk: 0.4,
            ltvRisk: 0.25,
            volatilityRisk: 0.15,
            bridgeRisk: 0.1,
            liquidityRisk: 0.1
        };

        const risks = {
            aiRisk: aiAssessment.riskScore,
            ltvRisk: Math.min(100, marketData.ltv * 1.2),
            volatilityRisk: Math.min(100, marketData.volatility * 50),
            bridgeRisk: 100 - marketData.bridgeHealth,
            liquidityRisk: Math.max(0, 50 - marketData.liquidityDepth)
        };

        const compositeScore = Object.keys(weights).reduce((score, key) => {
            return score + (risks[key] * weights[key]);
        }, 0);

        return {
            ...aiAssessment,
            compositeRiskScore: Math.round(compositeScore),
            riskBreakdown: risks,
            marketData
        };
    }

    async _getAssetVolatility(asset) {
        // Simulate volatility data (in production, fetch from price APIs)
        const volatilities = {
            'ETH': 0.65,
            'BTC': 0.55,
            'USDC': 0.02,
            'USDT': 0.02
        };
        return volatilities[asset] || 0.3;
    }

    async _getBridgeHealth(chainA, chainB) {
        // Simulate bridge health score (in production, check bridge status APIs)
        return Math.random() * 20 + 80; // 80-100 range
    }

    async _getLiquidityDepth(asset, chain) {
        // Simulate liquidity depth (in production, fetch from DEX APIs)
        return Math.random() * 50 + 50; // 50-100 range
    }

    async _getCorrelationRisk(assetA, assetB) {
        // Simulate correlation risk
        if (assetA === assetB) return 1.0;
        if ((assetA.includes('USD') && assetB.includes('USD'))) return 0.95;
        return Math.random() * 0.6 + 0.2; // 0.2-0.8 range
    }

    _getDefaultRiskAssessment(positionData) {
        return {
            riskScore: 50,
            liquidationProbability: 25,
            recommendedLTV: 60,
            compositeRiskScore: 50,
            riskFactors: ['Limited data available'],
            recommendations: ['Monitor position closely']
        };
    }
}


module.exports = RiskAssessmentService;
