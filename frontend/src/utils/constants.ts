export const CONTRACT_ADDRESSES = {
    ZETA_LEND_AI: '0x4Cdf2668Fec5A48aB4CaB277353d1a1B073704a3', // Your real ZetaLend contract
    ZETA_GATEWAY: process.env.REACT_APP_ZETA_GATEWAY_CONTRACT || '0xfEDD7A6e3Ef1cC470fbfbF955a22D793dDC0F44E',
    CROSS_CHAIN_CONNECTOR: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
    GATEWAY_ZEVM: '0xfEDD7A6e3Ef1cC470fbfbF955a22D793dDC0F44E',

    RECEIVERS: {
        1: '0x0e53d4a9a4176e911cc38eac89e099c8343608ac',    // Ethereum
        137: '0xee21c8cc9d75558698c78ce19f6783bb0df1cb32',  // Polygon
        56: '0xd66fa7b4472a1eaa08ba217ef67a687c63655969'   // BSC
    }

};

export const ZETA_LEND_ABI = [
    // ✅ MAIN LENDING FUNCTION (this was missing!)
    "function lendCrossChain(uint256 collateralAmount, uint256 borrowAmount, uint256 borrowChain, address borrowToken, bytes calldata aiRiskDataEncoded) external payable",

    // ✅ ADMIN FUNCTIONS
    "function setReceiverContracts(uint256[] calldata chainIds, address[] calldata receivers) external",
    "function setReceiverContract(uint256 chainId, address receiver) external",

    // ✅ VIEW FUNCTIONS
    "function receiverContracts(uint256) external view returns (address)",
    "function getReceiverContracts() external view returns (uint256[] memory chains, address[] memory receivers)",
    "function lendingPositions(uint256) external view returns (address user, uint256 collateralAmount, uint256 borrowedAmount, uint256 collateralChain, uint256 borrowChain, address collateralToken, address borrowToken, uint256 liquidationThreshold, uint256 timestamp, bool isActive, uint256 aiRiskScore, uint256 yieldRate)",
    "function aiRiskData(uint256) external view returns (uint256 riskScore, uint256 recommendedLTV, uint256 liquidationProbability, uint256 timestamp, uint256 healthFactor, uint256 optimizedYieldChain)",
    "function getUserPositions(address user) external view returns (uint256[])",
    "function getLendingPosition(uint256 positionId) external view returns (tuple(address user, uint256 collateralAmount, uint256 borrowedAmount, uint256 collateralChain, uint256 borrowChain, address collateralToken, address borrowToken, uint256 liquidationThreshold, uint256 timestamp, bool isActive, uint256 aiRiskScore, uint256 yieldRate))",
    "function getAIRiskAssessment(uint256 positionId) external view returns (tuple(uint256 riskScore, uint256 recommendedLTV, uint256 liquidationProbability, uint256 timestamp, uint256 healthFactor, uint256 optimizedYieldChain))",
    "function nextPositionId() external view returns (uint256)",
    "function gateway() external view returns (address)",
    "function admin() external view returns (address)",

    // ✅ RISK MANAGEMENT FUNCTIONS
    "function updateAIRiskAssessment(uint256 positionId, uint256 newRiskScore, uint256 newLiquidationProb) external",
    "function liquidatePositionAdvanced(uint256 positionId) external",
    "function isPositionHealthy(uint256 positionId) external view returns (bool)",

    // ✅ UTILITY FUNCTIONS
    "function decodeAIRiskData(bytes calldata data) external pure returns (uint256 riskScore, uint256 recommendedLTV, uint256 liquidationProb, uint256 optimizedChain)",

    // ✅ EVENTS
    "event CrossChainLend(address indexed user, uint256 indexed positionId, uint256 collateralChain, uint256 borrowChain, uint256 collateralAmount, uint256 borrowAmount)",
    "event CrossChainMessageSent(uint256 indexed positionId, uint256 targetChain, string messageType, address targetReceiver)",
    "event AIRiskUpdate(uint256 indexed positionId, uint256 riskScore, uint256 liquidationProbability)",
    "event CrossChainLiquidation(uint256 indexed positionId, address indexed liquidator, uint256 liquidatedAmount, uint256[] affectedChains)",
    "event ReceiverContractSet(uint256 indexed chainId, address receiver)"
];

