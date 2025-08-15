# Blockchain Simulation with Hardhat

This project demonstrates how to simulate and interact with a blockchain using Hardhat. It covers running a local node, creating accounts, sending transactions, deploying a contract, and ideas for autonomous behaviors.

## 1. Réseau local ou testnet

- **Local Hardhat Network**: start a local blockchain with:
  ```bash
  npx hardhat node
  ```
- **Testnet (ex. Sepolia)**: configure the `networks` section in `hardhat.config.js` with a private key and an RPC URL.

## 2. Création de comptes

- On the local network, Hardhat automatically exposes several accounts (signers).
- On public networks or testnets, create accounts from a private key or mnemonic and fund them via a faucet.

## 3. Transactions

- Every interaction is a transaction: transferring ETH or invoking contract functions.
- Transactions must be signed by the sender's private key and are included in blocks by miners/validators.

## 4. Déploiement et interaction avec un contrat

1. Write the contract in Solidity.
2. Deploy and interact via scripts using Ethers.js and the local Hardhat node.
   The provided script compile le contrat à la volée avec `solc` puis le déploie :

   ```bash
   node scripts/blockchainSimulation.js
   ```

   This script also launches an in-memory IPFS node, uploads a sample diploma, and stores the resulting CID on-chain.

## 5. Contrats autonomes

- Contracts execute only when a transaction triggers them.
- To automate behavior, use external scripts or services (cron, keeper, oracles) that send transactions periodically.
- In tests, time and events can be simulated with Hardhat helpers such as `evm_increaseTime` and `evm_mine`.

## Commands to test

1. Install dependencies (if not already):
   ```bash
   npm install
   ```
2. Start a local node:
   ```bash
   npx hardhat node
   ```
3. In another terminal, run the demo script against the node:
   ```bash
   node scripts/blockchainSimulation.js
   ```

Or run all the above steps automatically with:

```bash
bash scripts/runDemo.sh
```

The script will show account balances, send an ETH transfer, compile and deploy `DiplomaContract`, then upload a diploma to IPFS, store its CID on-chain and retrieve the diploma content from IPFS.

0.  Prerequisites

    Node.js ≥ 20.12 (reco: 22.x)

        Fixes the Promise.withResolvers is not a function error.

    npm (or pnpm/yarn)

    Docker Desktop (optionnel mais recommandé pour Kubo)

    Hardhat (déjà dans le projet)

1.  Réseau local ou testnet

    Local Hardhat Network: start a local blockchain with:

    npx hardhat node

    Testnet (ex. Sepolia): configure the networks section in hardhat.config.js with a private key and an RPC URL.

2.  Création de comptes

    On the local network, Hardhat automatically exposes several accounts (signers).

    On public networks or testnets, create accounts from a private key or mnemonic and fund them via a faucet.

3.  Transactions

    Every interaction is a transaction: transferring ETH or invoking contract functions.

    Transactions must be signed by the sender's private key and are included in blocks by miners/validators.

4.  Déploiement et interaction avec un contrat

    Write the contract in Solidity.

    Deploy and interact via scripts using Ethers.js and the local Hardhat node:

    node scripts/blockchainSimulation.js

    This script connects to an external IPFS daemon (Kubo), uploads a sample diploma (JSON), stores the resulting CID on-chain, then retrieves the diploma content back from IPFS.

5.  Contrats autonomes

    Contracts execute only when a transaction triggers them.

    To automate behavior, use external scripts or services (cron, keeper, oracles) that send transactions periodically.

    In tests, time and events can be simulated with Hardhat helpers such as evm_increaseTime and evm_mine.

6.  IPFS — Overview & choices

TL;DR

    IPFS = content addressing (CID), not a blockchain.

    3 bricks: Kubo (ipfs), ipfs-core, ipfs-http-client.

    Recommended here: run Kubo daemon as a separate service, and talk to it from your app using ipfs-http-client.

Quick comparison
Library Type Role Network API/Gateway Persistence stop() Use-case
ipfs (Kubo/go-ipfs) System daemon Full node (DHT, Bitswap, pin, GC) Yes API: 5001, Gateway: 8080 Disk repo via service Prod, infra, pinning
ipfs-core In-process node (JS) Full node in your app Yes No HTTP API Ephemeral unless configured Yes PoC, tests, scripts
ipfs-http-client HTTP client Control an existing node No Uses node’s API N/A No Front/back talking to Kubo

Rule of thumb:
Need a standalone server? → Kubo.
App wants to just call an API? → ipfs-http-client to that Kubo.
PoC without infra? → ipfs-core (not used here). 7. IPFS Server (Kubo) — Install & Run
Option A — Docker (recommended)

docker run -d --name ipfs --restart unless-stopped `  -p 4001:4001 -p 5001:5001 -p 8080:8080`
-v C:\ipfs-data:/data/ipfs `
ipfs/kubo:latest

    API: http://127.0.0.1:5001

    Gateway: http://127.0.0.1:8080

    Data persisted in C:\ipfs-data

Option B — Native (Windows, PowerShell)

$Version = "v0.30.0"      # set the version you want
$Zip = "kubo\_${Version}_windows-amd64.zip"
$Url = "https://dist.ipfs.tech/kubo/$Version/$Zip"

Invoke-WebRequest -Uri $Url -OutFile "$env:TEMP\$Zip"
Expand-Archive "$env:TEMP\$Zip" -DestinationPath "$env:ProgramFiles\kubo" -Force

# Add to PATH (User)

$path = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $path.Contains("$env:ProgramFiles\kubo")) {
[Environment]::SetEnvironmentVariable("Path", $path + ";" + "$env:ProgramFiles\kubo", "User")
}
$env:Path += ";" + "$env:ProgramFiles\kubo"

ipfs version
ipfs init
ipfs daemon

(Optional) CORS for browser apps

ipfs shutdown
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET","POST","PUT"]'
ipfs daemon

8. Project code — IPFS client

Install the HTTP client:

npm i ipfs-http-client

    Note: ipfs-http-client@>=60 is ESM-only. In a CommonJS project, use a dynamic import.

Create \*\*scripts/ipfsClient.js
