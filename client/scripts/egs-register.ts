/**
 * Call the EGS Contagion contract's initializer to register with MinigameRegistry.
 * Uses starknet.js for correct Option/ByteArray encoding.
 *
 * Run from client: pnpm run egs:register
 *
 * Env:
 *   EGS_DEPLOYER_PRIVATE_KEY (hex, with 0x)
 *   EGS_GAME_ADDRESS (default: deployed 0x00afdc...)
 *   VITE_RPC_URL or RPC_URL (optional, default Sepolia)
 */
import {
  RpcProvider,
  Account,
  CallData,
  CairoOption,
  CairoOptionVariant,
} from "starknet";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname =
  typeof import.meta.dir !== "undefined"
    ? import.meta.dir
    : dirname(fileURLToPath(import.meta.url));

const RPC =
  process.env.VITE_RPC_URL ??
  process.env.RPC_URL ??
  "https://starknet-sepolia-rpc.publicnode.com";
const GAME_ADDRESS =
  process.env.EGS_GAME_ADDRESS ??
  "0x00afdc03274b847d6a006272632464b66fe6ac217879e3c3fdec53578e5145a0";
const DENSOKAN_TOKEN =
  "0x0142712722e62a38f9c40fcc904610e1a14c70125876ecaaf25d803556734467";
const CREATOR =
  process.env.EGS_CREATOR_ADDRESS ??
  "0x069c57ba0814d68fd488621927bd297d317cb0fc2ab91107cc5409812fa268c7";

const privateKey = process.env.EGS_DEPLOYER_PRIVATE_KEY;
if (!privateKey?.startsWith("0x")) {
  console.error("Set EGS_DEPLOYER_PRIVATE_KEY (hex with 0x)");
  process.exit(1);
}

async function main() {
  const provider = new RpcProvider({ nodeUrl: RPC });
  const account = new Account({
    provider,
    address: CREATOR,
    signer: privateKey as `0x${string}`,
  });

  const repoRoot = join(__dirname, "..", "..");
  const artifactPath = join(
    repoRoot,
    "egs",
    "target",
    "dev",
    "contagion_egs_ContagionEgs.contract_class.json",
  );
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
  const abi = artifact.abi;

  const args = {
    game_creator: CREATOR,
    game_name: "Contagion",
    game_description:
      "Multiplayer infection game. Survive, collect cure fragments, and vote out the infected.",
    game_developer: "Dojo",
    game_publisher: "Dojo",
    game_genre: "Social Deduction",
    game_image: "",
    game_color: new CairoOption(CairoOptionVariant.None),
    client_url: new CairoOption(
      CairoOptionVariant.Some,
      "https://localhost:3000",
    ),
    renderer_address: new CairoOption<string>(CairoOptionVariant.None),
    settings_address: new CairoOption<string>(CairoOptionVariant.None),
    objectives_address: new CairoOption<string>(CairoOptionVariant.None),
    minigame_token_address: DENSOKAN_TOKEN,
    royalty_fraction: new CairoOption<bigint>(CairoOptionVariant.None),
    skills_address: new CairoOption<string>(CairoOptionVariant.None),
    version: 1n,
  };

  const callData = new CallData(abi);
  const calldata = callData.compile("initializer", args);

  console.log("Calling initializer on", GAME_ADDRESS);
  const { transaction_hash } = await account.execute({
    contractAddress: GAME_ADDRESS,
    entrypoint: "initializer",
    calldata,
  });
  console.log("Tx hash:", transaction_hash);
  console.log("Waiting for receipt...");
  await provider.waitForTransaction(transaction_hash);
  console.log("Done. Contagion is registered with MinigameRegistry.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
