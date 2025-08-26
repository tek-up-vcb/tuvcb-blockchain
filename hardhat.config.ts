// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-mocha-ethers';

const config: HardhatUserConfig = {
  solidity: '0.8.18', // aligne avec le pragma de tes contrats
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      type: 'edr-simulated', // réseau simulé Hardhat v3
      chainType: 'l1',
      mining: {
        auto: true,
        interval: 1000, // 1s : pas besoin de allowBlocksWithSameTimestamp
      },
    },
  },
  paths: {
    sources: './src/blockchain/contracts',
    artifacts: './src/blockchain/artifacts',
  },
};

export default config;
