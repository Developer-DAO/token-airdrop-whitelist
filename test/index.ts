import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import MerkleTree from "merkletreejs";
import { generateMerkleTree, getProof } from "../lib/proof";

// max coins
const CAP = 12000000;

describe("DevCoin Airdrop", () => {
  let dc: Contract;
  let tree: MerkleTree;
  let goodAddresses: string[];
  let badAddresses: string[];
  let goodSigners: SignerWithAddress[];
  let badSigners: SignerWithAddress[];

  beforeEach(async () => {
    const DevCoin = await ethers.getContractFactory("DevCoin");
    dc = await DevCoin.deploy();
    await dc.deployed();

    const signers = await ethers.getSigners();
    goodSigners = signers.slice(0, 5);
    goodAddresses = goodSigners.map((s) => s.address);
    badSigners = signers.slice(5);
    badAddresses = badSigners.map((s) => s.address);

    tree = generateMerkleTree(goodAddresses);
  });

  it("Total supply is equal to cap", async function () {
    expect(await dc.totalSupply()).to.equal(CAP);
  });

  it("Can claim with valid proof", async function () {
    // our merkle root
    const merkleRoot = tree.getHexRoot();
    // set root in contract
    const setRootTx = await dc.setMerkleRoot(merkleRoot);
    await setRootTx.wait();
    expect(await dc.merkleRoot()).to.equal(merkleRoot);

    // attempt to claim with a valid proof for goodAddress (sender)
    const goodSigner = goodSigners[1]; // 0 is owner
    const goodAddress = goodSigner.address;
    const goodProof = getProof(tree, goodAddress);
    console.log({ goodProof });

    // claim from good address
    const claimTx = await dc.connect(goodSigner).claim(goodProof);
    await claimTx.wait();

    // boom
  });
});
