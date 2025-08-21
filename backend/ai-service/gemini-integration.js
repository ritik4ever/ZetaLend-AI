const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
    constructor() {
        // Check if API key is available
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.log('⚠️ Gemini API key not configured. Using mock AI responses.');
            this.mockMode = true;
            return;
        }

        try {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Updated model name
            this.mockMode = false;
            console.log('✅ Gemini AI initialized successfully');
        } catch (error) {
            console.log('⚠️ Gemini AI initialization failed, using mock mode:', error.message);
            this.mockMode = true;
        }
    }

    async assessCrossChainRisk(positionData) {
        if (this.mockMode) {
            return this.getMockRiskAssessment(positionData);
        }

        try {
            const prompt = `Assess the risk of this cross-chain lending position:
            
            Position Data: ${JSON.stringify(positionData)}
            
            Provide a JSON response with:
            - riskScore (0-100)
            - liquidationProbability (0-100)
            - recommendedLTV (0-100)
            - riskFactors (array of strings)
            - recommendations (array of strings)
            
            Consider cross-chain exposure, market volatility, and asset correlation.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Try to extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.log('Gemini AI Error:', error.message);
            return this.getMockRiskAssessment(positionData);
        }
    }

    getMockRiskAssessment(positionData) {
        const ltv = positionData.borrowed / positionData.collateral * 100;
        
        let riskScore = Math.min(ltv * 1.2, 100);
        let liquidationProbability = Math.max((ltv - 60) * 2, 5);
        let recommendedLTV = Math.max(75 - riskScore * 0.5, 40);

        return {
            riskScore: Math.round(riskScore),
            liquidationProbability: Math.round(liquidationProbability),
            recommendedLTV: Math.round(recommendedLTV),
            riskFactors: [
                'Cross-chain bridge risk',
                'Market volatility exposure',
                ltv > 70 ? 'High LTV ratio' : 'Moderate LTV ratio'
            ],
            recommendations: [
                ltv > 70 ? 'Consider reducing position size' : 'Position within acceptable risk',
                'Monitor cross-chain bridge health',
                'Set up automated liquidation alerts'
            ]
        };
    }

    async optimizeYield(portfolioData) {
        if (this.mockMode) {
            return this.getMockYieldOptimization(portfolioData);
        }

        try {
            const prompt = `Optimize yield for this DeFi portfolio across chains:
            
            Portfolio: ${JSON.stringify(portfolioData)}
            
            Provide JSON with:
            - totalExpectedAPY (number)
            - allocations (array of {chain, percentage, expectedAPY, risk})
            - improvement (string)
            - riskReduction (string)`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.log('Gemini Yield Optimization Error:', error.message);
            return this.getMockYieldOptimization(portfolioData);
        }
    }

    getMockYieldOptimization(portfolioData) {
        return {
            totalExpectedAPY: 7.2,
            allocations: [
                { chain: 'ethereum', percentage: 40, expectedAPY: 5.5, risk: 'low' },
                { chain: 'polygon', percentage: 35, expectedAPY: 8.2, risk: 'medium' },
                { chain: 'bsc', percentage: 25, expectedAPY: 7.8, risk: 'medium' }
            ],
            improvement: '+1.8% APY increase',
            riskReduction: '-15% overall risk'
        };
    }
}

module.exports = GeminiAIService;
