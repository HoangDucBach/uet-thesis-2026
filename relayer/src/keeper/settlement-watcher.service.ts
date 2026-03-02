import { EventHandlerRegistry, getEventHandlerMetadata } from 'src/common';
import { CowEvent, GrpcClientService } from 'src/grpc';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';
import {
  FallbackTriggeredHandler,
  SettlementCompleteHandler,
  WinnerSelectedHandler,
} from './handlers';

@Injectable()
export class SettlementWatcherService implements OnModuleInit {
  private readonly logger = new Logger(SettlementWatcherService.name);

  constructor(
    private readonly grpcClient: GrpcClientService,
    private readonly batchState: BatchStateService,
    private readonly eventRegistry: EventHandlerRegistry,
    private readonly winnerSelectedHandler: WinnerSelectedHandler,
    private readonly settlementCompleteHandler: SettlementCompleteHandler,
    private readonly fallbackTriggeredHandler: FallbackTriggeredHandler,
  ) {}

  onModuleInit() {
    // Register all settlement event handlers
    this.registerHandlers();

    // Listen to cow events and dispatch to registry
    this.grpcClient.onCowEvent((event: CowEvent) => {
      void this.handleSettlementEvent(event);
    });
    this.logger.log('SettlementWatcher listening to gRPC COW events');
  }

  /**
   * Register handlers automatically using decorator metadata
   *
   * Just add a new handler class with @EventHandler and it's auto-registered!
   */
  private registerHandlers() {
    const handlers = [
      WinnerSelectedHandler,
      SettlementCompleteHandler,
      FallbackTriggeredHandler,
    ];

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
      `Registered ${handlers.length} settlement event handler(s)`,
    );
  }

  /**
   * Handle settlement events using Strategy Pattern
   */
  private async handleSettlementEvent(event: CowEvent) {
    try {
      const results = await this.eventRegistry.handleEvent(event);

      const processed = results.some((r) => r.processed);
      if (processed) {
        this.logger.debug(
          `Settlement event ${event.event_name} processed successfully`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Error handling settlement event ${event.module_name}::${event.event_name}: ${err}`,
      );
    }
  }
}
