const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupLocalnet() {
    console.log('🚀 Setting up ZetaLend AI Localnet Environment');
    console.log('='.repeat(60));

    try {
        // 1. Check prerequisites
        console.log('1. Checking prerequisites...');
        await checkPrerequisites();

        // 2. Start ZetaChain localnet
        console.log('2. Starting ZetaChain localnet...');
        await startLocalnet();

        // 3. Deploy contracts
        console.log('3. Deploying contracts...');
        await deployContracts();

        // 4. Setup frontend environment
        console.log('4. Setting up frontend...');
        await setupFrontend();

        // 5. Start backend services
        console.log('5. Starting backend services...');
        await startBackend();

        console.log('\n✅ Setup completed successfully!');
        console.log('='.repeat(60));
        console.log('🌐 Frontend: http://localhost:3000');
        console.log('🔧 Backend: http://localhost:3001');
        console.log('⛓️ Localnet: http://localhost:8545');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

async function checkPrerequisites() {
    const commands = [
        'node --version',
        'npm --version',
        'npx zetachain@latest --version'
    ];

    for (const cmd of commands) {
        try {
            await execCommand(cmd);
            console.log(`✅ ${cmd.split(' ')[0]} is installed`);
        } catch (error) {
            throw new Error(`❌ ${cmd.split(' ')[0]} is not installed or not in PATH`);
        }
    }
}

async function startLocalnet() {
    console.log('Starting ZetaChain localnet...');

    // Start localnet in background
    const localnetProcess = exec('npx zetachain@latest localnet start --port 8545');

    // Wait for localnet to be ready
    await new Promise((resolve, reject) => {
        let output = '';

        localnetProcess.stdout.on('data', (data) => {
            output += data;
            console.log(data.toString());

            if (output.includes('gatewayZEVM')) {
                resolve();
            }
        });

        localnetProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        setTimeout(() => {
            reject(new Error('Localnet startup timeout'));
        }, 120000); // 2 minutes timeout
    });

    console.log('✅ Localnet started successfully');
}

async function deployContracts() {
    console.log('Deploying ZetaLend AI contracts...');

    // Create hardhat config for localnet
    const hardhatConfig = `
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.26",
  networks: {
    localnet: {
      url: "http://localhost:8545",
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
    }
  }
};
`;

    fs.writeFileSync(path.join(process.cwd(), 'contracts', 'hardhat.config.js'), hardhatConfig);

    // Deploy contracts
    process.chdir(path.join(process.cwd(), 'contracts'));
    await execCommand('npm install');
    await execCommand('npx hardhat compile');
    await execCommand('npx hardhat run deployment/deploy.js --network localnet');

    console.log('✅ Contracts deployed successfully');
}

async function setupFrontend() {
    console.log('Setting up frontend environment...');

    const frontendDir = path.join(process.cwd(), 'frontend');
    process.chdir(frontendDir);

    // Install dependencies
    await execCommand('npm install');

    // Create environment file
    const envContent = `
REACT_APP_ZETA_CHAIN_RPC=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x123... # Will be updated after deployment
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
`;

    fs.writeFileSync(path.join(frontendDir, '.env'), envContent);

    console.log('✅ Frontend setup completed');
}

async function startBackend() {
    console.log('Starting backend services...');

    const backendDir = path.join(process.cwd(), 'backend');
    process.chdir(backendDir);

    // Install dependencies
    await execCommand('npm install');

    // Start backend in background
    const backendProcess = exec('npm run dev');

    backendProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Backend started successfully');
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Run setup if called directly
if (require.main === module) {
    setupLocalnet();
}

module.exports = { setupLocalnet };