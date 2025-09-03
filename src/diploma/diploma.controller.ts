// src/diploma/diploma.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { BlockchainService } from '../Blockchain/blockchain.service.js';
import { WalletService } from '../wallets/wallet.service.js';
import { IpfsService } from '../ipfs/ipfs.service.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

@Controller('diplomas')
export class DiplomaController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly walletService: WalletService,
    private readonly ipfsService: IpfsService,
  ) {}

  // --- Publier un diplôme ---
  @Post('issue')
  async issueDiploma(
    @Body('userId') userId: number,
    @Body('diplomaData') diplomaData: any,
  ) {
    const userWallet = this.walletService.getWalletById(userId);
    if (!userWallet) return { error: 'User wallet not found' };

    const ipfsHash = this.ipfsService.storeJSON(diplomaData); // IPFS simulé (retourne un hash)
    const diplomaId = await this.blockchainService.issueDiplomaFrom(
      userWallet.privateKey,
      ipfsHash,
    );

    return { diplomaId, owner: userWallet.address, ipfsHash };
  }

  // --- Publier un diplôme à partir d'un PDF ---
  @Post('issue-pdf')
  async issueDiplomaPdf(@Body('userId') userId: number) {
    const userWallet = this.walletService.getWalletById(userId);
    if (!userWallet) return { error: 'User wallet not found' };

    const pdfPath = path.join(
      process.cwd(),
      'src',
      'diplome',
      'projet_exemple.pdf',
    );
    if (!fs.existsSync(pdfPath)) return { error: 'PDF file not found' };

    const ipfsHash = this.ipfsService.storeFile(pdfPath);
    const diplomaId = await this.blockchainService.issueDiplomaFrom(
      userWallet.privateKey,
      ipfsHash,
    );

    return { diplomaId, owner: userWallet.address, ipfsHash };
  }

  // --- Transférer un diplôme ---
  @Post('transfer')
  async transferDiploma(
    @Body('fromUserId') fromUserId: number,
    @Body('toUserId') toUserId: number,
    @Body('diplomaId') diplomaId: number,
  ) {
    const fromWallet = this.walletService.getWalletById(fromUserId);
    const toWallet = this.walletService.getWalletById(toUserId);
    if (!fromWallet || !toWallet)
      return { error: 'Wallet not found for given user IDs' };

    await this.blockchainService.transferDiplomaFrom(
      fromWallet.privateKey,
      diplomaId,
      toWallet.address,
    );

    return {
      message: `Diploma ${diplomaId} transferred from ${fromWallet.address} to ${toWallet.address}`,
    };
  }

  // 1) Historique d'un diplôme (events -> txHash, blockHash, parentHash, timestamp)
  @Get(':id/history')
  async history(@Param('id', ParseIntPipe) id: number) {
    return this.blockchainService.getDiplomaHistory(id);
  }

  // 2) Détails d'une transaction (decode input & logs)
  @Get('tx/:hash')
  async txDetails(@Param('hash') hash: string) {
    return this.blockchainService.getTxDetails(hash);
  }

  // 3) Détails d'un block (par numéro ou hash)
  @Get('block/:ref')
  async blockDetails(@Param('ref') ref: string) {
    // ref peut être 'latest', un numéro ('12345') ou un hash '0x...'
    const blockRef = /^\d+$/.test(ref) ? Number(ref) : ref;
    return this.blockchainService.getBlockDetails(blockRef);
  }

  // --- Lister tous les diplômes (place AVANT :id) ---
  @Get('all')
  async listAll(@Query('includeData') includeData?: string) {
    const withData = String(includeData ?? '').toLowerCase() === 'true';
    return this.blockchainService.getAllDiplomas({ includeData: withData });
  }

  // --- Récupérer un diplôme par ID (SANS regex ; ParseIntPipe suffit) ---
  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    // borne pour éviter un revert du contrat
    const total = await this.blockchainService
      .getDiplomaCount()
      .catch(() => null);
    if (total !== null && (id < 0 || id >= total)) {
      return {
        statusCode: 404,
        message: `Diploma ${id} not found (valid range: 0..${Math.max(0, total - 1)})`,
      };
    }

    const info = await this.blockchainService.getDiplomaInfo(id);
    let data: any = null;
    try {
      data = this.ipfsService.retrieveJSON(info.ipfsHash);
    } catch {
      data = null;
    }

    return { diplomaId: id, owner: info.owner, valid: info.valid, data };
  }

  // --- (Optionnel) Exemple simple pour /diplomas ---
  @Get()
  async listDiplomas() {
    try {
      const info = await this.blockchainService.getDiplomaInfo(0);
      let content: any = null;
      try {
        content = this.ipfsService.retrieveJSON(info.ipfsHash);
      } catch {}
      return [
        { diplomaId: 0, owner: info.owner, valid: info.valid, data: content },
      ];
    } catch {
      return [];
    }
  }
}
