import {
  EventHandler,
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from 'src/common';
import {
  SettlementCompleteEvent,
  SettlementCompleteEventType,
} from 'src/common/contracts';
import { SETTLEMENT } from 'src/contracts/constants';
import { CowEvent } from 'src/grpc';
import { BatchStateService } from 'src/keeper/batch-state.service';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@EventHandler({
  moduleName: SETTLEMENT.MODULE_NAME,
  eventName: SETTLEMENT.EVENTS.SETTLEMENT_COMPLETE,
  priority: 5,
})
export class SettlementCompleteHandler implements IEventHandler {
  private readonly logger = new Logger(SettlementCompleteHandler.name);

  constructor(private readonly batchState: BatchStateService) {}

  async handle(event: CowEvent): Promise<EventHandlerResult> {
    try {
      this.logger.debug(
        `Processing SettlementComplete event: tx=${event.tx_digest}`,
      );

      const parsed: SettlementCompleteEventType = SettlementCompleteEvent.parse(
        event.contents as Uint8Array,
      );

      this.logger.debug(
        `batch_id=${parsed.batch_id} winner=${parsed.winner} ` +
          `actual_surplus=${parsed.actual_surplus} committed_score=${parsed.committed_score}`,
      );

      const batch = await this.batchState.getByOnChainBatchId(
        BigInt(parsed.batch_id),
      );

      if (batch) {
        await this.batchState.updateStatus(batch.localBatchId, {
          status: 'settled',
          settledAt: Date.now(),
        });
        this.logger.log(
          `Batch ${batch.localBatchId} (on-chain ${parsed.batch_id}) marked as settled`,
        );
      } else {
        this.logger.warn(
          `SettlementComplete: no local batch found for on-chain batch_id=${parsed.batch_id}`,
        );
      }

      return { success: true, processed: true };
    } catch (error) {
      this.logger.error(`Failed to handle SettlementComplete: ${error}`);
      return { success: false, processed: false, error: error as Error };
    }
  }

  getEventIdentifier(): EventIdentifier {
    return {
      moduleName: SETTLEMENT.MODULE_NAME,
      eventName: SETTLEMENT.EVENTS.SETTLEMENT_COMPLETE,
    };
  }
}
