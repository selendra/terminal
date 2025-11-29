/**
 * React Query hook for fetching blocks from the indexer
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { indexerClient, IndexerBlock, IndexerError } from "@/lib/api/graphql";

/**
 * Fetch recent blocks from the indexer
 */
export function useIndexerBlocks(options?: {
  first?: number;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const { first = 10, enabled = true, refetchInterval } = options || {};

  return useQuery<IndexerBlock[], IndexerError>({
    queryKey: ["indexer", "blocks", first],
    queryFn: async () => {
      return indexerClient.getBlocks(first);
    },
    enabled,
    refetchInterval,
    staleTime: 3000, // 3 seconds - Selendra has 1s block time
    retry: (failureCount, error) => {
      // Don't retry on GraphQL errors
      if (error instanceof IndexerError && error.code === "GRAPHQL_ERROR") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Fetch a specific block by number
 */
export function useIndexerBlock(blockNumber: number | undefined) {
  return useQuery<IndexerBlock | null, IndexerError>({
    queryKey: ["indexer", "block", blockNumber],
    queryFn: async () => {
      if (blockNumber === undefined) return null;
      return indexerClient.getBlock(blockNumber);
    },
    enabled: blockNumber !== undefined,
    staleTime: 60000, // 1 minute - blocks don't change
    retry: 2,
  });
}

/**
 * Infinite scroll for blocks
 */
export function useInfiniteIndexerBlocks(options?: {
  pageSize?: number;
  enabled?: boolean;
}) {
  const { pageSize = 20, enabled = true } = options || {};

  return useInfiniteQuery<IndexerBlock[], IndexerError>({
    queryKey: ["indexer", "blocks", "infinite", pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      return indexerClient.getBlocks(pageSize, pageParam as number);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer blocks than requested, there are no more
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length * pageSize;
    },
    enabled,
    staleTime: 3000,
  });
}
