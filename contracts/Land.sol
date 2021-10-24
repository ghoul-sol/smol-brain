// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import './SmolBrain.sol';

contract Land is Ownable, ERC721Enumerable {
    using Strings for uint256;

    /// @dev 18 decimals
    uint256 public landMaxLevel;
    /// @dev 18 decimals
    uint256 public levelIQCost;

    /// @dev tokenId => land level
    mapping(uint256 => uint256) public landLevels;

    SmolBrain public smolBrain;
    address public merkleAirdrop;

    event LandMint(address indexed to, uint256 tokenId);
    event LandUpgrade(uint256 indexed tokenId, uint256 availableLevel);
    event MerkleAirdropSet(address merkleAirdrop);
    event LandMaxLevel(uint256 landMaxLevel);
    event LevelIQCost(uint256 levelIQCost);
    event SmolBrainSet(address smolBrain);

    modifier onlyMerkleAirdrop() {
        require(msg.sender == merkleAirdrop, "Land: !merkleAirdrop");
        _;
    }

    constructor() ERC721("Smol Brain Land", "SmolBrainLand") {}

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "Land: URI query for nonexistent token");

        (, uint256 availableLevel) = canUpgrade(_tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, availableLevel.toString())) : "";
    }

    /// @param _tokenId tokenId of the land
    /// @return isUpgradeAvailable true if higher level is available
    /// @return availableLevel what level can land be upgraded to
    function canUpgrade(uint256 _tokenId) public view returns (bool isUpgradeAvailable, uint256 availableLevel) {
        uint256 IQ = findBiggestBrainIQ(ownerOf(_tokenId));
        uint256 maxLevel = Math.min(IQ / levelIQCost, landMaxLevel);
        uint256 currentLevel = landLevels[_tokenId];
        if (currentLevel < maxLevel) {
            isUpgradeAvailable = true;
            availableLevel = maxLevel;
        } else {
            availableLevel = currentLevel;
        }
    }

    /// @param _owner owner of the land
    /// @return highestIQ IQ of the biggest brain
    function findBiggestBrainIQ(address _owner) public view returns (uint256 highestIQ) {
        uint256 length = smolBrain.balanceOf(_owner);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = smolBrain.tokenOfOwnerByIndex(_owner, i);
            uint256 IQ = smolBrain.scanBrain(tokenId);
            if (IQ > highestIQ) {
                highestIQ = IQ;
            }
        }
    }

    function mint(address _to, uint256 _tokenId) external onlyMerkleAirdrop {
        require(!_exists(_tokenId), "Land: tokenId exists");

        _safeMint(_to, _tokenId);

        emit LandMint(_to, _tokenId);
    }

    /// @param _tokenId tokenId of the land
    function upgrade(uint256 _tokenId) external {
        require(upgradeSafe(_tokenId), "Land: nothing to upgrade");
    }

    function upgradeSafe(uint256 _tokenId) public returns (bool) {
        (bool isUpgradeAvailable, uint256 availableLevel) = canUpgrade(_tokenId);
        if (isUpgradeAvailable) {
            landLevels[_tokenId] = availableLevel;
            emit LandUpgrade(_tokenId, availableLevel);
        }
        return isUpgradeAvailable;
    }

    function _beforeTokenTransfer(
        address,
        address _to,
        uint256 _tokenId
    ) internal override {
        require(balanceOf(_to) == 0, "Land: can own only one land");
        upgradeSafe(_tokenId);
    }

    // ADMIN

    function setSmolBrain(address _smolBrain) external onlyOwner {
        smolBrain = SmolBrain(_smolBrain);
        emit SmolBrainSet(_smolBrain);
    }

    function setMerkleAirdrop(address _merkleAirdrop) external onlyOwner {
        merkleAirdrop = _merkleAirdrop;
        emit MerkleAirdropSet(_merkleAirdrop);
    }

    function setMaxLevel(uint256 _landMaxLevel) external onlyOwner {
        landMaxLevel = _landMaxLevel;
        emit LandMaxLevel(_landMaxLevel);
    }

    function setLevelIQCost(uint256 _levelIQCost) external onlyOwner {
        levelIQCost = _levelIQCost;
        emit LevelIQCost(_levelIQCost);
    }
}