export const CHAIN_CONFIG = {
    ZETA_TESTNET: {
        chainId: 7001,
        name: 'ZetaChain Athens Testnet',
        rpc: process.env.REACT_APP_ZETA_TESTNET_RPC || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
        alternativeRpcs: [
            'https://7001.rpc.thirdweb.com',
            'https://zetachain-athens-3.rpc.l0vd.com',
            'https://rpc.ankr.com/zetachain_evm_athens_testnet',
            'https://zetachain-testnet.drpc.org',
            'https://zetachain-athens.g.allthatnode.com/archive/evm'
        ],
        explorer: 'https://zetachain-athens-3.blockscout.com',
        nativeCurrency: {
            name: 'ZETA',
            symbol: 'ZETA',
            decimals: 18,
        },
        networkParams: {
            chainId: '0x1B59', // 7001 in hex
            chainName: 'ZetaChain Athens Testnet',
            nativeCurrency: {
                name: 'ZETA',
                symbol: 'ZETA',
                decimals: 18,
            },
            rpcUrls: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
            blockExplorerUrls: ['https://zetachain-athens-3.blockscout.com'],
        },
    },
    ETHEREUM: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpc: process.env.REACT_APP_ETHEREUM_RPC || 'https://ethereum.publicnode.com',
        explorer: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
    },
    POLYGON: {
        chainId: 137,
        name: 'Polygon Mainnet',
        rpc: 'https://polygon-rpc.com',
        explorer: 'https://polygonscan.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
    },
    BSC: {
        chainId: 56,
        name: 'BNB Smart Chain',
        rpc: 'https://bsc-dataseed.binance.org',
        explorer: 'https://bscscan.com',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
    },
};

// ✅ ENHANCED: RPC testing with better error handling
export async function getWorkingRpcUrl(): Promise<string> {
    const { ethers } = await import('ethers');

    const rpcUrls = [
        CHAIN_CONFIG.ZETA_TESTNET.rpc,
        ...CHAIN_CONFIG.ZETA_TESTNET.alternativeRpcs
    ];

    console.log('🔍 Testing RPC endpoints for ZetaChain...');

    for (const rpcUrl of rpcUrls) {
        try {
            console.log('🧪 Testing RPC:', rpcUrl);
            const provider = new ethers.JsonRpcProvider(rpcUrl);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('RPC timeout')), 5000)
            );

            const blockPromise = provider.getBlockNumber();
            const blockNumber = await Promise.race([blockPromise, timeoutPromise]) as number;

            if (blockNumber > 0) {
                console.log('✅ Working RPC found:', rpcUrl, 'Block:', blockNumber);
                return rpcUrl;
            }
        } catch (error) {
            console.log('❌ RPC failed:', rpcUrl, error);
        }
    }

    console.warn('⚠️ All RPC endpoints failed, using primary as fallback');
    return CHAIN_CONFIG.ZETA_TESTNET.rpc;
}

// ✅ ENHANCED: Utility functions for contract interaction
export const CONTRACT_HELPERS = {
    // Encode AI risk data for contract
    encodeAIRiskData: (riskScore: number, recommendedLTV: number, liquidationProb: number, optimizedChain: number) => {
        const { ethers } = require('ethers');
        return ethers.AbiCoder.defaultAbiCoder().encode(
            ['uint256', 'uint256', 'uint256', 'uint256'],
            [
                Math.floor(Math.max(0, Math.min(100, riskScore))),
                Math.floor(Math.max(0, Math.min(100, recommendedLTV))),
                Math.floor(Math.max(0, Math.min(100, liquidationProb))),
                optimizedChain
            ]
        );
    },

    // Decode AI risk data from contract
    decodeAIRiskData: (encodedData: string) => {
        try {
            const { ethers } = require('ethers');
            const [riskScore, recommendedLTV, liquidationProb, optimizedChain] = ethers.AbiCoder.defaultAbiCoder().decode(
                ['uint256', 'uint256', 'uint256', 'uint256'],
                encodedData
            );
            return {
                riskScore: Number(riskScore),
                recommendedLTV: Number(recommendedLTV),
                liquidationProb: Number(liquidationProb),
                optimizedChain: Number(optimizedChain)
            };
        } catch (error) {
            console.error('Failed to decode AI risk data:', error);
            return {
                riskScore: 50,
                recommendedLTV: 65,
                liquidationProb: 20,
                optimizedChain: 1
            };
        }
    },

    // Get explorer URL for transaction
    getExplorerUrl: (txHash: string) => {
        return `${CHAIN_CONFIG.ZETA_TESTNET.explorer}/tx/${txHash}`;
    },

    // Get explorer URL for address
    getAddressUrl: (address: string) => {
        return `${CHAIN_CONFIG.ZETA_TESTNET.explorer}/address/${address}`;
    },

    // Validate contract address
    isValidAddress: (address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },

    // Format position data for display
    formatPosition: (position: any) => {
        const { ethers } = require('ethers');
        return {
            id: position.id?.toString() || '0',
            user: position.user || '0x0',
            collateralAmount: position.collateralAmount ? ethers.formatEther(position.collateralAmount) : '0',
            borrowedAmount: position.borrowedAmount ? ethers.formatEther(position.borrowedAmount) : '0',
            collateralChain: Number(position.collateralChain) || 7001,
            borrowChain: Number(position.borrowChain) || 1,
            isActive: Boolean(position.isActive),
            aiRiskScore: Number(position.aiRiskScore) || 0,
            timestamp: Number(position.timestamp) || 0
        };
    }
};

