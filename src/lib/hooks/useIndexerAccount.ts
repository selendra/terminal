/**
 * React Query hook for fetching account data from the indexer
 */

import { useQuery } from "@tanstack/react-query";
import { indexerClient, IndexerAccount, IndexerError } from "@/lib/api/graphql";

/**
 * Fetch account information from the indexer
 */
export function useIndexerAccount(
  address: string | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const { enabled = true, refetchInterval } = options || {};

  return useQuery<IndexerAccount | null, IndexerError>({
    queryKey: ["indexer", "account", address],
    queryFn: async () => {
      if (!address) return null;
      return indexerClient.getAccount(address);
    },
    enabled: !!address && enabled,
    refetchInterval,
    staleTime: 10000, // 10 seconds
    retry: 2,
  });
}

/**
 * Search for accounts by address or identity
 */
export function useAccountSearch(
  query: string,
  options?: {
    limit?: number;
    enabled?: boolean;
  }
) {
  const { limit = 10, enabled = true } = options || {};

  return useQuery<IndexerAccount[], IndexerError>({
    queryKey: ["indexer", "accounts", "search", query, limit],
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      return indexerClient.searchAccounts(query, limit);
    },
    enabled: !!query && query.length >= 3 && enabled,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

/**
 * Fetch multiple accounts at once
 */
export function useIndexerAccounts(
  addresses: string[],
  options?: {
    enabled?: boolean;
  }
) {
  const { enabled = true } = options || {};

  return useQuery<(IndexerAccount | null)[], IndexerError>({
    queryKey: ["indexer", "accounts", addresses],
    queryFn: async () => {
      if (addresses.length === 0) return [];

      // Fetch accounts in parallel
      const results = await Promise.all(
        addresses.map((address) =>
          indexerClient.getAccount(address).catch(() => null)
        )
      );

      return results;
    },
    enabled: addresses.length > 0 && enabled,
    staleTime: 10000,
    retry: 1,
  });
}

/**
 * Fetch top accounts by balance or transaction count
 */
export function useTopAccounts(options?: {
  first?: number;
  offset?: number;
  orderBy?: "balance" | "txCount";
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const {
    first = 100,
    offset = 0,
    orderBy = "balance",
    enabled = true,
    refetchInterval,
  } = options || {};

  return useQuery<IndexerAccount[], IndexerError>({
    queryKey: ["indexer", "accounts", "top", first, offset, orderBy],
    queryFn: async () => {
      return indexerClient.getTopAccounts(first, offset, orderBy);
    },
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

/**
 * Fetch total account count
 */
export function useAccountsCount(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery<number, IndexerError>({
    queryKey: ["indexer", "accounts", "count"],
    queryFn: async () => {
      return indexerClient.getAccountsCount();
    },
    enabled,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}
