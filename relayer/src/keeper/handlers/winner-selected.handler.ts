import {
  EventHandler,
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from 'src/common';
import {
  WinnerSelectedEvent,
  WinnerSelectedEventType,
} from 'src/common/contracts';
import { SETTLEMENT } from 'src/contracts/constants';
import { CowEvent } from 'src/grpc';
import { BatchStateService } from 'src/keeper/batch-state.service';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@EventHandler({
  moduleName: SETTLEMENT.MODULE_NAME,
  eventName: SETTLEMENT.EVENTS.WINNER_SELECTED,
  priority: 5,
})
export class WinnerSelectedHandler implements IEventHandler {
  private readonly logger = new Logger(WinnerSelectedHandler.name);

  constructor(private readonly batchState: BatchStateService) {}

  async handle(event: CowEvent): Promise<EventHandlerResult> {
    try {
      this.logger.debug(
        `Processing WinnerSelected event: tx=${event.tx_digest}`,
      );

      const parsed: WinnerSelectedEventType = WinnerSelectedEvent.parse(
        event.contents as Uint8Array,
      );

      this.logger.debug(
        `batch_id=${parsed.batch_id} winner=${parsed.winner} score=${parsed.winner_score}`,
      );

      const batch = await this.batchState.getByOnChainBatchId(
        BigInt(parsed.batch_id),
      );

      if (batch) {
        await this.batchState.updateStatus(batch.localBatchId, {
          status: 'executing',
        });
        this.logger.log(
          `Batch ${batch.localBatchId} (on-chain ${parsed.batch_id}) marked as executing`,
        );
      } else {
        this.logger.warn(
          `WinnerSelected: no local batch found for on-chain batch_id=${parsed.batch_id}`,
        );
      }

      return { success: true, processed: true };
    } catch (error) {
      this.logger.error(`Failed to handle WinnerSelected: ${error}`);
      return { success: false, processed: false, error: error as Error };
    }
  }

  getEventIdentifier(): EventIdentifier {
    return {
      moduleName: SETTLEMENT.MODULE_NAME,
      eventName: SETTLEMENT.EVENTS.WINNER_SELECTED,
    };
  }
}
