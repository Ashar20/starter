#!/usr/bin/env bash
# Deploy EGS Contagion minigame to Starknet Sepolia and register with MinigameRegistry.
#
# Prerequisites:
#   - starkli in PATH (e.g. ~/.starkli/bin)
#   - Account with STRK/ETH for gas (Sepolia faucet: https://faucet.starknet.io)
#   - EGS contract built: cd egs && scarb build
#
# Usage:
#   export EGS_DEPLOYER_PRIVATE_KEY=0x...   # optional; else set in script or use keystore
#   ./scripts/egs-deploy-sepolia.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
export PATH="${HOME}/.starkli/bin:${PATH}"

# Prefer PublicNode or Blast if dRPC is flaky
RPC="${STARKNET_RPC:-https://starknet-sepolia-rpc.publicnode.com}"
ACCOUNT="${STARKNET_ACCOUNT:-$REPO_ROOT/.starknet-sepolia/account.json}"
PRIVATE_KEY="${EGS_DEPLOYER_PRIVATE_KEY:-0x0058fbbb54ad6282deb91ce8b6a6142eea3b62352926e97ad99e5e4897b3068f}"
SIERRA="$REPO_ROOT/egs/target/dev/contagion_egs_ContagionEgs.contract_class.json"

# Sepolia EGS addresses (from https://docs.provable.games/embeddable-game-standard/architecture)
DENSOKAN_TOKEN="0x0142712722e62a38f9c40fcc904610e1a14c70125876ecaaf25d803556734467"
CREATOR_ADDRESS="0x069c57ba0814d68fd488621927bd297d317cb0fc2ab91107cc5409812fa268c7"

if [[ ! -f "$SIERRA" ]]; then
  echo "Building EGS contract..."
  (cd egs && scarb build)
fi

echo "Declaring ContagionEgs on Sepolia..."
# Use network-expected CASM hash to avoid "Mismatch compiled class hash" (starkli compiler vs sequencer)
CASM_HASH="0x1074ff361c21a6318b3509da916d3d15eb5fc54d49115117749a6103f2e181c"
DECLARE_OUT=$(starkli declare "$SIERRA" --rpc "$RPC" --account "$ACCOUNT" --private-key "$PRIVATE_KEY" --casm-hash "$CASM_HASH" -w 2>&1) || true
CLASS_HASH=$(echo "$DECLARE_OUT" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)
if [[ -z "$CLASS_HASH" ]]; then
  echo "Declaration failed. (Account may need STRK for gas, or try another RPC.)"
  echo "$DECLARE_OUT"
  exit 1
fi
echo "Declared class hash: $CLASS_HASH"

echo "Deploying ContagionEgs..."
DEPLOY_OUT=$(starkli deploy "$CLASS_HASH" --rpc "$RPC" --account "$ACCOUNT" --private-key "$PRIVATE_KEY" -w 2>&1)
GAME_ADDRESS=$(echo "$DEPLOY_OUT" | grep -oE '0x[0-9a-fA-F]{64}' | tail -1)
if [[ -z "$GAME_ADDRESS" ]]; then
  echo "Deploy failed."
  echo "$DEPLOY_OUT"
  exit 1
fi
echo "Deployed game at: $GAME_ADDRESS"
echo ""
echo "Register with MinigameRegistry (from client directory, same EGS_DEPLOYER_PRIVATE_KEY):"
echo "  cd client && EGS_DEPLOYER_PRIVATE_KEY=0x... pnpm run egs:register"
echo ""
echo "Done. Game contract: $GAME_ADDRESS"
