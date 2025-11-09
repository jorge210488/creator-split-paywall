const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SubscriptionSplitPaywall", function () {
  let owner, alice, bob, payee1, payee2;
  let sub;
  const price = ethers.parseEther("0.001"); // 0.001 ETH (updated to match deployment)
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
      sub.connect(alice).subscribe({ value: ethers.parseEther("0.0001") })
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

  it("emits SubscriptionStarted and records expiry correctly", async function () {
    const beforeBlock = await ethers.provider.getBlock("latest");
    const tx = await sub.connect(alice).subscribe({ value: price });
    await expect(tx).to.emit(sub, "SubscriptionStarted");

    const expiry = await sub.subscriptionExpiry(alice.address);
    expect(expiry)
      .to.be.a("bigint")
      .that.is.greaterThan(BigInt(beforeBlock.timestamp));
  });

  it("emits TipReceived when sending ETH directly to contract", async function () {
    await expect(
      bob.sendTransaction({
        to: sub.target ? sub.target : sub.address,
        value: ethers.parseEther("0.2"),
      })
    )
      .to.emit(sub, "TipReceived")
      .withArgs(bob.address, ethers.parseEther("0.2"));
  });

  it("subscription expires after duration", async function () {
    // subscribe for one period
    await sub.connect(alice).subscribe({ value: price });

    // advance time beyond duration
    await ethers.provider.send("evm_increaseTime", [duration + 10]);
    await ethers.provider.send("evm_mine", []);

    expect(await sub.isActive(alice.address)).to.equal(false);
  });

  it("allows owner to update price and duration and rejects non-owner", async function () {
    const newPrice = ethers.parseEther("0.002");
    await expect(sub.connect(owner).setSubscriptionPrice(newPrice))
      .to.emit(sub, "PriceUpdated")
      .withArgs(price, newPrice);

    // non-owner cannot change price
    await expect(
      sub.connect(alice).setSubscriptionPrice(newPrice)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    const newDuration = duration * 2;
    await expect(sub.connect(owner).setSubscriptionDuration(newDuration))
      .to.emit(sub, "DurationUpdated")
      .withArgs(duration, newDuration);
  });
});
