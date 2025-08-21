// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ZetaLendReceiver_Polygon {
    address public admin;
    address public zetaLendMainContract;
    mapping(bytes32 => bool) public processedMessages;
    
    // ✅ FIXED: Correct checksummed addresses for Polygon
    address public constant USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant USDT = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    address public constant WETH = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    
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
            require(address(this).balance >= message.borrowAmount, "Insufficient MATIC balance");
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
    function getMATICPrice() external pure returns (uint256) {
        return 1 * 1e18; // Mock: $1 per MATIC
    }
    
    function getSupportedTokens() external pure returns (address[] memory) {
        address[] memory tokens = new address[](4);
        tokens[0] = address(0); // MATIC
        tokens[1] = USDC;
        tokens[2] = USDT;
        tokens[3] = WETH;
        return tokens;
    }
    
    function depositNative() external payable onlyAdmin {}
    
    function withdrawNative(uint256 amount) external onlyAdmin {
        payable(admin).transfer(amount);
    }
    
    receive() external payable {}
}