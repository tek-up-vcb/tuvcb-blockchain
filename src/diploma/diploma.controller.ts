import { Controller, Post, Get, Body, Param } from '@nestjs/common';

import { BlockchainService } from '../Blockchain/blockchain.service.js';
import { WalletService } from '../wallets/wallet.service.js';
import { IpfsService } from '../ipfs/ipfs.service.js';

@Controller('diplomas')
export class DiplomaController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService,
    private readonly ipfsService: IpfsService,
  ) {}

  // Émettre un nouveau diplôme
  @Post('issue')
  async issueDiploma(
    @Body('userId') userId: number,
    @Body('diplomaData') diplomaData: any,
  ) {
    const userWallet = this.walletService.getWalletById(userId);
    if (!userWallet) {
      return { error: 'User wallet not found' };
    }

    // 1) Stocke le JSON (simulation IPFS) -> hash
    const ipfsHash = this.ipfsService.storeJSON(diplomaData);

    // 2) Émet on-chain depuis le wallet de l’émetteur
    const diplomaId = await this.blockchainService.issueDiplomaFrom(
      userWallet.privateKey,
      ipfsHash,
    );

    return {
      diplomaId,
      owner: userWallet.address,
      ipfsHash,
    };
  }

  // Transférer un diplôme à un autre utilisateur
  @Post('transfer')
  async transferDiploma(
    @Body('fromUserId') fromUserId: number,
    @Body('toUserId') toUserId: number,
    @Body('diplomaId') diplomaId: number,
  ) {
    const fromWallet = this.walletService.getWalletById(fromUserId);
    const toWallet = this.walletService.getWalletById(toUserId);
    if (!fromWallet || !toWallet) {
      return { error: 'Wallet not found for given user IDs' };
    }

    await this.blockchainService.transferDiplomaFrom(
      fromWallet.privateKey,
      diplomaId,
      toWallet.address,
    );

    return {
      message: `Diploma ${diplomaId} transferred from ${fromWallet.address} to ${toWallet.address}`,
    };
  }

  // Récupérer les infos d'un diplôme (on-chain + off-chain)
  @Get(':id')
  async getDiploma(@Param('id') id: number) {
    const info = await this.blockchainService.getDiplomaInfo(id);

    let content: any = null;
    try {
      content = this.ipfsService.retrieveJSON(info.ipfsHash);
    } catch {
      content = null;
    }

    return {
      diplomaId: id,
      owner: info.owner,
      valid: info.valid,
      data: content,
    };
  }

  // (Optionnel) Lister quelques diplômes — ici, simple exemple avec l'ID 0 si présent
  @Get()
  async listDiplomas() {
    try {
      const info = await this.blockchainService.getDiplomaInfo(0);
      let content: any = null;
      try {
        content = this.ipfsService.retrieveJSON(info.ipfsHash);
      } catch {}
      return [
        {
          diplomaId: 0,
          owner: info.owner,
          valid: info.valid,
          data: content,
        },
      ];
    } catch {
      // Rien d'émis encore
      return [];
    }
  }
}
