// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
      mining: { auto: true, interval: 1000 },
    },
  },
  paths: {
    sources: './src/Blockchain/contracts',
    artifacts: './src/Blockchain/artifacts',
  },
  plugins: [hardhatToolboxMochaEthers],
};

export default config;
