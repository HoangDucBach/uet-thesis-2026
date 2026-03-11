/**
 * Solver A — CoW-First Matcher (Production Grade)
 *
 * Architecture:
 *   - Generic: works for ANY token pair, not hardcoded
 *   - CoW matching: greedy pair matching , maximize surplus
 *   - AMM fallback: unmatched intents routed via DeepBook v3 swap
 *   - Score = total surplus across entire batch
 *   - Capital: solver's OWN balance — no flashloans
 *
 * Settlement flow (own-balance):
 *
 *   Pre-execution:
 *     computeCoinsNeeded()  — gross token spend per type across all pairs/routes
 *     fetchSolverCoins()    — query solver's on-chain coin objects
 *     balance check         — skip if insufficient; guaranteed profitable by scoring
 *     buildCoinInputMap()   — wire coin objects into PTB (SUI - tx.gas, others - tx.object)
 *
 *   CoW pair (intentA: BASE-QUOTE, intentB: QUOTE-BASE):
 *     [coinForA] = splitCoins(masterQuoteCoin, payoutToA)
 *     [coinForB] = splitCoins(masterBaseCoin,  payoutToB)
 *     sellCoinA  = process_intent(intentA, coinForA)  // A receives QUOTE; solver gets A.sellAmount BASE
 *     sellCoinB  = process_intent(intentB, coinForB)  // B receives BASE;  solver gets B.sellAmount QUOTE
 *     transferObjects([sellCoinA, sellCoinB], solver)  // A.sellAmount > payoutToB - profit ✓
 *
 *   AMM route (intent: BASE-QUOTE via swap):
 *     [coinForUser] = splitCoins(masterQuoteCoin, estimatedOut)
 *     sellCoin      = process_intent(intent, coinForUser)     // user gets QUOTE; solver gets BASE
 *     [_, quoteBack, fees] = swapExactBaseForQuote(sellCoin)  // quoteBack ≥ estimatedOut (DEDUCTION)
 *     transferObjects([quoteBack, fees], solver)              // profit = quoteBack − estimatedOut ✓
 *
 *   Hybrid CoW+AMM (large=A, large sells BASE, small=B sells QUOTE):
 *     [coinForSmall] = splitCoins(masterBase, payoutToB)         // fund B's payout
 *     sellCoinSmall  = process_intent(B, coinForSmall)           // B gets BASE; solver gets B.sellAmount QUOTE
 *     [ammSuppCoin]  = splitCoins(masterQuote, ammSupplement)    // solver fronts AMM supplement
 *     mergeCoins(sellCoinSmall, [ammSuppCoin])                   // = payoutToA total QUOTE
 *     sellCoinLarge  = process_intent(A, sellCoinSmall)          // A gets QUOTE; solver gets A.sellAmount BASE
 *     [toSwap]       = splitCoins(sellCoinLarge, sellForSwap)    // A.sellAmount − payoutToB
 *     [_, quoteBack, fees] = swapExactBaseForQuote(toSwap)       // quoteBack ≥ ammSupplement (DEDUCTION)
 *     transferObjects([sellCoinLarge, quoteBack, fees], solver)  // break-even BASE + QUOTE profit ✓
 */

import {
  GrpcEventClient,
  type RelayEvent,
  type IntentCreatedPayload,
  type BatchOpenedPayload,
  type WinnerSelectedPayload,
} from "../shared/index.ts";
import {
  DEEP_METADATA,
  SUI_METADATA,
  DBUSDC_METADATA,
  DBUSDT_METADATA,
  WAL_METADATA,
  DBTC_METADATA,
} from "../shared/constants/coins.ts";
import { deepbook, mainnetPools, testnetPools } from "@mysten/deepbook-v3";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  Transaction,
  SerialTransactionExecutor,
} from "@mysten/sui/transactions";

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  GRPC_HOST: process.env.SUI_INDEXER_GRPC_HOST ?? "localhost",
  GRPC_PORT: Number(process.env.SUI_INDEXER_GRPC_PORT ?? 50051),
  NETWORK: (process.env.NETWORK ?? "testnet") as "testnet" | "mainnet",
  PACKAGE_ID: process.env.PACKAGE_ID!,
  GLOBAL_CONFIG_ID: process.env.GLOBAL_CONFIG_ID!,
  DEEPBOOK_REGISTRY_ID: process.env.DEEPBOOK_REGISTRY_ID,
  SOLVER_PRIVATE_KEY: process.env.SOLVER_PRIVATE_KEY!,
  MIN_BOND_MIST: BigInt(process.env.MIN_BOND_MIST ?? "1000000000"),
  DEEPBOOK_FEE_BPS: 10n, // 0.1% whitelisted pool fee estimate
  FLOAT_SCALING: 1_000_000_000n, // matches contract math.move float_scaling()
  REFUND_POLL_INTERVAL_MS: 5_000,
  REFUND_MAX_ATTEMPTS: 60, // 5min total
} as const;

