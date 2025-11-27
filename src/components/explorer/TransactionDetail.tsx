"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";

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
  type: "transfer" | "contract_call" | "contract_deploy" | "token_transfer";
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
}

const mockTransaction: TransactionInfo = {
  hash: "0x8a5d3f2b1e9c4a7d6b8e5f2a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
  status: "success",
  block: 1234567,
  timestamp: new Date(Date.now() - 300000),
  from: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  to: "0x55d398326f99059ff775485246999027b3197955",
  value: "100.00 SEL",
  valueUSD: "$4.56",
  fee: "0.0025 SEL",
  feeUSD: "$0.11",
  gasUsed: "21,000",
  gasLimit: "50,000",
  gasPrice: "0.000000025 SEL",
  nonce: 142,
  type: "token_transfer",
  vmType: "evm",
  confirmations: 156,
  inputData: "0xa9059cbb0000000000000000000000001234567890abcdef1234567890abcdef12345678000000000000000000000000000000000000000000000000000000003b9aca00",
  decodedInput: {
    method: "transfer(address,uint256)",
    params: [
      { name: "recipient", type: "address", value: "0x1234567890abcdef1234567890abcdef12345678" },
      { name: "amount", type: "uint256", value: "1000000000" },
    ],
  },
  tokenTransfers: [
    {
      token: "0x55d398326f99059ff775485246999027b3197955",
      tokenName: "USDT",
      from: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      to: "0x1234567890abcdef1234567890abcdef12345678",
      amount: "1,000.00 USDT",
    },
  ],
  logs: [
    {
      index: 0,
      address: "0x55d398326f99059ff775485246999027b3197955",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
        "0x0000000000000000000000001234567890abcdef1234567890abcdef12345678",
      ],
      data: "0x000000000000000000000000000000000000000000000000000000003b9aca00",
    },
  ],
};

