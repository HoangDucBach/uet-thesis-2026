import { testnetPools, mainnetPools } from "@mysten/deepbook-v3";

console.log("=== TESTNET POOLS ===");
console.log(JSON.stringify(testnetPools, null, 2));

console.log("\n=== MAINNET POOLS ===");
console.log(JSON.stringify(mainnetPools, null, 2));
