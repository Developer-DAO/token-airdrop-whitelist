import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import MerkleTree from "merkletreejs";
import { generateMerkleTree, getProof } from "../lib/proof";

const contractName = "DevCoin";

describe(`${contractName} Airdrop`, () => {
  let dc: Contract;
  let tree: MerkleTree;
  let goodAddresses: string[];
  let goodSigners: SignerWithAddress[];
  let badSigners: SignerWithAddress[];
  let treasury: SignerWithAddress;
  let owner: SignerWithAddress;
  let airdropSupply: bigint;
  let airdropSize: bigint;
  let CAP: bigint;

  beforeEach(async () => {
    // get some identities for testing
    const signers = await ethers.getSigners();
    owner = signers.shift()!;
    treasury = signers.shift()!;
    goodSigners = signers.slice(0, 5);
    goodAddresses = goodSigners.map((s) => s.address);
    badSigners = signers.slice(5);

    const DevCoin = await ethers.getContractFactory(contractName);
    dc = await DevCoin.deploy(await treasury.getAddress());
    await dc.deployed();

    CAP = BigInt(await dc.cap());
    treasury = await dc.getTreasuryAddress();
    airdropSupply = BigInt(await dc.getAirdropSupply());
    airdropSize = BigInt(await dc.getAirdropSize());

    // construct merkle tree
    tree = generateMerkleTree(goodAddresses);
    // our merkle root
    const merkleRoot = tree.getHexRoot();

    // set root in contract
    const setRootTx = await dc.setMerkleRoot(merkleRoot);
    await setRootTx.wait();
    expect(await dc.merkleRoot()).to.equal(merkleRoot);
  });

  it("Contains remaining tokens in the treasury", async function () {
    // amount reserved for treasury in the beginning
    expect(await dc.balanceOf(treasury)).to.equal(CAP - airdropSupply);
  });

  it("Has total supply equal to cap", async function () {
    expect(await dc.totalSupply()).to.equal(CAP);
  });

  it("Allows claiming with valid proofs", async function () {
    // attempt to claim with a valid proof for goodAddress (sender)
    const goodSigner = goodSigners[1]; // 0 is owner
    const goodAddress = goodSigner.address;
    const goodProof = getProof(tree, goodAddress);

    // claim from good address
    const claimTx = await dc.connect(goodSigner).claim(goodProof);
    await claimTx.wait();

    // tokens should be transferred
    const goodBalance = await dc.connect(goodSigner).myBalance();
    expect(goodBalance).to.equal(airdropSize);

    // contract should be funded for airdrops
    expect(await dc.balanceOf(dc.address)).to.equal(
      airdropSupply - airdropSize
    );

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

    expect(await dc.totalSupply()).to.equal(CAP);
  });

  it("sweeps unclaimed amount", async function () {
    const goodSigner = goodSigners[2];
    const goodAddress = goodSigner.address;
    const goodProof = getProof(tree, goodAddress);

    // claim from good address
    const claimTx = await dc.connect(goodSigner).claim(goodProof);
    await claimTx.wait();

    // now collect unclaimed tokens and add them to treasury
    await dc.sweep();

    // should be transferred from contract to treasury
    expect(await dc.balanceOf(treasury)).to.equal(CAP - airdropSize);
    expect(await dc.balanceOf(dc.address)).to.equal(0);
  });
});
