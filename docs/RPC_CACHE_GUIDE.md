# RPC Cache Integration Guide

Quick guide for integrating the RPC cache into hooks and components.

## Basic Usage

### 1. Using with TanStack Query

```typescript
import { useCachedQuery } from "@/lib/hooks/useCachedQuery";

function useMyData() {
  return useCachedQuery(
    ["my-data-key"],
    async () => {
      // Your fetch logic here
      return fetchDataFromRPC();
    },
    {
      cacheOptions: {
        ttl: 30000, // 30 seconds
      },
      staleTime: 25000,
      refetchOnMount: false,
    }
  );
}
```

### 2. Direct Cache Usage

```typescript
import { rpcCache } from "@/lib/cache";

async function fetchWithCache() {
  const data = await rpcCache.get(
    "my-cache-key",
    async () => {
      return await fetchDataFromAPI();
    },
    { ttl: 60000 } // 1 minute
  );

  return data;
}
```

## Cache Invalidation

### Invalidate Specific Key

```typescript
import { useInvalidateCache } from "@/lib/hooks/useCachedQuery";

function MyComponent() {
  const invalidateCache = useInvalidateCache();

  const handleUpdate = () => {
    // Invalidate specific key
    invalidateCache("validator-list:mainnet");
  };
}
```

### Invalidate by Pattern

```typescript
// Invalidate all validator-related caches
invalidateCache(/^validator-/);

// Invalidate all caches for a specific network
invalidateCache(/mainnet$/);
```

## Recommended TTL Values

```typescript
// Fast-changing data
{
  ttl: 1000;
} // Block height, gas price

// Medium frequency
{
  ttl: 10000;
} // Account balances, transactions

// Slow-changing data
{
  ttl: 60000;
} // Chain info, validator lists

// Static/rarely changing
{
  ttl: 300000;
} // Token metadata, network configuration
```

## Cache Statistics

```typescript
import { useCacheStats } from "@/lib/hooks/useCachedQuery";

function CacheMonitor() {
  const stats = useCacheStats();

  console.log("Cache hit rate:", stats.hitRate);
  console.log("Cache size:", stats.size);
}
```

## Integration Examples

### Example 1: Network Stats Hook

```typescript
import { useCachedQuery } from "@/lib/hooks/useCachedQuery";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

export function useNetworkStats() {
  const { substrateSDK, currentNetwork } = useBlockchain();

  return useCachedQuery(
    ["network-stats", currentNetwork],
    async () => {
      if (!substrateSDK) throw new Error("SDK not connected");

      const api = substrateSDK.getApi();
      const validators = await api.query.session.validators();

      return {
        validatorCount: validators.length,
        // ... more stats
      };
    },
    {
      cacheOptions: { ttl: 30000 }, // 30 seconds
      enabled: !!substrateSDK,
    }
  );
}
```

### Example 2: Invalidate on Block

```typescript
import { useEffect } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { rpcCache } from "@/lib/cache";

export function useBlockInvalidation() {
  const { latestSubstrateBlock } = useBlockchain();

  useEffect(() => {
    // Invalidate block-dependent caches on new block
    rpcCache.invalidate(/^block-/);
    rpcCache.invalidate(/^gas-price/);
  }, [latestSubstrateBlock?.number]);
}
```

### Example 3: Manual Cache Management

```typescript
import { rpcCache } from "@/lib/cache";

// Set data directly
rpcCache.set("my-key", myData, 60000);

// Clear all cache
rpcCache.clear();

// Get stats
const stats = rpcCache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

## Best Practices

1. **Use Appropriate TTL Values**

   - Match TTL to data update frequency
   - Shorter TTL for critical data
   - Longer TTL for static data

2. **Invalidate on Events**

   - New blocks → invalidate block-dependent data
   - Transactions → invalidate balance caches
   - Network changes → clear all caches

3. **Monitor Performance**

   - Check cache hit rates regularly
   - Adjust TTL based on actual usage
   - Monitor memory usage

4. **Handle Errors**
   - Cache failures should not break the app
   - Always have fallback to direct fetch
   - Log cache errors for debugging

## Troubleshooting

### Cache Not Working

- Check if cache key is consistent
- Verify TTL is not too short
- Ensure fetcher function is async

### Memory Issues

```typescript
import { rpcCache } from "@/lib/cache";

// Reduce max size
rpcCache.setMaxSize(500);

// Clear old entries
rpcCache.cleanup();
```

### Debug Cache

```typescript
// Get current cache state
const stats = rpcCache.getStats();
console.log("Cache stats:", stats);

// Bypass cache for testing
useCachedQuery(key, fetcher, { bypassCache: true });
```
