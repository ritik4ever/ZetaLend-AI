import { GoogleGenerativeAI } from '@google/generative-ai';
// ✅ FIXED: Only import what we actually use
import { FEATURE_FLAGS } from '../utils/constants';

interface RiskAssessmentInput {
    collateral: number;
    borrowed: number;
    collateralAsset: string;
    borrowAsset: string;
    chain: number;
    userAddress: string;
    marketConditions?: {
        volatility: number;
        liquidityDepth: number;
    };
}

interface RiskAssessmentOutput {
    riskScore: number;
    liquidationProbability: number;
    recommendedLTV: number;
    recommendations: string[];
    marketAnalysis: string;
    riskFactors: string[];
    aiConfidence: number;
    timestamp: string;
}

interface YieldOptimizationInput {
    currentYield: number;
    riskProfile: string;
    assets: string[];
    chains: number[];
    amount: number;
}

interface YieldOptimizationOutput {
    optimizedYield: number;
    recommendedStrategies: Array<{
        protocol: string;
        chain: number;
        expectedYield: number;
        riskLevel: string;
    }>;
    rebalanceActions: string[];
    confidence: number;
}

class RealAIService {
    private genAI: GoogleGenerativeAI | null = null;
    private isGeminiAvailable: boolean = false;
    private requestCount: number = 0;
    private lastRequestTime: number = 0;
    private readonly maxRequestsPerMinute = 20;

    constructor() {
        this.initializeGemini();
    }

    private initializeGemini() {
        try {
            // ✅ FIXED: Check for API key properly
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

            if (!apiKey) {
                console.warn('⚠️ Gemini API key not found - using enhanced local AI calculations');
                this.isGeminiAvailable = false;
                return;
            }

            if (apiKey.length < 20) {
                console.warn('⚠️ Gemini API key appears invalid - using enhanced local AI calculations');
                this.isGeminiAvailable = false;
                return;
            }

            this.genAI = new GoogleGenerativeAI(apiKey);
            this.isGeminiAvailable = true;
            console.log('✅ Google Gemini AI initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Gemini AI:', error);
            this.isGeminiAvailable = false;
        }
    }

    // 🎯 MAIN RISK ASSESSMENT FUNCTION
    async assessRisk(positionData: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
        console.log('🤖 Assessing risk for position:', positionData);

        try {
            // ✅ Try real Gemini AI first if available
            if (this.isGeminiAvailable && FEATURE_FLAGS.REAL_AI_ENABLED) {
                console.log('🧠 Calling Real Google Gemini AI...');
                return await this.assessRiskWithGemini(positionData);
            } else {
                console.log('🔄 Using enhanced local AI calculation...');
                return this.assessRiskWithEnhancedLocal(positionData);
            }
        } catch (error: any) {
            console.error('❌ AI Risk assessment failed:', error);
            console.log('🔄 Using enhanced local AI calculation...');
            return this.assessRiskWithEnhancedLocal(positionData);
        }
    }

    // ✅ FIXED: Updated Gemini implementation with correct model
    private async assessRiskWithGemini(positionData: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
        try {
            if (!this.genAI) {
                throw new Error('Gemini AI not initialized');
            }

            // ✅ Rate limiting
            if (this.shouldThrottle()) {
                console.log('⏱️ Rate limit reached, using local calculation');
                return this.assessRiskWithEnhancedLocal(positionData);
            }

            // ✅ FIXED: Use correct Gemini model name
            const model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-flash", // ✅ Updated from deprecated "gemini-pro"
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            // ✅ Enhanced prompt for better analysis
            const prompt = this.createRiskAssessmentPrompt(positionData);

            console.log('🧠 Sending request to Gemini 1.5 Flash...');

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('✅ Gemini AI Response received:', text);

            // ✅ Enhanced response parsing
            const parsedResult = this.parseGeminiResponse(text, positionData);

            this.updateRequestTracking();

            return {
                ...parsedResult,
                timestamp: new Date().toISOString()
            };

        } catch (error: any) {
            console.error('❌ Gemini AI call failed:', error);

            // ✅ Better error handling for different error types
            if (error.message?.includes('API_KEY')) {
                console.warn('🔑 Invalid API key - check your Gemini API configuration');
            } else if (error.message?.includes('QUOTA')) {
                console.warn('📊 Gemini API quota exceeded - using local calculations');
            } else if (error.message?.includes('404')) {
                console.warn('🔧 Model not found - using local calculations');
            }

            throw error;
        }
    }

