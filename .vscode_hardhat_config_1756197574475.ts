import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: '0.8.18', // Version de Solidity à utiliser
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // configuration du réseau local Hardhat (par défaut pas besoin de plus,
      // il crée 20 comptes avec 10000 ETH fictifs chacun)
      mining: {
        auto: true,
        interval: 1000, // mine instantanément chaque transaction
      },
    },
    // on pourrait configurer d'autres réseaux (testnets, etc.) si besoin
  },
  paths: {
    sources: './src/Blockchain/contracts', // emplacement des contrats Solidity
    artifacts: './src/Blockchain/artifacts', // où générer les fichiers compilés (ABI, bytecode)
  },
};

export default config;
