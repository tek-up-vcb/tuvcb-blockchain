import keccak256 from "keccak256";

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

function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: null, layers: [] };

  let layer = leaves.map((h) => ({ hash: h }));
  const layers = [layer];

  while (layer.length > 1) {
    const nextLayer = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] || layer[i];
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

export function processDiplomas(diplomas) {
  const hashes = diplomas.map(hashDiploma);
  const tree = buildMerkleTree(hashes);

  return diplomas.map((_, i) => {
    return {
      hash: "0x" + hashes[i],
      root: "0x" + tree.root,
      proof: getMerkleProofWithPosition(tree, hashes[i]),
      ipfs: `ipfs://simulated/QmFakeHash${i}`,
    };
  });
}
