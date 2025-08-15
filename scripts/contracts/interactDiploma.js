const { ethers } = require("ethers");

async function registerDiploma(contract, leafUtf8, ipfsUri) {
  const leaf = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(leafUtf8));
  const tx = await contract.registerDiploma(leaf, ipfsUri);
  await tx.wait();
  return leaf;
}

async function getDiplomaIpfs(contract, leaf) {
  return await contract.getDiplomaIpfs(leaf);
}

module.exports = { registerDiploma, getDiplomaIpfs };
