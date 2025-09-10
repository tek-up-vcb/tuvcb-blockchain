import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BlockchainService } from '../Blockchain/blockchain.service.js';

// Préfixe 'blockchain/registry' pour correspondre à l'URL exposée via Traefik: /api/blockchain/registry
@Controller('blockchain/registry')
export class RegistryController {
  constructor(private readonly chain: BlockchainService) {}

  @Post('deploy')
  async deploy() {
    const addr = await this.chain.deploy();
    return { address: addr };
  }

  @Post('set-address')
  async setAddress(@Body('address') address: string) {
    this.chain.setExistingAddress(address);
    return { address };
  }

  @Post('issue')
  async issue(
    @Body('batchId') batchId: string,
    @Body('diplome') diplome: string,
    @Body('hashes') hashes: string[],
  ) {
    const txHash = await this.chain.issueBatch(batchId, diplome, hashes);
    return { txHash };
  }

  @Get('events/:batchId')
  async events(@Param('batchId') batchId: string) {
    return this.chain.getEventsByBatch(batchId);
  }

  @Get('address')
  getAddress() { return { address: this.chain.getAddress() }; }

  @Get('verify')
  async verify(@Query('address') address: string) {
    if (!address) return { error: 'address query param requis' };
    return this.chain.verifyAddress(address);
  }

  @Get('info')
  async info() { return this.chain.info(); }

  @Get('events-raw')
  async eventsRaw() { return this.chain.getAllEvents(); }
}
