import { describe, it, expect, beforeEach, vi } from "vitest";
import { RPCCache } from "../rpc-cache";

describe("RPCCache", () => {
  let cache: RPCCache;

  beforeEach(() => {
    cache = new RPCCache();
    cache.clear();
  });

  describe("get", () => {
    it("should return initial state with no hits or misses", () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it("should fetch data on cache miss", async () => {
      const fetcher = vi.fn().mockResolvedValue("test-data");

      const result = await cache.get("test-key", fetcher);

      expect(result).toBe("test-data");
      expect(fetcher).toHaveBeenCalledOnce();

      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
      expect(stats.size).toBe(1);
    });

    it("should return cached data on cache hit", async () => {
      const fetcher = vi.fn().mockResolvedValue("test-data");

      // First call - cache miss
      const result1 = await cache.get("test-key", fetcher);
      expect(result1).toBe("test-data");
      expect(fetcher).toHaveBeenCalledOnce();

      // Second call - cache hit
      const result2 = await cache.get("test-key", fetcher);
      expect(result2).toBe("test-data");
      expect(fetcher).toHaveBeenCalledOnce(); // Should not call fetcher again

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it("should refetch data when TTL expires", async () => {
      const fetcher = vi.fn().mockResolvedValue("test-data");

      // First call with 10ms TTL
      await cache.get("test-key", fetcher, { ttl: 10 });
      expect(fetcher).toHaveBeenCalledOnce();

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Second call - should refetch
      await cache.get("test-key", fetcher, { ttl: 10 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("should respect custom cache key", async () => {
      const fetcher1 = vi.fn().mockResolvedValue("data-1");
      const fetcher2 = vi.fn().mockResolvedValue("data-2");

      // Store with custom key
      await cache.get("key1", fetcher1, { key: "custom-key" });

      // Fetch with same custom key but different original key
      const result = await cache.get("key2", fetcher2, { key: "custom-key" });

      expect(result).toBe("data-1"); // Should return cached data from key1
      expect(fetcher1).toHaveBeenCalledOnce();
      expect(fetcher2).not.toHaveBeenCalled();
    });
  });

  describe("set", () => {
    it("should store data in cache", () => {
      cache.set("test-key", "test-data");

      const stats = cache.getStats();
      expect(stats.size).toBe(1);
    });

    it("should respect custom TTL", async () => {
      cache.set("test-key", "test-data", 10);

      // Should be valid immediately
      const fetcher = vi.fn();
      await cache.get("test-key", fetcher);
      expect(fetcher).not.toHaveBeenCalled();

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should be invalid now
      await cache.get("test-key", fetcher);
      expect(fetcher).toHaveBeenCalled();
    });

    it("should enforce max size", () => {
      cache.setMaxSize(3);

      cache.set("key1", "data1");
      cache.set("key2", "data2");
      cache.set("key3", "data3");

      expect(cache.getStats().size).toBe(3);

      // Adding one more should remove the oldest
      cache.set("key4", "data4");

      expect(cache.getStats().size).toBe(3);
    });
  });

  describe("invalidate", () => {
    beforeEach(() => {
      cache.set("user:1", "user-1-data");
      cache.set("user:2", "user-2-data");
      cache.set("post:1", "post-1-data");
      cache.set("post:2", "post-2-data");
    });

    it("should invalidate specific key", () => {
      cache.invalidate("user:1");

      expect(cache.getStats().size).toBe(3);
    });

    it("should invalidate keys matching regex pattern", () => {
      cache.invalidate(/^user:/);

      const stats = cache.getStats();
      expect(stats.size).toBe(2); // Only post keys remain
    });

    it("should handle non-existent keys gracefully", () => {
      cache.invalidate("non-existent");

      expect(cache.getStats().size).toBe(4); // No change
    });
  });

  describe("clear", () => {
    it("should clear all cache entries and stats", async () => {
      const fetcher = vi.fn().mockResolvedValue("test-data");

      await cache.get("key1", fetcher);
      await cache.get("key2", fetcher);
      await cache.get("key1", fetcher); // Cache hit

      expect(cache.getStats().size).toBeGreaterThan(0);

      cache.clear();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      cache.set("key1", "data1", 10); // 10ms TTL
      cache.set("key2", "data2", 10000); // 10s TTL

      expect(cache.getStats().size).toBe(2);

      // Wait for first entry to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      cache.cleanup();

      expect(cache.getStats().size).toBe(1);
    });

    it("should keep valid entries", () => {
      cache.set("key1", "data1", 10000); // 10s TTL
      cache.set("key2", "data2", 10000); // 10s TTL

      cache.cleanup();

      expect(cache.getStats().size).toBe(2);
    });
  });

  describe("configuration", () => {
    it("should update default TTL", async () => {
      cache.setDefaultTTL(100);

      const fetcher = vi.fn().mockResolvedValue("test-data");
      await cache.get("test-key", fetcher);

      // Should still be valid after 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));
      await cache.get("test-key", fetcher);
      expect(fetcher).toHaveBeenCalledOnce();

      // Should expire after 150ms total
      await new Promise((resolve) => setTimeout(resolve, 100));
      await cache.get("test-key", fetcher);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("should update max size", () => {
      cache.setMaxSize(2);

      cache.set("key1", "data1");
      cache.set("key2", "data2");
      cache.set("key3", "data3");

      expect(cache.getStats().size).toBe(2);
    });

    it("should trim cache when max size is reduced", () => {
      cache.set("key1", "data1");
      cache.set("key2", "data2");
      cache.set("key3", "data3");

      cache.setMaxSize(2);

      expect(cache.getStats().size).toBe(2);
    });
  });
});
