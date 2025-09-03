import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Recréation d'__dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Injectable()
export class IpfsService {
  private storageDir: string;

  constructor() {
    // Dossier de stockage "IPFS" simulé
    // - si IPFS_STORE_DIR est défini :
    //   * absolu -> utilisé tel quel
    //   * relatif -> résolu depuis process.cwd()
    // - sinon, on garde le comportement initial : ../../ipfs-storage par rapport à ce fichier
    const configured = process.env.IPFS_STORE_DIR;
    const defaultDir = path.resolve(__dirname, '../../ipfs-storage');
    this.storageDir = configured
      ? path.isAbsolute(configured)
        ? configured
        : path.resolve(process.cwd(), configured)
      : defaultDir;

    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  // Stocker un objet JSON, retourner un hash (CID simulé)
  storeJSON(jsonObj: unknown): string {
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    // Calcul d’un hash SHA-256 du contenu JSON
    const hash = createHash('sha256').update(jsonStr).digest('hex');
    const filename = path.join(this.storageDir, `${hash}.json`);
    fs.writeFileSync(filename, jsonStr, 'utf8');
    return hash;
  }

  // Stocker un fichier binaire (ex: PDF), retourner un hash
  storeFile(filePath: string): string {
    const content = fs.readFileSync(filePath);
    const hash = createHash('sha256').update(content).digest('hex');
    const ext = path.extname(filePath) || '.bin';
    const filename = path.join(this.storageDir, `${hash}${ext}`);
    fs.writeFileSync(filename, content);
    return hash;
  }

  // Récupérer (lire) un fichier JSON à partir du hash
  retrieveJSON(hash: string): any {
    const filename = path.join(this.storageDir, `${hash}.json`);
    if (!fs.existsSync(filename)) {
      throw new Error('File not found in IPFS storage simulation');
    }
    const content = fs.readFileSync(filename, 'utf8');
    return JSON.parse(content);
  }
}