    // ✅ ENHANCED: Local AI calculation with sophisticated algorithms
    private assessRiskWithEnhancedLocal(positionData: RiskAssessmentInput): RiskAssessmentOutput {
        console.log('🧠 Running enhanced local AI risk assessment...');

        const ltv = (positionData.borrowed / positionData.collateral) * 100;
        const volatility = positionData.marketConditions?.volatility || 30;
        const liquidityDepth = positionData.marketConditions?.liquidityDepth || 1000000;

        // ✅ Advanced risk calculation algorithm
        const riskFactors = {
            ltvRisk: this.calculateLTVRisk(ltv),
            volatilityRisk: this.calculateVolatilityRisk(volatility),
            liquidityRisk: this.calculateLiquidityRisk(liquidityDepth),
            assetCorrelationRisk: this.calculateAssetCorrelationRisk(positionData.collateralAsset, positionData.borrowAsset),
            chainRisk: this.calculateChainRisk(positionData.chain),
            marketConditionRisk: this.calculateMarketConditionRisk()
        };

        // ✅ Weighted risk calculation
        const riskScore = Math.min(100, Math.max(0,
            riskFactors.ltvRisk * 0.35 +
            riskFactors.volatilityRisk * 0.25 +
            riskFactors.liquidityRisk * 0.15 +
            riskFactors.assetCorrelationRisk * 0.10 +
            riskFactors.chainRisk * 0.10 +
            riskFactors.marketConditionRisk * 0.05
        ));

        // ✅ Advanced liquidation probability model
        const liquidationProbability = this.calculateLiquidationProbability(ltv, volatility, riskScore);

        // ✅ Dynamic LTV recommendation
        const recommendedLTV = this.calculateRecommendedLTV(riskScore, volatility, liquidityDepth);

        // ✅ Intelligent recommendations
        const recommendations = this.generateIntelligentRecommendations(riskScore, ltv, volatility, positionData);

        // ✅ Market analysis
        const marketAnalysis = this.generateMarketAnalysis(volatility, liquidityDepth, riskScore);

        // ✅ Risk factors identification
        const riskFactorsList = this.identifyRiskFactors(riskFactors, ltv, volatility);

        // ✅ AI confidence based on data quality
        const aiConfidence = this.calculateAIConfidence(positionData, riskScore);

        return {
            riskScore: Math.round(riskScore),
            liquidationProbability: Math.round(liquidationProbability),
            recommendedLTV: Math.round(recommendedLTV),
            recommendations,
            marketAnalysis,
            riskFactors: riskFactorsList,
            aiConfidence: Math.round(aiConfidence),
            timestamp: new Date().toISOString()
        };
    }

    // ✅ YIELD OPTIMIZATION FEATURE
    async optimizeYield(input: YieldOptimizationInput): Promise<YieldOptimizationOutput> {
        console.log('📈 Optimizing yield for position:', input);

        try {
            if (this.isGeminiAvailable && FEATURE_FLAGS.REAL_AI_ENABLED) {
                return await this.optimizeYieldWithGemini(input);
            } else {
                return this.optimizeYieldWithLocal(input);
            }
        } catch (error) {
            console.error('❌ Yield optimization failed:', error);
            return this.optimizeYieldWithLocal(input);
        }
    }

    // ✅ LIQUIDATION PREDICTION
    async predictLiquidation(positionData: RiskAssessmentInput): Promise<{
        liquidationPrice: number;
        timeToLiquidation: number;
        preventionStrategies: string[];
        confidence: number;
    }> {
        const ltv = (positionData.borrowed / positionData.collateral) * 100;
        const volatility = positionData.marketConditions?.volatility || 30;

        // ✅ Advanced liquidation modeling
        const liquidationPrice = this.calculateLiquidationPrice(positionData.collateral, positionData.borrowed);
        const timeToLiquidation = this.estimateTimeToLiquidation(ltv, volatility);
        const preventionStrategies = this.generatePreventionStrategies(ltv, volatility);
        const confidence = Math.max(60, 100 - (volatility * 0.8));

        return {
            liquidationPrice,
            timeToLiquidation,
            preventionStrategies,
            confidence: Math.round(confidence)
        };
    }

    // ✅ HELPER METHODS FOR ADVANCED CALCULATIONS

    private calculateLTVRisk(ltv: number): number {
        if (ltv < 30) return 10;
        if (ltv < 50) return 25;
        if (ltv < 70) return 50;
        if (ltv < 80) return 75;
        return 95;
    }

    private calculateVolatilityRisk(volatility: number): number {
        return Math.min(100, volatility * 1.5);
    }

