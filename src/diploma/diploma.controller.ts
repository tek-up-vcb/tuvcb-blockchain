import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { IpfsService } from '../ipfs/ipfs.service.ts';
import { WalletService } from '../wallets/wallet.service.ts';
import { BlockchainService } from '../Blockchain/blockchain.service.jt';

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
    @Body('diplomaData') diplomaData: any, // données JSON du diplôme (ex: { name: 'Alice', degree: '....', year: 2025, ... })
  ) {
    // 1. Récupérer le wallet de l'utilisateur émetteur
    const userWallet = this.walletService.getWalletById(userId);
    if (!userWallet) {
      return { error: 'User wallet not found' };
    }
    // 2. Stocker les données du diplôme via IPFS (simulation) -> obtenir un hash
    const ipfsHash = this.ipfsService.storeJSON(diplomaData);
    // 3. Appeler le smart contract pour émettre le diplôme on-chain
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
    // Appel du smart contract pour transférer
    await this.blockchainService.transferDiplomaFrom(
      fromWallet.privateKey,
      diplomaId,
      toWallet.address,
    );
    return {
      message: `Diploma ${diplomaId} transferred from ${fromWallet.address} to ${toWallet.address}`,
    };
  }

  // Récupérer les infos d'un diplôme (on-chain et hors-chain)
  @Get(':id')
  async getDiploma(@Param('id') id: number) {
    const info = await this.blockchainService.getDiplomaInfo(id);
    let content = null;
    try {
      content = this.ipfsService.retrieveJSON(info.ipfsHash);
    } catch (e) {
      content = null;
    }
    return {
      diplomaId: id,
      owner: info.owner,
      valid: info.valid,
      data: content, // contenu JSON du diplôme (peut être null si non trouvé, mais en principe devrait exister)
    };
  }

  // (Optionnel) Lister tous les diplômes existants
  @Get()
  async listDiplomas() {
    const total = (await this.blockchainService
      .getDiplomaInfo(0)
      .catch(() => null))
      ? await (await this.blockchainService.getDiplomaInfo(0)).then(() => true)
      : false;
    // La méthode ci-dessus n'est pas très élégante pour compter. Alternativement, on pourrait avoir BlockchainService exposer diplomaCount via contract.
    // Pour simplifier, supposons qu'on a connaissance de diplomaCount via un event ou stockage en parallèle.
  }
}
