import {
  EventHandler,
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from 'src/common';
import { FallbackTriggeredEvent } from 'src/common/contracts';
import { SETTLEMENT } from 'src/contracts/constants';
import { CowEvent } from 'src/grpc';
import { BatchStateService } from 'src/keeper/batch-state.service';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@EventHandler({
  moduleName: SETTLEMENT.MODULE_NAME,
  eventName: SETTLEMENT.EVENTS.FALLBACK_TRIGGERED,
  priority: 10,
})
export class FallbackTriggeredHandler implements IEventHandler {
  private readonly logger = new Logger(FallbackTriggeredHandler.name);

  constructor(private readonly batchState: BatchStateService) {}

  async handle(event: CowEvent): Promise<EventHandlerResult> {
    try {
      this.logger.warn(
        `Processing FallbackTriggered event: tx=${event.tx_digest}`,
      );

      const parsed = FallbackTriggeredEvent.parse(event.contents as Uint8Array);

      this.logger.warn(
        `batch_id=${parsed.batch_id} winner=${parsed.winner} bond_slashed=${parsed.bond_slashed}`,
      );

      const batch = await this.batchState.getByOnChainBatchId(
        BigInt(parsed.batch_id),
      );

      if (batch) {
        await this.batchState.updateStatus(batch.localBatchId, {
          status: 'failed',
          error: `Fallback triggered — bond_slashed=${parsed.bond_slashed}`,
        });
        this.logger.warn(
          `Batch ${batch.localBatchId} (on-chain ${parsed.batch_id}) marked as failed`,
        );
      } else {
        this.logger.warn(
          `FallbackTriggered: no local batch found for on-chain batch_id=${parsed.batch_id}`,
        );
      }

      return { success: true, processed: true };
    } catch (error) {
      this.logger.error(`Failed to handle FallbackTriggered: ${error}`);
      return { success: false, processed: false, error: error as Error };
    }
  }

  getEventIdentifier(): EventIdentifier {
    return {
      moduleName: SETTLEMENT.MODULE_NAME,
      eventName: SETTLEMENT.EVENTS.FALLBACK_TRIGGERED,
    };
  }
}