// Protocol information (enhanced)
export const PROTOCOL_INFO = {
    name: 'ZetaLend AI',
    version: '1.0.0',
    description: 'AI-Powered Cross-Chain Lending Protocol',
    website: 'https://zetalend.ai',
    documentation: 'https://docs.zetalend.ai',
    github: 'https://github.com/zetalend/zetalend-ai',
    telegram: 'https://t.me/zetalendai',
    twitter: 'https://twitter.com/zetalendai',
    buildathon: {
        name: 'ZetaChain Google Cloud Buildathon',
        track: 'Cross-Chain Lending',
        prizes: [
            'Cross-Chain Lending Track ($3,000)',
            'Best Use of ZetaChain Universal Contract ($1,000)',
            'Most Innovative Use of Gateway API ($1,000)',
            'Best AI feature ($1,000)',
        ],
        total_potential: '$6,000 + Google Cloud Credits',
    },
};

export const AI_CONFIG = {
    backend_url: process.env.REACT_APP_AI_BACKEND_URL || 'http://localhost:8000',
    gemini_api_key: process.env.REACT_APP_GEMINI_API_KEY,
    model: 'gemini-1.5-flash', // ✅ Updated to latest model
    risk_threshold: {
        low: 30,
        medium: 60,
        high: 80,
        critical: 90,
    },
    confidence_threshold: 75,
    update_interval: 30000,
    max_ltv_safe: 65,
    max_ltv_risky: 85,

    fallback_enabled: true,
    fallback_risk_calculation: {
        base_risk: 40,
        ltv_multiplier: 0.8,
        volatility_factor: 0.3,
        chain_risk_modifier: {
            7001: 0.9,  // ZetaChain - lower risk
            1: 1.0,     // Ethereum - baseline
            137: 1.1,   // Polygon - slightly higher
            56: 1.2     // BSC - higher risk
        }
    }
};

// Legacy API Base URL for backward compatibility
export const API_BASE_URL = AI_CONFIG.backend_url;

export const SUPPORTED_TOKENS = {
    ZETA: {
        symbol: 'ZETA',
        name: 'ZetaChain',
        decimals: 18,
        icon: '⚡',
        address: '0x0000000000000000000000000000000000000000', // Native token
    },
    ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        icon: '🔷',
        address: '0x0000000000000000000000000000000000000000', // Native token
    },
    MATIC: {
        symbol: 'MATIC',
        name: 'Polygon',
        decimals: 18,
        icon: '🟣',
        address: '0x0000000000000000000000000000000000000000', // Native token
    },
    BNB: {
        symbol: 'BNB',
        name: 'BNB Chain',
        decimals: 18,
        icon: '🟡',
        address: '0x0000000000000000000000000000000000000000', // Native token
    },
};