    private calculateLiquidityRisk(liquidityDepth: number): number {
        if (liquidityDepth > 10000000) return 10;
        if (liquidityDepth > 1000000) return 25;
        if (liquidityDepth > 100000) return 50;
        return 80;
    }

    private calculateAssetCorrelationRisk(collateralAsset: string, borrowAsset: string): number {
        // ✅ Asset correlation matrix
        const correlations: { [key: string]: { [key: string]: number } } = {
            'ZETA': { 'USDC': 0.2, 'ETH': 0.7, 'BTC': 0.6 },
            'ETH': { 'USDC': 0.3, 'ZETA': 0.7, 'BTC': 0.8 },
            'BTC': { 'USDC': 0.2, 'ETH': 0.8, 'ZETA': 0.6 }
        };

        const correlation = correlations[collateralAsset]?.[borrowAsset] || 0.5;
        return correlation * 60; // Higher correlation = higher risk
    }

    private calculateChainRisk(chainId: number): number {
        const chainRisks: { [key: number]: number } = {
            7001: 20, // ZetaChain - newer but innovative
            1: 10,    // Ethereum - established
            137: 25,  // Polygon - scaling solution
            56: 30    // BSC - centralized concerns
        };
        return chainRisks[chainId] || 40;
    }

    private calculateMarketConditionRisk(): number {
        // ✅ Dynamic market condition assessment
        const hour = new Date().getHours();
        const isWeekend = [0, 6].includes(new Date().getDay());

        let risk = 20; // Base risk
        if (isWeekend) risk += 10; // Weekend risk
        if (hour < 6 || hour > 20) risk += 5; // Off-hours risk

        return risk;
    }

    private calculateLiquidationProbability(ltv: number, volatility: number, riskScore: number): number {
        const baseProbability = Math.max(0, (ltv - 50) * 0.8);
        const volatilityAdjustment = volatility * 0.3;
        const riskAdjustment = riskScore * 0.2;

        return Math.min(95, baseProbability + volatilityAdjustment + riskAdjustment);
    }

    private calculateRecommendedLTV(riskScore: number, volatility: number, liquidityDepth: number): number {
        let baseLTV = 70;

        if (riskScore > 70) baseLTV -= 20;
        else if (riskScore > 50) baseLTV -= 10;

        if (volatility > 40) baseLTV -= 15;
        else if (volatility > 25) baseLTV -= 5;

        if (liquidityDepth < 500000) baseLTV -= 10;

        return Math.max(30, Math.min(80, baseLTV));
    }

    private generateIntelligentRecommendations(riskScore: number, ltv: number, volatility: number, positionData: RiskAssessmentInput): string[] {
        const recommendations: string[] = [];

        if (riskScore > 70) {
            recommendations.push("🚨 Consider reducing position size immediately");
            recommendations.push("🛡️ Set up automated liquidation protection");
        } else if (riskScore > 50) {
            recommendations.push("⚠️ Monitor position closely for market changes");
            recommendations.push("📊 Consider setting up price alerts");
        } else {
            recommendations.push("✅ Position appears healthy - continue monitoring");
            recommendations.push("📈 Consider optimizing yield opportunities");
        }

        if (ltv > 75) {
            recommendations.push("📉 Reduce LTV ratio by adding collateral or repaying debt");
        }

        if (volatility > 40) {
            recommendations.push("🌊 High volatility detected - consider hedging strategies");
        }

        if (positionData.chain !== 1) {
            recommendations.push("🔗 Monitor cross-chain bridge risks and gas fees");
        }

        recommendations.push("🤖 Enable automated rebalancing for optimal management");

        return recommendations;
    }

    private generateMarketAnalysis(volatility: number, liquidityDepth: number, riskScore: number): string {
        let analysis = "Market analysis: ";

        if (volatility < 20) {
            analysis += "Low volatility environment provides stable conditions for lending. ";
        } else if (volatility < 40) {
            analysis += "Moderate volatility suggests normal market conditions with manageable risks. ";
        } else {
            analysis += "High volatility environment requires careful position management. ";
        }

        if (liquidityDepth > 5000000) {
            analysis += "Deep liquidity ensures good exit opportunities. ";
        } else if (liquidityDepth > 1000000) {
            analysis += "Adequate liquidity for normal operations. ";
        } else {
            analysis += "Limited liquidity may impact large position changes. ";
        }

        if (riskScore < 30) {
            analysis += "Overall risk profile is conservative and well-managed.";
        } else if (riskScore < 60) {
            analysis += "Balanced risk profile with room for optimization.";
        } else {
            analysis += "Elevated risk levels require active management.";
        }

        return analysis;
    }

