// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract ZetaLendReceiver {
    address public admin;
    address public zetaLendMainContract;
    mapping(bytes32 => bool) public processedMessages;
    
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
    
    event TokensLiquidated(
        uint256 indexed positionId,
        address indexed liquidator,
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
        } else if (keccak256(bytes(borrowMsg.messageType)) == keccak256(bytes("LIQUIDATE"))) {
            _executeLiquidation(borrowMsg);
        }
    }
    
    function _executeBorrow(BorrowMessage memory message) internal {
        if (message.borrowToken == address(0)) {
            require(address(this).balance >= message.borrowAmount, "Insufficient native balance");
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
    
    function _executeLiquidation(BorrowMessage memory message) internal {
        emit TokensLiquidated(
            message.positionId,
            msg.sender,
            message.borrowAmount,
            message.borrowToken
        );
    }
    
    function depositNative() external payable onlyAdmin {}
    
    function depositToken(address token, uint256 amount) external onlyAdmin {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
    
    function withdrawNative(uint256 amount) external onlyAdmin {
        payable(admin).transfer(amount);
    }
    
    function withdrawToken(address token, uint256 amount) external onlyAdmin {
        IERC20(token).transfer(admin, amount);
    }
    
    function setZetaLendContract(address _contract) external onlyAdmin {
        zetaLendMainContract = _contract;
    }
    
    function getNativeBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    receive() external payable {}
}