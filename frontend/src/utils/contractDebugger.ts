import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, getWorkingRpcUrl } from './constants';

interface FunctionTestResult {
    workingFunctions: string[];
    failedFunctions: string[];
    recommendations: string[];
}

export class ContractDebugger {
    private provider: ethers.JsonRpcProvider | null = null;

    constructor() {
        this.initializeProvider();
    }

    private async initializeProvider() {
        try {
            const workingRpc = await getWorkingRpcUrl();
            this.provider = new ethers.JsonRpcProvider(workingRpc);
            console.log('✅ Contract debugger initialized with RPC:', workingRpc);
        } catch (error) {
            console.error('❌ Failed to initialize contract debugger:', error);
        }
    }

    // ✅ Check if contract is properly deployed
    async verifyContractDeployment(): Promise<{
        isDeployed: boolean;
        codeLength: number;
        hasCode: boolean;
        blockNumber?: number;
        error?: string;
    }> {
        try {
            if (!this.provider) {
                await this.initializeProvider();
            }

            if (!this.provider) {
                throw new Error('Failed to initialize provider');
            }

            console.log('🔍 Checking contract deployment at:', CONTRACT_ADDRESSES.ZETA_LEND_AI);

            const code = await this.provider.getCode(CONTRACT_ADDRESSES.ZETA_LEND_AI);
            const currentBlock = await this.provider.getBlockNumber();

            const result = {
                isDeployed: code !== '0x',
                codeLength: code.length,
                hasCode: code !== '0x',
                blockNumber: currentBlock
            };

            if (result.isDeployed) {
                console.log('✅ Contract is deployed');
                console.log('📏 Bytecode length:', result.codeLength);
                console.log('📦 Current block:', result.blockNumber);
            } else {
                console.error('❌ Contract NOT deployed at this address');
            }

            return result;

        } catch (error: any) {
            console.error('❌ Contract verification failed:', error);
            return {
                isDeployed: false,
                codeLength: 0,
                hasCode: false,
                error: error.message
            };
        }
    }

    // ✅ Test contract functions with different ABIs
    async testContractFunctions(): Promise<FunctionTestResult> {
        try {
            if (!this.provider) {
                await this.initializeProvider();
            }

            console.log('🧪 Testing contract functions...');

            const testFunctions = [
                {
                    name: 'deposit',
                    abi: ['function deposit(uint256,uint256,uint256,address,address) external payable'],
                    params: [
                        ethers.parseEther('0.1'),
                        ethers.parseEther('0.05'),
                        1,
                        ethers.ZeroAddress,
                        ethers.ZeroAddress
                    ],
                    value: ethers.parseEther('0.1')
                },
                {
                    name: 'createPosition',
                    abi: ['function createPosition(uint256,uint256,uint256,address,bytes) external payable'],
                    params: [
                        ethers.parseEther('0.1'),
                        ethers.parseEther('0.05'),
                        1,
                        ethers.ZeroAddress,
                        '0x'
                    ],
                    value: ethers.parseEther('0.1')
                },
                {
                    name: 'onCall',
                    abi: ['function onCall(address,uint256,bytes) external'],
                    params: [
                        '0x742d35Cc6638C8532C4C8b8C4b3aA8b6a0c8F5B2',
                        ethers.parseEther('0.1'),
                        '0x'
                    ],
                    value: ethers.parseEther('0.1')
                },
                {
                    name: 'lend',
                    abi: ['function lend(uint256,uint256) external payable'],
                    params: [
                        ethers.parseEther('0.1'),
                        ethers.parseEther('0.05')
                    ],
                    value: ethers.parseEther('0.1')
                }
            ];

            const workingFunctions: string[] = [];
            const failedFunctions: string[] = [];

            for (const testFunc of testFunctions) {
                try {
                    console.log(`🔄 Testing ${testFunc.name}...`);

                    const contract = new ethers.Contract(
                        CONTRACT_ADDRESSES.ZETA_LEND_AI,
                        testFunc.abi,
                        this.provider
                    );

                    await contract[testFunc.name].estimateGas(
                        ...testFunc.params,
                        { value: testFunc.value }
                    );

                    console.log(`✅ ${testFunc.name} exists and is callable`);
                    workingFunctions.push(testFunc.name);

                } catch (error: any) {
                    console.log(`❌ ${testFunc.name} failed:`, error.message);
                    failedFunctions.push(`${testFunc.name}: ${error.message}`);
                }
            }

            const recommendations = this.generateRecommendations(workingFunctions, failedFunctions);

            return {
                workingFunctions,
                failedFunctions,
                recommendations
            };

        } catch (error: any) {
            console.error('❌ Function testing failed:', error);
            return {
                workingFunctions: [],
                failedFunctions: ['Testing failed: ' + error.message],
                recommendations: ['Fix RPC connection and try again']
            };
        }
    }

