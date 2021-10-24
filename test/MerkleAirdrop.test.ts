import hre from 'hardhat';
import {expect} from 'chai';
import {getBlockTime, mineBlock, getCurrentTime} from './utils';
import {MerkleTree} from 'merkletreejs';
const keccak256 = require('keccak256');

const {ethers, deployments, getNamedAccounts} = hre;
const { deploy } = deployments;

describe('MerkleAirdrop', function () {
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
    let whitelist = [];
    whitelist[0] = player1;
    whitelist[1] = player2;
    whitelist[2] = player3;

    const merkleTree = new MerkleTree(whitelist, keccak256, { hashLeaves: true, sortPairs: true });
    const root = merkleTree.getHexRoot();
    await merkleAirdrop.setMerkleRoot(root);

    for (let index = 0; index < whitelist.length; index++) {
      const leaf = keccak256(whitelist[index]);
      const proof = merkleTree.getHexProof(leaf);
      await merkleAirdrop
        .connect(await ethers.provider.getSigner(whitelist[index]))
        .mintSmolBrainAndLand(proof);

      expect(await smolBrain.balanceOf(whitelist[index])).to.be.equal(1);
      expect(await smolBrain.ownerOf(index)).to.be.equal(whitelist[index]);
      expect(await smolBrain.totalSupply()).to.be.equal(index+1);

      expect(await land.balanceOf(whitelist[index])).to.be.equal(1);
      expect(await land.ownerOf(index)).to.be.equal(whitelist[index]);
      expect(await land.totalSupply()).to.be.equal(index+1);
    }
  });

  describe('config', function () {
    it('setMerkleRoot', async function () {
      const merkleRoot = "0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff";
      await merkleAirdrop.setMerkleRoot(merkleRoot)
      expect(await merkleAirdrop.merkleRoot()).to.be.equal(merkleRoot);
    });

    it('setSmolBrain', async function () {
      expect(await merkleAirdrop.smolBrain()).to.be.equal(smolBrain.address);
      await merkleAirdrop.setSmolBrain(deployer)
      expect(await merkleAirdrop.smolBrain()).to.be.equal(deployer);
    });

    it('setLand', async function () {
      expect(await merkleAirdrop.land()).to.be.equal(land.address);
      await merkleAirdrop.setLand(deployer)
      expect(await merkleAirdrop.land()).to.be.equal(deployer);
    });

    it('setClaimPerWallet', async function () {
      const claimPerWallet = 3;
      await merkleAirdrop.setClaimPerWallet(claimPerWallet)
      expect(await merkleAirdrop.claimPerWallet()).to.be.equal(claimPerWallet);
    });
  })
});
