import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

const hashStringAddress = (address: string): string => keccak256(address);

export function generateMerkleTree(addresses: string[]) {
  const leaves = addresses.map((v: string) => hashStringAddress(v));
  return new MerkleTree(leaves, keccak256, { sort: true });
}

export const getProof = (tree: MerkleTree, address: string): string[] =>
  tree.getHexProof(hashStringAddress(address));
