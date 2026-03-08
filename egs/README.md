# Contagion EGS Minigame

Minimal [Embeddable Game Standard](https://docs.provable.games/embeddable-game-standard) contract for Contagion. Implements `IMinigameTokenData` (score, game_over) so sessions can be minted and tracked via the shared Denshokan Token and Registry on Sepolia.

## Build

```bash
cd egs && scarb build
```

Requires Scarb with Cairo 2.8 / Starknet 2.15 (separate from the Dojo `contracts/` package).

## Contract

- **report_result(token_id, score)** — Call when a Contagion game ends. Requires `token_id` to be owned by the caller (mint via [Denshokan Token](https://docs.provable.games/embeddable-game-standard/architecture#deployed-contracts) first). Updates score and game_over on-chain and syncs to the token contract via `post_action`.
- **score(token_id)** / **game_over(token_id)** — Read by the token contract and indexer.

## Deploy & Register

**1. Deploy** (from repo root; requires starkli and an account with STRK for gas):

```bash
export EGS_DEPLOYER_PRIVATE_KEY=0x...   # your deployer private key
./scripts/egs-deploy-sepolia.sh
```

**2. Register** with the [MinigameRegistry](https://sepolia.voyager.online/contract/0x040f1ed9880611bb7273bf51fd67123ebbba04c282036e2f81314061f6f9b1a1) so Contagion appears in the EGS Games section. Use the client script (correct Option/ByteArray encoding via starknet.js). From the **client** directory:

```bash
EGS_DEPLOYER_PRIVATE_KEY=0x... pnpm run egs:register
```

Use the same key as for deploy. Optional env: `EGS_GAME_ADDRESS`, `EGS_CREATOR_ADDRESS`, `VITE_RPC_URL`.

**Deployed (Sepolia):** `0x00afdc03274b847d6a006272632464b66fe6ac217879e3c3fdec53578e5145a0` — run the register step once so the game is in the registry and the minigame token address is set.
