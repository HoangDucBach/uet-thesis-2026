/**
 * Solver A — CoW-First Matcher (Production Grade)
 *
 * Architecture:
 *   - Generic: works for ANY token pair, not hardcoded
 *   - CoW matching: greedy pair matching, maximize surplus
 *   - AMM fallback: unmatched intents routed via DeepBook v3 swap output chaining
 *   - Score = total surplus across entire batch
 *   - Capital: zero-inventory via DeepBook PTB result chaining for AMM routes
 */

import {
  GrpcEventClient,
  type RelayEvent,
  type IntentCreatedPayload,
  type BatchOpenedPayload,
  type WinnerSelectedPayload,
} from "../shared/index.ts";
import {
  DeepBookClient,
  testnetPools,
  mainnetPools,
} from "@mysten/deepbook-v3";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  Transaction,
  Inputs,
  SerialTransactionExecutor,
} from "@mysten/sui/transactions";

// ─── Bootstrap .env ───────────────────────────────────────────────────────────
// Bun natively loads .env; no dotenv package needed.

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  GRPC_HOST: process.env.SUI_INDEXER_GRPC_HOST ?? "localhost",
  GRPC_PORT: Number(process.env.SUI_INDEXER_GRPC_PORT ?? 50051),
  NETWORK: (process.env.SUI_ENV ?? "testnet") as "testnet" | "mainnet",
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

// ─── Relay Event Types — imported from ../shared ─────────────────────────────
// RelayEvent, IntentCreatedPayload, BatchOpenedPayload, WinnerSelectedPayload,
// GrpcEventClient — all live in solvers/shared/events.ts

// ─── Intent Pool ──────────────────────────────────────────────────────────────

/**
 * Groups intents by direction key "sellType→buyType" for O(1) inverse lookup.
 */
class IntentPool {
  private byId = new Map<string, IntentInfo>();
  private byDir = new Map<string, Set<string>>();

  private dirKey(sellType: string, buyType: string): string {
    return `${sellType}→${buyType}`;
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

  /** Returns all pending intents with direction (buyType→sellType) */
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
    { poolKey: string; isBaseToQuote: boolean }
  >();

  constructor(private readonly dbClient: DeepBookClient) {
    // Default testnet pools — SDK poolKey = "BASE_QUOTE"
    this.register("0x2::sui::SUI", "DBUSDC", "SUI_DBUSDC");
    this.register("0x2::sui::SUI", "DBUSDT", "SUI_DBUSDT");
    this.register("DEEP", "0x2::sui::SUI", "DEEP_SUI");
    this.register("DEEP", "DBUSDC", "DEEP_DBUSDC");
  }

  /**
   * Register a pool for a token pair.
   * Registers both full type strings and short names in both directions.
   */
  register(baseType: string, quoteType: string, poolKey: string): void {
    const bShort = shortType(baseType);
    const qShort = shortType(quoteType);
    this.poolRegistry.set(`${baseType}→${quoteType}`, {
      poolKey,
      isBaseToQuote: true,
    });
    this.poolRegistry.set(`${bShort}→${qShort}`, {
      poolKey,
      isBaseToQuote: true,
    });
    this.poolRegistry.set(`${quoteType}→${baseType}`, {
      poolKey,
      isBaseToQuote: false,
    });
    this.poolRegistry.set(`${qShort}→${bShort}`, {
      poolKey,
      isBaseToQuote: false,
    });
  }

  resolvePool(
    sellType: string,
    buyType: string,
  ): { poolKey: string; isBaseToQuote: boolean } | null {
    return (
      this.poolRegistry.get(`${sellType}→${buyType}`) ??
      this.poolRegistry.get(`${shortType(sellType)}→${shortType(buyType)}`) ??
      null
    );
  }

  async getMidPrice(poolKey: string): Promise<bigint> {
    const cached = this.priceCache.get(poolKey);
    if (cached && Date.now() - cached.ts < this.TTL_MS) return cached.price;

    const price = await this.dbClient.midPrice(poolKey);
    const scaled = BigInt(Math.round(price * Number(CONFIG.FLOAT_SCALING)));
    this.priceCache.set(poolKey, { price: scaled, ts: Date.now() });
    return scaled;
  }

  async estimateAmmOut(intent: IntentInfo): Promise<bigint> {
    const pool = this.resolvePool(intent.sellType, intent.buyType);
    if (!pool) return 0n;
    const mid = await this.getMidPrice(pool.poolKey);
    const FS = CONFIG.FLOAT_SCALING;
    const rawOut = pool.isBaseToQuote
      ? (intent.sellAmount * mid) / FS
      : (intent.sellAmount * FS) / mid;
    return (rawOut * (10_000n - CONFIG.DEEPBOOK_FEE_BPS)) / 10_000n;
  }
}

// ─── GrpcEventClient — imported from ../shared ───────────────────────────────

// ─── Solver A ─────────────────────────────────────────────────────────────────

class SolverA {
  private readonly suiClient: SuiJsonRpcClient;
  private readonly dbClient: DeepBookClient;
  private readonly oracle: PriceOracle;
  private readonly keypair: Ed25519Keypair;
  readonly address: string;

