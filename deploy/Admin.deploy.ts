import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const newAdmin = "0x032F84aEfF59ddEBC55797F321624826d873bF65";

  // Transfer Ownership
  if(await read('MerkleAirdrop', 'owner') != newAdmin) {
    await execute(
      'MerkleAirdrop',
      { from: deployer, log: true },
      'transferOwnership',
      newAdmin
    );
  }

  if(await read('School', 'owner') != newAdmin) {
    await execute(
      'School',
      { from: deployer, log: true },
      'transferOwnership',
      newAdmin
    );
  }

  if(!(await read('Land', 'isOwner', newAdmin))) {
    const OWNER_ROLE = await read('Land', 'SMOLBRAIN_OWNER_ROLE');

    await execute(
      'Land',
      { from: deployer, log: true },
      'grantOwner',
      newAdmin
    );

    await execute(
      'Land',
      { from: deployer, log: true },
      'renounceRole',
      OWNER_ROLE,
      deployer
    );
  }

  if(!(await read('SmolBrain', 'isOwner', newAdmin))) {
    const OWNER_ROLE = await read('SmolBrain', 'SMOLBRAIN_OWNER_ROLE');

    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'grantOwner',
      newAdmin
    );

    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'renounceRole',
      OWNER_ROLE,
      deployer
    );
  }
};
export default func;
func.tags = ['admin'];
func.dependencies = ['deployments', 'merkle'];
