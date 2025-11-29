/**
 * Token Standard Mapper Service
 *
 * Provides unified interface for ERC-20/721/1155 (EVM) and
 * PSP-22/34/37 (ink!) token standards on Selendra.
 */

import { resolveAddress, type UnifiedAddress } from "./address-resolver";
import {
  type ContractStandard,
  type ContractVMType,
  mapErcToPsp,
  mapPspToErc,
} from "./contract-aggregator";

// ============================================
// TYPES
// ============================================

/**
 * Token type classification
 */
export type TokenType = "fungible" | "nft" | "multi";

/**
 * Unified token standards
 */
export type FungibleStandard = "erc20" | "psp22";
export type NftStandard = "erc721" | "psp34";
export type MultiStandard = "erc1155" | "psp37";
export type TokenStandard = FungibleStandard | NftStandard | MultiStandard;

/**
 * Raw ERC-20 token data
 */
export interface RawErc20Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner?: string;
  maxSupply?: string;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
  holders?: number;
}

/**
 * Raw PSP-22 token data
 */
export interface RawPsp22Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner?: string;
  metadata?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  holders?: number;
}

/**
 * Raw ERC-721 NFT collection data
 */
export interface RawErc721Collection {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  owner?: string;
  baseUri?: string;
  contractUri?: string;
  supportsMetadata?: boolean;
  supportsEnumerable?: boolean;
  royaltyInfo?: {
    receiver: string;
    percentage: number;
  };
}

/**
 * Raw PSP-34 NFT collection data
 */
export interface RawPsp34Collection {
  address: string;
  collectionId: string;
  name: string;
  symbol: string;
  totalSupply: string;
  owner?: string;
  baseUri?: string;
  attributes?: Record<string, string>;
}

/**
 * Raw ERC-1155 multi-token data
 */
export interface RawErc1155Token {
  address: string;
  name?: string;
  uri?: string;
  owner?: string;
  tokens: Array<{
    id: string;
    supply: string;
    uri?: string;
  }>;
}

/**
 * Raw PSP-37 multi-token data
 */
export interface RawPsp37Token {
  address: string;
  name?: string;
  owner?: string;
  tokens: Array<{
    id: string;
    supply: string;
    metadata?: Record<string, string>;
  }>;
}

/**
 * Unified fungible token representation
 */
export interface UnifiedFungibleToken {
  // Identity
  id: string;
  address: UnifiedAddress;
  vmType: ContractVMType;
  standard: FungibleStandard;

  // Token info
  name: string;
  symbol: string;
  decimals: number;

  // Supply
  totalSupply: string;
  totalSupplyFormatted: string;
  maxSupply?: string;

  // Features
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;

  // Stats
  holderCount?: number;
  transferCount?: number;
  price?: {
    usd: number;
    change24h: number;
  };

  // Logo/branding
  logoUrl?: string;
  website?: string;

  // Owner
  owner?: UnifiedAddress;

  // Cross-VM
  equivalentStandard: FungibleStandard;
  pairedToken?: string; // Address of equivalent token on other VM
}

/**
 * Unified NFT collection representation
 */
export interface UnifiedNftCollection {
  // Identity
  id: string;
  address: UnifiedAddress;
  vmType: ContractVMType;
  standard: NftStandard;

  // Collection info
  name: string;
  symbol: string;
  description?: string;

  // Supply
  totalSupply: string;
  maxSupply?: string;

  // Metadata
  baseUri?: string;
  contractUri?: string;
  supportsMetadata: boolean;
  supportsEnumerable: boolean;

  // Royalties
  royaltyInfo?: {
    receiver: UnifiedAddress;
    percentage: number;
  };

  // Stats
  holderCount?: number;
  floorPrice?: {
    sel: string;
    usd: number;
  };
  volumeTotal?: {
    sel: string;
    usd: number;
  };

  // Logo/branding
  bannerUrl?: string;
  logoUrl?: string;

  // Owner
  owner?: UnifiedAddress;

