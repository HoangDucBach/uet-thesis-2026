import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { BatchStatus } from './keeper.types';

const BATCH_STATUS_PREFIX = 'keeper:batch:status:';
const BATCH_AUCTION_PREFIX = 'keeper:batch:auction:';
const BATCH_ALL_KEY = 'keeper:batch:ids';
const BATCH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Persists batch state and on-chain mappings to Redis.
 *
 * Keys:
 *   keeper:batch:status:{localBatchId}  → serialized BatchStatus (TTL 7d)
 *   keeper:batch:auction:{onChainBatchId} → auctionStateId string (TTL 7d)
 *   keeper:batch:ids                    → Redis Set of all localBatchIds
 */
@Injectable()
export class BatchStateService {
  private readonly logger = new Logger(BatchStateService.name);

  constructor(private readonly cache: CacheService) {}

  async set(status: BatchStatus): Promise<void> {
    const key = `${BATCH_STATUS_PREFIX}${status.localBatchId}`;
    await Promise.all([
      this.cache.set(key, this.serialize(status), BATCH_TTL_SECONDS),
      this.cache.sadd(BATCH_ALL_KEY, status.localBatchId),
    ]);
  }

  async get(localBatchId: string): Promise<BatchStatus | null> {
    const raw = await this.cache.get(`${BATCH_STATUS_PREFIX}${localBatchId}`);
    return raw ? this.deserialize(raw) : null;
  }

  async getAll(): Promise<BatchStatus[]> {
    const ids = await this.cache.smembers(BATCH_ALL_KEY);
    const statuses = await Promise.all(ids.map((id) => this.get(id)));
    return statuses.filter((s): s is BatchStatus => s !== null);
  }

  async setAuctionStateId(
    onChainBatchId: string,
    auctionStateId: string,
  ): Promise<void> {
    await this.cache.set(
      `${BATCH_AUCTION_PREFIX}${onChainBatchId}`,
      auctionStateId,
      BATCH_TTL_SECONDS,
    );
  }

  async getAuctionStateId(onChainBatchId: string): Promise<string | null> {
    return await this.cache.get(`${BATCH_AUCTION_PREFIX}${onChainBatchId}`);
  }

  // ── serialization ─────────────────────────────────────────────────────────

  private serialize(status: BatchStatus): string {
    return JSON.stringify(status, (_, value) =>
      typeof value === 'bigint' ? value.toString() : 0,
    );
  }

  private deserialize(raw: string): BatchStatus {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.onChainBatchId === 'string') {
      parsed.onChainBatchId = BigInt(parsed.onChainBatchId);
    }
    return parsed as unknown as BatchStatus;
  }
}