export const CROSS_CHAIN_TOKENS = {
    7001: [ // ZetaChain
        { symbol: 'ZETA', name: 'ZetaChain', address: '0x0', icon: '⚡' },
        { symbol: 'USDC.ETH', name: 'USDC from Ethereum', address: '0x1', icon: '💵' },
        { symbol: 'USDT.BSC', name: 'USDT from BSC', address: '0x2', icon: '💰' },
    ],
    1: [ // Ethereum
        { symbol: 'ETH', name: 'Ethereum', address: '0x0', icon: '🔷' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441029bD0d40E7D15A79F5b92cD8ba', icon: '💵' },
        { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', icon: '💰' },
    ],
    137: [ // Polygon
        { symbol: 'MATIC', name: 'Polygon', address: '0x0', icon: '🟣' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', icon: '💵' },
        { symbol: 'WETH', name: 'Wrapped ETH', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', icon: '🔷' },
    ],
    56: [ // BSC
        { symbol: 'BNB', name: 'Binance Coin', address: '0x0', icon: '🟡' },
        { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955', icon: '💰' },
        { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', icon: '💵' },
    ],
};

// ✅ VALIDATION HELPERS
export const VALIDATION = {
    MIN_COLLATERAL: 0.001,
    MAX_COLLATERAL: 1000,
    MIN_LTV: 10,
    MAX_LTV: 85,
    MAX_RISK_SCORE: 85, // ✅ UPDATED: Increased from 75 to 85
    MAX_LIQUIDATION_PROB: 50, // ✅ ADDED: Match contract limit

    validateAmount: (amount: string): { isValid: boolean; error?: string } => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            return { isValid: false, error: 'Amount must be a positive number' };
        }
        if (num < VALIDATION.MIN_COLLATERAL) {
            return { isValid: false, error: `Minimum amount is ${VALIDATION.MIN_COLLATERAL} ZETA` };
        }
        if (num > VALIDATION.MAX_COLLATERAL) {
            return { isValid: false, error: `Maximum amount is ${VALIDATION.MAX_COLLATERAL} ZETA` };
        }
        return { isValid: true };
    },

    validateLTV: (ltv: number): { isValid: boolean; error?: string } => {
        if (ltv < VALIDATION.MIN_LTV) {
            return { isValid: false, error: `LTV must be at least ${VALIDATION.MIN_LTV}%` };
        }
        if (ltv > VALIDATION.MAX_LTV) {
            return { isValid: false, error: `LTV cannot exceed ${VALIDATION.MAX_LTV}%` };
        }
        return { isValid: true };
    },

    // ✅ ADDED: Validate AI parameters
    validateAIRisk: (riskScore: number, liquidationProb: number): { isValid: boolean; error?: string } => {
        if (riskScore > VALIDATION.MAX_RISK_SCORE) {
            return { isValid: false, error: `Risk score cannot exceed ${VALIDATION.MAX_RISK_SCORE}` };
        }
        if (liquidationProb > VALIDATION.MAX_LIQUIDATION_PROB) {
            return { isValid: false, error: `Liquidation probability cannot exceed ${VALIDATION.MAX_LIQUIDATION_PROB}%` };
        }
        return { isValid: true };
    }
};

// Transaction types
export const TRANSACTION_TYPES = {
    LEND: 'lend',
    BORROW: 'borrow',
    REPAY: 'repay',
    LIQUIDATE: 'liquidate',
    WITHDRAW: 'withdraw',
    CROSS_CHAIN: 'cross_chain',
    AI_REBALANCE: 'ai_rebalance',
    YIELD_OPTIMIZATION: 'yield_optimization',
};

// Risk levels
export const RISK_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};

export const DEFAULTS = {
    MAX_LTV: 75,
    LIQUIDATION_THRESHOLD: 85,
    SLIPPAGE_TOLERANCE: 0.5,
    GAS_LIMIT: 500000,
    DEFAULT_COLLATERAL_CHAIN: 7001,
    DEFAULT_BORROW_CHAIN: 1,
    AI_UPDATE_INTERVAL: 1000,
    MIN_POSITION_SIZE: 0.01,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 seconds
    GAS_BUFFER: 100000, // Extra gas to add to estimates
    TRANSACTION_TIMEOUT: 300000, // 5 minutes
};

export const CROSS_CHAIN_CONFIG = {
    supported_chains: [7001, 1, 137, 56],
    ltv_configs: {
        'ZETA-USDC': { max: 75, safe: 60, liquidation: 80 },
        'ZETA-ETH': { max: 70, safe: 55, liquidation: 75 },
        'ETH-USDC': { max: 80, safe: 65, liquidation: 85 },
        'MATIC-USDC': { max: 70, safe: 55, liquidation: 75 },
        'BNB-USDT': { max: 70, safe: 55, liquidation: 75 },
    },
    yield_rates: {
        7001: 720, // 7.2% on ZetaChain
        1: 650,   // 6.5% on Ethereum
        137: 580, // 5.8% on Polygon
        56: 610,  // 6.1% on BSC
    },
    bridge_fees: {
        7001: 25,  // 0.25% ZetaChain
        1: 50,     // 0.5% Ethereum
        137: 30,   // 0.3% Polygon
        56: 35,    // 0.35% BSC
    },
};

export const FEATURE_FLAGS = {
    REAL_AI_ENABLED: !!process.env.REACT_APP_GEMINI_API_KEY,
    REAL_CONTRACTS_ENABLED: true, // Always enabled now
    MOCK_TRANSACTIONS: false, // Disabled - using real transactions
    CROSS_CHAIN_UI: true,
    AI_RISK_ASSESSMENT: true,
    LIQUIDATION_MONITORING: true,
    YIELD_OPTIMIZATION: true,
    BUILDATHON_MODE: process.env.REACT_APP_BUILDATHON_MODE === 'true',
    SHOW_PRIZE_INDICATORS: process.env.REACT_APP_SHOW_PRIZE_INDICATORS === 'true',
    DEBUG_TRANSACTIONS: process.env.NODE_ENV === 'development',
    ENABLE_TRANSACTION_RETRY: true,
    FALLBACK_MODE_ENABLED: true,
    RPC_FAILOVER_ENABLED: true,
};

// API Endpoints
export const API_ENDPOINTS = {
    AI_RISK_ASSESSMENT: '/api/ai/risk-assessment',
    AI_YIELD_OPTIMIZATION: '/api/ai/yield-optimization',
    AI_LIQUIDATION_PREDICTION: '/api/ai/liquidation-prediction',
    MARKET_DATA: '/api/market-data',
    PRICE_FEEDS: '/api/price-feeds',
    LIQUIDITY_DATA: '/api/liquidity',
    ZETA_BLOCK_EXPLORER: 'https://zetachain-athens-3.blockscout.com/api',
    ZETA_RPC: CHAIN_CONFIG.ZETA_TESTNET.rpc,
};

export const ERROR_MESSAGES = {
    WALLET_NOT_CONNECTED: 'Please connect your wallet first',
    NETWORK_NOT_SUPPORTED: 'Please switch to ZetaChain Testnet (Chain ID: 7001)',
    INSUFFICIENT_BALANCE: 'Insufficient ZETA balance. Get testnet ZETA from: https://cloud.google.com/application/web3/faucet/zetachain/testnet',
    HIGH_RISK_WARNING: 'AI detected high risk - please review carefully before proceeding',
    TRANSACTION_FAILED: 'Transaction failed. Please check your balance and network connection',
    AI_SERVICE_UNAVAILABLE: 'AI service temporarily unavailable - using fallback risk analysis',
    INVALID_LTV: 'LTV ratio exceeds maximum allowed (85%)',
    GEMINI_API_ERROR: 'Google Gemini AI temporarily unavailable - using fallback calculation',
    CROSS_CHAIN_ERROR: 'Cross-chain operation failed - please try again',
    CONTRACT_NOT_FOUND: 'Smart contract not found. Please verify the contract is deployed correctly',
    RPC_CONNECTION_ERROR: 'RPC connection failed. Trying alternative endpoints...',
    GAS_ESTIMATION_FAILED: 'Gas estimation failed. The transaction may not succeed',
    FUNCTION_NOT_FOUND: 'Contract function not found. The ABI may be incorrect',
};

export const SUCCESS_MESSAGES = {
    WALLET_CONNECTED: 'Wallet connected successfully!',
    POSITION_CREATED: 'Cross-chain lending position created successfully!',
    RISK_ASSESSMENT_COMPLETE: 'AI risk assessment completed',
    NETWORK_SWITCHED: 'Successfully switched to ZetaChain Testnet',
    TRANSACTION_CONFIRMED: 'Transaction confirmed on blockchain',
    AI_ANALYSIS_COMPLETE: 'Google Gemini AI analysis completed',
    CROSS_CHAIN_SUCCESS: 'Cross-chain operation completed successfully',
    RPC_CONNECTED: 'Connected to ZetaChain RPC successfully',
    CONTRACT_INTERACTION_SUCCESS: 'Smart contract interaction successful',
};

// Chain Display Configuration
export const CHAIN_DISPLAY = {
    7001: { name: 'ZetaChain', symbol: 'ZETA', color: 'bg-green-500', textColor: 'text-green-700' },
    1: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500', textColor: 'text-blue-700' },
    137: { name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500', textColor: 'text-purple-700' },
    56: { name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
};

export const FAUCET_URLS = [
    'https://cloud.google.com/application/web3/faucet/zetachain/testnet',
    'https://zetachain.faucetme.pro/',
    'https://faucet.zetachain.com',
    'https://www.zetachain.com/docs/reference/apps/get-testnet-zeta/'
];

// Export everything
const constants = {
    CONTRACT_ADDRESSES,
    ZETA_LEND_ABI,
    CHAIN_CONFIG,
    PROTOCOL_INFO,
    AI_CONFIG,
    API_BASE_URL,
    SUPPORTED_TOKENS,
    CROSS_CHAIN_TOKENS,
    TRANSACTION_TYPES,
    RISK_LEVELS,
    DEFAULTS,
    CROSS_CHAIN_CONFIG,
    FEATURE_FLAGS,
    API_ENDPOINTS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    CHAIN_DISPLAY,
    FAUCET_URLS,
    VALIDATION,
    CONTRACT_HELPERS,
    getWorkingRpcUrl,
};

export default constants;