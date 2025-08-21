const GeminiAIService = require('./gemini-integration');

class YieldOptimizerService {
    constructor() {
        this.gemini = new GeminiAIService();
        this.optimizationCache = new Map();
        this.realTimeData = {
            chainYields: new Map(),
            liquidityDepths: new Map(),
            utilizationRates: new Map()
        };

        // Start real-time monitoring
        this.startRealTimeMonitoring();
    }

    // 🤖 AI FEATURE: Real-time yield optimization across chains
    async optimizeYieldAcrossChains(portfolioData) {
        const cacheKey = this._generateCacheKey(portfolioData);

        if (this.optimizationCache.has(cacheKey)) {
            const cached = this.optimizationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.data;
            }
        }

        try {
            // Get real-time market data
            const marketData = await this._getRealtimeMarketData();

            // Enhance portfolio data with market conditions
            const enhancedData = {
                ...portfolioData,
                marketConditions: marketData,
                realTimeYields: this._getCurrentYields(),
                liquidityDepths: this._getLiquidityDepths(),
                riskFactors: await this._calculateRiskFactors(portfolioData)
            };

            // Get AI optimization
            const aiOptimization = await this.gemini.optimizeYieldStrategy(enhancedData);

            // Apply advanced optimization algorithms
            const optimizedStrategy = await this._applyAdvancedOptimization(aiOptimization, enhancedData);

            // Cache result
            this.optimizationCache.set(cacheKey, {
                data: optimizedStrategy,
                timestamp: Date.now()
            });

            return optimizedStrategy;

        } catch (error) {
            console.error('Yield optimization error:', error);
            return this._getFallbackOptimization(portfolioData);
        }
    }

    // 🤖 AI FEATURE: Multi-chain rebalancing recommendations
    async generateRebalancingStrategy(currentPositions, targetRiskLevel) {
        try {
            const prompt = `
            Generate optimal cross-chain rebalancing strategy:
            
            Current Positions: ${JSON.stringify(currentPositions)}
            Target Risk Level: ${targetRiskLevel}
            Current Market Data: ${JSON.stringify(this._getCurrentMarketSnapshot())}
            
            Consider:
            - Gas costs for rebalancing
            - Slippage on each chain
            - Yield opportunities
            - Risk diversification
            - Impermanent loss potential
            
            Return JSON format:
            {
                "rebalanceActions": [
                    {
                        "fromChain": "ethereum",
                        "toChain": "polygon", 
                        "asset": "USDC",
                        "amount": 1000,
                        "reason": "Higher yield on Polygon",
                        "expectedGain": 2.5,
                        "riskImpact": -5
                    }
                ],
                "expectedYieldIncrease": number,
                "riskReduction": number,
                "gasCosts": number,
                "executionOrder": [1, 2, 3],
                "timeframe": "immediate/hours/days"
            }
            `;

            const result = await this.gemini.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const strategy = JSON.parse(jsonMatch[0]);

                // Validate and enhance strategy
                return this._validateRebalancingStrategy(strategy, currentPositions);
            }

            return this._getFallbackRebalancing(currentPositions, targetRiskLevel);

        } catch (error) {
            console.error('Rebalancing strategy error:', error);
            return this._getFallbackRebalancing(currentPositions, targetRiskLevel);
        }
    }

    // 🤖 AI FEATURE: Real-time yield prediction
    async predictYieldTrends(timeHorizon = '7d') {
        try {
            const historicalData = await this._getHistoricalYieldData(timeHorizon);
            const marketIndicators = await this._getMarketIndicators();

            const prompt = `
            Predict yield trends for cross-chain lending:
            
            Historical Yields: ${JSON.stringify(historicalData)}
            Market Indicators: ${JSON.stringify(marketIndicators)}
            Time Horizon: ${timeHorizon}
            
            Predict yields for each chain and provide confidence intervals.
            
            Return JSON:
            {
                "predictions": {
                    "ethereum": {"yield": 5.2, "confidence": 85, "trend": "increasing"},
                    "polygon": {"yield": 8.1, "confidence": 78, "trend": "stable"},
                    "bsc": {"yield": 6.9, "confidence": 82, "trend": "decreasing"}
                },
                "marketOutlook": "bullish/bearish/neutral",
                "keyFactors": ["factor1", "factor2"],
                "riskEvents": ["potential_risk1", "potential_risk2"]
            }
            `;

            const result = await this.gemini.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this._getFallbackPredictions();

        } catch (error) {
            console.error('Yield prediction error:', error);
            return this._getFallbackPredictions();
        }
    }

    // Real-time monitoring system
    startRealTimeMonitoring() {
        // Update yield data every 30 seconds
        setInterval(async () => {
            try {
                await this._updateRealTimeYields();
            } catch (error) {
                console.error('Real-time yield update failed:', error);
            }
        }, 30000);

        // Update liquidity data every 60 seconds
        setInterval(async () => {
            try {
                await this._updateLiquidityData();
            } catch (error) {
                console.error('Liquidity data update failed:', error);
            }
        }, 60000);
    }

    async _getRealtimeMarketData() {
        // Simulate real-time market data fetching
        return {
            volatilityIndex: Math.random() * 50 + 25, // 25-75
            liquidityFlows: {
                ethereum: Math.random() * 1000000,
                polygon: Math.random() * 500000,
                bsc: Math.random() * 750000
            },
            gasPrice: {
                ethereum: Math.random() * 100 + 20, // 20-120 gwei
                polygon: Math.random() * 50 + 10,   // 10-60 gwei
                bsc: Math.random() * 10 + 5        // 5-15 gwei
            },
            bridgeHealth: {
                ethereum_polygon: 95 + Math.random() * 5,
                ethereum_bsc: 92 + Math.random() * 8,
                polygon_bsc: 90 + Math.random() * 10
            }
        };
    }

    async _applyAdvancedOptimization(aiResult, marketData) {
        // Apply additional optimization layers
        const optimizedAllocations = aiResult.allocations.map(allocation => {
            // Adjust for gas costs
            const gasCost = marketData.marketConditions.gasPrice[allocation.chain] || 20;
            const gasAdjustedAPY = allocation.expectedAPY - (gasCost / 1000); // Simplified gas impact

            // Adjust for liquidity depth
            const liquidityDepth = this.realTimeData.liquidityDepths.get(allocation.chain) || 1000000;
            const liquidityMultiplier = Math.min(1.1, liquidityDepth / 500000);

            // Adjust for bridge health
            const bridgeHealth = marketData.marketConditions.bridgeHealth[`ethereum_${allocation.chain}`] || 95;
            const bridgeMultiplier = bridgeHealth / 100;

            return {
                ...allocation,
                expectedAPY: gasAdjustedAPY * liquidityMultiplier * bridgeMultiplier,
                gasImpact: gasCost,
                liquidityRisk: liquidityDepth < 100000 ? 'high' : liquidityDepth < 500000 ? 'medium' : 'low',
                bridgeRisk: bridgeHealth < 90 ? 'high' : bridgeHealth < 95 ? 'medium' : 'low'
            };
        });

        return {
            ...aiResult,
            allocations: optimizedAllocations,
            optimizationFactors: {
                gasOptimization: true,
                liquidityConsideration: true,
                bridgeRiskAssessment: true,
                realTimeAdjustments: true
            },
            totalExpectedAPY: this._calculateWeightedAPY(optimizedAllocations),
            confidence: this._calculateConfidenceScore(optimizedAllocations, marketData)
        };
    }

    _getCurrentYields() {
        const yields = new Map();
        yields.set('ethereum', 5.2 + Math.random() * 1.5);
        yields.set('polygon', 8.1 + Math.random() * 2.0);
        yields.set('bsc', 6.9 + Math.random() * 1.8);
        yields.set('arbitrum', 4.8 + Math.random() * 1.2);
        return yields;
    }

    _getLiquidityDepths() {
        const depths = new Map();
        depths.set('ethereum', 1000000 + Math.random() * 2000000);
        depths.set('polygon', 500000 + Math.random() * 1000000);
        depths.set('bsc', 750000 + Math.random() * 1500000);
        depths.set('arbitrum', 300000 + Math.random() * 700000);
        return depths;
    }

    async _calculateRiskFactors(portfolioData) {
        return {
            concentrationRisk: this._calculateConcentrationRisk(portfolioData.assets),
            correlationRisk: await this._calculateCorrelationRisk(portfolioData.assets),
            bridgeRisk: this._calculateBridgeRisk(portfolioData.chains),
            liquidityRisk: this._calculateLiquidityRisk(portfolioData.assets)
        };
    }

    _calculateConcentrationRisk(assets) {
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        const maxConcentration = Math.max(...assets.map(asset => asset.value / totalValue));
        return maxConcentration > 0.5 ? 'high' : maxConcentration > 0.3 ? 'medium' : 'low';
    }

    async _calculateCorrelationRisk(assets) {
        // Simplified correlation calculation
        const uniqueAssets = [...new Set(assets.map(asset => asset.symbol))];
        if (uniqueAssets.length === 1) return 'high';
        if (uniqueAssets.length === 2) return 'medium';
        return 'low';
    }

    _calculateBridgeRisk(chains) {
        if (chains.length === 1) return 'low';
        if (chains.length <= 3) return 'medium';
        return 'high';
    }

    _calculateLiquidityRisk(assets) {
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        if (totalValue > 1000000) return 'low';
        if (totalValue > 100000) return 'medium';
        return 'high';
    }

    _validateRebalancingStrategy(strategy, currentPositions) {
        // Validate that rebalancing makes sense
        const validatedActions = strategy.rebalanceActions.filter(action => {
            return action.expectedGain > 1.0 && action.amount > 0;
        });

        return {
            ...strategy,
            rebalanceActions: validatedActions,
            validated: true,
            validationTimestamp: Date.now()
        };
    }

    _calculateWeightedAPY(allocations) {
        const totalWeight = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
        const weightedSum = allocations.reduce((sum, alloc) =>
            sum + (alloc.expectedAPY * alloc.percentage), 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    _calculateConfidenceScore(allocations, marketData) {
        // Base confidence on market conditions and data quality
        let confidence = 85; // Base confidence

        if (marketData.marketConditions.volatilityIndex > 60) confidence -= 10;
        if (allocations.some(alloc => alloc.liquidityRisk === 'high')) confidence -= 15;
        if (allocations.some(alloc => alloc.bridgeRisk === 'high')) confidence -= 10;

        return Math.max(50, confidence);
    }

    _getCurrentMarketSnapshot() {
        return {
            timestamp: Date.now(),
            yields: Object.fromEntries(this._getCurrentYields()),
            liquidity: Object.fromEntries(this._getLiquidityDepths()),
            volatility: Math.random() * 50 + 25
        };
    }

    async _updateRealTimeYields() {
        // Simulate real-time yield updates
        this.realTimeData.chainYields = this._getCurrentYields();
    }

    async _updateLiquidityData() {
        // Simulate real-time liquidity updates
        this.realTimeData.liquidityDepths = this._getLiquidityDepths();
    }

    async _getHistoricalYieldData(timeHorizon) {
        // Mock historical data - in production, fetch from data providers
        const days = timeHorizon === '7d' ? 7 : timeHorizon === '30d' ? 30 : 7;
        const historicalData = {};

        ['ethereum', 'polygon', 'bsc', 'arbitrum'].forEach(chain => {
            historicalData[chain] = [];
            for (let i = 0; i < days; i++) {
                historicalData[chain].push({
                    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                    yield: 5 + Math.random() * 5, // 5-10% range
                    volume: Math.random() * 1000000
                });
            }
        });

        return historicalData;
    }

    async _getMarketIndicators() {
        return {
            tvl: {
                total: 50000000000 + Math.random() * 10000000000,
                byChain: {
                    ethereum: 30000000000,
                    polygon: 8000000000,
                    bsc: 12000000000
                }
            },
            activeUsers: Math.floor(100000 + Math.random() * 50000),
            transactionVolume: Math.floor(5000000 + Math.random() * 2000000)
        };
    }

    _getFallbackOptimization(portfolioData) {
        return {
            allocations: [
                {
                    chain: 'ethereum',
                    asset: 'USDC',
                    percentage: 40,
                    expectedAPY: 5.5,
                    riskLevel: 'low'
                },
                {
                    chain: 'polygon',
                    asset: 'USDC',
                    percentage: 35,
                    expectedAPY: 8.2,
                    riskLevel: 'medium'
                },
                {
                    chain: 'bsc',
                    asset: 'USDC',
                    percentage: 25,
                    expectedAPY: 7.1,
                    riskLevel: 'medium'
                }
            ],
            totalExpectedAPY: 6.8,
            riskScore: 35,
            rebalanceFrequency: 'weekly',
            confidence: 75
        };
    }

    _getFallbackRebalancing(currentPositions, targetRiskLevel) {
        return {
            rebalanceActions: [
                {
                    fromChain: 'ethereum',
                    toChain: 'polygon',
                    asset: 'USDC',
                    amount: 1000,
                    reason: 'Higher yield opportunity',
                    expectedGain: 2.5,
                    riskImpact: -5
                }
            ],
            expectedYieldIncrease: 1.5,
            riskReduction: 10,
            gasCosts: 25,
            executionOrder: [1],
            timeframe: 'immediate'
        };
    }

    _getFallbackPredictions() {
        return {
            predictions: {
                ethereum: { yield: 5.2, confidence: 75, trend: 'stable' },
                polygon: { yield: 8.1, confidence: 70, trend: 'increasing' },
                bsc: { yield: 6.9, confidence: 72, trend: 'stable' }
            },
            marketOutlook: 'neutral',
            keyFactors: ['Market stability', 'Increased adoption'],
            riskEvents: ['Regulatory changes', 'Market volatility']
        };
    }

    _generateCacheKey(portfolioData) {
        return `yield_opt_${JSON.stringify(portfolioData).slice(0, 50)}_${Math.floor(Date.now() / 60000)}`;
    }
}

module.exports = YieldOptimizerService;