import hre from 'hardhat';
import {expect} from 'chai';
import {getBlockTime, mineBlock, getCurrentTime} from './utils';

const {ethers, deployments, getNamedAccounts} = hre;
const { deploy } = deployments;

describe('School', function () {
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

  describe('config', function () {
    it('setSmolBrain', async function () {
      expect(await school.smolBrain()).to.be.equal(smolBrain.address);
      await school.setSmolBrain(deployer)
      expect(await school.smolBrain()).to.be.equal(deployer);
    });

    it('setIqPerWeek', async function () {
      const iqPerWeek = ethers.utils.parseUnits('90', 'ether')
      await school.setIqPerWeek(iqPerWeek)
      expect(await school.iqPerWeek()).to.be.equal(iqPerWeek);
    });
  })

  describe('mint smolbrain', function () {
    let timestamp1: any;
    let timestamp2: any;

    beforeEach(async function () {
      await smolBrain.setMerkleAirdrop(deployer);
      await smolBrain.mint(player1);
      await smolBrain.mint(player2);
      await smolBrain.mint(player3);
    });

    it('join', async function () {
      expect(await school.lastRewardTimestamp()).to.be.equal(0);

      expect(await school.timestampJoined(0)).to.be.equal(0);
      expect(await school.isAtSchool(0)).to.be.false;
      let tx = await school.connect(player1Signer).join(0);
      await tx.wait();
      timestamp1 = await getBlockTime(tx.blockNumber);
      expect(await school.isAtSchool(0)).to.be.true;
      expect(await school.timestampJoined(0)).to.be.equal(timestamp1);
      expect(await school.lastRewardTimestamp()).to.be.equal(timestamp1);
      expect(await school.totalIqStored()).to.be.equal(0);

      expect(await school.timestampJoined(1)).to.be.equal(0);
      expect(await school.isAtSchool(1)).to.be.false;
      tx = await school.connect(player2Signer).join(1);
      await tx.wait();
      timestamp2 = await getBlockTime(tx.blockNumber);
      expect(await school.isAtSchool(1)).to.be.true;
      expect(await school.timestampJoined(1)).to.be.equal(timestamp2);
      expect(await school.lastRewardTimestamp()).to.be.equal(timestamp2);

      const iqPerWeek = await school.iqPerWeek();
      const WEEK = await school.WEEK();
      const timeDelta = timestamp2 - timestamp1;
      expect(await school.totalIqStored()).to.be.equal(iqPerWeek.mul(timeDelta).div(WEEK));
    });

    describe('at school', function () {
      beforeEach(async function () {
        let tx = await school.connect(player1Signer).join(0);
        await tx.wait();
        timestamp1 = await getBlockTime(tx.blockNumber);

        tx = await school.connect(player2Signer).join(1);
        await tx.wait();
        timestamp2 = await getBlockTime(tx.blockNumber);
      });

      it('drop', async function () {
        await mineBlock(timestamp1 + 60*60*24*7);
        let tx = await school.connect(player1Signer).drop(0);
        expect(await school.isAtSchool(0)).to.be.false;
        expect(await school.timestampJoined(0)).to.be.equal(0);
        expect(await school.lastRewardTimestamp()).to.be.equal(await getBlockTime(tx.blockNumber));
        expect(await school.totalIqStored()).to.be.equal("100000082671957671957");
      });

      it('totalIQ', async function () {
        await mineBlock(timestamp1 + 60*60*24*7);
        expect(await school.totalIQ()).to.be.equal("99999917328042328041");
      });

      it('iqEarned', async function () {
        await mineBlock(timestamp1 + 60*60*24*7);
        expect(await school.iqEarned(0)).to.be.equal("50000000000000000000");
        expect(await school.iqEarned(1)).to.be.equal("49999917328042328042");
        expect(await school.iqEarned(2)).to.be.equal("0");
      });
    })
  })
});
