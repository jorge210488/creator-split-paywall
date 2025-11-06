import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { network } from "hardhat";

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
  let impl: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { run } = require("hardhat");
    impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
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

  // Save deployment info to contracts/deployments/<network>.json
  try {
    const deploymentsDir = path.resolve(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

    const filePath = path.join(deploymentsDir, `${network.name}.json`);
    let existing = {} as any;
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {}
    }

    const toWrite = {
      network: network.name,
      deployer: await (await ethers.getSigners())[0].getAddress(),
      SubscriptionSplitPaywall: {
        proxy: proxyAddress,
        implementation: impl || null,
      },
      ...(existing || {}),
    };

    fs.writeFileSync(filePath, JSON.stringify(toWrite, null, 2));
    console.log(`Saved deployment to ${filePath}`);
  } catch (err) {
    console.warn("Failed to write deployment file:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
