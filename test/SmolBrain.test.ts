import hre from 'hardhat';
import {expect} from 'chai';
import {getBlockTime, mineBlock, getCurrentTime} from './utils';

const {ethers, deployments, getNamedAccounts} = hre;
const { deploy } = deployments;

describe('SmolBrain', function () {
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
    await smolBrain.grantMinter(deployer);
    expect(await smolBrain.balanceOf(player1)).to.be.equal(0);
    await expect(smolBrain.ownerOf(0)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    await smolBrain.mint(player1);
    expect(await smolBrain.balanceOf(player1)).to.be.equal(1);
    expect(await smolBrain.ownerOf(0)).to.be.equal(player1);
    expect(await smolBrain.totalSupply()).to.be.equal(1);
  });

  describe('config', function () {
    it('setSchool', async function () {
      expect(await smolBrain.school()).to.be.equal(school.address);
      await smolBrain.setSchool(deployer)
      expect(await smolBrain.school()).to.be.equal(deployer);
    });

    it('setLand', async function () {
      expect(await smolBrain.land()).to.be.equal(land.address);
      await smolBrain.setLand(deployer)
      expect(await smolBrain.land()).to.be.equal(deployer);
    });

    it('grantMinter', async function () {
      expect(await smolBrain.isMinter(merkleAirdrop.address)).to.be.true;
      expect(await smolBrain.isMinter(deployer)).to.be.false;
      await smolBrain.grantMinter(deployer)
      expect(await smolBrain.isMinter(deployer)).to.be.true;
    });

    it('setLevelIQCost', async function () {
      const levelIQCost = ethers.utils.parseUnits('10', 'ether')
      await smolBrain.setLevelIQCost(levelIQCost)
      expect(await smolBrain.levelIQCost()).to.be.equal(levelIQCost);
    });

    it('setMaxLevel', async function () {
      const brainMaxLevel = 18
      await smolBrain.setMaxLevel(brainMaxLevel)
      expect(await smolBrain.brainMaxLevel()).to.be.equal(brainMaxLevel);
    });

    it('setBaseURI', async function () {
      const base = "base/"
      await smolBrain.setBaseURI(base)
      expect(await smolBrain.baseURI()).to.be.equal(base);
    });
  })

  describe('send to school', function () {
    let timestamp1: any;
    let timestamp2: any;

    beforeEach(async function () {
      await smolBrain.grantMinter(deployer);
      await smolBrain.mint(player1);
      await smolBrain.mint(player2);
      await smolBrain.mint(player3);

      let tx = await school.connect(player1Signer).join(0);
      await tx.wait();
      timestamp1 = await getBlockTime(tx.blockNumber);

      tx = await school.connect(player2Signer).join(1);
      await tx.wait();
      timestamp2 = await getBlockTime(tx.blockNumber);
    });

    it('scanBrain', async function () {
      await mineBlock(timestamp1 + 60*60*24*7);
      expect(await smolBrain.scanBrain(0)).to.be.equal("50000000000000000000")

      await mineBlock(timestamp2 + 60*60*24*7);
      expect(await smolBrain.scanBrain(1)).to.be.equal("50000000000000000000")

      expect(await smolBrain.scanBrain(0)).to.be.gt("50000000000000000000")
      expect(await smolBrain.scanBrain(2)).to.be.equal(0)
    });

    it('averageIQ', async function () {
      await mineBlock(timestamp2 + 60*60*24*7);

      let totalIQ: any = 0;
      for (let index = 0; index < 3; index++) {
        const iq = await smolBrain.scanBrain(index)
        totalIQ = iq.add(totalIQ)
      }
      expect(await smolBrain.averageIQ()).to.be.equal(totalIQ.div(3));
    });

    it('schoolDrop', async function () {
      await smolBrain.setSchool(deployer);
      await mineBlock(timestamp1 + 60*60*24*7);

      const tokenId = 0;
      expect(await smolBrain.brainz(tokenId)).to.be.equal(0);
      const iqEarned = await school.iqEarned(tokenId);
      await smolBrain.schoolDrop(tokenId, iqEarned);
      expect(await smolBrain.brainz(tokenId)).to.be.equal(iqEarned);
    });

    it('tokenURI', async function () {
      for (let index = 0; index < 3; index++) {
        expect(await smolBrain.tokenURI(index)).to.be.equal(`ipfs//SmolBrain/${index}/0`);
      }

      await mineBlock(timestamp1 + 60*60*24*7);

      for (let index = 0; index < 3; index++) {
        let level = 0;
        if (index == 0) level = 1;
        expect(await smolBrain.tokenURI(index)).to.be.equal(`ipfs//SmolBrain/${index}/${level}`);
      }

      await mineBlock(timestamp2 + 60*60*24*7);

      for (let index = 0; index < 3; index++) {
        let level = 1;
        if (index == 2) level = 0;
        expect(await smolBrain.tokenURI(index)).to.be.equal(`ipfs//SmolBrain/${index}/${level}`);
      }
    });
  })
});
