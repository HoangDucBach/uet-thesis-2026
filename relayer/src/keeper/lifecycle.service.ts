import { ChainService } from 'src/chain/chain.service';
import { SETTLEMENT } from 'src/contracts/constants';
import { ContractConfigService } from 'src/contracts/contract-config.service';

import {
  SerialTransactionExecutor,
  Transaction,
} from '@mysten/sui/transactions';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import { BatchOpenResult } from './keeper.types';

/**
 * Manages the post-open lifecycle of every batch:
 *
 *   1. close_commits  — called when now >= commitEndMs
 *      Transitions the auction from Commit → Execute phase, allowing the
 *      winner to be selected.
 *
 *   2. trigger_fallback — called when now >= executeDeadlineMs and the batch
 *      is still not settled (winner failed to execute).
 *      Slashes the winner's bond and refunds intents.
 *
 * On module init the service recovers any 'opened' batches from Redis so
 * timers survive a process restart.
 *
 * Batches multiple transactions for parallel execution via Promise.all():
 * instead of executing immediately, transactions are queued and flushed
 * in batches every 50ms or when queue reaches max size (10 pending).
 */
@Injectable()
export class LifecycleService implements OnModuleInit {
  private readonly logger = new Logger(LifecycleService.name);

  /**
   * Tracks auctionStateIds for which timers have already been set.
   * Prevents double-scheduling on restart recovery.
   */
  private readonly scheduled = new Set<string>();

  /**
   * Reusable SerialTransactionExecutor instance.
   * Initialized once, shared across all batch operations.
   */
  private executor: SerialTransactionExecutor | null = null;

  /**
   * Queue of closeCommits transactions pending execution.
   * Structure: [{ tx, auctionStateId, localBatchId }, ...]
   */
  private closeCommitsQueue: Array<{
    tx: Transaction;
    auctionStateId: string;
    localBatchId: string;
  }> = [];

  /**
   * Queue of triggerFallback transactions pending execution.
   * Structure: [{ tx, auctionStateId, localBatchId }, ...]
   */
  private triggerFallbackQueue: Array<{
    tx: Transaction;
    auctionStateId: string;
    localBatchId: string;
  }> = [];

  private closeCommitsFlusher: NodeJS.Timeout | null = null;
  private fallbackFlusher: NodeJS.Timeout | null = null;

  private readonly FLUSH_INTERVAL_MS = 50; // Batch every 50ms
  private readonly MAX_QUEUE_SIZE = 10; // Max 10 pending per queue

  constructor(
    private readonly chainService: ChainService,
    private readonly contractConfig: ContractConfigService,
    private readonly batchState: BatchStateService,
  ) {}

  async onModuleInit() {
    // Initialize executor once, reuse for all operations
    this.executor = new SerialTransactionExecutor({
      client: this.chainService.getClient(),
      signer: this.chainService.getKeypair(),
    });

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

  /**
   * Schedule close_commits and trigger_fallback for a freshly-opened batch.
   * Safe to call multiple times for the same auctionStateId (idempotent).
   *
   * Transactions are queued and flushed in batches via Promise.all()
   * for parallel execution, improving throughput under load.
   */
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

    // Schedule queueing (not direct execution)
    setTimeout(() => {
      this.queueCloseCommits(auctionStateId, localBatchId);
    }, commitDelay);

    setTimeout(() => {
      void this.queueTriggerFallback(auctionStateId, localBatchId);
    }, fallbackDelay);
  }

  /**
   * Queue a closeCommits transaction for batch execution.
   * Triggers flush if queue reaches MAX_QUEUE_SIZE.
   */
  private queueCloseCommits(
    auctionStateId: string,
    localBatchId: string,
  ): void {
    const pkg = this.contractConfig.getCowDexPackageId();
    const tx = new Transaction();
    tx.moveCall({
      package: pkg,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.CLOSE_COMMITS,
      arguments: [tx.object(auctionStateId), tx.object.clock()],
    });

    this.closeCommitsQueue.push({ tx, auctionStateId, localBatchId });

    if (this.closeCommitsQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushCloseCommits();
    } else {
      this.scheduleCloseCommitsFlusher();
    }
  }

