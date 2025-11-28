/**
 * EVM decoder utilities for Selendra blockchain
 * Decodes EVM transactions and blocks from the EVM layer
 */

import { formatEther } from "ethers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyType = any;

export interface DecodedEvmTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string | undefined;
  gasUsed: string | undefined;
  status: "success" | "failed" | "pending";
  logs: AnyType[];
  nonce?: number;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
}

export interface DecodedEvmBlock {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  gasLimit: string;
  gasUsed: string;
  miner: string;
  transactionCount: number;
  baseFeePerGas?: string;
  difficulty?: string;
  nonce?: string;
}

export interface DecodedEvmLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

/**
 * Decode an EVM transaction with its receipt
 * @param tx - The transaction object from ethers provider
 * @param provider - The ethers provider to fetch receipt
 * @returns Decoded transaction with status and gas info
 */
export async function decodeEvmTransaction(
  tx: AnyType,
  provider: AnyType
): Promise<DecodedEvmTransaction> {
  const receipt = await provider.getTransactionReceipt(tx.hash);

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: formatEther(tx.value),
    gasPrice: tx.gasPrice?.toString(),
    gasUsed: receipt?.gasUsed?.toString(),
    status: receipt ? (receipt.status === 1 ? "success" : "failed") : "pending",
    logs: receipt?.logs || [],
    nonce: tx.nonce,
    blockNumber: tx.blockNumber,
    blockHash: tx.blockHash,
    transactionIndex: tx.transactionIndex,
  };
}

/**
 * Decode an EVM block into a human-readable format
 * @param block - The block object from ethers provider
 * @returns Decoded block with all relevant fields
 */
export function decodeEvmBlock(block: AnyType): DecodedEvmBlock {
  return {
    number: block.number,
    hash: block.hash,
    parentHash: block.parentHash,
    timestamp: block.timestamp,
    gasLimit: block.gasLimit?.toString(),
    gasUsed: block.gasUsed?.toString(),
    miner: block.miner,
    transactionCount: block.transactions?.length || 0,
    baseFeePerGas: block.baseFeePerGas?.toString(),
    difficulty: block.difficulty?.toString(),
    nonce: block.nonce,
  };
}

/**
 * Decode EVM logs into a human-readable format
 * @param logs - Array of log objects from transaction receipt
 * @returns Array of decoded logs
 */
export function decodeEvmLogs(logs: AnyType[]): DecodedEvmLog[] {
  return logs.map((log) => ({
    address: log.address,
    topics: log.topics,
    data: log.data,
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    logIndex: log.logIndex ?? log.index,
  }));
}

/**
 * Decode multiple transactions from a block
 * @param block - Block with transactions
 * @param provider - The ethers provider to fetch receipts
 * @returns Array of decoded transactions
 */
export async function decodeBlockTransactions(
  block: AnyType,
  provider: AnyType
): Promise<DecodedEvmTransaction[]> {
  if (!block.transactions || block.transactions.length === 0) {
    return [];
  }

  // If transactions are just hashes, fetch full transactions
  const transactions = await Promise.all(
    block.transactions.map(async (tx: string | AnyType) => {
      if (typeof tx === "string") {
        return provider.getTransaction(tx);
      }
      return tx;
    })
  );

  return Promise.all(
    transactions
      .filter((tx: AnyType) => tx !== null)
      .map((tx: AnyType) => decodeEvmTransaction(tx, provider))
  );
}

/**
 * Format gas price to Gwei
 * @param gasPrice - Gas price in wei (as string or bigint)
 * @returns Gas price in Gwei as string
 */
export function formatGasPrice(gasPrice: string | bigint): string {
  const wei = BigInt(gasPrice);
  const gwei = wei / BigInt(1e9);
  const remainder = wei % BigInt(1e9);
  const decimal = Number(remainder) / 1e9;
  return (Number(gwei) + decimal).toFixed(2);
}

/**
 * Calculate transaction fee
 * @param gasUsed - Gas used by the transaction
 * @param gasPrice - Gas price in wei
 * @returns Transaction fee in SEL
 */
export function calculateTransactionFee(
  gasUsed: string | bigint,
  gasPrice: string | bigint
): string {
  const fee = BigInt(gasUsed) * BigInt(gasPrice);
  return formatEther(fee);
}
