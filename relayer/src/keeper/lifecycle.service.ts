import { ChainService } from 'src/chain/chain.service';
import { CacheService } from 'src/cache/cache.service';
import { SETTLEMENT } from 'src/contracts/constants';
import { ContractConfigService } from 'src/contracts/contract-config.service';

import {
  SerialTransactionExecutor,
  Transaction,
} from '@mysten/sui/transactions';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

import { BatchStateService } from './batch-state.service';
import { BatchOpenResult } from './keeper.types';

/**
 * Lifecycle Management with Bull Queue Scheduler:
 * - Uses BullMQ for accurate (±100ms) delayed job scheduling
 * - Jobs persisted in Redis, survive process restarts
 * - Single shared SerialTransactionExecutor for on-chain calls
 * - Parallel batch execution via Promise.allSettled()
 *
 * Job types:
 *   - closeCommits: executed when now >= commitEndTime
 *   - triggerFallback: executed when now >= executeDeadlineTime
 */
@Injectable()
export class LifecycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LifecycleService.name);

  private executor: SerialTransactionExecutor | null = null;
  private readonly scheduled = new Set<string>();

  private closeCommitsQueue: Queue | null = null;
  private triggerFallbackQueue: Queue | null = null;

  private closeCommitsWorker: Worker | null = null;
  private triggerFallbackWorker: Worker | null = null;

  private readonly CLOSE_COMMITS_QUEUE_NAME = 'lifecycle:closeCommits';
  private readonly TRIGGER_FALLBACK_QUEUE_NAME = 'lifecycle:triggerFallback';

  constructor(
    private readonly chainService: ChainService,
    private readonly contractConfig: ContractConfigService,
    private readonly batchState: BatchStateService,
    private readonly cache: CacheService,
  ) {}

  async onModuleInit() {
    this.executor = new SerialTransactionExecutor({
      client: this.chainService.getClient(),
      signer: this.chainService.getKeypair(),
    });

    const redisClient = this.cache.getClient();

    // Initialize Bull queues
    this.closeCommitsQueue = new Queue(this.CLOSE_COMMITS_QUEUE_NAME, {
      connection: redisClient as any, // BullMQ accepts native Redis client
    });

    this.triggerFallbackQueue = new Queue(this.TRIGGER_FALLBACK_QUEUE_NAME, {
      connection: redisClient as any,
    });

    // Setup workers with concurrency 1 (SerialExecutor is serialized)
    this.closeCommitsWorker = new Worker(
      this.CLOSE_COMMITS_QUEUE_NAME,
      async (job) => this.handleCloseCommits(job.data),
      {
        connection: redisClient as any,
        concurrency: 1,
      },
    );

    this.triggerFallbackWorker = new Worker(
      this.TRIGGER_FALLBACK_QUEUE_NAME,
      async (job) => this.handleTriggerFallback(job.data),
      {
        connection: redisClient as any,
        concurrency: 1,
      },
    );

    // Recover any pending batches
    const batches = await this.batchState.getAll();
    let recovered = 0;

    for (const batch of batches) {
      if (
        batch.status === 'opened' &&
        batch.auctionStateId &&
        batch.commitEndTime &&
        batch.executeDeadlineTime
      ) {
        this.scheduleBatch({
          localBatchId: batch.localBatchId,
          auctionStateId: batch.auctionStateId,
          commitEndTime: BigInt(batch.commitEndTime),
          executeDeadlineTime: BigInt(batch.executeDeadlineTime),
        });
        recovered++;
      }
    }

    if (recovered > 0) {
      this.logger.log(`Recovered ${recovered} opened batch(es) from Redis`);
    }
  }

  async onModuleDestroy() {
    // Close workers and queues gracefully
    if (this.closeCommitsWorker) {
      await this.closeCommitsWorker.close();
    }
    if (this.triggerFallbackWorker) {
      await this.triggerFallbackWorker.close();
    }
    if (this.closeCommitsQueue) {
      await this.closeCommitsQueue.close();
    }
    if (this.triggerFallbackQueue) {
      await this.triggerFallbackQueue.close();
    }
  }

  scheduleBatch(
    result: Pick<
      BatchOpenResult,
      | 'localBatchId'
      | 'auctionStateId'
      | 'commitEndTime'
      | 'executeDeadlineTime'
    >,
  ) {
    const { auctionStateId, localBatchId, commitEndTime, executeDeadlineTime } =
      result;

    if (this.scheduled.has(auctionStateId)) return;
    this.scheduled.add(auctionStateId);

    const now = BigInt(Date.now());
    const commitDelay = commitEndTime > now ? Number(commitEndTime - now) : 0;
    const fallbackDelay =
      executeDeadlineTime > now ? Number(executeDeadlineTime - now) : 0;

    this.logger.log(
      `Lifecycle scheduled auctionState=${auctionStateId}: ` +
        `close_commits in ${commitDelay}ms, trigger_fallback in ${fallbackDelay}ms`,
    );

    // Schedule via Bull Queue with delay (persisted in Redis)
    void this.closeCommitsQueue?.add(
      `closeCommits-${auctionStateId}`,
      { auctionStateId, localBatchId },
      { delay: commitDelay, removeOnComplete: true },
    );

    void this.triggerFallbackQueue?.add(
      `triggerFallback-${auctionStateId}`,
      { auctionStateId, localBatchId },
      { delay: fallbackDelay, removeOnComplete: true },
    );
  }

  private async handleCloseCommits(data: {
    auctionStateId: string;
    localBatchId: string;
  }) {
    const { auctionStateId, localBatchId } = data;

    const pkg = this.contractConfig.getCowDexPackageId();
    const tx = new Transaction();
    tx.moveCall({
      package: pkg,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.CLOSE_COMMITS,
      arguments: [tx.object(auctionStateId), tx.object.clock()],
    });

    const result = await this.executor!.executeTransaction(tx);

    if (result.$kind === 'FailedTransaction') {
      this.logger.error(
        `closeCommits failed for ${auctionStateId}: ${result.FailedTransaction.status.error?.message}`,
      );
      throw new Error(
        `closeCommits transaction failed: ${result.FailedTransaction.status.error?.message}`,
      );
    }

    this.logger.log(
      `closeCommits ok auctionState=${auctionStateId} digest=${result.Transaction.digest}`,
    );

    await this.batchState.updateStatus(localBatchId, { status: 'committed' });
  }

  private async handleTriggerFallback(data: {
    auctionStateId: string;
    localBatchId: string;
  }) {
    const { auctionStateId, localBatchId } = data;

    // Check if batch already settled
    const current = await this.batchState.get(localBatchId);
    if (current?.status === 'settled') {
      this.logger.log(
        `Batch ${localBatchId} already settled — skipping trigger_fallback`,
      );
      return;
    }

    const pkg = this.contractConfig.getCowDexPackageId();
    const tx = new Transaction();
    tx.moveCall({
      package: pkg,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.TRIGGER_FALLBACK,
      arguments: [tx.object(auctionStateId), tx.object.clock()],
    });

    const result = await this.executor!.executeTransaction(tx);

    if (result.$kind === 'FailedTransaction') {
      this.logger.error(
        `triggerFallback failed for ${auctionStateId}: ${result.FailedTransaction.status.error?.message}`,
      );
      throw new Error(
        `triggerFallback transaction failed: ${result.FailedTransaction.status.error?.message}`,
      );
    }

    this.logger.log(
      `triggerFallback ok auctionState=${auctionStateId} digest=${result.Transaction.digest}`,
    );

    await this.batchState.updateStatus(localBatchId, {
      status: 'failed',
      error: 'trigger_fallback executed — winner did not settle in time',
    });
  }
}
