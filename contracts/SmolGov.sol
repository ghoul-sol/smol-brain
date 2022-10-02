// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

import './SmolBrain.sol';

interface ISmolFarm {
    function tokensOfOwner(address _collection, address _owner) external view returns (uint256[] memory);
}

interface IGym {
    function isAtGym(uint256 _tokenId) external view returns (bool);
}

interface ISmolRacing {
    function smolsOfOwner(address _collection, address _owner) external view returns (uint256[] memory);
}

contract SmolGov is ERC20 {
    SmolBrain public smolbrain;
    ISmolFarm public smolfarm;
    ISmolRacing public smolracing;

    constructor(
        address _smolbrain,
        address _smolfarm,
        address _smolracing
    ) ERC20("Smol Governance", "gSMOL") {
        smolbrain = SmolBrain(_smolbrain);
        smolfarm = ISmolFarm(_smolfarm);
        smolracing = ISmolRacing(_smolracing);
    }

    function totalSupply() public view override returns (uint256) {
        return smolbrain.totalSupply();
    }

    function balanceOf(address _account) public view override returns (uint256 balanceAtSchool) {
        return
            getSchoolBalance(_account) +
            getFarmBalance(_account) +
            getRacingBalance(_account);
    }

    function getSchoolBalance(address _account) public view returns (uint256 balanceAtSchool) {
        uint256 balance = smolbrain.balanceOf(_account);
        School school = smolbrain.school();
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = smolbrain.tokenOfOwnerByIndex(_account, i);
            if (school.isAtSchool(tokenId)) {
                balanceAtSchool++;
            }
        }
    }

    function getFarmBalance(address _account) public view returns (uint256 balanceAtFarm) {
        uint256[] memory tokensInFarm = smolfarm.tokensOfOwner(address(smolbrain), _account);
        return tokensInFarm.length;
    }

    function getRacingBalance(address _account) public view returns (uint256 balanceAtRacing) {
        uint256[] memory tokensInRacing = smolracing.smolsOfOwner(address(smolbrain), _account);
        return tokensInRacing.length;
    }

    function _beforeTokenTransfer(address, address, uint256) internal pure override {
        revert("Non-transferable");
    }
}
