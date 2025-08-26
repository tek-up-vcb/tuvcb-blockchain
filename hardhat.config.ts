// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    hardhat: {},
  },
  paths: {
    sources: './src/Blockchain/contracts',
    artifacts: './src/Blockchain/artifacts',
  },
};

export default config;
