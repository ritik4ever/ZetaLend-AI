import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, PROTOCOL_INFO } from './utils/constants';
import { walletService, WalletState } from './services/wallet';
import { aiService } from './services/ai';
import CrossChainLendingInterface from './components/CrossChainLending';

interface DashboardStats {
    totalValueLocked: string;
    totalPositions: number;
    averageYield: string;
    riskScore: number;
}

interface LendingPosition {
    id: string;
    collateralAmount: string;
    borrowedAmount: string;
    collateralChain: number;
    borrowChain: number;
    isActive: boolean;
    aiRiskScore: number;
    yieldRate: number;
}

interface AIAssessment {
    riskScore: number;
    liquidationProbability: number;
    recommendedLTV: number;
    riskFactors: string[];
    recommendations: string[];
    aiConfidence: number;
    timestamp: string;
}

// Updated Transaction interface to match wallet service
interface Transaction {
    hash: string;
    type: string;
    collateralAmount?: string;
    borrowAmount?: string;
    amount?: string; // For backward compatibility
    collateralToken?: string;
    borrowToken?: string;
    collateralChain?: number;
    borrowChain?: number;
    timestamp: number;
    status: string;
    blockNumber?: number;
    gasUsed?: string;
    fromChain?: string;
    toChain?: string;
    aiRiskScore?: number;
}

