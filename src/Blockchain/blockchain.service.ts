import { Injectable, OnModuleInit } from '@nestjs/common';
import hre from 'hardhat';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private diplomaContractAddress!: string;
  private diplomaContractAbi!: any; // on peut typer plus finement via typechain, mais pour simplicité any

  async onModuleInit() {
    // Au démarrage du module (application), on déploie le contrat DiplomaRegistry
    await this.deployContract();
  }

  private async deployContract() {
    console.log('Deploying DiplomaRegistry smart contract...');
    const [deployer] = await hre.ethers.getSigners();
    const factory = await hre.ethers.getContractFactory('DiplomaRegistry', deployer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    this.diplomaContractAddress = await contract.getAddress();
    const artifact = await hre.artifacts.readArtifact('DiplomaRegistry');
    this.diplomaContractAbi = artifact.abi;
    console.log(`Contract deployed at address: ${this.diplomaContractAddress}`);
  }

  // Méthode utilitaire pour obtenir une instance du contrat connecté avec un signataire particulier
  private getContractInstance(signer?: any) {
    if (!this.diplomaContractAddress) {
      throw new Error('Contract not deployed or address not set');
    }
    // Si aucun signer fourni, on utilise le provider par défaut (lecture seule)
    return new hre.ethers.Contract(
      this.diplomaContractAddress,
      this.diplomaContractAbi,
      signer || hre.ethers.provider,
    );
  }

  // Émettre un diplôme (stocke hash dans la blockchain) depuis une adresse donnée (owner)
  async issueDiplomaFrom(
    walletPrivateKey: string,
    ipfsHash: string,
  ): Promise<number> {
    const signer = new hre.ethers.Wallet(walletPrivateKey, hre.ethers.provider);
    const contract = this.getContractInstance(signer);
    console.log(
      `Issuing diploma by ${signer.address} with hash ${ipfsHash}...`,
    );
    const tx = await contract.issueDiploma(ipfsHash);
    const receipt = await tx.wait();
    const event = receipt.logs?.find(
      (e: any) => e.fragment?.name === 'DiplomaIssued',
    );
    const diplomaId = event?.args?.[0] ? Number(event.args[0]) : 0;
    return diplomaId;
  }

  // Transférer un diplôme d'un propriétaire (fromPrivKey) à une autre adresse (toAddress)
  async transferDiplomaFrom(
    fromPrivKey: string,
    diplomaId: number,
    toAddress: string,
  ): Promise<void> {
    const signer = new hre.ethers.Wallet(fromPrivKey, hre.ethers.provider);
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
    const contract = this.getContractInstance();
    const [ipfsHash, owner, valid] = await contract.getDiploma(diplomaId);
    return { owner, ipfsHash, valid };
  }
}
