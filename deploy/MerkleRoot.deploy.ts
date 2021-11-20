import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {MerkleTree} from 'merkletreejs';
const keccak256 = require('keccak256');
const fsPromises = require("fs/promises");
const smolbrainswhitelist = require("../data/smolbrainswhitelist.json");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, network, deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();
  let wallets = smolbrainswhitelist[0]
  let amounts = smolbrainswhitelist[1]
  let whitelist: any = [];

  for (const index in wallets) {
    const wallet = wallets[index];
    const amount = amounts[index];
    whitelist.push(ethers.utils.solidityKeccak256(["address", "uint256"], [wallet, amount]))
  }

  if (whitelist.length > 0) {
    const merkleTree = new MerkleTree(whitelist, keccak256, { sortPairs: true });
    const root = merkleTree.getHexRoot();
    if(await read('MerkleAirdrop', 'merkleRoot') != root) {
      await execute(
        'MerkleAirdrop',
        { from: deployer, log: true },
        'setMerkleRoot',
        root
      );
    }

    const proofs = [];
    for (let index = 0; index < whitelist.length; index++) {
      const leaf = whitelist[index];
      const proof = merkleTree.getHexProof(leaf);
      proofs.push({wallet: wallets[index], amount: amounts[index], proof: proof})
    }
    await fsPromises.writeFile("./data/proofs.json", JSON.stringify(proofs));
  }
};

export default func;
func.tags = ['merkle'];
func.dependencies = ['deployments'];
