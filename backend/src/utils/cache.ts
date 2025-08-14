import NodeCache from 'node-cache';
import { CacheEntry } from '../types';
import { logger } from './logger';

class CacheManager {
  private cache: NodeCache;
  private readonly defaultTTL = 30 * 60; // 30 minutes

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false
    });

    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache key expired: ${key}`);
    });
  }

  async set(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const success = this.cache.set(key, data, ttl || this.defaultTTL);
      if (success) {
        logger.debug(`Cache set: ${key}`);
      } else {
        logger.warn(`Failed to set cache: ${key}`);
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = this.cache.get<T>(key);
      if (data !== undefined) {
        logger.debug(`Cache hit: ${key}`);
        return data;
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error('Cache has error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.flushAll();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  getStats() {
    return this.cache.getStats();
  }

  generateKey(prefix: string, params: any): string {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    return `${prefix}:${hash}`;
  }
}

export const cacheManager = new CacheManager();