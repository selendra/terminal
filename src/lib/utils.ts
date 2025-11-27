import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number | string): string {
  return Number(num).toLocaleString();
}

/**
 * Format a large number with abbreviations (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return num.toString();
}

/**
 * Truncate a hash or address
 */
export function truncateHash(hash: string, startLen = 6, endLen = 4): string {
  if (hash.length <= startLen + endLen) return hash;
  return `${hash.slice(0, startLen)}...${hash.slice(-endLen)}`;
}

/**
 * Format balance from smallest unit to human readable
 */
export function formatBalance(
  balance: bigint | string,
  decimals = 18,
  precision = 4
): string {
  const balanceStr = balance.toString();
  const divisor = BigInt(10 ** decimals);
  const integerPart = BigInt(balanceStr) / divisor;
  const fractionalPart = BigInt(balanceStr) % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const truncatedFractional = fractionalStr.slice(0, precision);

  return `${integerPart}.${truncatedFractional}`;
}

/**
 * Format a timestamp to relative time (e.g., "5 minutes ago")
 */
export function formatDistanceToNow(timestamp: number | Date): string {
  const now = Date.now();
  const time = typeof timestamp === "number" ? timestamp : timestamp.getTime();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return seconds <= 1 ? "Just now" : `${seconds} secs ago`;
  }
  if (minutes < 60) {
    return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
  }
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (days < 7) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return new Date(time).toLocaleDateString();
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if an address is an EVM address
 */
export function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if an address is a Substrate address
 */
export function isSubstrateAddress(address: string): boolean {
  return /^5[a-zA-Z0-9]{47}$/.test(address);
}

/**
 * Check if a string is a valid transaction hash
 */
export function isTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Detect the type of search query
 */
export function detectSearchType(
  query: string
): "block" | "transaction" | "evm_address" | "substrate_address" | "unknown" {
  const trimmed = query.trim();

  if (/^\d+$/.test(trimmed)) {
    return "block";
  }
  if (isTxHash(trimmed)) {
    return "transaction";
  }
  if (isEvmAddress(trimmed)) {
    return "evm_address";
  }
  if (isSubstrateAddress(trimmed)) {
    return "substrate_address";
  }
  return "unknown";
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries - 1) {
        await sleep(baseDelay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
}

/**
 * Convert Wei to SEL
 */
export function weiToSel(wei: bigint | string): string {
  return formatBalance(wei, 18, 6);
}

/**
 * Convert Planck to SEL
 */
export function planckToSel(planck: bigint | string): string {
  return formatBalance(planck, 18, 6);
}

/**
 * Parse a value to BigInt safely
 */
export function toBigInt(value: string | number | bigint): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.floor(value));
  return BigInt(value);
}