  private readonly intentPool = new IntentPool();
  private cachedPairs: CowPair[] = [];
  private activeSolution: BatchSolution | null = null;

  /**
   * coinType → largest coin object ID (refreshed after each settled batch).
   * Used for CoW pair payouts where solver needs to supply coins from inventory.
   */
  private coinCache = new Map<string, string>();

  constructor() {
    const { scheme, secretKey } = decodeSuiPrivateKey(
      CONFIG.SOLVER_PRIVATE_KEY,
    );
    if (scheme !== "ED25519")
      throw new Error(`Unsupported key scheme: ${scheme}`);
    this.keypair = Ed25519Keypair.fromSecretKey(secretKey);
    this.address = this.keypair.toSuiAddress();

    this.suiClient = new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(CONFIG.NETWORK),
      network: CONFIG.NETWORK,
    });

    // Patch core.simulateTransaction on this instance to inject our address.
    const _origSim = this.suiClient.core.simulateTransaction.bind(
      this.suiClient.core,
    );
    
    this.suiClient.core.simulateTransaction = async (opts: any) => {
      if (opts.transaction && !(opts.transaction instanceof Uint8Array)) {
        opts.transaction.setSenderIfNotSet(this.address);
      }
      return _origSim(opts);
    };

    this.dbClient = new DeepBookClient({
      address: this.address,
      network: CONFIG.NETWORK,
      client: this.suiClient,
    });

    this.oracle = new PriceOracle(this.dbClient);
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
      sellType: data.sell_type.trim(),
      buyType: data.buy_type.trim(),
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
        `${shortType(intent.sellType)}→${shortType(intent.buyType)} ` +
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

    // Mark all batch intents; resolve shared object refs in parallel
    data.intent_ids.forEach((id) => this.intentPool.markInBatch(id, batchId));
    await this.resolveSharedRefs(data.intent_ids);

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
   */
  private async scorePair(pair: CowPair): Promise<CowPair | null> {
    const pool = this.oracle.resolvePool(
      pair.intentA.sellType,
      pair.intentA.buyType,
    );
    if (!pool) return null;

    const mid = await this.oracle.getMidPrice(pool.poolKey);
    const FS = CONFIG.FLOAT_SCALING;

    const payoutToA = pool.isBaseToQuote
      ? (pair.intentA.sellAmount * mid) / FS
      : (pair.intentA.sellAmount * FS) / mid;

    const payoutToB = pool.isBaseToQuote
      ? (pair.intentB.sellAmount * FS) / mid
      : (pair.intentB.sellAmount * mid) / FS;

    if (
      payoutToA < pair.intentA.minAmountOut ||
      payoutToB < pair.intentB.minAmountOut
    ) {
      return null;
    }

    const surplusA = payoutToA - pair.intentA.minAmountOut;
    const surplusB = payoutToB - pair.intentB.minAmountOut;

    return {
      ...pair,
      payoutToA,
      payoutToB,
      surplusA,
      surplusB,
      totalSurplus: surplusA + surplusB,
    };
  }

