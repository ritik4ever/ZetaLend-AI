// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ZetaLendReceiver_BSC {
    address public admin;
    address public zetaLendMainContract;
    mapping(bytes32 => bool) public processedMessages;
    
    // ✅ FIXED: Correct checksummed addresses for BSC
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address public constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    
    struct BorrowMessage {
        uint256 positionId;
        address borrower;
        uint256 borrowAmount;
        address borrowToken;
        uint256 timestamp;
        string messageType;
    }
    
    event TokensBorrowed(
        uint256 indexed positionId,
        address indexed borrower,
        uint256 amount,
        address token
    );
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    constructor(address _zetaLendMainContract) {
        admin = msg.sender;
        zetaLendMainContract = _zetaLendMainContract;
    }
    
    function handleZetaMessage(bytes calldata message) external onlyAdmin {
        BorrowMessage memory borrowMsg = abi.decode(message, (BorrowMessage));
        bytes32 messageHash = keccak256(message);
        
        require(!processedMessages[messageHash], "Message already processed");
        processedMessages[messageHash] = true;
        
        if (keccak256(bytes(borrowMsg.messageType)) == keccak256(bytes("BORROW"))) {
            _executeBorrow(borrowMsg);
        }
    }
    
    function _executeBorrow(BorrowMessage memory message) internal {
        if (message.borrowToken == address(0)) {
            require(address(this).balance >= message.borrowAmount, "Insufficient BNB balance");
            payable(message.borrower).transfer(message.borrowAmount);
        } else {
            IERC20 token = IERC20(message.borrowToken);
            require(
                token.balanceOf(address(this)) >= message.borrowAmount,
                "Insufficient token balance"
            );
            require(
                token.transfer(message.borrower, message.borrowAmount),
                "Token transfer failed"
            );
        }
        
        emit TokensBorrowed(
            message.positionId,
            message.borrower,
            message.borrowAmount,
            message.borrowToken
        );
    }
    
    // ✅ FIXED: Changed from view to pure
    function getBNBPrice() external pure returns (uint256) {
        return 300 * 1e18; // Mock: $300 per BNB
    }
    
    function getSupportedTokens() external pure returns (address[] memory) {
        address[] memory tokens = new address[](4);
        tokens[0] = address(0); // BNB
        tokens[1] = USDT;
        tokens[2] = BUSD;
        tokens[3] = WBNB;
        return tokens;
    }
    
    function depositNative() external payable onlyAdmin {}
    
    function withdrawNative(uint256 amount) external onlyAdmin {
        payable(admin).transfer(amount);
    }
    
    receive() external payable {}
}