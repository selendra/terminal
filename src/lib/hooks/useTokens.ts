import { useState, useEffect, useCallback } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { Token, TokenType, TokenStandard } from "@/types/tokens";
import { rpcCache } from "@/lib/cache";

// Known tokens configuration (could be moved to a config file)
const KNOWN_TOKENS = [
  {
    id: "sel",
    name: "Selendra",
    symbol: "SEL",
    logo: "🔮",
    address: "Native",
    type: "native" as TokenType,
    standard: "Native" as TokenStandard,
    decimals: 18,
    verified: true,
    favorite: true,
  },
  // Add more known tokens here
];

export function useTokens() {
  const { substrateSDK, evmSDK, isConnected, networkStats } = useBlockchain();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!isConnected || !substrateSDK) {
      // Return basic structure even if not connected, but with empty data
      const initialTokens = KNOWN_TOKENS.map(t => ({
        ...t,
        rank: 1,
        price: "-",
        priceChange24h: 0,
        volume24h: "-",
        marketCap: "-",
        holders: 0,
        totalSupply: "-",
        priceHistory: [],
      }));
      setTokens(initialTokens);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const api = substrateSDK.getApi();
      
      // 1. Fetch Native Token Info (SEL)
      const nativeToken = KNOWN_TOKENS.find(t => t.type === "native");
      let selTokenData: Partial<Token> = {};

      if (nativeToken && api) {
        // Get Total Issuance
        const totalIssuance = await api.query.balances.totalIssuance();
        const formattedSupply = (Number(totalIssuance) / Math.pow(10, nativeToken.decimals!)).toLocaleString();

        // Get Market Data (Mocked for now as RPC doesn't provide price)
        // In a real app, this would come from an Oracle or Coingecko API
        selTokenData = {
          totalSupply: formattedSupply,
          circulatingSupply: formattedSupply, // Simplified
          price: "$0.0456", // Mock price
          priceChange24h: 5.23,
          marketCap: "$45,600,000", // Mock
          volume24h: "$1,250,000", // Mock
          holders: networkStats?.validators || 0, // Use validator count as proxy for now or fetch real count if possible
        };
      }

      // 2. Fetch Assets (Substrate)
      // This would query pallet-assets if available
      // const assets = await api.query.assets.asset.entries();
      
      // 3. Combine Data
      const updatedTokens = KNOWN_TOKENS.map(t => {
        if (t.type === "native") {
          return {
            ...t,
            rank: 1,
            priceHistory: [0.041, 0.042, 0.044, 0.043, 0.045, 0.046, 0.0456], // Mock history
            ...selTokenData,
          } as Token;
        }
        return {
          ...t,
          rank: 2,
          price: "-",
          priceChange24h: 0,
          volume24h: "-",
          marketCap: "-",
          holders: 0,
          totalSupply: "-",
          priceHistory: [],
        } as Token;
      });

      setTokens(updatedTokens);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tokens:", err);
      setError("Failed to fetch token data");
    } finally {
      setIsLoading(false);
    }
  }, [substrateSDK, isConnected, networkStats]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}
