/**
 * Selendra Naming Service (SNS) Integration
 *
 * This module provides integration with sel-domains (.sel names)
 * as the primary identity system for Selendra Terminal.
 */

import { ethers } from "ethers";

// =============================================================================
// Types
// =============================================================================

export interface SNSProfile {
  // Core
  domain: string; // e.g., "alice.sel"
  owner: string; // EVM address of owner
  resolver: string; // Resolver contract address

  // Addresses
  evmAddress?: string; // Primary 0x address
  substrateAddress?: string; // SS58 address (stored as bytes)

  // Profile Data (from text records)
  avatar?: string;
  description?: string;
  email?: string;
  url?: string;
  twitter?: string;
  github?: string;
  telegram?: string;
  discord?: string;

  // Content
  contenthash?: string; // IPFS/Arweave hash

  // Verification (future extension)
  verification?: {
    level: VerificationLevel;
    verifier?: string;
    timestamp?: number;
  };

  // NFT Info
  tokenId?: string;
  expiry?: Date;
}

export type VerificationLevel =
  | "none" // No verification
  | "basic" // Email verified
  | "verified" // KYC verified
  | "trusted"; // Known trusted entity

export interface SNSResolveResult {
  domain: string;
  address: string | null;
  profile: SNSProfile | null;
  error?: string;
}

export interface SNSLookupResult {
  address: string;
  domain: string | null;
  profile: SNSProfile | null;
  error?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const SNS_REGISTRY_ABI = [
  "function owner(bytes32 node) view returns (address)",
  "function resolver(bytes32 node) view returns (address)",
  "function ttl(bytes32 node) view returns (uint64)",
  "function recordExists(bytes32 node) view returns (bool)",
];

export const SNS_RESOLVER_ABI = [
  "function addr(bytes32 node) view returns (address)",
  "function addr(bytes32 node, uint256 coinType) view returns (bytes)",
  "function text(bytes32 node, string key) view returns (string)",
  "function contenthash(bytes32 node) view returns (bytes)",
  "function name(bytes32 node) view returns (string)",
];

export const SNS_CONTROLLER_ABI = [
  "function available(string name) view returns (bool)",
  "function rentPrice(string name, uint256 duration) view returns (tuple(uint256 base, uint256 premium))",
  "function nameExpires(uint256 id) view returns (uint256)",
];

// Standard text record keys
export const TEXT_RECORD_KEYS = [
  "avatar",
  "description",
  "email",
  "url",
  "com.twitter",
  "com.github",
  "org.telegram",
  "com.discord",
] as const;

// Coin types for multi-chain addresses
export const COIN_TYPES = {
  SELENDRA: 1961,
  ETH: 60,
  BTC: 0,
} as const;

// Contract addresses (to be updated after deployment)
export const SNS_ADDRESSES = {
  mainnet: {
    registry: "", // To be filled after deployment
    resolver: "",
    controller: "",
    reverseRegistrar: "",
  },
  testnet: {
    registry: "", // To be filled after deployment
    resolver: "",
    controller: "",
    reverseRegistrar: "",
  },
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate the namehash of a .sel domain
 */
export function namehash(name: string): string {
  if (!name) {
    return ethers.ZeroHash;
  }

  const labels = name.toLowerCase().split(".");
  let node = ethers.ZeroHash;

  for (let i = labels.length - 1; i >= 0; i--) {
    const labelHash = ethers.keccak256(ethers.toUtf8Bytes(labels[i]));
    node = ethers.keccak256(ethers.concat([node, labelHash]));
  }

  return node;
}

/**
 * Calculate the labelhash of a single label
 */
export function labelhash(label: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(label.toLowerCase()));
}

/**
 * Normalize a .sel domain name
 */
export function normalizeDomain(name: string): string {
  let normalized = name.toLowerCase().trim();
  if (!normalized.endsWith(".sel")) {
    normalized += ".sel";
  }
  return normalized;
}

/**
 * Extract the label from a .sel domain
 */
export function extractLabel(domain: string): string {
  const normalized = normalizeDomain(domain);
  return normalized.replace(".sel", "");
}

/**
 * Validate a .sel domain name
 */
export function isValidDomain(name: string): {
  valid: boolean;
  error?: string;
} {
  const label = extractLabel(name);

  // Length check
  if (label.length < 3) {
    return { valid: false, error: "Name must be at least 3 characters" };
  }
  if (label.length > 63) {
    return { valid: false, error: "Name must be 63 characters or less" };
  }

  // Character check
  if (!/^[a-z0-9-]+$/.test(label)) {
    return {
      valid: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    };
  }

  // No leading/trailing hyphens
  if (label.startsWith("-") || label.endsWith("-")) {
    return { valid: false, error: "Name cannot start or end with a hyphen" };
  }

  return { valid: true };
}

/**
 * Calculate registration price based on name length
 */
export function calculatePrice(label: string, years: number = 1): bigint {
  const len = label.length;
  let basePrice: bigint;

  if (len === 3) {
    basePrice = ethers.parseEther("500"); // 500 SEL for 3-char
  } else if (len === 4) {
    basePrice = ethers.parseEther("100"); // 100 SEL for 4-char
  } else {
    basePrice = ethers.parseEther("5"); // 5 SEL for 5+ char
  }

  // Apply multi-year discount (10% off for 2+ years)
  const total = basePrice * BigInt(years);
  if (years >= 2) {
    return (total * BigInt(90)) / BigInt(100);
  }

  return total;
}

// =============================================================================
// SNS Client Class
// =============================================================================

export class SNSClient {
  private provider: ethers.Provider;
  private registry: ethers.Contract | null = null;
  private resolver: ethers.Contract | null = null;
  private controller: ethers.Contract | null = null;
  private addresses: typeof SNS_ADDRESSES.mainnet;
  private cache: Map<string, { data: SNSProfile; timestamp: number }> =
    new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(
    provider: ethers.Provider,
    addresses?: Partial<typeof SNS_ADDRESSES.mainnet>
  ) {
    this.provider = provider;
    this.addresses = {
      ...SNS_ADDRESSES.mainnet,
      ...addresses,
    };

    this.initContracts();
  }

