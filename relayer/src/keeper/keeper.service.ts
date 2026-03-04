import { ChainService } from 'src/chain/chain.service';
import { BatchOpenedEvent, IntentCreatedEventType } from 'src/common/contracts';
import { RelayConfigService } from 'src/config/relay-config.service';
import { SETTLEMENT } from 'src/contracts/constants';
import { ContractConfigService } from 'src/contracts/contract-config.service';
import { ScannerService } from 'src/scanner/scanner.service';

import {
  SerialTransactionExecutor,
  Transaction,
} from '@mysten/sui/transactions';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import { BatchInput, BatchOpenResult, BatchStatus } from './keeper.types';
import { LifecycleService } from './lifecycle.service';

@Injectable()
export class KeeperService implements OnModuleInit {
  private readonly logger = new Logger(KeeperService.name);
  private localBatchCounter = 0;
  private globalConfigId: string;
  private registryConfigId: string;

  /**
   * Process-level guard: prevents concurrent open_batch_and_share calls.
   * The contract rejects if a previous batch is still open.
   */
  private openingBatch = false;

  constructor(
    private readonly scannerService: ScannerService,
    private readonly chainService: ChainService,
    private readonly contractConfig: ContractConfigService,
    private readonly relayConfig: RelayConfigService,
    private readonly batchState: BatchStateService,
    private readonly lifecycle: LifecycleService,
  ) {
    this.globalConfigId = this.relayConfig.getGlobalConfigId();
    this.registryConfigId = this.relayConfig.getRegistryConfigId();
  }

  onModuleInit() {
    this.scannerService.onIntent((intents) => {
      this.handleBatch(intents).catch((error) => {
        this.logger.error('Error handling batch:', error);
      });
    });
    this.logger.log('Keeper listening to scanner events');
  }

  private async handleBatch(intents: IntentCreatedEventType[]): Promise<void> {
    if (this.openingBatch) {
      this.logger.warn(
        'Previous batch tx still in flight — skipping this batch',
      );
      return;
    }

    const localBatchId = this.makeLocalBatchId();
    const batch: BatchInput = { intents, batchId: localBatchId };

    this.logger.log(
      `Processing batch ${localBatchId} with ${intents.length} intents`,
    );

    await this.batchState.set({
      localBatchId,
      status: 'pending',
      intentCount: intents.length,
    });

    try {
      this.openingBatch = true;
      const result = await this.openBatch(batch);
      this.logger.log(
        `Batch ${localBatchId} opened on-chain as batch_id=${result.onChainBatchId} ` +
          `auctionState=${result.auctionStateId} digest=${result.txDigest}`,
      );

      await Promise.all([
        this.batchState.set({
          localBatchId,
          onChainBatchId: result.onChainBatchId,
          auctionStateId: result.auctionStateId,
          status: 'opened',
          txDigest: result.txDigest,
          intentCount: intents.length,
          openedAt: result.timestamp,
          commitEndTime: Number(result.commitEndTime),
          executeDeadlineTime: Number(result.executeDeadlineTime),
        }),
        this.batchState.setAuctionStateId(
          result.onChainBatchId.toString(),
          result.auctionStateId,
        ),
      ]);

      // Schedule close_commits and trigger_fallback timers

      this.lifecycle.scheduleBatch(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to open batch ${localBatchId}:`, error);
      await this.batchState.set({
        localBatchId,
        status: 'failed',
        intentCount: intents.length,
        error: errorMessage,
      });
    } finally {
      this.openingBatch = false;
    }
  }

  private async openBatch(batch: BatchInput): Promise<BatchOpenResult> {
    const intentIds = batch.intents.map((i) => i.intent_id);

    if (intentIds.length === 0) {
      throw new Error('No valid intent IDs extracted from batch');
    }

    this.logger.debug(`Intent IDs for batch: ${JSON.stringify(intentIds)}`);

    const { batchOpenedEventData, txDigest } =
      await this.openBatchExecutor(intentIds);

    return {
      localBatchId: batch.batchId,
      onChainBatchId: BigInt(batchOpenedEventData.batch_id),
      auctionStateId: batchOpenedEventData.auction_state_id,
      txDigest,
      commitEndTime: BigInt(batchOpenedEventData.commit_end_ms),
      executeDeadlineTime: BigInt(batchOpenedEventData.execute_deadline_ms),
      timestamp: Date.now(),
    };
  }

  private async openBatchExecutor(intentIds: string[]) {
    const executor = new SerialTransactionExecutor({
      client: this.chainService.getJsonRpcClient(),
      signer: this.chainService.getKeypair(),
    });

    const cowDexPackageId = this.contractConfig.getCowDexPackageId();
    const tx = new Transaction();

    tx.moveCall({
      package: cowDexPackageId,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.OPEN_BATCH_AND_SHARE,
      arguments: [
        tx.object(this.registryConfigId),
        tx.object(this.globalConfigId),
        tx.pure.vector('id', intentIds),
        tx.object.clock(),
      ],
    });

    const result = await executor.executeTransaction(tx, {
      events: true,
    });

    if (result.$kind === 'FailedTransaction') {
      throw new Error(
        `Transaction failed: ${result.FailedTransaction.status.error?.message ?? 'Unknown error'}`,
      );
    }

    const events = result.Transaction.events;

    if (!events) {
      throw new Error('No events found in transaction result');
    }

    const batchOpenedEvent = events.find((event) => {
      if (event.eventType.includes(SETTLEMENT.EVENTS.BATCH_OPENED)) {
        return true;
      }

      return false;
    });

    if (!batchOpenedEvent?.bcs) {
      throw new Error(
        `BatchOpenedEvent not found in transaction events. ` +
          `digest=${result.Transaction.digest} events=[${events.map((e) => e.eventType).join(', ')}]`,
      );
    }

    const batchOpenedEventData = BatchOpenedEvent.parse(batchOpenedEvent.bcs);

    this.logger.debug(
      `BatchOpenedEvent: batch_id=${batchOpenedEventData.batch_id} ` +
        `auction_state_id=${batchOpenedEventData.auction_state_id}`,
    );

    return {
      batchOpenedEventData,
      txDigest: result.Transaction.digest,
    };
  }
  async getAuctionStateId(onChainBatchId: string): Promise<string | null> {
    return await this.batchState.getAuctionStateId(onChainBatchId);
  }

  async getBatchStatus(localBatchId: string): Promise<BatchStatus | null> {
    return await this.batchState.get(localBatchId);
  }

  async getAllBatches(): Promise<BatchStatus[]> {
    return await this.batchState.getAll();
  }

  private makeLocalBatchId(): string {
    return `batch_${Date.now()}_${++this.localBatchCounter}`;
  }
}
