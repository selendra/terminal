/**
 * Type definitions for blockchain-related interfaces
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SelendraSDKType = any;

/**
 * Block information structure
 */
export interface BlockInfo {
  number: number;
  hash: string;
  timestamp?: number;
  parentHash?: string;
  extrinsicsRoot?: string;
  stateRoot?: string;
  gasLimit?: string;
  gasUsed?: string;
  miner?: string;
  transactions?: string[];
}

/**
 * Chain information structure
 */
export interface ChainInfo {
  name: string;
  version: string;
  chainId?: number;
  ss58Format?: number;
}

/**
 * Network statistics structure
 */
export interface NetworkStats {
  totalTransactions: number;
  averageBlockTime: number;
  tps: number;
  gasPrice?: string;
  validators?: number;
}

/**
 * Connection source tracking
 */
export type ConnectionSource = "local" | "public" | null;

export type { RpcEndpoints } from "./constants";
export type { NetworkType } from "./constants";
