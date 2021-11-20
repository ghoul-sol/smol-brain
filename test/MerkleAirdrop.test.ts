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
    await deployments.fixture(['deployments', 'merkle'], { fallbackToGlobal: false });

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
    let wallets = [
      [player1, 9],
      [player2, 68],
      [player3, 1],
    ]

    let whitelist = wallets.map(x => ethers.utils.solidityKeccak256(["address", "uint256"], [x[0], x[1]]));

    const merkleTree = new MerkleTree(whitelist, keccak256, { sortPairs: true });
    const root = merkleTree.getHexRoot();
    await merkleAirdrop.setMerkleRoot(root);

    for (let index = 0; index < whitelist.length; index++) {
      const wallet = wallets[index][0];
      const amount = wallets[index][1];

      const leaf = ethers.utils.solidityKeccak256(["address", "uint256"], [wallet, amount]); //keccak256(whitelist[index]);
      expect(leaf).to.be.equal(whitelist[index]);
      const proof = merkleTree.getHexProof(leaf);

      await expect(merkleAirdrop.connect(hackerSigner).mintSmolBrainAndLand(proof, amount)).to.be.revertedWith("MerkleAirdrop: proof invalid")

      expect(await merkleAirdrop.leftToClaim(proof, amount)).to.be.equal(amount);

      while (await merkleAirdrop.leftToClaim(proof, amount) > 0) {
        await merkleAirdrop
          .connect(await ethers.provider.getSigner(wallet))
          .mintSmolBrainAndLand(proof, amount);
      }

      await expect(
        merkleAirdrop
          .connect(await ethers.provider.getSigner(wallet))
          .mintSmolBrainAndLand(proof, amount)
      ).to.be.revertedWith("MerkleAirdrop: already claimed")

      expect(await merkleAirdrop.leftToClaim(proof, amount)).to.be.equal(0);
      expect(await smolBrain.balanceOf(wallet)).to.be.equal(amount*2);
      const ID1 = await smolBrain.tokenOfOwnerByIndex(wallet, 0);
      const ID2 = await smolBrain.tokenOfOwnerByIndex(wallet, 1);
      expect(await smolBrain.ownerOf(ID1)).to.be.equal(wallet);
      expect(await smolBrain.getGender(ID1)).to.be.equal(0);
      expect(await smolBrain.ownerOf(ID2)).to.be.equal(wallet);
      expect(await smolBrain.getGender(ID2)).to.be.equal(1);

      expect(await land.balanceOf(wallet)).to.be.equal(1);
      expect(await land.ownerOf(index)).to.be.equal(wallet);
    }
    expect(await smolBrain.totalSupply()).to.be.equal(78*2+1);
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
  })
});
