import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const CONFIG = {
    Land: {
      landMaxLevel: 6,
      levelIQCost: ethers.utils.parseUnits('10', 'ether'),
      baseURI: "ipfs//Land/"
    },
    School: {
      iqPerWeek: ethers.utils.parseUnits('50', 'ether')
    },
    SmolBrain: {
      brainMaxLevel: 6,
      levelIQCost: ethers.utils.parseUnits('50', 'ether'),
      baseURI: "ipfs//SmolBrain/"
    },
    MerkleAirdrop: {
      claimPerWallet: 1
    }
  }

  const MerkleAirdrop = await deploy('MerkleAirdrop', {
    from: deployer,
    log: true,
  })

  const Land = await deploy('Land', {
    from: deployer,
    log: true,
  })

  const School = await deploy('School', {
    from: deployer,
    log: true,
  })

  const SmolBrain = await deploy('SmolBrain', {
    from: deployer,
    log: true,
  })

  // MerkleAirdrop

  if(await read('MerkleAirdrop', 'smolBrain') != SmolBrain.address) {
    await execute(
      'MerkleAirdrop',
      { from: deployer, log: true },
      'setSmolBrain',
      SmolBrain.address
    );
  }

  if(await read('MerkleAirdrop', 'land') != Land.address) {
    await execute(
      'MerkleAirdrop',
      { from: deployer, log: true },
      'setLand',
      Land.address
    );
  }

  if(await read('MerkleAirdrop', 'claimPerWallet') != CONFIG.MerkleAirdrop.claimPerWallet) {
    await execute(
      'MerkleAirdrop',
      { from: deployer, log: true },
      'setClaimPerWallet',
      CONFIG.MerkleAirdrop.claimPerWallet
    );
  }

  // Land

  if(await read('Land', 'smolBrain') != SmolBrain.address) {
    await execute(
      'Land',
      { from: deployer, log: true },
      'setSmolBrain',
      SmolBrain.address
    );
  }

  if(await read('Land', 'merkleAirdrop') != MerkleAirdrop.address) {
    await execute(
      'Land',
      { from: deployer, log: true },
      'setMerkleAirdrop',
      MerkleAirdrop.address
    );
  }

  if(await read('Land', 'landMaxLevel') != CONFIG.Land.landMaxLevel) {
    await execute(
      'Land',
      { from: deployer, log: true },
      'setMaxLevel',
      CONFIG.Land.landMaxLevel
    );
  }

  if(await read('Land', 'levelIQCost') != CONFIG.Land.levelIQCost) {
    await execute(
      'Land',
      { from: deployer, log: true },
      'setLevelIQCost',
      CONFIG.Land.levelIQCost
    );
  }

  if(await read('Land', 'baseURI') != CONFIG.Land.baseURI) {
    await execute(
      'Land',
      { from: deployer, log: true },
      'setBaseURI',
      CONFIG.Land.baseURI
    );
  }

  // School

  if(await read('School', 'smolBrain') != SmolBrain.address) {
    await execute(
      'School',
      { from: deployer, log: true },
      'setSmolBrain',
      SmolBrain.address
    );
  }

  if(await read('School', 'iqPerWeek') != CONFIG.School.iqPerWeek) {
    await execute(
      'School',
      { from: deployer, log: true },
      'setIqPerWeek',
      CONFIG.School.iqPerWeek
    );
  }

  // SmolBrain

  if(await read('SmolBrain', 'school') != School.address) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setSchool',
      School.address
    );
  }

  if(await read('SmolBrain', 'land') != Land.address) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setLand',
      Land.address
    );
  }

  if(await read('SmolBrain', 'merkleAirdrop') != MerkleAirdrop.address) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setMerkleAirdrop',
      MerkleAirdrop.address
    );
  }

  if(await read('SmolBrain', 'brainMaxLevel') != CONFIG.SmolBrain.brainMaxLevel) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setMaxLevel',
      CONFIG.SmolBrain.brainMaxLevel
    );
  }

  if(await read('SmolBrain', 'levelIQCost') != CONFIG.SmolBrain.levelIQCost) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setLevelIQCost',
      CONFIG.SmolBrain.levelIQCost
    );
  }

  if(await read('SmolBrain', 'baseURI') != CONFIG.SmolBrain.baseURI) {
    await execute(
      'SmolBrain',
      { from: deployer, log: true },
      'setBaseURI',
      CONFIG.SmolBrain.baseURI
    );
  }
};
export default func;
func.tags = ['deployments'];
