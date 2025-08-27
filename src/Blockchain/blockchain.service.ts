import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';

type DiplomaInfo = {
  owner: string;
  ipfsHash: string;
  valid: boolean;
};

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider!: ethers.JsonRpcProvider;
  private deployer!: ethers.Signer;

  private diplomaContractAddress!: string;
  private diplomaContractAbi!: any;
  private diplomaBytecode!: `0x${string}`;

  async onModuleInit() {
    // 1) Provider local (lance `npx hardhat node` dans un autre terminal)
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // 2) Déployeur :
    //    - si DEPLOYER_PK défini -> wallet à partir de cette PK
    //    - sinon -> wallet aléatoire + crédit via hardhat_setBalance (DEV ONLY)
    const envPk = process.env.DEPLOYER_PK;
    if (envPk) {
      this.deployer = new ethers.Wallet(envPk, this.provider);
      console.log(
        '[Blockchain] Using DEPLOYER_PK:',
        await this.deployer.getAddress(),
      );
    } else {
      const tmp = ethers.Wallet.createRandom().connect(this.provider);
      try {
        // 1000 ETH en wei
        const funded = 1000n * 10n ** 18n;
        await this.provider.send('hardhat_setBalance', [
          await tmp.getAddress(),
          '0x' + funded.toString(16),
        ]);
        console.warn(
          '[Blockchain] DEPLOYER_PK absent. Using a random funded wallet (dev-only):',
          await tmp.getAddress(),
        );
      } catch (e) {
        console.warn(
          '[Blockchain] Could not fund random wallet via hardhat_setBalance. Is the provider a Hardhat node?',
        );
      }
      this.deployer = tmp;
    }

    // 3) Charge l’artifact compilé (ABI + bytecode)
    const loaded =
      this.loadArtifact('DiplomaRegistry') ?? this.loadArtifact('Diploma');
    if (!loaded) {
      throw new Error(
        'Artifact not found. Did you run `npx hardhat compile` ?',
      );
    }
    this.diplomaContractAbi = loaded.abi;
    this.diplomaBytecode = loaded.bytecode;

    // 4) Déploie si pas d’adresse fournie
    if (process.env.DIPLOMA_ADDRESS) {
      this.diplomaContractAddress = process.env.DIPLOMA_ADDRESS;
      const code = await this.provider.getCode(this.diplomaContractAddress);
      if (code === '0x') {
        throw new Error(
          `Aucun contrat à l’adresse DIPLOMA_ADDRESS=${this.diplomaContractAddress}`,
        );
      }
      console.log(
        `Using existing DiplomaRegistry at ${this.diplomaContractAddress}`,
      );
    } else {
      console.log('Deploying DiplomaRegistry smart contract...');
      const factory = new ethers.ContractFactory(
        this.diplomaContractAbi,
        this.diplomaBytecode,
        this.deployer,
      );
      const contract = await factory.deploy();
      await contract.waitForDeployment();
      this.diplomaContractAddress = await contract.getAddress();
      console.log(
        `Contract deployed at address: ${this.diplomaContractAddress}`,
      );
    }
  }

  // Utilitaire: charge l’artifact JSON (ABI + bytecode) pour un nom de contrat
  private loadArtifact(
    contractName: string,
  ): { abi: any; bytecode: `0x${string}` } | null {
    // Hardhat : artifacts/contracts/<Nom>.sol/<Nom>.json
    const candidatePaths = [
      path.join(
        process.cwd(),
        'src',
        'Blockchain',
        'artifacts',
        'contracts',
        `${contractName}.sol`,
        `${contractName}.json`,
      ),
      path.join(
        process.cwd(),
        'src',
        'Blockchain',
        'artifacts',
        'contracts',
        'Diploma.sol',
        'Diploma.json',
      ),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const artifact = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return { abi: artifact.abi, bytecode: artifact.bytecode };
      }
    }
    return null;
  }

  // Récupère une instance du contrat (lecture seule si pas de signer)
  private getContract(signer?: ethers.Signer) {
    if (!this.diplomaContractAddress) {
      throw new Error('Contract not deployed or address not set');
    }
    return new ethers.Contract(
      this.diplomaContractAddress,
      this.diplomaContractAbi,
      signer ?? this.provider,
    );
  }

  // Émettre un diplôme depuis une clé privée donnée
  async issueDiplomaFrom(
    walletPrivateKey: string,
    ipfsHash: string,
  ): Promise<number> {
    const signer = new ethers.Wallet(walletPrivateKey, this.provider);
    const contract = this.getContract(signer);

    const tx = await contract.issueDiploma(ipfsHash);
    const receipt = await tx.wait();

    // Extraire l’ID depuis l’événement DiplomaIssued(uint256 id, ...)
    let diplomaId = 0;
    try {
      for (const log of receipt!.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'DiplomaIssued') {
            diplomaId = Number(parsed.args[0]);
            break;
          }
        } catch {}
      }
    } catch {}
    return diplomaId;
  }

  // Transférer un diplôme
  async transferDiplomaFrom(
    fromPrivKey: string,
    diplomaId: number,
    toAddress: string,
  ): Promise<void> {
    const signer = new ethers.Wallet(fromPrivKey, this.provider);
    const contract = this.getContract(signer);
    const tx = await contract.transferDiploma(diplomaId, toAddress);
    await tx.wait();
  }

  // Lire les infos d’un diplôme
  async getDiplomaInfo(diplomaId: number): Promise<DiplomaInfo> {
    const contract = this.getContract();
    // Adapter l’ordre au retour réel de ton contrat (ici: (ipfsHash, owner, valid))
    const [ipfsHash, owner, valid] = await contract.getDiploma(diplomaId);
    return { owner, ipfsHash, valid };
  }
}
