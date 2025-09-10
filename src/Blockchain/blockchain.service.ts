import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private registryAddress: string | null = null;
  private abi: any;
  private bytecode: `0x${string}`;

  constructor() {
    const rpc = process.env.RPC_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(rpc);
    const pk = process.env.PRIVATE_KEY || process.env.DEPLOYER_PK;
    if (!pk) throw new Error('PRIVATE_KEY (ou DEPLOYER_PK) manquant dans .env');
    this.signer = new ethers.Wallet(pk, this.provider);
    const art = this.loadArtifact('DiplomaRegistry');
    if (!art) throw new Error('Artifact DiplomaRegistry introuvable. Compile d\"abord.');
    this.abi = art.abi;
    this.bytecode = art.bytecode;
    if (process.env.DIPLOMA_ADDRESS) {
      this.registryAddress = process.env.DIPLOMA_ADDRESS.trim();
    }
  }

  // Chargement artifact Hardhat
  private loadArtifact(name: string): { abi: any; bytecode: `0x${string}` } | null {
    const roots = [
      path.join(process.cwd(), 'artifacts'),
      path.join(process.cwd(), 'src', 'Blockchain', 'artifacts'),
    ];
    for (const r of roots) {
      if (!fs.existsSync(r)) continue;
      const stack = [r];
      while (stack.length) {
        const d = stack.pop()!;
        for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, ent.name);
            if (ent.isDirectory()) { stack.push(p); continue; }
            if (ent.isFile() && ent.name === `${name}.json`) {
              try {
                const j = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (j.contractName === name && j.bytecode) {
                  return { abi: j.abi, bytecode: j.bytecode };
                }
              } catch { /* ignore */ }
            }
        }
      }
    }
    return null;
  }

  setExistingAddress(addr: string) {
    this.registryAddress = addr;
  }

  async deploy(): Promise<string> {
  await this.ensureFunds();
    const factory = new ethers.ContractFactory(this.abi, this.bytecode, this.signer);
    const c = await factory.deploy();
    await c.waitForDeployment();
    this.registryAddress = await c.getAddress();
    return this.registryAddress;
  }

  private getContract(): ethers.Contract {
    if (!this.registryAddress) throw new Error('Adresse du contrat non définie (deploy ou set d\'abord)');
    return new ethers.Contract(this.registryAddress, this.abi, this.signer);
  }

  /**
   * Vérifie qu'une adresse contient bien un contrat et expose au moins la fonction issueDiplomas.
   * Ne modifie PAS l'adresse active.
   */
  async verifyAddress(address: string) {
    try {
      const addr = ethers.getAddress(address);
      const code = await this.provider.getCode(addr);
      const isContract = code !== '0x';
      let matchesInterface = false;
      if (isContract) {
        try {
          // On reconstruit l'interface et on vérifie que la fonction existe dans l'ABI fournie
          const intf = new ethers.Interface(this.abi);
          matchesInterface = !!intf.getFunction('issueDiplomas');
        } catch {
          matchesInterface = false;
        }
      }
      return {
        address: addr,
        isContract,
        matchesInterface,
        codeSize: isContract ? (code.length - 2) / 2 : 0,
        canUse: isContract && matchesInterface,
      };
    } catch (e: any) {
      return { address, isContract: false, matchesInterface: false, codeSize: 0, canUse: false, error: e?.message };
    }
  }

  async issueBatch(batchId: string, diplome: string, hashes: string[]): Promise<string> {
  await this.ensureFunds();
    const contract = this.getContract();
    const parsed: string[] = hashes.map(h => h.startsWith('0x') ? h : '0x' + h);
  console.log('[issueBatch] batchId=', batchId, 'diplome=', diplome, 'hashCount=', parsed.length);
    const tx = await contract.issueDiplomas(batchId, diplome, parsed);
    const receipt = await tx.wait();
  console.log('[issueBatch] tx mined hash=', receipt!.hash, 'block=', receipt!.blockNumber);
    return receipt!.hash;
  }

  async getEventsByBatch(batchId: string) {
    try {
      const contract = this.getContract();
      // Utiliser la forme simple sans bornes; certains providers n'aiment pas 'latest' explicite
      const filter = contract.filters.DiplomaIssued(batchId);
      const logs = await contract.queryFilter(filter);
      return logs.map(l => ({
        txHash: l.transactionHash,
        blockNumber: l.blockNumber,
        batchId: (l as any).args?.batchId,
        diplome: (l as any).args?.diplome,
        diplomaHash: (l as any).args?.diplomaHash,
        timestamp: Number((l as any).args?.timestamp || 0),
      }));
    } catch (e: any) {
      return { error: true, message: e?.message || 'unable to fetch events', batchId } as any;
    }
  }

  async getAllEvents() {
    try {
      const contract = this.getContract();
      const filter = contract.filters.DiplomaIssued();
      const logs = await contract.queryFilter(filter);
      return logs.map(l => ({
        txHash: l.transactionHash,
        blockNumber: l.blockNumber,
        batchId: (l as any).args?.batchId,
        diplome: (l as any).args?.diplome,
        diplomaHash: (l as any).args?.diplomaHash,
        timestamp: Number((l as any).args?.timestamp || 0),
      }));
    } catch (e: any) {
      return { error: true, message: e?.message || 'unable to fetch events' } as any;
    }
  }

  getAddress() { return this.registryAddress; }

  async info() {
    const net = await this.provider.getNetwork();
    return {
      chainId: Number(net.chainId),
      name: net.name,
      rpc: (this.provider as any)?.connection?.url || process.env.RPC_URL,
      contractAddress: this.registryAddress || null,
    };
  }

  // Auto-fund le wallet si on est sur Hardhat et que le solde est trop bas
  private async ensureFunds() {
    try {
      const net = await this.provider.getNetwork();
      if (Number(net.chainId) !== 31337 && net.name !== 'hardhat') return; // uniquement réseau local
      const bal = await this.provider.getBalance(this.signer.address);
      const min = ethers.parseEther('0.5');
      if (bal >= min) return;
      const desired = ethers.parseEther('100');
      // hardhat_setBalance requiert une valeur hexadécimale quantity
      const hexValue = ethers.toQuantity(desired);
      await this.provider.send('hardhat_setBalance', [this.signer.address, hexValue]);
    } catch { /* ignore si pas supporté */ }
  }
}
