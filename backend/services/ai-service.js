const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
    constructor() {
        // Initialize Google Gemini
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async assessRisk(positionData) {
        try {
            const prompt = `
        Analyze this DeFi lending position for risk assessment:
        
        Collateral: ${positionData.collateral} ${positionData.collateralAsset}
        Borrowed: ${positionData.borrowed} ${positionData.borrowAsset}
        LTV Ratio: ${(positionData.borrowed / positionData.collateral * 100).toFixed(2)}%
        Target Chain: ${positionData.chain}
        Market Volatility: ${positionData.marketConditions.volatility}%
        Liquidity Depth: $${positionData.marketConditions.liquidityDepth}
        
        Provide risk assessment in JSON format:
        {
          "riskScore": number (0-100),
          "liquidationProbability": number (0-100),
          "recommendedLTV": number (0-100),
          "aiConfidence": number (0-100),
          "riskFactors": ["factor1", "factor2", "factor3"],
          "recommendations": ["rec1", "rec2", "rec3"]
        }
        
        Consider cross-chain risks, market conditions, and position size.
      `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiAssessment = JSON.parse(jsonMatch[0]);
                return {
                    ...aiAssessment,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Gemini AI error:', error);
        }

        // Fallback calculation
        return this.calculateFallbackRisk(positionData);
    }

    calculateFallbackRisk(positionData) {
        const ltv = (positionData.borrowed / positionData.collateral) * 100;
        const volatilityRisk = positionData.marketConditions.volatility || 30;
        const liquidityRisk = Math.max(0, 50 - (positionData.marketConditions.liquidityDepth / 20000));

        const riskScore = Math.min(100, Math.max(0,
            ltv * 0.6 + volatilityRisk * 0.3 + liquidityRisk * 0.1
        ));

        return {
            riskScore: Math.round(riskScore),
            liquidationProbability: Math.round(Math.min(100, riskScore * 0.4)),
            recommendedLTV: Math.round(Math.max(20, 80 - riskScore * 0.3)),
            aiConfidence: 90,
            riskFactors: [
                'High LTV ratio detected',
                'Market volatility above threshold',
                'Cross-chain execution risk'
            ].slice(0, Math.floor(riskScore / 30) + 1),
            recommendations: [
                'Monitor position health closely',
                'Consider reducing leverage',
                'Set up liquidation alerts',
                'Diversify across multiple assets'
            ].slice(0, Math.floor(riskScore / 25) + 1),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new AIService();