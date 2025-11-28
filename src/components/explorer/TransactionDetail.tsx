"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Activity,
  Coins,
  Flame,
  FileCode,
  ExternalLink,
  RefreshCw,
  Hash,
  Layers,
  Code,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { formatUnits } from "ethers";

interface TransactionDetailProps {
  txHash: string;
}

interface TransactionInfo {
  hash: string;
  status: "success" | "failed" | "pending";
  block: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  valueUSD: string;
  fee: string;
  feeUSD: string;
  gasUsed: string;
  gasLimit: string;
  gasPrice: string;
  nonce: number;
  type: "transfer" | "contract_call" | "contract_deploy" | "token_transfer" | "extrinsic";
  vmType: "evm" | "substrate";
  confirmations: number;
  inputData?: string;
  decodedInput?: {
    method: string;
    params: { name: string; type: string; value: string }[];
  };
  tokenTransfers?: {
    token: string;
    tokenName: string;
    from: string;
    to: string;
    amount: string;
  }[];
  logs?: {
    index: number;
    address: string;
    topics: string[];
    data: string;
  }[];
  // Substrate-specific fields
  extrinsicIndex?: number;
  method?: string;
  section?: string;
  events?: { section: string; method: string; data: string[] }[];
}

// Selendra constants
const TOKEN_DECIMALS = 18;
const TOKEN_SYMBOL = "SEL";

// Format balance from raw to human-readable
function formatBalance(rawBalance: bigint | string, decimals: number = TOKEN_DECIMALS): string {
  try {
    const value = typeof rawBalance === 'string' ? BigInt(rawBalance.replace(/,/g, '')) : rawBalance;
    const formatted = formatUnits(value, decimals);
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(num);
  } catch {
    return "0";
  }
}

