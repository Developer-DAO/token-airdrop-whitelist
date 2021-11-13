import * as proofs from "../proofs.json";

export function getProof(address: keyof typeof proofs): string | undefined {
  return proofs[address];
}
