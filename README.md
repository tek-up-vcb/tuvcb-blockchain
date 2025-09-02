# tuvcb-blockchain

Service NestJS minimal pour interaction avec le smart‑contract `DiplomaRegistry`.

## Fonctionnalités actives
* Déploiement d'un contrat Registry (`POST /blockchain/registry/deploy`)
* Configuration d'une adresse de contrat existante (`POST /blockchain/registry/set-address`)
* Emission en lot de diplômes (hashes) (`POST /blockchain/registry/issue`)
* Lecture des évènements par batch (`GET /blockchain/registry/events/:batchId`)
* Lecture de tous les évènements `DiplomaIssued` (via `GET /diplomas/events` supprimé si le contrôleur n'est plus nécessaire)

## Nettoyage IPFS
La logique IPFS et la simulation associée ont été retirées. Si vous voyez encore des erreurs de build mentionnant `ipfs` ou des méthodes comme `issueDiplomaFrom`, assurez‑vous d'avoir:
1. Supprimé le dossier `src/simulation` (fait dans ce repo).
2. Supprimé tout contrôleur obsolète (`diploma.controller.ts`).
3. Rebuildé l'image Docker sans cache: `docker compose build --no-cache tuvcb-blockchain`.

## Variables d'environnement principales
```
RPC_URL=http://hardhat:8545
PRIVATE_KEY=0x.... (clé pour signer)
DIPLOMA_ADDRESS=0x... (optionnel si contrat déjà déployé)
```

## Flux type
1. (Optionnel) Déployer: `POST /blockchain/registry/deploy` -> retourne `address`.
2. (Sinon) Fixer l'adresse existante: `POST /blockchain/registry/set-address { address }`.
3. Emettre un lot: `POST /blockchain/registry/issue { batchId, diplome, hashes }` où `hashes` est un tableau de hex (préfixe 0x optionnel).
4. Consulter évènements: `GET /blockchain/registry/events/:batchId`.

## Artifacts
Les artifacts Hardhat nécessaires sont copiés dans l'image Docker à partir de `src/Blockchain/artifacts`.

## Développement local
Lancer Hardhat séparément (ex: `npx hardhat node`) puis `npm run start:dev`.

## Tests
A compléter (aucun test spécifique au service blockchain pour l'instant).

---
Ce fichier a été mis à jour pour refléter l'abandon d'IPFS.
# TUV-CB Blockchain

Cette application combine **Hardhat** et **NestJS** pour émettre, transférer et
consulter des diplômes stockés sur une blockchain locale. Les données des
diplômes sont sérialisées dans un stockage IPFS simulé.

## Structure du projet

- `hardhat.config.ts` – configuration Hardhat avec les sources Solidity dans
  `src/Blockchain/contracts` et les artefacts générés dans
  `src/Blockchain/artifacts`.
- `src/main.ts` – point d'entrée de l'application NestJS.
- `src/app.module.ts` – enregistre les contrôleurs et services principaux.
- `src/Blockchain/blockchain.service.ts` – initialise le provider, déploie le
  contrat `DiplomaRegistry` et expose des méthodes pour émettre, transférer et
  lire des diplômes.
- `src/Blockchain/contracts/Diploma.sol` – contrat Solidity gérant la
  délivrance et la propriété des diplômes.
- `src/wallets/wallet.service.ts` & `src/wallets/wallet.controller.ts` –
  création de portefeuilles utilisateurs et endpoints REST associés.
- `src/diploma/diploma.controller.ts` – routes REST pour émettre, transférer et
  consulter les diplômes.
- `src/ipfs/ipfs.service.ts` – stockage local simulant IPFS pour les données de
  diplômes.
- `test/Counter.ts` – tests Hardhat d'exemple.
- `test/app.e2e-spec.ts` – test e2e de l'API NestJS.

## Installation

```bash
npm install
```

## Contrat DiplomaRegistry (événements uniquement)

Le service expose un contrat `DiplomaRegistry` qui émet un event `DiplomaIssued(batchId, diplome, diplomaHash, timestamp)` pour chaque diplôme d'un batch.

### Routes HTTP

Base: `http://localhost:3000/registry`

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /registry/deploy | Déploie le contrat et renvoie son adresse |
| POST | /registry/set-address | Définit une adresse existante déjà déployée `{ address }` |
| POST | /registry/issue | Émet les events pour un batch `{ batchId, diplome, hashes[] }` |
| GET | /registry/events/:batchId | Récupère les events `DiplomaIssued` pour un batch |
| GET | /registry/address | Adresse courante configurée |

### Exemples cURL

Déploiement du contrat:

```bash
curl -X POST http://localhost:3000/registry/deploy
```

Définir manuellement une adresse existante:

```bash
curl -X POST http://localhost:3000/registry/set-address \
  -H "Content-Type: application/json" \
  -d '{"address":"0x1234..."}'
```

Émettre un batch de diplômes:

```bash
curl -X POST http://localhost:3000/registry/issue \
  -H "Content-Type: application/json" \
  -d '{
    "batchId":"2025-ING-1",
    "diplome":"Ingenieur Informatique",
    "hashes":[
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    ]
  }'
```

Lister les events d'un batch:

```bash
curl http://localhost:3000/registry/events/2025-ING-1
```

Réponse type:

```json
[
  {
    "txHash": "0x...",
    "blockNumber": 12,
    "batchId": "2025-ING-1",
    "diplome": "Ingenieur Informatique",
    "diplomaHash": "0xaaaaaaaa...",
    "timestamp": 1735859200
  }
]
```

## Compilation des contrats

```bash
npx hardhat compile
```

## Lancement de l'environnement de développement

1. Démarrer un nœud local :

```bash
npx hardhat node
```

2. Lancer l'API :

```bash
npm run start:dev
```

Le service écoute par défaut sur `http://localhost:3000`.

## API principale

### Wallets

- `POST /wallets` : crée un portefeuille et le crédite en ETH de test.
- `GET /wallets` : liste des portefeuilles existants.

### Diplômes

- `POST /diplomas/issue` : émet un diplôme depuis l'id d'un wallet et des
  données JSON (`{ userId, diplomaData }`).
- `POST /diplomas/transfer` : transfère un diplôme vers un autre wallet
  (`{ fromUserId, toUserId, diplomaId }`).
- `GET /diplomas/:id` : récupère les informations on-chain et off-chain d'un
  diplôme.

## Variables d'environnement

- `RPC_URL` : URL du nœud Ethereum (défaut `http://127.0.0.1:8545`).
- `DEPLOYER_PK` : clé privée du compte déployeur. Sinon un wallet aléatoire est
  financé automatiquement.
- `DIPLOMA_ADDRESS` : adresse d'un contrat `DiplomaRegistry` déjà déployé.
- `IPFS_STORE_DIR` : dossier pour stocker les fichiers JSON simulant IPFS.
- `PORT` : port HTTP pour l'API NestJS.

## Tests

```bash
npm test
npx hardhat test
```
