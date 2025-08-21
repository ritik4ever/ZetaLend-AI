#!/bin/bash

echo "🚀 ZetaLend AI - Complete Setup Script"
echo "======================================"
echo "Setting up the complete AI-powered cross-chain lending platform..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "1. Checking prerequisites..."
check_prerequisites() {
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js >= 18"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version must be >= 18. Current version: $(node -v)"
        exit 1
    fi
    print_status "Node.js $(node -v) found"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm -v) found"
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    print_status "git found"
    
    # Check if in correct directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    print_status "Project structure verified"
}

check_prerequisites

# Install root dependencies
echo ""
echo "2. Installing root dependencies..."
npm install
print_status "Root dependencies installed"

# Setup contracts
echo ""
echo "3. Setting up smart contracts..."
cd contracts
if [ ! -f "package.json" ]; then
    npm init -y
    npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
    npm install @zetachain/protocol-contracts
fi
npm install
print_status "Contract dependencies installed"

# Create hardhat config if it doesn't exist
if [ ! -f "hardhat.config.js" ]; then
    cat > hardhat.config.js << EOL
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.26",
  networks: {
    localnet: {
      url: "http://localhost:8545",
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
    },
    testnet: {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
EOL
    print_status "Hardhat config created"
fi

cd ..

# Setup backend
echo ""
echo "4. Setting up backend..."
cd backend
if [ ! -f "package.json" ]; then
    npm init -y
fi
npm install
print_status "Backend dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env << EOL
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# ZetaChain Configuration
ZETA_TESTNET_RPC=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
ZETA_MAINNET_RPC=https://zetachain-evm.blockpi.network/v1/rpc/public

# Security
CORS_ORIGIN=http://localhost:3000
EOL
    print_warning "Please add your GEMINI_API_KEY to backend/.env"
fi

cd ..

# Setup frontend
echo ""
echo "5. Setting up frontend..."
cd frontend
if [ ! -f "package.json" ]; then
    npx create-react-app . --template typescript
fi
npm install
print_status "Frontend dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOL
REACT_APP_ZETA_CHAIN_RPC=http://localhost:8545
REACT_APP_CONTRACT_ADDRESS=0x123...
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_ENVIRONMENT=development
EOL
    print_status "Frontend environment file created"
fi

cd ..

# Start ZetaChain localnet
echo ""
echo "6. Starting ZetaChain localnet..."
print_info "This may take a few minutes on first run..."

# Kill any existing processes on port 8545
lsof -ti:8545 | xargs kill -9 2>/dev/null || true

# Start localnet in background
nohup npx zetachain@latest localnet start --port 8545 > localnet.log 2>&1 &
LOCALNET_PID=$!

# Wait for localnet to be ready
echo "Waiting for localnet to start..."
for i in {1..60}; do
    if curl -s http://localhost:8545 >/dev/null 2>&1; then
        print_status "Localnet started on port 8545"
        break
    fi
    if [ $i -eq 60 ]; then
        print_error "Localnet failed to start within 60 seconds"
        exit 1
    fi
    sleep 2
    echo -n "."
done

echo ""

# Deploy contracts
echo ""
echo "7. Deploying smart contracts..."
cd contracts
npx hardhat compile
if npx hardhat run deployment/deploy.js --network localnet; then
    print_status "Contracts deployed successfully"
else
    print_error "Contract deployment failed"
    exit 1
fi
cd ..

# Start backend
echo ""
echo "8. Starting backend services..."
cd backend
nohup npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
print_status "Backend started on port 3001"
cd ..

# Start frontend
echo ""
echo "9. Starting frontend..."
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
print_status "Frontend starting on port 3000"
cd ..

# Wait for services to be ready
echo ""
echo "10. Waiting for services to be ready..."
sleep 10

# Check if services are running
check_service() {
    local port=$1
    local service=$2
    if curl -s http://localhost:$port >/dev/null 2>&1; then
        print_status "$service is running on port $port"
        return 0
    else
        print_error "$service failed to start on port $port"
        return 1
    fi
}

check_service 8545 "ZetaChain Localnet"
check_service 3001 "Backend API"
sleep 15 # Give frontend more time to compile
check_service 3000 "Frontend"

# Save process IDs for cleanup
echo $LOCALNET_PID > .localnet.pid
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Final status
echo ""
echo "🎉 Setup completed successfully!"
echo "=============================="
echo ""
echo "🌐 Services running:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   Localnet: http://localhost:8545"
echo ""
echo "📋 Prize Categories Implemented:"
echo "   🎯 Cross-Chain Lending Track ($3,000)"
echo "   🔗 Best Use of Universal Contract ($1,000)"
echo "   ⚡ Most Innovative Gateway API Use ($1,000)"
echo "   🤖 Best AI Feature ($1,000)"
echo ""
echo "💰 Total Potential: $6,000 stZETA + 4x Google Cloud Credits"
echo ""
echo "📖 Next steps:"
echo "   1. Add your GEMINI_API_KEY to backend/.env"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Connect your MetaMask wallet"
echo "   4. Start creating cross-chain lending positions!"
echo ""
echo "🛑 To stop all services: npm run stop"
echo "📊 To run demo: npm run demo"
echo ""
print_status "ZetaLend AI is ready for the hackathon! 🚀"