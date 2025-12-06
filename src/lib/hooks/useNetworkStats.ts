/**
 * Network Statistics Hook
 *
 * Fetches real-time network statistics from the blockchain.
 * Provides block height, transaction counts, validator info, etc.
 */

import { useQuery } from "@tanstack/react-query";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useCallback, useEffect, useState } from "react";
import { rpcCache } from "@/lib/cache";

// Cache TTL constants
const CACHE_TTL = {
  NETWORK_STATS: 10000, // 10 seconds for general stats
  VALIDATORS: 30000, // 30 seconds for validator data
  GAS_PRICE: 5000, // 5 seconds for gas price
  CHAIN_INFO: 60000, // 60 seconds for static chain info
} as const;

export interface NetworkStats {
  // Block data
  blockHeight: number;
  blockHash: string;
  blockTime: number; // Average block time in seconds

  // Transaction data
  totalTransactions: number;
  transactionsPerSecond: number;

  // Validator data
  activeValidators: number;
  totalValidators: number;

  // Network health
  peerCount: number;
  isSyncing: boolean;
  syncProgress: number;

  // Chain info
  chainName: string;
  chainVersion: string;
  evmChainId: number;

  // Gas/fees
  gasPrice: string;
  baseFee: string;

  // Timestamps
  lastUpdated: number;
}

export interface UseNetworkStatsOptions {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

export interface UseNetworkStatsReturn {
  stats: NetworkStats | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULT_STATS: NetworkStats = {
  blockHeight: 0,
  blockHash: "",
  blockTime: 1, // Selendra has 1s block time
  totalTransactions: 0,
  transactionsPerSecond: 0,
  activeValidators: 4, // Phase 1 default
  totalValidators: 4,
  peerCount: 0,
  isSyncing: false,
  syncProgress: 100,
  chainName: "Selendra",
  chainVersion: "1.0.0",
  evmChainId: 1961,
  gasPrice: "0.1 Gwei",
  baseFee: "0.0001",
  lastUpdated: Date.now(),
};

/**
 * Hook for fetching network statistics
 */
export function useNetworkStats(
  options: UseNetworkStatsOptions = {}
): UseNetworkStatsReturn {
  const { refreshInterval = 10000, enabled = true } = options;

  const {
    substrateSDK,
    evmSDK,
    isConnected,
    latestSubstrateBlock,
    substrateChainInfo,
    evmChainInfo,
    networkStats: blockchainProviderStats,
  } = useBlockchain();

  const [cachedStats, setCachedStats] = useState<NetworkStats | null>(null);

  /**
   * Fetch comprehensive network stats from chain
   */
  const fetchNetworkStats = useCallback(async (): Promise<NetworkStats> => {
    const stats: NetworkStats = { ...DEFAULT_STATS };

    // Get block data from provider state
    if (latestSubstrateBlock) {
      stats.blockHeight = latestSubstrateBlock.number;
      stats.blockHash = latestSubstrateBlock.hash;
    }

    // Get chain info (cached for longer)
    if (substrateChainInfo) {
      stats.chainName = substrateChainInfo.name;
      stats.chainVersion = substrateChainInfo.version;
    }

    if (evmChainInfo?.chainId) {
      stats.evmChainId = evmChainInfo.chainId;
    }

    // Get validator count from blockchain provider stats
    if (blockchainProviderStats?.validators) {
      stats.activeValidators = blockchainProviderStats.validators;
      stats.totalValidators = blockchainProviderStats.validators;
    }

    // Try to get more detailed stats from Substrate API (cached)
    if (substrateSDK) {
      const api = substrateSDK.getApi();
      if (api && api.isConnected) {
        try {
          // Get system health (short TTL - changes frequently)
          const health = await rpcCache.get(
            "substrate:system:health",
            async () => {
              const h = await api.rpc.system.health();
              return {
                peers: h.peers.toNumber(),
                isSyncing: h.isSyncing.isTrue,
              };
            },
            { ttl: CACHE_TTL.NETWORK_STATS }
          );
          stats.peerCount = health.peers;
          stats.isSyncing = health.isSyncing;

          // Get validators (longer TTL - changes with era)
          try {
            const validators = await rpcCache.get(
              "substrate:session:validators",
              async () => {
                const v = await api.query.session.validators();
                return Array.isArray(v) ? v.length : 4;
              },
              { ttl: CACHE_TTL.VALIDATORS }
            );
            stats.activeValidators = validators;
            stats.totalValidators = validators;
          } catch {
            // Session pallet might not be available
          }

          // Get sync state
          try {
            const syncState = await rpcCache.get(
              "substrate:system:syncState",
              async () => {
                const state = await api.rpc.system.syncState();
                const currentBlock = state.currentBlock.toNumber();
                const highestBlock = state.highestBlock.toNumber();
                return { currentBlock, highestBlock };
              },
              { ttl: CACHE_TTL.NETWORK_STATS }
            );
            if (syncState.highestBlock > 0) {
              stats.syncProgress = Math.round(
                (syncState.currentBlock / syncState.highestBlock) * 100
              );
            }
          } catch {
            // Sync state might not be available
          }
        } catch (error) {
          console.warn("Failed to fetch Substrate stats:", error);
        }
      }
    }

    // Try to get EVM-specific stats (cached)
    if (evmSDK) {
      const provider = evmSDK.getEvmProvider();
      if (provider) {
        try {
          // Get gas price (short TTL)
          const feeData = await rpcCache.get(
            "evm:feeData",
            async () => {
              const fee = await provider.getFeeData();
              return {
                gasPrice: fee.gasPrice ? Number(fee.gasPrice) : null,
                maxFeePerGas: fee.maxFeePerGas
                  ? Number(fee.maxFeePerGas)
                  : null,
              };
            },
            { ttl: CACHE_TTL.GAS_PRICE }
          );

          if (feeData.gasPrice) {
            const gasPriceGwei = feeData.gasPrice / 1_000_000_000;
            stats.gasPrice = `${gasPriceGwei.toFixed(2)} Gwei`;
          }
          if (feeData.maxFeePerGas) {
            const baseFeeGwei = feeData.maxFeePerGas / 1_000_000_000;
            stats.baseFee = `${baseFeeGwei.toFixed(4)} Gwei`;
          }
        } catch (error) {
          console.warn("Failed to fetch EVM stats:", error);
        }
      }
    }

    stats.lastUpdated = Date.now();
    return stats;
  }, [
    substrateSDK,
    evmSDK,
    latestSubstrateBlock,
    substrateChainInfo,
    evmChainInfo,
    blockchainProviderStats,
  ]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["network-stats", isConnected],
    queryFn: fetchNetworkStats,
    refetchInterval: refreshInterval,
    enabled: enabled && isConnected,
    staleTime: 5000,
    retry: 2,
  });

  // Update cached stats when data changes
  useEffect(() => {
    if (data) {
      setCachedStats(data);
    }
  }, [data]);

  // Also update when latestSubstrateBlock changes (real-time updates)
  useEffect(() => {
    if (latestSubstrateBlock && cachedStats) {
      setCachedStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          blockHeight: latestSubstrateBlock.number,
          blockHash: latestSubstrateBlock.hash,
          lastUpdated: Date.now(),
        };
      });
    }
  }, [latestSubstrateBlock?.number]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stats: cachedStats || data || null,
    isLoading,
    isConnected,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * Hook for getting transaction statistics
 * Uses indexer if available, falls back to estimates
 */
export function useTransactionStats(options: UseNetworkStatsOptions = {}): {
  totalTransactions: number | null;
  dailyTransactions: number | null;
  tps: number | null;
  isLoading: boolean;
  error: string | null;
} {
  const { refreshInterval = 30000, enabled = true } = options;
  const { isConnected, networkStats } = useBlockchain();

  const GRAPHQL_ENDPOINT =
    process.env.NEXT_PUBLIC_INDEXER_GRAPHQL_URL ||
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
    "";

  const fetchTransactionStats = useCallback(async () => {
    // Try to fetch from indexer (cached for 15 seconds)
    if (GRAPHQL_ENDPOINT) {
      try {
        const result = await rpcCache.get(
          "indexer:transaction-stats",
          async () => {
            const response = await fetch(GRAPHQL_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  query {
                    transactions(first: 0) {
                      totalCount
                    }
                    dailyStats(first: 1, orderBy: DATE_DESC) {
                      nodes {
                        totalTransactions
                      }
                    }
                  }
                `,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return {
                totalTransactions: data.data?.transactions?.totalCount || null,
                dailyTransactions:
                  data.data?.dailyStats?.nodes?.[0]?.totalTransactions || null,
              };
            }
            return null;
          },
          { ttl: 15000 } // 15 seconds
        );

        if (result) {
          return {
            ...result,
            tps: networkStats?.tps || null,
          };
        }
      } catch {
        // Indexer not available
      }
    }

    // Fallback to estimates
    return {
      totalTransactions: null,
      dailyTransactions: null,
      tps: networkStats?.tps || null,
    };
  }, [GRAPHQL_ENDPOINT, networkStats?.tps]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["transaction-stats"],
    queryFn: fetchTransactionStats,
    refetchInterval: refreshInterval,
    enabled: enabled && isConnected,
    staleTime: 15000,
  });

  return {
    totalTransactions: data?.totalTransactions ?? null,
    dailyTransactions: data?.dailyTransactions ?? null,
    tps: data?.tps ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * Format block number for display
 */
export function formatBlockNumber(blockNumber: number | null): string {
  if (blockNumber === null) return "---";
  return `#${blockNumber.toLocaleString()}`;
}

/**
 * Format TPS for display
 */
export function formatTPS(tps: number | null): string {
  if (tps === null) return "---";
  if (tps >= 1000) {
    return `${(tps / 1000).toFixed(1)}K`;
  }
  return tps.toFixed(1);
}
