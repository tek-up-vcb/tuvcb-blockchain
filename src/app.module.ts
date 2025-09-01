import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { WalletController } from './wallets/wallet.controller.js';
import { DiplomaController } from './diploma/diploma.controller.js';
import { BlockchainSimulationController } from './simulation/blockchain-simulation.controller.js';
import { AppService } from './app.service.js';
import { BlockchainService } from './Blockchain/blockchain.service.js';
import { WalletService } from './wallets/wallet.service.js';
import { IpfsService } from './ipfs/ipfs.service.js';
import { BlockchainSimulationService } from './simulation/blockchain-simulation.service.js';

@Module({
  imports: [],
  controllers: [
    AppController,
    WalletController,
    DiplomaController,
    BlockchainSimulationController,
  ],
  providers: [
    AppService,
    BlockchainService,
    WalletService,
    IpfsService,
    BlockchainSimulationService,
  ],
})
export class AppModule {}
