import { Injectable, Logger } from '@nestjs/common';
import { createClient } from 'redis';

type RedisClientType = ReturnType<typeof createClient>;

@Injectable()
export class CacheService {
  private client: RedisClientType | null = null;
  private logger = new Logger(CacheService.name);
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  async onModuleInit() {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        password: process.env.REDIS_PASSWORD || undefined,
      });

      this.client.on('error', (err) => this.logger.error('Redis error', err));
      this.client.on('connect', () => this.logger.log('Redis connected'));

      await this.client.connect();
      this.resolveReady();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  private getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return await this.getClient().get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.getClient().del(key);
  }

  async onApplicationShutdown() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis disconnected');
    }
  }
}
