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
    const envPk = process.env.DEPLOYER_PK || process.env.PRIVATE_KEY;
    if (envPk) {
      this.deployer = new ethers.Wallet(envPk, this.provider);
      console.log(
        '[Blockchain] Using DEPLOYER_PK:',
        await this.deployer.getAddress(),
      );
    } else {
      const tmp = ethers.Wallet.createRandom().connect(this.provider);
      try {
        // 1000 ETH (dev only)
        const funded = 1000n * 10n ** 18n;
        await this.provider.send('hardhat_setBalance', [
          await tmp.getAddress(),
          '0x' + funded.toString(16),
        ]);
        console.warn(
          '[Blockchain] DEPLOYER_PK absent. Using a random funded wallet (dev-only):',
          await tmp.getAddress(),
        );
      } catch {
        console.warn(
          '[Blockchain] Could not fund random wallet via hardhat_setBalance. Is the provider a Hardhat node?',
        );
      }
      this.deployer = tmp;
    }

    // 3) Charger l’artifact (ABI + bytecode)
    const loaded =
      this.loadArtifact('DiplomaRegistry') ?? this.loadArtifact('Diploma');
    if (!loaded) {
      throw new Error(
        'Artifact not found. Did you run `npx hardhat compile` ?',
      );
    }
    this.diplomaContractAbi = loaded.abi;
    this.diplomaBytecode = loaded.bytecode;

    // 4) Utiliser une adresse existante si fournie, sinon déployer
    const existingAddr = process.env.DIPLOMA_ADDRESS?.trim();
    if (existingAddr) {
      this.diplomaContractAddress = existingAddr;
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

  /** Expose publiquement l’adresse utilisée (debug) */
  getAddress() {
    return this.diplomaContractAddress;
  }

  /** Charge l’artifact JSON (ABI + bytecode) à partir des emplacements possibles */
  private loadArtifact(
    contractName: string,
  ): { abi: any; bytecode: `0x${string}` } | null {
    // Dossiers possibles (selon ta structure)
    const roots = [
      path.join(process.cwd(), 'src', 'Blockchain', 'artifacts'),
      path.join(process.cwd(), 'src', 'blockchain', 'artifacts'),
      path.join(process.cwd(), 'artifacts'), // fallback hardhat par défaut
    ];

    for (const root of roots) {
      if (!fs.existsSync(root)) continue;

      // Chemin "sourceName" typique: src/Blockchain/contracts/Diploma.sol/DiplomaRegistry.json
      const bySource = path.join(
        root,
        'src',
        'Blockchain',
        'contracts',
        `${contractName.replace('Registry', '')}.sol`,
        `${contractName}.json`,
      );
      if (fs.existsSync(bySource)) {
        const a = JSON.parse(fs.readFileSync(bySource, 'utf8'));
        return { abi: a.abi, bytecode: a.bytecode };
      }

      // Chemin direct avec le même nom .sol
      const direct = path.join(
        root,
        'src',
        'Blockchain',
        'contracts',
        `${contractName}.sol`,
        `${contractName}.json`,
      );
      if (fs.existsSync(direct)) {
        const a = JSON.parse(fs.readFileSync(direct, 'utf8'));
        return { abi: a.abi, bytecode: a.bytecode };
      }

      // Scan fallback: parcourir tous les .json pour trouver "contractName"
      const stack: string[] = [root];
      while (stack.length) {
        const dir = stack.pop()!;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) {
            stack.push(p);
            continue;
          }
          if (e.isFile() && p.endsWith('.json')) {
            try {
              const a = JSON.parse(fs.readFileSync(p, 'utf8'));
              const name = String(a?.contractName || '');
              if (
                name === contractName ||
                ['Diploma', 'DiplomaRegistry'].includes(name)
              ) {
                return { abi: a.abi, bytecode: a.bytecode };
              }
            } catch {
              /* ignore */
            }
          }
        }
      }
    }
    return null;
  }

  /** Instance du contrat (lecture seule si pas de signer) */
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

  /** Émettre un diplôme depuis une clé privée donnée */
  async issueDiplomaFrom(
    walletPrivateKey: string,
    ipfsHash: string,
  ): Promise<number> {
    const signer = new ethers.Wallet(walletPrivateKey, this.provider);
    const contract = this.getContract(signer);

    const tx = await contract.issueDiploma(ipfsHash);
    const receipt = await tx.wait();

    // 1) Essayer d’extraire l’ID via l’event
    try {
      for (const log of receipt!.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === 'DiplomaIssued') {
            // args: [diplomaId, owner, ipfsHash]
            return Number(parsed.args[0]);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    // 2) Fallback: lire le compteur - 1
    const count = await this.getDiplomaCount().catch(() => 0);
    return Math.max(0, count - 1);
  }

  /** Transférer un diplôme */
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

  /** Révoquer un diplôme (si exposé côté contrôleur) */
  async revokeDiplomaFrom(
    ownerPrivKey: string,
    diplomaId: number,
  ): Promise<void> {
    const signer = new ethers.Wallet(ownerPrivKey, this.provider);
    const contract = this.getContract(signer);
    const tx = await contract.revokeDiploma(diplomaId);
    await tx.wait();
  }

  /** Lire les infos d’un diplôme (ipfsHash, owner, valid) */
  async getDiplomaInfo(diplomaId: number): Promise<DiplomaInfo> {
    const contract = this.getContract();
    // getDiploma(uint256) -> (string ipfsHash, address owner, bool valid)
    const [ipfsHash, owner, valid] = await contract.getDiploma(diplomaId);
    return { owner, ipfsHash, valid };
  }

  /** Compteur total on-chain (uint256 public diplomaCount) */
  async getDiplomaCount(): Promise<number> {
    const contract = this.getContract();
    const count = await contract.diplomaCount(); // v6: bigint
    // @ts-ignore
    return typeof count === 'bigint'
      ? Number(count)
      : count?.toNumber
        ? count.toNumber()
        : Number(count);
  }

  // ✅ Remplacer dans BlockchainService
  async getAllDiplomaIdsByEvents(): Promise<number[]> {
    const contract = this.getContract();

    // filtre "DiplomaIssued" (v6)
    const filter = contract.filters.DiplomaIssued();
    const events = await contract.queryFilter(filter, 0, 'latest');

    const ids = new Set<number>();

    for (const ev of events) {
      try {
        if ('args' in ev && ev.args) {
          // EventLog: args a des clés nommées + indexées
          const anyArgs = ev.args as any;
          const raw = anyArgs.diplomaId ?? anyArgs[0];
          const id = Number(raw);
          if (!Number.isNaN(id)) ids.add(id);
        } else {
          // Log simple: on parse via l'interface du contrat
          const parsed = contract.interface.parseLog(ev as any);
          if (parsed && parsed.args) {
            const id = Number(parsed.args[0]);
            if (!Number.isNaN(id)) ids.add(id);
          }
        }
      } catch {
        // ignore log qu'on n'arrive pas à parser
      }
    }

    return [...ids].sort((a, b) => a - b);
  }

  /** Liste on-chain uniquement via le compteur */
  async getAllDiplomasOnChain(): Promise<
    Array<{
      diplomaId: number;
      owner: string;
      ipfsHash: string;
      valid: boolean;
    }>
  > {
    const n = await this.getDiplomaCount();
    const out: Array<{
      diplomaId: number;
      owner: string;
      ipfsHash: string;
      valid: boolean;
    }> = [];
    for (let id = 0; id < n; id++) {
      try {
        const info = await this.getDiplomaInfo(id);
        out.push({ diplomaId: id, ...info });
      } catch {
        /* skip */
      }
    }
    return out;
  }

  /** Liste complète avec option data off-chain (IPFS simulé) — tente le compteur puis fallback events */
  async getAllDiplomas(options?: { includeData?: boolean }) {
    const includeData = !!options?.includeData;
    const ipfsDir = path.join(process.cwd(), 'ipfs-storage');

    // 1) via compteur
    try {
      const n = await this.getDiplomaCount();
      if (n > 0) {
        const out: Array<{
          diplomaId: number;
          owner: string;
          ipfsHash: string;
          valid: boolean;
          data?: any;
        }> = [];
        for (let id = 0; id < n; id++) {
          const info = await this.getDiplomaInfo(id);
          const item: any = { diplomaId: id, ...info };
          if (includeData) {
            const file = path.join(ipfsDir, `${info.ipfsHash}.json`);
            if (fs.existsSync(file)) {
              try {
                item.data = JSON.parse(fs.readFileSync(file, 'utf8'));
              } catch {
                item.data = null;
              }
            } else {
              item.data = null;
            }
          }
          out.push(item);
        }
        return out;
      }
    } catch {
      /* ignore */
    }

    // 2) fallback: via events
    const ids = await this.getAllDiplomaIdsByEvents();
    const out2: Array<{
      diplomaId: number;
      owner: string;
      ipfsHash: string;
      valid: boolean;
      data?: any;
    }> = [];
    for (const id of ids) {
      try {
        const info = await this.getDiplomaInfo(id);
        const item: any = { diplomaId: id, ...info };
        if (includeData) {
          const file = path.join(ipfsDir, `${info.ipfsHash}.json`);
          if (fs.existsSync(file)) {
            try {
              item.data = JSON.parse(fs.readFileSync(file, 'utf8'));
            } catch {
              item.data = null;
            }
          } else {
            item.data = null;
          }
        }
        out2.push(item);
      } catch {
        /* skip */
      }
    }
    return out2;
  }

  /** Récupérer un diplôme + JSON off-chain (IPFS simulé) */
  async getDiplomaWithData(diplomaId: number) {
    const info = await this.getDiplomaInfo(diplomaId);
    const ipfsDir = path.join(process.cwd(), 'ipfs-storage');
    const file = path.join(ipfsDir, `${info.ipfsHash}.json`);
    let data: any = null;
    if (fs.existsSync(file)) {
      try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        data = null;
      }
    }
    return { diplomaId, ...info, data };
  }
  // 1) Détails d'une transaction (decode input + logs si possible)
  async getTxDetails(txHash: string) {
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) throw new Error(`Tx not found: ${txHash}`);

    const receipt = await this.provider.getTransactionReceipt(txHash);
    const block = receipt?.blockHash
      ? await this.provider.getBlock(receipt.blockHash)
      : null;

    // Décodage de l'input si la tx cible notre contrat
    let decodedInput: any = null;
    try {
      if (
        tx.to &&
        this.diplomaContractAddress &&
        tx.to.toLowerCase() === this.diplomaContractAddress.toLowerCase()
      ) {
        const parsed = new ethers.Interface(
          this.diplomaContractAbi,
        ).parseTransaction({ data: tx.data, value: tx.value });
        decodedInput = {
          function: parsed?.name,
          args: this.normalizeArgs(parsed?.args as any),
        };
      }
    } catch {
      /* ignore */
    }

    // ✅ Décodage des logs (avec garde et normalisation des args)
    const logsDecoded: any[] = [];
    if (receipt?.logs?.length) {
      const iface = new ethers.Interface(this.diplomaContractAbi);
      for (const log of receipt.logs) {
        if (
          !log?.address ||
          log.address.toLowerCase() !==
            this.diplomaContractAddress.toLowerCase()
        )
          continue;
        try {
          let parsed: ethers.LogDescription | null = null;
          try {
            parsed = iface.parseLog(log);
          } catch {
            parsed = null;
          }
          if (parsed) {
            logsDecoded.push({
              event: parsed.name,
              args: this.normalizeArgs(parsed.args as any),
            });
          }
        } catch {
          /* ignore */
        }
      }
    }

    return {
      txHash: tx.hash,
      from: tx.from,
      to: tx.to,
      nonce: tx.nonce,
      valueWei: tx.value?.toString(),
      data: tx.data,
      decodedInput,
      blockHash: receipt?.blockHash || null,
      blockNumber: receipt?.blockNumber ?? null,
      status: receipt?.status ?? null,
      gasUsed: receipt?.gasUsed?.toString(),
      logsDecoded,
      block: block
        ? {
            hash: block.hash,
            parentHash: block.parentHash,
            number: block.number,
            timestamp: block.timestamp,
          }
        : null,
    };
  }

  // 2) Détails d'un block (par numéro ou hash; 'latest' accepté)
  async getBlockDetails(blockRef: number | string) {
    const block = await this.provider.getBlock(blockRef as any);
    if (!block) throw new Error(`Block not found: ${blockRef}`);
    return {
      hash: block.hash,
      parentHash: block.parentHash, // <= "hash précédent"
      number: block.number,
      timestamp: block.timestamp,
      transactions: block.transactions, // array de tx hashes
    };
  }

  // 3) Historique d'un diplôme par events (txHash, blockHash, parentHash, etc.)
  async getDiplomaHistory(diplomaId: number) {
    const contract = this.getContract();
    const out: any[] = [];

    const issued = await contract.queryFilter(
      contract.filters.DiplomaIssued(diplomaId),
      0,
      'latest',
    );
    const transferred = await contract.queryFilter(
      contract.filters.DiplomaTransferred(diplomaId),
      0,
      'latest',
    );

    const all = [...issued, ...transferred];

    for (const ev of all) {
      const r: any = {
        event: (ev as any).eventName ?? (ev as any).fragment?.name ?? 'Event',
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
        blockHash: (ev as any).blockHash,
        parentHash: null,
        timestamp: null,
        args: [],
      };

      // normalise args si dispo
      const anyEv: any = ev;
      if (anyEv?.args != null) {
        r.args = this.normalizeArgs(anyEv.args);
      }

      // infos block (parentHash / timestamp)
      try {
        const blk = await this.provider.getBlock(r.blockHash);
        r.parentHash = blk?.parentHash ?? null;
        r.timestamp = blk?.timestamp ?? null;
      } catch {
        /* ignore */
      }

      out.push(r);
    }

    out.sort((a, b) => (a.blockNumber ?? 0) - (b.blockNumber ?? 0));
    return out;
  }

  /** Normalise les "args" d'un event/tx en tableau JS simple */
  private normalizeArgs(args: any): any[] {
    if (!args) return [];
    const arr = Array.isArray(args) ? args : Object.values(args);
    return arr.map((v: any) => (typeof v === 'bigint' ? Number(v) : v));
  }
}
