import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import MerkleTree from "merkletreejs";
import { generateMerkleTree, getProof } from "../lib/proof";

const contractName = "DevCoin";

// max coins
const CAP = 12000000;

describe(`${contractName} Airdrop`, () => {
  let dc: Contract;
  let tree: MerkleTree;
  let goodAddresses: string[];
  let goodSigners: SignerWithAddress[];
  let badSigners: SignerWithAddress[];

  beforeEach(async () => {
    const DevCoin = await ethers.getContractFactory(contractName);
    dc = await DevCoin.deploy();
    await dc.deployed();

    // get some identities for testing
    const signers = await ethers.getSigners();
    goodSigners = signers.slice(0, 5);
    goodAddresses = goodSigners.map((s) => s.address);
    badSigners = signers.slice(5);

    // construct merkle tree
    tree = generateMerkleTree(goodAddresses);
    // our merkle root
    const merkleRoot = tree.getHexRoot();

    // set root in contract
    const setRootTx = await dc.setMerkleRoot(merkleRoot);
    await setRootTx.wait();
    expect(await dc.merkleRoot()).to.equal(merkleRoot);
  });

  it("Total supply is equal to cap", async function () {
    expect(await dc.totalSupply()).to.equal(CAP);
  });

  it("allows claiming with valid proofs", async function () {
    // attempt to claim with a valid proof for goodAddress (sender)
    const goodSigner = goodSigners[1]; // 0 is owner
    const goodAddress = goodSigner.address;
    const goodProof = getProof(tree, goodAddress);

    // claim from good address
    const claimTx = await dc.connect(goodSigner).claim(goodProof);
    await claimTx.wait();

    // claim again from same sender, should blow up
    // can't claim twice
    expect(dc.connect(goodSigner).claim(goodProof)).to.be.revertedWith(
      "DEV: Already claimed airdrop"
    );

    // rando cannot claim even with a good proof
    const badSigner = badSigners[0];
    expect(dc.connect(badSigner).claim(goodProof)).to.be.revertedWith(
      "DEV: Not holder of prestigious NFT"
    );
  });
});
