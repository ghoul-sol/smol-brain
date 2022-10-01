import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const smolbrain = "0x6325439389E0797Ab35752B4F43a14C004f22A9c";
  const smolfarm = "0xC2E007C61319fcf028178FAB14CD6ED6660C6e86";
  const smolbodies = "0x17DaCAD7975960833f374622fad08b90Ed67D1B5";
  const smolgym = "0x66299ecC614b7A1920922bBa7527819c841174BD";
  const smolracing = "0xEc895f620D1c103d5Bbc85CcE3b623C958Ce35cC";

  const SmolGov = await deploy('SmolGov', {
    from: deployer,
    log: true,
    args: [smolbrain, smolfarm, smolbodies, smolgym, smolracing]
  })
};
export default func;
func.tags = ['SmolGov'];
