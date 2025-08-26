import { Controller, Post, Get } from '@nestjs/common';
import { BlockchainService } from '../Blockchain/blockchain.service.ts';
import { WalletService } from './wallet.service.ts';
import { ethers } from 'ethers';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly blockchainService: BlockchainService,
  ) {}

  // Créer un nouveau wallet utilisateur
  @Post()
  async createWallet() {
    const newWallet = this.walletService.createWallet();
    const address = newWallet.address;
    // Optionnel: financer le wallet en ETH depuis le deployer pour qu'il puisse faire des tx
    const [deployer] = await ethers.getSigners();
    await deployer.sendTransaction({
      to: address,
      value: ethers.utils.parseEther('10.0'),
    });
    return {
      id: newWallet.id,
      address: newWallet.address,
      privateKey: newWallet.privateKey, // on retourne la clé privée UNE FOIS (avertissement sécurité)
    };
  }

  // Lister tous les wallets (addresses seulement)
  @Get()
  listWallets() {
    return this.walletService.listWallets();
  }
}
