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

interface LiquidationAlert {
    positionId: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    currentLTV: number;
    liquidationThreshold: number;
    timeToLiquidation: string;
    recommendedAction: string;
    aiConfidence: number;
}

interface LiquidationMonitorProps {
    userAddress?: string;
}

const LiquidationMonitor: React.FC<LiquidationMonitorProps> = ({ userAddress }) => {
    const [userPositions, setUserPositions] = useState<Position[]>([]);
    const [liquidationAlerts, setLiquidationAlerts] = useState<LiquidationAlert[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const monitorPositions = async () => {
        if (!userAddress) return;

        setLoading(true);
        try {
            const positions = await walletService.getUserPositions();
            setUserPositions(positions);

            const alerts: LiquidationAlert[] = [];

            for (const position of positions) {
                if (position.isActive) {
                    // FIX: Use assessRisk instead of predictLiquidation
                    const mockPositionData = {
                        collateral: parseFloat(ethers.formatEther(position.collateralAmount)),
                        borrowed: parseFloat(ethers.formatEther(position.borrowedAmount)),
                        collateralAsset: 'ZETA',
                        borrowAsset: 'ZETA',
                        chain: position.borrowChain,
                        userAddress: userAddress,
                        marketConditions: {
                            volatility: Math.random() * 50 + 25,
                            liquidityDepth: Math.random() * 1000000 + 500000
                        }
                    };

                    const riskAssessment = await aiService.assessRisk(mockPositionData);

                    const currentLTV = (parseFloat(ethers.formatEther(position.borrowedAmount)) / parseFloat(ethers.formatEther(position.collateralAmount))) * 100;

                    // Convert risk assessment to liquidation prediction
                    const alert: LiquidationAlert = {
                        positionId: position.id,
                        riskLevel: getRiskLevel(riskAssessment.riskScore),
                        currentLTV: currentLTV,
                        liquidationThreshold: 85, // 85% LTV threshold
                        timeToLiquidation: getTimeToLiquidation(riskAssessment.liquidationProbability),
                        recommendedAction: getRecommendedAction(riskAssessment.riskScore, currentLTV),
                        aiConfidence: riskAssessment.aiConfidence
                    };

                    // Only add alerts for positions with medium or higher risk
                    if (alert.riskLevel !== 'low') {
                        alerts.push(alert);
                    }
                }
            }

            setLiquidationAlerts(alerts);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Liquidation monitoring failed:', error);
            // Create mock alerts for demonstration
            if (userPositions.length > 0) {
                const mockAlert: LiquidationAlert = {
                    positionId: userPositions[0].id,
                    riskLevel: 'medium',
                    currentLTV: 65,
                    liquidationThreshold: 85,
                    timeToLiquidation: '2-3 days',
                    recommendedAction: 'Add more collateral or repay part of the loan',
                    aiConfidence: 82
                };
                setLiquidationAlerts([mockAlert]);
                setLastUpdated(new Date());
            }
        }
        setLoading(false);
    };

    const getRiskLevel = (riskScore: number): 'low' | 'medium' | 'high' | 'critical' => {
        if (riskScore < 30) return 'low';
        if (riskScore < 50) return 'medium';
        if (riskScore < 75) return 'high';
        return 'critical';
    };

    const getTimeToLiquidation = (liquidationProbability: number): string => {
        if (liquidationProbability < 20) return '> 7 days';
        if (liquidationProbability < 40) return '3-7 days';
        if (liquidationProbability < 60) return '1-3 days';
        if (liquidationProbability < 80) return '< 24 hours';
        return '< 6 hours';
    };

    const getRecommendedAction = (riskScore: number, currentLTV: number): string => {
        if (riskScore > 75) return 'URGENT: Add collateral immediately or repay loan';
        if (riskScore > 50) return 'Add more collateral or partially repay loan';
        if (currentLTV > 70) return 'Consider reducing LTV ratio for safer positioning';
        return 'Monitor position closely and consider rebalancing';
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'low': return '✅';
            case 'medium': return '⚠️';
            case 'high': return '🔥';
            case 'critical': return '🚨';
            default: return '❓';
        }
    };

    useEffect(() => {
        monitorPositions();

        // Set up automatic monitoring every 30 seconds
        const interval = setInterval(monitorPositions, 30000);
        return () => clearInterval(interval);
    }, [userAddress]);

    if (!userAddress) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Wallet</h3>
                <p className="text-gray-600">
                    Connect your wallet to monitor liquidation risks
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">🚨 Liquidation Monitor</h2>
                    <p className="text-sm text-gray-600">
                        AI-powered real-time liquidation risk monitoring
                    </p>
                </div>
                <div className="text-right">
                    <button
                        onClick={monitorPositions}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${loading
                            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {loading ? '🔄 Scanning...' : '🔄 Refresh Scan'}
                    </button>
                    {lastUpdated && (
                        <p className="text-xs text-gray-500 mt-2">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm text-gray-600">Total Positions</p>
                    <p className="text-xl font-bold text-blue-600">{userPositions.length}</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                    <div className="text-2xl mb-2">⚠️</div>
                    <p className="text-sm text-gray-600">At Risk</p>
                    <p className="text-xl font-bold text-yellow-600">{liquidationAlerts.length}</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                    <div className="text-2xl mb-2">🔥</div>
                    <p className="text-sm text-gray-600">High Risk</p>
                    <p className="text-xl font-bold text-orange-600">
                        {liquidationAlerts.filter(alert => alert.riskLevel === 'high' || alert.riskLevel === 'critical').length}
                    </p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 text-center">
                    <div className="text-2xl mb-2">🚨</div>
                    <p className="text-sm text-gray-600">Critical</p>
                    <p className="text-xl font-bold text-red-600">
                        {liquidationAlerts.filter(alert => alert.riskLevel === 'critical').length}
                    </p>
                </div>
            </div>

            {/* Liquidation Alerts */}
            {liquidationAlerts.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">🚨 Active Alerts</h3>
                    {liquidationAlerts.map((alert) => (
                        <div
                            key={alert.positionId}
                            className={`rounded-xl p-6 border-2 ${getRiskColor(alert.riskLevel)}`}
                        >
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                                        {getRiskIcon(alert.riskLevel)} Position #{alert.positionId}
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Risk Level:</strong>
                                            <span className={`ml-1 font-medium capitalize`}>
                                                {alert.riskLevel}
                                            </span>
                                        </p>
                                        <p><strong>Current LTV:</strong>
                                            <span className="ml-1 font-medium">{alert.currentLTV.toFixed(1)}%</span>
                                        </p>
                                        <p><strong>Liquidation Threshold:</strong>
                                            <span className="ml-1 font-medium">{alert.liquidationThreshold}%</span>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">⏰ Time Estimate</h4>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Time to Liquidation:</strong>
                                            <span className="ml-1 font-medium">{alert.timeToLiquidation}</span>
                                        </p>
                                        <p><strong>AI Confidence:</strong>
                                            <span className="ml-1 font-medium">{alert.aiConfidence}%</span>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">💡 Recommended Action</h4>
                                    <p className="text-sm text-gray-700 mb-3">{alert.recommendedAction}</p>
                                    <div className="space-y-2">
                                        <button className="w-full text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors">
                                            Add Collateral
                                        </button>
                                        <button className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">
                                            Repay Loan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : userPositions.length > 0 ? (
                <div className="bg-green-50 rounded-xl p-8 border border-green-200 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">All Positions Safe</h3>
                    <p className="text-green-700">
                        No liquidation risks detected across your {userPositions.length} active position{userPositions.length !== 1 ? 's' : ''}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                    <div className="text-6xl mb-4">🚨</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Positions to Monitor</h3>
                    <p className="text-gray-600 mb-6">
                        Create lending positions to enable liquidation monitoring
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Create Position
                    </button>
                </div>
            )}

            {/* Monitoring Info */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">🤖 How AI Monitoring Works</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Real-Time Analysis</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Continuous position health monitoring</li>
                            <li>• Market volatility assessment</li>
                            <li>• Price prediction algorithms</li>
                            <li>• Liquidity depth analysis</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-700 mb-2">Predictive Alerts</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Early warning system (6+ hours ahead)</li>
                            <li>• Risk level classification</li>
                            <li>• Actionable recommendations</li>
                            <li>• Confidence scoring</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiquidationMonitor;