// scripts/blockchainSimulation.js
const { ethers } = require("ethers");
const { createIpfsClient, addJson, getJson } = require("./ipfsClient");
const { deployDiplomaContract } = require("./deployDiploma");

async function main() {
  // 1) Provider & comptes (Hardhat local par défaut)
  const providerUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const accounts = await provider.listAccounts();

  const deployer = provider.getSigner(accounts[0]);
  const user = provider.getSigner(accounts[1]);

  console.log("Deployer:", accounts[0]);
  console.log("User:", accounts[1]);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());
  console.log("User balance:", (await user.getBalance()).toString());

  // 2) Transfert 1 ETH (juste pour la démo)
  console.log("\nSending 1 ETH from deployer to user...");
  const tx = await deployer.sendTransaction({
    to: accounts[1],
    value: ethers.utils.parseEther("1"),
  });
  await tx.wait();

  console.log(
    "Deployer balance after:",
    (await deployer.getBalance()).toString()
  );
  console.log("User balance after:", (await user.getBalance()).toString());

  // 3) Connexion IPFS HTTP client -> Kubo daemon
  const ipfs = await createIpfsClient();
  // ping rapide
  try {
    const ver = await ipfs.version(); // ne parse pas des multiaddrs
    console.log("IPFS API OK:", ver.version);
  } catch (e) {
    console.error(
      "❌ API IPFS injoignable sur 127.0.0.1:5001 ? (ou Docker arrêté)"
    );
    throw e;
  }

  // 4) Déploiement du contrat "Diploma" (ou récupère l’instance si déjà déployé)
  const diploma = await deployDiplomaContract(deployer);
  console.log("DiplomaContract deployed at:", diploma.address);

  // 5) Création & upload du diplôme sur IPFS
  const diplomaObject = {
    name: "student1",
    degree: "Blockchain 101",
    year: 2024,
  };

  const cid = await addJson(ipfs, diplomaObject); // inclut un pin côté nœud
  const ipfsLink = `ipfs://${cid.toString()}`;
  console.log("CID:", cid.toString());
  console.log("Gateway:", `http://127.0.0.1:8080/ipfs/${cid.toString()}`);

  // 6) Enregistrement on-chain (stocke la référence immuable)
  const leaf = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(diplomaObject.name)
  );
  const regTx = await diploma.registerDiploma(leaf, ipfsLink);
  await regTx.wait();
  console.log("Diploma registered with IPFS:", ipfsLink);

  // 7) Lecture on-chain & récupération off-chain depuis IPFS
  const stored = await diploma.getDiplomaIpfs(leaf);
  console.log("Stored IPFS on-chain:", stored);

  const retrieved = await getJson(ipfs, cid);
  console.log("Retrieved from IPFS:", retrieved);

  // ⚠️ Ne PAS appeler ipfs.stop() ici : c’est un client HTTP vers le daemon
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
