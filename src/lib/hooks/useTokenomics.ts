/**
 * useTokenomics Hook
 *
 * React hook for fetching and caching SEL tokenomics data from the chain.
 * Provides real-time supply statistics with automatic refresh.
 */

import { useState, useEffect, useCallback } from "react";
import {
  SupplyStats,
  fetchSupplyData,
  getMockSupplyStats,
  SELENDRA_CHAIN_CONFIG,
} from "@/lib/tokenomics";
import { rpcCache } from "@/lib/cache";

// Cache TTL for tokenomics data (60 seconds - data doesn't change frequently)
const TOKENOMICS_CACHE_TTL = 60000;

interface UseTokenomicsOptions {
  /** Refresh interval in milliseconds (default: 60000 = 1 minute) */
  refreshInterval?: number;
  /** Whether to use mock data instead of real chain data */
  useMock?: boolean;
  /** Custom RPC URL */
  rpcUrl?: string;
}

interface UseTokenomicsReturn extends SupplyStats {
  /** Manually refresh the data */
  refresh: () => Promise<void>;
  /** Whether data is currently being refreshed */
  isRefreshing: boolean;
}

/**
 * Hook to fetch SEL tokenomics data from the chain
 */
export function useTokenomics(
  options: UseTokenomicsOptions = {}
): UseTokenomicsReturn {
  const {
    refreshInterval = 60000,
    useMock = false,
    rpcUrl = SELENDRA_CHAIN_CONFIG.mainnet.rpcHttpUrl,
  } = options;

  const [stats, setStats] = useState<SupplyStats>(() => ({
    ...getMockSupplyStats(),
    isLoading: true,
  }));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (useMock) {
      setStats({
        ...getMockSupplyStats(),
        isLoading: false,
      });
      return;
    }

    try {
      setIsRefreshing(true);

      // Use RPC cache for tokenomics data
      const data = await rpcCache.get(
        `tokenomics:supply:${rpcUrl}`,
        async () => fetchSupplyData(rpcUrl),
        { ttl: TOKENOMICS_CACHE_TTL }
      );

      console.log("[useTokenomics] Fetched data:", {
        totalIssuance: data.totalIssuance,
        circulatingSupply: data.circulatingSupply,
        stakedSupply: data.stakedSupply,
        stakingRate: data.stakingRate,
      });

      setStats({
        totalSupply: data.totalIssuance,
        circulatingSupply: data.circulatingSupply,
        stakedSupply: data.stakedSupply,
        stakingRate: data.stakingRate,
        // Price data would come from an external API
        marketCap: undefined,
        price: undefined,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error("Failed to fetch tokenomics data:", error);
      // Fall back to mock data on error
      const mockData = getMockSupplyStats();
      setStats({
        ...mockData,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [rpcUrl, useMock]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    ...stats,
    refresh: fetchData,
    isRefreshing,
  };
}

/**
 * Hook specifically for supply display (simplified)
 */
export function useSupply(): {
  totalSupply: string;
  circulatingSupply: string;
  isLoading: boolean;
} {
  const { totalSupply, circulatingSupply, isLoading } = useTokenomics({
    refreshInterval: 300000, // 5 minutes
  });

  return {
    totalSupply: `${totalSupply} SEL`,
    circulatingSupply: `${circulatingSupply} SEL`,
    isLoading,
  };
}

/**
 * Hook for staking-related supply stats
 */
export function useStakingSupply(): {
  totalSupply: string;
  stakedSupply: string;
  stakingRate: number;
  isLoading: boolean;
} {
  const { totalSupply, stakedSupply, stakingRate, isLoading } = useTokenomics({
    refreshInterval: 60000, // 1 minute
  });

  return {
    totalSupply,
    stakedSupply,
    stakingRate,
    isLoading,
  };
}

export default useTokenomics;
