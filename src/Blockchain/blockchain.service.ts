import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'hardhat'; // on utilise ethers fourni par Hardhat

@Injectable()
export class BlockchainService implements OnModuleInit {
  private diplomaContractAddress: string;
  private diplomaContractAbi: any; // on peut typer plus finement via typechain, mais pour simplicité any

  async onModuleInit() {
    // Au démarrage du module (application), on déploie le contrat DiplomaRegistry
    await this.deployContract();
  }

  private async deployContract() {
    console.log('Deploying DiplomaRegistry smart contract...');
    const [deployer] = await ethers.getSigners(); // le compte déployeur (compte[0] Hardhat)
    const factory = await ethers.getContractFactory(
      'DiplomaRegistry',
      deployer,
    );
    const contract = await factory.deploy();
    await contract.deployed();
    this.diplomaContractAddress = contract.address;
    // Récupérer l'ABI du contrat compilé
    const artifact = await hre.artifacts.readArtifact('DiplomaRegistry');
    this.diplomaContractAbi = artifact.abi;
    console.log(`Contract deployed at address: ${this.diplomaContractAddress}`);
  }

  // Méthode utilitaire pour obtenir une instance du contrat connecté avec un signataire particulier
  private getContractInstance(signer?: ethers.Signer) {
    if (!this.diplomaContractAddress) {
      throw new Error('Contract not deployed or address not set');
    }
    // Si aucun signer fourni, on utilise le provider par défaut (lecture seule)
    const contract = new ethers.Contract(
      this.diplomaContractAddress,
      this.diplomaContractAbi,
      signer || ethers.provider,
    );
    return contract;
  }

  // Émettre un diplôme (stocke hash dans la blockchain) depuis une adresse donnée (owner)
  async issueDiplomaFrom(
    walletPrivateKey: string,
    ipfsHash: string,
  ): Promise<number> {
    const signer = new ethers.Wallet(walletPrivateKey, ethers.provider);
    const contract = this.getContractInstance(signer);
    console.log(
      `Issuing diploma by ${signer.address} with hash ${ipfsHash}...`,
    );
    const tx = await contract.issueDiploma(ipfsHash);
    const receipt = await tx.wait(); // attendre la confirmation (minage)
    const event = receipt.events?.find((e) => e.event === 'DiplomaIssued');
    const diplomaId = event?.args?.[0].toNumber(); // l'id du diplôme émis (args[0] du event)
    return diplomaId;
  }

  // Transférer un diplôme d'un propriétaire (fromPrivKey) à une autre adresse (toAddress)
  async transferDiplomaFrom(
    fromPrivKey: string,
    diplomaId: number,
    toAddress: string,
  ): Promise<void> {
    const signer = new ethers.Wallet(fromPrivKey, ethers.provider);
    const contract = this.getContractInstance(signer);
    console.log(
      `Transferring diploma ${diplomaId} from ${signer.address} to ${toAddress} ...`,
    );
    const tx = await contract.transferDiploma(diplomaId, toAddress);
    await tx.wait();
    // Pas de valeur de retour particulière, on peut vérifier via event ou état si on veut
  }

  // Récupérer les infos d'un diplôme depuis la blockchain (via appel constant)
  async getDiplomaInfo(
    diplomaId: number,
  ): Promise<{ owner: string; ipfsHash: string; valid: boolean }> {
    const contract = this.getContractInstance(); // pas de signer => requête read-only
    const [ipfsHash, owner, valid] = await contract.getDiploma(diplomaId);
    return { owner, ipfsHash, valid };
  }
}