  // Cross-VM
  equivalentStandard: NftStandard;
}

/**
 * Unified NFT item representation
 */
export interface UnifiedNftItem {
  // Identity
  id: string;
  tokenId: string;
  collectionAddress: UnifiedAddress;
  vmType: ContractVMType;
  standard: NftStandard;

  // Ownership
  owner: UnifiedAddress;
  previousOwners?: UnifiedAddress[];

  // Metadata
  name?: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;

  // Stats
  lastSale?: {
    price: string;
    currency: string;
    timestamp: number;
    buyer: UnifiedAddress;
    seller: UnifiedAddress;
  };
}

/**
 * Unified multi-token representation
 */
export interface UnifiedMultiToken {
  // Identity
  id: string;
  address: UnifiedAddress;
  vmType: ContractVMType;
  standard: MultiStandard;

  // Collection info
  name?: string;
  description?: string;
  uri?: string;

  // Token types
  tokenTypes: Array<{
    id: string;
    supply: string;
    isFungible: boolean;
    name?: string;
    uri?: string;
    metadata?: Record<string, unknown>;
  }>;

  // Stats
  holderCount?: number;

  // Owner
  owner?: UnifiedAddress;

  // Cross-VM
  equivalentStandard: MultiStandard;
}

/**
 * Token balance representation
 */
export interface UnifiedTokenBalance {
  token: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken;
  balance: string;
  balanceFormatted: string;
  value?: {
    usd: number;
  };
}

// ============================================
// NORMALIZER FUNCTIONS
// ============================================

/**
 * Create a fallback UnifiedAddress for EVM
 */
function createEvmFallbackAddress(evmAddress: string): UnifiedAddress {
  return {
    substrate: "",
    evm: evmAddress,
    isVerified: false,
    source: "derived",
  };
}

/**
 * Create a fallback UnifiedAddress for Substrate
 */
function createSubstrateFallbackAddress(
  substrateAddress: string
): UnifiedAddress {
  return {
    substrate: substrateAddress,
    evm: "",
    isVerified: false,
    source: "derived",
  };
}

/**
 * Normalize ERC-20 token to unified format
 */
