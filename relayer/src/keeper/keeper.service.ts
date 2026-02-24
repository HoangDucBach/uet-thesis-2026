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

    // Extract intent IDs from eventBcs
    const intentIds = batch.intents
      .map((i) => {
        const id = this.extractIntentIdFromEventBcs(i.eventBcs);
        this.logger.debug(
          `Intent ${i.id}: extracted ID = ${id}, eventBcs length = ${i.eventBcs?.length || 0}`,
        );
        return id;
      })
      .filter((id): id is string => id !== null);

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
      target: `${cowDexPackageId}::settlement::open_batch`,
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

  private extractIntentIdFromEventBcs(
    eventBcs: string | undefined,
  ): string | null {
    if (!eventBcs) {
      return null;
    }
    try {
      // Decode base64 to bytes
      const bytes = Buffer.from(eventBcs, 'base64');

      // BCS eventBcs structure (with metadata prefix):
      // 0-31 bytes: Package ID (32 bytes)
      // 32: module name length (0x0b = 11 for "intent_book")
      // 33-43: module name (11 bytes)
      // 44: event name length (0x12 = 18 for "IntentCreatedEvent")
      // 45-62: event name (18 bytes)
      // 63+: START OF ACTUAL EVENT DATA
      //
      // Event data structure:
      // 0-31: intent_id (ID = 32 bytes)
      // 32-63: owner (address = 32 bytes)
      // 64-71: sell_amount (u64 = 8 bytes)
      // 72-79: min_amount_out (u64 = 8 bytes)
      // 80-87: deadline (u64 = 8 bytes)

      const EVENT_DATA_OFFSET = 63;

      if (bytes.length < EVENT_DATA_OFFSET + 32) {
        this.logger.warn(
          `eventBcs too short: ${bytes.length} bytes (need at least ${EVENT_DATA_OFFSET + 32})`,
        );
        return null;
      }

      const intentIdBytes = bytes.subarray(
        EVENT_DATA_OFFSET,
        EVENT_DATA_OFFSET + 32,
      );
      const intentIdHex = '0x' + intentIdBytes.toString('hex');

      // Verify it's not all zeros or all ones (invalid address)
      if (
        intentIdHex === '0x' + '0'.repeat(64) ||
        intentIdHex === '0x' + 'f'.repeat(64)
      ) {
        this.logger.warn(
          `Invalid intent ID (all zeros or ones): ${intentIdHex}`,
        );
        return null;
      }

      this.logger.debug(
        `Extracted intent ID from offset ${EVENT_DATA_OFFSET}: ${intentIdHex}`,
      );
      return intentIdHex;
    } catch (error) {
      this.logger.warn(`Failed to extract intent ID from eventBcs: ${error}`);
      return null;
    }
  }
}
