import {
  Injectable,
  Logger,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { ChainService } from 'src/chain/chain.service';
import { CacheService } from 'src/cache/cache.service';
import { INTENT_BOOK } from 'src/contracts';
import { IntentCreatedEventType } from 'src/common/contracts';

@Injectable()
export class ScannerService
  extends EventEmitter
  implements OnModuleInit, OnApplicationShutdown
{
  private logger = new Logger(ScannerService.name);
  private cursor: string | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private events: IntentCreatedEventType[] = [];
  private eventBuffer: IntentCreatedEventType[] = [];
  private isRunning = false;

  private readonly POLLING_INTERVAL_MS = 1000;
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
    await this.cacheService.waitForReady();
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

  private async fetchNewIntents() {
    return await this.chainService.queryEventsPaginated({
      module: INTENT_BOOK.MODULE_NAME,
      eventType: INTENT_BOOK.EVENTS.INTENT_CREATED,
      limit: this.EVENTS_LIMIT,
      cursor: typeof this.cursor === 'string' ? this.cursor : undefined,
    });
  }

  private async processPollResult(
    result: Awaited<ReturnType<typeof this.chainService.queryEventsPaginated>>,
  ) {
    if (!result) {
      return;
    }

    if ('nodes' in result) {
      for (const event of result.nodes) {
        if (event?.contents?.json) {
          this.logger.debug(
            `Processing event with JSON: ${JSON.stringify(event.contents.json)}`,
          );

          this.addToBuffer(event.contents.json as IntentCreatedEventType);
        }
      }
    }

    if ('pageInfo' in result && result.pageInfo?.endCursor) {
      this.cursor = result.pageInfo.endCursor;
      await this.saveCursor();
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

  private async loadCursor() {
    try {
      const saved = await this.cacheService.get(this.CURSOR_KEY);
      if (saved) {
        this.cursor = saved;
        this.logger.log(`Loaded cursor: ${this.cursor}`);
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
          this.cursor,
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
