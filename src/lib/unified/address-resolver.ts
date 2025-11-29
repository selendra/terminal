/**
 * Unified Address Resolver Service
 *
 * Provides mapping between Substrate (SS58) and EVM (0x) addresses
 * using Selendra's unified-accounts pallet.
 *
 * In Selendra, accounts are unified - each account has both a Substrate
 * address and an EVM address that are mathematically linked.
 */

import { isEvmAddress, isSubstrateAddress } from "@/lib/address";

/**
 * Unified address result containing both formats
 */
export interface UnifiedAddress {
  /** Substrate address (SS58 format) */
  substrate: string;
  /** EVM address (0x format) */
  evm: string;
  /** Whether this mapping is confirmed from chain or derived */
  isVerified: boolean;
  /** Source of the mapping */
  source: "chain" | "derived" | "cache";
}

/**
 * Cache for address mappings to reduce RPC calls
 */
const addressCache = new Map<string, UnifiedAddress>();

/**
 * Convert a Substrate public key to an EVM address
 * EVM addresses are derived from the last 20 bytes of the 32-byte public key
 */
export async function substrateToEvm(
  substrateAddress: string
): Promise<string | null> {
  try {
    const { decodeAddress } = await import("@polkadot/util-crypto");
    const { u8aToHex } = await import("@polkadot/util");

    // Decode the SS58 address to get the public key
    const publicKey = decodeAddress(substrateAddress);

    // EVM address is derived from the last 20 bytes of the public key
    // For AccountId32 to H160 conversion, we use the last 20 bytes
    const evmBytes = publicKey.slice(-20);
    const evmAddress = u8aToHex(evmBytes);

    return evmAddress;
  } catch (error) {
    console.error("Failed to convert Substrate address to EVM:", error);
    return null;
  }
}

/**
 * Convert an EVM address to a Substrate address
 * This requires querying the chain's unified-accounts pallet
 * or using the EVM account mapping
 */
export async function evmToSubstrate(
  evmAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api?: any
): Promise<string | null> {
  try {
    // If we have an API connection, query the unified-accounts pallet
    if (api) {
      // Try to get the mapped Substrate account from chain state
      const mappedAccount = await api.query.unifiedAccounts?.evmToSubstrate?.(
        evmAddress
      );
      if (mappedAccount && !mappedAccount.isEmpty) {
        const { encodeAddress } = await import("@polkadot/util-crypto");
        return encodeAddress(mappedAccount.toU8a(), 42); // 42 is Selendra's SS58 prefix
      }
    }

    // Fallback: Create a deterministic Substrate address from EVM address
    // This uses the EVM address as part of a 32-byte account ID
    const { hexToU8a, u8aConcat } = await import("@polkadot/util");
    const { encodeAddress, blake2AsU8a } = await import(
      "@polkadot/util-crypto"
    );

    // Prefix for EVM-derived accounts (as used by Frontier)
    const evmPrefix = new TextEncoder().encode("evm:");
    const evmBytes = hexToU8a(evmAddress);

    // Create a 32-byte account ID by hashing the prefix + EVM address
    const accountId = blake2AsU8a(u8aConcat(evmPrefix, evmBytes), 256);

    return encodeAddress(accountId, 42);
  } catch (error) {
    console.error("Failed to convert EVM address to Substrate:", error);
    return null;
  }
}

/**
 * Resolve an address to get both Substrate and EVM formats
 */
export async function resolveAddress(
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api?: any
): Promise<UnifiedAddress | null> {
  // Check cache first
  const cached = addressCache.get(address.toLowerCase());
  if (cached) {
    return { ...cached, source: "cache" };
  }

  let substrate: string | null = null;
  let evm: string | null = null;
  let isVerified = false;

  if (isEvmAddress(address)) {
    evm = address.toLowerCase();
    substrate = await evmToSubstrate(address, api);
    isVerified = !!api;
  } else if (isSubstrateAddress(address)) {
    substrate = address;
    evm = await substrateToEvm(address);
    isVerified = false; // Derived, not verified from chain
  } else {
    return null;
  }

  if (!substrate || !evm) {
    return null;
  }

  const result: UnifiedAddress = {
    substrate,
    evm,
    isVerified,
    source: api ? "chain" : "derived",
  };

  // Cache both directions
  addressCache.set(substrate.toLowerCase(), result);
  addressCache.set(evm.toLowerCase(), result);

  return result;
}

/**
 * Clear the address cache
 */
export function clearAddressCache(): void {
  addressCache.clear();
}

/**
 * Get the alternative address format
 */
export async function getAlternateAddress(
  address: string
): Promise<string | null> {
  if (isEvmAddress(address)) {
    return evmToSubstrate(address);
  } else if (isSubstrateAddress(address)) {
    return substrateToEvm(address);
  }
  return null;
}

/**
 * Check if two addresses represent the same account
 */
export async function isSameAccount(
  address1: string,
  address2: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api?: any
): Promise<boolean> {
  // Same format comparison
  if (isEvmAddress(address1) && isEvmAddress(address2)) {
    return address1.toLowerCase() === address2.toLowerCase();
  }

  if (isSubstrateAddress(address1) && isSubstrateAddress(address2)) {
    try {
      const { decodeAddress } = await import("@polkadot/util-crypto");
      const pk1 = decodeAddress(address1);
      const pk2 = decodeAddress(address2);
      return pk1.every((byte, index) => byte === pk2[index]);
    } catch {
      return address1 === address2;
    }
  }

  // Different format comparison - resolve both
  const resolved1 = await resolveAddress(address1, api);
  const resolved2 = await resolveAddress(address2, api);

  if (!resolved1 || !resolved2) {
    return false;
  }

  return (
    resolved1.evm.toLowerCase() === resolved2.evm.toLowerCase() ||
    resolved1.substrate === resolved2.substrate
  );
}
