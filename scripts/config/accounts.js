async function getSigners(provider) {
  const accounts = await provider.listAccounts();
  const deployer = provider.getSigner(accounts[0]);
  const user = provider.getSigner(accounts[1]);
  return { accounts, deployer, user };
}

module.exports = { getSigners };
