import { ethers, run } from "hardhat";
import fs from "fs";
import path from "path";
import { network } from "hardhat";

/**
 * Verify script - reads implementation address from deployments/{network}.json
 * and verifies it on Etherscan
 *
 * Usage:
 *   npx hardhat run scripts/verify.ts --network sepolia
 */

async function main() {
  console.log(`Verifying contracts on ${network.name}...\n`);

  // Read deployment file
  const deploymentsDir = path.resolve(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log(`Please run deploy script first on ${network.name}`);
    process.exit(1);
  }

  let deployment: any;
  try {
    deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  } catch (err) {
    console.error(`❌ Failed to parse deployment file:`, err);
    process.exit(1);
  }

  // Extract addresses
  const proxyAddress = deployment.SubscriptionSplitPaywall?.proxy;
  let implementationAddress =
    deployment.SubscriptionSplitPaywall?.implementation;

  if (!proxyAddress) {
    console.error(`❌ Proxy address not found in deployment file`);
    process.exit(1);
  }

  console.log(`📄 Proxy address: ${proxyAddress}`);

  // If implementation address not in file, fetch from ERC1967 storage
  if (!implementationAddress) {
    console.log(
      `⚠️  Implementation address not in deployment file, fetching from proxy...`
    );
    try {
      const { upgrades } = require("hardhat");
      implementationAddress = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
      );
      console.log(`✓ Found implementation: ${implementationAddress}`);

      // Update deployment file with implementation
      deployment.SubscriptionSplitPaywall.implementation =
        implementationAddress;
      fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
      console.log(`✓ Updated deployment file with implementation address\n`);
    } catch (err) {
      console.error(`❌ Failed to get implementation address:`, err);
      process.exit(1);
    }
  } else {
    console.log(`📄 Implementation address: ${implementationAddress}\n`);
  }

  // Check if ETHERSCAN_API_KEY is set
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error(`❌ ETHERSCAN_API_KEY not set in environment`);
    console.log(`Please set it in your .env file or export it`);
    process.exit(1);
  }

  // Verify implementation contract
  console.log(`🔍 Verifying implementation contract on Etherscan...`);
  console.log(`Address: ${implementationAddress}\n`);

  try {
    // Implementation contracts for UUPS proxies have no constructor arguments
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
    console.log(`\n✅ Implementation contract verified successfully!`);
  } catch (err: any) {
    if (err.message?.includes("Already Verified")) {
      console.log(`\n✓ Contract already verified on Etherscan`);
    } else {
      console.error(`\n❌ Verification failed:`, err.message || err);
      process.exit(1);
    }
  }

  // Verify proxy contract (optional - Etherscan usually auto-detects proxies)
  console.log(`\n🔍 Checking if proxy needs verification...`);
  try {
    await run("verify:verify", {
      address: proxyAddress,
      constructorArguments: [],
    });
    console.log(`✅ Proxy contract verified successfully!`);
  } catch (err: any) {
    if (err.message?.includes("Already Verified")) {
      console.log(`✓ Proxy already verified on Etherscan`);
    } else {
      console.warn(
        `⚠️  Proxy verification failed (this is usually fine):`,
        err.message || err
      );
      console.log(
        `Note: Etherscan often auto-detects and verifies proxy contracts`
      );
    }
  }

  console.log(`\n✅ Verification complete!`);
  console.log(`\nView on Etherscan:`);
  const etherscanBase =
    network.name === "mainnet"
      ? "https://etherscan.io"
      : `https://${network.name}.etherscan.io`;
  console.log(`Proxy: ${etherscanBase}/address/${proxyAddress}#code`);
  console.log(
    `Implementation: ${etherscanBase}/address/${implementationAddress}#code`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
