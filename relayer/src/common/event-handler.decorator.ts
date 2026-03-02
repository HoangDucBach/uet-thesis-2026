import { SetMetadata } from '@nestjs/common';

import { EventIdentifier } from './event-handler.interface';

export const EVENT_HANDLER_METADATA_KEY = 'event:handler:metadata';

/**
 * Options for @EventHandler decorator
 */
export interface EventHandlerOptions {
  moduleName: string;
  eventName: string;
  priority?: number;
}

/**
 * Decorator to mark a class as an event handler
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * @EventHandler({
 *   moduleName: 'intent_book',
 *   eventName: 'IntentCreated',
 *   priority: 10
 * })
 * export class IntentCreatedHandler implements IEventHandler {
 *   // ... implementation
 * }
 * ```
 *
 * This automatically registers the handler with the EventHandlerRegistry
 */
export function EventHandler(options: EventHandlerOptions): ClassDecorator {
  const metadata = {
    identifier: {
      moduleName: options.moduleName,
      eventName: options.eventName,
    } as EventIdentifier,
    priority: options.priority ?? 0,
  };

  return (target: any) => {
    SetMetadata(EVENT_HANDLER_METADATA_KEY, metadata)(target);
  };
}

/**
 * Get event handler metadata from a class
 */
export function getEventHandlerMetadata(
  target: any,
): { identifier: EventIdentifier; priority: number } | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
  return Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target);
}