function assertConfig(): void {
  const missing = (
    ["PACKAGE_ID", "GLOBAL_CONFIG_ID", "SOLVER_PRIVATE_KEY"] as const
  ).filter((k) => !process.env[k]);
  if (missing.length)
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SharedObjectRef {
  objectId: string;
  initialSharedVersion: number;
  digest: string;
}

interface IntentInfo {
  intentId: string;
  owner: string;
  sellType: string;
  buyType: string;
  sellAmount: bigint;
  minAmountOut: bigint;
  partialFillable: boolean;
  deadline: number;
  batchId: number | null;
  sharedRef: SharedObjectRef | null;
}

interface CowPair {
  intentA: IntentInfo;
  intentB: IntentInfo;
  payoutToA: bigint;
  payoutToB: bigint;
  surplusA: bigint;
  surplusB: bigint;
  totalSurplus: bigint;
  /**
   * Hybrid mode: intentA cannot be fully funded by intentB.sellAmount alone.
   * ammSupplementForA = realisticYield(intentA.sellAmount - payoutToB) extra buy-A tokens sourced from AMM swap.
   * Solver fronts ammSupplementForA of A.buyType, recovered via AMM swap of A's excess sell tokens.
   */
  ammSupplementForA?: bigint;
  /**
   * Hybrid mode: intentB cannot be fully funded by intentA.sellAmount alone.
   * ammSupplementForB = realisticYield(intentB.sellAmount - payoutToA) extra buy-B tokens sourced from AMM swap.
   * Solver fronts ammSupplementForB of B.buyType, recovered via AMM swap of B's excess sell tokens.
   */
  ammSupplementForB?: bigint;
}

interface AmmRoute {
  intent: IntentInfo;
  poolKey: string;
  isBaseToQuote: boolean;
  estimatedOut: bigint;
  estimatedSurplus: bigint;
}

interface BatchSolution {
  batchId: number;
  auctionStateId: string;
  cowPairs: CowPair[];
  ammRoutes: AmmRoute[];
  totalSurplus: bigint;
}

// ─── Intent Pool ──────────────────────────────────────────────────────────────

/**
 * Groups intents by direction key "sellType-buyType" for O(1) inverse lookup.
 */
class IntentPool {
  private byId = new Map<string, IntentInfo>();
  private byDir = new Map<string, Set<string>>();

  private dirKey(sellType: string, buyType: string): string {
    return `${sellType}-${buyType}`;
  }

  add(intent: IntentInfo): void {
    if (this.byId.has(intent.intentId)) return;
    this.byId.set(intent.intentId, intent);
    const key = this.dirKey(intent.sellType, intent.buyType);
    if (!this.byDir.has(key)) this.byDir.set(key, new Set());
    this.byDir.get(key)!.add(intent.intentId);
  }

  remove(intentId: string): void {
    const intent = this.byId.get(intentId);
    if (!intent) return;
    this.byId.delete(intentId);
    this.byDir
      .get(this.dirKey(intent.sellType, intent.buyType))
      ?.delete(intentId);
  }

  get(intentId: string): IntentInfo | undefined {
    return this.byId.get(intentId);
  }

  setSharedRef(intentId: string, ref: SharedObjectRef): void {
    const i = this.byId.get(intentId);
    if (i) i.sharedRef = ref;
  }

  markInBatch(intentId: string, batchId: number): void {
    const i = this.byId.get(intentId);
    if (i) i.batchId = batchId;
  }

  /** Returns all pending intents with direction (buyType-sellType) */
  getInverse(intent: IntentInfo): IntentInfo[] {
    const key = this.dirKey(intent.buyType, intent.sellType);
    const ids = this.byDir.get(key);
    if (!ids) return [];
    return [...ids]
      .map((id) => this.byId.get(id)!)
      .filter((i): i is IntentInfo => !!i && i.batchId === null);
  }

  getPending(): IntentInfo[] {
    return [...this.byId.values()].filter((i) => i.batchId === null);
  }

  size(): number {
    return this.byId.size;
  }
}

// ─── Price Oracle ─────────────────────────────────────────────────────────────

/**
 * Wraps DeepBookClient for:
 *   1. mid_price with 2s TTL cache
 *   2. Pool key resolution from (sellType, buyType) pairs
 *   3. AMM output estimation with fee deduction
 */
class PriceOracle {
  private priceCache = new Map<string, { price: bigint; ts: number }>();
  private readonly TTL_MS = 2_000;
  private poolRegistry = new Map<
    string,
    {
      poolKey: string;
      isBaseToQuote: boolean;
      baseDecimals: number;
      quoteDecimals: number;
    }
  >();

  constructor(private readonly deepbookClient: any) {
    // Register trading pairs using centralized token metadata
    this.register(
      SUI_METADATA.type,
      DBUSDC_METADATA.type,
      "SUI_DBUSDC",
      SUI_METADATA.decimals,
      DBUSDC_METADATA.decimals,
    );
    this.register(
      SUI_METADATA.type,
      DBUSDT_METADATA.type,
      "SUI_DBUSDT",
      SUI_METADATA.decimals,
      DBUSDT_METADATA.decimals,
    );
    this.register(
      DEEP_METADATA.type,
      SUI_METADATA.type,
      "DEEP_SUI",
      DEEP_METADATA.decimals,
      SUI_METADATA.decimals,
    );
    this.register(
      DEEP_METADATA.type,
      DBUSDC_METADATA.type,
      "DEEP_DBUSDC",
      DEEP_METADATA.decimals,
      DBUSDC_METADATA.decimals,
    );
  }

  /**
   * Register a pool for a token pair.
   * Registers both full type strings and short names in both directions.
   * baseDecimals / quoteDecimals are used to apply the decimal correction factor
   * when converting between raw on-chain units:
   *   decimalFactor = 10^(quoteDecimals - baseDecimals)
   */
  register(
    baseType: string,
    quoteType: string,
    poolKey: string,
    baseDecimals: number,
    quoteDecimals: number,
  ): void {
    const bShort = shortType(baseType);
    const qShort = shortType(quoteType);
    const entry = { poolKey, isBaseToQuote: true, baseDecimals, quoteDecimals };
    const entryInv = {
      poolKey,
      isBaseToQuote: false,
      baseDecimals,
      quoteDecimals,
    };
    this.poolRegistry.set(`${baseType}-${quoteType}`, entry);
    this.poolRegistry.set(`${bShort}-${qShort}`, entry);
    this.poolRegistry.set(`${quoteType}-${baseType}`, entryInv);
    this.poolRegistry.set(`${qShort}-${bShort}`, entryInv);
  }

  resolvePool(
    sellType: string,
    buyType: string,
  ): {
    poolKey: string;
    isBaseToQuote: boolean;
    baseDecimals: number;
    quoteDecimals: number;
  } | null {
    return (
      this.poolRegistry.get(`${sellType}-${buyType}`) ??
      this.poolRegistry.get(`${shortType(sellType)}-${shortType(buyType)}`) ??
      null
    );
  }

  async getMidPrice(poolKey: string): Promise<bigint> {
    const cached = this.priceCache.get(poolKey);
    if (cached && Date.now() - cached.ts < this.TTL_MS) return cached.price;

    try {
      const price = await this.deepbookClient.deepbook.midPrice(poolKey);
      const scaled = BigInt(Math.round(price * Number(CONFIG.FLOAT_SCALING)));
      this.priceCache.set(poolKey, { price: scaled, ts: Date.now() });
      return scaled;
    } catch (err) {
      console.error(`[getMidPrice] Error fetching price for ${poolKey}:`, err);
      // Return cached price or fallback
      const cached = this.priceCache.get(poolKey);
      if (cached) return cached.price;
      throw err;
    }
  }

  async estimateAmmOut(intent: IntentInfo): Promise<bigint> {
    const pool = this.resolvePool(intent.sellType, intent.buyType);
    if (!pool) return 0n;
    const mid = await this.getMidPrice(pool.poolKey);
    const FS = CONFIG.FLOAT_SCALING;
    const rawOut = applyDecimalFactor(pool, intent.sellAmount, mid, FS);
    return (rawOut * (10_000n - CONFIG.DEEPBOOK_FEE_BPS)) / 10_000n;
  }
}

// ─── Solver A ─────────────────────────────────────────────────────────────────

class SolverA {
  private readonly suiClient;
  private readonly oracle: PriceOracle;
  private readonly keypair: Ed25519Keypair;
  readonly address: string;

  private readonly intentPool = new IntentPool();
  private cachedPairs: CowPair[] = [];
  private activeSolution: BatchSolution | null = null;
  private executor!: SerialTransactionExecutor;
  private readonly rpcUrl: string;

  constructor() {
    const { scheme, secretKey } = decodeSuiPrivateKey(
      CONFIG.SOLVER_PRIVATE_KEY,
    );
    if (scheme !== "ED25519")
      throw new Error(`Unsupported key scheme: ${scheme}`);
    this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
    this.address = this.keypair.toSuiAddress();

    const GRPC_URLS = {
      mainnet: "https://fullnode.mainnet.sui.io:443",
      testnet: "https://fullnode.testnet.sui.io:443",
    };

    this.suiClient = new SuiGrpcClient({
      network: CONFIG.NETWORK,
      baseUrl: GRPC_URLS[CONFIG.NETWORK],
    }).$extend(deepbook({ address: this.address }));

    this.oracle = new PriceOracle(this.suiClient);
    this.rpcUrl = CONFIG.NETWORK === "mainnet"
      ? "https://fullnode.mainnet.sui.io"
      : "https://fullnode.testnet.sui.io";
    this.executor = new SerialTransactionExecutor({
      client: this.suiClient,
      signer: this.keypair,
    });
    console.log(`[SolverA] address=${this.address}`);
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  onIntentCreated(data: IntentCreatedPayload): void {
    if (Number(data.deadline) <= Date.now()) {
      console.debug(
        `[SolverA] Skipping expired intent ${short(data.intent_id)}`,
      );
      return;
    }

    const intent: IntentInfo = {
      intentId: data.intent_id,
      owner: data.owner,
      sellType: normalizeType(data.sell_type.trim()),
      buyType: normalizeType(data.buy_type.trim()),
      sellAmount: BigInt(data.sell_amount),
      minAmountOut: BigInt(data.min_amount_out),
      partialFillable: data.partial_fillable,
      deadline: Number(data.deadline),
      batchId: null,
      sharedRef: null,
    };

    this.intentPool.add(intent);
    console.log(
      `[SolverA] +intent ${short(intent.intentId)} ` +
        `${shortType(intent.sellType)}-${shortType(intent.buyType)} ` +
        `sell=${intent.sellAmount} pool=${this.intentPool.size()}`,
    );
    this.recomputeCowPairs();
  }

  onIntentCancelled(intentId: string): void {
    this.intentPool.remove(intentId);
    this.recomputeCowPairs();
    console.log(`[SolverA] -intent ${short(intentId)}`);
  }

  async onBatchOpened(data: BatchOpenedPayload): Promise<void> {
    const commitEndMs = Number(data.commit_end_ms);
    const timeLeft = commitEndMs - Date.now();
    const batchId = Number(data.batch_id);

    console.log(
      `[SolverA] BatchOpened #${batchId} n=${data.intent_ids.length} window=${timeLeft}ms`,
    );

    if (timeLeft < 500) {
      console.warn("[SolverA] Commit window too tight — skipping batch");
      return;
    }

    if (this.activeSolution !== null) {
      console.warn(
        `[SolverA] Already have active solution #${this.activeSolution.batchId} — skipping batch #${batchId}`,
      );
      return;
    }

    // Mark all batch intents
    data.intent_ids.forEach((id) => this.intentPool.markInBatch(id, batchId));

    const solution = await this.buildSolution({
      batchId,
      auctionStateId: data.auction_state_id,
      intentIds: data.intent_ids,
    });

    this.activeSolution = solution;

    console.log(
      `[SolverA] Solution #${batchId}: ` +
        `${solution.cowPairs.length} CoW + ${solution.ammRoutes.length} AMM ` +
        `surplus=${solution.totalSurplus}`,
    );

    await this.submitCommit(solution);
  }

  async onWinnerSelected(data: WinnerSelectedPayload): Promise<void> {
    const batchId = Number(data.batch_id);
    if (this.activeSolution?.batchId !== batchId) return;

    if (data.winner.toLowerCase() === this.address.toLowerCase()) {
      console.log(`[SolverA] WON #${batchId} — executing settlement`);
      await this.executeSettlement(this.activeSolution);
    } else {
      console.log(
        `[SolverA] LOST #${batchId} to ${short(data.winner)} — scheduling refund poll`,
      );
      this.scheduleRefund(this.activeSolution.auctionStateId);
      this.activeSolution = null;
    }
  }

  // ─── Pre-compute CoW Pairs ─────────────────────────────────────────────────

  /**
   * Greedy O(n²) structural matching: pair intents with inverse directions.
   * Sorts by sellAmount desc so large intents get matched first.
   * No price fetch here — surplus scored later in buildSolution().
   */
  private recomputeCowPairs(): void {
    const pending = this.intentPool
      .getPending()
      .sort((a, b) => (b.sellAmount > a.sellAmount ? 1 : -1));

    const used = new Set<string>();
    const pairs: CowPair[] = [];

    for (const intentA of pending) {
      if (used.has(intentA.intentId)) continue;

      const counterparties = this.intentPool
        .getInverse(intentA)
        .filter((i) => !used.has(i.intentId))
        .sort((a, b) => (b.sellAmount > a.sellAmount ? 1 : -1));

      const best = counterparties[0];
      if (!best) continue;

      pairs.push({
        intentA,
        intentB: best,
        payoutToA: 0n,
        payoutToB: 0n,
        surplusA: 0n,
        surplusB: 0n,
        totalSurplus: 0n,
      });
      used.add(intentA.intentId);
      used.add(best.intentId);
    }

    this.cachedPairs = pairs;
  }

  // ─── Build Solution ────────────────────────────────────────────────────────

  private async buildSolution(batch: {
    batchId: number;
    auctionStateId: string;
    intentIds: string[];
  }): Promise<BatchSolution> {
    const batchSet = new Set(batch.intentIds);
    const cowIntentIds = new Set<string>();
    const validPairs: CowPair[] = [];

    // 1. Score pre-computed CoW pairs belonging to this batch
    for (const pair of this.cachedPairs) {
      const aInBatch = batchSet.has(pair.intentA.intentId);
      const bInBatch = batchSet.has(pair.intentB.intentId);
      if (!aInBatch || !bInBatch) continue;

      const scored = await this.scorePair(pair);
      if (!scored) continue;

      validPairs.push(scored);
      cowIntentIds.add(pair.intentA.intentId);
      cowIntentIds.add(pair.intentB.intentId);
    }

    // 2. AMM routes for every unmatched intent in this batch
    const ammRoutes: AmmRoute[] = [];
    for (const id of batch.intentIds) {
      if (cowIntentIds.has(id)) continue;
      const intent = this.intentPool.get(id);
      if (!intent) continue;

      const route = await this.buildAmmRoute(intent);
      if (route) ammRoutes.push(route);
    }

    const totalSurplus =
      validPairs.reduce((s, p) => s + p.totalSurplus, 0n) +
      ammRoutes.reduce((s, r) => s + r.estimatedSurplus, 0n);

    return {
      batchId: batch.batchId,
      auctionStateId: batch.auctionStateId,
      cowPairs: validPairs,
      ammRoutes,
      totalSurplus,
    };
  }

  /**
   * Score a CoW pair using live mid_price.
   * Returns null if either intent fails min_amount_out at current price.
   *
   * payoutToA: how much intentA.buyType intentA receives (= intentB.sellAmount capped at fair price)
   * payoutToB: how much intentB.buyType intentB receives (= intentA.sellAmount capped at fair price)
   *
   * Decimal correction:
   *   DeepBook mid_price is in FLOAT_SCALING (1e9) units but is the raw ratio
   *   quote_units/base_units.  To convert between on-chain token amounts we must
   *   also account for the difference in token decimals:
   *     decimalFactor = 10^(quoteDecimals - baseDecimals)
   *   base-quote:  sell * mid * DF / (FS * DR)
   *   quote-base:  sell * FS * DR / (mid * DF)
   *   where DF = max(1, 10^diff), DR = max(1, 10^(-diff)), diff = quoteDecimals - baseDecimals
   */
  private async scorePair(pair: CowPair): Promise<CowPair | null> {
    const pool = this.oracle.resolvePool(
      pair.intentA.sellType,
      pair.intentA.buyType,
    );
    if (!pool) return null;

    const mid = await this.oracle.getMidPrice(pool.poolKey);
    const FS = CONFIG.FLOAT_SCALING;
    // Buffer = pool fee (0.1%) + orderbook spread allowance (0.5%) = 0.6%
    const DEDUCTION = CONFIG.DEEPBOOK_FEE_BPS + 50n;

    // Fair value at mid-price
    const fairOutA = applyDecimalFactor(pool, pair.intentA.sellAmount, mid, FS);
    const poolInv = { ...pool, isBaseToQuote: !pool.isBaseToQuote };
    const fairOutB = applyDecimalFactor(poolInv, pair.intentB.sellAmount, mid, FS);

    // Price floor = max(user's minAmountOut, 99% of fair value — contract's slippage guard)
    const floorA = fairOutA > pair.intentA.minAmountOut
      ? ((fairOutA * 99n) / 100n > pair.intentA.minAmountOut ? (fairOutA * 99n) / 100n : pair.intentA.minAmountOut)
      : pair.intentA.minAmountOut;
    const floorB = fairOutB > pair.intentB.minAmountOut
      ? ((fairOutB * 99n) / 100n > pair.intentB.minAmountOut ? (fairOutB * 99n) / 100n : pair.intentB.minAmountOut)
      : pair.intentB.minAmountOut;

    if (fairOutA < pair.intentA.minAmountOut || fairOutB < pair.intentB.minAmountOut) {
      return null;
    }

    // Solver keeps 50% of margin above floor, passes 50% to user as surplus (balanced CoW baseline)
    let payoutToA = floorA + (fairOutA - floorA) / 2n;
    let payoutToB = floorB + (fairOutB - floorB) / 2n;

    console.log(
      `[scorePair] ${shortType(pair.intentA.sellType)}-${shortType(pair.intentA.buyType)} ` +
        `mid=${mid} DF=10^${pool.quoteDecimals - pool.baseDecimals} ` +
        `fairA=${fairOutA} payoutToA=${payoutToA} (floor ${floorA}) ` +
        `fairB=${fairOutB} payoutToB=${payoutToB} (floor ${floorB})`,
    );

    const aDeficit = payoutToB > pair.intentA.sellAmount;
    const bDeficit = payoutToA > pair.intentB.sellAmount;

    let ammSupplementForA: bigint | undefined;
    let ammSupplementForB: bigint | undefined;

    if (aDeficit && bDeficit) {
      console.log(`[scorePair] Reject: both sides deficient`);
      return null;
    }

    if (bDeficit) {
      // intentB doesn't sell enough of A's buy token — supplement from AMM.
      // Large=A: leftover sell tokens after paying B go to AMM swap.
      const sellForSwap = pair.intentA.sellAmount - payoutToB;
      // Realistic yield = what AMM actually gives back after fee + spread deduction.
      // ammSupplement is SET to this value so PTB swap output always covers repayment.
      const realisticYield = (applyDecimalFactor(pool, sellForSwap, mid, FS) * (10_000n - DEDUCTION)) / 10_000n;
      ammSupplementForA = realisticYield;
      const newPayoutToA = pair.intentB.sellAmount + ammSupplementForA;
      if (newPayoutToA < floorA) {
        console.log(`[scorePair] Reject hybrid-A: newPayout=${newPayoutToA} < floorA=${floorA}`);
        return null;
      }
      payoutToA = newPayoutToA;
      console.log(`[scorePair] Hybrid-A: payoutToA=${payoutToA} (CoW=${pair.intentB.sellAmount} + AMM=${ammSupplementForA})`);
    }

    if (aDeficit) {
      // intentA doesn't sell enough of B's buy token — supplement from AMM.
      // Large=B: leftover sell tokens after paying A go to AMM swap.
      const sellForSwap = pair.intentB.sellAmount - payoutToA;
      // Realistic yield = what AMM actually gives back after fee + spread deduction.
      // ammSupplement is SET to this value so PTB swap output always covers repayment.
      const realisticYield = (applyDecimalFactor(poolInv, sellForSwap, mid, FS) * (10_000n - DEDUCTION)) / 10_000n;
      ammSupplementForB = realisticYield;
      const newPayoutToB = pair.intentA.sellAmount + ammSupplementForB;
      if (newPayoutToB < floorB) {
        console.log(`[scorePair] Reject hybrid-B: newPayout=${newPayoutToB} < floorB=${floorB}`);
        return null;
      }
      payoutToB = newPayoutToB;
      console.log(`[scorePair] Hybrid-B: payoutToB=${payoutToB} (CoW=${pair.intentA.sellAmount} + AMM=${ammSupplementForB})`);
    }

    const surplusA = payoutToA > floorA ? payoutToA - floorA : 0n;
    const surplusB = payoutToB > floorB ? payoutToB - floorB : 0n;

    return {
      ...pair,
      payoutToA,
      payoutToB,
      surplusA,
      surplusB,
      totalSurplus: surplusA + surplusB,
      ammSupplementForA,
      ammSupplementForB,
    };
  }

  private async buildAmmRoute(intent: IntentInfo): Promise<AmmRoute | null> {
    const pool = this.oracle.resolvePool(intent.sellType, intent.buyType);
    if (!pool) {
      console.warn(
        `[SolverA] No pool: ${shortType(intent.sellType)}-${shortType(intent.buyType)}`,
      );
      return null;
    }

    const mid = await this.oracle.getMidPrice(pool.poolKey);
    const FS = CONFIG.FLOAT_SCALING;

    // Fair value at mid-price
    const fairOut = applyDecimalFactor(pool, intent.sellAmount, mid, FS);

    // Price floor = max(user's minAmountOut, 99% of fair value — contract's slippage guard)
    const slippageFloor = (fairOut * 99n) / 100n;
    const priceFloor = slippageFloor > intent.minAmountOut ? slippageFloor : intent.minAmountOut;

    // Realistic AMM yield = fair value minus pool fee (0.1%) + spread buffer (0.5%) = 0.6% total
    const totalDeductionBps = CONFIG.DEEPBOOK_FEE_BPS + 50n;
    const realisticYield = (fairOut * (10_000n - totalDeductionBps)) / 10_000n;

    if (realisticYield < priceFloor) {
      console.debug(
        `[SolverA] AMM route too tight: yield=${realisticYield} < floor=${priceFloor}`,
      );
      return null;
    }

    // Solver keeps 50% of margin above floor, passes 50% to user as surplus (boosts score)
    const margin = realisticYield - priceFloor;
    const payout = priceFloor + margin / 2n;

    console.debug(
      `[SolverA] AMM route ${shortType(intent.sellType)}-${shortType(intent.buyType)} ` +
        `fair=${fairOut} yield=${realisticYield} floor=${priceFloor} payout=${payout}`,
    );

    return {
      intent,
      poolKey: pool.poolKey,
      isBaseToQuote: pool.isBaseToQuote,
      estimatedOut: payout,
      estimatedSurplus: payout - priceFloor,
    };
  }

  // ─── Commit ────────────────────────────────────────────────────────────────

  private buildCommitTx(solution: BatchSolution): Transaction {
    const tx = new Transaction();
    const [bond] = tx.splitCoins(tx.gas, [tx.pure.u64(CONFIG.MIN_BOND_MIST)]);
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::commit`,
      arguments: [
        tx.object(CONFIG.GLOBAL_CONFIG_ID),
        tx.object(solution.auctionStateId),
        tx.pure.u64(solution.totalSurplus),
        bond,
        tx.object.clock(),
      ],
    });
    return tx;
  }

  private async submitCommit(
    solution: BatchSolution,
    attempt = 0,
  ): Promise<void> {
    const MAX_RETRIES = 3;

    try {
      const result = await this.executor.executeTransaction(
        this.buildCommitTx(solution),
        { effects: true },
      );

      if (result.$kind === "FailedTransaction") {
        console.error(
          `[SolverA] Commit FAILED #${solution.batchId}:`,
          result.FailedTransaction.status.error?.message,
        );
        this.activeSolution = null;
      } else {
        console.log(
          `[SolverA] Committed #${solution.batchId} score=${solution.totalSurplus} digest=${result.Transaction.digest}`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Coin version conflict — retry with fresh executor
      if (
        attempt < MAX_RETRIES &&
        msg.includes("not available for consumption")
      ) {
        console.warn(
          `[SolverA] Commit coin conflict #${solution.batchId} — retry ${attempt + 1}/${MAX_RETRIES}`,
        );
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        return this.submitCommit(solution, attempt + 1);
      }
      console.error(`[SolverA] Commit error #${solution.batchId}:`, err);
      this.activeSolution = null;
    }
  }

  // ─── Execute Settlement ────────────────────────────────────────────────────

  /**
   * Checks solver balance and executes settlement using solver's own coins.
   *
   * 1. computeCoinsNeeded() — gross token amounts needed per type
   * 2. fetchSolverCoins()   — query on-chain coin objects
   * 3. Balance check        — skip if insufficient; profitability guaranteed by scoring
   * 4. buildCoinInputMap()  — wire coin objects into PTB
   * 5. Build + execute PTB
   */
  private async executeSettlement(solution: BatchSolution): Promise<void> {
    // 1. Compute gross coin requirements
    const coinsNeeded = this.computeCoinsNeeded(solution);
    console.log(
      `[SolverA] Coins needed #${solution.batchId}: ` +
        [...coinsNeeded.entries()].map(([t, a]) => `${shortType(t)}=${a}`).join(', '),
    );

    // 2. Fetch solver's coin objects for all required types
    const solverCoinsData = await this.fetchSolverCoins([...coinsNeeded.keys()]);

    // 3. Balance check
    for (const [type, needed] of coinsNeeded) {
      const available = solverCoinsData.get(type)?.totalBalance ?? 0n;
      if (available < needed) {
        console.warn(
          `[SolverA] Insufficient ${shortType(type)}: have=${available} need=${needed} — skipping #${solution.batchId}`,
        );
        this.activeSolution = null;
        return;
      }
    }

    // 4. Build PTB
    const tx = new Transaction();
    const coinInputs = this.buildCoinInputMap(tx, solverCoinsData, coinsNeeded);

    // open_settlement(state, clock) - ticket
    const openResult = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::open_settlement`,
      arguments: [tx.object(solution.auctionStateId), tx.object.clock()],
    });
    const ticket = openResult[0]!;

    // Process CoW pairs
    for (const pair of solution.cowPairs) {
      await this.addCowPairCalls(tx, ticket, pair, coinInputs);
    }

    // Process AMM routes
    for (const route of solution.ammRoutes) {
      await this.addAmmRouteCalls(tx, ticket, route, coinInputs);
    }

    // close_settlement(state, ticket, config)
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::close_settlement`,
      arguments: [
        tx.object(solution.auctionStateId),
        ticket,
        tx.object(CONFIG.GLOBAL_CONFIG_ID),
      ],
    });

    // 5. Execute
    try {
      const result = await this.executor.executeTransaction(tx, {
        effects: true,
        events: true,
      });

      if (result.$kind === "FailedTransaction") {
        console.error(
          `[SolverA] Settlement FAILED #${solution.batchId}:`,
          result.FailedTransaction.status.error?.message,
        );
      } else {
        console.log(
          `[SolverA] Settlement SUCCESS #${solution.batchId} digest=${result.Transaction.digest}`,
        );
        this.cleanupBatch(solution);
        return;
      }
    } catch (err) {
      console.error(`[SolverA] Settlement error #${solution.batchId}:`, err);
    } finally {
      if (this.activeSolution?.batchId === solution.batchId) {
        this.activeSolution = null;
      }
    }
  }

  /**
   * Adds PTB calls for a CoW pair using solver's own coin balance.
   *
   * Balanced CoW: solver provides payoutToA of A.buyType + payoutToB of B.buyType.
   * process_intent delivers each payout to the intent owner directly.
   * Solver receives both sell coins back: A.sellAmount > payoutToB, B.sellAmount > payoutToA.
   */
  private async addCowPairCalls(
    tx: Transaction,
    ticket: ReturnType<Transaction["moveCall"]>[number],
    pair: CowPair,
    coinInputs: Map<string, any>,
  ): Promise<void> {
    const { intentA, intentB } = pair;

    const pool = this.oracle.resolvePool(intentA.sellType, intentA.buyType);
    if (!pool) {
      console.warn(`[SolverA] Skipping CoW pair — pool not found`);
      return;
    }

    const poolId = this.resolveDeepBookPoolId(pool.poolKey);
    const { poolKey, isBaseToQuote } = pool;
    const baseType = isBaseToQuote ? intentA.sellType : intentA.buyType;
    const quoteType = isBaseToQuote ? intentA.buyType : intentA.sellType;

    if (pair.ammSupplementForA) {
      await this.addHybridCowAmmCalls(tx, ticket, pair, pool, 'A', coinInputs);
      return;
    }
    if (pair.ammSupplementForB) {
      await this.addHybridCowAmmCalls(tx, ticket, pair, pool, 'B', coinInputs);
      return;
    }

    // ── Balanced CoW: both sides fully funded by each other ────────────────

    // ── Balanced CoW ─────────────────────────────────────────────────────────
    // Solver splits payout coins from its master coins for each type
    const masterA = coinInputs.get(intentA.buyType)!;
    const masterB = coinInputs.get(intentB.buyType)!;
    const [coinForA] = tx.splitCoins(masterA, [tx.pure.u64(pair.payoutToA)]);
    const [coinForB] = tx.splitCoins(masterB, [tx.pure.u64(pair.payoutToB)]);

    console.debug(`[CoW] payoutToA=${pair.payoutToA} ${shortType(intentA.buyType)}, payoutToB=${pair.payoutToB} ${shortType(intentB.buyType)}`);

    const [sellCoinA] = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intentA.sellType, intentA.buyType, baseType, quoteType],
      arguments: [ticket, tx.object(intentA.intentId), coinForA!, tx.object(poolId), tx.pure.bool(isBaseToQuote), tx.object.clock()],
    });

    const [sellCoinB] = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intentB.sellType, intentB.buyType, baseType, quoteType],
      arguments: [ticket, tx.object(intentB.intentId), coinForB!, tx.object(poolId), tx.pure.bool(isBaseToQuote), tx.object.clock()],
    });

    // sellCoinA = A.sellAmount (> payoutToB - profit), sellCoinB = B.sellAmount (> payoutToA - profit)
    tx.transferObjects([sellCoinA!, sellCoinB!], this.address);
  }

  /**
   * Hybrid CoW+AMM settlement using solver's own coins.
   *
   * No flashloans. Solver fronts:
   *   - payoutToSmall of large.sellType  (recovered: large.sellAmount - sellForSwap = payoutToSmall)
   *   - ammSupplement of large.buyType   (recovered: swapOut from AMM ≥ ammSupplement)
   *
   * Flow (Hybrid-A, large=A sells BASE, small=B sells QUOTE):
   *   1. splitCoins(masterBase, payoutToB)           - coinForSmall
   *   2. process_intent(B, coinForSmall)              - sellCoinSmall (B.sellAmount QUOTE)
   *   3. splitCoins(masterQuote, ammSupplement)       - ammSuppCoin
   *   4. mergeCoins(sellCoinSmall, [ammSuppCoin])     - payoutToA total QUOTE
   *   5. process_intent(A, sellCoinSmall)             - sellCoinLarge (A.sellAmount BASE)
   *   6. splitCoins(sellCoinLarge, sellForSwap)       - toSwap; sellCoinLarge (rem) = payoutToB BASE
   *   7. swapExactBaseForQuote(toSwap)                - quoteBack ≥ ammSupplement
   *   8. transferObjects([sellCoinLarge, quoteBack, ...], solver)
   */
  private async addHybridCowAmmCalls(
    tx: Transaction,
    ticket: ReturnType<Transaction['moveCall']>[number],
    pair: CowPair,
    pool: { poolKey: string; isBaseToQuote: boolean; baseDecimals: number; quoteDecimals: number },
    largerSide: 'A' | 'B',
    coinInputs: Map<string, any>,
  ): Promise<void> {
    const { intentA, intentB } = pair;
    const { poolKey, isBaseToQuote, baseDecimals, quoteDecimals } = pool;
    const poolId = this.resolveDeepBookPoolId(poolKey);
    const baseType = isBaseToQuote ? intentA.sellType : intentA.buyType;
    const quoteType = isBaseToQuote ? intentA.buyType : intentA.sellType;

    const large = largerSide === 'A' ? intentA : intentB;
    const small = largerSide === 'A' ? intentB : intentA;
    const payoutToSmall = largerSide === 'A' ? pair.payoutToB : pair.payoutToA;
    const ammSupplement = (largerSide === 'A' ? pair.ammSupplementForA : pair.ammSupplementForB)!;

    // largeSellsBase: true - large sells BASE, buys QUOTE; false - large sells QUOTE, buys BASE
    const largeSellsBase = largerSide === 'A' ? isBaseToQuote : !isBaseToQuote;

    // sellForSwap = large.sellAmount tokens going into AMM after CoW settlement
    const sellForSwap = large.sellAmount - payoutToSmall;
    const sellForSwapDecimals = largeSellsBase
      ? Number(sellForSwap) / 10 ** baseDecimals
      : Number(sellForSwap) / 10 ** quoteDecimals;
    const ammSuppDecimals = largeSellsBase
      ? Number(ammSupplement) / 10 ** quoteDecimals
      : Number(ammSupplement) / 10 ** baseDecimals;

    console.debug(
      `[Hybrid-${largerSide}] large=${short(large.intentId)} small=${short(small.intentId)} ` +
        `payoutToSmall=${payoutToSmall} sellForSwap=${sellForSwap} ammSupplement=${ammSupplement}`,
    );

    // ── Step 1: Split payoutToSmall of large's SELL type from solver's coins ──
    const masterSellLarge = coinInputs.get(large.sellType)!;
    const [coinForSmall] = tx.splitCoins(masterSellLarge, [tx.pure.u64(payoutToSmall)]);

    // ── Step 2: process_intent(small) - sellCoinSmall (= small.sellAmount of large's BUY type) ──
    const [sellCoinSmall] = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [small.sellType, small.buyType, baseType, quoteType],
      arguments: [ticket, tx.object(small.intentId), coinForSmall!, tx.object(poolId), tx.pure.bool(isBaseToQuote), tx.object.clock()],
    });
    console.debug(`[Hybrid-${largerSide}] sellCoinSmall: ${sellCoinSmall ? 'OK' : 'UNDEFINED'}`);

    // ── Step 3: Split ammSupplement of large's BUY type from solver's coins ──
    const masterBuyLarge = coinInputs.get(large.buyType)!;
    const [ammSuppCoin] = tx.splitCoins(masterBuyLarge, [tx.pure.u64(ammSupplement)]);

    // ── Step 4: Merge - coinForLarge = small.sellAmount + ammSupplement = payoutToLarge ──
    tx.mergeCoins(sellCoinSmall!, [ammSuppCoin!]);
    console.debug(`[Hybrid-${largerSide}] coinForLarge = ${small.sellAmount} + ${ammSupplement} = payoutToLarge`);

    // ── Step 5: process_intent(large, coinForLarge) - sellCoinLarge (= large.sellAmount of large's SELL type) ──
    const [sellCoinLarge] = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [large.sellType, large.buyType, baseType, quoteType],
      arguments: [ticket, tx.object(large.intentId), sellCoinSmall!, tx.object(poolId), tx.pure.bool(isBaseToQuote), tx.object.clock()],
    });
    console.debug(`[Hybrid-${largerSide}] sellCoinLarge: ${sellCoinLarge ? 'OK' : 'UNDEFINED'}`);

    // ── Step 6: Split sellCoinLarge - toSwap (sellForSwap) + remainder (payoutToSmall, recovers step 1) ──
    const [toSwap] = tx.splitCoins(sellCoinLarge!, [tx.pure.u64(sellForSwap)]);

    // ── Step 7: Swap toSwap - large's buy type to recover ammSupplement ──
    // quoteBack / baseBack ≥ ammSupplement guaranteed by DEDUCTION factor in scorePair
    if (largeSellsBase) {
      // large sold BASE - toSwap is BASE - swap BASE-QUOTE
      const [baseRem, quoteBack, fees] = tx.add(
        this.suiClient.deepbook.deepBook.swapExactBaseForQuote({
          poolKey, amount: sellForSwapDecimals, deepAmount: 0, minOut: ammSuppDecimals, baseCoin: toSwap!,
        }),
      );
      tx.transferObjects([sellCoinLarge!, quoteBack!, baseRem!, fees!], this.address);
    } else {
      // large sold QUOTE - toSwap is QUOTE - swap QUOTE-BASE
      const [baseBack, quoteRem, fees] = tx.add(
        this.suiClient.deepbook.deepBook.swapExactQuoteForBase({
          poolKey, amount: sellForSwapDecimals, deepAmount: 0, minOut: ammSuppDecimals, quoteCoin: toSwap as any,
        }),
      );
      tx.transferObjects([sellCoinLarge!, baseBack!, quoteRem!, fees!], this.address);
    }
  }

  /**
   * Adds PTB calls for an AMM route using solver's own coins.
   *
   * Flow (BASE-QUOTE example):
   *   1. splitCoins(masterQuote, estimatedOut) - coinForUser
   *   2. process_intent(intent, coinForUser)   - sellCoin (contract pays user estimatedOut QUOTE)
   *   3. swapExactBaseForQuote(sellCoin)       - quoteBack ≥ estimatedOut (profit), baseRem, fees
   *   4. transferObjects([quoteBack, baseRem, fees], solver)
   */
  private async addAmmRouteCalls(
    tx: Transaction,
    ticket: ReturnType<Transaction["moveCall"]>[number],
    route: AmmRoute,
    coinInputs: Map<string, any>,
  ): Promise<void> {
    const { intent, poolKey, isBaseToQuote } = route;
    const pool = this.oracle.resolvePool(intent.sellType, intent.buyType)!;
    const poolId = this.resolveDeepBookPoolId(poolKey);
    const baseType = isBaseToQuote ? intent.sellType : intent.buyType;
    const quoteType = isBaseToQuote ? intent.buyType : intent.sellType;

    const payoutRaw = route.estimatedOut;
    const sellDecimals = isBaseToQuote
      ? Number(intent.sellAmount) / 10 ** pool.baseDecimals
      : Number(intent.sellAmount) / 10 ** pool.quoteDecimals;
    const payoutDecimals = isBaseToQuote
      ? Number(payoutRaw) / 10 ** pool.quoteDecimals
      : Number(payoutRaw) / 10 ** pool.baseDecimals;

    console.debug(`[AMM] sell=${shortType(intent.sellType)}-${shortType(intent.buyType)} estimatedOut=${payoutRaw}`);

    // ── Step 1: Split estimatedOut of intent.buyType from solver's coins ──
    const masterBuy = coinInputs.get(intent.buyType)!;
    const [coinForUser] = tx.splitCoins(masterBuy, [tx.pure.u64(payoutRaw)]);

    // ── Step 2: process_intent - user gets estimatedOut; solver gets intent.sellAmount of sellType ──
    const [sellCoin] = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intent.sellType, intent.buyType, baseType, quoteType],
      arguments: [ticket, tx.object(intent.intentId), coinForUser!, tx.object(poolId), tx.pure.bool(isBaseToQuote), tx.object.clock()],
    });
    console.debug(`[AMM] sellCoin: ${sellCoin ? 'OK' : 'UNDEFINED'}`);

    // ── Step 3: Swap sellCoin - recover more than estimatedOut of buyType ──
    if (isBaseToQuote) {
      const [baseRemainder, quoteBack, deepFee] = tx.add(
        this.suiClient.deepbook.deepBook.swapExactBaseForQuote({
          poolKey, amount: sellDecimals, deepAmount: 0,
          minOut: payoutDecimals, // quoteBack ≥ estimatedOut guaranteed by DEDUCTION
          baseCoin: sellCoin!,
        }),
      );
      // quoteBack > estimatedOut - net QUOTE profit
      tx.transferObjects([quoteBack!, baseRemainder!, deepFee!], this.address);
    } else {
      const [baseBack, quoteRemainder, deepFee] = tx.add(
        this.suiClient.deepbook.deepBook.swapExactQuoteForBase({
          poolKey, amount: sellDecimals, deepAmount: 0,
          minOut: payoutDecimals, // baseBack ≥ estimatedOut guaranteed by DEDUCTION
          quoteCoin: sellCoin as any,
        }),
      );
      // baseBack > estimatedOut - net BASE profit
      tx.transferObjects([baseBack!, quoteRemainder!, deepFee!], this.address);
    }
  }

  // ─── Balance Helpers ──────────────────────────────────────────────────────

  /**
   * Compute gross token amounts the solver must have before settlement.
   *
   *   Balanced CoW  : payoutToA of A.buyType  + payoutToB of B.buyType
   *   Hybrid-A      : payoutToB of A.sellType + ammSupplementForA of A.buyType
   *   Hybrid-B      : payoutToA of B.sellType + ammSupplementForB of B.buyType
   *   AMM route     : estimatedOut of intent.buyType
   *
   * Profitability is guaranteed by scorePair/buildAmmRoute (DEDUCTION factor),
   * so this is purely a liquidity check.
   */
  private computeCoinsNeeded(solution: BatchSolution): Map<string, bigint> {
    const needed = new Map<string, bigint>();
    const add = (type: string, amount: bigint) =>
      needed.set(type, (needed.get(type) ?? 0n) + amount);

    for (const pair of solution.cowPairs) {
      if (pair.ammSupplementForA) {
        // Hybrid-A: large=A sells BASE, small=B sells QUOTE
        add(pair.intentA.sellType, pair.payoutToB);          // BASE to fund B's payout
        add(pair.intentA.buyType, pair.ammSupplementForA!);  // QUOTE AMM supplement
      } else if (pair.ammSupplementForB) {
        // Hybrid-B: large=B sells QUOTE, small=A sells BASE
        add(pair.intentB.sellType, pair.payoutToA);          // QUOTE to fund A's payout
        add(pair.intentB.buyType, pair.ammSupplementForB!);  // BASE AMM supplement
      } else {
        // Balanced CoW
        add(pair.intentA.buyType, pair.payoutToA);
        add(pair.intentB.buyType, pair.payoutToB);
      }
    }

    for (const route of solution.ammRoutes) {
      add(route.intent.buyType, route.estimatedOut);
    }

    return needed;
  }

  /**
   * Query all coin objects of the given types owned by the solver.
   * Paginates fully via suix_getCoins JSON-RPC and returns total balance + objects.
   */
  private async fetchSolverCoins(
    types: string[],
  ): Promise<Map<string, { totalBalance: bigint; coins: { objectId: string; balance: bigint }[] }>> {
    const result = new Map<
      string,
      { totalBalance: bigint; coins: { objectId: string; balance: bigint }[] }
    >();

    await Promise.all(
      types.map(async (coinType) => {
        try {
          let totalBalance = 0n;
          const coins: { objectId: string; balance: bigint }[] = [];
          let cursor: string | null = null;

          do {
            const resp = await fetch(this.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0', id: 1,
                method: 'suix_getCoins',
                params: [this.address, coinType, cursor, 50],
              }),
            });
            const json = await resp.json() as { result: { data: { coinObjectId: string; balance: string }[]; hasNextPage: boolean; nextCursor?: string } };
            const page = json.result;
            for (const c of page.data) {
              const bal = BigInt(c.balance);
              totalBalance += bal;
              coins.push({ objectId: c.coinObjectId, balance: bal });
            }
            cursor = page.hasNextPage ? (page.nextCursor ?? null) : null;
          } while (cursor != null);

          result.set(coinType, { totalBalance, coins });
        } catch (err) {
          console.warn(`[SolverA] fetchSolverCoins ${shortType(coinType)}:`, err);
          result.set(coinType, { totalBalance: 0n, coins: [] });
        }
      }),
    );

    return result;
  }

  /**
   * Wire solver coin objects into the PTB.
   * Returns Map<coinType, TransactionObjectArgument> for splitCoins usage.
   *   SUI - tx.gas (gas coin is SUI)
   *   Others - tx.object(firstCoin), merging remaining coins if any
   */
  private buildCoinInputMap(
    tx: Transaction,
    solverCoinsData: Map<string, { totalBalance: bigint; coins: { objectId: string; balance: bigint }[] }>,
    coinsNeeded: Map<string, bigint>,
  ): Map<string, any> {
    const SUI_TYPE = SUI_METADATA.type;
    const map = new Map<string, any>();

    for (const type of coinsNeeded.keys()) {
      if (type === SUI_TYPE) {
        // SUI is the gas coin — use tx.gas for splitCoins
        map.set(type, tx.gas);
      } else {
        const data = solverCoinsData.get(type);
        if (!data || data.coins.length === 0) {
          throw new Error(`No coins of type ${shortType(type)} available`);
        }
        const [first, ...rest] = data.coins;
        const masterCoin = tx.object(first!.objectId);
        if (rest.length > 0) {
          tx.mergeCoins(masterCoin, rest.map((c) => tx.object(c.objectId)));
        }
        map.set(type, masterCoin);
      }
    }

    return map;
  }



  /**
   * Poll until batch reaches Done/Failed phase, then claim bond refund.
   * claim_refund(state) requires phase == Done || Failed.
   * Exponential backoff capped at REFUND_POLL_INTERVAL_MS * REFUND_MAX_ATTEMPTS.
   */
  private scheduleRefund(auctionStateId: string, attempt = 0): void {
    if (attempt >= CONFIG.REFUND_MAX_ATTEMPTS) {
      console.error(
        `[SolverA] Refund: max attempts reached for ${short(auctionStateId)}`,
      );
      return;
    }

    setTimeout(async () => {
      try {
        await this.claimRefund(auctionStateId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("EWrongPhase") || msg.includes("MoveAbort")) {
          // Batch not done yet — retry
          console.debug(
            `[SolverA] Refund: batch not done yet — retry ${attempt + 1}`,
          );
          this.scheduleRefund(auctionStateId, attempt + 1);
        } else {
          console.error(`[SolverA] Refund error:`, err);
        }
      }
    }, CONFIG.REFUND_POLL_INTERVAL_MS);
  }

  private async claimRefund(auctionStateId: string): Promise<void> {
    const tx = new Transaction();

    // claim_refund(state)
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::claim_refund`,
      arguments: [tx.object(auctionStateId)],
    });

    const result = await this.executor.executeTransaction(tx, {
      effects: true,
    });

    if (result.$kind === "FailedTransaction") {
      throw new Error(
        result.FailedTransaction.status.error?.message ?? "claim_refund failed",
      );
    }
    console.log(`[SolverA] Bond claimed digest=${result.Transaction.digest}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Resolve the on-chain pool object address from DeepBook SDK constants.
   */
  private resolveDeepBookPoolId(poolKey: string): string {
    const poolMap = CONFIG.NETWORK === "mainnet" ? mainnetPools : testnetPools;
    const pool = (poolMap as Record<string, { address: string }>)[poolKey];
    if (!pool)
      throw new Error(`No DeepBook pool config for poolKey=${poolKey}`);
    return pool.address;
  }

  /**
   * Fetch shared object metadata (initialSharedVersion) for intent IDs in parallel.
   * Required to construct SharedObjectRef for PTB arguments.
   */
  private cleanupBatch(solution: BatchSolution): void {
    for (const p of solution.cowPairs) {
      this.intentPool.remove(p.intentA.intentId);
      this.intentPool.remove(p.intentB.intentId);
    }
    for (const r of solution.ammRoutes) {
      this.intentPool.remove(r.intent.intentId);
    }
    this.activeSolution = null;
    console.log(`[SolverA] Cleaned up #${solution.batchId}`);
  }
}

// ─── Pure Utils ───────────────────────────────────────────────────────────────

/**
 * Convert `sellAmount` (in sell-token raw units) - buy-token raw units using
 * a DeepBook mid-price scaled by FLOAT_SCALING, with decimal correction.
 *
 *   diff = quoteDecimals − baseDecimals
 *   DF   = 10^max(diff, 0)   (mul numerator when quote has more decimals)
 *   DR   = 10^max(-diff, 0)  (mul denominator when base has more decimals)
 *
 *   base-quote:  sellAmount × mid × DF / (FS × DR)
 *   quote-base:  sellAmount × FS × DR / (mid × DF)
 */
function applyDecimalFactor(
  pool: { isBaseToQuote: boolean; baseDecimals: number; quoteDecimals: number },
  sellAmount: bigint,
  mid: bigint,
  FS: bigint,
): bigint {
  const diff = pool.quoteDecimals - pool.baseDecimals;
  const DF = diff >= 0 ? 10n ** BigInt(diff) : 1n;
  const DR = diff < 0 ? 10n ** BigInt(-diff) : 1n;
  if (pool.isBaseToQuote) {
    // sell base, get quote
    return (sellAmount * mid * DF) / (FS * DR);
  } else {
    // sell quote, get base
    return (sellAmount * FS * DR) / (mid * DF);
  }
}

/** Ensure a Sui struct type has a 0x-prefixed address segment. */
function normalizeType(t: string): string {
  // e.g. "36dbef...::deep::DEEP" - "0x36dbef...::deep::DEEP"
  // but "0x2::sui::SUI" is already fine
  return t.replace(/^([^:]+)::/, (_, addr) =>
    addr.startsWith("0x") ? `${addr}::` : `0x${addr}::`,
  );
}

function shortType(t: string): string {
  const parts = t.split("::");
  return parts[parts.length - 1] ?? t;
}

function short(id: string): string {
  return id.slice(0, 10) + "…";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  assertConfig();

  const solver = new SolverA();
  const grpcClient = new GrpcEventClient(CONFIG.GRPC_HOST, CONFIG.GRPC_PORT);

  grpcClient.on((event) => {
    console.log(`[SolverA] Event: ${event.type} ${JSON.stringify(event.data)}`);
    switch (event.type) {
      case "INTENT_CREATED":
        solver.onIntentCreated(event.data);
        break;

      case "INTENT_CANCELLED":
        solver.onIntentCancelled(event.data.intent_id);
        break;

      case "BATCH_OPENED":
        solver
          .onBatchOpened(event.data)
          .catch((err) => console.error("[SolverA] onBatchOpened error:", err));
        break;

      case "WINNER_SELECTED":
        solver
          .onWinnerSelected(event.data)
          .catch((err) =>
            console.error("[SolverA] onWinnerSelected error:", err),
          );
        break;

      default:
        console.debug("[SolverA] Unknown event:", (event as any).type);
    }
  });

  grpcClient.connect();

  process.on("SIGINT", () => {
    console.log("\n[SolverA] SIGINT — shutting down");
    grpcClient.destroy();
    process.exit(0);
  });

  // Keep process alive
  await new Promise<void>(() => {});
}

main().catch((err) => {
  console.error("[SolverA] Fatal:", err);
  process.exit(1);
});
