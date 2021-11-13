import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

// convert hex string (0xabcd123) to hash, hashing not the string but the actual value
const hashStringAddress = (address: string): string =>
  keccak256(Buffer.from(address.substring(2), "hex")); // decode hex string

export function generateMerkleTree(addresses: string[]) {
  const leaves = addresses.map((v: string) => hashStringAddress(v));
  return new MerkleTree(leaves, keccak256, { sort: true });
}

export const getProof = (tree: MerkleTree, address: string): string[] =>
  tree.getHexProof(hashStringAddress(address));
