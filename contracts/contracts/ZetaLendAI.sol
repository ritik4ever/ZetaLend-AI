// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

// Simplified interfaces for demo purposes
interface IGatewayZEVM {
    function call(
        bytes memory recipient,
        uint256 chainId,
        bytes memory message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external;
}

interface IZRC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

struct RevertOptions {
    address revertAddress;
    bool callOnRevert;
    address abortAddress;
    bytes revertMessage;
    uint256 onRevertGasLimit;
}

struct MessageContext {
    bytes origin;
    address sender;
    uint256 chainID;
}

contract ZetaLendAI {
    IGatewayZEVM public immutable gateway;
    
    //  CROSS-CHAIN LENDING: Core data structures
    struct LendingPosition {
        address user;
        uint256 collateralAmount;
        uint256 borrowedAmount;
        uint256 collateralChain;
        uint256 borrowChain;
        address collateralToken;
        address borrowToken;
        uint256 liquidationThreshold;
        uint256 timestamp;
        bool isActive;
        uint256 aiRiskScore;
        uint256 yieldRate;
    }

    //  AI FEATURES: AI risk assessment data
    struct AIRiskData {
        uint256 riskScore;
        uint256 recommendedLTV;
        uint256 liquidationProbability;
        uint256 timestamp;
        uint256 healthFactor;
        uint256 optimizedYieldChain;
    }

    //  GATEWAY API: Yield distribution tracking
    struct YieldDistribution {
        uint256 totalYield;
        uint256 lastDistributionTime;
        uint256 distributionFrequency;
    }

    // Storage mappings
    mapping(uint256 => LendingPosition) public lendingPositions;
    mapping(uint256 => AIRiskData) public aiRiskData;
    mapping(address => uint256[]) public userPositions;
    mapping(address => YieldDistribution) public yieldDistributions;
    
    //  CROSS-CHAIN LENDING: Multi-chain liquidity tracking
    mapping(address => mapping(uint256 => uint256)) public chainLiquidity;
    mapping(address => uint256) public totalLiquidity;
    mapping(uint256 => uint256) public chainUtilization;
    
    //  AI FEATURES: AI optimization data
    mapping(address => uint256) public aiOptimizedRates;
    mapping(uint256 => uint256) public aiLiquidationPredictions;
    
    uint256 public nextPositionId;
    uint256 public aiModelVersion;
    
    // Events for all prize categories
    event CrossChainLend(
        address indexed user,
        uint256 indexed positionId,
        uint256 collateralChain,
        uint256 borrowChain,
        uint256 collateralAmount,
        uint256 borrowAmount
    );
    
    event AIRiskUpdate(
        uint256 indexed positionId,
        uint256 riskScore,
        uint256 liquidationProbability
    );
    
    event YieldDistributed(
        address indexed user,
        uint256 totalYield,
        uint256[] chainYields
    );
    
    event CrossChainLiquidation(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidatedAmount,
        uint256[] affectedChains
    );
    
    event AIRebalanceRecommendation(
        address indexed user,
        uint256[] fromChains,
        uint256[] toChains,
        uint256[] amounts
    );

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Only gateway");
        _;
    }
    
    constructor(address _gateway) {
        gateway = IGatewayZEVM(_gateway);
        aiModelVersion = 1;
    }
    
