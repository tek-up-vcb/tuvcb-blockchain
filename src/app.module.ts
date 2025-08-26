import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockchainService } from './Blockchain/blockchain.service';
import { WalletService } from './wallets/wallet.service';
import { IpfsService } from './ipfs/ipfs.service';
import { DiplomaController } from './diploma/diploma.controller';
import { WalletController } from './wallets/wallet.controller';

@Module({
  imports: [],
  controllers: [AppController, WalletController, DiplomaController],
  providers: [AppService, BlockchainService, WalletService, IpfsService],
})
export class AppModule {}