// Detect if hash is EVM (0x + 64 hex chars) or Substrate format
function detectHashType(hash: string): "evm" | "substrate" {
  if (hash.startsWith("0x") && hash.length === 66) {
    return "evm";
  }
  return "substrate";
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({ txHash }) => {
  const { substrateSDK, evmSDK, isConnected, useMockData, latestSubstrateBlock, latestEvmBlock } = useBlockchain();
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "state">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showInputData, setShowInputData] = useState(false);

  // Fetch EVM transaction
  const fetchEvmTransaction = useCallback(async (): Promise<TransactionInfo | null> => {
    if (!evmSDK) return null;
    
    const provider = evmSDK.getProvider();
    if (!provider) return null;

    try {
      const [tx, receipt] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash),
      ]);

      if (!tx) return null;

      const currentBlock = latestEvmBlock?.number || 0;
      const txBlockNumber = tx.blockNumber ? Number(tx.blockNumber) : 0;
      const confirmations = txBlockNumber ? currentBlock - txBlockNumber : 0;
      
      // Get block for timestamp
      let timestamp = new Date();
      if (tx.blockNumber) {
        try {
          const block = await provider.getBlock(tx.blockNumber);
          if (block?.timestamp) {
            timestamp = new Date(block.timestamp * 1000);
          }
        } catch {
          // Use current time as fallback
        }
      }

      const value = BigInt(tx.value.toString());
      const gasPrice = BigInt(tx.gasPrice?.toString() || "0");
      const gasUsed = receipt ? BigInt(receipt.gasUsed.toString()) : BigInt(0);
      const fee = gasPrice * gasUsed;

      // Determine transaction type
      let txType: TransactionInfo["type"] = "transfer";
      if (!tx.to) {
        txType = "contract_deploy";
      } else if (tx.data && tx.data !== "0x") {
        txType = "contract_call";
      }

      // Parse logs
      const logs = receipt?.logs?.map((log: { address: string; topics: readonly string[]; data: string }, index: number) => ({
        index,
        address: log.address,
        topics: log.topics as string[],
        data: log.data,
      })) || [];

      return {
        hash: txHash,
        status: receipt?.status === 1 ? "success" : receipt?.status === 0 ? "failed" : "pending",
        block: tx.blockNumber || 0,
        timestamp,
        from: tx.from,
        to: tx.to || "Contract Creation",
        value: `${formatBalance(value)} ${TOKEN_SYMBOL}`,
        valueUSD: "$--",
        fee: `${formatBalance(fee)} ${TOKEN_SYMBOL}`,
        feeUSD: "$--",
        gasUsed: gasUsed.toLocaleString(),
        gasLimit: tx.gasLimit.toLocaleString(),
        gasPrice: `${formatBalance(gasPrice, 9)} Gwei`,
        nonce: tx.nonce,
        type: txType,
        vmType: "evm",
        confirmations: Math.max(0, confirmations),
        inputData: tx.data !== "0x" ? tx.data : undefined,
        logs,
      };
    } catch (error) {
      console.error("Error fetching EVM transaction:", error);
      return null;
    }
  }, [evmSDK, txHash, latestEvmBlock]);

  // Fetch Substrate extrinsic
  const fetchSubstrateTransaction = useCallback(async (): Promise<TransactionInfo | null> => {
    if (!substrateSDK) return null;

    const api = substrateSDK.getApi();
    if (!api) return null;

    try {
      // For Substrate, we need to search for the extrinsic by hash
      // This is more complex as we need to find the block containing it
      // For now, we'll provide basic info if the hash is found
      
      // Try to query the transaction pool for pending transactions
      const pendingExts = await api.rpc.author.pendingExtrinsics();
      for (const ext of pendingExts) {
        if (ext.hash.toHex() === txHash) {
          return {
            hash: txHash,
            status: "pending",
            block: 0,
            timestamp: new Date(),
            from: ext.signer?.toString() || "Unknown",
            to: "Substrate Extrinsic",
            value: "-- SEL",
            valueUSD: "$--",
            fee: "-- SEL",
            feeUSD: "$--",
            gasUsed: "--",
            gasLimit: "--",
            gasPrice: "--",
            nonce: ext.nonce?.toNumber() || 0,
            type: "extrinsic",
            vmType: "substrate",
            confirmations: 0,
            section: ext.method.section,
            method: ext.method.method,
          };
        }
      }

      // If not in pending, we'd need an indexer to find finalized extrinsics
      // For MVP, return null and show "not found" error
      return null;
    } catch (error) {
      console.error("Error fetching Substrate transaction:", error);
      return null;
    }
  }, [substrateSDK, txHash]);

  // Main fetch function
  const fetchTransaction = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const hashType = detectHashType(txHash);

    try {
      let txInfo: TransactionInfo | null = null;

      if (hashType === "evm" && isConnected) {
        txInfo = await fetchEvmTransaction();
      }

      if (!txInfo && isConnected) {
        txInfo = await fetchSubstrateTransaction();
      }

      if (txInfo) {
        setTransaction(txInfo);
      } else {
        setFetchError("Transaction not found. It may be pending or not yet indexed.");
        setTransaction(null);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      setFetchError("Failed to fetch transaction details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [txHash, isConnected, fetchEvmTransaction, fetchSubstrateTransaction]);

  useEffect(() => {
    if (txHash) {
      fetchTransaction();
    }
  }, [txHash, fetchTransaction]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTimestamp = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} secs ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  const getStatusIcon = (status: TransactionInfo["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />;
    }
  };

  const getTypeLabel = (type: TransactionInfo["type"]) => {
    switch (type) {
      case "transfer":
        return { label: "Transfer", color: "bg-green-500/20 text-green-400" };
      case "contract_call":
        return { label: "Contract Call", color: "bg-blue-500/20 text-blue-400" };
      case "contract_deploy":
        return { label: "Contract Deploy", color: "bg-purple-500/20 text-purple-400" };
      case "token_transfer":
        return { label: "Token Transfer", color: "bg-yellow-500/20 text-yellow-400" };
      case "extrinsic":
        return { label: "Substrate Extrinsic", color: "bg-cyan-500/20 text-cyan-400" };
      default:
        return { label: "Transaction", color: "bg-gray-500/20 text-gray-400" };
    }
  };

  // Error state
  if (fetchError && !transaction) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">Transaction Not Found</h2>
          <p className="text-foreground-secondary mb-4">{fetchError}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={fetchTransaction}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <Link
              href="/transactions"
              className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors"
            >
              Back to Transactions
            </Link>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground-secondary mb-2">Transaction Hash</h3>
          <code className="text-sm font-mono text-foreground-secondary break-all">{txHash}</code>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-selendra-500 mx-auto mb-4" />
          <p className="text-foreground-secondary">Fetching transaction details...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-foreground-secondary">Transaction data unavailable</p>
      </div>
    );
  }

  const typeInfo = getTypeLabel(transaction.type);

  return (
    <div className="p-6 space-y-6">
      {/* Error Alert (for refresh errors) */}
      {fetchError && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-400 text-sm">{fetchError}</p>
          <button
            onClick={fetchTransaction}
            className="ml-auto px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-md text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            transaction.status === "success" ? "bg-green-500/20" :
            transaction.status === "failed" ? "bg-red-500/20" :
            "bg-yellow-500/20"
          }`}>
            {getStatusIcon(transaction.status)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Transaction Details</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                transaction.status === "success" ? "bg-green-500/20 text-green-400" :
                transaction.status === "failed" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground-secondary text-sm mt-1">
              <code className="font-mono">
                {transaction.hash.slice(0, 20)}...{transaction.hash.slice(-10)}
              </code>
              <button
                onClick={() => copyToClipboard(transaction.hash, "hash")}
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                {copied === "hash" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransaction}
            disabled={isLoading}
            className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* VM Type Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          transaction.vmType === "evm" ? "bg-orange-500/20 text-orange-400" : "bg-cyan-500/20 text-cyan-400"
        }`}>
          {transaction.vmType === "evm" ? "EVM Transaction" : "Substrate Extrinsic"}
        </span>
        {transaction.section && transaction.method && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
            {transaction.section}.{transaction.method}
          </span>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Block</p>
              <Link href={`/blocks/${transaction.block}`} className="text-xl font-bold text-selendra-400 hover:text-selendra-300">
                #{transaction.block.toLocaleString()}
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Value</p>
              <p className="text-xl font-bold">{transaction.value}</p>
              <p className="text-xs text-foreground-secondary">{transaction.valueUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Transaction Fee</p>
              <p className="text-xl font-bold">{transaction.fee}</p>
              <p className="text-xs text-foreground-secondary">{transaction.feeUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Confirmations</p>
              <p className="text-xl font-bold">{transaction.confirmations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Transfers */}
      {transaction.tokenTransfers && transaction.tokenTransfers.length > 0 && (
        <div className="bg-background-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground-secondary mb-3">Token Transfers</h3>
          <div className="space-y-2">
            {transaction.tokenTransfers.map((transfer, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-foreground-secondary">From</span>
                  <Link href={`/address/${transfer.from}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                    {transfer.from.slice(0, 8)}...{transfer.from.slice(-6)}
                  </Link>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground-secondary" />
                <div className="flex items-center gap-2">
                  <span className="text-foreground-secondary">To</span>
                  <Link href={`/address/${transfer.to}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                    {transfer.to.slice(0, 8)}...{transfer.to.slice(-6)}
                  </Link>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-medium">{transfer.amount}</span>
                  <Link href={`/tokens/${transfer.token}`} className="text-selendra-400 hover:text-selendra-300 text-sm">
                    ({transfer.tokenName})
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {(["overview", "logs", "state"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-selendra-400 border-selendra-400"
                  : "text-foreground-secondary border-transparent hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "logs" && transaction.logs && ` (${transaction.logs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {/* Transaction Hash */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Hash className="w-4 h-4" />
                Transaction Hash
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <code className="font-mono text-sm break-all">{transaction.hash}</code>
                <button
                  onClick={() => copyToClipboard(transaction.hash, "txhash")}
                  className="text-foreground-secondary hover:text-foreground transition-colors flex-shrink-0"
                >
                  {copied === "txhash" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Activity className="w-4 h-4" />
                Status
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <span className={
                  transaction.status === "success" ? "text-green-400" :
                  transaction.status === "failed" ? "text-red-400" :
                  "text-yellow-400"
                }>
                  {transaction.status === "success" ? "Success" :
                   transaction.status === "failed" ? "Failed" : "Pending"}
                </span>
              </div>
            </div>

            {/* Block */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Layers className="w-4 h-4" />
                Block
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/blocks/${transaction.block}`} className="text-selendra-400 hover:text-selendra-300">
                  {transaction.block.toLocaleString()}
                </Link>
                <span className="text-foreground-secondary">|</span>
                <span className="text-foreground-secondary">{transaction.confirmations} Block Confirmations</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Clock className="w-4 h-4" />
                Timestamp
              </div>
              <div className="md:col-span-3">
                {formatTimestamp(transaction.timestamp)} ({transaction.timestamp.toLocaleString()})
              </div>
            </div>

            {/* From */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                From
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/address/${transaction.from}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                  {transaction.from}
                </Link>
                <button
                  onClick={() => copyToClipboard(transaction.from, "from")}
                  className="text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {copied === "from" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* To */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                To
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/address/${transaction.to}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                  {transaction.to}
                </Link>
                <button
                  onClick={() => copyToClipboard(transaction.to, "to")}
                  className="text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {copied === "to" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Value */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Coins className="w-4 h-4" />
                Value
              </div>
              <div className="md:col-span-3">
                <span className="font-medium">{transaction.value}</span>
                <span className="text-foreground-secondary ml-2">({transaction.valueUSD})</span>
              </div>
            </div>

            {/* Transaction Fee */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                <Flame className="w-4 h-4" />
                Transaction Fee
              </div>
              <div className="md:col-span-3">
                <span>{transaction.fee}</span>
                <span className="text-foreground-secondary ml-2">({transaction.feeUSD})</span>
              </div>
            </div>

            {/* Gas Price */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                Gas Price
              </div>
              <div className="md:col-span-3">
                {transaction.gasPrice}
              </div>
            </div>

            {/* Gas Usage */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                Gas Limit & Usage
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <span>{transaction.gasUsed}</span>
                <span className="text-foreground-secondary">|</span>
                <span>{transaction.gasLimit}</span>
                <span className="text-foreground-secondary">
                  ({((parseInt(transaction.gasUsed.replace(/,/g, "")) / parseInt(transaction.gasLimit.replace(/,/g, ""))) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Nonce */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-foreground-secondary">
                Nonce
              </div>
              <div className="md:col-span-3">
                {transaction.nonce}
              </div>
            </div>

            {/* Input Data */}
            {transaction.inputData && (
              <div className="p-4">
                <button
                  onClick={() => setShowInputData(!showInputData)}
                  className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-3"
                >
                  <Code className="w-4 h-4" />
                  Input Data
                  {showInputData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showInputData && (
                  <div className="space-y-3">
                    {transaction.decodedInput && (
                      <div className="p-3 bg-background-secondary rounded-lg">
                        <p className="text-sm text-foreground-secondary mb-2">Decoded:</p>
                        <p className="font-mono text-sm text-selendra-400">{transaction.decodedInput.method}</p>
                        <div className="mt-2 space-y-1">
                          {transaction.decodedInput.params.map((param, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-foreground-secondary">{param.name}</span>
                              <span className="text-foreground-secondary">({param.type}):</span>
                              <code className="text-foreground font-mono break-all">{param.value}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-background-secondary rounded-lg">
                      <p className="text-sm text-foreground-secondary mb-2">Raw:</p>
                      <code className="text-xs font-mono text-foreground-secondary break-all block">
                        {transaction.inputData}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          {transaction.logs && transaction.logs.length > 0 ? (
            <div className="divide-y divide-border">
              {transaction.logs.map((log, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-1 bg-selendra-500/20 text-selendra-400 rounded text-xs font-medium">
                      Log #{log.index}
                    </span>
                    <Link
                      href={`/address/${log.address}`}
                      className="font-mono text-sm text-selendra-400 hover:text-selendra-300"
                    >
                      {log.address}
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-foreground-secondary mb-1">Topics:</p>
                      <div className="space-y-1">
                        {log.topics.map((topic, tidx) => (
                          <div key={tidx} className="flex items-center gap-2">
                            <span className="text-foreground-secondary text-xs">[{tidx}]</span>
                            <code className="text-xs font-mono text-foreground-secondary break-all">{topic}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-secondary mb-1">Data:</p>
                      <code className="text-xs font-mono text-foreground-secondary break-all">{log.data}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileCode className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
              <p className="text-foreground-secondary">No logs for this transaction</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "state" && (
        <div className="bg-background-card border border-border rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
          <p className="text-foreground-secondary">State changes will be displayed here</p>
          <p className="text-sm text-foreground-secondary mt-2">
            Shows account balance and storage changes from this transaction
          </p>
        </div>
      )}
    </div>
  );
};
