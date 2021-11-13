import { keccak256 } from "ethers/lib/utils";
import fs, { writeFileSync } from "fs";
import MerkleTree from "merkletreejs";

// convert hex string (0xabcd123) to hash hashing not the string but the actual value
const hashStringAddress = (address: string): string =>
  keccak256(Buffer.from(address.substring(2), "hex")); // decode hex string

const sampleAddr = "0xB2Ebc9b3a788aFB1E942eD65B59E9E49A1eE500D"; // sha.eth

function generateMerkleTree() {
  // build merkle tree
  const addresses: string[] = JSON.parse(
    fs.readFileSync("./snapshot.json", "utf-8")
  );
  const leaves = addresses.map((v: string) => hashStringAddress(v));

  const tree = new MerkleTree(leaves, keccak256, { sort: true });

  // console.log("Addresses: ", addresses[0]);
  // console.log("Addresses: ", addresses.indexOf(sampleAddr));

  const rootValue = tree.getHexRoot();
  console.log("Merkle root:", rootValue);

  // get a sample proof
  console.log("Sample proof:", getProof(tree, sampleAddr));

  const addressProofMap = Object.fromEntries(
    addresses.map((addr) => [
      addr,
      // all proofs appear to contain only one element so let's just use that
      // if your input data is larger maybe this won't be true
      getProof(tree, addr)[0],
    ])
  );

  writeFileSync("proofs.json", JSON.stringify(addressProofMap));
}

const getProof = (tree: MerkleTree, address: string): string[] =>
  tree
    .getHexProof(hashStringAddress(address))
    .filter((proofStr) => proofStr !== "0x");

generateMerkleTree();
