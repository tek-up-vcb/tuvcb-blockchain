import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainService } from '../Blockchain/blockchain.service.js';

// Contrôleur simplifié: expose seulement la lecture des events issus du trigger on-chain
@Controller('diplomas')
export class DiplomaController {
  constructor(private readonly chain: BlockchainService) {}

  // Tous les events DiplomaIssued
  @Get('events')
  async allEvents() {
    return this.chain.getAllEvents();
  }

  // Events d'un batch spécifique
  @Get('events/:batchId')
  async batchEvents(@Param('batchId') batchId: string) {
    return this.chain.getEventsByBatch(batchId);
  }
}
