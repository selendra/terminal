/**
 * RPC Cache Implementation
 * Provides a caching layer for RPC calls with configurable TTL and cache invalidation
 */

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache options for configuring cache behavior
 */
export interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Custom cache key (overrides default key generation) */
  key?: string;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * RPC Cache class
 * Provides a simple in-memory cache for RPC responses
 */
export class RPCCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5000; // 5 seconds default
  private maxSize = 1000; // Maximum number of entries
  private hits = 0;
  private misses = 0;

  /**
   * Get data from cache or fetch if not available/expired
   * @param key Cache key
   * @param fetcher Function to fetch data if not in cache
   * @param options Cache options (TTL, custom key)
   * @returns Promise that resolves to the cached or fetched data
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cacheKey = options?.key || key;
    const ttl = options?.ttl !== undefined ? options.ttl : this.defaultTTL;

    // Check if entry exists and is still valid
    const entry = this.cache.get(cacheKey);
    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (age < entry.ttl) {
        this.hits++;
        return entry.data as T;
      }
    }

    // Cache miss - fetch data
    this.misses++;
    const data = await fetcher();

    // Store in cache
    this.set(cacheKey, data, ttl);

    return data;
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time-to-live in milliseconds
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl !== undefined ? ttl : this.defaultTTL,
    });
  }

  /**
   * Invalidate cache entries matching a key or pattern
   * @param keyOrPattern String key or RegExp pattern to match
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === "string") {
      this.cache.delete(keyOrPattern);
    } else {
      // RegExp - delete all matching keys
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Set default TTL for cache entries
   * @param ttl Time-to-live in milliseconds
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Set maximum cache size
   * @param size Maximum number of entries
   */
  setMaxSize(size: number): void {
    this.maxSize = size;

    // Trim cache if needed
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global RPC cache instance
 */
export const rpcCache = new RPCCache();

// Run cleanup every 60 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    rpcCache.cleanup();
  }, 60000);
}
