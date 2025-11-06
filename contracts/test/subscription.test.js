const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SubscriptionSplitPaywall", function () {
  let owner, alice, bob, payee1, payee2;
  let sub;
  const price = ethers.parseEther("0.1"); // 0.1 ETH
  const duration = 3600; // 1 hour

  beforeEach(async function () {
    [owner, alice, bob, payee1, payee2] = await ethers.getSigners();

    const Subscription = await ethers.getContractFactory(
      "SubscriptionSplitPaywall"
    );
    const payees = [payee1.address, payee2.address];
    const shares = [1, 1];

    sub = await upgrades.deployProxy(
      Subscription,
      [payees, shares, price, duration],
      { kind: "uups" }
    );
    // wait for deployment if modern Hardhat returns deployments wrapper
    if (sub.waitForDeployment) await sub.waitForDeployment();
  });

  it("reverts when insufficient payment is sent", async function () {
    await expect(
      sub.connect(alice).subscribe({ value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(sub, "InsufficientPayment");
  });

  it("allows subscribing for multiple periods and marks active", async function () {
    const twoPeriods = price * 2n;
    await expect(sub.connect(alice).subscribe({ value: twoPeriods })).to.not.be
      .reverted;

    const active = await sub.isActive(alice.address);
    expect(active).to.equal(true);
  });

  it("reverts when subscribing while already active", async function () {
    const onePeriod = price;
    await sub.connect(alice).subscribe({ value: onePeriod });
    await expect(
      sub.connect(alice).subscribe({ value: onePeriod })
    ).to.be.revertedWithCustomError(sub, "AlreadyActiveSubscription");
  });

  it("accepts tips and allows payees to see releasable amounts and release", async function () {
    // send a tip of 1 ETH from bob to the contract
    await bob.sendTransaction({
      to: sub.target ? sub.target : sub.address,
      value: ethers.parseEther("1"),
    });

    // each payee has equal shares (1/2) so releasable should be 0.5 ETH
    const r1 = await sub.releasableAmount(payee1.address);
    expect(r1).to.equal(ethers.parseEther("0.5"));

    // release for payee1
    await sub.connect(payee1).release(payee1.address);
    const released = await sub.released(payee1.address);
    expect(released).to.equal(ethers.parseEther("0.5"));
  });
});
