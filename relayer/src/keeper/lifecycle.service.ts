import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { BatchStateService } from './batch-state.service';
import { BatchOpenResult } from './keeper.types';

/**
 * Lifecycle Management with NestJS Bull Integration:
 * - Uses @nestjs/bullmq decorators for dependency injection
 * - @Processor() handlers run via BullMQ workers
 * - Jobs persist in Redis, survive process restarts
 * - ±100ms accuracy for delayed job execution
 *
 * Job types:
 *   - lifecycle:closeCommits: executed when now >= commitEndTime
 *   - lifecycle:triggerFallback: executed when now >= executeDeadlineTime
 */
@Injectable()
export class LifecycleService implements OnModuleInit {
  private readonly logger = new Logger(LifecycleService.name);

  private readonly scheduled = new Set<string>();

  constructor(
    @InjectQueue('lifecycleCloseCommits')
    private readonly closeCommitsQueue: Queue,
    @InjectQueue('lifecycleTriggerFallback')
    private readonly triggerFallbackQueue: Queue,
    private readonly batchState: BatchStateService,
  ) {}

  async onModuleInit() {
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

    // Schedule via Bull Queue with NestJS decorators
    void this.closeCommitsQueue.add(
      `closeCommits-${auctionStateId}`,
      { auctionStateId, localBatchId },
      { delay: commitDelay, removeOnComplete: true },
    );

    void this.triggerFallbackQueue.add(
      `triggerFallback-${auctionStateId}`,
      { auctionStateId, localBatchId },
      { delay: fallbackDelay, removeOnComplete: true },
    );
  }
}
