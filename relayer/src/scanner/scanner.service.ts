import { EventEmitter } from 'events';
import { IntentCreatedEventType } from 'src/common/contracts';
import { INTENT_BOOK } from 'src/contracts';
import { CowEvent, GrpcClientService } from 'src/grpc';

import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';

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

  constructor(private grpcClient: GrpcClientService) {
    super();
  }

  onModuleInit() {
    this.grpcClient.onCowEvent((event: CowEvent) => {
      this.handleCowEvent(event);
    });
    this.logger.log('Scanner listening to gRPC COW events');
  }

  private handleCowEvent(event: CowEvent) {
    // Chỉ xử lý IntentCreated events
    if (
      event.module_name === INTENT_BOOK.MODULE_NAME &&
      event.event_name === INTENT_BOOK.EVENTS.INTENT_CREATED
    ) {
      this.logger.debug(`Received IntentCreated event: tx=${event.tx_digest}`);

      // Parse event data - trong thực tế cần decode từ event
      // Tạm thời log để xem structure
      this.logger.debug(`Event data: ${JSON.stringify(event)}`);

      // TODO: Cần parse event.bcs hoặc event data để lấy IntentCreatedEventType
      // Hiện tại tôi chỉ có metadata, cần full event data từ sidecar
      // Tạm thời skip việc parse, chỉ log
    }
  }

  private addToBuffer(intent: IntentCreatedEventType) {
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
