# DevCoin

## What is this?

This is a project to power an airdrop of tokens according to some predefined criteria. There is an ERC20 smart contract with a capped number of tokens.

When the contract is deployed, some portion of the tokens reserved for the airdrop are made available to a whitelisted set of addresses, and the remaining tokens go to a treasury wallet. After some time any tokens unclaimed in the airdrop can be swept up into the treasury.

The use case is for the Developer DAO, allowing holders of the first (free) Developer DAO NFTs to claim a number of tokens for themselves.

## Technical details

The challenge that this project solves is defining a whitelist of approved addresses which may claim tokens in the airdrop. It is inefficient to deploy or maintain a large list of whitelisted addresses in a contract, so instead a merkle tree is used. The contract is supplied with the merkle root of a tree whose leaves consist of addresses of whitelisted recipients. For a whitelisted recipient to claim their token they must present a merkle proof that corresponds to their address (can be done via web UI).

When a whitelisted holder presents their merkle proof to the `claim()` function, if their address matches the proof and belongs in the merkle tree, they are approved to claim their airdrop tokens, once.

## Quickstart:

- `npm run snapshot:nft` -- gets a list of addresses who hold a given NFT.
- `npm run generate:proofs` -- generates a mapping of address => proof.
- `npm run build` -- compiles contract.
- `npm test` -- tests contract. Highly recommended to read <test/index.ts> to understand how the contract works.

An included sample web3 script to get a proof for your wallet address is in <web/>.

## Diagram

![Diagram](doc/diagram.svg)

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
