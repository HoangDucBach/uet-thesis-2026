import { SETTLEMENT } from 'src/contracts/constants';
import { CowEvent, GrpcClientService } from 'src/grpc';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { BatchStateService } from './batch-state.service';

/**
 * Lắng nghe các settlement events từ gRPC stream và cập nhật batch state.
 *
 * | Event                  | BatchStatus transition         |
 * |------------------------|-------------------------------|
 * | WinnerSelectedEvent    | opened / committed → executing |
 * | SettlementCompleteEvent| executing → settled            |
 * | FallbackTriggeredEvent | any → failed                   |
 */
@Injectable()
export class SettlementWatcherService implements OnModuleInit {
  private readonly logger = new Logger(SettlementWatcherService.name);

  constructor(
    private readonly grpcClient: GrpcClientService,
    private readonly batchState: BatchStateService,
  ) {}

  onModuleInit() {
    this.grpcClient.onCowEvent((event: CowEvent) => {
      try {
        this.handleSettlementEvent(event);
      } catch (err) {
        this.logger.error(`Error handling settlement event: ${err}`);
      }
    });
    this.logger.log('SettlementWatcher listening to gRPC COW events');
  }

  private handleSettlementEvent(event: CowEvent) {
    if (event.module_name !== SETTLEMENT.MODULE_NAME) {
      return;
    }

    switch (event.event_name) {
      case SETTLEMENT.EVENTS.WINNER_SELECTED:
        this.handleWinnerSelected(event);
        break;
      case SETTLEMENT.EVENTS.SETTLEMENT_COMPLETE:
        this.handleSettlementComplete(event);
        break;
      case SETTLEMENT.EVENTS.FALLBACK_TRIGGERED:
        this.handleFallbackTriggered(event);
        break;
      default:
        // Ignore other events
        break;
    }
  }

  private handleWinnerSelected(event: CowEvent) {
    this.logger.debug(`WinnerSelectedEvent: tx=${event.tx_digest}`);
    // TODO: Parse event data để lấy batch_id
    // Tạm thời log để debug
    this.logger.debug(`Event: ${JSON.stringify(event)}`);
  }

  private handleSettlementComplete(event: CowEvent) {
    this.logger.debug(`SettlementCompleteEvent: tx=${event.tx_digest}`);
    // TODO: Parse event data để lấy batch_id
    this.logger.debug(`Event: ${JSON.stringify(event)}`);
  }

  private handleFallbackTriggered(event: CowEvent) {
    this.logger.debug(`FallbackTriggeredEvent: tx=${event.tx_digest}`);
    // TODO: Parse event data để lấy batch_id
    this.logger.debug(`Event: ${JSON.stringify(event)}`);
  }
}
