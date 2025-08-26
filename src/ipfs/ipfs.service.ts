import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class IpfsService {
  private storageDir = path.join(__dirname, '../../ipfs-storage');

  constructor() {
    // S'assurer que le dossier de stockage existe
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  // Stocker un objet JSON, retourner un hash (CID simulé)
  storeJSON(jsonObj: any): string {
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    // Calculer un hash SHA-256 du contenu JSON
    const hash = createHash('sha256').update(jsonStr).digest('hex');
    // Pour simuler un CID IPFS style base58, on pourrait encoder différemment,
    // mais un hex suffira pour l'unicité.
    const filename = `${hash}.json`;
    fs.writeFileSync(path.join(this.storageDir, filename), jsonStr);
    return hash;
  }

  // Récupérer (lire) un fichier JSON à partir du hash
  retrieveJSON(hash: string): any {
    const filename = path.join(this.storageDir, `${hash}.json`);
    if (!fs.existsSync(filename)) {
      throw new Error('File not found in IPFS storage simulation');
    }
    const content = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(content);
  }
}
