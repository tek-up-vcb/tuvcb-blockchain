import { Controller, Post } from '@nestjs/common';
import { BlockchainSimulationService } from './blockchain-simulation.service.js';

@Controller('simulation')
export class BlockchainSimulationController {
  constructor(
    private readonly simulationService: BlockchainSimulationService,
  ) {}

  @Post()
  run() {
    return this.simulationService.runSimulation();
  }
}
