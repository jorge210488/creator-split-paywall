import { ethers, upgrades } from "hardhat";

async function main() {
  const SubscriptionSkeleton = await ethers.getContractFactory("SubscriptionSkeleton");
  console.log("Deploying SubscriptionSkeleton...");
  
  const subscription = await upgrades.deployProxy(SubscriptionSkeleton, [], {
    initializer: "initialize",
  });
  
  await subscription.waitForDeployment();
  console.log("SubscriptionSkeleton deployed to:", await subscription.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });