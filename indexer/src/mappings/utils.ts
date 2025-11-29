/**
 * Utility functions for the indexer
 *
 * Includes address conversion, account management, and helper functions.
 * Note: Simplified to avoid @polkadot/util-crypto which requires TextEncoder polyfill
 */

import { Account, Token, TokenStandard } from "../types";

/** Selendra SS58 prefix */
export const SELENDRA_SS58_PREFIX = 42;

/**
 * Normalize an address for use as ID
 * For EVM addresses: lowercase hex
 * For SS58 addresses: keep as-is (they're already canonical)
 */
export function normalizeAddress(address: string): string {
  if (isEvmAddress(address)) {
    return address.toLowerCase();
  }
  return address;
}

/**
 * Convert SS58 address to EVM-compatible H160 address
 * Note: This is a simplified version that doesn't do actual cryptographic conversion
 * For proper conversion, the chain's unified accounts pallet should be used
 */
export function ss58ToHex(ss58Address: string): string {
  // In production, this would query the chain's unified accounts mapping
  // For now, return empty to indicate no EVM mapping available
  return "";
}

/**
 * Convert EVM H160 address to a normalized form
 * This creates a pseudo-ID for accounts identified by EVM address
 */
export function hexToSs58(
  evmAddress: string,
  _prefix: number = SELENDRA_SS58_PREFIX
): string {
  // Return the EVM address as the ID when we don't have SS58 mapping
  // In production, this would query the chain's unified accounts mapping
  return evmAddress.toLowerCase();
}

/**
 * Check if address is EVM format (0x prefixed, 40 hex chars)
 */
export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if address is SS58 format
 * Simplified check - just verify it's not EVM format and has alphanumeric chars
 */
export function isSs58Address(address: string): boolean {
  if (isEvmAddress(address)) return false;
  // Basic SS58 pattern: starts with alphanumeric, reasonable length
  return /^[1-9A-HJ-NP-Za-km-z]{40,50}$/.test(address);
}

/**
 * Get or create an account by SS58 address
 */
export async function getOrCreateAccount(
  ss58Address: string,
  blockNumber: number,
  timestamp: Date
): Promise<Account> {
  let account = await Account.get(ss58Address);

  if (!account) {
    // Derive EVM address from SS58
    const evmAddress = ss58ToHex(ss58Address);

    account = Account.create({
      id: ss58Address,
      substrateAddress: ss58Address,
      evmAddress: evmAddress || undefined,
      isUnified: false,
      freeBalance: BigInt(0),
      reservedBalance: BigInt(0),
      substrateNonce: 0,
      evmNonce: 0,
      identityVerified: false,
      firstSeenBlock: blockNumber,
      firstSeenAt: timestamp,
      lastActiveBlock: blockNumber,
      lastActiveAt: timestamp,
      transactionCount: 0,
    });

    await account.save();

    // Update daily stats
    const dateStr = timestamp.toISOString().split("T")[0];
    const { DailyStats } = await import("../types");
    let stats = await DailyStats.get(dateStr);
    if (stats) {
      stats.newAccounts += 1;
      await stats.save();
    }
  }

  return account;
}

/**
 * Get or create an account by EVM address
 */
export async function getOrCreateAccountByEvmAddress(
  evmAddress: string,
  blockNumber: number,
  timestamp: Date
): Promise<Account> {
  const cleanEvmAddress = evmAddress.toLowerCase();

  // First, try to find existing account with this EVM address
  // Note: In SubQuery, we'd need a secondary index for efficient lookup
  // For now, derive the SS58 and check
  const derivedSs58 = hexToSs58(cleanEvmAddress);

  let account = await Account.get(derivedSs58);

  if (!account) {
    account = Account.create({
      id: derivedSs58,
      substrateAddress: derivedSs58,
      evmAddress: cleanEvmAddress,
      isUnified: false,
      freeBalance: BigInt(0),
      reservedBalance: BigInt(0),
      substrateNonce: 0,
      evmNonce: 0,
      identityVerified: false,
      firstSeenBlock: blockNumber,
      firstSeenAt: timestamp,
      lastActiveBlock: blockNumber,
      lastActiveAt: timestamp,
      transactionCount: 0,
    });

    await account.save();

    // Update daily stats
    const dateStr = timestamp.toISOString().split("T")[0];
    const { DailyStats } = await import("../types");
    let stats = await DailyStats.get(dateStr);
    if (stats) {
      stats.newAccounts += 1;
      await stats.save();
    }
  }

  return account;
}

/**
 * Get or create a token record
 */
export async function getOrCreateToken(
  address: string,
  standard: TokenStandard,
  blockNumber: number,
  timestamp: Date
): Promise<Token> {
  const cleanAddress = address.toLowerCase();
  let token = await Token.get(cleanAddress);

  if (!token) {
    token = Token.create({
      id: cleanAddress,
      standard,
      holderCount: 0,
      transferCount: 0,
      createdAt: timestamp,
    });

    // Try to fetch token metadata (would need contract call in production)
    // For now, leave name/symbol/decimals empty to be filled later

    await token.save();
  }

  return token;
}

/**
 * Format BigInt to human-readable string with decimals
 */
export function formatBalance(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  const remainderStr = remainder.toString().padStart(decimals, "0").slice(0, 4);
  return `${whole}.${remainderStr}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0;
  return Number((part * BigInt(10000)) / total) / 100;
}
