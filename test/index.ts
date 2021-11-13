import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

// max coins
const CAP = 12000000;

describe("DevCoin Airdrop", () => {
  let dc: Contract;

  beforeEach(async () => {
    const DevCoin = await ethers.getContractFactory("DevCoin");
    dc = await DevCoin.deploy();
    await dc.deployed();
  });

  it("Total supply is equal to cap", async function () {
    expect(await dc.totalSupply()).to.equal(CAP);
  });

  it("Can claim with valid proof", async function () {
    // our merkle root
    const merkleRoot =
      "0xbc111325e060e4feb73eaca32463bb0e85682e4a77066125b53ad7ed63d66a52";
    // set root in contract
    const setRootTx = await dc.setMerkleRoot(merkleRoot);
    await setRootTx.wait();
    expect(await dc.merkleRoot()).to.equal(merkleRoot);

    // attempt to claim with a valid proof for goodAddress (sender)
    const goodProof = [
      "0x12a48f8c8d18910cd48060ea5f56773816d01481a31c382c5847f949f69f0c38",
      "0x28ef1a6cdb0f6e046fc942ad637d972893fee2f8cb85cd6349ae1e84c9e90e8c",
      "0x594f4c9ba97f299f0203741c6236a54f1ee63792a6071b79d622581e17387423",
      "0xe8ded9bb793562210541787a7f0b43a684560aa999769f9c33038392d30fb377",
      "0x26249daacb5a3fadb3fb807e1b1da82faa2165a46f0270a39e48fc7c7d457433",
      "0x478182315a19138a8e9d4908d0dcf52e6eced899ea25deb50b91a6192b3fd48e",
      "0xbee7651aaa5d50a24866bb984e939391b375a0f5e03c335b6c6d2d8ef9defd53",
      "0x100d7b28a68b2faf9e26d6f1b23feb349e681a38991f85f1e93938472d078673",
      "0x7a86e89b89489879e2516f42f6eb4c186690cdb10aee199685bc8d474fbf1cd7",
      "0x1be72be6f76a9ac937bf8f94ba01e4aa37f4153ce4fa010444a6014e61174360",
      "0x88031f9c2a8e7bbcada9dc4440e3332cb02b1192ca920a1f4c466d50eea944e0",
      "0x7871a94e3bab832ffa62a1e7e033dc3089730e09b11b5189282a17b776996a2b",
      "0x2b639d2df74693c673da86217d955617b59f0f59d12e34e856cbd819691fbcd0",
    ];
    const goodAddress = "0xB2Ebc9b3a788aFB1E942eD65B59E9E49A1eE500D";

    console.log(await ethers.getSigners());

    const [_, addr1] = await ethers.getSigners();

    const claimTx = await dc.claim(goodProof, { from: goodAddress });
    await claimTx.wait();

    // boom
  });
});