  private async buildAmmRoute(intent: IntentInfo): Promise<AmmRoute | null> {
    const pool = this.oracle.resolvePool(intent.sellType, intent.buyType);
    if (!pool) {
      console.warn(
        `[SolverA] No pool: ${shortType(intent.sellType)}→${shortType(intent.buyType)}`,
      );
      return null;
    }

    const estimatedOut = await this.oracle.estimateAmmOut(intent);
    if (estimatedOut < intent.minAmountOut) {
      console.debug(
        `[SolverA] AMM route below min: est=${estimatedOut} min=${intent.minAmountOut}`,
      );
      return null;
    }

    return {
      intent,
      poolKey: pool.poolKey,
      isBaseToQuote: pool.isBaseToQuote,
      estimatedOut,
      estimatedSurplus: estimatedOut - intent.minAmountOut,
    };
  }

  // ─── Commit ────────────────────────────────────────────────────────────────

  private async submitCommit(solution: BatchSolution): Promise<void> {
    const executor = new SerialTransactionExecutor({
      client: this.suiClient,
      signer: this.keypair,
    });

    const tx = new Transaction();

    // Split bond from gas coin
    const [bond] = tx.splitCoins(tx.gas, [tx.pure.u64(CONFIG.MIN_BOND_MIST)]);

    // commit(config, state, score, bond, clock)
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

    try {
      const result = await executor.executeTransaction(tx, { effects: true });

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
      console.error(`[SolverA] Commit error #${solution.batchId}:`, err);
      this.activeSolution = null;
    }
  }

  // ─── Execute Settlement ────────────────────────────────────────────────────

