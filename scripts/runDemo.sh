#!/bin/bash
set -euo pipefail

# Install dependencies if needed
npm install

# Start a local Hardhat node in the background
npx hardhat node &
NODE_PID=$!
# Allow the node time to start
sleep 3

# Run the blockchain simulation script against the local node
node scripts/blockchainSimulation.js

# Stop the Hardhat node
kill $NODE_PID