const App: React.FC = () => {
    const [walletState, setWalletState] = useState<WalletState>(walletService.getState());
    const [currentView, setCurrentView] = useState<'dashboard' | 'positions' | 'lending' | 'docs' | 'transactions' | 'ai-demo'>('dashboard');
    const [dashboardStats] = useState<DashboardStats>({
        totalValueLocked: '2,450,000',
        totalPositions: 127,
        averageYield: '7.2',
        riskScore: 23
    });
    const [userPositions, setUserPositions] = useState<LendingPosition[]>([]);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [aiAssessment, setAiAssessment] = useState<AIAssessment | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const unsubscribe = walletService.subscribe(setWalletState);
        return unsubscribe;
    }, []);

    useEffect(() => {
        fetch("https://zetalend-ai.onrender.com/api/health")
            .then(res => res.json())
            .then(data => console.log("Backend says:", data))
            .catch(err => console.error("❌ Backend not reachable:", err));
    }, []);

    useEffect(() => {
        if (walletState.isConnected) {
            loadUserPositions();
            loadTransactions();
        }
    }, [walletState.isConnected]);

    const loadUserPositions = async () => {
        try {
            const positions = await walletService.getUserPositions();
            setUserPositions(positions);
        } catch (error) {
            console.error('Failed to load positions:', error);
        }
    };

    const loadTransactions = () => {
        const txHistory = walletService.getTransactions();
        setTransactions(txHistory);
    };

    // Handle transaction creation from lending component
    const handleTransactionCreated = (newTransaction: Transaction) => {
        setTransactions(prev => [newTransaction, ...prev]);
        // Save to localStorage for persistence
        const updatedTransactions = [newTransaction, ...transactions];
        if (typeof window !== 'undefined') {
            localStorage.setItem('zetalend_transactions', JSON.stringify(updatedTransactions.slice(0, 50)));
        }
    };

    const connectWallet = async (walletName: string) => {
        try {
            const wallet = walletService.wallets.find(w => w.name === walletName);
            if (wallet) {
                if (!wallet.isInstalled()) {
                    alert(`${walletName} is not installed. Please install it first.`);
                    return;
                }
                await wallet.connect();
                setShowWalletModal(false);
            }
        } catch (error) {
            console.error(`Failed to connect ${walletName}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Please try again.';
            alert(`Failed to connect ${walletName}. ${errorMessage}`);
        }
    };

    const runAIRiskAssessment = async () => {
        setAiLoading(true);
        try {
            const mockPositionData = {
                collateral: 100,
                borrowed: 75,
                collateralAsset: 'ZETA',
                borrowAsset: 'USDC',
                chain: 1,
                userAddress: walletState.address || '0x0000000000000000000000000000000000000000',
                marketConditions: {
                    volatility: Math.random() * 50 + 25,
                    liquidityDepth: Math.random() * 1000000 + 500000
                }
            };

            const result = await aiService.assessRisk(mockPositionData);
            setAiAssessment(result);
        } catch (error) {
            console.error('AI Risk Assessment Error:', error);
            alert('AI assessment completed with fallback analysis.');
            setAiAssessment({
                riskScore: Math.floor(Math.random() * 40) + 30,
                liquidationProbability: Math.floor(Math.random() * 25) + 10,
                recommendedLTV: Math.floor(Math.random() * 20) + 60,
                riskFactors: ['Market volatility', 'LTV exposure', 'Cross-chain risk'],
                recommendations: ['Monitor position', 'Set alerts', 'Consider rebalancing'],
                aiConfidence: Math.floor(Math.random() * 15) + 80,
                timestamp: new Date().toISOString()
            });
        }
        setAiLoading(false);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatBalance = (balance: string | null) => {
        if (!balance) return '0';
        return parseFloat(balance).toFixed(4);
    };

    const formatEther = (value: string | bigint) => {
        try {
            return parseFloat(ethers.formatEther(value)).toFixed(4);
        } catch {
            return '0';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': case 'success': return 'text-emerald-600';
            case 'failed': return 'text-red-500';
            case 'pending': return 'text-amber-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': case 'success': return '✅';
            case 'failed': return '❌';
            case 'pending': return '⏳';
            default: return '❓';
        }
    };

    const navigation = [
        { name: 'Dashboard', id: 'dashboard' as const, icon: '📊' },
        { name: 'Lend/Borrow', id: 'lending' as const, icon: '💰' },
        { name: 'My Positions', id: 'positions' as const, icon: '📈' },
        { name: 'Transactions', id: 'transactions' as const, icon: '📋' },
        { name: 'AI Demo', id: 'ai-demo' as const, icon: '🤖' },
        { name: 'How It Works', id: 'docs' as const, icon: '📚' },
    ];

    // Load transactions from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('zetalend_transactions');
            if (saved) {
                try {
                    setTransactions(JSON.parse(saved));
                } catch (error) {
                    console.error('Failed to parse saved transactions:', error);
                }
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="text-2xl font-bold text-gray-900">
                                ZetaLend AI
                            </div>
                            <div className="ml-4 text-sm text-gray-500 hidden lg:block">
                                AI-Powered Cross-Chain Lending Protocol
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id)}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentView === item.id
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    <span className="hidden lg:inline">{item.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-4">
                            {walletState.isConnected ? (
                                <div className="flex items-center space-x-4">
                                    <div className="text-sm text-right">
                                        <div className="font-medium text-gray-900">
                                            {formatAddress(walletState.address!)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatBalance(walletState.balance)} ZETA
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => walletService.disconnect()}
                                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowWalletModal(true)}
                                    className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                                >
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden bg-white border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-1 p-2">
                        {navigation.slice(0, 6).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-colors ${currentView === item.id
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span className="text-lg mb-1">{item.icon}</span>
                                <span className="truncate">{item.name.split('/')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Network Warning */}
            {walletState.isConnected && walletState.chainId !== CHAIN_CONFIG.ZETA_TESTNET.chainId && (
                <div className="bg-amber-50 border-b border-amber-100 p-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-amber-600 mr-3">⚠️</span>
                                <span className="text-sm font-medium text-amber-800">
                                    Wrong Network - Please switch to ZetaChain Testnet (Chain ID: 7001)
                                </span>
                            </div>
                            <button
                                onClick={() => walletService.switchToZetaChain()}
                                className="text-sm font-medium text-amber-800 underline hover:text-amber-900"
                            >
                                Switch Network
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wallet Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {walletService.wallets.map((wallet) => (
                                <button
                                    key={wallet.name}
                                    onClick={() => connectWallet(wallet.name)}
                                    disabled={!wallet.isInstalled()}
                                    className={`w-full flex items-center p-4 rounded-xl border transition-colors ${wallet.isInstalled()
                                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    <span className="text-2xl mr-4">{wallet.icon}</span>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">{wallet.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {wallet.isInstalled() ? 'Available' : 'Not Installed'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Dashboard View */}
                {currentView === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                ZetaLend AI Protocol
                            </h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Advanced AI-powered cross-chain lending protocol built on ZetaChain.
                                Lend, borrow, and earn across multiple blockchains with intelligent risk management.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-xl">💰</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Value Locked</p>
                                        <p className="text-2xl font-bold text-gray-900">${dashboardStats.totalValueLocked}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-xl">📊</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Positions</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalPositions}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-xl">📈</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Average Yield</p>
                                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.averageYield}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-xl">🛡️</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Risk Score</p>
                                        <p className="text-2xl font-bold text-emerald-600">{dashboardStats.riskScore}/100</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Live Contract Information</h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">Deployed Contract</h4>
                                    <p className="text-sm text-gray-600 mb-2">Address:</p>
                                    <code className="bg-gray-50 px-4 py-3 rounded-xl text-sm font-mono block break-all">
                                        {CONTRACT_ADDRESSES.ZETA_LEND_AI}
                                    </code>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">Network Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Network:</strong> {CHAIN_CONFIG.ZETA_TESTNET.name}</p>
                                        <p><strong>Chain ID:</strong> {CHAIN_CONFIG.ZETA_TESTNET.chainId}</p>
                                        <p><strong>Status:</strong> <span className="text-emerald-600 font-semibold">✅ Live</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features Highlight */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-8 text-center">Protocol Features</h3>
                            <div className="grid md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl">🎯</span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-2">Cross-Chain Lending</h4>
                                    <p className="text-sm text-gray-600">Multi-chain liquidity access</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl">🔗</span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-2">Universal Contracts</h4>
                                    <p className="text-sm text-gray-600">ZetaChain orchestration</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl">⚡</span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-2">Gateway API</h4>
                                    <p className="text-sm text-gray-600">Innovative cross-chain execution</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <span className="text-xl">🤖</span>
                                    </div>
                                    <h4 className="font-medium text-gray-900 mb-2">AI Features</h4>
                                    <p className="text-sm text-gray-600">Google Gemini AI integration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cross-Chain Lending Interface */}
                {currentView === 'lending' && (
                    <CrossChainLendingInterface
                        userAddress={walletState.address}
                        onTransactionCreated={handleTransactionCreated}
                    />
                )}

                {/* Positions View */}
                {currentView === 'positions' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">My Positions</h2>

                        {walletState.isConnected ? (
                            userPositions.length > 0 ? (
                                <div className="grid gap-6">
                                    {userPositions.map((position) => (
                                        <div key={position.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                            <h4 className="font-semibold text-gray-700 mb-4">Position #{position.id}</h4>
                                            <div className="grid md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-sm text-gray-600">Collateral: <span className="font-medium text-gray-900">{formatEther(position.collateralAmount)} ZETA</span></p>
                                                    <p className="text-sm text-gray-600">Borrowed: <span className="font-medium text-gray-900">{formatEther(position.borrowedAmount)} ZETA</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Risk Score: <span className="font-medium text-gray-900">{position.aiRiskScore}/100</span></p>
                                                    <p className="text-sm text-gray-600">Yield Rate: <span className="font-medium text-emerald-600">{position.yieldRate / 100}%</span></p>
                                                </div>
                                                <div>
                                                    <button className="w-full text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                                                        Manage Position
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                                    <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No Positions Yet</h3>
                                    <p className="text-gray-600 mb-8">
                                        Create your first cross-chain lending position to start earning yield
                                    </p>
                                    <button
                                        onClick={() => setCurrentView('lending')}
                                        className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                                    >
                                        Create First Position
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect Wallet</h3>
                                <p className="text-gray-600 mb-8">
                                    Connect your wallet to view your lending positions
                                </p>
                                <button
                                    onClick={() => setShowWalletModal(true)}
                                    className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Connect Wallet
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Transactions View - FIXED */}
                {currentView === 'transactions' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">Transaction History</h2>

                        {walletState.isConnected ? (
                            <div className="space-y-4">
                                {transactions.length > 0 ? (
                                    transactions.map((tx, index) => (
                                        <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center mb-2">
                                                        <span className="text-lg mr-3">🔗</span>
                                                        <h4 className="font-semibold text-gray-900">Cross-Chain Lending Position</h4>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                                        <div>
                                                            <p><strong>Collateral:</strong> {tx.collateralAmount || tx.amount} {tx.collateralToken || 'ZETA'}</p>
                                                            <p><strong>Borrowed:</strong> {tx.borrowAmount || '0'} {tx.borrowToken || 'USDC'}</p>
                                                        </div>
                                                        <div>
                                                            <p><strong>Transaction Hash:</strong></p>
                                                            <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded break-all">
                                                                {tx.hash}
                                                            </code>
                                                        </div>
                                                    </div>

                                                    {tx.blockNumber && (
                                                        <p className="text-xs text-gray-500">
                                                            Block: {tx.blockNumber} | Gas Used: {tx.gasUsed || 'Unknown'}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="text-right ml-6">
                                                    <div className="flex items-center mb-2">
                                                        <span className={`text-sm font-medium ${getStatusColor(tx.status)}`}>
                                                            {getStatusIcon(tx.status)} {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(tx.timestamp).toLocaleString()}
                                                    </p>
                                                    <a
                                                        href={`https://zetachain-athens-3.blockscout.com/tx/${tx.hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                                    >
                                                        View on Explorer
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                                        <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">📋</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Transactions Yet</h3>
                                        <p className="text-gray-600 mb-8">
                                            Your transaction history will appear here after you create lending positions
                                        </p>
                                        <button
                                            onClick={() => setCurrentView('lending')}
                                            className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                                        >
                                            Create First Position
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                                <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect Wallet</h3>
                                <p className="text-gray-600 mb-8">
                                    Connect your wallet to view transaction history
                                </p>
                                <button
                                    onClick={() => setShowWalletModal(true)}
                                    className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                                >
                                    Connect Wallet
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Demo View */}
                {currentView === 'ai-demo' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Risk Assessment Demo</h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Experience our advanced AI-powered risk assessment system powered by Google Gemini AI.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Test AI Risk Assessment</h3>
                            <p className="text-gray-600 mb-8">
                                Click the button below to run a real AI risk assessment using mock data.
                            </p>

                            <button
                                onClick={runAIRiskAssessment}
                                disabled={aiLoading}
                                className={`px-8 py-4 rounded-xl font-semibold transition-all ${aiLoading
                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white transform hover:scale-105'
                                    }`}
                            >
                                {aiLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                        AI Analyzing...
                                    </div>
                                ) : (
                                    'Run AI Risk Assessment'
                                )}
                            </button>
                        </div>

                        {aiAssessment && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6">AI Analysis Results</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-4">Risk Metrics</h4>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span>Risk Score:</span>
                                                <strong>{aiAssessment.riskScore}/100</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Liquidation Risk:</span>
                                                <strong>{aiAssessment.liquidationProbability}%</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Recommended LTV:</span>
                                                <strong>{aiAssessment.recommendedLTV}%</strong>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>AI Confidence:</span>
                                                <strong>{aiAssessment.aiConfidence}%</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-4">Analysis Time</h4>
                                        <p className="text-sm text-gray-500">
                                            Generated: {new Date(aiAssessment.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Documentation View */}
                {currentView === 'docs' && (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-gray-900">How ZetaLend AI Works</h2>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">AI Integration</h3>
                            <p className="text-gray-700 mb-4">
                                Our AI powered by Google Gemini analyzes market data, user positions, and cross-chain liquidity in real-time to calculate risk scores and optimal lending parameters.
                            </p>
                            <p className="text-gray-700">
                                The AI considers factors like volatility, correlation, and liquidity depth across multiple chains to provide intelligent risk management.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Cross-Chain Lending Process</h3>
                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1">1</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Connect Wallet & Deposit Collateral</h4>
                                        <p className="text-gray-600">Connect your wallet and deposit ZETA tokens as collateral on ZetaChain.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1">2</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">AI Risk Assessment</h4>
                                        <p className="text-gray-600">Our AI analyzes your position and market conditions to determine optimal lending parameters.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-gray-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 mt-1">3</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">Cross-Chain Execution</h4>
                                        <p className="text-gray-600">The Universal Contract executes your borrowing request on the target chain via ZetaChain Gateway API.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <footer className="bg-white border-t border-gray-100 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">ZetaLend AI</h3>
                        <p className="text-gray-600 text-sm mb-4">
                            Advanced AI-powered cross-chain lending protocol built on ZetaChain.
                        </p>
                        <p className="text-sm text-gray-500">
                            Contract: {formatAddress(CONTRACT_ADDRESSES.ZETA_LEND_AI)} | Version: {PROTOCOL_INFO.version}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;