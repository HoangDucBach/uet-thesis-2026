import {
  EventHandler,
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from 'src/common';
import { BatchAbortedEvent, BatchAbortedEventType } from 'src/common/contracts';
import { SETTLEMENT } from 'src/contracts/constants';
import { CowEvent } from 'src/grpc';
import { BatchStateService } from 'src/keeper/batch-state.service';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@EventHandler({
  moduleName: SETTLEMENT.MODULE_NAME,
  eventName: SETTLEMENT.EVENTS.BATCH_ABORTED,
  priority: 10,
})
export class BatchAbortedHandler implements IEventHandler {
  private readonly logger = new Logger(BatchAbortedHandler.name);

  constructor(private readonly batchState: BatchStateService) {}

  async handle(event: CowEvent): Promise<EventHandlerResult> {
    try {
      this.logger.warn(`Processing BatchAborted event: tx=${event.tx_digest}`);

      const parsed: BatchAbortedEventType = BatchAbortedEvent.parse(
        event.contents as Uint8Array,
      );

      this.logger.warn(
        `batch_id=${parsed.batch_id} — no solvers committed, batch aborted`,
      );

      const batch = await this.batchState.getByOnChainBatchId(
        BigInt(parsed.batch_id),
      );

      if (batch) {
        await this.batchState.updateStatus(batch.localBatchId, {
          status: 'aborted',
          error: `Batch aborted — no solver committed during commit phase`,
        });
        this.logger.warn(
          `Batch ${batch.localBatchId} (on-chain ${parsed.batch_id}) marked as aborted`,
        );
      } else {
        this.logger.warn(
          `BatchAborted: no local batch found for on-chain batch_id=${parsed.batch_id}`,
        );
      }

      return { success: true, processed: true };
    } catch (error) {
      this.logger.error(`Failed to handle BatchAborted: ${error}`);
      return { success: false, processed: false, error: error as Error };
    }
  }

  getEventIdentifier(): EventIdentifier {
    return {
      moduleName: SETTLEMENT.MODULE_NAME,
      eventName: SETTLEMENT.EVENTS.BATCH_ABORTED,
    };
  }
}
