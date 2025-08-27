import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { WalletController } from './wallets/wallet.controller.js';
import { DiplomaController } from './diploma/diploma.controller.js';
import { AppService } from './app.service.js';
import { BlockchainService } from './Blockchain/blockchain.service.js';
import { WalletService } from './wallets/wallet.service.js';
import { IpfsService } from './ipfs/ipfs.service.js';

@Module({
  imports: [],
  controllers: [AppController, WalletController, DiplomaController],
  providers: [AppService, BlockchainService, WalletService, IpfsService],
})
export class AppModule {}
