/**
 * Cached Query Hooks
 * Utility hooks for integrating RPC cache with TanStack Query
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { rpcCache, CacheOptions, CacheStats } from "../cache/rpc-cache";

/**
 * Options for cached query
 */
export interface UseCachedQueryOptions<T> extends UseQueryOptions<T> {
  /** Cache options (TTL, custom key) */
  cacheOptions?: CacheOptions;
  /** Whether to bypass cache */
  bypassCache?: boolean;
}

/**
 * Hook that integrates TanStack Query with RPC cache
 * @param queryKey Query key for React Query
 * @param fetcher Function to fetch data
 * @param options Query options including cache options
 * @returns Query result with cached data support
 */
export function useCachedQuery<T>(
  queryKey: string | readonly unknown[],
  fetcher: () => Promise<T>,
  options?: UseCachedQueryOptions<T>
) {
  const {
    cacheOptions,
    bypassCache = false,
    enabled = true,
    ...queryOptions
  } = options || {};

  const cacheKey = Array.isArray(queryKey)
    ? queryKey.map((k) => String(k)).join(":")
    : String(queryKey);

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      if (bypassCache) {
        return fetcher();
      }
      return rpcCache.get(cacheKey, fetcher, cacheOptions);
    },
    enabled,
    ...queryOptions,
  });
}

/**
 * Hook to invalidate cache entries
 * @returns Function to invalidate cache
 */
export function useInvalidateCache() {
  return useCallback((keyOrPattern: string | RegExp) => {
    rpcCache.invalidate(keyOrPattern);
  }, []);
}

/**
 * Hook to get real-time cache statistics
 * @param refreshInterval How often to refresh stats (default 1000ms)
 * @returns Cache statistics
 */
export function useCacheStats(refreshInterval = 1000): CacheStats {
  const [stats, setStats] = useState<CacheStats>(() => rpcCache.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(rpcCache.getStats());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return stats;
}

/**
 * Hook to monitor cache performance with detailed metrics
 */
export function useCacheMonitor() {
  const stats = useCacheStats(2000); // Update every 2 seconds

  const invalidateAll = useCallback(() => {
    rpcCache.clear();
  }, []);

  const invalidatePattern = useCallback((pattern: string | RegExp) => {
    rpcCache.invalidate(pattern);
  }, []);

  const cleanup = useCallback(() => {
    rpcCache.cleanup();
  }, []);

  return {
    ...stats,
    invalidateAll,
    invalidatePattern,
    cleanup,
    // Computed metrics
    hitRatePercentage: (stats.hitRate * 100).toFixed(1),
    isHealthy: stats.hitRate >= 0.5 || stats.hits + stats.misses < 10,
  };
}
