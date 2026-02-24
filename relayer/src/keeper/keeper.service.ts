import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ScannerService } from 'src/scanner/scanner.service';
import { ChainService } from 'src/chain/chain.service';
import { ContractConfigService } from 'src/contracts/contract-config.service';
import { RelayConfigService } from 'src/config/relay-config.service';
import { IntentEvent } from 'src/scanner/scanner.types';
import { BatchInput, BatchOpenResult, BatchStatus } from './keeper.types';
import { Transaction } from '@mysten/sui/transactions';

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
    this.scannerService.onIntent(async (intents: IntentEvent[]) => {
      await this.handleBatch(intents);
    });
    this.logger.log('Keeper listening to scanner events');
  }

  private async handleBatch(intents: IntentEvent[]): Promise<void> {
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
      this.logger.error(`Failed to open batch ${batchId}:`, error);
      this.batchStatusMap.set(batchId, {
        batchId,
        status: 'failed',
        intentCount: intents.length,
        error: String(error),
      });
    }
  }

  private async openBatch(batch: BatchInput): Promise<BatchOpenResult> {
    const client = this.chainService.getClient();
    const keypair = this.chainService.getKeypair();

    const intentIds = batch.intents.map((i) => i.id);

    // Extract batch number from string format "batch_timestamp_counter"
    const batchNumberStr = batch.batchId.split('_')[2];
    const batchNumber = parseInt(batchNumberStr || '0', 10);

    this.logger.debug(
      `Opening batch ${batch.batchId} (number: ${batchNumber}) with ${intentIds.length} intents`,
    );

    const tx = new Transaction();

    const cowDexPackageId = this.contractConfig.getCowDexPackageId();

    tx.moveCall({
      target: `${cowDexPackageId}::settlement::open_batch`,
      arguments: [
        tx.object(this.globalConfigId),
        tx.pure.u64(batchNumber),
        tx.pure.vector('address', intentIds),
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
