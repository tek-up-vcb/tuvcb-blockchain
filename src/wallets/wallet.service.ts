import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

interface UserWallet {
  id: number;
  address: string;
  privateKey: string;
}

@Injectable()
export class WalletService {
  private wallets: UserWallet[] = [];
  private nextId = 1;

  // Créer un nouveau wallet utilisateur
  createWallet(): UserWallet {
    // Générer un wallet Ethereum aléatoire
    const wallet = ethers.Wallet.createRandom(); // génère une nouvelle clé aléatoire:contentReference[oaicite:26]{index=26}

    const userWallet: UserWallet = {
      id: this.nextId++,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
    this.wallets.push(userWallet);
    return { ...userWallet, privateKey: wallet.privateKey };
  }

  // Récupérer un wallet par son id (ou undefined s'il n'existe pas)
  getWalletById(id: number): UserWallet | undefined {
    return this.wallets.find((w) => w.id === id);
  }

  // Facultatif: lister tous les wallets (sans les clés privées idéalement)
  listWallets(): Omit<UserWallet, 'privateKey'>[] {
    return this.wallets.map(({ id, address }) => ({ id, address }));
  }
}