export const TransactionDetail: React.FC<TransactionDetailProps> = ({ txHash }) => {
  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "state">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInputData, setShowInputData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTransaction({ ...mockTransaction, hash: txHash });
      setIsLoading(false);
    };
    fetchData();
  }, [txHash]);

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
    }
  };

  if (isLoading || !transaction) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-selendra-500" />
      </div>
    );
  }

  const typeInfo = getTypeLabel(transaction.type);

  return (
    <div className="p-6 space-y-6">
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
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <code className="font-mono">
                {transaction.hash.slice(0, 20)}...{transaction.hash.slice(-10)}
              </code>
              <button
                onClick={() => copyToClipboard(transaction.hash, "hash")}
                className="text-gray-400 hover:text-white transition-colors"
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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Block</p>
              <Link href={`/blocks/${transaction.block}`} className="text-xl font-bold text-selendra-400 hover:text-selendra-300">
                #{transaction.block.toLocaleString()}
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Value</p>
              <p className="text-xl font-bold">{transaction.value}</p>
              <p className="text-xs text-gray-500">{transaction.valueUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Transaction Fee</p>
              <p className="text-xl font-bold">{transaction.fee}</p>
              <p className="text-xs text-gray-500">{transaction.feeUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Confirmations</p>
              <p className="text-xl font-bold">{transaction.confirmations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Transfers */}
      {transaction.tokenTransfers && transaction.tokenTransfers.length > 0 && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Token Transfers</h3>
          <div className="space-y-2">
            {transaction.tokenTransfers.map((transfer, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">From</span>
                  <Link href={`/address/${transfer.from}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                    {transfer.from.slice(0, 8)}...{transfer.from.slice(-6)}
                  </Link>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">To</span>
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
      <div className="border-b border-gray-800">
        <div className="flex gap-4">
          {(["overview", "logs", "state"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-selendra-400 border-selendra-400"
                  : "text-gray-400 border-transparent hover:text-white"
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
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-800">
            {/* Transaction Hash */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Hash className="w-4 h-4" />
                Transaction Hash
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <code className="font-mono text-sm break-all">{transaction.hash}</code>
                <button
                  onClick={() => copyToClipboard(transaction.hash, "txhash")}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
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
              <div className="flex items-center gap-2 text-gray-400">
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
              <div className="flex items-center gap-2 text-gray-400">
                <Layers className="w-4 h-4" />
                Block
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/blocks/${transaction.block}`} className="text-selendra-400 hover:text-selendra-300">
                  {transaction.block.toLocaleString()}
                </Link>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400">{transaction.confirmations} Block Confirmations</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                Timestamp
              </div>
              <div className="md:col-span-3">
                {formatTimestamp(transaction.timestamp)} ({transaction.timestamp.toLocaleString()})
              </div>
            </div>

            {/* From */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                From
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/address/${transaction.from}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                  {transaction.from}
                </Link>
                <button
                  onClick={() => copyToClipboard(transaction.from, "from")}
                  className="text-gray-400 hover:text-white transition-colors"
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
              <div className="flex items-center gap-2 text-gray-400">
                To
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link href={`/address/${transaction.to}`} className="font-mono text-sm text-selendra-400 hover:text-selendra-300">
                  {transaction.to}
                </Link>
                <button
                  onClick={() => copyToClipboard(transaction.to, "to")}
                  className="text-gray-400 hover:text-white transition-colors"
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
              <div className="flex items-center gap-2 text-gray-400">
                <Coins className="w-4 h-4" />
                Value
              </div>
              <div className="md:col-span-3">
                <span className="font-medium">{transaction.value}</span>
                <span className="text-gray-500 ml-2">({transaction.valueUSD})</span>
              </div>
            </div>

            {/* Transaction Fee */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Flame className="w-4 h-4" />
                Transaction Fee
              </div>
              <div className="md:col-span-3">
                <span>{transaction.fee}</span>
                <span className="text-gray-500 ml-2">({transaction.feeUSD})</span>
              </div>
            </div>

            {/* Gas Price */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                Gas Price
              </div>
              <div className="md:col-span-3">
                {transaction.gasPrice}
              </div>
            </div>

            {/* Gas Usage */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                Gas Limit & Usage
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <span>{transaction.gasUsed}</span>
                <span className="text-gray-500">|</span>
                <span>{transaction.gasLimit}</span>
                <span className="text-gray-400">
                  ({((parseInt(transaction.gasUsed.replace(/,/g, "")) / parseInt(transaction.gasLimit.replace(/,/g, ""))) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* Nonce */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
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
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
                >
                  <Code className="w-4 h-4" />
                  Input Data
                  {showInputData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showInputData && (
                  <div className="space-y-3">
                    {transaction.decodedInput && (
                      <div className="p-3 bg-background-secondary rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Decoded:</p>
                        <p className="font-mono text-sm text-selendra-400">{transaction.decodedInput.method}</p>
                        <div className="mt-2 space-y-1">
                          {transaction.decodedInput.params.map((param, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">{param.name}</span>
                              <span className="text-gray-600">({param.type}):</span>
                              <code className="text-gray-300 font-mono break-all">{param.value}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-background-secondary rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Raw:</p>
                      <code className="text-xs font-mono text-gray-300 break-all block">
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
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          {transaction.logs && transaction.logs.length > 0 ? (
            <div className="divide-y divide-gray-800">
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
                      <p className="text-sm text-gray-400 mb-1">Topics:</p>
                      <div className="space-y-1">
                        {log.topics.map((topic, tidx) => (
                          <div key={tidx} className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">[{tidx}]</span>
                            <code className="text-xs font-mono text-gray-300 break-all">{topic}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Data:</p>
                      <code className="text-xs font-mono text-gray-300 break-all">{log.data}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileCode className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No logs for this transaction</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "state" && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">State changes will be displayed here</p>
          <p className="text-sm text-gray-500 mt-2">
            Shows account balance and storage changes from this transaction
          </p>
        </div>
      )}
    </div>
  );
};
