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
uint256 constant cap = 12000000 ether; // 12mil

// how many tokens each NFT holder address can claim
uint256 constant airdropSupply = cap / 4; // amount reserved for airdrop (25%)
uint256 constant airdrops = 8000; // approx number of NFT holders
uint256 constant airdropSize = airdropSupply / airdrops; // 600 per holder
uint256 constant remainingTokens = cap - airdropSupply; // leftovers

/**
 * @dev DeveloperDAO token contract.
 * A simple, hard-capped ERC20 token.
 * Claiming your token requires holding the Devs NFT at the time of snapshot before the airdrop.
 * A merkle root of the tree of all addresses of NFT holders is supplied to verify claims.
 */
contract DevCoin is ERC20Capped, Ownable {
    /// @dev Where all the tokens not claimed in the airdrop go
    address public immutable _treasuryAddress;

    using BitMaps for BitMaps.BitMap;

    bytes32 public merkleRoot;
    BitMaps.BitMap private claimed;

    constructor(address treasuryAddress)
        ERC20("DeveloperDAO", "DEV")
        ERC20Capped(12000000 ether)
    {
        _treasuryAddress = treasuryAddress;

        // fund the contract with airdrops
        _mint(address(this), airdropSupply);

        // grant the rest to treasury
        _mint(_treasuryAddress, remainingTokens);
    }

    function getTreasuryAddress() external view returns (address) {
        return _treasuryAddress;
    }

    function getAirdropSupply() external pure returns (uint256) {
        return airdropSupply;
    }

    function getAirdropSize() external pure returns (uint256) {
        return airdropSize;
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

        // uint256 index = 1;
        // must not have claimed already
        require(!isClaimed(index), "DEV: Already claimed airdrop");

        // save that user claimed
        claimed.set(index);

        // Airdrop like Bernanke
        _transfer(address(this), msg.sender, airdropSize);
    }

    /**
     * @dev Sets the merkle root.
     * @param _merkleRoot The merkle root to set.
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
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
     */
    function sweep() external onlyOwner {
        _transfer(address(this), _treasuryAddress, balanceOf(address(this)));
    }

    /**
     * @dev Check balance of caller.
     */
    function myBalance() public view returns (uint256) {
        return balanceOf(msg.sender);
    }
}
