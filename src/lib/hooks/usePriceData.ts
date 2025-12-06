/**
 * Price Data Hook
 *
 * Fetches real-time price data for SEL and other tokens.
 * Uses CoinGecko API with fallback to mock data.
 */

import { useQuery } from "@tanstack/react-query";

export interface PriceData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

export interface UsePriceDataOptions {
  /** Token ID (coingecko format) */
  tokenId?: string;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

export interface UsePriceDataReturn {
  price: number | null;
  priceChange24h: number | null;
  priceChangePercent24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => void;
}

// CoinGecko API base URL
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Default SEL token config - placeholder until listed
const DEFAULT_SEL_PRICE: PriceData = {
  price: 0.0025, // Initial target price from tokenomics
  priceChange24h: 0,
  priceChangePercent24h: 0,
  marketCap: 575000, // 230M * $0.0025
  volume24h: 0,
  high24h: 0.0025,
  low24h: 0.0025,
  lastUpdated: Date.now(),
};

/**
 * Fetch price data from CoinGecko
 */
async function fetchPriceFromCoinGecko(tokenId: string): Promise<PriceData> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      price: data.market_data?.current_price?.usd || 0,
      priceChange24h: data.market_data?.price_change_24h || 0,
      priceChangePercent24h: data.market_data?.price_change_percentage_24h || 0,
      marketCap: data.market_data?.market_cap?.usd || 0,
      volume24h: data.market_data?.total_volume?.usd || 0,
      high24h: data.market_data?.high_24h?.usd || 0,
      low24h: data.market_data?.low_24h?.usd || 0,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.warn(`Failed to fetch price for ${tokenId}:`, error);
    throw error;
  }
}

/**
 * Fetch SEL price - attempts CoinGecko, falls back to default
 */
async function fetchSELPrice(): Promise<PriceData> {
  // SEL may not be listed on CoinGecko yet
  // Try to fetch, fall back to default tokenomics price
  try {
    // Replace 'selendra' with actual CoinGecko ID when listed
    return await fetchPriceFromCoinGecko("selendra");
  } catch {
    // Return default price data until SEL is listed
    return {
      ...DEFAULT_SEL_PRICE,
      lastUpdated: Date.now(),
    };
  }
}

/**
 * Hook for fetching SEL price data
 */
export function useSELPrice(
  options: Omit<UsePriceDataOptions, "tokenId"> = {}
): UsePriceDataReturn {
  const { refreshInterval = 60000, enabled = true } = options;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["sel-price"],
    queryFn: fetchSELPrice,
    refetchInterval: refreshInterval,
    enabled,
    staleTime: 30000, // Consider data stale after 30s
    retry: 2,
  });

  return {
    price: data?.price ?? null,
    priceChange24h: data?.priceChange24h ?? null,
    priceChangePercent24h: data?.priceChangePercent24h ?? null,
    marketCap: data?.marketCap ?? null,
    volume24h: data?.volume24h ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    lastUpdated: data?.lastUpdated ?? null,
    refetch,
  };
}

/**
 * Hook for fetching any token price data
 */
export function usePriceData(
  options: UsePriceDataOptions = {}
): UsePriceDataReturn {
  const { tokenId = "selendra", refreshInterval = 60000, enabled = true } = options;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["price", tokenId],
    queryFn: () => fetchPriceFromCoinGecko(tokenId),
    refetchInterval: refreshInterval,
    enabled,
    staleTime: 30000,
    retry: 2,
  });

  return {
    price: data?.price ?? null,
    priceChange24h: data?.priceChange24h ?? null,
    priceChangePercent24h: data?.priceChangePercent24h ?? null,
    marketCap: data?.marketCap ?? null,
    volume24h: data?.volume24h ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    lastUpdated: data?.lastUpdated ?? null,
    refetch,
  };
}

/**
 * Hook for fetching multiple token prices
 */
export function useMultipleTokenPrices(
  tokenIds: string[],
  options: Omit<UsePriceDataOptions, "tokenId"> = {}
): {
  prices: Record<string, PriceData | null>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { refreshInterval = 60000, enabled = true } = options;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["prices", tokenIds.sort().join(",")],
    queryFn: async () => {
      const results: Record<string, PriceData | null> = {};

      await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            results[tokenId] = await fetchPriceFromCoinGecko(tokenId);
          } catch {
            results[tokenId] = null;
          }
        })
      );

      return results;
    },
    refetchInterval: refreshInterval,
    enabled: enabled && tokenIds.length > 0,
    staleTime: 30000,
    retry: 2,
  });

  return {
    prices: data ?? {},
    isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number | null, decimals: number = 4): string {
  if (price === null) return "---";

  if (price < 0.01) {
    return `$${price.toFixed(6)}`;
  }
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  if (price < 1000) {
    return `$${price.toFixed(2)}`;
  }
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format market cap for display
 */
export function formatMarketCap(marketCap: number | null): string {
  if (marketCap === null) return "---";

  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  }
  if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(2)}K`;
  }
  return `$${marketCap.toFixed(2)}`;
}

/**
 * Format percentage change for display
 */
export function formatPriceChange(change: number | null): string {
  if (change === null) return "---";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}
