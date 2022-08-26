const { expect, assert } = require("chai");
const { ethers: { utils }, ethers } = require("hardhat");

describe("Faucet", function () {
  let faucet, signerAddress, signer;

  before("deploy the contract instance first",async () => {
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
    it("should withdraw the correct amount", async () => {
      let withdrawAmount = ethers.utils.parseUnits("1", "ether");
      await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
    })
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
