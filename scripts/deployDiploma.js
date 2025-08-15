const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");

async function deployDiplomaContract(deployer, merkleRoot = ethers.constants.HashZero) {
  const source = fs.readFileSync(path.join(__dirname, "../contracts/DiplomaContract.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "DiplomaContract.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts["DiplomaContract.sol"]["DiplomaContract"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  const factory = new ethers.ContractFactory(abi, bytecode, deployer);
  const instance = await factory.deploy(merkleRoot);
  await instance.deployed();
  return instance;
}

module.exports = { deployDiplomaContract };
