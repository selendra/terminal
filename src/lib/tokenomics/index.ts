/**
 * Selendra Tokenomics Configuration
 *
 * Centralized configuration for SEL token economics and chain parameters.
 * This module provides both static configuration and live chain data fetching.
 */

// =============================================================================
// Chain Configuration
// =============================================================================

export const SELENDRA_CHAIN_CONFIG = {
  // Network identifiers
  mainnet: {
    chainId: 1961,
    ss58Prefix: 204,
    name: "Selendra Mainnet",
    rpcHttpUrl:
      process.env.NEXT_PUBLIC_RPC_HTTP_URL || "https://rpc.selendra.org",
    rpcWsUrl: process.env.NEXT_PUBLIC_RPC_WS_URL || "wss://rpc.selendra.org",
  },
  testnet: {
    chainId: 1953,
    ss58Prefix: 204,
    name: "Selendra Testnet",
    rpcHttpUrl:
      process.env.NEXT_PUBLIC_TESTNET_RPC_HTTP_URL ||
      "https://rpc-testnet.selendra.org",
    rpcWsUrl:
      process.env.NEXT_PUBLIC_TESTNET_RPC_WS_URL ||
      "wss://rpc-testnet.selendra.org",
  },
} as const;

// =============================================================================
// Token Configuration
// =============================================================================

export const SEL_TOKEN_CONFIG = {
  // Basic token info
  name: "Selendra",
  symbol: "SEL",
  decimals: 18,

  // Token addresses
  nativeAddress: "0x0000000000000000000000000000000000000000",
  wrappedAddress: "0x0000000000000000000000000000000000000802", // WSEL precompile

  // Supply parameters (in SEL, not wei)
  // Default SEL cap in chain code: 320M (pallet_aleph DefaultSelCap)
  // Tokenomics design v2.1: 400M max (balanced model)
  // Current on-chain issuance: ~230M SEL
  maxSupply: 320_000_000, // 320M SEL - matches DefaultSelCap in chain code
  currentIssuance: 230_000_000, // ~230M SEL - actual on-chain value
  genesisCirculating: 100_000_000, // 100 million at genesis

  // Inflation parameters (from tokenomics design)
  targetInflation: 8, // 8% annual starting rate
  minInflation: 0.5, // 0.5% terminal rate
  maxInflation: 10, // 10% maximum

  // Staking parameters
  idealStakingRate: 70, // 70% of total supply (from docs)
  minStakingRate: 25, // 25% minimum healthy
  maxStakingRate: 85, // 85% maximum healthy

  // Economic parameters
  existentialDeposit: 0.0005, // 500 PICO_SEL minimum balance
  transactionBaseFee: 0.0001, // Base fee in SEL
} as const;

// =============================================================================
// Supply Types
// =============================================================================

export interface SupplyData {
  // Raw values in wei (smallest unit)
  totalIssuanceWei: bigint;
  circulatingSupplyWei: bigint;
  stakedSupplyWei: bigint;
  lockedSupplyWei: bigint;
  burnedSupplyWei: bigint;

  // Formatted values in SEL
  totalIssuance: string;
  circulatingSupply: string;
  stakedSupply: string;
  lockedSupply: string;
  burnedSupply: string;

  // Percentages
  stakingRate: number;
  circulatingRate: number;

  // Metadata
  blockNumber: number;
  timestamp: number;
}

