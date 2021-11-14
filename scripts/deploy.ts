// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { generateMerkleTree, getProof } from "../lib/proof";

const isTestingMode = !!process.env.TESTING_CONTRACT;
const treasuryAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // where all the tokens not airdropped go

async function main() {
  const DevCoin = await ethers.getContractFactory("DevCoin");
  const dc = await DevCoin.deploy(
    // set immutable treasury address
    isTestingMode ? (await ethers.getSigners())[1].address : treasuryAddress
  );

  await dc.deployed();
  console.log("Contract deployed to:", dc.address);

  // for testing
  if (process.env.TESTING_CONTRACT) {
    console.log("Setting merkle root for testing...");
    const [owner, goodSigner] = await ethers.getSigners();
    const tree = generateMerkleTree([owner.address, goodSigner.address]);
    await dc.setMerkleRoot(tree.getHexRoot());
    console.log("Contract merkle root set to:", await dc.merkleRoot());

    console.log(
      `Proof for signer ${goodSigner.address} is ${getProof(
        tree,
        goodSigner.address
      )}`
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