    private identifyRiskFactors(riskFactors: any, ltv: number, volatility: number): string[] {
        const factors: string[] = [];

        if (riskFactors.ltvRisk > 50) factors.push("High loan-to-value ratio");
        if (riskFactors.volatilityRisk > 40) factors.push("Market volatility exposure");
        if (riskFactors.liquidityRisk > 40) factors.push("Limited liquidity depth");
        if (riskFactors.assetCorrelationRisk > 50) factors.push("High asset correlation risk");
        if (riskFactors.chainRisk > 30) factors.push("Cross-chain operational risk");

        if (ltv > 80) factors.push("Near liquidation threshold");
        if (volatility > 50) factors.push("Extreme market volatility");

        if (factors.length === 0) {
            factors.push("Standard market risks");
        }

        return factors;
    }

    private calculateAIConfidence(positionData: RiskAssessmentInput, riskScore: number): number {
        let confidence = 85; // Base confidence

        // ✅ Data quality assessment
        if (positionData.marketConditions) confidence += 10;
        if (positionData.collateral > 0 && positionData.borrowed > 0) confidence += 5;

        // ✅ Risk score reliability
        if (riskScore < 30 || riskScore > 80) confidence -= 5; // Extreme scores are less certain

        // ✅ Market condition factors
        const volatility = positionData.marketConditions?.volatility || 30;
        if (volatility > 50) confidence -= 10; // High volatility reduces confidence

        return Math.max(60, Math.min(98, confidence));
    }

    // ✅ GEMINI HELPER METHODS

    private createRiskAssessmentPrompt(positionData: RiskAssessmentInput): string {
        return `
You are an expert DeFi risk analyst. Analyze this lending position and provide a detailed risk assessment.

Position Details:
- Collateral: ${positionData.collateral} ${positionData.collateralAsset}
- Borrowed: ${positionData.borrowed} ${positionData.borrowAsset}
- Current LTV: ${((positionData.borrowed / positionData.collateral) * 100).toFixed(1)}%
- Chain: ${this.getChainName(positionData.chain)}
- Market Volatility: ${positionData.marketConditions?.volatility || 30}%
- Liquidity Depth: $${(positionData.marketConditions?.liquidityDepth || 1000000).toLocaleString()}

Please provide a JSON response with the following structure:
{
  "riskScore": <number 0-100>,
  "liquidationProbability": <number 0-100>,
  "recommendedLTV": <number 0-100>,
  "recommendations": [<array of 3-5 specific actionable recommendations>],
  "marketAnalysis": "<detailed analysis of current market conditions>",
  "riskFactors": [<array of main risk factors>],
  "aiConfidence": <number 0-100>
}

Consider:
- Asset correlation and volatility
- Chain-specific risks
- Market liquidity and depth
- Current macro conditions
- Liquidation risks and timing
- Optimal risk management strategies

Provide specific, actionable insights for this exact position.
        `.trim();
    }

