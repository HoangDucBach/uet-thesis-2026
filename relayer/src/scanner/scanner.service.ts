import { EventEmitter } from 'events';
import { EventHandlerRegistry, getEventHandlerMetadata } from 'src/common';
import { IntentCreatedEventType } from 'src/common/contracts';
import { CowEvent, GrpcClientService } from 'src/grpc';

import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

import { IntentCreatedHandler } from './handlers';

@Injectable()
export class ScannerService
  extends EventEmitter
  implements OnModuleInit, OnApplicationShutdown
{
  private logger = new Logger(ScannerService.name);
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private eventBuffer: IntentCreatedEventType[] = [];

  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT_MS = 5000;

  constructor(
    private grpcClient: GrpcClientService,
    private eventRegistry: EventHandlerRegistry,
    private intentCreatedHandler: IntentCreatedHandler,
  ) {
    super();
  }

  onModuleInit() {
    // Register handlers automatically using decorator metadata
    this.registerHandlers();

    // Listen to cow events and dispatch to registry
    this.grpcClient.onCowEvent((event: CowEvent) => {
      void this.handleCowEvent(event);
    });
    this.logger.log('Scanner listening to gRPC COW events');
  }

  /**
   * Register all handlers that have @EventHandler decorator
   *
   * This eliminates the need for if-else chains!
   * Just add a new handler class with @EventHandler decorator
   * and it will be automatically registered.
   */
  private registerHandlers() {
    const handlers = [IntentCreatedHandler];

    for (const HandlerClass of handlers) {
      const metadata = getEventHandlerMetadata(HandlerClass);
      if (metadata) {
        this.eventRegistry.registerHandler(
          metadata.identifier,
          HandlerClass,
          metadata.priority,
        );
      }
    }

    this.logger.log(
      `Registered ${this.eventRegistry.getRegisteredEvents().length} event handler(s)`,
    );
  }

  private async handleCowEvent(event: CowEvent) {
    try {
      const results = await this.eventRegistry.handleEvent(event);

      const processed = results.some((r) => r.processed);
      if (!processed) {
        this.logger.debug(
          `Event ${event.module_name}::${event.event_name} not processed by any handler`,
        );
        return;
      }

      for (const result of results) {
        if (result.processed && result.data) {
          this.addToBuffer(result.data as IntentCreatedEventType);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling event ${event.module_name}::${event.event_name}: ${(error as Error).message}`,
      );
    }
  }

  private addToBuffer(intent: IntentCreatedEventType) {
    if (BigInt(intent.deadline) <= BigInt(Date.now())) {
      this.logger.warn(
        `Skipping expired intent ${intent.intent_id} (deadline=${intent.deadline}, now=${Date.now()})`,
      );
      return;
    }

    this.eventBuffer.push(intent);

    if (this.eventBuffer.length >= this.BATCH_SIZE) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flushBatch(),
        this.BATCH_TIMEOUT_MS,
      );
    }
  }

  /**
   * Flushes the buffered intent events as a batch and emits them to listeners.
   * Clears the batch timer and resets the buffer.
   */
  private flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.eventBuffer.length === 0) return;

    const batch = this.eventBuffer.splice(0);
    this.emit('intents', batch);
  }

  onIntent(listener: (intents: IntentCreatedEventType[]) => void) {
    this.on('intents', listener);
  }

  onApplicationShutdown() {
    this.flushBatch();
    this.logger.log('ScannerService shutdown complete');
  }
}
