//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

contract DD is ERC20, ERC20Permit, Ownable {
    using BitMaps for BitMaps.BitMap;
    BitMaps.BitMap private claimed;
    // airdrop amount TBD, this number is just for testing purposes
    uint airdrop_amount = 500 * (10 ** 18);
    bytes32 public merkleRoot;
    uint256 public claimPeriodEnds;
    bool mintingEnabled = true;

    event MerkleRootChanged(bytes32 merkleRoot);
    event Claim(address indexed claimant);

    constructor(
        uint256 freeSupply,
        uint256 airdropSupply,
        uint256 _claimPeriodEnds
    ) ERC20("Developer DAO Token", "DD") ERC20Permit("Developer DAO") {
        _mint(msg.sender, freeSupply * (10 ** 18));
        _mint(address(this), airdropSupply * (10 ** 18));
        claimPeriodEnds = _claimPeriodEnds;
    }

    function claimTokens(bytes32[] calldata merkleProof) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        (bool valid, uint256 index) = MerkleProof.verify(merkleProof, merkleRoot, leaf);
        require(valid, "DD: Valid proof required.");
        require(!isClaimed(index), "DD: Tokens already claimed.");
        
        claimed.set(index);
        emit Claim(msg.sender);

        _transfer(address(this), msg.sender, airdrop_amount);
    }

    function isClaimed(uint256 index) public view returns (bool) {
        return claimed.get(index);
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        require(merkleRoot == bytes32(0), "DD: Merkle root already set");
        merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
    }

    function sweep(address dest) external onlyOwner {
        require(block.timestamp > claimPeriodEnds, "DD: Claim period not yet ended");
        _transfer(address(this), dest, balanceOf(address(this)));
    }

    function disableMinting() public onlyOwner {
        mintingEnabled = false;
    }

    function mint(uint additionalSupply) public onlyOwner {
        require(mintingEnabled == true, "No new tokens can be minted");
        _mint(msg.sender, additionalSupply * (10 ** 18));
    }
}
