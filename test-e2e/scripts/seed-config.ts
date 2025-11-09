#!/usr/bin/env ts-node
/**
 * Seed Config Script - Update contract configuration (owner only)
 * Usage: npm run seed -- --price 0.02 --duration 86400
 */
import { ethers } from "ethers";
import { getConfig, getWallet, getContract } from "./utils";

async function main() {
  const args = process.argv.slice(2);
  const priceEth = args.find((a) => a.startsWith("--price"))?.split("=")[1];
  const durationSeconds = args
    .find((a) => a.startsWith("--duration"))
    ?.split("=")[1];

  const config = getConfig();
  const wallet = getWallet(config.ownerPrivateKey);
  const contract = getContract(wallet);

  console.log(`\n⚙️  Updating Contract Configuration`);
  console.log(`   Owner: ${wallet.address}`);
  console.log(`   Contract: ${config.contractAddress}`);

  try {
    // Read current config
    const currentPrice = await contract.subscriptionPrice();
    const currentDuration = await contract.subscriptionDuration();
    console.log(`\n📋 Current Configuration:`);
    console.log(`   Price: ${ethers.formatEther(currentPrice)} ETH`);
    console.log(
      `   Duration: ${currentDuration} seconds (${
        Number(currentDuration) / 86400
      } days)`
    );

    // Update price
    if (priceEth) {
      const newPrice = ethers.parseEther(priceEth);
      console.log(`\n💰 Setting price to ${priceEth} ETH...`);
      const tx = await contract.setSubscriptionPrice(newPrice);
      await tx.wait();
      console.log(`   ✅ Price updated (tx: ${tx.hash})`);
    }

    // Update duration
    if (durationSeconds) {
      const newDuration = BigInt(durationSeconds);
      console.log(`\n⏱️  Setting duration to ${durationSeconds}s...`);
      const tx = await contract.setSubscriptionDuration(newDuration);
      await tx.wait();
      console.log(`   ✅ Duration updated (tx: ${tx.hash})`);
    }

    // Read updated config
    const updatedPrice = await contract.subscriptionPrice();
    const updatedDuration = await contract.subscriptionDuration();
    console.log(`\n✅ Updated Configuration:`);
    console.log(`   Price: ${ethers.formatEther(updatedPrice)} ETH`);
    console.log(
      `   Duration: ${updatedDuration} seconds (${
        Number(updatedDuration) / 86400
      } days)`
    );
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    if (error.message.includes("Ownable")) {
      console.error(`   Only the contract owner can update configuration`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as seedConfig };