export async function normalizeErc20Token(
  token: RawErc20Token
): Promise<UnifiedFungibleToken> {
  const resolvedAddress = await resolveAddress(token.address);
  const resolvedOwner = token.owner
    ? await resolveAddress(token.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createEvmFallbackAddress(token.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  return {
    id: `erc20-${token.address}`,
    address,
    vmType: "evm",
    standard: "erc20",

    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,

    totalSupply: token.totalSupply,
    totalSupplyFormatted: formatTokenAmount(token.totalSupply, token.decimals),
    maxSupply: token.maxSupply,

    isMintable: token.mintable ?? false,
    isBurnable: token.burnable ?? false,
    isPausable: token.pausable ?? false,

    holderCount: token.holders,
    owner,

    equivalentStandard: "psp22",
  };
}

/**
 * Normalize PSP-22 token to unified format
 */
export async function normalizePsp22Token(
  token: RawPsp22Token
): Promise<UnifiedFungibleToken> {
  const resolvedAddress = await resolveAddress(token.address);
  const resolvedOwner = token.owner
    ? await resolveAddress(token.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createSubstrateFallbackAddress(token.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  return {
    id: `psp22-${token.address}`,
    address,
    vmType: "ink",
    standard: "psp22",

    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,

    totalSupply: token.totalSupply,
    totalSupplyFormatted: formatTokenAmount(token.totalSupply, token.decimals),

    isMintable: false, // PSP-22 extensions would need to be checked
    isBurnable: false,
    isPausable: false,

    holderCount: token.holders,
    owner,

    equivalentStandard: "erc20",
  };
}

/**
 * Normalize ERC-721 collection to unified format
 */
export async function normalizeErc721Collection(
  collection: RawErc721Collection
): Promise<UnifiedNftCollection> {
  const resolvedAddress = await resolveAddress(collection.address);
  const resolvedOwner = collection.owner
    ? await resolveAddress(collection.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createEvmFallbackAddress(collection.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  let royaltyInfo: UnifiedNftCollection["royaltyInfo"];
  if (collection.royaltyInfo) {
    const resolvedReceiver = await resolveAddress(
      collection.royaltyInfo.receiver
    );
    royaltyInfo = {
      receiver:
        resolvedReceiver ||
        createEvmFallbackAddress(collection.royaltyInfo.receiver),
      percentage: collection.royaltyInfo.percentage,
    };
  }

  return {
    id: `erc721-${collection.address}`,
    address,
    vmType: "evm",
    standard: "erc721",

    name: collection.name,
    symbol: collection.symbol,

    totalSupply: collection.totalSupply,

    baseUri: collection.baseUri,
    contractUri: collection.contractUri,
    supportsMetadata: collection.supportsMetadata ?? false,
    supportsEnumerable: collection.supportsEnumerable ?? false,

    royaltyInfo,
    owner,

    equivalentStandard: "psp34",
  };
}

/**
 * Normalize PSP-34 collection to unified format
 */
export async function normalizePsp34Collection(
  collection: RawPsp34Collection
): Promise<UnifiedNftCollection> {
  const resolvedAddress = await resolveAddress(collection.address);
  const resolvedOwner = collection.owner
    ? await resolveAddress(collection.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createSubstrateFallbackAddress(collection.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  return {
    id: `psp34-${collection.address}`,
    address,
    vmType: "ink",
    standard: "psp34",

    name: collection.name,
    symbol: collection.symbol,

    totalSupply: collection.totalSupply,

    baseUri: collection.baseUri,
    supportsMetadata: true, // PSP-34 has built-in metadata
    supportsEnumerable: true, // PSP-34 has enumerable extension

    owner,

    equivalentStandard: "erc721",
  };
}

/**
 * Normalize ERC-1155 multi-token to unified format
 */
export async function normalizeErc1155Token(
  token: RawErc1155Token
): Promise<UnifiedMultiToken> {
  const resolvedAddress = await resolveAddress(token.address);
  const resolvedOwner = token.owner
    ? await resolveAddress(token.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createEvmFallbackAddress(token.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  return {
    id: `erc1155-${token.address}`,
    address,
    vmType: "evm",
    standard: "erc1155",

    name: token.name,
    uri: token.uri,

    tokenTypes: token.tokens.map((t) => ({
      id: t.id,
      supply: t.supply,
      isFungible: BigInt(t.supply) > BigInt(1),
      uri: t.uri,
    })),

    owner,

    equivalentStandard: "psp37",
  };
}

/**
 * Normalize PSP-37 multi-token to unified format
 */
export async function normalizePsp37Token(
  token: RawPsp37Token
): Promise<UnifiedMultiToken> {
  const resolvedAddress = await resolveAddress(token.address);
  const resolvedOwner = token.owner
    ? await resolveAddress(token.owner)
    : undefined;

  const address: UnifiedAddress =
    resolvedAddress || createSubstrateFallbackAddress(token.address);
  const owner: UnifiedAddress | undefined = resolvedOwner || undefined;

  return {
    id: `psp37-${token.address}`,
    address,
    vmType: "ink",
    standard: "psp37",

    name: token.name,

    tokenTypes: token.tokens.map((t) => ({
      id: t.id,
      supply: t.supply,
      isFungible: BigInt(t.supply) > BigInt(1),
      metadata: t.metadata,
    })),

    owner,

    equivalentStandard: "erc1155",
  };
}

/**
 * Normalize any fungible token
 */
export async function normalizeFungibleToken(
  token: RawErc20Token | RawPsp22Token,
  vmType: ContractVMType
): Promise<UnifiedFungibleToken> {
  if (vmType === "evm") {
    return normalizeErc20Token(token as RawErc20Token);
  }
  return normalizePsp22Token(token as RawPsp22Token);
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

/**
 * Convert method signature from EVM to ink!
 */
export function convertMethodEvmToInk(
  methodName: string,
  standard: TokenStandard
): string | null {
  const conversions: Record<string, Record<string, string>> = {
    // ERC-20 to PSP-22
    erc20: {
      balanceOf: "balance_of",
      totalSupply: "total_supply",
      transfer: "transfer",
      transferFrom: "transfer_from",
      approve: "approve",
      allowance: "allowance",
    },
    // ERC-721 to PSP-34
    erc721: {
      balanceOf: "balance_of",
      ownerOf: "owner_of",
      totalSupply: "total_supply",
      transferFrom: "transfer",
      safeTransferFrom: "transfer",
      approve: "approve",
      getApproved: "get_approved",
      setApprovalForAll: "approve",
      isApprovedForAll: "allowance",
      tokenURI: "get_attribute",
    },
    // ERC-1155 to PSP-37
    erc1155: {
      balanceOf: "balance_of",
      balanceOfBatch: "balance_of",
      safeTransferFrom: "transfer",
      safeBatchTransferFrom: "transfer",
      setApprovalForAll: "approve",
      isApprovedForAll: "allowance",
      uri: "get_attribute",
    },
  };

  const mapping = conversions[standard];
  return mapping?.[methodName] || null;
}

/**
 * Convert method signature from ink! to EVM
 */
export function convertMethodInkToEvm(
  methodName: string,
  standard: TokenStandard
): string | null {
  const conversions: Record<string, Record<string, string>> = {
    // PSP-22 to ERC-20
    psp22: {
      balance_of: "balanceOf",
      total_supply: "totalSupply",
      transfer: "transfer",
      transfer_from: "transferFrom",
      approve: "approve",
      allowance: "allowance",
      increase_allowance: "increaseAllowance",
      decrease_allowance: "decreaseAllowance",
    },
    // PSP-34 to ERC-721
    psp34: {
      balance_of: "balanceOf",
      owner_of: "ownerOf",
      total_supply: "totalSupply",
      transfer: "transferFrom",
      approve: "approve",
      get_approved: "getApproved",
      get_attribute: "tokenURI",
      collection_id: "name",
    },
    // PSP-37 to ERC-1155
    psp37: {
      balance_of: "balanceOf",
      total_supply: "totalSupply",
      transfer: "safeTransferFrom",
      approve: "setApprovalForAll",
      allowance: "isApprovedForAll",
      get_attribute: "uri",
    },
  };

  const mapping = conversions[standard];
  return mapping?.[methodName] || null;
}

/**
 * Convert token data between standards
 */
export function convertTokenData<T extends TokenType>(
  data: Record<string, unknown>,
  fromStandard: TokenStandard,
  toStandard: TokenStandard
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Map common fields based on standard type
  if (isFungibleStandard(fromStandard) && isFungibleStandard(toStandard)) {
    result.name = data.name;
    result.symbol = data.symbol;
    result.decimals = data.decimals;
    result.totalSupply = data.totalSupply || data.total_supply;
  }

  if (isNftStandard(fromStandard) && isNftStandard(toStandard)) {
    result.name = data.name;
    result.symbol = data.symbol;
    result.totalSupply = data.totalSupply || data.total_supply;
    result.baseUri = data.baseUri || data.base_uri;
  }

  return result;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: string,
  decimals: number,
  maxDecimals: number = 4
): string {
  try {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === BigInt(0)) {
      return integerPart.toLocaleString();
    }

    const fractionalStr = fractionalPart
      .toString()
      .padStart(decimals, "0")
      .slice(0, maxDecimals)
      .replace(/0+$/, "");

    if (!fractionalStr) {
      return integerPart.toLocaleString();
    }

    return `${integerPart.toLocaleString()}.${fractionalStr}`;
  } catch {
    return amount;
  }
}

/**
 * Parse formatted token amount back to raw
 */
export function parseTokenAmount(formatted: string, decimals: number): string {
  try {
    // Remove commas and spaces
    const cleaned = formatted.replace(/[,\s]/g, "");
    const parts = cleaned.split(".");

    const integerPart = parts[0] || "0";
    const fractionalPart = (parts[1] || "")
      .padEnd(decimals, "0")
      .slice(0, decimals);

    return `${integerPart}${fractionalPart}`.replace(/^0+/, "") || "0";
  } catch {
    return "0";
  }
}

/**
 * Check if standard is fungible
 */
export function isFungibleStandard(
  standard: TokenStandard
): standard is FungibleStandard {
  return standard === "erc20" || standard === "psp22";
}

/**
 * Check if standard is NFT
 */
export function isNftStandard(
  standard: TokenStandard
): standard is NftStandard {
  return standard === "erc721" || standard === "psp34";
}

/**
 * Check if standard is multi-token
 */
export function isMultiStandard(
  standard: TokenStandard
): standard is MultiStandard {
  return standard === "erc1155" || standard === "psp37";
}

/**
 * Get token type from standard
 */
export function getTokenType(standard: TokenStandard): TokenType {
  if (isFungibleStandard(standard)) return "fungible";
  if (isNftStandard(standard)) return "nft";
  return "multi";
}

/**
 * Get equivalent standard on other VM
 */
export function getEquivalentStandard(standard: TokenStandard): TokenStandard {
  const mapping: Record<TokenStandard, TokenStandard> = {
    erc20: "psp22",
    psp22: "erc20",
    erc721: "psp34",
    psp34: "erc721",
    erc1155: "psp37",
    psp37: "erc1155",
  };
  return mapping[standard];
}

/**
 * Get standard info for display
 */
export function getTokenStandardInfo(standard: TokenStandard): {
  name: string;
  fullName: string;
  vmType: ContractVMType;
  tokenType: TokenType;
  description: string;
  equivalent: TokenStandard;
} {
  const info: Record<TokenStandard, ReturnType<typeof getTokenStandardInfo>> = {
    erc20: {
      name: "ERC-20",
      fullName: "ERC-20 Fungible Token",
      vmType: "evm",
      tokenType: "fungible",
      description: "Ethereum standard for fungible tokens",
      equivalent: "psp22",
    },
    psp22: {
      name: "PSP-22",
      fullName: "PSP-22 Fungible Token",
      vmType: "ink",
      tokenType: "fungible",
      description: "Polkadot standard for fungible tokens (ink!)",
      equivalent: "erc20",
    },
    erc721: {
      name: "ERC-721",
      fullName: "ERC-721 Non-Fungible Token",
      vmType: "evm",
      tokenType: "nft",
      description: "Ethereum standard for NFTs",
      equivalent: "psp34",
    },
    psp34: {
      name: "PSP-34",
      fullName: "PSP-34 Non-Fungible Token",
      vmType: "ink",
      tokenType: "nft",
      description: "Polkadot standard for NFTs (ink!)",
      equivalent: "erc721",
    },
    erc1155: {
      name: "ERC-1155",
      fullName: "ERC-1155 Multi Token",
      vmType: "evm",
      tokenType: "multi",
      description: "Ethereum standard for multi-tokens",
      equivalent: "psp37",
    },
    psp37: {
      name: "PSP-37",
      fullName: "PSP-37 Multi Token",
      vmType: "ink",
      tokenType: "multi",
      description: "Polkadot standard for multi-tokens (ink!)",
      equivalent: "erc1155",
    },
  };

  return info[standard];
}

/**
 * Compare tokens from different VMs
 */
export function compareTokens(
  tokenA: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken,
  tokenB: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken
): {
  areSimilar: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Check if same token type
  if (getTokenType(tokenA.standard) !== getTokenType(tokenB.standard)) {
    return {
      areSimilar: false,
      differences: ["Different token types"],
    };
  }

  // Compare fungible tokens
  if ("decimals" in tokenA && "decimals" in tokenB) {
    if (tokenA.name !== tokenB.name) {
      differences.push(`Name: ${tokenA.name} vs ${tokenB.name}`);
    }
    if (tokenA.symbol !== tokenB.symbol) {
      differences.push(`Symbol: ${tokenA.symbol} vs ${tokenB.symbol}`);
    }
    if (tokenA.decimals !== tokenB.decimals) {
      differences.push(`Decimals: ${tokenA.decimals} vs ${tokenB.decimals}`);
    }
    if (tokenA.totalSupply !== tokenB.totalSupply) {
      differences.push(
        `Total Supply: ${tokenA.totalSupply} vs ${tokenB.totalSupply}`
      );
    }
  }

  return {
    areSimilar: differences.length === 0,
    differences,
  };
}

// ============================================
// TOKEN MAPPER CLASS
// ============================================

/**
 * Token Mapper class for batch operations
 */
export class TokenMapper {
  private tokenCache: Map<
    string,
    UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken
  > = new Map();

  /**
   * Normalize and cache a token
   */
  async addToken(
    rawToken:
      | RawErc20Token
      | RawPsp22Token
      | RawErc721Collection
      | RawPsp34Collection
      | RawErc1155Token
      | RawPsp37Token,
    vmType: ContractVMType,
    tokenType: TokenType
  ): Promise<void> {
    let unified:
      | UnifiedFungibleToken
      | UnifiedNftCollection
      | UnifiedMultiToken;

    if (tokenType === "fungible") {
      if (vmType === "evm") {
        unified = await normalizeErc20Token(rawToken as RawErc20Token);
      } else {
        unified = await normalizePsp22Token(rawToken as RawPsp22Token);
      }
    } else if (tokenType === "nft") {
      if (vmType === "evm") {
        unified = await normalizeErc721Collection(
          rawToken as RawErc721Collection
        );
      } else {
        unified = await normalizePsp34Collection(
          rawToken as RawPsp34Collection
        );
      }
    } else {
      if (vmType === "evm") {
        unified = await normalizeErc1155Token(rawToken as RawErc1155Token);
      } else {
        unified = await normalizePsp37Token(rawToken as RawPsp37Token);
      }
    }

    this.tokenCache.set(unified.id, unified);
  }

  /**
   * Get token by ID
   */
  getToken(
    id: string
  ):
    | UnifiedFungibleToken
    | UnifiedNftCollection
    | UnifiedMultiToken
    | undefined {
    return this.tokenCache.get(id);
  }

  /**
   * Get all tokens of a type
   */
  getTokensByType(
    tokenType: TokenType
  ): (UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken)[] {
    return Array.from(this.tokenCache.values()).filter(
      (token) => getTokenType(token.standard) === tokenType
    );
  }

  /**
   * Get all tokens of a VM type
   */
  getTokensByVm(
    vmType: ContractVMType
  ): (UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken)[] {
    return Array.from(this.tokenCache.values()).filter(
      (token) => token.vmType === vmType
    );
  }

  /**
   * Find paired tokens (same token on both VMs)
   */
  findPairedTokens(): Array<{
    evm: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken;
    ink: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken;
  }> {
    const pairs: Array<{
      evm: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken;
      ink: UnifiedFungibleToken | UnifiedNftCollection | UnifiedMultiToken;
    }> = [];

    const evmTokens = this.getTokensByVm("evm");
    const inkTokens = this.getTokensByVm("ink");

    for (const evmToken of evmTokens) {
      // Look for matching ink! token
      const inkMatch = inkTokens.find((inkToken) => {
        // Match by name and symbol
        if ("name" in evmToken && "name" in inkToken) {
          const evmName = evmToken.name || "";
          const inkName = inkToken.name || "";
          return (
            evmName.toLowerCase() === inkName.toLowerCase() &&
            "symbol" in evmToken &&
            "symbol" in inkToken &&
            (evmToken.symbol || "").toLowerCase() ===
              (inkToken.symbol || "").toLowerCase()
          );
        }
        return false;
      });

      if (inkMatch) {
        pairs.push({ evm: evmToken, ink: inkMatch });
      }
    }

    return pairs;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.tokenCache.clear();
  }
}
