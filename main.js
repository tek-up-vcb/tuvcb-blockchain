const { ethers } = require("ethers");
const { getProvider } = require("./scripts/config/provider");
const { getSigners } = require("./scripts/config/accounts");
const { deployDiploma } = require("./scripts/contracts/deployDiploma");
const {
  registerDiploma,
  getDiplomaIpfs,
} = require("./scripts/contracts/interactDiploma");

async function main() {
  const provider = getProvider("http://127.0.0.1:8545");
  const { accounts, deployer, user } = await getSigners(provider);

  console.log("Deployer:", accounts[0]);
  console.log("User    :", accounts[1]);
  console.log("Deployer balance:", (await deployer.getBalance()).toString());
  console.log("User balance    :", (await user.getBalance()).toString());

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
  console.log("User balance after    :", (await user.getBalance()).toString());

  console.log("\nDeploying DiplomaContract...");
  const diploma = await deployDiploma(deployer);
  console.log("DiplomaContract deployed at:", diploma.address);

  console.log("\nRegistering diploma...");
  const leaf = await registerDiploma(diploma, "student1", "ipfs://exampleHash");
  console.log("Diploma registered, leaf:", leaf);

  const stored = await getDiplomaIpfs(diploma, leaf);
  console.log("Stored IPFS:", stored);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
