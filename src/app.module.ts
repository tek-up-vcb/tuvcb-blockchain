import { Module } from '@nestjs/common';
import { AppController } from './app.controller.ts';
import { AppService } from './app.service.ts';
import { BlockchainService } from './Blockchain/blockchain.service.ts';
import { WalletService } from './wallets/wallet.service.ts';
import { IpfsService } from './ipfs/ipfs.service.ts';
import { DiplomaController } from './diploma/diploma.controller.ts';
import { WalletController } from './wallets/wallet.controller.ts';

@Module({
  imports: [],
  controllers: [AppController, WalletController, DiplomaController],
  providers: [AppService, BlockchainService, WalletService, IpfsService],
})
export class AppModule {}
