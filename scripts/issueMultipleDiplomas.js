const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const keccak256 = require("keccak256");

// Utilitaire pour hasher un JSON de manière déterministe
function hashDiploma(diploma) {
  const sorted = Object.keys(diploma)
    .sort()
    .reduce((obj, key) => {
      obj[key] = diploma[key];
      return obj;
    }, {});
  const str = JSON.stringify(sorted);
  return keccak256(str).toString("hex");
}

// Construction du Merkle Tree "manuellement" (sans lib externe)
function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: null, layers: [] };

  let layer = leaves.map((h) => ({ hash: h }));
  const layers = [layer];

  while (layer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] || layer[i]; // Duplicate last if odd
      const combined = Buffer.concat([
        Buffer.from(left.hash, "hex"),
        Buffer.from(right.hash, "hex"),
      ]);
      const newHash = keccak256(combined).toString("hex");
      nextLayer.push({ hash: newHash, left, right });
    }
    layer = nextLayer;
    layers.push(layer);
  }

  return {
    root: layer[0].hash,
    layers,
  };
}

// Récupère le Merkle proof d'un hash (avec ordre left/right)
function getMerkleProofWithPosition(tree, targetHash) {
  const proof = [];
  let index = tree.layers[0].findIndex((n) => n.hash === targetHash);
  if (index === -1) return proof;

  for (let i = 0; i < tree.layers.length - 1; i++) {
    const layer = tree.layers[i];
    const isRight = index % 2;
    const pairIndex = isRight ? index - 1 : index + 1;

    if (pairIndex < layer.length) {
      const sibling = layer[pairIndex];
      proof.push({
        position: isRight ? "left" : "right",
        hash: sibling.hash,
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

async function main() {
  // Lecture des 4 diplômes depuis le dossier data/
  const diplomaDir = path.join(__dirname, "../data");
  const diplomaFiles = fs
    .readdirSync(diplomaDir)
    .filter((f) => f.endsWith(".json"));

  const diplomas = diplomaFiles.map((f) => {
    const content = fs.readFileSync(path.join(diplomaDir, f));
    return JSON.parse(content);
  });

  // Hash des diplômes
  const diplomaHashes = diplomas.map(hashDiploma);

  // Construction de l'arbre de Merkle
  const merkleTree = buildMerkleTree(diplomaHashes);

  // Simulation de l'upload sur IPFS
  diplomas.forEach((diploma, index) => {
    const diplomaHash = diplomaHashes[index];
    const merkleProof = getMerkleProofWithPosition(merkleTree, diplomaHash);
    const ipfsSimulated = `ipfs://simulated/QmFakeHash${index}`;

    const fullObject = {
      diplomaHash: "0x" + diplomaHash,
      merkleRoot: "0x" + merkleTree.root,
      merkleProof,
      ipfs: ipfsSimulated,
    };

    console.log(`\nDiplôme #${index + 1} :`);
    console.log(JSON.stringify(fullObject, null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
