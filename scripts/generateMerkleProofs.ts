import { readFileSync, writeFileSync } from "fs";
import { generateMerkleTree, getProof } from "../lib/proof";

// build merkle tree
const addresses: string[] = JSON.parse(
  readFileSync(`${__dirname}/../snapshot.json`, "utf-8")
);
const tree = generateMerkleTree(addresses);
const rootValue = tree.getHexRoot();
console.log("Merkle root:", rootValue);

// get a sample proof
const sampleAddr = "0xB2Ebc9b3a788aFB1E942eD65B59E9E49A1eE500D"; // sha.eth
console.log("Sample proof:", getProof(tree, sampleAddr));

// write proofs out
const addressProofMap = Object.fromEntries(
  addresses.map((addr) => [addr, getProof(tree, addr)])
);
writeFileSync("proofs.json", JSON.stringify(addressProofMap));
