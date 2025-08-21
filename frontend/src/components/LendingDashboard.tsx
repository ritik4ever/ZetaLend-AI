import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { walletService } from '../services/wallet';
import { aiService } from '../services/ai';

interface Position {
    id: string;
    collateralAmount: string;
    borrowedAmount: string;
    collateralChain: number;
    borrowChain: number;
    isActive: boolean;
    aiRiskScore: number;
    yieldRate: number;
}

interface LendingStats {
    totalSupplied: string;
    totalBorrowed: string;
    netAPY: number;
    healthFactor: number;
}

interface AIInsights {
    portfolioRisk: number;
    recommendedActions: string[];
    optimizationOpportunities: string[];
    riskFactors: string[];
}

interface LendingDashboardProps {
    address?: string;
}

const LendingDashboard: React.FC<LendingDashboardProps> = ({ address }) => {
    const [userPositions, setUserPositions] = useState<Position[]>([]);
    const [lendingStats, setLendingStats] = useState<LendingStats | null>(null);
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(false);

    const loadDashboardData = async () => {
        if (!address) return;

        setLoading(true);
        try {
            // Load user positions
            const positions = await walletService.getUserPositions();
            setUserPositions(positions);

            // Calculate lending stats
            const stats = calculateLendingStats(positions);
            setLendingStats(stats);

            // Get AI insights for portfolio - FIX: Use assessRisk instead of rebalancePortfolio
            if (positions.length > 0) {
                const portfolioData = {
                    collateral: positions.reduce((sum, pos) => sum + parseFloat(ethers.formatEther(pos.collateralAmount)), 0),
                    borrowed: positions.reduce((sum, pos) => sum + parseFloat(ethers.formatEther(pos.borrowedAmount)), 0),
                    collateralAsset: 'ZETA',
                    borrowAsset: 'ZETA',
                    chain: 7001,
                    userAddress: address,
                    marketConditions: {
                        volatility: Math.random() * 50 + 25,
                        liquidityDepth: Math.random() * 1000000 + 500000
                    }
                };

                const riskAssessment = await aiService.assessRisk(portfolioData);

                // Convert risk assessment to insights format
                const insights: AIInsights = {
                    portfolioRisk: riskAssessment.riskScore,
                    recommendedActions: riskAssessment.recommendations || [
                        'Consider reducing LTV ratio for safer positioning',
                        'Monitor market volatility closely',
                        'Diversify across multiple chains for better risk distribution'
                    ],
                    optimizationOpportunities: [
                        'Optimize yield by rebalancing positions',
                        'Consider adding more collateral to improve health factor',
                        'Explore cross-chain opportunities for better rates'
                    ],
                    riskFactors: riskAssessment.riskFactors || [
                        'High LTV ratio exposure',
                        'Single asset concentration',
                        'Market volatility risk'
                    ]
                };

                setAiInsights(insights);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
        setLoading(false);
    };

    const calculateLendingStats = (positions: Position[]): LendingStats => {
        const totalSupplied = positions.reduce(
            (sum, pos) => sum + parseFloat(ethers.formatEther(pos.collateralAmount)),
            0
        );

        const totalBorrowed = positions.reduce(
            (sum, pos) => sum + parseFloat(ethers.formatEther(pos.borrowedAmount)),
            0
        );

        const weightedAPY = positions.reduce(
            (sum, pos) => sum + (pos.yieldRate / 100),
            0
        ) / Math.max(positions.length, 1);

        const healthFactor = totalSupplied > 0 ? (totalSupplied * 0.75) / Math.max(totalBorrowed, 0.001) : 0;

        return {
            totalSupplied: totalSupplied.toFixed(4),
            totalBorrowed: totalBorrowed.toFixed(4),
            netAPY: weightedAPY,
            healthFactor: Math.min(healthFactor, 10) // Cap at 10 for display
        };
    };

    useEffect(() => {
        loadDashboardData();
    }, [address]);

    const getHealthFactorColor = (factor: number) => {
        if (factor > 2) return 'text-green-600';
        if (factor > 1.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRiskColor = (score: number) => {
        if (score < 30) return 'text-green-600';
        if (score < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!address) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="text-6xl mb-4">💼</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Wallet</h3>
                <p className="text-gray-600">
                    Connect your wallet to view your lending dashboard
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading your lending dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">💼 Lending Dashboard</h2>
                <button
                    onClick={loadDashboardData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Lending Stats */}
            {lendingStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">💰</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Supplied</p>
                                <p className="text-2xl font-bold text-green-600">{lendingStats.totalSupplied} ZETA</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">📊</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
                                <p className="text-2xl font-bold text-blue-600">{lendingStats.totalBorrowed} ZETA</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">📈</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Net APY</p>
                                <p className="text-2xl font-bold text-purple-600">{lendingStats.netAPY.toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center">
                            <div className="text-3xl mr-4">🛡️</div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Health Factor</p>
                                <p className={`text-2xl font-bold ${getHealthFactorColor(lendingStats.healthFactor)}`}>
                                    {lendingStats.healthFactor.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Insights */}
            {aiInsights && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">🤖 AI Portfolio Insights</h3>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="text-center p-4 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">Portfolio Risk Score</p>
                            <p className={`text-3xl font-bold ${getRiskColor(aiInsights.portfolioRisk)}`}>
                                {aiInsights.portfolioRisk}/100
                            </p>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                            <p className="text-sm text-gray-600">Active Positions</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {userPositions.length}
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">📋 Recommended Actions</h4>
                            <ul className="text-sm space-y-1">
                                {aiInsights.recommendedActions.map((action, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-green-500 mr-2">•</span>
                                        <span className="text-gray-700">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">🚀 Optimization Opportunities</h4>
                            <ul className="text-sm space-y-1">
                                {aiInsights.optimizationOpportunities.map((opportunity, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-blue-500 mr-2">•</span>
                                        <span className="text-gray-700">{opportunity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-purple-700 mb-2">⚠️ Risk Factors</h4>
                            <ul className="text-sm space-y-1">
                                {aiInsights.riskFactors.map((factor, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-red-500 mr-2">•</span>
                                        <span className="text-gray-700">{factor}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Positions */}
            {userPositions.length > 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Recent Positions</h3>
                    <div className="space-y-4">
                        {userPositions.slice(0, 3).map((position) => (
                            <div key={position.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">Position #{position.id}</p>
                                    <p className="text-sm text-gray-600">
                                        {parseFloat(ethers.formatEther(position.collateralAmount)).toFixed(2)} ZETA collateral
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-medium ${getRiskColor(position.aiRiskScore)}`}>
                                        Risk: {position.aiRiskScore}/100
                                    </p>
                                    <p className="text-sm text-green-600">
                                        APY: {(position.yieldRate / 100).toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                    <div className="text-6xl mb-4">💼</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lending Positions</h3>
                    <p className="text-gray-600 mb-6">
                        Create your first lending position to start earning yield
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Create Position
                    </button>
                </div>
            )}
        </div>
    );
};

export default LendingDashboard;