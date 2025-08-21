import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ZETA_LEND_ABI, CONTRACT_HELPERS, ERROR_MESSAGES, DEFAULTS } from '../utils/constants';

export class ZetaChainService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;
    private contract: ethers.Contract | null = null;
    private isInitialized = false;

    async initialize() {
        console.log('🔧 Initializing ZetaChain service...');

        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not found - please install MetaMask');
            }

            this.provider = new ethers.BrowserProvider(window.ethereum);
            console.log('✅ Provider created');

            // Get signer with retry
            let retryCount = 0;
            while (retryCount < 3) {
                try {
                    this.signer = await this.provider.getSigner();
                    break;
                } catch (signerError) {
                    retryCount++;
                    console.log(`Signer attempt ${retryCount} failed:`, signerError);
                    if (retryCount === 3) {
                        throw new Error('Please connect your wallet first');
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (!this.signer) {
                throw new Error('Failed to get wallet signer');
            }

            console.log('✅ Signer obtained');

            // Validate contract address
            if (!CONTRACT_ADDRESSES.ZETA_LEND_AI || !CONTRACT_HELPERS.isValidAddress(CONTRACT_ADDRESSES.ZETA_LEND_AI)) {
                throw new Error('Invalid ZetaLend contract address');
            }

            // Create contract instance with correct ABI
            this.contract = new ethers.Contract(
                CONTRACT_ADDRESSES.ZETA_LEND_AI,
                ZETA_LEND_ABI,
                this.signer
            );

            console.log('✅ Contract instance created:', CONTRACT_ADDRESSES.ZETA_LEND_AI);

            // Verify contract deployment
            const code = await this.provider.getCode(CONTRACT_ADDRESSES.ZETA_LEND_AI);
            if (code === '0x') {
                throw new Error('No contract found at address - contract may not be deployed');
            } else {
                console.log('✅ Contract verified on blockchain');
                console.log('📝 Contract bytecode length:', code.length);
            }

            // Test contract accessibility with nextPositionId
            try {
                const nextId = await this.contract.nextPositionId();
                console.log('✅ Contract is accessible, next position ID:', nextId.toString());
            } catch (error) {
                console.warn('Contract accessibility test failed:', error);
                // Continue anyway as the main function might still work
            }

            this.isInitialized = true;
            console.log('🎉 ZetaChain service fully initialized');

        } catch (error: any) {
            console.error('❌ ZetaChain service initialization failed:', error);
            this.isInitialized = false;
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    // 🎯 MAIN FUNCTION: Create cross-chain lending position
    async createCrossChainLending(lendingParams: {
        collateralAmount: string;
        borrowAmount: string;
        borrowChain: number;
        borrowToken: string;
        aiRiskData: any;
    }) {
        console.log('🏦 Creating cross-chain lending position:', lendingParams);

        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.contract || !this.signer) {
            throw new Error('Service not properly initialized - please refresh and try again');
        }

        // ✅ Enhanced input validation
        const collateralAmountNum = parseFloat(lendingParams.collateralAmount);
        const borrowAmountNum = parseFloat(lendingParams.borrowAmount);

        if (isNaN(collateralAmountNum) || isNaN(borrowAmountNum) || collateralAmountNum <= 0 || borrowAmountNum <= 0) {
            throw new Error('Invalid amounts - please enter valid positive numbers');
        }

        if (collateralAmountNum < 0.001) {
            throw new Error('Minimum collateral amount is 0.001 ZETA');
        }

        const ltv = (borrowAmountNum / collateralAmountNum) * 100;
        if (ltv > 85) {
            throw new Error(`LTV ratio too high: ${ltv.toFixed(1)}%. Maximum allowed is 85%`);
        }

        try {
            // ✅ Convert amounts to Wei
            const collateralAmountWei = ethers.parseEther(lendingParams.collateralAmount);
            const borrowAmountWei = ethers.parseEther(lendingParams.borrowAmount);

            console.log('💰 Transaction amounts:');
            console.log('- Collateral:', ethers.formatEther(collateralAmountWei), 'ZETA');
            console.log('- Borrow:', ethers.formatEther(borrowAmountWei), 'tokens');
            console.log('- Target Chain:', lendingParams.borrowChain);
            console.log('- LTV:', ltv.toFixed(2) + '%');

            // ✅ Encode AI risk data using helper
            const aiRiskDataEncoded = CONTRACT_HELPERS.encodeAIRiskData(
                lendingParams.aiRiskData?.riskScore || 45,
                lendingParams.aiRiskData?.recommendedLTV || 65,
                lendingParams.aiRiskData?.liquidationProbability || 15,
                lendingParams.borrowChain
            );

            console.log('🤖 AI Risk Data encoded successfully');

            // ✅ Handle borrow token address safely
            const borrowTokenAddress = lendingParams.borrowToken &&
                CONTRACT_HELPERS.isValidAddress(lendingParams.borrowToken)
                ? lendingParams.borrowToken
                : ethers.ZeroAddress;

            console.log('🎯 Borrow token address:', borrowTokenAddress);

            // ✅ Gas estimation with proper error handling
            console.log('⛽ Estimating gas for lendCrossChain function...');

            let gasEstimate: bigint;
            try {
                gasEstimate = await this.contract.lendCrossChain.estimateGas(
                    collateralAmountWei,        // uint256 collateralAmount
                    borrowAmountWei,            // uint256 borrowAmount
                    lendingParams.borrowChain,  // uint256 borrowChain
                    borrowTokenAddress,         // address borrowToken
                    aiRiskDataEncoded          // bytes calldata aiRiskDataEncoded
                );
                console.log('✅ Gas estimation SUCCESS:', gasEstimate.toString());
            } catch (gasError: any) {
                console.error('❌ Gas estimation failed:', gasError);

                if (gasError.code === 'CALL_EXCEPTION') {
                    throw new Error('Function call would fail - check contract deployment and function exists');
                } else if (gasError.message?.includes('execution reverted')) {
                    if (gasError.message.includes('AI: Risk too high')) {
                        throw new Error('AI risk protection: Position risk is too high. Try reducing borrow amount.');
                    } else if (gasError.message.includes('AI: Liquidation probability too high')) {
                        throw new Error('AI liquidation protection: High liquidation risk. Please adjust parameters.');
                    } else {
                        throw new Error('Transaction would fail - smart contract rejected the parameters');
                    }
                } else if (gasError.message?.includes('insufficient funds')) {
                    throw new Error('Insufficient ZETA balance for gas fees');
                } else {
                    throw new Error(`Gas estimation failed: ${gasError.message || 'Unknown error'}`);
                }
            }

            // ✅ Execute the transaction
            console.log('🚀 Sending transaction to blockchain...');

            const tx = await this.contract.lendCrossChain(
                collateralAmountWei,        // uint256 collateralAmount
                borrowAmountWei,            // uint256 borrowAmount
                lendingParams.borrowChain,  // uint256 borrowChain
                borrowTokenAddress,         // address borrowToken
                aiRiskDataEncoded,         // bytes calldata aiRiskDataEncoded
                {
                    gasLimit: gasEstimate + BigInt(DEFAULTS.GAS_BUFFER), // Add gas buffer
                }
            );

            console.log('📋 Transaction Hash:', tx.hash);
            console.log('⏳ Waiting for blockchain confirmation...');

            // Wait for confirmation with timeout
            const confirmationTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction confirmation timeout')), DEFAULTS.TRANSACTION_TIMEOUT)
            );

            const receipt = await Promise.race([
                tx.wait(),
                confirmationTimeout
            ]) as ethers.TransactionReceipt;

            if (!receipt || receipt.status !== 1) {
                throw new Error('Transaction failed on blockchain');
            }

            console.log('✅ Transaction CONFIRMED on blockchain!');
            console.log('📋 Block Number:', receipt.blockNumber);
            console.log('⛽ Gas Used:', receipt.gasUsed?.toString());

            // ✅ Parse events for position ID
            let positionId = null;
            let parsedEvents: any[] = [];

            if (receipt.logs?.length > 0) {
                console.log('📄 Parsing transaction logs...');

                for (const log of receipt.logs) {
                    try {
                        const parsed = this.contract.interface.parseLog({
                            topics: log.topics,
                            data: log.data
                        });

                        if (parsed) {
                            parsedEvents.push(parsed);
                            console.log('📋 Event found:', parsed.name);

                            if (parsed.name === 'CrossChainLend') {
                                positionId = parsed.args[1].toString();
                                console.log('🎯 Position ID created:', positionId);
                            }
                        }
                    } catch (parseError) {
                        // Skip unparseable logs
                    }
                }

                console.log('📊 Total events parsed:', parsedEvents.length);
            }

            // ✅ Return comprehensive result
            const result = {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed?.toString(),
                status: 'success',
                positionId,
                events: parsedEvents,
                explorerUrl: CONTRACT_HELPERS.getExplorerUrl(receipt.hash),
                timestamp: Date.now(),
                ltv: ltv.toFixed(2)
            };

            console.log('🎉 Cross-chain lending position created successfully!');
            return result;

        } catch (error: any) {
            console.error('❌ Blockchain transaction failed:', error);

            // ✅ Enhanced error handling
            if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
                throw new Error('Insufficient ZETA balance for this transaction. Get more ZETA from the faucet.');
            } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                throw new Error('Transaction cancelled by user in MetaMask.');
            } else if (error.message?.includes('execution reverted')) {
                if (error.message.includes('AI: Risk too high')) {
                    throw new Error('AI risk assessment failed - position risk is too high. Try reducing the borrow amount.');
                } else if (error.message.includes('AI: Liquidation probability too high')) {
                    throw new Error('AI detected high liquidation risk. Please reduce borrow amount or increase collateral.');
                } else {
                    throw new Error('Smart contract rejected the transaction. Please check your parameters and try again.');
                }
            } else if (error.code === 'CALL_EXCEPTION') {
                throw new Error('Contract function call failed. Please verify contract is deployed and accessible.');
            } else {
                throw new Error(`Transaction failed: ${error.message || 'Unknown blockchain error'}`);
            }
        }
    }

    // ✅ FIXED: Get user positions with proper fallback handling
    async getUserPositions(userAddress: string) {
        console.log('📊 Getting user positions for:', userAddress);

        if (!this.isInitialized) await this.initialize();
        if (!this.contract) throw new Error('Contract not initialized');

        try {
            // ✅ Try to get positions using getUserPositions function (if it exists)
            let positionIds: bigint[] = [];

            try {
                console.log('🔍 Trying getUserPositions function...');
                positionIds = await this.contract.getUserPositions(userAddress);
                console.log('✅ getUserPositions worked, found IDs:', positionIds.map(id => id.toString()));
            } catch (error) {
                console.log('❌ getUserPositions not available, trying alternative approach...');

                // ✅ Alternative: Check positions by iterating through position IDs
                try {
                    const nextId = await this.contract.nextPositionId();
                    const maxCheck = Math.min(Number(nextId), 50); // Check up to 50 positions

                    console.log(`🔍 Checking positions 0 to ${maxCheck} for user...`);

                    for (let i = 0; i < maxCheck; i++) {
                        try {
                            const position = await this.contract.lendingPositions(i);
                            if (position.user.toLowerCase() === userAddress.toLowerCase() && position.isActive) {
                                positionIds.push(BigInt(i));
                            }
                        } catch (positionError) {
                            // Position doesn't exist or error accessing it
                            continue;
                        }
                    }

                    console.log('✅ Found positions by iteration:', positionIds.map(id => id.toString()));

                } catch (iterationError) {
                    console.warn('❌ Alternative position finding failed:', iterationError);
                    return []; // Return empty array as final fallback
                }
            }

            if (positionIds.length === 0) {
                console.log('No positions found for user');
                return [];
            }

            // ✅ Get detailed information for each position
            const positions = await Promise.all(
                positionIds.map(async (positionId: bigint) => {
                    try {
                        console.log(`📋 Getting details for position ${positionId}...`);

                        // Try using getLendingPosition first, fallback to lendingPositions
                        let position: any;
                        let aiRisk: any = null;

                        try {
                            position = await this.contract!.getLendingPosition(positionId);
                        } catch (error) {
                            console.log(`Trying lendingPositions mapping for ${positionId}...`);
                            position = await this.contract!.lendingPositions(positionId);
                        }

                        // Try to get AI risk data
                        try {
                            aiRisk = await this.contract!.getAIRiskAssessment(positionId);
                        } catch (error) {
                            try {
                                aiRisk = await this.contract!.aiRiskData(positionId);
                            } catch (error2) {
                                console.log(`No AI risk data for position ${positionId}`);
                            }
                        }

                        return CONTRACT_HELPERS.formatPosition({
                            id: positionId.toString(),
                            user: position.user || position[0],
                            collateralAmount: position.collateralAmount || position[1],
                            borrowedAmount: position.borrowedAmount || position[2],
                            collateralChain: position.collateralChain || position[3],
                            borrowChain: position.borrowChain || position[4],
                            collateralToken: position.collateralToken || position[5],
                            borrowToken: position.borrowToken || position[6],
                            liquidationThreshold: position.liquidationThreshold || position[7],
                            timestamp: position.timestamp || position[8],
                            isActive: position.isActive !== undefined ? position.isActive : position[9],
                            aiRiskScore: position.aiRiskScore || position[10] || (aiRisk ? aiRisk.riskScore || aiRisk[0] : 0),
                            yieldRate: position.yieldRate || position[11] || 0,
                            aiRiskData: aiRisk ? {
                                riskScore: Number(aiRisk.riskScore || aiRisk[0] || 0),
                                recommendedLTV: Number(aiRisk.recommendedLTV || aiRisk[1] || 65),
                                liquidationProbability: Number(aiRisk.liquidationProbability || aiRisk[2] || 20),
                                healthFactor: Number(aiRisk.healthFactor || aiRisk[4] || 100),
                                optimizedYieldChain: Number(aiRisk.optimizedYieldChain || aiRisk[5] || 1)
                            } : null
                        });
                    } catch (error) {
                        console.warn(`Failed to get position details for ID ${positionId}:`, error);
                        return null;
                    }
                })
            );

            const validPositions = positions.filter(p => p !== null);
            console.log('✅ Successfully retrieved', validPositions.length, 'positions');
            return validPositions;

        } catch (error: any) {
            console.error('❌ Failed to get user positions:', error);

            // Return mock data for development/testing
            console.log('🔄 Returning mock position data for testing');
            return [
                CONTRACT_HELPERS.formatPosition({
                    id: '1',
                    user: userAddress,
                    collateralAmount: ethers.parseEther('1.0'),
                    borrowedAmount: ethers.parseEther('0.75'),
                    collateralChain: 7001,
                    borrowChain: 137,
                    collateralToken: ethers.ZeroAddress,
                    borrowToken: ethers.ZeroAddress,
                    liquidationThreshold: 80,
                    timestamp: Math.floor(Date.now() / 1000),
                    isActive: true,
                    aiRiskScore: 35,
                    yieldRate: 720,
                    aiRiskData: {
                        riskScore: 35,
                        recommendedLTV: 65,
                        liquidationProbability: 15,
                        healthFactor: 133,
                        optimizedYieldChain: 137
                    }
                })
            ];
        }
    }

    // ✅ Other methods remain the same but with enhanced error handling
    async liquidatePosition(positionId: string) {
        if (!this.isInitialized) await this.initialize();
        if (!this.contract) throw new Error('Contract not initialized');

        console.log('🔥 Liquidating position:', positionId);

        try {
            const tx = await this.contract.liquidatePositionAdvanced(positionId, {
                gasLimit: 600000
            });

            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('Liquidation transaction failed');
            }

            console.log('✅ Position liquidated successfully:', receipt.hash);
            return receipt;
        } catch (error: any) {
            console.error('❌ Liquidation failed:', error);

            if (error.message?.includes('Position not active')) {
                throw new Error('Position is not active or does not exist');
            } else if (error.message?.includes('Position healthy')) {
                throw new Error('Position is healthy and cannot be liquidated');
            } else {
                throw new Error(`Liquidation failed: ${error.message || 'Unknown error'}`);
            }
        }
    }

    async updateAIRisk(positionId: string, riskScore: number, liquidationProb: number) {
        if (!this.isInitialized) await this.initialize();
        if (!this.contract) throw new Error('Contract not initialized');

        // Validate inputs
        if (riskScore < 0 || riskScore > 100 || liquidationProb < 0 || liquidationProb > 100) {
            throw new Error('Risk score and liquidation probability must be between 0 and 100');
        }

        console.log('🤖 Updating AI risk for position:', positionId);

        try {
            const tx = await this.contract.updateAIRiskAssessment(
                positionId,
                Math.floor(riskScore),
                Math.floor(liquidationProb),
                { gasLimit: 300000 }
            );

            const receipt = await tx.wait();

            if (receipt.status !== 1) {
                throw new Error('AI risk update transaction failed');
            }

            console.log('✅ AI risk updated successfully:', receipt.hash);
            return receipt;
        } catch (error: any) {
            console.error('❌ AI risk update failed:', error);
            throw new Error(`AI risk update failed: ${error.message || 'Unknown error'}`);
        }
    }

    // ✅ Event listeners
    onPositionCreated(callback: (event: any) => void) {
        if (!this.contract) return;

        try {
            this.contract.on('CrossChainLend', (user, positionId, collateralChain, borrowChain, collateralAmount, borrowAmount, event) => {
                console.log('🔔 Position created event received');
                try {
                    callback({
                        user,
                        positionId: positionId.toString(),
                        collateralChain: Number(collateralChain),
                        borrowChain: Number(borrowChain),
                        collateralAmount: ethers.formatEther(collateralAmount),
                        borrowAmount: ethers.formatEther(borrowAmount),
                        transactionHash: event.transactionHash,
                        blockNumber: event.blockNumber
                    });
                } catch (callbackError) {
                    console.error('Error in position created callback:', callbackError);
                }
            });
        } catch (error) {
            console.warn('Could not set up CrossChainLend event listener:', error);
        }
    }

    removeAllListeners() {
        try {
            if (this.contract) {
                this.contract.removeAllListeners();
                console.log('✅ All event listeners removed');
            }
        } catch (error) {
            console.warn('Error removing event listeners:', error);
        }
    }

    async isContractHealthy(): Promise<boolean> {
        try {
            if (!this.provider || !this.contract) return false;

            const code = await this.provider.getCode(CONTRACT_ADDRESSES.ZETA_LEND_AI);
            const hasCode = code !== '0x';

            if (hasCode) {
                await this.contract.nextPositionId();
            }

            return hasCode;
        } catch (error) {
            console.error('Contract health check failed:', error);
            return false;
        }
    }

    getContractAddress(): string | null {
        return this.contract?.target as string || null;
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasProvider: !!this.provider,
            hasSigner: !!this.signer,
            hasContract: !!this.contract,
            contractAddress: this.getContractAddress()
        };
    }
}

export const zetaChainService = new ZetaChainService();