import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memStore = new Map<string, MemEntry>();

  constructor(private config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      this.client = new Redis(redisUrl, { lazyConnect: true });
      this.client.on('connect', () => this.logger.log('Redis connected'));
      this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    } else {
      this.logger.warn('REDIS_URL not set — using in-memory store (not suitable for production)');
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } else {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : Infinity;
      this.memStore.set(key, { value, expiresAt });
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client) return this.client.get(key);
    const entry = this.memStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(key);
    } else {
      this.memStore.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.client) {
      const count = await this.client.exists(key);
      return count > 0;
    }
    return (await this.get(key)) !== null;
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }
}
