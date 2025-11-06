export const envConfig = () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  blockchain: {
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    privateKey: process.env.PRIVATE_KEY,
  },
});
