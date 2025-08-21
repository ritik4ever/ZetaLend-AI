require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [PRIVATE_KEY]
    },
    zetachain_testnet: {
      url: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      chainId: 7001,
      accounts: [PRIVATE_KEY],
      gas: 5000000,
      gasPrice: 30000000000, // 30 gwei - higher gas price
      timeout: 120000, // 2 minutes timeout
      confirmations: 2,
    },
    // Alternative ZetaChain RPC
    zetachain_testnet_alt: {
      url: "https://rpc.ankr.com/zetachain_evm_testnet",
      chainId: 7001,
      accounts: [PRIVATE_KEY],
      gas: 5000000,
      gasPrice: 30000000000,
      timeout: 120000,
      confirmations: 1,
    },
    // Backup option - another RPC
    zetachain_testnet_backup: {
      url: "https://athens.rpc.thirdweb.com",
      chainId: 7001,
      accounts: [PRIVATE_KEY],
      gas: 5000000,
      gasPrice: 25000000000,
      timeout: 180000,
      confirmations: 1,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
