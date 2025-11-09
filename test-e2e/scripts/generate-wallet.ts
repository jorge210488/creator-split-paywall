#!/usr/bin/env ts-node
/**
 * Generate a new test wallet - for E2E testing when main wallet has active subscription
 * Usage: npx ts-node scripts/generate-wallet.ts
 */
import { ethers } from "ethers";

async function main() {
  console.log("\n🔑 Generating new test wallet...\n");

  const wallet = ethers.Wallet.createRandom();

  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("\n⚠️  IMPORTANT:");
  console.log("1. Fund this address with test ETH from Sepolia faucet");
  console.log("2. Update TESTER_PRIVATE_KEY in test-e2e/.env");
  console.log("\nSepolia Faucets:");
  console.log("- https://sepoliafaucet.com/");
  console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
  console.log(
    "- https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
  );
}

if (require.main === module) {
  main();
}
