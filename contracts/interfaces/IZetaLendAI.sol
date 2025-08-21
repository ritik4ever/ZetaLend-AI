// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IZetaLendAI {
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
    }

    struct AIRiskData {
        uint256 riskScore;
        uint256 recommendedLTV;
        uint256 liquidationProbability;
        uint256 timestamp;
    }

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

    event CrossChainLiquidation(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidatedAmount
    );

    function lendCrossChain(
        uint256 collateralAmount,
        uint256 borrowAmount,
        uint256 borrowChain,
        address borrowToken,
        bytes calldata aiRiskData
    ) external;

    function getLendingPosition(uint256 positionId) external view returns (LendingPosition memory);
    function getAIRiskAssessment(uint256 positionId) external view returns (AIRiskData memory);
}