    private generateRecommendations(working: string[], failed: string[]): string[] {
        const recommendations: string[] = [];

        if (working.length === 0) {
            recommendations.push('❌ No working functions found - contract ABI is completely wrong');
            recommendations.push('🔍 Check contract source code on block explorer');
            recommendations.push('📝 Verify contract is properly deployed with expected functions');
        } else {
            recommendations.push(`✅ Found ${working.length} working function(s): ${working.join(', ')}`);
            recommendations.push('💡 Update your wallet service to use these working functions');
        }

        if (failed.some(f => f.includes('execution reverted'))) {
            recommendations.push('⚠️  Functions exist but revert - check function parameters');
        }

        if (failed.some(f => f.includes('gas'))) {
            recommendations.push('⛽ Gas estimation issues - try with higher gas limits');
        }

        return recommendations;
    }

    // ✅ Generate working ABI based on successful tests
    async generateWorkingABI(): Promise<string[]> {
        const testResult = await this.testContractFunctions();

        const workingABI: string[] = [];

        if (testResult.workingFunctions.includes('deposit')) {
            workingABI.push('function deposit(uint256 collateralAmount, uint256 borrowAmount, uint256 borrowChain, address collateralToken, address borrowToken) external payable');
        }

        if (testResult.workingFunctions.includes('createPosition')) {
            workingABI.push('function createPosition(uint256 collateralAmount, uint256 borrowAmount, uint256 borrowChain, address collateralToken, bytes calldata data) external payable');
        }

        if (testResult.workingFunctions.includes('onCall')) {
            workingABI.push('function onCall(address sender, uint256 amount, bytes calldata data) external');
        }

        if (testResult.workingFunctions.includes('lend')) {
            workingABI.push('function lend(uint256 collateralAmount, uint256 borrowAmount) external payable');
        }

        // Always add common read functions and events
        workingABI.push('function getUserPositions(address user) external view returns (uint256[])');
        workingABI.push('function getPosition(uint256 positionId) external view returns (tuple(address,uint256,uint256,uint256,uint256,address,address,uint256,uint256,bool,uint256,uint256))');
        workingABI.push('event PositionCreated(uint256 indexed positionId, address indexed user, uint256 collateralAmount, uint256 borrowAmount)');

        console.log('🔧 Generated working ABI:', workingABI);
        return workingABI;
    }

    // ✅ Full diagnostic report
    async runFullDiagnostic(): Promise<{
        contractDeployment: any;
        functionTests: FunctionTestResult;
        workingABI: string[];
        overallStatus: 'healthy' | 'partial' | 'broken';
        actionRequired: string[];
    }> {
        console.log('🔍 Running full contract diagnostic...');

        const contractDeployment = await this.verifyContractDeployment();
        let functionTests: FunctionTestResult = { workingFunctions: [], failedFunctions: [], recommendations: [] };
        let workingABI: string[] = [];
        let overallStatus: 'healthy' | 'partial' | 'broken' = 'broken';
        const actionRequired: string[] = [];

        if (contractDeployment.isDeployed) {
            functionTests = await this.testContractFunctions();
            workingABI = await this.generateWorkingABI();

            if (functionTests.workingFunctions.length >= 2) {
                overallStatus = 'healthy';
                actionRequired.push('✅ Contract is functional - use the generated working ABI');
            } else if (functionTests.workingFunctions.length >= 1) {
                overallStatus = 'partial';
                actionRequired.push('⚠️  Limited functionality - some functions work');
                actionRequired.push('🔧 Update wallet service to use working functions only');
            } else {
                overallStatus = 'broken';
                actionRequired.push('❌ No working functions found');
                actionRequired.push('🛠️  Contract ABI is completely wrong or contract is broken');
            }
        } else {
            actionRequired.push('❌ Contract not deployed at the specified address');
            actionRequired.push('🔍 Verify contract address and deployment');
        }

        const diagnostic = {
            contractDeployment,
            functionTests,
            workingABI,
            overallStatus,
            actionRequired
        };

        console.log('📋 Diagnostic complete:', diagnostic);
        return diagnostic;
    }

    // ✅ Test specific transaction with real wallet
    async testTransactionWithWallet(walletProvider: any): Promise<{
        success: boolean;
        method: string;
        error?: string;
        gasEstimate?: string;
    }> {
        try {
            if (!walletProvider) {
                throw new Error('Wallet provider not available');
            }

            const provider = new ethers.BrowserProvider(walletProvider);
            const signer = await provider.getSigner();

            console.log('🔄 Testing transaction with real wallet...');

            // Test simple transfer first
            try {
                const gasEstimate = await signer.estimateGas({
                    to: CONTRACT_ADDRESSES.ZETA_LEND_AI,
                    value: ethers.parseEther('0.01'),
                    data: '0x'
                });

                return {
                    success: true,
                    method: 'simple_transfer',
                    gasEstimate: gasEstimate.toString()
                };
            } catch (transferError: any) {
                console.log('❌ Simple transfer failed:', transferError.message);
            }

            // Test with function call
            const testABI = ['function deposit(uint256,uint256,uint256,address,address) external payable'];
            const contract = new ethers.Contract(CONTRACT_ADDRESSES.ZETA_LEND_AI, testABI, signer);

            try {
                const gasEstimate = await contract.deposit.estimateGas(
                    ethers.parseEther('0.01'),
                    ethers.parseEther('0.005'),
                    1,
                    ethers.ZeroAddress,
                    ethers.ZeroAddress,
                    { value: ethers.parseEther('0.01') }
                );

                return {
                    success: true,
                    method: 'deposit_function',
                    gasEstimate: gasEstimate.toString()
                };
            } catch (funcError: any) {
                return {
                    success: false,
                    method: 'all_methods_failed',
                    error: funcError.message
                };
            }

        } catch (error: any) {
            return {
                success: false,
                method: 'wallet_test',
                error: error.message
            };
        }
    }

