/// <reference types="hardhat" />
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SubscriptionSkeleton } from "../typechain-types";

describe.skip("SubscriptionSkeleton", function () {
  let subscription: SubscriptionSkeleton;

  beforeEach(async function () {
    const SubscriptionSkeleton = await ethers.getContractFactory(
      "SubscriptionSkeleton"
    );
    subscription = (await upgrades.deployProxy(SubscriptionSkeleton, [], {
      initializer: "initialize",
    })) as unknown as SubscriptionSkeleton;
    await subscription.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right admin role", async function () {
      const [owner] = await ethers.getSigners();
      const adminRole = await subscription.DEFAULT_ADMIN_ROLE();
      expect(await subscription.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should allow admin to pause and unpause", async function () {
      await subscription.pause();
      expect(await subscription.paused()).to.be.true;

      await subscription.unpause();
      expect(await subscription.paused()).to.be.false;
    });
  });
});
