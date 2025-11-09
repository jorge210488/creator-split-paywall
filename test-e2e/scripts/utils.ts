import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

export interface TestConfig {
  rpcUrl: string;
  contractAddress: string;
  backendUrl: string;
  testerPrivateKey: string;
  ownerPrivateKey: string;
  subscriptionPriceWei: string;
  subscriptionDurationSeconds: number;
  redisUrl: string;
  payee1: string;
  payee2: string;
}

export function getConfig(): TestConfig {
  return {
    rpcUrl: process.env.ETH_RPC_URL || "",
    contractAddress: process.env.CONTRACT_ADDRESS || "",
    backendUrl: process.env.BACKEND_BASE_URL || "http://localhost:3000",
    testerPrivateKey: process.env.TESTER_PRIVATE_KEY || "",
    ownerPrivateKey: process.env.OWNER_PRIVATE_KEY || "",
    subscriptionPriceWei:
      process.env.SUBSCRIPTION_PRICE_WEI || "10000000000000000",
    subscriptionDurationSeconds: parseInt(
      process.env.SUBSCRIPTION_DURATION_SECONDS || "2592000"
    ),
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379/0",
    payee1: process.env.PAYEE_1 || "",
    payee2: process.env.PAYEE_2 || "",
  };
}

export function getProvider(): ethers.Provider {
  const primary = process.env.ETH_RPC_URL || "";
  const fallback = process.env.ETH_RPC_URL_FALLBACK || "";

  if (fallback && fallback !== primary) {
    return new ethers.FallbackProvider([
      new ethers.JsonRpcProvider(primary),
      new ethers.JsonRpcProvider(fallback),
    ]);
  }
  return new ethers.JsonRpcProvider(primary);
}

export function getWallet(privateKey?: string): ethers.Wallet {
  const config = getConfig();
  const key = privateKey || config.testerPrivateKey;
  return new ethers.Wallet(key, getProvider());
}

export function getContractABI(): string[] {
  // Minimal ABI for testing - add full ABI from contracts/artifacts if needed
  return [
    "function subscribe() external payable",
    "function release(address account) external",
    "function subscriptionPrice() external view returns (uint256)",
    "function subscriptionDuration() external view returns (uint256)",
    "function setSubscriptionPrice(uint256 newPrice) external",
    "function setSubscriptionDuration(uint256 newDuration) external",
    "function subscriptions(address) external view returns (uint256 startTime, uint256 endTime)",
    "function subscriptionExpiry(address) external view returns (uint256)",
    "function isActive(address) external view returns (bool)",
    "event SubscriptionStarted(address indexed subscriber, uint256 indexed startTime, uint256 indexed endTime, uint256 amount)",
    "event PaymentReceived(address indexed from, uint256 amount)",
  ];
}

export function getContract(
  signerOrProvider?: ethers.Wallet | ethers.Provider
): ethers.Contract {
  const config = getConfig();
  const abi = getContractABI();
  const signer = signerOrProvider || getProvider();
  return new ethers.Contract(config.contractAddress, abi, signer);
}

export interface TestMetrics {
  t0_txSent: number;
  t1_txMined: number;
  t2_dbRow: number;
  t3_statusActive: number;
  t4_alertDetected?: number;
  ingestLatency: number;
  apiVisibility: number;
  anomalyLatency?: number;
}

export function calculateMetrics(times: Partial<TestMetrics>): TestMetrics {
  const metrics: TestMetrics = {
    t0_txSent: times.t0_txSent || 0,
    t1_txMined: times.t1_txMined || 0,
    t2_dbRow: times.t2_dbRow || 0,
    t3_statusActive: times.t3_statusActive || 0,
    t4_alertDetected: times.t4_alertDetected,
    ingestLatency: 0,
    apiVisibility: 0,
    anomalyLatency: undefined,
  };

  if (metrics.t1_txMined && metrics.t2_dbRow) {
    metrics.ingestLatency = metrics.t2_dbRow - metrics.t1_txMined;
  }
  if (metrics.t1_txMined && metrics.t3_statusActive) {
    metrics.apiVisibility = metrics.t3_statusActive - metrics.t1_txMined;
  }
  if (metrics.t1_txMined && metrics.t4_alertDetected) {
    metrics.anomalyLatency = metrics.t4_alertDetected - metrics.t1_txMined;
  }

  return metrics;
}

export function formatMetrics(metrics: TestMetrics): string {
  return `
📊 Performance Metrics:
  - Ingest Latency: ${metrics.ingestLatency}ms (t2 - t1)
  - API Visibility: ${metrics.apiVisibility}ms (t3 - t1)
  ${
    metrics.anomalyLatency !== undefined
      ? `- Anomaly Latency: ${metrics.anomalyLatency}ms (t4 - t1)`
      : ""
  }
`;
}