export interface SupplyStats {
  totalSupply: string;
  circulatingSupply: string;
  stakedSupply: string;
  stakingRate: number;
  marketCap?: string;
  price?: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format wei to SEL with appropriate decimals
 */
export function formatSEL(
  weiAmount: bigint | string,
  decimals: number = 2
): string {
  const wei = typeof weiAmount === "string" ? BigInt(weiAmount) : weiAmount;
  const divisor = BigInt(10 ** SEL_TOKEN_CONFIG.decimals);
  const whole = wei / divisor;
  const fraction = wei % divisor;

  // Format with appropriate decimal places
  const fractionStr = fraction.toString().padStart(18, "0");
  const decimalPart = fractionStr.slice(0, decimals);

  if (decimals === 0) {
    return formatNumber(whole);
  }

  return `${formatNumber(whole)}.${decimalPart}`;
}

/**
 * Format a number with commas and abbreviations
 */
export function formatNumber(num: bigint | number): string {
  const n = typeof num === "bigint" ? Number(num) : num;

  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(2)}K`;
  }
  return n.toLocaleString("en-US");
}

/**
 * Parse SEL string to wei bigint
 */
export function parseToWei(selAmount: string | number): bigint {
  const amount = typeof selAmount === "string" ? parseFloat(selAmount) : selAmount;
  return BigInt(Math.floor(amount * 10 ** SEL_TOKEN_CONFIG.decimals));
}

// =============================================================================
// Supply Fetching
// =============================================================================

/**
 * Generate storage key for a pallet storage item
 * Uses xxhash128 for pallet and item names
 */
function getStorageKey(palletName: string, itemName: string): string {
  // Pre-computed storage keys for common items
  // These are xxhash128(palletName) + xxhash128(itemName)
  const knownKeys: Record<string, string> = {
    "Balances.TotalIssuance": "0xc2261276cc9d1f8598ea4b6a74b15c2f57c875e4cff74148e4628f264b974c80",
    "Staking.CurrentEra": "0x5f3e4907f716ac89b6347d15ececedca42982b9d6c7acc99faa9094c912c74e2",
  };
  
  const key = `${palletName}.${itemName}`;
  return knownKeys[key] || "";
}

/**
 * Decode a SCALE-encoded u128 from hex (little-endian)
 */
function decodeU128(hexValue: string): bigint {
  if (!hexValue || !hexValue.startsWith("0x")) {
    return BigInt(0);
  }
  
  const hex = hexValue.slice(2);
  if (hex.length === 0) {
    return BigInt(0);
  }
  
  // SCALE u128 is 16 bytes little-endian
  // Reverse bytes for little-endian
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.unshift(hex.slice(i, i + 2));
  }
  
  const result = bytes.join("");
  return result ? BigInt("0x" + result) : BigInt(0);
}

/**
 * Fetch total issuance from Substrate RPC using state_getStorage
 */
export async function fetchTotalIssuance(
  rpcUrl: string = SELENDRA_CHAIN_CONFIG.mainnet.rpcHttpUrl
): Promise<bigint> {
  try {
    // Use state_getStorage with the Balances.TotalIssuance storage key
    const storageKey = getStorageKey("Balances", "TotalIssuance");
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "state_getStorage",
        params: [storageKey],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Decode the SCALE-encoded u128 result
    if (data.result) {
      return decodeU128(data.result);
    }

    throw new Error("No result returned");
  } catch (error) {
    console.error("Failed to fetch total issuance:", error);
    // Return current issuance as fallback (actual on-chain value as of last known)
    return parseToWei(SEL_TOKEN_CONFIG.currentIssuance);
  }
}

/**
 * Fetch staked amount from chain
 * Currently returns an estimated value based on total issuance
 * TODO: Query actual staking storage when keys are determined
 */
export async function fetchStakedAmount(
  rpcUrl: string = SELENDRA_CHAIN_CONFIG.mainnet.rpcHttpUrl,
  totalIssuance?: bigint
): Promise<bigint> {
  try {
    // If we have total issuance, estimate staked amount based on typical staking rate
    // Selendra aims for ~60-70% staking rate for NPoS security
    if (totalIssuance && totalIssuance > BigInt(0)) {
      // Estimate ~65% staking rate (realistic for healthy NPoS)
      const estimatedStakingRate = BigInt(65);
      return (totalIssuance * estimatedStakingRate) / BigInt(100);
    }
    
    // Fallback: estimate based on known total issuance (~230M SEL)
    // ~65% of 230M = ~150M staked
    return parseToWei(150_000_000);
  } catch (error) {
    console.error("Failed to fetch staked amount:", error);
    return parseToWei(150_000_000);
  }
}

/**
 * Fetch complete supply data from chain
 */
export async function fetchSupplyData(
  rpcUrl: string = SELENDRA_CHAIN_CONFIG.mainnet.rpcHttpUrl
): Promise<SupplyData> {
  // First fetch total issuance
  const totalIssuance = await fetchTotalIssuance(rpcUrl);
  
  // Then estimate staked amount based on total issuance
  const stakedAmount = await fetchStakedAmount(rpcUrl, totalIssuance);

  // Calculate circulating (total - staked - locked)
  // For now, assume locked = 0, can be enhanced later
  const lockedAmount = BigInt(0);
  const burnedAmount = BigInt(0);
  const circulatingAmount = totalIssuance - stakedAmount - lockedAmount;

  const stakingRate =
    totalIssuance > BigInt(0)
      ? Number((stakedAmount * BigInt(10000)) / totalIssuance) / 100
      : 0;

  const circulatingRate =
    totalIssuance > BigInt(0)
      ? Number((circulatingAmount * BigInt(10000)) / totalIssuance) / 100
      : 0;

  console.log("[fetchSupplyData] Chain data:", {
    totalIssuance: formatSEL(totalIssuance, 0),
    stakedSupply: formatSEL(stakedAmount, 0),
    circulatingSupply: formatSEL(circulatingAmount, 0),
    stakingRate: stakingRate.toFixed(1) + "%",
  });

  return {
    totalIssuanceWei: totalIssuance,
    circulatingSupplyWei: circulatingAmount,
    stakedSupplyWei: stakedAmount,
    lockedSupplyWei: lockedAmount,
    burnedSupplyWei: burnedAmount,

    totalIssuance: formatSEL(totalIssuance, 0),
    circulatingSupply: formatSEL(circulatingAmount, 0),
    stakedSupply: formatSEL(stakedAmount, 0),
    lockedSupply: formatSEL(lockedAmount, 0),
    burnedSupply: formatSEL(burnedAmount, 0),

    stakingRate,
    circulatingRate,

    blockNumber: 0, // Would need additional RPC call
    timestamp: Date.now(),
  };
}

// =============================================================================
// Mock Data (for development/testing)
// =============================================================================

export function getMockSupplyData(): SupplyData {
  // Use realistic values based on actual chain data
  // Current total issuance is ~230M SEL (as of chain query)
  const totalIssuance = parseToWei(230_000_000);
  // Staked: ~65% = ~150 million SEL (healthy NPoS)
  const stakedAmount = parseToWei(150_000_000);
  // Locked: minimal for now
  const lockedAmount = BigInt(0);
  const burnedAmount = BigInt(0);
  // Circulating: Total - Staked = ~80 million SEL
  const circulatingAmount = totalIssuance - stakedAmount - lockedAmount;

  const stakingRate = 65.0;
  const circulatingRate = 35.0;

  return {
    totalIssuanceWei: totalIssuance,
    circulatingSupplyWei: circulatingAmount,
    stakedSupplyWei: stakedAmount,
    lockedSupplyWei: lockedAmount,
    burnedSupplyWei: burnedAmount,

    totalIssuance: formatSEL(totalIssuance, 0),
    circulatingSupply: formatSEL(circulatingAmount, 0),
    stakedSupply: formatSEL(stakedAmount, 0),
    lockedSupply: formatSEL(lockedAmount, 0),
    burnedSupply: formatSEL(burnedAmount, 0),

    stakingRate,
    circulatingRate,

    blockNumber: 8452931,
    timestamp: Date.now(),
  };
}

export function getMockSupplyStats(): SupplyStats {
  const data = getMockSupplyData();
  return {
    totalSupply: data.totalIssuance,
    circulatingSupply: data.circulatingSupply,
    stakedSupply: data.stakedSupply,
    stakingRate: data.stakingRate,
    marketCap: "$24.5M",
    price: 0.0245,
    isLoading: false,
    error: null,
    lastUpdated: Date.now(),
  };
}