    // GATEWAY API: Advanced cross-chain liquidation (MOVED UP)
    function liquidatePositionAdvanced(uint256 positionId) public {
        LendingPosition storage position = lendingPositions[positionId];
        require(position.isActive, "Position not active");
        
        AIRiskData memory riskData = aiRiskData[positionId];
        require(
            riskData.liquidationProbability > 80 || 
            _calculateCurrentLTV(positionId) > position.liquidationThreshold,
            "Position healthy"
        );
        
        //  GATEWAY API: Multi-chain liquidation coordination
        uint256[] memory affectedChains = new uint256[](2);
        affectedChains[0] = position.collateralChain;
        affectedChains[1] = position.borrowChain;
        
        bytes memory liquidationData = abi.encode(
            "LIQUIDATE_MULTI_CHAIN",
            abi.encode(positionId, msg.sender, position.borrowedAmount, affectedChains)
        );
        
        // Execute liquidation via Gateway API
        gateway.call(
            abi.encodePacked(msg.sender),
            position.collateralChain,
            liquidationData,
            500000,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode("LIQUIDATION_REVERT", positionId),
                onRevertGasLimit: 250000
            })
        );
        
        position.isActive = false;
        
        emit CrossChainLiquidation(positionId, msg.sender, position.borrowedAmount, affectedChains);
    }
    
    //  CROSS-CHAIN LENDING: Create cross-chain lending position
    function lendCrossChain(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain,
        address borrowToken,
        bytes calldata aiRiskDataEncoded
    ) external {
        require(collateralAmount > 0, "Invalid collateral");
        require(borrowAmount > 0, "Invalid borrow amount");
        
        //  AI FEATURE: Decode and validate AI risk assessment
        (uint256 riskScore, uint256 recommendedLTV, uint256 liquidationProb, uint256 optimizedChain) = 
            abi.decode(aiRiskDataEncoded, (uint256, uint256, uint256, uint256));
        
        // AI-based validation
        require(riskScore <= 70, "AI: Risk too high");
        require(liquidationProb <= 20, "AI: Liquidation probability too high");
        
        uint256 positionId = nextPositionId++;
        
        //  CROSS-CHAIN LENDING: Create position
        lendingPositions[positionId] = LendingPosition({
            user: msg.sender,
            collateralAmount: collateralAmount,
            borrowedAmount: borrowAmount,
            collateralChain: block.chainid,
            borrowChain: borrowChain,
            collateralToken: address(0),
            borrowToken: borrowToken,
            liquidationThreshold: 80,
            timestamp: block.timestamp,
            isActive: true,
            aiRiskScore: riskScore,
            yieldRate: _calculateAIOptimizedYield(borrowToken, borrowChain)
        });
        
        // 🤖 AI FEATURE: Store AI risk data
        aiRiskData[positionId] = AIRiskData({
            riskScore: riskScore,
            recommendedLTV: recommendedLTV,
            liquidationProbability: liquidationProb,
            timestamp: block.timestamp,
            healthFactor: _calculateHealthFactor(collateralAmount, borrowAmount),
            optimizedYieldChain: optimizedChain
        });
        
        userPositions[msg.sender].push(positionId);
        
        //  CROSS-CHAIN LENDING: Update liquidity pools
        _updateLiquidityPools(borrowToken, borrowChain, borrowAmount, true);
        
        emit CrossChainLend(
            msg.sender,
            positionId,
            block.chainid,
            borrowChain,
            collateralAmount,
            borrowAmount
        );
        
        // 🔗 UNIVERSAL CONTRACT: Execute cross-chain borrow
        _executeCrossChainBorrow(positionId, borrowChain, borrowToken, borrowAmount);
    }
    
    //  AI FEATURE: Update AI risk assessment
    function updateAIRiskAssessment(
        uint256 positionId,
        uint256 newRiskScore,
        uint256 newLiquidationProb
    ) external {
        require(lendingPositions[positionId].isActive, "Position not active");
        
        aiRiskData[positionId] = AIRiskData({
            riskScore: newRiskScore,
            recommendedLTV: _calculateRecommendedLTV(newRiskScore),
            liquidationProbability: newLiquidationProb,
            timestamp: block.timestamp,
            healthFactor: aiRiskData[positionId].healthFactor,
            optimizedYieldChain: aiRiskData[positionId].optimizedYieldChain
        });
        
        emit AIRiskUpdate(positionId, newRiskScore, newLiquidationProb);
        
        //  AI FEATURE: Auto-liquidate if AI predicts high risk
        if (newLiquidationProb > 90) {
            liquidatePositionAdvanced(positionId);
        }
    }
    
    //  GATEWAY API: Multi-chain yield distribution
    function distributeYieldMultiChain(
        address user,
        uint256[] calldata targetChains
    ) external {
        YieldDistribution storage userYield = yieldDistributions[user];
        require(block.timestamp >= userYield.lastDistributionTime + userYield.distributionFrequency, "Too early");
        
        uint256[] memory chainYields = new uint256[](targetChains.length);
        
        for (uint256 i = 0; i < targetChains.length; i++) {
            uint256 chainId = targetChains[i];
            uint256 chainYield = userYield.totalYield / targetChains.length;
            chainYields[i] = chainYield;
            
            if (chainYield > 0) {
                // ⚡ GATEWAY API: Send yield to each chain
                bytes memory yieldData = abi.encode("RECEIVE_YIELD", abi.encode(user, chainYield));
                
                gateway.call(
                    abi.encodePacked(user),
                    chainId,
                    yieldData,
                    300000,
                    RevertOptions({
                        revertAddress: address(this),
                        callOnRevert: false,
                        abortAddress: address(0),
                        revertMessage: "",
                        onRevertGasLimit: 0
                    })
                );
            }
        }
        
        userYield.lastDistributionTime = block.timestamp;
        userYield.totalYield = 0;
        
        emit YieldDistributed(user, userYield.totalYield, chainYields);
    }
    
    //  AI FEATURE: Execute AI-driven rebalancing
    function executeAIRebalance(
        address user,
        uint256[] calldata fromChains,
        uint256[] calldata toChains,
        uint256[] calldata amounts,
        bytes calldata aiRecommendation
    ) external {
        require(msg.sender == user, "Only user");
        
        //  AI FEATURE: Validate AI recommendation
        (uint256 expectedImprovement, uint256 riskReduction, uint256 yieldIncrease) = 
            abi.decode(aiRecommendation, (uint256, uint256, uint256));
        
        require(expectedImprovement > 5, "AI: Improvement too low");
        require(riskReduction > 0, "AI: Must reduce risk");
        
        // Execute rebalancing across multiple chains
        for (uint256 i = 0; i < fromChains.length; i++) {
            if (amounts[i] > 0) {
                bytes memory rebalanceData = abi.encode(
                    "REBALANCE_ASSETS",
                    abi.encode(user, toChains[i], amounts[i], aiRecommendation)
                );
                
                gateway.call(
                    abi.encodePacked(user),
                    fromChains[i],
                    rebalanceData,
                    400000,
                    RevertOptions({
                        revertAddress: address(this),
                        callOnRevert: true,
                        abortAddress: address(0),
                        revertMessage: abi.encode("REBALANCE_FAILED", i),
                        onRevertGasLimit: 200000
                    })
                );
            }
        }
        
        emit AIRebalanceRecommendation(user, fromChains, toChains, amounts);
    }
    
    // Helper functions (MOVED TO END)
    function _executeCrossChainBorrow(
        uint256 positionId,
        uint256 targetChain,
        address borrowToken,
        uint256 borrowAmount
    ) internal {
        bytes memory callData = abi.encode(
            "EXECUTE_BORROW_OPTIMIZED",
            abi.encode(positionId, msg.sender, borrowAmount, block.timestamp)
        );
        
        gateway.call(
            abi.encodePacked(msg.sender),
            targetChain,
            callData,
            500000,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode(positionId, "BORROW_FAILED"),
                onRevertGasLimit: 250000
            })
        );
    }
    
    function _calculateAIOptimizedYield(address token, uint256 chainId) internal view returns (uint256) {
        uint256 baseRate = 500; // 5%
        uint256 utilizationBonus = chainUtilization[chainId] * 2;
        uint256 liquidityBonus = totalLiquidity[token] > 1000000 ? 100 : 0;
        uint256 aiOptimization = aiOptimizedRates[token];
        
        return baseRate + utilizationBonus + liquidityBonus + aiOptimization;
    }
    
    function _updateLiquidityPools(address token, uint256 chainId, uint256 amount, bool isDeposit) internal {
        if (isDeposit) {
            chainLiquidity[token][chainId] += amount;
            totalLiquidity[token] += amount;
            chainUtilization[chainId] = (chainUtilization[chainId] * 95) / 100;
        } else {
            chainLiquidity[token][chainId] = chainLiquidity[token][chainId] > amount ? 
                chainLiquidity[token][chainId] - amount : 0;
            totalLiquidity[token] = totalLiquidity[token] > amount ? 
                totalLiquidity[token] - amount : 0;
            chainUtilization[chainId] += 5;
        }
    }
    
    function _calculateHealthFactor(uint256 collateral, uint256 borrowed) internal pure returns (uint256) {
        if (borrowed == 0) return type(uint256).max;
        return (collateral * 100) / borrowed;
    }
    
    function _calculateCurrentLTV(uint256 positionId) internal view returns (uint256) {
        LendingPosition memory position = lendingPositions[positionId];
        return (position.borrowedAmount * 100) / position.collateralAmount;
    }
    
    function _calculateRecommendedLTV(uint256 riskScore) internal pure returns (uint256) {
        if (riskScore <= 30) return 75;
        if (riskScore <= 50) return 60;
        if (riskScore <= 70) return 45;
        return 30;
    }
    
    // View functions
    function getLendingPosition(uint256 positionId) 
        external 
        view 
        returns (LendingPosition memory) 
    {
        return lendingPositions[positionId];
    }
    
    function getAIRiskAssessment(uint256 positionId) 
        external 
        view 
        returns (AIRiskData memory) 
    {
        return aiRiskData[positionId];
    }
    
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }
    
    function getTotalLiquidity(address token) external view returns (uint256) {
        return totalLiquidity[token];
    }
    
    function getChainLiquidity(address token, uint256 chainId) external view returns (uint256) {
        return chainLiquidity[token][chainId];
    }
}
