const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { contractsDir } = require("../utils/paths");

function compileSolidity(filename, contractName) {
  const sourcePath = path.join(contractsDir, filename);
  const source = fs.readFileSync(sourcePath, "utf8");

  const input = {
    language: "Solidity",
    sources: { [filename]: { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors && output.errors.some(e => e.severity === "error")) {
    const errs = output.errors.filter(e => e.severity === "error").map(e => e.formattedMessage).join("\n");
    throw new Error(`Compilation failed:\n${errs}`);
  }

  const artifact = output.contracts[filename][contractName];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

module.exports = { compileSolidity };