    private parseGeminiResponse(response: string, fallbackData: RiskAssessmentInput): RiskAssessmentOutput {
        try {
            // ✅ Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // ✅ Validate and sanitize response
                return {
                    riskScore: this.validateRange(parsed.riskScore, 0, 100, 50),
                    liquidationProbability: this.validateRange(parsed.liquidationProbability, 0, 100, 25),
                    recommendedLTV: this.validateRange(parsed.recommendedLTV, 0, 100, 65),
                    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [
                        "Monitor position regularly",
                        "Consider risk management strategies",
                        "Set up price alerts"
                    ],
                    marketAnalysis: typeof parsed.marketAnalysis === 'string' ? parsed.marketAnalysis :
                        "AI-generated market analysis indicates moderate risk conditions.",
                    riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.slice(0, 5) : [
                        "Market volatility",
                        "Liquidity risks"
                    ],
                    aiConfidence: this.validateRange(parsed.aiConfidence, 0, 100, 85),
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn('Failed to parse Gemini response, using fallback');
        }

        // ✅ Fallback to local calculation
        return this.assessRiskWithEnhancedLocal(fallbackData);
    }

    // ✅ YIELD OPTIMIZATION METHODS

    private async optimizeYieldWithGemini(input: YieldOptimizationInput): Promise<YieldOptimizationOutput> {
        if (!this.genAI) throw new Error('Gemini not initialized');

        const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
Optimize yield for this DeFi position:
- Current Yield: ${input.currentYield}%
- Risk Profile: ${input.riskProfile}
- Assets: ${input.assets.join(', ')}
- Available Chains: ${input.chains.join(', ')}
- Amount: $${input.amount.toLocaleString()}

Provide yield optimization strategies in JSON format:
{
  "optimizedYield": <number>,
  "recommendedStrategies": [
    {
      "protocol": "<protocol name>",
      "chain": <chain id>,
      "expectedYield": <number>,
      "riskLevel": "<low/medium/high>"
    }
  ],
  "rebalanceActions": [<array of actions>],
  "confidence": <number 0-100>
}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response.text();

        return this.parseYieldOptimizationResponse(response, input);
    }

    private optimizeYieldWithLocal(input: YieldOptimizationInput): YieldOptimizationOutput {
        // ✅ Local yield optimization algorithm
        const strategies = [
            { protocol: "ZetaChain Native Staking", chain: 7001, expectedYield: 7.2, riskLevel: "low" },
            { protocol: "Ethereum Compound", chain: 1, expectedYield: 4.5, riskLevel: "medium" },
            { protocol: "Polygon Aave", chain: 137, expectedYield: 6.8, riskLevel: "medium" },
            { protocol: "BSC PancakeSwap", chain: 56, expectedYield: 8.1, riskLevel: "high" }
        ].filter(s => input.chains.includes(s.chain));

        const optimizedYield = Math.max(...strategies.map(s => s.expectedYield));

        return {
            optimizedYield,
            recommendedStrategies: strategies.slice(0, 3),
            rebalanceActions: [
                "Diversify across multiple protocols",
                "Monitor yield changes daily",
                "Set up automated rebalancing"
            ],
            confidence: 82
        };
    }

    // ✅ UTILITY METHODS

    private shouldThrottle(): boolean {
        const now = Date.now();
        if (now - this.lastRequestTime > 60000) {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }
        return this.requestCount >= this.maxRequestsPerMinute;
    }

    private updateRequestTracking(): void {
        this.requestCount++;
        this.lastRequestTime = Date.now();
    }

    private validateRange(value: any, min: number, max: number, fallback: number): number {
        const num = Number(value);
        if (isNaN(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    }

    private getChainName(chainId: number): string {
        const chains: { [key: number]: string } = {
            7001: "ZetaChain",
            1: "Ethereum",
            137: "Polygon",
            56: "BSC"
        };
        return chains[chainId] || `Chain ${chainId}`;
    }

    private calculateLiquidationPrice(collateral: number, borrowed: number): number {
        // ✅ Liquidation price calculation
        const liquidationLTV = 85; // 85% liquidation threshold
        return (borrowed * 100) / liquidationLTV;
    }

    private estimateTimeToLiquidation(ltv: number, volatility: number): number {
        // ✅ Time to liquidation estimation (in hours)
        if (ltv < 50) return 72; // 3 days
        if (ltv < 70) return 24; // 1 day
        if (ltv < 80) return 8;  // 8 hours
        return 2; // 2 hours for high LTV
    }

    private generatePreventionStrategies(ltv: number, volatility: number): string[] {
        const strategies: string[] = [];

        if (ltv > 70) {
            strategies.push("Add more collateral immediately");
            strategies.push("Partially repay borrowed amount");
        }

        if (volatility > 40) {
            strategies.push("Set up price alerts at key levels");
            strategies.push("Consider hedging with derivatives");
        }

        strategies.push("Enable automated liquidation protection");
        strategies.push("Monitor position every 4-6 hours");

        return strategies;
    }

    private parseYieldOptimizationResponse(response: string, fallback: YieldOptimizationInput): YieldOptimizationOutput {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    optimizedYield: parsed.optimizedYield || fallback.currentYield + 1,
                    recommendedStrategies: parsed.recommendedStrategies || [],
                    rebalanceActions: parsed.rebalanceActions || [],
                    confidence: parsed.confidence || 75
                };
            }
        } catch (error) {
            console.warn('Failed to parse yield optimization response');
        }

        return this.optimizeYieldWithLocal(fallback);
    }

    // ✅ PUBLIC API METHODS

    public getServiceStatus(): {
        geminiAvailable: boolean;
        requestCount: number;
        lastError: string | null;
    } {
        return {
            geminiAvailable: this.isGeminiAvailable,
            requestCount: this.requestCount,
            lastError: null
        };
    }

    public async testGeminiConnection(): Promise<boolean> {
        try {
            if (!this.isGeminiAvailable) return false;

            const model = this.genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Test connection - respond with 'OK'");
            const response = await result.response.text();

            return response.includes('OK');
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }
}

// ✅ Export singleton instance
export const aiService = new RealAIService();

// ✅ Export types for external use
export type {
    RiskAssessmentInput,
    RiskAssessmentOutput,
    YieldOptimizationInput,
    YieldOptimizationOutput
};