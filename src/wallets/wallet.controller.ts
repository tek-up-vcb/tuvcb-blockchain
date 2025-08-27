import { Controller, Post, Get } from '@nestjs/common';
import { BlockchainService } from '../Blockchain/blockchain.service.js';
import { JsonRpcProvider, parseEther } from 'ethers';
import { WalletService } from './wallet.service.js';

@Controller('wallets')
export class WalletController {
  private provider = new JsonRpcProvider('http://127.0.0.1:8545');

  constructor(
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
  ) {}

  // Créer un nouveau wallet utilisateur
  @Post()
  async createWallet() {
    const newWallet = this.walletService.createWallet();
    const address = newWallet.address;
    const deployer = await this.provider.getSigner();
    await deployer.sendTransaction({
      to: address,
      value: parseEther('10.0'),
    });
    return {
      id: newWallet.id,
      address: newWallet.address,
      privateKey: newWallet.privateKey,
    };
  }

  // Lister tous les wallets (addresses seulement)
  @Get()
  listWallets() {
    return this.walletService.listWallets();
  }
}
