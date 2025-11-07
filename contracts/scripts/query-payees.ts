import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { network } from "hardhat";

/**
 * Query payees from deployed contract
 */

async function main() {
  console.log(`Querying contract on ${network.name}...\n`);

  // Read deployment file
  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const proxyAddress = deployment.SubscriptionSplitPaywall?.proxy;

  if (!proxyAddress) {
    console.error(`❌ Proxy address not found in deployment file`);
    process.exit(1);
  }

  console.log(`📄 Proxy address: ${proxyAddress}\n`);

  // Connect to contract
  const contract = await ethers.getContractAt(
    "SubscriptionSplitPaywall",
    proxyAddress
  );

  // Query payees using OpenZeppelin PaymentSplitter public getters
  try {
    // PaymentSplitter exposes payee(uint256 index) and shares(address account)
    console.log("📋 Payment Split Configuration:\n");

    let index = 0;
    const payees: string[] = [];

    // Try to get all payees by iterating until we get an error
    while (true) {
      try {
        const payee = await contract.payee(index);
        const shares = await contract.shares(payee);
        const released = await contract.released(payee);

        payees.push(payee);
        console.log(`Payee ${index}:`);
        console.log(`  Address: ${payee}`);
        console.log(`  Shares: ${shares.toString()}`);
        console.log(`  Released: ${ethers.formatEther(released)} ETH\n`);

        index++;
      } catch (err) {
        // No more payees
        break;
      }
    }

    if (payees.length === 0) {
      console.log("⚠️  No payees found");
    } else {
      console.log(`Total payees: ${payees.length}`);

      // Get total shares
      const totalShares = await contract.totalShares();
      console.log(`Total shares: ${totalShares.toString()}\n`);

      // Get contract balance
      const balance = await ethers.provider.getBalance(proxyAddress);
      console.log(`Contract balance: ${ethers.formatEther(balance)} ETH`);

      // Get total released
      const totalReleased = await contract.totalReleased();
      console.log(`Total released: ${ethers.formatEther(totalReleased)} ETH`);
    }
  } catch (err: any) {
    console.error(`❌ Error querying contract:`, err.message || err);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
