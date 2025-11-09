#!/usr/bin/env ts-node
/**
 * Check on-chain subscription status for an address
 */
import { ethers } from "ethers";
import { getConfig, getContract, getProvider } from "./utils";

async function main() {
  const args = process.argv.slice(2);
  const address =
    args.find((a) => a.startsWith("--address"))?.split("=")[1] ||
    "0x5EEa7805E1920Ed024dBa8fC8c65A1fda2411fEB";

  const config = getConfig();
  const provider = getProvider();
  const contract = getContract(provider);

  console.log(`\n🔍 Checking subscription for ${address}`);
  console.log(`   Contract: ${config.contractAddress}\n`);

  try {
    // Read on-chain expiry
    const subscriptionExpiry = await contract.subscriptionExpiry(address);
    const expiryTimestamp = Number(subscriptionExpiry);
    const expiryDate = new Date(expiryTimestamp * 1000);
    const now = Date.now() / 1000;
    const isActive = expiryTimestamp > now;

    console.log(`📊 On-chain Status:`);
    console.log(`   Expiry Timestamp: ${expiryTimestamp}`);
    console.log(`   Expiry Date: ${expiryDate.toISOString()}`);
    console.log(`   Current Time: ${new Date().toISOString()}`);
    console.log(`   Active: ${isActive ? "✅ YES" : "❌ NO"}`);

    if (isActive) {
      const remainingSeconds = expiryTimestamp - now;
      const days = Math.floor(remainingSeconds / 86400);
      const hours = Math.floor((remainingSeconds % 86400) / 3600);
      console.log(`   Remaining: ${days}d ${hours}h`);
    }

    return { expiryTimestamp, isActive };
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as checkSubscription };
