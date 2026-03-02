import { CowEvent } from 'src/grpc';

/**
 * Unique identifier for an event type
 */
export interface EventIdentifier {
  moduleName: string;
  eventName: string;
}

/**
 * Result of event processing
 */
export interface EventHandlerResult {
  success: boolean;
  processed: boolean;
  error?: Error;
  data?: unknown;
}

/**
 * Base interface for all event handlers
 *
 * Strategy Pattern: Each handler implements this interface
 * to process specific event types
 */
export interface IEventHandler {
  handle(event: CowEvent): Promise<EventHandlerResult>;
  getEventIdentifier(): EventIdentifier;
  getPriority?(): number;
}

/**
 * Metadata for handler registration
 */
export interface HandlerMetadata {
  identifier: EventIdentifier;
  priority: number;
  handlerClass: new (...args: any[]) => IEventHandler;
}
