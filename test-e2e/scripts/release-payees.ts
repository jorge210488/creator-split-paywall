#!/usr/bin/env ts-node
/**
 * Release Payees Script - Trigger release() for collaborators
 * Usage: npm run release
 */
import { ethers } from "ethers";
import { getConfig, getWallet, getContract } from "./utils";

async function main() {
  const config = getConfig();
  const wallet = getWallet(config.ownerPrivateKey); // Must be owner or authorized
  const contract = getContract(wallet);

  const payees = [config.payee1, config.payee2].filter(Boolean);

  if (payees.length === 0) {
    console.error("❌ No payees configured in .env (PAYEE_1, PAYEE_2)");
    process.exit(1);
  }

  console.log(`\n💰 Releasing funds to ${payees.length} payee(s)...`);

  for (const payee of payees) {
    try {
      if (!wallet.provider) {
        throw new Error("Wallet provider is not connected");
      }

      console.log(`\n   Processing: ${payee}`);
      const balanceBefore = await wallet.provider.getBalance(payee);
      console.log(
        `   Balance before: ${ethers.formatEther(balanceBefore)} ETH`
      );

      const tx = await contract.release(payee);
      console.log(`   TX: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`   ✅ Confirmed in block ${receipt?.blockNumber}`);

      const balanceAfter = await wallet.provider.getBalance(payee);
      const released = balanceAfter - balanceBefore;
      console.log(`   Balance after: ${ethers.formatEther(balanceAfter)} ETH`);
      console.log(`   Released: ${ethers.formatEther(released)} ETH`);
    } catch (error: any) {
      console.error(`   ❌ Failed for ${payee}:`, error.message);
    }
  }

  console.log(`\n✅ Release process completed`);
}

if (require.main === module) {
  main();
}

export { main as releasePayees };
