import hre from 'hardhat';
import {expect} from 'chai';
import {getBlockTime, mineBlock, getCurrentTime} from './utils';

const {ethers, deployments, getNamedAccounts} = hre;
const { deploy } = deployments;

describe('Land', function () {
  let land: any, school: any, smolBrain: any, merkleAirdrop: any;
  let player1: any, player2: any, player3: any, hacker: any, deployer: any;
  let player1Signer: any, player2Signer: any, player3Signer: any, hackerSigner: any, deployerSigner: any;

  before(async function () {
    const namedAccounts = await getNamedAccounts();
    player1 = namedAccounts.player1;
    player2 = namedAccounts.player2;
    player3 = namedAccounts.player3;
    hacker = namedAccounts.hacker;
    deployer = namedAccounts.deployer;

    player1Signer = await ethers.provider.getSigner(player1);
    player2Signer = await ethers.provider.getSigner(player2);
    player3Signer = await ethers.provider.getSigner(player3);
    hackerSigner = await ethers.provider.getSigner(hacker);
    deployerSigner = await ethers.provider.getSigner(deployer);
  });

  beforeEach(async function () {
    await deployments.fixture();

    const SmolBrain = await deployments.get('SmolBrain');
    smolBrain = new ethers.Contract(
      SmolBrain.address,
      SmolBrain.abi,
      await ethers.provider.getSigner(deployer)
    );

    const School = await deployments.get('School');
    school = new ethers.Contract(
      School.address,
      School.abi,
      await ethers.provider.getSigner(deployer)
    );

    const Land = await deployments.get('Land');
    land = new ethers.Contract(
      Land.address,
      Land.abi,
      await ethers.provider.getSigner(deployer)
    );

    const MerkleAirdrop = await deployments.get('MerkleAirdrop');
    merkleAirdrop = new ethers.Contract(
      MerkleAirdrop.address,
      MerkleAirdrop.abi,
      await ethers.provider.getSigner(deployer)
    );
  });

  it('mint', async function () {
    await land.setMerkleAirdrop(deployer);
    expect(await land.balanceOf(player1)).to.be.equal(0);
    await expect(land.ownerOf(0)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    await land.mint(player1);
    expect(await land.balanceOf(player1)).to.be.equal(1);
    expect(await land.ownerOf(0)).to.be.equal(player1);
    expect(await land.totalSupply()).to.be.equal(1);
  });

  describe('config', function () {
    it('setSmolBrain', async function () {
      expect(await land.smolBrain()).to.be.equal(smolBrain.address);
      await land.setSmolBrain(deployer)
      expect(await land.smolBrain()).to.be.equal(deployer);
    });

    it('setMerkleAirdrop', async function () {
      expect(await land.merkleAirdrop()).to.be.equal(merkleAirdrop.address);
      await land.setMerkleAirdrop(deployer)
      expect(await land.merkleAirdrop()).to.be.equal(deployer);
    });

    it('setMaxLevel', async function () {
      const landMaxLevel = 18
      await land.setMaxLevel(landMaxLevel)
      expect(await land.landMaxLevel()).to.be.equal(landMaxLevel);
    });

    it('setLevelIQCost', async function () {
      const levelIQCost = ethers.utils.parseUnits('50', 'ether')
      await land.setLevelIQCost(levelIQCost)
      expect(await land.levelIQCost()).to.be.equal(levelIQCost);
    });
  })

  describe('mint smolbrain', function () {
    let timestamp1: any;
    let timestamp2: any;

    beforeEach(async function () {
      await smolBrain.setMerkleAirdrop(deployer);
      await smolBrain.mint(player1);
      await smolBrain.mint(player1);
      await smolBrain.mint(player1);
      await land.setMerkleAirdrop(deployer);
      await land.mint(player1);

      let tx = await school.connect(player1Signer).join(0);
      await tx.wait();
      timestamp1 = await getBlockTime(tx.blockNumber);

      tx = await school.connect(player1Signer).join(1);
      await tx.wait();
      timestamp2 = await getBlockTime(tx.blockNumber);
    });

    it('findBiggestBrainIQ', async function () {
      expect(await land.findBiggestBrainIQ(player1)).to.be.equal("82671957671957");
      await mineBlock(timestamp1 + 60*60*24*7);
      expect(await land.findBiggestBrainIQ(player1)).to.be.equal("50000000000000000000");
    });

    it('canUpgrade', async function () {
      let canUpgrade = await land.canUpgrade(0);
      expect(canUpgrade.isUpgradeAvailable).to.be.false;
      expect(canUpgrade.availableLevel).to.be.equal(0);

      await mineBlock(timestamp1 + 60*60*24*7);

      canUpgrade = await land.canUpgrade(0);
      expect(await smolBrain.averageIQ()).to.be.equal("33333305776014109347");
      expect(canUpgrade.isUpgradeAvailable).to.be.true;
      expect(canUpgrade.availableLevel).to.be.equal(3);
    });

    it('upgradeSafe', async function () {
      expect(await land.landLevels(0)).to.be.equal(0);
      await land.upgradeSafe(0);
      expect(await land.landLevels(0)).to.be.equal(0);

      await mineBlock(timestamp1 + 60*60*24*7);

      expect(await land.landLevels(0)).to.be.equal(0);
      let canUpgrade = await land.canUpgrade(0);
      await land.upgradeSafe(0);
      expect(await land.landLevels(0)).to.be.equal(canUpgrade.availableLevel);
    });

    it('upgrade', async function () {
      expect(await land.landLevels(0)).to.be.equal(0);
      let canUpgrade = await land.canUpgrade(0);
      expect(canUpgrade.isUpgradeAvailable).to.be.false;
      await expect(land.upgrade(0)).to.be.revertedWith("Land: nothing to upgrade");
      expect(await land.landLevels(0)).to.be.equal(0);

      await mineBlock(timestamp1 + 60*60*24*7);

      expect(await land.landLevels(0)).to.be.equal(0);
      canUpgrade = await land.canUpgrade(0);
      expect(canUpgrade.isUpgradeAvailable).to.be.true;
      await land.upgrade(0);
      expect(await land.landLevels(0)).to.be.equal(canUpgrade.availableLevel);
    });

    it('tokenURI', async function () {
      expect(await smolBrain.averageIQ()).to.be.equal("27557319223985");
      expect(await land.tokenURI(0)).to.be.equal(`ipfs//Land/0`);

      await mineBlock(timestamp1 + 60*60*24*7);

      expect(await smolBrain.averageIQ()).to.be.equal("33333305776014109347");
      expect(await land.tokenURI(0)).to.be.equal(`ipfs//Land/3`);

      await mineBlock(timestamp1 + 60*60*24*7*1.5);

      expect(await smolBrain.averageIQ()).to.be.equal("49999972442680776013");
      expect(await land.tokenURI(0)).to.be.equal(`ipfs//Land/4`);

      await mineBlock(timestamp1 + 60*60*24*7*2);

      expect(await smolBrain.averageIQ()).to.be.equal("66666639109347442680");
      expect(await land.tokenURI(0)).to.be.equal(`ipfs//Land/6`);

      await mineBlock(timestamp1 + 60*60*24*7*4);
      expect(await smolBrain.averageIQ()).to.be.equal("133333305776014109347");
      const landMaxLevel = await land.landMaxLevel();
      expect(await land.tokenURI(0)).to.be.equal(`ipfs//Land/${landMaxLevel}`);
    });
  })
});