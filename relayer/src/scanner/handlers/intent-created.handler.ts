import {
  EventHandler,
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from 'src/common';
import { IntentCreatedEvent } from 'src/common/contracts';
import { INTENT_BOOK } from 'src/contracts';
import { CowEvent } from 'src/grpc';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@EventHandler({
  moduleName: INTENT_BOOK.MODULE_NAME,
  eventName: INTENT_BOOK.EVENTS.INTENT_CREATED,
  priority: 10,
})
export class IntentCreatedHandler implements IEventHandler {
  private readonly logger = new Logger(IntentCreatedHandler.name);

  // eslint-disable-next-line @typescript-eslint/require-await
  async handle(event: CowEvent): Promise<EventHandlerResult> {
    try {
      this.logger.debug(
        `Processing IntentCreated event: tx=${event.tx_digest}`,
      );

      const parsed = IntentCreatedEvent.parse(event.contents as Uint8Array);

      this.logger.debug(
        `intent_id=${parsed.intent_id} owner=${parsed.owner} ` +
          `sell_amount=${parsed.sell_amount} deadline=${parsed.deadline}`,
      );

      return { success: true, processed: true, data: parsed };
    } catch (error) {
      this.logger.error(`Failed to handle IntentCreated: ${error}`);
      return { success: false, processed: false, error: error as Error };
    }
  }

  getEventIdentifier(): EventIdentifier {
    return {
      moduleName: INTENT_BOOK.MODULE_NAME,
      eventName: INTENT_BOOK.EVENTS.INTENT_CREATED,
    };
  }

  getPriority(): number {
    return 10;
  }
}
