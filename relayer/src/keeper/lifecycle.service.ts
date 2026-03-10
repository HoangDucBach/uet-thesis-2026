import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import { BatchOpenResult } from './keeper.types';

@Injectable()
export class LifecycleService implements OnModuleInit {
  private readonly logger = new Logger(LifecycleService.name);

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
        await this.scheduleBatch({
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

  async scheduleBatch(
    result: Pick<
      BatchOpenResult,
      | 'localBatchId'
      | 'auctionStateId'
      | 'commitEndTime'
      | 'executeDeadlineTime'
    >,
  ): Promise<void> {
    const { auctionStateId, localBatchId, commitEndTime, executeDeadlineTime } =
      result;

    const now = BigInt(Date.now());
    const commitDelay = commitEndTime > now ? Number(commitEndTime - now) : 0;
    const fallbackDelay =
      executeDeadlineTime > now ? Number(executeDeadlineTime - now) : 0;

    this.logger.log(
      `Lifecycle scheduled auctionState=${auctionStateId}: ` +
        `close_commits in ${commitDelay}ms, trigger_fallback in ${fallbackDelay}ms`,
    );

    // jobId = dedup key: BullMQ silently ignores add() if a job with the same
    // jobId already exists (waiting/delayed). Safe to call on restart recovery.
    await this.closeCommitsQueue.add(
      'closeCommits',
      { auctionStateId, localBatchId },
      {
        delay: commitDelay,
        jobId: `closeCommits-${auctionStateId}`,
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'fixed', delay: 5_000 },
      },
    );

    await this.triggerFallbackQueue.add(
      'triggerFallback',
      { auctionStateId, localBatchId },
      {
        delay: fallbackDelay,
        jobId: `triggerFallback-${auctionStateId}`,
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: 'fixed', delay: 5_000 },
      },
    );
  }
}
