import { EventEmitter } from 'events';
import { Observable } from 'rxjs';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

export interface CowEvent {
  package_id: string;
  module_name: string;
  event_name: string;
  tx_digest: string;
  checkpoint_seq: number;
  timestamp_ms: number;
}

interface EventStreamService {
  subscribeCowEvents(data: Record<string, never>): Observable<CowEvent>;
}

@Injectable()
export class GrpcClientService extends EventEmitter implements OnModuleInit {
  private readonly logger = new Logger(GrpcClientService.name);
  private eventStreamService: EventStreamService;

  constructor(@Inject('COW_EVENT_PACKAGE') private client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.eventStreamService =
      this.client.getService<EventStreamService>('EventStream');
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    this.logger.log('Subscribing to COW events via gRPC...');

    this.eventStreamService.subscribeCowEvents({}).subscribe({
      next: (event: CowEvent) => {
        this.logger.debug(
          `Received COW event: ${event.module_name}.${event.event_name} tx=${event.tx_digest}`,
        );
        this.emit('cowEvent', event);
      },
      error: (error: Error) => {
        this.logger.error(`gRPC stream error: ${error.message}`);
        // Reconnect sau một khoảng thời gian
        setTimeout(() => this.subscribeToEvents(), 5000);
      },
      complete: () => {
        this.logger.warn('gRPC stream completed, reconnecting...');
        setTimeout(() => this.subscribeToEvents(), 5000);
      },
    });
  }

  onCowEvent(listener: (event: CowEvent) => void) {
    this.on('cowEvent', listener);
  }
}
