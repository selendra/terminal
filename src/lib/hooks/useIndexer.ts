import { useQuery } from '@tanstack/react-query';
import { indexerClient } from '@/lib/indexer/client';
import { GET_TOKENS, GET_CONTRACTS, GET_TOKEN_BY_SYMBOL } from '@/lib/indexer/queries';
import { Token, TokenType } from '@/types/tokens';
import { Contract, ContractType, VMType } from '@/types/contracts';

// Types for GraphQL Responses
interface IndexerToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number;
  volume24h: string;
  price: string;
  verified: boolean;
  type: string;
  priceHistory?: number[];
}

interface IndexerContract {
  address: string;
  name: string;
  type: string;
  vmType: string;
  compiler: string;
  version: string;
  verified: boolean;
  txCount: number;
  createdAt: string;
}

interface GetTokensResponse {
  tokens: {
    nodes: IndexerToken[];
    totalCount: number;
  };
}

interface GetContractsResponse {
  contracts: {
    nodes: IndexerContract[];
    totalCount: number;
  };
}

export function useIndexerTokens(options: { limit?: number; offset?: number; enabled?: boolean } = {}) {
  const { limit = 10, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: ['indexer', 'tokens', limit, offset],
    queryFn: async () => {
      try {
        const data = await indexerClient.request<GetTokensResponse>(GET_TOKENS, { limit, offset });
        return {
          tokens: data.tokens.nodes.map(mapIndexerTokenToToken),
          totalCount: data.tokens.totalCount,
        };
      } catch (error) {
        console.error('Indexer fetch error:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 60000, // 1 minute
  });
}

export function useIndexerContracts(options: { limit?: number; offset?: number; enabled?: boolean } = {}) {
  const { limit = 10, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: ['indexer', 'contracts', limit, offset],
    queryFn: async () => {
      try {
        const data = await indexerClient.request<GetContractsResponse>(GET_CONTRACTS, { limit, offset });
        return {
          contracts: data.contracts.nodes.map(mapIndexerContractToContract),
          totalCount: data.contracts.totalCount,
        };
      } catch (error) {
        console.error('Indexer fetch error:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 60000,
  });
}

// Mappers
function mapIndexerTokenToToken(node: IndexerToken): Token {
  return {
    id: node.id,
    rank: 0, // Calculate or fetch if available
    name: node.name,
    symbol: node.symbol,
    logo: '', // Fetch or use placeholder
    address: node.id,
    price: node.price || '0',
    priceChange24h: 0, // Needs separate fetch or history
    priceChange7d: 0,
    volume24h: node.volume24h || '0',
    marketCap: '0', // Calculate
    holders: node.holders || 0,
    totalSupply: node.totalSupply,
    circulatingSupply: node.totalSupply,
    type: (node.type as TokenType) || 'erc20',
    standard: 'ERC-20',
    verified: node.verified,
    favorite: false,
    priceHistory: node.priceHistory || [],
    decimals: node.decimals,
  };
}

function mapIndexerContractToContract(node: IndexerContract): Contract {
  return {
    address: node.address,
    name: node.name,
    compiler: node.compiler,
    version: node.version,
    verified: node.verified,
    createdAt: new Date(node.createdAt),
    creator: '', // Add to query if needed
    txCount: node.txCount,
    balance: '0', // Balance usually changes too fast for indexer, better fetch live
    type: (node.type as ContractType) || 'other',
    vmType: (node.vmType as VMType) || 'evm',
    isProxy: false,
  };
}
