import { expect } from "chai";
import { ethers } from "hardhat";

// max coins
const CAP = 12000000;

describe("DevCoin Airdrop", function () {
  it("Should not be able to mint anay new coins", async function () {
    const DevCoin = await ethers.getContractFactory("DevCoin");
    const dc = await DevCoin.deploy();
    await dc.deployed();

    expect(await dc.totalSupply).to.equal(CAP);

    // const mintTx = await dc.
    // await mintTx.wait();

    // boom
    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
