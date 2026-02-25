import { CacheService } from 'src/cache/cache.service';
import { ChainService } from 'src/chain/chain.service';
import { SETTLEMENT } from 'src/contracts/constants';

import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import { BatchStateService } from './batch-state.service';

/** Sui GraphQL returns u64 as string in JSON to avoid JS precision loss. */
interface WinnerSelectedJson {
  batch_id: string;
  winner: string;
  winner_score: string;
  runner_up?: string;
  runner_up_score: string;
}

interface SettlementCompleteJson {
  batch_id: string;
  winner: string;
  actual_cow_pairs: string;
  committed_score: string;
}

interface FallbackTriggeredJson {
  batch_id: string;
  winner: string;
  bond_slashed: string;
}

const CURSORS = {
  WINNER: 'watcher:cursor:winner',
  SETTLEMENT: 'watcher:cursor:settlement',
  FALLBACK: 'watcher:cursor:fallback',
} as const;

const CURSOR_TTL = 7 * 24 * 60 * 60; // 7 days

/**
 * Polls the three settlement outcome events and syncs batch state to Redis.
 *
 * | Event                  | BatchStatus transition         |
 * |------------------------|-------------------------------|
 * | WinnerSelectedEvent    | opened / committed → executing |
 * | SettlementCompleteEvent| executing → settled            |
 * | FallbackTriggeredEvent | any → failed                   |
 */
@Injectable()
export class WinnerWatcherService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(WinnerWatcherService.name);

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  private readonly POLL_INTERVAL_MS = 3_000;
  private readonly EVENT_LIMIT = 50;

  constructor(
    private readonly chainService: ChainService,
    private readonly batchState: BatchStateService,
    private readonly cache: CacheService,
  ) {}

  onModuleInit() {
    this.isRunning = true;
    this.logger.log('WinnerWatcher started');
    this.schedulePoll();
  }

  onApplicationShutdown() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ── poll loop ──────────────────────────────────────────────────────────────

  private schedulePoll() {
    this.pollTimer = setTimeout(() => {
      this.pollAll().catch((err: unknown) => {
        this.logger.error('WinnerWatcher poll error:', err);
      });
    }, this.POLL_INTERVAL_MS);
  }

  private async pollAll() {
    try {
      await Promise.all([
        this.pollWinnerSelected(),
        this.pollSettlementComplete(),
        this.pollFallbackTriggered(),
      ]);
    } finally {
      if (this.isRunning) this.schedulePoll();
    }
  }

  // ── individual event pollers ───────────────────────────────────────────────

  private async pollWinnerSelected() {
    const cursor = await this.cache.get(CURSORS.WINNER);
    const result = await this.chainService.queryEventsPaginated({
      module: SETTLEMENT.MODULE_NAME,
      eventType: SETTLEMENT.EVENTS.WINNER_SELECTED,
      limit: this.EVENT_LIMIT,
      cursor: cursor ?? undefined,
    });

    if (!result || !('nodes' in result)) return;

    for (const node of result.nodes) {
      if (!node?.contents?.json) continue;
      const ev = node.contents.json as WinnerSelectedJson;
      const batchId = BigInt(ev.batch_id);
      const batch = await this.batchState.getByOnChainBatchId(batchId);
      if (!batch) {
        this.logger.warn(
          `WinnerSelectedEvent: no local batch for batch_id=${batchId}`,
        );
        continue;
      }
      this.logger.log(
        `WinnerSelected batch_id=${batchId} winner=${ev.winner} → executing`,
      );
      await this.batchState.updateStatus(batch.localBatchId, {
        status: 'executing',
      });
    }

    if ('pageInfo' in result && result.pageInfo?.endCursor) {
      await this.cache.set(
        CURSORS.WINNER,
        result.pageInfo.endCursor,
        CURSOR_TTL,
      );
    }
  }

  private async pollSettlementComplete() {
    const cursor = await this.cache.get(CURSORS.SETTLEMENT);
    const result = await this.chainService.queryEventsPaginated({
      module: SETTLEMENT.MODULE_NAME,
      eventType: SETTLEMENT.EVENTS.SETTLEMENT_COMPLETE,
      limit: this.EVENT_LIMIT,
      cursor: cursor ?? undefined,
    });

    if (!result || !('nodes' in result)) return;

    for (const node of result.nodes) {
      if (!node?.contents?.json) continue;
      const ev = node.contents.json as SettlementCompleteJson;
      const batchId = BigInt(ev.batch_id);
      const batch = await this.batchState.getByOnChainBatchId(batchId);
      if (!batch) {
        this.logger.warn(
          `SettlementCompleteEvent: no local batch for batch_id=${batchId}`,
        );
        continue;
      }
      this.logger.log(
        `SettlementComplete batch_id=${batchId} winner=${ev.winner} → settled`,
      );
      await this.batchState.updateStatus(batch.localBatchId, {
        status: 'settled',
        settledAt: Date.now(),
      });
    }

    if ('pageInfo' in result && result.pageInfo?.endCursor) {
      await this.cache.set(
        CURSORS.SETTLEMENT,
        result.pageInfo.endCursor,
        CURSOR_TTL,
      );
    }
  }

  private async pollFallbackTriggered() {
    const cursor = await this.cache.get(CURSORS.FALLBACK);
    const result = await this.chainService.queryEventsPaginated({
      module: SETTLEMENT.MODULE_NAME,
      eventType: SETTLEMENT.EVENTS.FALLBACK_TRIGGERED,
      limit: this.EVENT_LIMIT,
      cursor: cursor ?? undefined,
    });

    if (!result || !('nodes' in result)) return;

    for (const node of result.nodes) {
      if (!node?.contents?.json) continue;
      const ev = node.contents.json as FallbackTriggeredJson;
      const batchId = BigInt(ev.batch_id);
      const batch = await this.batchState.getByOnChainBatchId(batchId);
      if (!batch) {
        this.logger.warn(
          `FallbackTriggeredEvent: no local batch for batch_id=${batchId}`,
        );
        continue;
      }
      this.logger.log(
        `FallbackTriggered batch_id=${batchId} winner=${ev.winner} bond_slashed=${ev.bond_slashed}`,
      );
      await this.batchState.updateStatus(batch.localBatchId, {
        status: 'failed',
        error: `trigger_fallback on-chain confirmed, bond_slashed=${ev.bond_slashed}`,
      });
    }

    if ('pageInfo' in result && result.pageInfo?.endCursor) {
      await this.cache.set(
        CURSORS.FALLBACK,
        result.pageInfo.endCursor,
        CURSOR_TTL,
      );
    }
  }
}
