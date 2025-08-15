const path = require("path");
const rootDir = path.resolve(__dirname, "..", "..");
const contractsDir = path.join(rootDir, "contracts");
module.exports = { rootDir, contractsDir };