  private initContracts() {
    if (this.addresses.registry) {
      this.registry = new ethers.Contract(
        this.addresses.registry,
        SNS_REGISTRY_ABI,
        this.provider
      );
    }
    if (this.addresses.resolver) {
      this.resolver = new ethers.Contract(
        this.addresses.resolver,
        SNS_RESOLVER_ABI,
        this.provider
      );
    }
    if (this.addresses.controller) {
      this.controller = new ethers.Contract(
        this.addresses.controller,
        SNS_CONTROLLER_ABI,
        this.provider
      );
    }
  }

  /**
   * Check if SNS contracts are configured
   */
  isConfigured(): boolean {
    return !!(this.addresses.registry && this.addresses.resolver);
  }

  /**
   * Resolve a .sel domain to an address
   */
  async resolveName(domain: string): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn("SNS contracts not configured");
      return null;
    }

    try {
      const normalized = normalizeDomain(domain);
      const node = namehash(normalized);

      // Get resolver for this name
      const resolverAddr = await this.registry!.resolver(node);
      if (resolverAddr === ethers.ZeroAddress) {
        return null;
      }

      // Get address from resolver
      const resolver = new ethers.Contract(
        resolverAddr,
        SNS_RESOLVER_ABI,
        this.provider
      );
      const addr = await resolver.addr(node);

      return addr === ethers.ZeroAddress ? null : addr;
    } catch (error) {
      console.error("Error resolving SNS name:", error);
      return null;
    }
  }

  /**
   * Reverse resolve an address to a .sel domain
   */
  async lookupAddress(address: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      // Reverse node: addr.reverse
      const reverseNode = namehash(
        `${address.slice(2).toLowerCase()}.addr.reverse`
      );

      const resolverAddr = await this.registry!.resolver(reverseNode);
      if (resolverAddr === ethers.ZeroAddress) {
        return null;
      }

      const resolver = new ethers.Contract(
        resolverAddr,
        SNS_RESOLVER_ABI,
        this.provider
      );
      const name = await resolver.name(reverseNode);

      if (!name) return null;

      // Verify forward resolution
      const forwardAddr = await this.resolveName(name);
      if (forwardAddr?.toLowerCase() !== address.toLowerCase()) {
        return null; // Mismatch, invalid reverse record
      }

      return name;
    } catch (error) {
      console.error("Error looking up address:", error);
      return null;
    }
  }

  /**
   * Get full profile for a .sel domain
   */
  async getProfile(domain: string): Promise<SNSProfile | null> {
    const normalized = normalizeDomain(domain);

    // Check cache
    const cached = this.cache.get(normalized);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    if (!this.isConfigured()) {
      // Return mock profile for demo when contracts not deployed
      return this.getMockProfile(normalized);
    }

    try {
      const node = namehash(normalized);

      // Get owner and resolver
      const [owner, resolverAddr] = await Promise.all([
        this.registry!.owner(node),
        this.registry!.resolver(node),
      ]);

      if (owner === ethers.ZeroAddress) {
        return null; // Domain not registered
      }

      const resolver = new ethers.Contract(
        resolverAddr,
        SNS_RESOLVER_ABI,
        this.provider
      );

      // Fetch all text records in parallel
      const [
        evmAddress,
        avatar,
        description,
        email,
        url,
        twitter,
        github,
        telegram,
        discord,
        contenthash,
      ] = await Promise.all([
        resolver.addr(node).catch(() => null),
        resolver.text(node, "avatar").catch(() => ""),
        resolver.text(node, "description").catch(() => ""),
        resolver.text(node, "email").catch(() => ""),
        resolver.text(node, "url").catch(() => ""),
        resolver.text(node, "com.twitter").catch(() => ""),
        resolver.text(node, "com.github").catch(() => ""),
        resolver.text(node, "org.telegram").catch(() => ""),
        resolver.text(node, "com.discord").catch(() => ""),
        resolver.contenthash(node).catch(() => null),
      ]);

      const profile: SNSProfile = {
        domain: normalized,
        owner,
        resolver: resolverAddr,
        evmAddress:
          evmAddress && evmAddress !== ethers.ZeroAddress
            ? evmAddress
            : undefined,
        avatar: avatar || undefined,
        description: description || undefined,
        email: email || undefined,
        url: url || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
        telegram: telegram || undefined,
        discord: discord || undefined,
        contenthash: contenthash ? ethers.hexlify(contenthash) : undefined,
      };

      // Cache the result
      this.cache.set(normalized, { data: profile, timestamp: Date.now() });

      return profile;
    } catch (error) {
      console.error("Error getting SNS profile:", error);
      return null;
    }
  }

  /**
   * Check if a domain is available for registration
   */
  async isAvailable(domain: string): Promise<boolean> {
    if (!this.controller) {
      return true; // Assume available if controller not configured
    }

    try {
      const label = extractLabel(domain);
      return await this.controller.available(label);
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
    }
  }

  /**
   * Get registration price
   */
  async getPrice(
    domain: string,
    years: number = 1
  ): Promise<{
    base: bigint;
    premium: bigint;
    total: bigint;
  }> {
    const label = extractLabel(domain);

    if (!this.controller) {
      // Calculate locally if controller not available
      const total = calculatePrice(label, years);
      return { base: total, premium: BigInt(0), total };
    }

    try {
      const duration = years * 365 * 24 * 60 * 60; // seconds
      const price = await this.controller.rentPrice(label, duration);
      return {
        base: price.base,
        premium: price.premium,
        total: price.base + price.premium,
      };
    } catch (error) {
      const total = calculatePrice(label, years);
      return { base: total, premium: BigInt(0), total };
    }
  }

  /**
   * Get mock profile for demonstration
   */
  private getMockProfile(domain: string): SNSProfile {
    const label = extractLabel(domain);

    // Generate deterministic mock data based on domain
    const hash = ethers.keccak256(ethers.toUtf8Bytes(domain));
    const mockAddress = `0x${hash.slice(2, 42)}`;

    return {
      domain,
      owner: mockAddress,
      resolver: ethers.ZeroAddress,
      evmAddress: mockAddress,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${label}`,
      description: `This is the profile for ${domain}`,
      twitter: label,
      github: label,
      verification: {
        level: "none",
      },
    };
  }

  /**
   * Clear the profile cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let snsClientInstance: SNSClient | null = null;

/**
 * Get or create SNS client instance
 */
export function getSNSClient(provider?: ethers.Provider): SNSClient | null {
  if (!snsClientInstance && provider) {
    snsClientInstance = new SNSClient(provider);
  }
  return snsClientInstance;
}

/**
 * Initialize SNS client with custom addresses
 */
export function initSNSClient(
  provider: ethers.Provider,
  addresses?: Partial<typeof SNS_ADDRESSES.mainnet>
): SNSClient {
  snsClientInstance = new SNSClient(provider, addresses);
  return snsClientInstance;
}

export default SNSClient;
