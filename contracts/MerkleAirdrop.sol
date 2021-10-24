// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './SmolBrain.sol';
import './Land.sol';

contract MerkleAirdrop is Ownable {
    bytes32 public merkleRoot;

    SmolBrain public smolBrain;
    Land public land;

    function mintSmolBrainAndLand(bytes32[] memory proof, uint256 _landId, uint256 _smolBrainId) public {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _landId, _smolBrainId));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "MerkleAirdrop: proof invalid");

        smolBrain.mint(msg.sender, _smolBrainId);
        land.mint(msg.sender, _landId);
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
}
