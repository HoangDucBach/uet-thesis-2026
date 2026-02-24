import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { ChainService } from 'src/chain/chain.service';
import { CacheService } from './cache.service';
import { IntentEvent, Cursor, PollResult } from './scanner.types';

@Injectable()
export class ScannerService
  extends EventEmitter
  implements OnModuleInit, OnApplicationShutdown
{
  private logger = new Logger(ScannerService.name);
  private cursor: Cursor | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private eventBuffer: IntentEvent[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  private readonly POLLING_INTERVAL_MS = 2000;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT_MS = 5000;
  private readonly EVENTS_LIMIT = 50;
  private readonly CURSOR_KEY = 'scanner:cursor';
  private readonly CURSOR_TTL_SECONDS = 86400;

  constructor(
    private chainService: ChainService,
    private cacheService: CacheService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.loadCursor();
    this.startPolling();
  }

  private startPolling() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('Scanner polling started');
    this.schedulePoll();
  }

  private stopPolling() {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    this.logger.log('Scanner polling stopped');
  }

  private schedulePoll() {
    this.pollTimer = setTimeout(() => {
      this.poll().catch((err) => {
        this.logger.error(`Unhandled poll error: ${err}`, err);
      });
    }, this.POLLING_INTERVAL_MS);
  }

  private async poll() {
    try {
      const result = await this.fetchNewIntents();
      await this.processPollResult(result);
    } catch (err) {
      this.logger.error(`Poll error: ${err}`, err);
    } finally {
      if (this.isRunning) {
        this.schedulePoll();
      }
    }
  }

  private async fetchNewIntents(): Promise<PollResult> {
    return await this.chainService.queryEventsPaginated({
      module: 'intent_book',
      eventType: 'IntentCreated',
      limit: this.EVENTS_LIMIT,
      cursor: this.cursor?.txDigest,
    });
  }

  private async processPollResult(result: PollResult) {
    if (!result.data || result.data.length === 0) {
      return;
    }

    for (const event of result.data) {
      const intent = this.parseIntentEvent(event);
      if (intent) {
        this.addToBuffer(intent);
      }
    }

    if (result.nextCursor) {
      this.cursor = result.nextCursor;
      await this.saveCursor();
    }
  }

  private parseIntentEvent(event: IntentEvent): IntentEvent | null {
    try {
      return {
        id: event.id,
        owner: event.owner,
        sellAmount: BigInt(event.sellAmount),
        minAmountOut: BigInt(event.minAmountOut),
        deadline: BigInt(event.deadline),
        txDigest: event.txDigest,
        eventSeq: event.eventSeq,
        timestamp: Date.now(),
      };
    } catch (err) {
      this.logger.warn(`Failed to parse intent event: ${err}`);
      return null;
    }
  }

  private addToBuffer(intent: IntentEvent) {
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

  onIntent(listener: (intents: IntentEvent[]) => Promise<void>) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.on('intents', listener);
  }

  private async loadCursor() {
    try {
      const saved = await this.cacheService.get(this.CURSOR_KEY);
      if (saved) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.cursor = JSON.parse(saved);
        this.logger.log(`Loaded cursor: ${JSON.stringify(this.cursor)}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to load cursor: ${err}`);
    }
  }

  private async saveCursor() {
    try {
      if (this.cursor) {
        await this.cacheService.set(
          this.CURSOR_KEY,
          JSON.stringify(this.cursor),
          this.CURSOR_TTL_SECONDS,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to save cursor: ${err}`);
    }
  }

  onApplicationShutdown() {
    this.stopPolling();
    this.flushBatch();
    this.logger.log('ScannerService shutdown complete');
  }
}
