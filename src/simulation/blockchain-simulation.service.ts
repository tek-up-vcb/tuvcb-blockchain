import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { IpfsService } from '../ipfs/ipfs.service.js';
import { BlockchainService } from '../Blockchain/blockchain.service.js';

@Injectable()
export class BlockchainSimulationService {
  constructor(
    private readonly ipfsService: IpfsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async runSimulation() {
    // 1) Provider & comptes
    const providerUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(providerUrl);

    // v6: getSigner is async; use an index to avoid listAccounts() type differences
    const deployer = await provider.getSigner(0);

    // Crée un utilisateur aléatoire et le finance
    const user = ethers.Wallet.createRandom().connect(provider);
    const deployerAddress = await deployer.getAddress();
    const deployerBalanceBefore = await provider.getBalance(deployerAddress);

    const userBalanceBefore = await provider.getBalance(user.address);

    // 2) Transfert 1 ETH
    const tx = await deployer.sendTransaction({
      to: user.address,
      value: ethers.parseEther('1'),
    });
    await tx.wait();

    const deployerBalanceAfter = await provider.getBalance(deployerAddress);

    const userBalanceAfter = await provider.getBalance(user.address);

    // 3) Stockage IPFS (souvent async)
    const diplomaObject = {
      name: 'student1',
      degree: 'Blockchain 101',
      year: 2024,
    };
    const cid = await this.ipfsService.storeJSON(diplomaObject);

    // 4) Enregistrement on-chain via BlockchainService
    const diplomaId = await this.blockchainService.issueDiplomaFrom(
      user.privateKey,
      cid,
    );

    const stored = await this.blockchainService.getDiplomaInfo(diplomaId);
    const retrieved = await this.ipfsService.retrieveJSON(cid);

    return {
      deployer: await deployer.getAddress(),
      user: user.address,
      balances: {
        deployerBefore: deployerBalanceBefore.toString(),
        deployerAfter: deployerBalanceAfter.toString(),
        userBefore: userBalanceBefore.toString(),
        userAfter: userBalanceAfter.toString(),
      },
      ipfsHash: cid,
      diplomaId,
      stored,
      retrieved,
    };
  }
}
