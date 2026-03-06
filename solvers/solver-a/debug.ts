/**
 * Debug script: Test DeepBook midPrice using SuiGrpcClient
 * (Official approach from deepbook examples)
 */

import { SuiGrpcClient } from "@mysten/sui/grpc";
import { deepbook } from "@mysten/deepbook-v3";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const SOLVER_PRIVATE_KEY = process.env.SOLVER_PRIVATE_KEY || "";
const NETWORK: "mainnet" | "testnet" = "testnet";

const GRPC_URLS = {
  mainnet: "https://fullnode.mainnet.sui.io:443",
  testnet: "https://fullnode.testnet.sui.io:443",
};

async function main() {
  console.log("[DEBUG] Testing midPrice with SuiGrpcClient...\n");

  // 1. Setup keypair & address
  const { scheme, secretKey } = decodeSuiPrivateKey(SOLVER_PRIVATE_KEY);
  if (scheme !== "ED25519") throw new Error("Unsupported key scheme");
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const address = keypair.toSuiAddress();
  console.log(`[DEBUG] Solver address: ${address}\n`);

  // 2. Create SuiGrpcClient + extend with deepbook (official approach)
  console.log("[DEBUG] Creating SuiGrpcClient + deepbook extension...");
  const client = new SuiGrpcClient({
    network: NETWORK,
    baseUrl: GRPC_URLS[NETWORK],
  }).$extend(deepbook({ address }));

  try {
    console.log("[DEBUG] Calling midPrice('DEEP_SUI')...");
    const price = await client.deepbook.midPrice("DEEP_SUI");
    console.log("[DEBUG] ✓ SUCCESS: midPrice =", price);
  } catch (err) {
    console.error("[DEBUG] ✗ FAILED:", (err as Error).message);
    console.error((err as Error).stack);
  }
}

main().catch(console.error);
