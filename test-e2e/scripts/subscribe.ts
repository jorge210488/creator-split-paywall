#!/usr/bin/env ts-node
/**
 * Subscribe Script - Send subscription payment to contract
 * Usage: npm run subscribe -- --amount 0.01 --periods 1
 */
import { ethers } from "ethers";
import { getConfig, getWallet, getContract } from "./utils";

async function main() {
  const args = process.argv.slice(2);
  const amountEth =
    args.find((a) => a.startsWith("--amount"))?.split("=")[1] || "0.01";
  const periods = parseInt(
    args.find((a) => a.startsWith("--periods"))?.split("=")[1] || "1"
  );

  const config = getConfig();
  const wallet = getWallet();
  const contract = getContract(wallet);

  console.log(`\n🎫 Subscribing to Creator Split Paywall`);
  console.log(`   Wallet: ${wallet.address}`);
  console.log(`   Contract: ${config.contractAddress}`);
  console.log(
    `   Amount: ${amountEth} ETH (${periods} period${periods > 1 ? "s" : ""})`
  );

  const value = ethers.parseEther(amountEth);

  try {
    if (!wallet.provider) {
      throw new Error("Wallet provider is not connected");
    }

    const balanceBefore = await wallet.provider.getBalance(wallet.address);
    console.log(`   Balance before: ${ethers.formatEther(balanceBefore)} ETH`);

    const tx = await contract.subscribe({ value });
    console.log(`\n📤 Transaction sent: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);
    console.log(`   Gas used: ${receipt?.gasUsed.toString()}`);

    const balanceAfter = await wallet.provider.getBalance(wallet.address);
    console.log(`   Balance after: ${ethers.formatEther(balanceAfter)} ETH`);

    // Check subscription status
    const expiry = await contract.subscriptionExpiry(wallet.address);
    const active = await contract.isActive(wallet.address);
    console.log(`\n🔍 Subscription Status:`);
    console.log(`   Active: ${active}`);
    console.log(
      `   Expiry: ${new Date(Number(expiry) * 1000).toISOString()}`
    );

    return { txHash: tx.hash, receipt, expiry, active };
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as subscribe };