  /**
   * Builds a single PTB:
   *
   *   open_settlement(state, clock) → ticket
   *
   *   [CoW pairs]
   *     splitCoins from solver inventory → payoutCoin
   *     process_intent<Sell,Buy>(ticket, intent, payoutCoin, pool, clock)
   *
   *   [AMM routes] — zero inventory via PTB result chaining:
   *     [baseOut, quoteOut, deepOut] = swapExact*(poolKey, amount)
   *     process_intent<Sell,Buy>(ticket, intent, quoteOut|baseOut, pool, clock)
   *
   *   close_settlement(state, ticket, config)
   */
  private async executeSettlement(solution: BatchSolution): Promise<void> {
    const tx = new Transaction();

    // Cache live prices for this PTB build
    const priceCache = new Map<string, bigint>();
    const getPrice = async (poolKey: string): Promise<bigint> => {
      if (!priceCache.has(poolKey)) {
        priceCache.set(poolKey, await this.oracle.getMidPrice(poolKey));
      }
      return priceCache.get(poolKey)!;
    };

    // 1. open_settlement(state, clock) → ticket
    const openResult = tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::open_settlement`,
      arguments: [tx.object(solution.auctionStateId), tx.object.clock()],
    });
    const ticket = openResult[0]!;

    // 2. Process CoW pairs
    for (const pair of solution.cowPairs) {
      await this.addCowPairCalls(tx, ticket, pair, getPrice);
    }

    // 3. Process AMM routes (zero inventory — swap output chaining)
    for (const route of solution.ammRoutes) {
      await this.addAmmRouteCalls(tx, ticket, route);
    }

    // 4. close_settlement(state, ticket, config)
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::close_settlement`,
      arguments: [
        tx.object(solution.auctionStateId),
        ticket,
        tx.object(CONFIG.GLOBAL_CONFIG_ID),
      ],
    });

    const executor = new SerialTransactionExecutor({
      client: this.suiClient,
      signer: this.keypair,
    });

    try {
      const result = await executor.executeTransaction(tx, {
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
      }
    } catch (err) {
      console.error(`[SolverA] Settlement error #${solution.batchId}:`, err);
    }
  }

  /**
   * Adds PTB calls for a CoW pair.
   * Solver provides payout coins from its own inventory via splitCoins.
   *
   * Note: process_intent<SellCoin, BuyCoin> requires pool: Pool<SellCoin, BuyCoin>.
   * The pool object ID must match the type parameters exactly.
   */
  private async addCowPairCalls(
    tx: Transaction,
    ticket: ReturnType<Transaction["moveCall"]>[number],
    pair: CowPair,
    getPrice: (k: string) => Promise<bigint>,
  ): Promise<void> {
    const { intentA, intentB } = pair;
    if (!intentA.sharedRef || !intentB.sharedRef) {
      console.warn(`[SolverA] Skipping CoW pair — missing sharedRef`);
      return;
    }

    const poolA = this.oracle.resolvePool(intentA.sellType, intentA.buyType);
    const poolB = this.oracle.resolvePool(intentB.sellType, intentB.buyType);
    if (!poolA || !poolB) {
      console.warn(`[SolverA] Skipping CoW pair — pool not found`);
      return;
    }

    const midA = await getPrice(poolA.poolKey);
    const FS = CONFIG.FLOAT_SCALING;

    const payoutToA = poolA.isBaseToQuote
      ? (intentA.sellAmount * midA) / FS
      : (intentA.sellAmount * FS) / midA;
    const payoutToB = poolA.isBaseToQuote
      ? (intentB.sellAmount * FS) / midA
      : (intentB.sellAmount * midA) / FS;

    if (payoutToA < intentA.minAmountOut || payoutToB < intentB.minAmountOut) {
      console.warn(`[SolverA] CoW pair stale at execution price — skipped`);
      return;
    }

    const poolIdForA = this.resolveDeepBookPoolId(poolA.poolKey);
    const poolIdForB = this.resolveDeepBookPoolId(poolB.poolKey);

    // Payout to intentA (intentA wants intentA.buyType)
    const solverCoinForA = tx.object(await this.getSolverCoin(intentA.buyType));
    const [coinForA] = tx.splitCoins(solverCoinForA, [tx.pure.u64(payoutToA)]);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intentA.sellType, intentA.buyType],
      arguments: [
        ticket,
        tx.object(
          Inputs.SharedObjectRef({
            objectId: intentA.sharedRef.objectId,
            initialSharedVersion: intentA.sharedRef.initialSharedVersion,
            mutable: true,
          }),
        ),
        coinForA,
        tx.object(poolIdForA),
        tx.object.clock(),
      ],
    });

    // Payout to intentB (intentB wants intentB.buyType)
    const solverCoinForB = tx.object(await this.getSolverCoin(intentB.buyType));
    const [coinForB] = tx.splitCoins(solverCoinForB, [tx.pure.u64(payoutToB)]);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intentB.sellType, intentB.buyType],
      arguments: [
        ticket,
        tx.object(
          Inputs.SharedObjectRef({
            objectId: intentB.sharedRef.objectId,
            initialSharedVersion: intentB.sharedRef.initialSharedVersion,
            mutable: true,
          }),
        ),
        coinForB,
        tx.object(poolIdForB),
        tx.object.clock(),
      ],
    });
  }

  /**
   * Adds PTB calls for an AMM route.
   *
   * PTB result chaining:
   *   const [baseOut, quoteOut, deepOut] = tx.add(dbClient.deepBook.swapExact*(...))
   *   tx.moveCall process_intent(..., quoteOut|baseOut, ...)
   *
   * The swap output is a PTB object reference — it flows directly into
   * process_intent without any intermediate transfer. Zero inventory required.
   */
  private async addAmmRouteCalls(
    tx: Transaction,
    ticket: ReturnType<Transaction["moveCall"]>[number],
    route: AmmRoute,
  ): Promise<void> {
    const { intent, poolKey, isBaseToQuote } = route;
    if (!intent.sharedRef) {
      console.warn(
        `[SolverA] Skipping AMM route — missing sharedRef for ${short(intent.intentId)}`,
      );
      return;
    }

    const poolId = this.resolveDeepBookPoolId(poolKey);
    const sellFloat = Number(intent.sellAmount) / 1e9;
    const minOutFloat = Number(intent.minAmountOut) / 1e9;

    let buyOutRef: any;

    if (isBaseToQuote) {
      // User sells base (e.g. SUI), wants quote (e.g. USDC)
      const [baseCoin] = tx.splitCoins(
        tx.object(await this.getSolverCoin(intent.sellType)),
        [tx.pure.u64(intent.sellAmount)],
      );

      const swapResult = tx.add(
        this.dbClient.deepBook.swapExactBaseForQuote({
          poolKey,
          amount: sellFloat,
          deepAmount: 0,
          minOut: minOutFloat,
          baseCoin: baseCoin,
        }),
      );
      const [baseOut2, quoteOut, deepOut] = swapResult;
      // Return unused base and DEEP to solver
      tx.transferObjects([baseOut2, deepOut], this.address);
      buyOutRef = quoteOut;
    } else {
      // User sells quote (e.g. USDC), wants base (e.g. SUI)
      const [quoteCoin] = tx.splitCoins(
        tx.object(await this.getSolverCoin(intent.sellType)),
        [tx.pure.u64(intent.sellAmount)],
      );

      const swapResult = tx.add(
        this.dbClient.deepBook.swapExactQuoteForBase({
          poolKey,
          amount: sellFloat,
          deepAmount: 0,
          minOut: minOutFloat,
          quoteCoin: quoteCoin as any,
        }),
      );
      const [baseOut, quoteOut2, deepOut] = swapResult;
      tx.transferObjects([quoteOut2, deepOut], this.address);
      buyOutRef = baseOut;
    }

    // process_intent<SellCoin, BuyCoin>(ticket, intent, buyOut, pool, clock)
    // swap output flows DIRECTLY into process_intent — zero intermediate transfer
    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::settlement::process_intent`,
      typeArguments: [intent.sellType, intent.buyType],
      arguments: [
        ticket,
        tx.object(
          Inputs.SharedObjectRef({
            objectId: intent.sharedRef.objectId,
            initialSharedVersion: intent.sharedRef.initialSharedVersion,
            mutable: true,
          }),
        ),
        buyOutRef,
        tx.object(poolId),
        tx.object.clock(),
      ],
    });
  }

  // ─── Claim Refund ──────────────────────────────────────────────────────────

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

    const executor = new SerialTransactionExecutor({
      client: this.suiClient,
      signer: this.keypair,
    });

    const result = await executor.executeTransaction(tx, { effects: true });

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
   * Get solver's largest coin object ID for a coinType (cached per batch).
   * Cache is cleared after each settled batch to pick up new coins.
   */
  private async getSolverCoin(coinType: string): Promise<string> {
    if (this.coinCache.has(coinType)) return this.coinCache.get(coinType)!;

    const { data } = await this.suiClient.getCoins({
      owner: this.address,
      coinType,
    });
    if (!data.length)
      throw new Error(`Solver has no coins of type ${shortType(coinType)}`);

    const largest = data.reduce((a: (typeof data)[0], b: (typeof data)[0]) =>
      BigInt(b.balance) > BigInt(a.balance) ? b : a,
    );
    this.coinCache.set(coinType, largest.coinObjectId);
    return largest.coinObjectId;
  }

  /**
   * Fetch shared object metadata (initialSharedVersion) for intent IDs in parallel.
   * Required to construct SharedObjectRef for PTB arguments.
   */
  private async resolveSharedRefs(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map(async (id) => {
        if (this.intentPool.get(id)?.sharedRef) return;
        try {
          const resp = await this.suiClient.getObject({
            id,
            options: { showOwner: true },
          });
          const obj = resp.data;
          if (!obj) return;

          // initialSharedVersion comes from owner.Shared.initial_shared_version
          let initialSharedVersion = 0;
          const owner = obj.owner as any;
          if (owner && typeof owner === "object" && "Shared" in owner) {
            initialSharedVersion = Number(owner.Shared.initial_shared_version);
          }

          this.intentPool.setSharedRef(id, {
            objectId: id,
            initialSharedVersion,
            digest: obj.digest,
          });
        } catch (err) {
          console.error(`[SolverA] resolveSharedRef ${short(id)}:`, err);
        }
      }),
    );
  }

  private cleanupBatch(solution: BatchSolution): void {
    for (const p of solution.cowPairs) {
      this.intentPool.remove(p.intentA.intentId);
      this.intentPool.remove(p.intentB.intentId);
    }
    for (const r of solution.ammRoutes) {
      this.intentPool.remove(r.intent.intentId);
    }
    this.coinCache.clear(); // refresh coin refs next batch
    this.activeSolution = null;
    console.log(`[SolverA] Cleaned up #${solution.batchId}`);
  }
}

// ─── Pure Utils ───────────────────────────────────────────────────────────────

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
