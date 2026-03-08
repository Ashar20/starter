// -- Dojo Config --
// Loads the deploy manifest (contract addresses, world address) and constructs URLs.

import { createDojoConfig } from "@dojoengine/core";
import manifestDev from "./manifest_dev.json";
import manifestSepolia from "./manifest_sepolia.json";

// Use Sepolia manifest by default; override with VITE_DOJO_ENV=dev for local Katana.
const isDev = import.meta.env.VITE_DOJO_ENV === "dev";
const manifest = isDev ? manifestDev : manifestSepolia;

export const dojoConfig = createDojoConfig({ manifest });

// Points to the Starknet node. VITE_ env vars override for deployment.
export const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? (isDev ? dojoConfig.rpcUrl : "https://api.cartridge.gg/x/starknet/sepolia");

export const TORII_URL =
  import.meta.env.VITE_TORII_URL ?? dojoConfig.toriiUrl;
