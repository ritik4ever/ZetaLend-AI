// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ZetaLendReceiver_ETH {
    address public admin;
    address public zetaLendMainContract;
    mapping(bytes32 => bool) public processedMessages;
    
    //  Correct checksummed addresses
    address public constant USDC = 0xa0b86A33E6441029BD0d40e7d15A79f5B92cD8bA;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
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
            require(address(this).balance >= message.borrowAmount, "Insufficient ETH balance");
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
    
    //  Changed from view to pure
    function getETHPrice() external pure returns (uint256) {
        return 2000 * 1e18; // Mock: $2000 per ETH
    }
    
    function getSupportedTokens() external pure returns (address[] memory) {
        address[] memory tokens = new address[](4);
        tokens[0] = address(0); // ETH
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
