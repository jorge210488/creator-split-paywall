export const envConfig = () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  blockchain: {
    rpcUrl: process.env.ETH_RPC_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    contractNetwork: process.env.CONTRACT_NETWORK || "sepolia",
    startBlock: process.env.CONTRACT_START_BLOCK
      ? parseInt(process.env.CONTRACT_START_BLOCK, 10)
      : null,
    confirmations: parseInt(process.env.CONFIRMATIONS || "3", 10),
    lookbackBlocks: parseInt(process.env.LOOKBACK_BLOCKS || "2000", 10),
    pollInterval: parseInt(process.env.POLL_INTERVAL || "15000", 10),
  },
});
