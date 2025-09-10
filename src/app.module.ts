import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { RegistryController } from './diploma/registry.controller.js';
import { DiplomaController } from './diploma/diploma.controller.js';
import { AppService } from './app.service.js';
import { BlockchainService } from './Blockchain/blockchain.service.js';

@Module({
  imports: [],
  controllers: [AppController, RegistryController, DiplomaController],
  providers: [AppService, BlockchainService],
})
export class AppModule {}
