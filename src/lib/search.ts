/**
 * Universal search service for Selendra Terminal
 */

import { detectAddressType } from "./address";

export type SearchResultType =
  | "block"
  | "transaction"
  | "evm-transaction"
  | "substrate-account"
  | "evm-account"
  | "token"
  | "contract"
  | "not-found";

export interface SearchResult {
  type: SearchResultType;
  query: string;
  // Block search
  blockNumber?: number;
  blockHash?: string;
  // Transaction search
  txHash?: string;
  // Account search
  address?: string;
  addressType?: "substrate" | "evm";
  // Token/Contract search
  contractAddress?: string;
  // Navigation
  redirectUrl?: string;
}

/**
 * Check if a string is a valid block number
 */
function isBlockNumber(query: string): boolean {
  return /^\d+$/.test(query) && parseInt(query, 10) >= 0;
}

/**
 * Check if a string is a valid transaction hash (0x + 64 hex chars)
 */
function isTransactionHash(query: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(query);
}

/**
 * Check if a string is a valid block hash (0x + 64 hex chars)
 */
function isBlockHash(query: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(query);
}

/**
 * Detect the type of search query and return appropriate result
 */
export function detectSearchType(query: string): SearchResult {
  const trimmed = query.trim();

  if (!trimmed) {
    return { type: "not-found", query: trimmed };
  }

  // Check if block number
  if (isBlockNumber(trimmed)) {
    const blockNumber = parseInt(trimmed, 10);
    return {
      type: "block",
      query: trimmed,
      blockNumber,
      redirectUrl: `/blocks/${blockNumber}`,
    };
  }

  // Check if transaction or block hash (both are 66 chars with 0x prefix)
  if (isTransactionHash(trimmed) || isBlockHash(trimmed)) {
    // We'll treat it as a transaction hash first, then verify on the server
    return {
      type: "transaction",
      query: trimmed,
      txHash: trimmed,
      redirectUrl: `/tx/${trimmed}`,
    };
  }

  // Check if address
  const addressType = detectAddressType(trimmed);
  if (addressType === "evm") {
    return {
      type: "evm-account",
      query: trimmed,
      address: trimmed,
      addressType: "evm",
      redirectUrl: `/address/${trimmed}`,
    };
  }

  if (addressType === "substrate") {
    return {
      type: "substrate-account",
      query: trimmed,
      address: trimmed,
      addressType: "substrate",
      redirectUrl: `/address/${trimmed}`,
    };
  }

  return { type: "not-found", query: trimmed };
}

/**
 * Interface for SDK instances used in search
 */
interface SDKInstances {
  substrateSDK?: {
    getApi: () => {
      rpc: {
        chain: {
          getBlock: (hash: string) => Promise<unknown>;
          getBlockHash: (number: number) => Promise<unknown>;
        };
      };
      query: {
        system: {
          account: (address: string) => Promise<unknown>;
        };
      };
    } | null;
  } | null;
  evmSDK?: {
    getEvmProvider: () => {
      getTransaction: (hash: string) => Promise<unknown>;
      getBlock: (numberOrHash: number | string) => Promise<unknown>;
      getBalance: (address: string) => Promise<bigint>;
    } | null;
  } | null;
}

/**
 * Perform a universal search across the blockchain
 */
export async function universalSearch(
  query: string,
  sdks: SDKInstances
): Promise<SearchResult> {
  const basicResult = detectSearchType(query);

  // If it's a clear type, we can return immediately
  if (
    basicResult.type === "block" ||
    basicResult.type === "substrate-account" ||
    basicResult.type === "evm-account"
  ) {
    return basicResult;
  }

  // For transaction hashes, we need to determine if it's EVM or Substrate
  if (basicResult.type === "transaction" && basicResult.txHash) {
    const txHash = basicResult.txHash;

    // Try EVM first
    if (sdks.evmSDK) {
      try {
        const provider = sdks.evmSDK.getEvmProvider();
        if (provider) {
          const tx = await provider.getTransaction(txHash);
          if (tx) {
            return {
              ...basicResult,
              type: "evm-transaction",
              redirectUrl: `/tx/${txHash}`,
            };
          }
        }
      } catch {
        // Not an EVM transaction
      }
    }

    // Try as block hash
    if (sdks.substrateSDK) {
      try {
        const api = sdks.substrateSDK.getApi();
        if (api) {
          const block = await api.rpc.chain.getBlock(txHash);
          if (block) {
            return {
              type: "block",
              query,
              blockHash: txHash,
              redirectUrl: `/blocks/${txHash}`,
            };
          }
        }
      } catch {
        // Not a block hash
      }
    }

    // Assume it's a Substrate extrinsic hash
    return {
      ...basicResult,
      type: "transaction",
      redirectUrl: `/tx/${txHash}`,
    };
  }

  return basicResult;
}

/**
 * Search history management
 */
const SEARCH_HISTORY_KEY = "selendra_search_history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  type: SearchResultType;
  timestamp: number;
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

/**
 * Add a search to history
 */
export function addToSearchHistory(
  query: string,
  type: SearchResultType
): void {
  if (typeof window === "undefined") return;
  if (type === "not-found") return;

  try {
    const history = getSearchHistory();

    // Remove duplicate if exists
    const filtered = history.filter((item) => item.query !== query);

    // Add new item at the beginning
    const newHistory: SearchHistoryItem[] = [
      { query, type, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch {
    // localStorage not available
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // localStorage not available
  }
}

/**
 * Get icon for search result type
 */
export function getSearchResultIcon(type: SearchResultType): string {
  switch (type) {
    case "block":
      return "📦";
    case "transaction":
    case "evm-transaction":
      return "📄";
    case "substrate-account":
      return "👤";
    case "evm-account":
      return "💎";
    case "token":
      return "🪙";
    case "contract":
      return "📜";
    default:
      return "❓";
  }
}

/**
 * Get label for search result type
 */
export function getSearchResultLabel(type: SearchResultType): string {
  switch (type) {
    case "block":
      return "Block";
    case "transaction":
      return "Transaction";
    case "evm-transaction":
      return "EVM Transaction";
    case "substrate-account":
      return "Substrate Account";
    case "evm-account":
      return "EVM Account";
    case "token":
      return "Token";
    case "contract":
      return "Contract";
    default:
      return "Not Found";
  }
}
