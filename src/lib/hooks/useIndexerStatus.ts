/**
 * React Query hook for monitoring indexer sync status
 */

import { useQuery } from "@tanstack/react-query";
import {
  indexerClient,
  IndexerSyncStatus,
  IndexerDailyStats,
  IndexerError,
} from "@/lib/api/graphql";

/**
 * Monitor indexer sync status
 */
export function useIndexerStatus(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { enabled = true, refetchInterval = 10000 } = options || {};

  return useQuery<IndexerSyncStatus & { isAvailable: boolean }, IndexerError>({
    queryKey: ["indexer", "status"],
    queryFn: async () => {
      // First check if indexer is available
      const isAvailable = await indexerClient.checkAvailability();

      if (!isAvailable) {
        return {
          indexerBlock: 0,
          chainBlock: 0,
          lag: 0,
          isSynced: false,
          isAvailable: false,
        };
      }

      const status = await indexerClient.getSyncStatus();
      return {
        ...status,
        isAvailable: true,
      };
    },
    enabled,
    refetchInterval,
    staleTime: 5000,
    retry: false, // Don't retry status checks
  });
}

/**
 * Check if indexer is available (simple boolean)
 */
export function useIndexerAvailability(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery<boolean, IndexerError>({
    queryKey: ["indexer", "availability"],
    queryFn: async () => {
      return indexerClient.checkAvailability();
    },
    enabled,
    staleTime: 30000, // 30 seconds
    retry: false,
  });
}

/**
 * Fetch daily statistics from the indexer
 */
export function useIndexerDailyStats(options?: {
  days?: number;
  enabled?: boolean;
}) {
  const { days = 30, enabled = true } = options || {};

  return useQuery<IndexerDailyStats[], IndexerError>({
    queryKey: ["indexer", "dailyStats", days],
    queryFn: async () => {
      return indexerClient.getDailyStats(days);
    },
    enabled,
    staleTime: 60000, // 1 minute - stats don't change frequently
    retry: 2,
  });
}

/**
 * Get aggregated chain statistics
 */
export function useChainStatistics(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery<
    {
      totalBlocks: number;
      totalTransactions: number;
      totalAccounts: number;
      averageBlockTime: number;
      tps: number;
    },
    IndexerError
  >({
    queryKey: ["indexer", "chainStatistics"],
    queryFn: async () => {
      // Get the latest daily stats to calculate aggregates
      const dailyStats = await indexerClient.getDailyStats(7);

      if (dailyStats.length === 0) {
        return {
          totalBlocks: 0,
          totalTransactions: 0,
          totalAccounts: 0,
          averageBlockTime: 1, // Selendra default
          tps: 0,
        };
      }

      // Sum up the stats
      const totals = dailyStats.reduce(
        (acc, day) => ({
          blocks: acc.blocks + day.blocksProduced,
          transactions: acc.transactions + day.totalTransactions,
          newAccounts: acc.newAccounts + day.newAccounts,
        }),
        { blocks: 0, transactions: 0, newAccounts: 0 }
      );

      // Calculate averages
      const days = dailyStats.length;
      const avgBlocksPerDay = totals.blocks / days;
      const avgTxPerDay = totals.transactions / days;

      return {
        totalBlocks: totals.blocks,
        totalTransactions: totals.transactions,
        totalAccounts: totals.newAccounts,
        averageBlockTime: 1, // Selendra has ~1 second blocks
        tps: avgTxPerDay / 86400, // Average TPS
      };
    },
    enabled,
    staleTime: 60000,
    retry: 2,
  });
}
