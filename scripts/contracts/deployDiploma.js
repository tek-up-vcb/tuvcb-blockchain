const { ethers } = require("ethers");
const { compileSolidity } = require("../compiler/compileSol");

async function deployDiploma(deployer, merkleRoot = ethers.constants.HashZero) {
  const { abi, bytecode } = compileSolidity("DiplomaContract.sol", "DiplomaContract");
  const factory = new ethers.ContractFactory(abi, bytecode, deployer);
  const contract = await factory.deploy(merkleRoot);
  await contract.deployed();
  return contract;
}

module.exports = { deployDiploma };
