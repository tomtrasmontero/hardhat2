const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers: { utils }, ethers } = require("hardhat");

describe("Faucet", function () {
  let faucet, signerAddress, signer;

  beforeEach("deploy the contract instance first",async () => {
    const Faucet = await ethers.getContractFactory("Faucet");
    // deploy contract with 10 eth overriding the default tx data to contain msg.value("value" in JS)
    faucet = await Faucet.deploy({
      value: utils.parseUnits("10", "ether"),
    });
    await faucet.deployed();

    // get default signer, in Signer abstraction form in hardhat
    signer = ethers.provider.getSigner(0);

    // get default signer first address.  the default address use for contract deployment
    [signerAddress] = await ethers.provider.listAccounts();
  });

  it("should set the owner to be the deployer of the contract", async () => {
    assert.equal(await faucet.owner(), signerAddress)
  });

  describe("withdraw function", () => {
    it("should revert withdraw for incorrect amount", async () => {
      let withdrawAmount = ethers.utils.parseUnits("1", "ether");
      await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
    })

    it("should be able to withdraw correct amount", async () => {
      let withdrawAmount = ethers.utils.parseUnits(".1", "ether");
      await expect(faucet.withdraw(withdrawAmount)).not.to.be.reverted;
    })
  });

  describe("withdrawAll function", () => {
    it("will revert if non owner address calls it", async () => {
      const newSigner = ethers.provider.getSigner(1);
      // contract needs to connect to another address to make the call
      await expect(faucet.connect(newSigner).withdrawAll()).to.be.reverted;
    });

    it("will revert if non owner address calls it", async () => {
      await expect(faucet.withdrawAll()).not.to.be.reverted;
    });

    it("will be able to make the call from original address", async () => {
      const tenEth = utils.parseUnits("10", "ether");
      const negTenEth = BigNumber.from(`-${tenEth}`);
      // check the change of balance after the transaction, withdraw all balance from contract to owner address
      await expect(await faucet.withdrawAll()).to.changeEtherBalances([faucet, signer], [negTenEth,tenEth]);
    });
  });

  describe("destroyFaucet function", () => {
    it("should only be called by owner of address", async () => {
      await expect(faucet.destroyFaucet()).not.to.be.reverted;
    });

    it("should not be called by non owner of address", async () => {
      const newSigner = ethers.provider.getSigner(1);
      await expect(faucet.connect(newSigner).destroyFaucet()).to.be.reverted;
    });

    it("should delete the code when owner calls the the fx", async () => {
      const nullContract = "0x";
      expect(await ethers.provider.getCode(faucet.address)).not.to.equal(nullContract);

      await faucet.destroyFaucet();

      expect(await ethers.provider.getCode(faucet.address)).to.equal(nullContract);
    });
  });

  describe("fallback function", () => {
    it("should invoke fallback function when contract contains no matching calldata", async () => {
      // send an empty transaction to the faucet, no values
      let response = await signer.sendTransaction({
        to: faucet.address,
        data: "0xf028c523285f6d5172b4f6fd31f72f52dc757bc26a0c46239dec58b836ee67f6"
      });

      let receipt = await response.wait();

      // query the logs for the FallbackCalled event
      const topic = await faucet.interface.getEventTopic("FallbackCalled");
      // find the indexed logs, topic[0] refers to the hash of the event itself
      // console.log(receipt, topic);
      const log = receipt.logs.find(x => x.topics.indexOf(topic) >= 0);
      const deployedEvent = faucet.interface.parseLog(log);

      assert(deployedEvent, "Expected the Fallback Called event to be emitted!");
    });
  });
});