  /**
   * Queue a triggerFallback transaction for batch execution.
   * Triggers flush if queue reaches MAX_QUEUE_SIZE.
   */
  private queueTriggerFallback(
    auctionStateId: string,
    localBatchId: string,
  ): void {
    const pkg = this.contractConfig.getCowDexPackageId();
    const tx = new Transaction();
    tx.moveCall({
      package: pkg,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.TRIGGER_FALLBACK,
      arguments: [tx.object(auctionStateId), tx.object.clock()],
    });

    this.triggerFallbackQueue.push({ tx, auctionStateId, localBatchId });

    if (this.triggerFallbackQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flushTriggerFallback();
    } else {
      this.scheduleTriggerFallbackFlusher();
    }
  }

  /**
   * Schedule a flush of closeCommits queue if not already scheduled.
   */
  private scheduleCloseCommitsFlusher(): void {
    if (this.closeCommitsFlusher) return;
    this.closeCommitsFlusher = setTimeout(
      () => this.flushCloseCommits(),
      this.FLUSH_INTERVAL_MS,
    );
  }

  /**
   * Schedule a flush of triggerFallback queue if not already scheduled.
   */
  private scheduleTriggerFallbackFlusher(): void {
    if (this.fallbackFlusher) return;
    this.fallbackFlusher = setTimeout(
      () => this.flushTriggerFallback(),
      this.FLUSH_INTERVAL_MS,
    );
  }

  /**
   * Execute all queued closeCommits transactions in parallel via Promise.all().
   */
  private async flushCloseCommits(): Promise<void> {
    if (this.closeCommitsFlusher) {
      clearTimeout(this.closeCommitsFlusher);
      this.closeCommitsFlusher = null;
    }

    if (this.closeCommitsQueue.length === 0) return;

    const batch = this.closeCommitsQueue.splice(0);
    this.logger.debug(`Flushing ${batch.length} closeCommits transactions`);

    const results = await Promise.allSettled(
      batch.map(item => this.executor!.executeTransaction(item.tx))
    );

    for (let i = 0; i < results.length; i++) {
      const item = batch[i];
      const result = results[i];

      if (result.status === 'fulfilled') {
        const txResult = result.value;
        if (txResult.$kind === 'FailedTransaction') {
          this.logger.error(
            `closeCommits failed for ${item.auctionStateId}: ${txResult.FailedTransaction.status.error?.message}`,
          );
        } else {
          this.logger.log(
            `closeCommits ok auctionState=${item.auctionStateId} digest=${txResult.Transaction.digest}`,
          );
          this.batchState
            .updateStatus(item.localBatchId, { status: 'committed' })
            .catch(err => this.logger.error('Failed to update batch status', err));
        }
      } else {
        this.logger.error(
          `closeCommits execution error for ${item.auctionStateId}:`,
          result.reason,
        );
      }
    }
  }

  /**
   * Execute all queued triggerFallback transactions in parallel via Promise.all().
   */
  private async flushTriggerFallback(): Promise<void> {
    if (this.fallbackFlusher) {
      clearTimeout(this.fallbackFlusher);
      this.fallbackFlusher = null;
    }

    if (this.triggerFallbackQueue.length === 0) return;

    const batch = this.triggerFallbackQueue.splice(0);
    this.logger.debug(`Flushing ${batch.length} triggerFallback transactions`);

    const results = await Promise.allSettled(
      batch.map(item => this.executor!.executeTransaction(item.tx))
    );

    for (let i = 0; i < results.length; i++) {
      const item = batch[i];
      const result = results[i];

      if (result.status === 'fulfilled') {
        const txResult = result.value;
        if (txResult.$kind === 'FailedTransaction') {
          this.logger.error(
            `triggerFallback failed for ${item.auctionStateId}: ${txResult.FailedTransaction.status.error?.message}`,
          );
        } else {
          this.logger.log(
            `triggerFallback ok auctionState=${item.auctionStateId} digest=${txResult.Transaction.digest}`,
          );
          this.batchState
            .updateStatus(item.localBatchId, {
              status: 'failed',
              error: 'trigger_fallback executed — winner did not settle in time',
            })
            .catch(err => this.logger.error('Failed to update batch status', err));
        }
      } else {
        this.logger.error(
          `triggerFallback execution error for ${item.auctionStateId}:`,
          result.reason,
        );
      }
    }
  }
}
