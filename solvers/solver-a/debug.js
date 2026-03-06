/**
 * Debug script: Test DeepBook midPrice in isolation
 */
import { DeepBookClient, testnetPools, mainnetPools, } from "@mysten/deepbook-v3";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
const SOLVER_PRIVATE_KEY = process.env.SOLVER_PRIVATE_KEY || "";
const NETWORK = "testnet";
async function main() {
    console.log("[DEBUG] Starting midPrice test...\n");
    // 1. Setup keypair & address
    const { scheme, secretKey } = decodeSuiPrivateKey(SOLVER_PRIVATE_KEY);
    if (scheme !== "ED25519")
        throw new Error("Unsupported key scheme");
    const keypair = Ed25519Keypair.fromSecretKey(secretKey);
    const address = keypair.toSuiAddress();
    console.log(`[DEBUG] Solver address: ${address}\n`);
    // 2. Create client WITHOUT monkey-patch first
    const suiClient = new SuiJsonRpcClient({
        url: getJsonRpcFullnodeUrl(NETWORK),
        network: NETWORK,
    });
    // 3. Create DeepBook client WITHOUT pools
    console.log("[DEBUG] Test 1: Creating DeepBookClient (no pools)...");
    let dbClient = new DeepBookClient({
        address,
        network: NETWORK,
        client: suiClient,
    });
    try {
        console.log("[DEBUG] Calling midPrice('DEEP_SUI')...");
        const price = await dbClient.midPrice("DEEP_SUI");
        console.log("[DEBUG] ✓ SUCCESS (no pools): midPrice =", price);
    }
    catch (err) {
        console.error("[DEBUG] ✗ FAILED (no pools):", err.message);
    }
    // 4. Try WITH pools
    console.log("\n[DEBUG] Test 2: Creating DeepBookClient (WITH pools)...");
    const poolMap = NETWORK === "testnet" ? testnetPools : mainnetPools;
    dbClient = new DeepBookClient({
        address,
        network: NETWORK,
        client: suiClient,
        pools: poolMap,
    });
    try {
        console.log("[DEBUG] Calling midPrice('DEEP_SUI')...");
        const price = await dbClient.midPrice("DEEP_SUI");
        console.log("[DEBUG] ✓ SUCCESS (with pools): midPrice =", price);
    }
    catch (err) {
        console.error("[DEBUG] ✗ FAILED (with pools):", err.message);
    }
    // 5. Try WITH monkey-patch
    console.log("\n[DEBUG] Test 3: Applying monkey-patch to simulateTransaction...");
    const _origSim = suiClient.core.simulateTransaction.bind(suiClient.core);
    suiClient.core.simulateTransaction = async (opts) => {
        if (opts.transaction &&
            typeof opts.transaction.setSenderIfNotSet === "function") {
            opts.transaction.setSenderIfNotSet(address);
        }
        return _origSim(opts);
    };
    dbClient = new DeepBookClient({
        address,
        network: NETWORK,
        client: suiClient,
        pools: poolMap,
    });
    try {
        console.log("[DEBUG] Calling midPrice('DEEP_SUI') with monkey-patch...");
        const price = await dbClient.midPrice("DEEP_SUI");
        console.log("[DEBUG] ✓ SUCCESS (with monkey-patch): midPrice =", price);
    }
    catch (err) {
        console.error("[DEBUG] ✗ FAILED (with monkey-patch):", err.message);
    }
}
main().catch(console.error);
