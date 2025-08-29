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
    
    //  RECEIVER CONTRACTS WITH EXPLICIT STORAGE VERIFICATION
    mapping(uint256 => address) public receiverContracts;
    
    //  STORAGE TEST VARIABLES
    uint256 public storageTestValue;
    mapping(uint256 => uint256) public storageTestMapping;
    
    uint256 public nextPositionId;
    uint256 public aiModelVersion;
    address public admin;
    bool public paused = false;
    
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
        string messageType,
        address targetReceiver
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

    event ReceiverContractSet(uint256 indexed chainId, address indexed receiver);
    event StorageTest(string message, uint256 value);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(address _gateway) {
        gateway = IGatewayZEVM(_gateway);
        admin = msg.sender;
        authorizedCallers[msg.sender] = true;
        aiModelVersion = 1;
        
        chainTokens[1] = 0x5F0b1a82749cb4E2278EC87F8BF6B618dC71a8bf;
        chainTokens[137] = 0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb;
        chainTokens[56] = 0x13A0c5930C028511Dc02665E7285134B6d11A5f4;
        
        //  INITIALIZE STORAGE TEST
        storageTestValue = 12345;
        storageTestMapping[1] = 999;
        storageTestMapping[137] = 888;
        storageTestMapping[56] = 777;
    }
    
    //  BULLETPROOF RECEIVER FUNCTIONS WITH FORCED VERIFICATION
    function setReceiverContract(uint256 chainId, address receiver) external onlyAdmin {
        require(receiver != address(0), "Invalid receiver address");
        require(chainId == 1 || chainId == 137 || chainId == 56, "Unsupported chain");
        
        // Test storage first
        uint256 testBefore = storageTestValue;
        storageTestValue = 999999;
        require(storageTestValue == 999999, "CRITICAL: Basic storage is broken");
        storageTestValue = testBefore; // Restore
        
        // Store the receiver
        receiverContracts[chainId] = receiver;
        
        // MANDATORY: Verify storage worked immediately
        address stored = receiverContracts[chainId];
        require(stored == receiver, "CRITICAL: Receiver storage verification failed");
        require(stored != address(0), "CRITICAL: Receiver storage returned zero");
        
        emit StorageTest("Receiver set successfully", chainId);
        emit ReceiverContractSet(chainId, receiver);
    }
    
    function setReceiverContracts(uint256[] calldata chainIds, address[] calldata receivers) external onlyAdmin {
        require(chainIds.length == receivers.length, "Array length mismatch");
        require(chainIds.length > 0, "Empty arrays not allowed");
        
        for (uint256 i = 0; i < chainIds.length; i++) {
            require(receivers[i] != address(0), "Invalid receiver address");
            require(chainIds[i] == 1 || chainIds[i] == 137 || chainIds[i] == 56, "Unsupported chain");
            
            // Store the receiver
            receiverContracts[chainIds[i]] = receivers[i];
            
            // MANDATORY: Verify each storage operation
            address stored = receiverContracts[chainIds[i]];
            require(stored == receivers[i], "CRITICAL: Batch receiver storage failed");
            require(stored != address(0), "CRITICAL: Batch receiver storage returned zero");
            
            emit ReceiverContractSet(chainIds[i], receivers[i]);
        }
        
        emit StorageTest("Batch receivers set successfully", chainIds.length);
    }
    
    //  EXPLICIT GETTER FUNCTIONS
    function getReceiverContract(uint256 chainId) external view returns (address) {
        return receiverContracts[chainId];
    }
    
    function getReceiverContracts() external view returns (uint256[] memory chains, address[] memory receivers) {
        chains = new uint256[](3);
        receivers = new address[](3);
        
        chains[0] = 1;
        chains[1] = 137;
        chains[2] = 56;
        
        receivers[0] = receiverContracts[1];
        receivers[1] = receiverContracts[137];
        receivers[2] = receiverContracts[56];
    }
    
    //  STORAGE TESTING FUNCTIONS
    function testBasicStorage() external view returns (uint256 testValue, uint256 ethTest, uint256 polygonTest, uint256 bscTest) {
        testValue = storageTestValue;
        ethTest = storageTestMapping[1];
        polygonTest = storageTestMapping[137];
        bscTest = storageTestMapping[56];
    }
    
    function testReceiverStorage() external view returns (bool eth, bool polygon, bool bsc, address ethAddr, address polygonAddr, address bscAddr) {
        ethAddr = receiverContracts[1];
        polygonAddr = receiverContracts[137];
        bscAddr = receiverContracts[56];
        
        eth = (ethAddr != address(0));
        polygon = (polygonAddr != address(0));
        bsc = (bscAddr != address(0));
    }
    
    function forceSetReceiver(uint256 chainId, address receiver) external onlyAdmin {
        // Force set with assembly to bypass any potential issues
        assembly {
            let slot := receiverContracts.slot
            mstore(0x00, chainId)
            mstore(0x20, slot)
            let valueSlot := keccak256(0x00, 0x40)
            sstore(valueSlot, receiver)
        }
        emit ReceiverContractSet(chainId, receiver);
    }
    
    //  MAIN LENDING FUNCTION (unchanged)
    function lendCrossChain(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain,
        address borrowToken,
        bytes calldata aiRiskDataEncoded
    ) external payable whenNotPaused {
        _validateLendingParams(collateralAmount, borrowAmount, borrowChain);
        
        uint256 positionId = _createPosition(
            collateralAmount,
            borrowAmount,
            borrowChain,
            borrowToken,
            aiRiskDataEncoded
        );
        
        _executeLending(positionId, borrowChain, borrowAmount, borrowToken);
    }
    
    function _validateLendingParams(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain
    ) internal view {
        require(collateralAmount > 0, "Invalid collateral");
        require(borrowAmount > 0, "Invalid borrow amount");
        require(msg.value >= collateralAmount, "Insufficient ZETA sent");
        
        require(
            borrowChain == block.chainid || 
            borrowChain == 1 || 
            borrowChain == 137 || 
            borrowChain == 56, 
            "Unsupported borrow chain"
        );
        
        if (borrowChain != block.chainid) {
            address receiver = receiverContracts[borrowChain];
            require(receiver != address(0), "No receiver contract for target chain");
        }
        
        uint256 currentLTV = (borrowAmount * 100) / collateralAmount;
        require(currentLTV <= 85, "LTV exceeds maximum (85%)");
    }
    
    function _createPosition(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain,
        address borrowToken,
        bytes calldata aiRiskDataEncoded
    ) internal returns (uint256 positionId) {
        uint256 riskScore = 45;
        uint256 recommendedLTV = 65;
        uint256 liquidationProb = 15;
        uint256 optimizedChain = borrowChain;
        
        if (aiRiskDataEncoded.length > 0) {
            try this.decodeAIRiskData(aiRiskDataEncoded) returns (
                uint256 _riskScore,
                uint256 _recommendedLTV, 
                uint256 _liquidationProb,
                uint256 _optimizedChain
            ) {
                riskScore = _riskScore;
                recommendedLTV = _recommendedLTV;
                liquidationProb = _liquidationProb;
                optimizedChain = _optimizedChain;
            } catch {
                // Use defaults
            }
        }
        
        require(riskScore <= 85, "AI: Risk too high");
        require(liquidationProb <= 50, "AI: Liquidation probability too high");
        
        positionId = nextPositionId++;
        
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
            yieldRate: _calculateYieldRate(borrowChain, borrowAmount)
        });
        
        aiRiskData[positionId] = AIRiskData({
            riskScore: riskScore,
            recommendedLTV: recommendedLTV,
            liquidationProbability: liquidationProb,
            timestamp: block.timestamp,
            healthFactor: (collateralAmount * 100) / borrowAmount,
            optimizedYieldChain: optimizedChain
        });
        
        userPositions[msg.sender].push(positionId);
        
        emit CrossChainLend(
            msg.sender,
            positionId,
            block.chainid,
            borrowChain,
            collateralAmount,
            borrowAmount
        );
    }
    
    function decodeAIRiskData(bytes calldata data) external pure returns (
        uint256 riskScore,
        uint256 recommendedLTV,
        uint256 liquidationProb,
        uint256 optimizedChain
    ) {
        return abi.decode(data, (uint256, uint256, uint256, uint256));
    }
    
    function _executeLending(
        uint256 positionId,
        uint256 borrowChain,
        uint256 borrowAmount,
        address borrowToken
    ) internal {
        if (borrowChain != block.chainid) {
            _sendCrossChainMessage(positionId, borrowChain, borrowAmount, borrowToken);
        } else {
            _executeSameChainBorrow(positionId, borrowAmount, borrowToken);
        }
    }
    
    function _sendCrossChainMessage(
        uint256 positionId,
        uint256 targetChain,
        uint256 amount,
        address borrowToken
    ) internal {
        bytes memory message = abi.encode(
            positionId,
            msg.sender,
            amount,
            borrowToken,
            block.timestamp,
            "BORROW"
        );
        
        address targetReceiver = receiverContracts[targetChain];
        require(targetReceiver != address(0), "Receiver contract not set for target chain");
        
        try gateway.call(
            abi.encodePacked(targetReceiver),
            targetChain,
            message,
            1000000,
            RevertOptions(address(this), false, address(0), "", 0)
        ) {
            emit CrossChainMessageSent(positionId, targetChain, "BORROW", targetReceiver);
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("Gateway call failed: ", reason)));
        } catch (bytes memory lowLevelData) {
            if (lowLevelData.length == 0) {
                revert("Gateway call failed: Unknown error");
            } else {
                revert("Gateway call failed: Low-level error");
            }
        }
    }
    
    function _executeSameChainBorrow(
        uint256 positionId,
        uint256 borrowAmount,
        address borrowToken
    ) internal {
        if (borrowToken == address(0)) {
            require(address(this).balance >= borrowAmount, "Insufficient contract ZETA balance");
            
            (bool success, ) = payable(msg.sender).call{value: borrowAmount}("");
            require(success, "ZETA transfer failed");
        } else {
            revert("ERC20 borrowing not yet implemented on same chain");
        }
        
        emit CrossChainMessageSent(positionId, block.chainid, "SAME_CHAIN_BORROW", address(this));
    }
    
    function _calculateYieldRate(uint256 chainId, uint256) internal pure returns (uint256) {
        uint256 baseRate = 500;
        
        if (chainId == 1) {
            return baseRate + 200;
        } else if (chainId == 137) {
            return baseRate + 150;
        } else if (chainId == 56) {
            return baseRate + 100;
        } else {
            return baseRate;
        }
    }
    
    // ALL OTHER FUNCTIONS (same as before)...
    function getLendingPosition(uint256 positionId) external view returns (LendingPosition memory) {
        return lendingPositions[positionId];
    }
    
    function getAIRiskAssessment(uint256 positionId) external view returns (AIRiskData memory) {
        return aiRiskData[positionId];
    }
    
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositions[user];
    }
    
    function isPositionHealthy(uint256 positionId) external view returns (bool) {
        if (!lendingPositions[positionId].isActive || lendingPositions[positionId].collateralAmount == 0) {
            return false;
        }
        
        uint256 currentLTV = (lendingPositions[positionId].borrowedAmount * 100) / lendingPositions[positionId].collateralAmount;
        uint256 liquidationProb = aiRiskData[positionId].liquidationProbability;
        uint256 healthFactor = aiRiskData[positionId].healthFactor;
        
        return currentLTV <= lendingPositions[positionId].liquidationThreshold && 
               liquidationProb <= 80 && 
               healthFactor >= 110;
    }
    
    function updateAIRiskAssessment(uint256 positionId, uint256 newRiskScore, uint256 newLiquidationProb) external {
        require(lendingPositions[positionId].isActive, "Position not active");
        require(newRiskScore <= 100, "Risk score must be <= 100");
        require(newLiquidationProb <= 100, "Liquidation probability must be <= 100");
        
        require(
            msg.sender == lendingPositions[positionId].user || 
            msg.sender == admin ||
            authorizedCallers[msg.sender], 
            "Unauthorized"
        );
        
        aiRiskData[positionId].riskScore = newRiskScore;
        aiRiskData[positionId].liquidationProbability = newLiquidationProb;
        aiRiskData[positionId].timestamp = block.timestamp;
        
        if (lendingPositions[positionId].borrowedAmount > 0) {
            aiRiskData[positionId].healthFactor = (lendingPositions[positionId].collateralAmount * 100) / lendingPositions[positionId].borrowedAmount;
        }
        
        emit AIRiskUpdate(positionId, newRiskScore, newLiquidationProb);
    }
    
    function liquidatePositionAdvanced(uint256 positionId) external {
        require(lendingPositions[positionId].isActive, "Position not active");
        
        uint256 currentLTV = (lendingPositions[positionId].borrowedAmount * 100) / lendingPositions[positionId].collateralAmount;
        uint256 liquidationProb = aiRiskData[positionId].liquidationProbability;
        uint256 healthFactor = aiRiskData[positionId].healthFactor;
        
        require(
            currentLTV > lendingPositions[positionId].liquidationThreshold || 
            liquidationProb > 80 ||
            healthFactor < 110,
            "Position is healthy - cannot liquidate"
        );
        
        lendingPositions[positionId].isActive = false;
        
        uint256[] memory affectedChains = new uint256[](1);
        affectedChains[0] = lendingPositions[positionId].borrowChain;
        
        emit CrossChainLiquidation(positionId, msg.sender, lendingPositions[positionId].borrowedAmount, affectedChains);
    }
    
    function pause() external onlyAdmin {
        paused = true;
    }
    
    function unpause() external onlyAdmin {
        paused = false;
    }
    
    function addAuthorizedCaller(address caller) external onlyAdmin {
        require(caller != address(0), "Invalid caller address");
        authorizedCallers[caller] = true;
    }
    
    function removeAuthorizedCaller(address caller) external onlyAdmin {
        authorizedCallers[caller] = false;
    }
    
    function emergencyWithdraw() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(admin).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    receive() external payable {}
    fallback() external payable {}
}

