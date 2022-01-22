import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { deploy, read, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  const SmolGov = await deploy('SmolGov', {
    from: deployer,
    log: true,
    args: [(await deployments.get('SmolBrain')).address]
  })
};
export default func;
func.tags = ['SmolGov'];
