// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

// basics
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "./MerkleProof.sol";

// hard limit on the number of tokens that can ever exist
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

// hard limit number of tokens that can ever exist
uint256 constant cap = 12000000; // 12mil

// how many tokens each NFT holder address can claim
uint256 constant airdropSupply = cap / 4; // amount reserved for airdrop (25%)
uint256 constant airdrops = 6000; // approx number of NFT holders
uint256 constant airdropSize = airdropSupply / airdrops; // 600 per holder
uint256 constant remainingTokens = cap - airdropSupply; // leftovers

/**
 * @dev DeveloperDAO token contract.
 * A simple, hard-capped ERC20 token.
 * Claiming your token requires holding the Devs NFT at the time of snapshot before the airdrop.
 * A merkle root of the tree of all addresses of NFT holders is supplied to verify claims.
 */
contract DevCoin is ERC20Capped, Ownable {
    using BitMaps for BitMaps.BitMap;

    bytes32 public merkleRoot;
    BitMaps.BitMap private claimed;

    /// Emitted when someone claims their airdrop tokens.
    event Claim(address indexed claimant, uint256 amount);
    event MerkleRootChanged(bytes32 merkleRoot);

    constructor() ERC20("DeveloperDAO", "DEV") ERC20Capped(12000000) {
        // load up whitelist
        // initializeNFTHolderSnapshot();

        // fund airdrops
        _mint(address(this), airdropSupply);

        // grant the rest to the creator - can send this to treasury
        _mint(msg.sender, remainingTokens);
    }

    /**
     * @dev Claim a token if in whitelisted airdrop list (DEVS NFT holders)
     * @param merkleProof A merkle proof proving the claim is valid
     */
    function claim(bytes32[] calldata merkleProof) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        (bool valid, uint256 index) = MerkleProof.verify(
            merkleProof,
            merkleRoot,
            leaf
        );
        require(valid, "DEV: Not holder of prestigious NFT");

        // must not have claimed already
        require(!isClaimed(index), "DEV: Already claimed airdrop");

        // save that user claimed
        claimed.set(index);

        // Airdrop like Bernanke
        emit Claim(msg.sender, airdropSize);
        _transfer(address(this), msg.sender, airdropSize);
    }

    /**
     * @dev Sets the merkle root.
     * @param _merkleRoot The merkle root to set.
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
    }

    /**
     * @dev Returns true if the claim at the given index in the merkle tree has already been made.
     * @param index The index into the merkle tree.
     */
    function isClaimed(uint256 index) public view returns (bool) {
        return claimed.get(index);
    }

    /**
     * @dev Collect unclaimed tokens after airdrop.
     * @param dest The wallet to collect the unclaimed tokens into.
     */
    function sweep(address dest) external onlyOwner {
        _transfer(address(this), dest, balanceOf(address(this)));
    }

    /**
     * @dev Check balance of caller.
     */
    function myBalance() public view returns (uint256) {
        return balanceOf(msg.sender);
    }
}
