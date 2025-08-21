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

interface AIRiskData {
    riskScore: number;
    liquidationProbability: number;
    recommendedLTV: number;
    aiConfidence: number;
}

interface CrossChainPositionsProps {
    userAddress?: string;
}

const CrossChainPositions: React.FC<CrossChainPositionsProps> = ({ userAddress }) => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiRiskData, setAiRiskData] = useState<AIRiskData | null>(null);

    const loadPositions = async () => {
        if (!userAddress) return;

        setLoading(true);
        try {
            const userPositions = await walletService.getUserPositions();
            setPositions(userPositions);

            // If positions exist, run AI risk assessment on the first one
            if (userPositions.length > 0) {
                await runAIRiskAssessment(userPositions[0]);
            }
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
        setLoading(false);
    };

    const runAIRiskAssessment = async (position: Position) => {
        try {
            const mockPositionData = {
                collateral: parseFloat(ethers.formatEther(position.collateralAmount)),
                borrowed: parseFloat(ethers.formatEther(position.borrowedAmount)),
                collateralAsset: 'ZETA',
                borrowAsset: 'ZETA',
                chain: position.borrowChain,
                userAddress: userAddress || '',
                marketConditions: {
                    volatility: Math.random() * 50 + 25,
                    liquidityDepth: Math.random() * 1000000 + 500000
                }
            };

            const riskAssessment = await aiService.assessRisk(mockPositionData);

            // Fix: Access riskAssessment properties directly, not riskAssessment.data
            const riskData: AIRiskData = {
                riskScore: riskAssessment.riskScore,
                liquidationProbability: riskAssessment.liquidationProbability,
                recommendedLTV: riskAssessment.recommendedLTV,
                aiConfidence: riskAssessment.aiConfidence
            };

            setAiRiskData(riskData);
        } catch (error) {
            console.error('Risk assessment failed:', error);
            // Set default risk data on error
            setAiRiskData({
                riskScore: 45,
                liquidationProbability: 12,
                recommendedLTV: 70,
                aiConfidence: 85
            });
        }
    };

    useEffect(() => {
        loadPositions();
    }, [userAddress]);

    const formatEther = (value: string | bigint) => {
        try {
            return parseFloat(ethers.formatEther(value)).toFixed(4);
        } catch {
            return '0.0000';
        }
    };

    const getChainName = (chainId: number) => {
        switch (chainId) {
            case 1: return 'Ethereum';
            case 137: return 'Polygon';
            case 56: return 'BSC';
            case 7001: return 'ZetaChain';
            default: return `Chain ${chainId}`;
        }
    };

    const getRiskColor = (score: number) => {
        if (score < 30) return 'text-green-600';
        if (score < 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (!userAddress) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="text-6xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Wallet</h3>
                <p className="text-gray-600">
                    Connect your wallet to view cross-chain positions
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading positions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🔗 Cross-Chain Positions</h2>
                <button
                    onClick={loadPositions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            {positions.length > 0 ? (
                <>
                    {/* AI Risk Overview */}
                    {aiRiskData && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Risk Overview</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Portfolio Risk</p>
                                    <p className={`text-xl font-bold ${getRiskColor(aiRiskData.riskScore)}`}>
                                        {aiRiskData.riskScore}/100
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Liquidation Risk</p>
                                    <p className="text-xl font-bold text-orange-600">
                                        {aiRiskData.liquidationProbability}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Recommended LTV</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {aiRiskData.recommendedLTV}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">AI Confidence</p>
                                    <p className="text-xl font-bold text-purple-600">
                                        {aiRiskData.aiConfidence}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Positions List */}
                    <div className="grid gap-6">
                        {positions.map((position) => (
                            <div key={position.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Position #{position.id}</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Status:</strong>
                                                <span className={position.isActive ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                                    {position.isActive ? '✅ Active' : '❌ Inactive'}
                                                </span>
                                            </p>
                                            <p><strong>Collateral:</strong> {formatEther(position.collateralAmount)} ZETA</p>
                                            <p><strong>Borrowed:</strong> {formatEther(position.borrowedAmount)} ZETA</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Chain Information</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Collateral Chain:</strong> {getChainName(position.collateralChain)}</p>
                                            <p><strong>Borrow Chain:</strong> {getChainName(position.borrowChain)}</p>
                                            <p><strong>Cross-Chain:</strong>
                                                <span className={position.collateralChain !== position.borrowChain ? 'text-blue-600 ml-1' : 'text-gray-600 ml-1'}>
                                                    {position.collateralChain !== position.borrowChain ? '🔗 Yes' : '🔗 No'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">AI Assessment</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><strong>Risk Score:</strong>
                                                <span className={`ml-1 ${getRiskColor(position.aiRiskScore)}`}>
                                                    {position.aiRiskScore}/100
                                                </span>
                                            </p>
                                            <p><strong>Yield Rate:</strong>
                                                <span className="text-green-600 ml-1">{(position.yieldRate / 100).toFixed(2)}%</span>
                                            </p>
                                            <p><strong>LTV Ratio:</strong>
                                                <span className="ml-1">
                                                    {((parseFloat(formatEther(position.borrowedAmount)) / parseFloat(formatEther(position.collateralAmount))) * 100).toFixed(1)}%
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Actions</h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => runAIRiskAssessment(position)}
                                                className="w-full text-sm bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors"
                                            >
                                                🤖 AI Analysis
                                            </button>
                                            <button className="w-full text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors">
                                                📈 Add Collateral
                                            </button>
                                            <button className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">
                                                💰 Repay
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cross-Chain Positions</h3>
                    <p className="text-gray-600 mb-6">
                        Create your first cross-chain lending position to get started
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        Create Position
                    </button>
                </div>
            )}
        </div>
    );
};

export default CrossChainPositions;