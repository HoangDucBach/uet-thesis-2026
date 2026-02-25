import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ScannerService } from 'src/scanner/scanner.service';
import { ChainService } from 'src/chain/chain.service';
import { ContractConfigService } from 'src/contracts/contract-config.service';
import { RelayConfigService } from 'src/config/relay-config.service';
import { BatchInput, BatchOpenResult, BatchStatus } from './keeper.types';
import { Transaction } from '@mysten/sui/transactions';
import { SETTLEMENT } from 'src/contracts/constants';
import { IntentCreatedEventType } from 'src/common/contracts';

@Injectable()
export class KeeperService implements OnModuleInit {
  private readonly logger = new Logger(KeeperService.name);
  private batchCounter = 0;
  private batchStatusMap = new Map<string, BatchStatus>();
  private globalConfigId: string;

  constructor(
    private scannerService: ScannerService,
    private chainService: ChainService,
    private contractConfig: ContractConfigService,
    private relayConfig: RelayConfigService,
  ) {
    this.globalConfigId = this.relayConfig.getGlobalConfigId();
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
    const batchId = this.generateBatchId();
    const batch: BatchInput = { intents, batchId };

    this.logger.log(
      `Processing batch ${batchId} with ${intents.length} intents`,
    );

    try {
      const result = await this.openBatch(batch);
      this.logger.log(`Batch ${batchId} opened: ${result.txDigest}`);

      this.batchStatusMap.set(batchId, {
        batchId,
        status: 'opened',
        txDigest: result.txDigest,
        intentCount: intents.length,
        openedAt: Date.now(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to open batch ${batchId}:`, error);
      this.batchStatusMap.set(batchId, {
        batchId,
        status: 'failed',
        intentCount: intents.length,
        error: errorMessage,
      });
    }
  }

  private async openBatch(batch: BatchInput): Promise<BatchOpenResult> {
    const client = this.chainService.getClient();
    const keypair = this.chainService.getKeypair();

    const intentIds: string[] = [];
    for (const intent of batch.intents) {
      intentIds.push(intent.intent_id);
    }

    // Extract batch number from string format "batch_timestamp_counter"
    const batchNumberStr = batch.batchId.split('_')[2];
    const batchNumber = parseInt(batchNumberStr || '0', 10);

    this.logger.log(
      `Opening batch ${batch.batchId} (number: ${batchNumber}) with ${intentIds.length} intents`,
    );
    this.logger.debug(`Extracted intent IDs: ${JSON.stringify(intentIds)}`);

    if (intentIds.length === 0) {
      throw new Error('No valid intent IDs extracted from batch');
    }

    const tx = new Transaction();

    const cowDexPackageId = this.contractConfig.getCowDexPackageId();

    tx.moveCall({
      package: cowDexPackageId,
      module: SETTLEMENT.MODULE_NAME,
      function: SETTLEMENT.FUNCTIONS.OPEN_BATCH_AND_SHARE,
      arguments: [
        tx.object(this.globalConfigId),
        tx.pure.u64(batchNumber),
        tx.pure.vector('id', intentIds),
        tx.object('0x6'),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });

    if (result.$kind === 'FailedTransaction') {
      throw new Error(
        `Transaction failed: ${result.FailedTransaction.status.error?.message || 'Unknown error'}`,
      );
    }

    if (result.$kind !== 'Transaction') {
      throw new Error('Unexpected transaction result type');
    }

    const txDigest = result.Transaction.digest;

    return {
      batchId: batch.batchId || '',
      txDigest,
      commitEndTime: BigInt(Date.now() + 2000),
      executeDeadlineTime: BigInt(Date.now() + 7000),
      timestamp: Date.now(),
    };
  }

  getBatchStatus(batchId: string): BatchStatus | undefined {
    return this.batchStatusMap.get(batchId);
  }

  getAllBatches(): BatchStatus[] {
    return Array.from(this.batchStatusMap.values());
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${++this.batchCounter}`;
  }
}
