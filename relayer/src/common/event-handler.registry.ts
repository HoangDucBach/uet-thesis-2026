import { CowEvent } from 'src/grpc';

import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  EventHandlerResult,
  EventIdentifier,
  IEventHandler,
} from './event-handler.interface';

/**
 * Registry Pattern: Central registry for all event handlers
 */
@Injectable()
export class EventHandlerRegistry {
  private readonly logger = new Logger(EventHandlerRegistry.name);

  // Map: "moduleName::eventName" -> Handler instances with priority
  private readonly handlers = new Map<
    string,
    Array<{ handler: IEventHandler; priority: number }>
  >();

  constructor(private readonly moduleRef: ModuleRef) {}

  registerHandler(
    identifier: EventIdentifier,
    handlerType: Type<IEventHandler>,
    priority: number = 0,
  ): void {
    const key = this.getEventKey(identifier);

    try {
      // Get handler instance from NestJS DI container
      const handler = this.moduleRef.get(handlerType, { strict: false });

      if (!handler) {
        throw new Error(
          `Handler ${handlerType.name} not found in DI container`,
        );
      }

      // Get existing handlers or create new array
      const existingHandlers = this.handlers.get(key) || [];

      // Add new handler with priority
      existingHandlers.push({ handler, priority });

      // Sort by priority (descending)
      existingHandlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      this.handlers.set(key, existingHandlers);

      this.logger.log(
        `Registered handler ${handlerType.name} for ${key} (priority: ${priority})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register handler ${handlerType.name}: ${error}`,
      );
      throw error;
    }
  }

  async handleEvent(
    event: CowEvent,
    parsedData?: any,
  ): Promise<EventHandlerResult[]> {
    const key = this.getEventKey({
      moduleName: event.module_name,
      eventName: event.event_name,
    });

    const handlerEntries = this.handlers.get(key);

    if (!handlerEntries || handlerEntries.length === 0) {
      this.logger.debug(`No handlers registered for event: ${key}`);
      return [];
    }

    this.logger.debug(
      `Dispatching event ${key} to ${handlerEntries.length} handler(s)`,
    );

    const results = await Promise.allSettled(
      handlerEntries.map(({ handler }) => handler.handle(event, parsedData)),
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        this.logger.error(
          `Handler ${handlerEntries[index].handler.constructor.name} failed: ${result.reason}`,
        );
        return {
          success: false,
          processed: false,
          error:
            result.reason instanceof Error
              ? result.reason
              : new Error(String(result.reason)),
        };
      }
    });
  }

  hasHandler(identifier: EventIdentifier): boolean {
    const key = this.getEventKey(identifier);
    return this.handlers.has(key);
  }

  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  clearHandlers(): void {
    this.handlers.clear();
  }

  private getEventKey(identifier: EventIdentifier): string {
    return `${identifier.moduleName}::${identifier.eventName}`;
  }
}
