/**
 * Address utilities for detecting and working with Substrate and EVM addresses
 */

import { isAddress as isEvmAddressEthers } from "ethers";

/**
 * Check if an address is a valid EVM address
 */
export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address) && isEvmAddressEthers(address);
}

/**
 * Check if an address is a valid Substrate address (SS58 format)
 * Selendra uses SS58 prefix 42
 */
export function isSubstrateAddress(address: string): boolean {
  // SS58 addresses typically start with a character based on the network prefix
  // For Selendra (prefix 42), addresses typically start with '5'
  // General SS58 regex pattern
  if (!/^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address)) {
    return false;
  }

  try {
    // Dynamic import to avoid SSR issues
    // We'll do basic validation here
    return address.length >= 47 && address.length <= 48;
  } catch {
    return false;
  }
}

/**
 * Validate Substrate address with full crypto verification
 */
export async function validateSubstrateAddress(
  address: string
): Promise<boolean> {
  try {
    const { decodeAddress, encodeAddress } = await import(
      "@polkadot/util-crypto"
    );
    decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect the type of address
 */
export function detectAddressType(
  address: string
): "substrate" | "evm" | "unknown" {
  if (!address || typeof address !== "string") {
    return "unknown";
  }

  const trimmed = address.trim();

  // Check EVM first (starts with 0x)
  if (trimmed.startsWith("0x") && isEvmAddress(trimmed)) {
    return "evm";
  }

  // Check Substrate (SS58 format)
  if (isSubstrateAddress(trimmed)) {
    return "substrate";
  }

  return "unknown";
}

/**
 * Convert Substrate address to different SS58 format
 */
export async function convertSS58Address(
  address: string,
  ss58Format: number = 42
): Promise<string | null> {
  try {
    const { decodeAddress, encodeAddress } = await import(
      "@polkadot/util-crypto"
    );
    const publicKey = decodeAddress(address);
    return encodeAddress(publicKey, ss58Format);
  } catch {
    return null;
  }
}

/**
 * Get the public key from a Substrate address
 */
export async function getPublicKeyFromAddress(
  address: string
): Promise<Uint8Array | null> {
  try {
    const { decodeAddress } = await import("@polkadot/util-crypto");
    return decodeAddress(address);
  } catch {
    return null;
  }
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Check if two addresses are the same (handles different formats)
 */
export async function isSameAddress(
  address1: string,
  address2: string
): Promise<boolean> {
  if (!address1 || !address2) return false;

  // If both are EVM addresses
  if (isEvmAddress(address1) && isEvmAddress(address2)) {
    return address1.toLowerCase() === address2.toLowerCase();
  }

  // If both are Substrate addresses
  if (isSubstrateAddress(address1) && isSubstrateAddress(address2)) {
    try {
      const pk1 = await getPublicKeyFromAddress(address1);
      const pk2 = await getPublicKeyFromAddress(address2);
      if (!pk1 || !pk2) return false;
      return pk1.every((byte, index) => byte === pk2[index]);
    } catch {
      return address1 === address2;
    }
  }

  return false;
}