    // ✅ Generate transaction debugging report
    async debugTransactionFailure(errorMessage: string): Promise<{
        errorType: string;
        possibleCauses: string[];
        solutions: string[];
        testSuggestions: string[];
    }> {
        const analysis = {
            errorType: 'unknown',
            possibleCauses: [] as string[],
            solutions: [] as string[],
            testSuggestions: [] as string[]
        };

        if (errorMessage.includes('CALL_EXCEPTION')) {
            analysis.errorType = 'CALL_EXCEPTION';
            analysis.possibleCauses = [
                "Function signature doesn't match contract",
                'Contract not deployed at address',
                'Wrong function parameters',
                'Contract function reverts'
            ];
            analysis.solutions = [
                'Verify contract deployment on explorer',
                'Check function exists in contract ABI',
                'Use correct function parameters',
                'Try different function signature'
            ];
        } else if (errorMessage.includes('insufficient funds')) {
            analysis.errorType = 'INSUFFICIENT_FUNDS';
            analysis.possibleCauses = [
                'Not enough ZETA for transaction',
                'Not enough ZETA for gas fees'
            ];
            analysis.solutions = [
                'Get more ZETA from faucet',
                'Reduce transaction amount',
                'Check gas price settings'
            ];
        } else if (errorMessage.includes('gas')) {
            analysis.errorType = 'GAS_ISSUE';
            analysis.possibleCauses = [
                'Gas estimation failed',
                'Transaction will revert',
                'Gas limit too low'
            ];
            analysis.solutions = [
                'Increase gas limit',
                'Check function parameters',
                'Verify contract state'
            ];
        } else if (errorMessage.includes('network')) {
            analysis.errorType = 'NETWORK_ISSUE';
            analysis.possibleCauses = [
                'Wrong network selected',
                'RPC connection issues',
                'Network congestion'
            ];
            analysis.solutions = [
                'Switch to ZetaChain Testnet',
                'Try different RPC endpoint',
                'Wait and retry'
            ];
        }

        analysis.testSuggestions = [
            'Run quickContractTest() in console',
            'Check contract on explorer',
            'Try with smaller amounts',
            'Verify wallet connection'
        ];

        return analysis;
    }
}

// ✅ Export singleton instance
export const contractDebugger = new ContractDebugger();

// ✅ Utility function for quick testing in browser console
export const quickContractTest = async () => {
    console.log('🚀 Running quick contract test...');

    try {
        const result = await contractDebugger.runFullDiagnostic();

        console.log('\\n📋 === CONTRACT DIAGNOSTIC REPORT ===');
        console.log('Contract Status:', result.overallStatus);
        console.log('Deployed:', result.contractDeployment.isDeployed);
        console.log('Working Functions:', result.functionTests.workingFunctions);
        console.log('Action Required:', result.actionRequired);

        if (result.workingABI.length > 0) {
            console.log('\\n🔧 WORKING ABI TO USE:');
            result.workingABI.forEach((abi: string) => console.log(abi));
        }

        if (result.functionTests.recommendations.length > 0) {
            console.log('\\n💡 RECOMMENDATIONS:');
            result.functionTests.recommendations.forEach((rec: string) => console.log(rec));
        }

        return result;

    } catch (error) {
        console.error('❌ Quick test failed:', error);
        return null;
    }
};

// ✅ Test wallet transaction function for console
export const testWalletTransaction = async () => {
    try {
        if (typeof window === 'undefined' || !(window as any).ethereum) {
            console.error('❌ MetaMask not available');
            return;
        }

        const result = await contractDebugger.testTransactionWithWallet((window as any).ethereum);

        console.log('\\n🔄 === WALLET TRANSACTION TEST ===');
        console.log('Success:', result.success);
        console.log('Method:', result.method);
        if (result.gasEstimate) {
            console.log('Gas Estimate:', result.gasEstimate);
        }
        if (result.error) {
            console.log('Error:', result.error);

            const debug = await contractDebugger.debugTransactionFailure(result.error);
            console.log('\\n🔍 === ERROR ANALYSIS ===');
            console.log('Error Type:', debug.errorType);
            console.log('Possible Causes:', debug.possibleCauses);
            console.log('Solutions:', debug.solutions);
        }

        return result;

    } catch (error) {
        console.error('❌ Wallet test failed:', error);
        return null;
    }
};

// ✅ Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).quickContractTest = quickContractTest;
    (window as any).testWalletTransaction = testWalletTransaction;
    (window as any).contractDebugger = contractDebugger;
    console.log('🔧 Contract debugging tools loaded. Try:');
    console.log('- quickContractTest()');
    console.log('- testWalletTransaction()');
}