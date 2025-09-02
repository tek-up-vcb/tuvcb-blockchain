# API Routes

| Module     | Method | Path                    | Description                                                                                |
| ---------- | ------ | ----------------------- | ------------------------------------------------------------------------------------------ |
| App        | GET    | `/`                     | Retourne un message de bienvenue.                                                          |
| Wallets    | POST   | `/wallets`              | Crée un portefeuille utilisateur et le crédite de 10 ETH.                                  |
| Wallets    | GET    | `/wallets`              | Liste tous les portefeuilles créés.                                                        |
| Diplomas   | POST   | `/diplomas/issue`       | Publie un diplôme pour un utilisateur (`userId`, `diplomaData`).                           |
| Diplomas   | POST   | `/diplomas/transfer`    | Transfère un diplôme (`diplomaId`) d'un utilisateur à un autre (`fromUserId`, `toUserId`). |
| Diplomas   | GET    | `/diplomas/:id/history` | Historique des événements du diplôme `id`.                                                 |
| Diplomas   | GET    | `/diplomas/tx/:hash`    | Détails d'une transaction `hash`.                                                          |
| Diplomas   | GET    | `/diplomas/block/:ref`  | Détails d'un bloc par numéro ou hash (`ref`).                                              |
| Diplomas   | GET    | `/diplomas/all`         | Liste tous les diplômes (paramètre `includeData=true` pour inclure les données IPFS).      |
| Diplomas   | GET    | `/diplomas/:id`         | Récupère un diplôme par son identifiant.                                                   |
| Diplomas   | GET    | `/diplomas`             | Exemple simple renvoyant le premier diplôme s'il existe.                                   |
| Simulation | POST   | `/simulation`           | Lance une simulation de blockchain.                                                        |
