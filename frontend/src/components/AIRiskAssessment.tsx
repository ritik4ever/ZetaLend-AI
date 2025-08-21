import React, { useState, useEffect } from 'react';
import { aiService } from '../services/ai';

interface RiskMetrics {
    riskScore: number;
    liquidationProbability: number;
    recommendedLTV: number;
    confidence: number;
}

interface AIRiskAssessmentProps {
    userAddress?: string;
    collateralAmount?: string;
    borrowAmount?: string;
    chain?: number;
}

const AIRiskAssessment: React.FC<AIRiskAssessmentProps> = ({
    userAddress,
    collateralAmount = '0',
    borrowAmount = '0',
    chain = 7001
}) => {
    const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const calculateRisk = async () => {
        if (!userAddress || !collateralAmount || !borrowAmount) return;

        setLoading(true);
        try {
            const mockPositionData = {
                collateral: parseFloat(collateralAmount),
                borrowed: parseFloat(borrowAmount),
                collateralAsset: 'ZETA',
                borrowAsset: 'ZETA',
                chain: chain,
                userAddress: userAddress,
                marketConditions: {
                    volatility: Math.random() * 50 + 25,
                    liquidityDepth: Math.random() * 1000000 + 500000
                }
            };

            const response = await aiService.assessRisk(mockPositionData);

            // Fix: Access response properties directly, not response.data
            const metrics: RiskMetrics = {
                riskScore: response.riskScore,
                liquidationProbability: response.liquidationProbability,
                recommendedLTV: response.recommendedLTV,
                confidence: response.aiConfidence
            };

            setRiskMetrics(metrics);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Risk assessment failed:', error);
            // Set default metrics on error
            setRiskMetrics({
                riskScore: 50,
                liquidationProbability: 15,
                recommendedLTV: 65,
                confidence: 80
            });
            setLastUpdated(new Date());
        }
        setLoading(false);
    };

    useEffect(() => {
        if (userAddress && collateralAmount && borrowAmount) {
            calculateRisk();
        }
    }, [userAddress, collateralAmount, borrowAmount, chain]);

    const getRiskColor = (score: number) => {
        if (score < 30) return 'text-green-600';
        if (score < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getRiskLevel = (score: number) => {
        if (score < 30) return 'Low';
        if (score < 60) return 'Medium';
        return 'High';
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">🤖 AI Risk Assessment</h3>
                <button
                    onClick={calculateRisk}
                    disabled={loading || !userAddress}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${loading || !userAddress
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {loading ? '🔄 Analyzing...' : '🔄 Refresh Analysis'}
                </button>
            </div>

            {riskMetrics ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Risk Score</p>
                            <p className={`text-xl font-bold ${getRiskColor(riskMetrics.riskScore)}`}>
                                {riskMetrics.riskScore}/100
                            </p>
                            <p className={`text-xs ${getRiskColor(riskMetrics.riskScore)}`}>
                                {getRiskLevel(riskMetrics.riskScore)}
                            </p>
                        </div>

                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Liquidation Risk</p>
                            <p className="text-xl font-bold text-orange-600">
                                {riskMetrics.liquidationProbability}%
                            </p>
                        </div>

                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Recommended LTV</p>
                            <p className="text-xl font-bold text-blue-600">
                                {riskMetrics.recommendedLTV}%
                            </p>
                        </div>

                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">AI Confidence</p>
                            <p className="text-xl font-bold text-purple-600">
                                {riskMetrics.confidence}%
                            </p>
                        </div>
                    </div>

                    {lastUpdated && (
                        <div className="text-xs text-gray-500 text-center">
                            Last updated: {lastUpdated.toLocaleString()}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-gray-600">
                        {userAddress ? 'Enter collateral and borrow amounts to see AI risk analysis' : 'Connect wallet to enable AI risk assessment'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIRiskAssessment;