import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {MerkleTree} from 'merkletreejs';
const keccak256 = require('keccak256');
const fsPromises = require("fs/promises");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  let whitelist: any[] = []; // TODO: need a JSON file with wallets
  if (whitelist.length > 0) {
    const merkleTree = new MerkleTree(whitelist, keccak256, { hashLeaves: true, sortPairs: true });
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
      const leaf = keccak256(whitelist[index]);
      const proof = merkleTree.getHexProof(leaf);
      proofs.push({wallet: whitelist[index], proof: proof})
    }
    await fsPromises.writeFile("./data/proofs.json", JSON.stringify(proofs));
  }
};

export default func;
func.tags = ['merkle'];
func.dependencies = ['deployments'];
