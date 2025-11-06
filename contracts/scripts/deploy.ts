import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from", deployer.address);

  const Subscription = await ethers.getContractFactory(
    "SubscriptionSplitPaywall"
  );

  // Example default args; change when deploying for real
  const payees = [deployer.address];
  const shares = [1];
  const price = ethers.parseEther("0.1");
  const duration = 30 * 24 * 3600; // 30 days

  console.log("Deploying UUPS proxy...");
  const proxy = await upgrades.deployProxy(
    Subscription,
    [payees, shares, price, duration],
    { kind: "uups" }
  );
  if (proxy.waitForDeployment) await proxy.waitForDeployment();

  const proxyAddress: string =
    (proxy as any).target ??
    (proxy as any).address ??
    (await (proxy as any).getAddress?.());
  console.log("Proxy address:", proxyAddress);

  // Attempt to verify implementation contract if ETHERSCAN_API_KEY is set
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { run } = require("hardhat");
    const impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    if (process.env.ETHERSCAN_API_KEY && impl) {
      console.log("Verifying implementation at:", impl);
      await run("verify:verify", { address: impl, constructorArguments: [] });
      console.log("Verification submitted");
    } else {
      console.log(
        "ETHERSCAN_API_KEY not set or impl address not found; skipping verification."
      );
    }
  } catch (err: unknown) {
    const msg =
      typeof err === "object" && err !== null && "message" in err
        ? (err as any).message
        : String(err);
    console.warn("Verification step failed (non-fatal):", msg);
  }

  console.log("Done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
