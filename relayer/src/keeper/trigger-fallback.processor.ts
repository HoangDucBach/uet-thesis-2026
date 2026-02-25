import { ChainService } from 'src/chain/chain.service';
import { SETTLEMENT } from 'src/contracts/constants';
import { ContractConfigService } from 'src/contracts/contract-config.service';

import {
  SerialTransactionExecutor,
  Transaction,
} from '@mysten/sui/transactions';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { BatchStateService } from './batch-state.service';

/**
 * Processor for triggerFallback job execution.
 * Runs as a worker that processes queued trigger_fallback transactions.
 */
@Injectable()
@Processor('lifecycle:triggerFallback')
export class TriggerFallbackProcessor extends WorkerHost {
  private readonly logger = new Logger(TriggerFallbackProcessor.name);
  private executor: SerialTransactionExecutor | null = null;

  constructor(
    private readonly chainService: ChainService,
    private readonly contractConfig: ContractConfigService,
    private readonly batchState: BatchStateService,
  ) {
    super();
    this.executor = new SerialTransactionExecutor({
      client: this.chainService.getClient(),
      signer: this.chainService.getKeypair(),
    });
  }

  async process(job: Job<{ auctionStateId: string; localBatchId: string }>) {
    const { auctionStateId, localBatchId } = job.data;

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

    return {
      auctionStateId,
      digest: result.Transaction.digest,
    };
  }
}
