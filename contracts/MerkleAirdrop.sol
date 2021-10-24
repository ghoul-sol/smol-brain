// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './SmolBrain.sol';
import './Land.sol';

contract MerkleAirdrop is Ownable {
    bytes32 public merkleRoot;
    uint256 public claimPerWallet;

    SmolBrain public smolBrain;
    Land public land;

    mapping(address => uint256) public claimed;

    function mintSmolBrainAndLand(bytes32[] memory proof) public {
        claimed[msg.sender]++;
        require(claimed[msg.sender] <= claimPerWallet, "MerkleAirdrop: already claimed max");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "MerkleAirdrop: proof invalid");

        smolBrain.mint(msg.sender);
        if (land.balanceOf(msg.sender) == 0) land.mint(msg.sender);
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setSmolBrain(address _smolBrain) external onlyOwner {
        smolBrain = SmolBrain(_smolBrain);
    }

    function setLand(address _land) external onlyOwner {
        land = Land(_land);
    }

    function setClaimPerWallet(uint256 _claimPerWallet) external onlyOwner {
        claimPerWallet = _claimPerWallet;
    }
}
