const express = require('express');
const { ethers } = require('ethers');

const router = express.Router();

// Mock lending data for demo
const mockLendingPools = {
    'ethereum_sepolia': {
        'USDC': { totalLiquidity: 1000000, utilizationRate: 65, apy: 5.2 },
        'ETH': { totalLiquidity: 500, utilizationRate: 45, apy: 4.8 },
        'USDT': { totalLiquidity: 800000, utilizationRate: 70, apy: 5.5 }
    },
    'polygon_amoy': {
        'USDC': { totalLiquidity: 500000, utilizationRate: 80, apy: 7.3 },
        'USDT': { totalLiquidity: 300000, utilizationRate: 55, apy: 6.1 }
    },
    'bsc_testnet': {
        'USDC': { totalLiquidity: 750000, utilizationRate: 60, apy: 6.8 },
        'BNB': { totalLiquidity: 1000, utilizationRate: 40, apy: 5.5 }
    }
};

// Get lending pools data
router.get('/pools', (req, res) => {
    try {
        res.json({
            success: true,
            data: mockLendingPools,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pools',
            message: error.message
        });
    }
});

// Get optimal lending rates across chains
router.post('/optimal-rates', (req, res) => {
    try {
        const { asset, amount, preferredChains } = req.body;

        const rates = [];

        for (const chain of preferredChains) {
            if (mockLendingPools[chain] && mockLendingPools[chain][asset]) {
                const pool = mockLendingPools[chain][asset];

                // Calculate optimal rate based on amount and current utilization
                const newUtilization = (pool.utilizationRate + (amount / pool.totalLiquidity * 100));
                const adjustedAPY = pool.apy * (1 + (newUtilization - pool.utilizationRate) / 100);

                rates.push({
                    chain,
                    asset,
                    currentAPY: pool.apy,
                    projectedAPY: Math.round(adjustedAPY * 100) / 100,
                    liquidity: pool.totalLiquidity,
                    utilizationRate: pool.utilizationRate,
                    recommendationScore: 100 - Math.abs(70 - newUtilization) // Optimal at 70% utilization
                });
            }
        }

        // Sort by recommendation score
        rates.sort((a, b) => b.recommendationScore - a.recommendationScore);

        res.json({
            success: true,
            data: {
                asset,
                amount,
                recommendations: rates,
                bestChain: rates[0]?.chain,
                bestAPY: rates[0]?.projectedAPY
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to calculate optimal rates',
            message: error.message
        });
    }
});

// Get cross-chain lending opportunities
router.post('/cross-chain-opportunities', (req, res) => {
    try {
        const { collateralAsset, collateralChain, targetAssets } = req.body;

        const opportunities = [];

        // Find best borrow rates for target assets
        for (const targetAsset of targetAssets) {
            for (const [chain, pools] of Object.entries(mockLendingPools)) {
                if (pools[targetAsset] && chain !== collateralChain) {
                    const borrowRate = pools[targetAsset].apy * 1.5; // Borrow rate typically higher

                    opportunities.push({
                        collateralChain,
                        collateralAsset,
                        borrowChain: chain,
                        borrowAsset: targetAsset,
                        borrowAPY: Math.round(borrowRate * 100) / 100,
                        spread: Math.round((pools[targetAsset].apy - borrowRate) * 100) / 100,
                        liquidity: pools[targetAsset].totalLiquidity,
                        riskScore: Math.random() * 30 + 20 // Mock risk score 20-50
                    });
                }
            }
        }

        // Sort by best opportunities (lowest borrow rate)
        opportunities.sort((a, b) => a.borrowAPY - b.borrowAPY);

        res.json({
            success: true,
            data: {
                opportunities: opportunities.slice(0, 10), // Top 10
                totalOpportunities: opportunities.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to find opportunities',
            message: error.message
        });
    }
});

// Calculate liquidation metrics
router.post('/liquidation-metrics', (req, res) => {
    try {
        const { positionId, collateralAmount, borrowAmount, collateralPrice, borrowPrice } = req.body;

        const currentLTV = (borrowAmount * borrowPrice) / (collateralAmount * collateralPrice) * 100;
        const liquidationThreshold = 80; // 80%
        const healthFactor = liquidationThreshold / currentLTV;

        // Calculate price drop needed for liquidation
        const liquidationPrice = collateralPrice * (currentLTV / liquidationThreshold);
        const priceDropForLiquidation = ((collateralPrice - liquidationPrice) / collateralPrice) * 100;

        res.json({
            success: true,
            data: {
                positionId,
                currentLTV: Math.round(currentLTV * 100) / 100,
                healthFactor: Math.round(healthFactor * 100) / 100,
                liquidationThreshold,
                liquidationPrice: Math.round(liquidationPrice * 100) / 100,
                priceDropForLiquidation: Math.round(priceDropForLiquidation * 100) / 100,
                riskLevel: currentLTV > 75 ? 'HIGH' : currentLTV > 60 ? 'MEDIUM' : 'LOW',
                timeToLiquidation: currentLTV > 75 ? 'hours' : currentLTV > 60 ? 'days' : 'safe'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to calculate metrics',
            message: error.message
        });
    }
});

module.exports = router;