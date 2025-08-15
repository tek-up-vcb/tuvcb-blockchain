// scripts/ipfsClient.js (CommonJS + import ESM)
async function createIpfsClient() {
  const { create } = await import("ipfs-http-client");
  // adapte si ton API n'est pas en local
  return create({
    url: process.env.IPFS_API_URL || "http://127.0.0.1:5001/api/v0",
  });
}

async function addJson(ipfs, obj) {
  const { cid } = await ipfs.add(JSON.stringify(obj));
  // pin pour la persistance sur le daemon
  await ipfs.pin.add(cid);
  return cid;
}

async function getJson(ipfs, cid) {
  let out = "";
  for await (const chunk of ipfs.cat(cid)) out += Buffer.from(chunk).toString();
  return JSON.parse(out);
}

module.exports = { createIpfsClient, addJson, getJson };
