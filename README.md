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
