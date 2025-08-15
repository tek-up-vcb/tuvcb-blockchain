const IPFS = require("ipfs");
// Polyfill Promise.withResolvers() pour Node <20.17
if (typeof Promise.withResolvers !== "function") {
  Object.defineProperty(Promise, "withResolvers", {
    value: function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    },
    configurable: true,
  });
}

// Puis le reste de ton code IPFS…

(async () => {
  const ipfs = await IPFS.create();
  const { cid } = await ipfs.add("Hello IPFS !");
  console.log("CID :", cid.toString());
  for await (const chunk of ipfs.cat(cid)) process.stdout.write(chunk);
  await ipfs.stop();
})();
