// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IGatewayZEVM {
    function call(
        bytes memory recipient,
        uint256 chainId,
        bytes memory message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external;
}

struct RevertOptions {
    address revertAddress;
    bool callOnRevert;
    address abortAddress;
    bytes revertMessage;
    uint256 onRevertGasLimit;
}

contract ZetaLendAI {
    IGatewayZEVM public immutable gateway;
    
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

    struct AIRiskData {
        uint256 riskScore;
        uint256 recommendedLTV;
        uint256 liquidationProbability;
        uint256 timestamp;
        uint256 healthFactor;
        uint256 optimizedYieldChain;
    }

    mapping(uint256 => LendingPosition) public lendingPositions;
    mapping(uint256 => AIRiskData) public aiRiskData;
    mapping(address => uint256[]) public userPositions;
    mapping(uint256 => address) public chainTokens;
    mapping(address => bool) public authorizedCallers;
    mapping(address => mapping(uint256 => uint256)) public chainLiquidity;
    mapping(address => uint256) public totalLiquidity;
    mapping(uint256 => uint256) public chainUtilization;
    
    uint256 public nextPositionId;
    uint256 public aiModelVersion;
    address public admin;
    
    event CrossChainLend(
        address indexed user,
        uint256 indexed positionId,
        uint256 collateralChain,
        uint256 borrowChain,
        uint256 collateralAmount,
        uint256 borrowAmount
    );
    
    event CrossChainMessageSent(
        uint256 indexed positionId,
        uint256 targetChain,
        string messageType
    );
    
    event AIRiskUpdate(
        uint256 indexed positionId,
        uint256 riskScore,
        uint256 liquidationProbability
    );

    event CrossChainLiquidation(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidatedAmount,
        uint256[] affectedChains
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _gateway) {
        gateway = IGatewayZEVM(_gateway);
        admin = msg.sender;
        authorizedCallers[msg.sender] = true;
        aiModelVersion = 1;
        
        // Initialize supported chains
        chainTokens[1] = 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf;
        chainTokens[137] = 0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb;
        chainTokens[56] = 0x13A0c5930C028511Dc02665E7285134B6d11A5f4;
    }
    
    // ✅ ULTRA-SIMPLIFIED: Main lending function with minimal variables
    function lendCrossChain(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain,
        address borrowToken,
        bytes calldata aiRiskDataEncoded
    ) external payable {
        require(collateralAmount > 0, "Invalid collateral");
        require(borrowAmount > 0, "Invalid borrow amount");
        require(msg.value >= collateralAmount, "Insufficient ZETA sent");
        
        // ✅ SIMPLIFIED: Decode AI data in-place
        (uint256 riskScore,,,) = abi.decode(aiRiskDataEncoded, (uint256, uint256, uint256, uint256));
        require(riskScore <= 85, "AI: Risk too high");
        
        // ✅ SIMPLIFIED: Create position directly
        uint256 positionId = nextPositionId++;
        
        lendingPositions[positionId].user = msg.sender;
        lendingPositions[positionId].collateralAmount = collateralAmount;
        lendingPositions[positionId].borrowedAmount = borrowAmount;
        lendingPositions[positionId].collateralChain = block.chainid;
        lendingPositions[positionId].borrowChain = borrowChain;
        lendingPositions[positionId].collateralToken = address(0);
        lendingPositions[positionId].borrowToken = borrowToken;
        lendingPositions[positionId].liquidationThreshold = 80;
        lendingPositions[positionId].timestamp = block.timestamp;
        lendingPositions[positionId].isActive = true;
        lendingPositions[positionId].aiRiskScore = riskScore;
        lendingPositions[positionId].yieldRate = 500;
        
        // ✅ SIMPLIFIED: Store minimal AI data
        aiRiskData[positionId].riskScore = riskScore;
        aiRiskData[positionId].timestamp = block.timestamp;
        aiRiskData[positionId].healthFactor = (collateralAmount * 100) / borrowAmount;
        
        userPositions[msg.sender].push(positionId);
        
        emit CrossChainLend(
            msg.sender,
            positionId,
            block.chainid,
            borrowChain,
            collateralAmount,
            borrowAmount
        );
        
        // ✅ SIMPLIFIED: Cross-chain execution
        if (borrowChain != block.chainid) {
            _sendCrossChainMessage(positionId, borrowChain, borrowAmount);
        }
    }
    
    // ✅ SIMPLIFIED: Minimal cross-chain function
    function _sendCrossChainMessage(
        uint256 positionId,
        uint256 targetChain,
        uint256 amount
    ) internal {
        bytes memory message = abi.encode(positionId, msg.sender, amount);
        
        gateway.call(
            abi.encodePacked(msg.sender),
            targetChain,
            message,
            1000000,
            RevertOptions(address(this), false, address(0), "", 0)
        );
        
        emit CrossChainMessageSent(positionId, targetChain, "BORROW");
    }
    
    function updateAIRiskAssessment(
        uint256 positionId,
        uint256 newRiskScore,
        uint256 newLiquidationProb
    ) external {
        require(lendingPositions[positionId].isActive, "Position not active");
        
        aiRiskData[positionId].riskScore = newRiskScore;
        aiRiskData[positionId].liquidationProbability = newLiquidationProb;
        aiRiskData[positionId].timestamp = block.timestamp;
        
        emit AIRiskUpdate(positionId, newRiskScore, newLiquidationProb);
    }
    
    function liquidatePositionAdvanced(uint256 positionId) public {
        require(lendingPositions[positionId].isActive, "Position not active");
        
        // Simple liquidation check
        uint256 currentLTV = (lendingPositions[positionId].borrowedAmount * 100) / lendingPositions[positionId].collateralAmount;
        require(currentLTV > 80, "Position healthy");
        
        lendingPositions[positionId].isActive = false;
        
        uint256[] memory affectedChains = new uint256[](1);
        affectedChains[0] = lendingPositions[positionId].borrowChain;
        
        emit CrossChainLiquidation(positionId, msg.sender, lendingPositions[positionId].borrowedAmount, affectedChains);
    }
    
    // Admin functions
    function addSupportedChain(uint256 chainId, address tokenAddress) external onlyAdmin {
        chainTokens[chainId] = tokenAddress;
    }
    
    function addAuthorizedCaller(address caller) external onlyAdmin {
        authorizedCallers[caller] = true;
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
    
    function getSupportedChains() external view returns (uint256[] memory chains, address[] memory tokens) {
        chains = new uint256[](3);
        tokens = new address[](3);
        
        chains[0] = 1;
        chains[1] = 137;
        chains[2] = 56;
        
        tokens[0] = chainTokens[1];
        tokens[1] = chainTokens[137];
        tokens[2] = chainTokens[56];
    }
    
    function getChainLiquidity(uint256 chainId) external pure returns (uint256) {
        chainId; // Silence unused parameter warning
        return 1000 * 1e18; // Mock liquidity
    }
    
    receive() external payable {}
    
    function emergencyWithdraw() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }
}