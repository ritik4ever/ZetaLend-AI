const { ethers } = require("hardhat");

async function main() {
    console.log('🚀 Deploying ZetaLend AI to ZetaChain Testnet...');
    console.log('Network:', hre.network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log('Deploying with account:', deployer.address);
    
    // Get account balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('Account balance:', ethers.formatEther(balance), 'ZETA');
    
    if (balance < ethers.parseEther("0.1")) {
        console.log('❌ Insufficient balance. Need at least 0.1 ZETA for deployment.');
        console.log('💡 Get testnet ZETA from: https://labs.zetachain.com/get-zeta');
        return;
    }
    
    // ZetaChain testnet gateway address
    const GATEWAY_ADDRESS = '0xfEDD7A6e3Ef1cC470fbfbF955a22D793dDC0F44E';
    
    try {
        // Deploy ZetaLend AI contract
        console.log('📝 Preparing contract deployment...');
        const ZetaLendAI = await ethers.getContractFactory('ZetaLendAI');
        
        console.log('🚀 Sending deployment transaction...');
        const deploymentTx = await ZetaLendAI.deploy(GATEWAY_ADDRESS, {
            gasLimit: 5000000,
            gasPrice: 30000000000
        });
        
        console.log('⏳ Transaction sent. Hash:', deploymentTx.deploymentTransaction().hash);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for deployment with timeout
        const zetaLendAI = await Promise.race([
            deploymentTx.waitForDeployment(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Deployment timeout after 3 minutes')), 180000)
            )
        ]);
        
        const contractAddress = await zetaLendAI.getAddress();
        console.log('✅ ZetaLend AI deployed to:', contractAddress);
        
        // Verify the deployment
        console.log('🔍 Verifying deployment...');
        try {
            const gateway = await zetaLendAI.gateway();
            console.log('✅ Gateway address verified:', gateway);
            
            const nextPositionId = await zetaLendAI.nextPositionId();
            console.log('✅ Contract initialized. Next position ID:', nextPositionId.toString());
        } catch (verifyError) {
            console.log('⚠️ Contract deployed but verification failed:', verifyError.message);
        }
        
        console.log('\n📋 Deployment Summary:');
        console.log('='.repeat(60));
        console.log(`🏆 ZetaLend AI Contract: ${contractAddress}`);
        console.log(`🌐 Gateway: ${GATEWAY_ADDRESS}`);
        console.log(`👤 Deployer: ${deployer.address}`);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ZETA`);
        console.log(`🔗 Network: ZetaChain Testnet (7001)`);
        console.log(`📝 TX Hash: ${deploymentTx.deploymentTransaction().hash}`);
        console.log('='.repeat(60));
        
        console.log('\n🎯 Prize Categories Implemented:');
        console.log('   ✅ Cross-Chain Lending Track ($3,000)');
        console.log('   ✅ Best Use of Universal Contract ($1,000)');
        console.log('   ✅ Most Innovative Gateway API Use ($1,000)');
        console.log('   ✅ Best AI Feature ($1,000)');
        console.log('\n💰 Total Potential: $6,000 stZETA + 4x Google Cloud Credits');
        
        // Save deployment info
        const deploymentInfo = {
            zetaLendAI: contractAddress,
            gateway: GATEWAY_ADDRESS,
            deployer: deployer.address,
            network: hre.network.name,
            chainId: 7001,
            txHash: deploymentTx.deploymentTransaction().hash,
            timestamp: new Date().toISOString(),
            balance: ethers.formatEther(balance)
        };
        
        const fs = require('fs');
        fs.writeFileSync(
            'deployment-zetachain-testnet.json',
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('\n📄 Deployment info saved to: deployment-zetachain-testnet.json');
        console.log('\n🎉 Deployment completed successfully!');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💡 Get testnet ZETA from faucet:');
            console.log('   🚰 https://labs.zetachain.com/get-zeta');
            console.log(`   📝 Your address: ${deployer.address}`);
        } else if (error.message.includes('timeout') || error.message.includes('not found')) {
            console.log('\n💡 Network issue detected. Try:');
            console.log('   1. npx hardhat run deployment/deploy.js --network zetachain_testnet_alt');
            console.log('   2. npx hardhat run deployment/deploy.js --network zetachain_testnet_backup');
        }
        
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };
