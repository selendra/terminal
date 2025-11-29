/**
 * React Query hook for fetching transactions from the indexer
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  indexerClient,
  IndexerTransaction,
  IndexerError,
} from "@/lib/api/graphql";

interface TransactionFilters {
  type?: "SUBSTRATE" | "EVM" | "EVM_WRAPPED";
  status?: "SUCCESS" | "FAILED";
  fromAddress?: string;
  toAddress?: string;
}

/**
 * Fetch recent transactions from the indexer
 */
export function useIndexerTransactions(options?: {
  first?: number;
  filters?: TransactionFilters;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const {
    first = 20,
    filters,
    enabled = true,
    refetchInterval,
  } = options || {};

  return useQuery<IndexerTransaction[], IndexerError>({
    queryKey: ["indexer", "transactions", first, filters],
    queryFn: async () => {
      return indexerClient.getTransactions(first, 0, filters);
    },
    enabled,
    refetchInterval,
    staleTime: 3000, // 3 seconds
    retry: (failureCount, error) => {
      if (error instanceof IndexerError && error.code === "GRAPHQL_ERROR") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Fetch a specific transaction by hash
 */
export function useIndexerTransaction(hash: string | undefined) {
  return useQuery<IndexerTransaction | null, IndexerError>({
    queryKey: ["indexer", "transaction", hash],
    queryFn: async () => {
      if (!hash) return null;
      return indexerClient.getTransaction(hash);
    },
    enabled: !!hash,
    staleTime: 60000, // 1 minute - transactions don't change
    retry: 2,
  });
}

/**
 * Infinite scroll for transactions
 */
export function useInfiniteIndexerTransactions(options?: {
  pageSize?: number;
  filters?: TransactionFilters;
  enabled?: boolean;
}) {
  const { pageSize = 20, filters, enabled = true } = options || {};

  return useInfiniteQuery<IndexerTransaction[], IndexerError>({
    queryKey: ["indexer", "transactions", "infinite", pageSize, filters],
    queryFn: async ({ pageParam = 0 }) => {
      return indexerClient.getTransactions(
        pageSize,
        pageParam as number,
        filters
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length * pageSize;
    },
    enabled,
    staleTime: 3000,
  });
}

/**
 * Fetch transactions for a specific account
 */
export function useAccountTransactions(
  address: string | undefined,
  options?: {
    first?: number;
    enabled?: boolean;
  }
) {
  const { first = 20, enabled = true } = options || {};

  return useQuery<IndexerTransaction[], IndexerError>({
    queryKey: ["indexer", "account", address, "transactions", first],
    queryFn: async () => {
      if (!address) return [];
      return indexerClient.getAccountTransactions(address, first);
    },
    enabled: !!address && enabled,
    staleTime: 5000,
    retry: 2,
  });
}
