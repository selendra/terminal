"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle,
  Clock,
  Cube,
  Activity,
  Coins,
  Users,
  FileCode,
  ExternalLink,
  RefreshCw,
  Hash,
  Flame,
  Database,
} from "lucide-react";
import Link from "next/link";

interface BlockDetailProps {
  blockId: string;
}

interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: Date;
  validator: string;
  validatorName?: string;
  transactionCount: number;
  size: number;
  gasUsed: string;
  gasLimit: string;
  baseFeePerGas?: string;
  difficulty?: string;
  totalDifficulty?: string;
  nonce?: string;
  vmType: "substrate" | "evm";
  status: "finalized" | "pending";
  reward: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  fee: string;
  type: string;
  status: "success" | "failed";
}

const mockBlock: BlockInfo = {
  number: 1234567,
  hash: "0x8a5d3f2b1e9c4a7d6b8e5f2a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
  parentHash: "0x7b4c2e1a0d8f3c6b9e5a2d1c4f7b0e3a6d9c2f5b8e1a4d7c0f3b6e9a2d5c8f1b",
  stateRoot: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890",
  extrinsicsRoot: "0x2b3c4d5e6f7890ab1234567890abcdef1234567890abcdef1234567890abcdef",
  timestamp: new Date(Date.now() - 30000),
  validator: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  validatorName: "Selendra Validator #1",
  transactionCount: 42,
  size: 45678,
  gasUsed: "12,345,678",
  gasLimit: "36,000,000",
  baseFeePerGas: "0.0000001",
  vmType: "evm",
  status: "finalized",
  reward: "2.5 SEL",
};

const mockTransactions: Transaction[] = [
  {
    hash: "0x8a5d3f2b1e9c4a7d6b8e5f2a1c3d4e5f",
    from: "0x123...abc",
    to: "0x456...def",
    value: "100.00 SEL",
    fee: "0.0025 SEL",
    type: "Transfer",
    status: "success",
  },
  {
    hash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    from: "0x789...ghi",
    to: "0xabc...123",
    value: "0 SEL",
    fee: "0.0045 SEL",
    type: "Contract Call",
    status: "success",
  },
  {
    hash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
    from: "0xdef...456",
    to: "0x012...789",
    value: "50.50 USDT",
    fee: "0.0018 SEL",
    type: "Token Transfer",
    status: "success",
  },
  {
    hash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    from: "0x345...cde",
    to: "0x678...fab",
    value: "0 SEL",
    fee: "0.0032 SEL",
    type: "Contract Deploy",
    status: "success",
  },
  {
    hash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    from: "0x901...234",
    to: "0xbcd...567",
    value: "25.00 SEL",
    fee: "0.0021 SEL",
    type: "Transfer",
    status: "failed",
  },
];

export const BlockDetail: React.FC<BlockDetailProps> = ({ blockId }) => {
  const [block, setBlock] = useState<BlockInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "logs">("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching block data
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setBlock({ ...mockBlock, number: parseInt(blockId) || mockBlock.number });
      setTransactions(mockTransactions);
      setIsLoading(false);
    };
    fetchData();
  }, [blockId]);

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

  if (isLoading || !block) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-selendra-500" />
      </div>
    );
  }

  const gasUsedPercent = (parseFloat(block.gasUsed.replace(/,/g, "")) / parseFloat(block.gasLimit.replace(/,/g, ""))) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-selendra-600 to-selendra-400 rounded-2xl flex items-center justify-center">
            <Cube className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Block #{block.number.toLocaleString()}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                block.status === "finalized" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {block.status === "finalized" ? "Finalized" : "Pending"}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                block.vmType === "evm" 
                  ? "bg-orange-500/20 text-orange-400" 
                  : "bg-cyan-500/20 text-cyan-400"
              }`}>
                {block.vmType === "evm" ? "EVM" : "Substrate"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <Clock className="w-4 h-4" />
              {formatTimestamp(block.timestamp)} ({block.timestamp.toLocaleString()})
            </div>
          </div>
        </div>

        {/* Block Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/blocks/${block.number - 1}`}
            className="p-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link
            href={`/blocks/${block.number + 1}`}
            className="p-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Transactions</p>
              <p className="text-xl font-bold">{block.transactionCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Block Reward</p>
              <p className="text-xl font-bold">{block.reward}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Gas Used</p>
              <p className="text-xl font-bold">{gasUsedPercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Size</p>
              <p className="text-xl font-bold">{(block.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-4">
          {(["overview", "transactions", "logs"] as const).map((tab) => (
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
              {tab === "transactions" && ` (${block.transactionCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-800">
            {/* Block Hash */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Hash className="w-4 h-4" />
                Block Hash
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <code className="font-mono text-sm break-all">{block.hash}</code>
                <button
                  onClick={() => copyToClipboard(block.hash, "hash")}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied === "hash" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Parent Hash */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Hash className="w-4 h-4" />
                Parent Hash
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <Link
                  href={`/blocks/${block.number - 1}`}
                  className="font-mono text-sm text-selendra-400 hover:text-selendra-300 break-all"
                >
                  {block.parentHash}
                </Link>
                <button
                  onClick={() => copyToClipboard(block.parentHash, "parent")}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied === "parent" ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* State Root */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Database className="w-4 h-4" />
                State Root
              </div>
              <div className="md:col-span-3">
                <code className="font-mono text-sm text-gray-300 break-all">{block.stateRoot}</code>
              </div>
            </div>

            {/* Validator */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                Validated By
              </div>
              <div className="md:col-span-3">
                <Link
                  href={`/address/${block.validator}`}
                  className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300"
                >
                  <span>{block.validatorName || block.validator}</span>
                  {block.validatorName && (
                    <span className="text-gray-500 font-mono text-sm">
                      ({block.validator.slice(0, 10)}...{block.validator.slice(-8)})
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Gas Used */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Flame className="w-4 h-4" />
                Gas Used
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center gap-3">
                  <span>{block.gasUsed} / {block.gasLimit}</span>
                  <div className="flex-1 max-w-xs h-2 bg-background-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-orange-500"
                      style={{ width: `${gasUsedPercent}%` }}
                    />
                  </div>
                  <span className="text-gray-400">({gasUsedPercent.toFixed(2)}%)</span>
                </div>
              </div>
            </div>

            {/* Base Fee */}
            {block.baseFeePerGas && (
              <div className="grid grid-cols-1 md:grid-cols-4 p-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Coins className="w-4 h-4" />
                  Base Fee
                </div>
                <div className="md:col-span-3">
                  {block.baseFeePerGas} SEL
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className="grid grid-cols-1 md:grid-cols-4 p-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Activity className="w-4 h-4" />
                Transactions
              </div>
              <div className="md:col-span-3">
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-selendra-400 hover:text-selendra-300"
                >
                  {block.transactionCount} transactions in this block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Txn Hash
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    To
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Value
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.hash}
                    className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                      >
                        {tx.hash.slice(0, 16)}...
                        {tx.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <span className="text-red-400 text-xs px-1.5 py-0.5 bg-red-400/10 rounded">
                            Failed
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.type === "Transfer" ? "bg-green-500/20 text-green-400" :
                        tx.type === "Contract Call" ? "bg-blue-500/20 text-blue-400" :
                        tx.type === "Contract Deploy" ? "bg-purple-500/20 text-purple-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/address/${tx.from}`}
                        className="text-gray-400 hover:text-white font-mono text-sm"
                      >
                        {tx.from}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/address/${tx.to}`}
                        className="text-gray-400 hover:text-white font-mono text-sm"
                      >
                        {tx.to}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      {tx.value}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">
                      {tx.fee}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-8 text-center">
          <FileCode className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Event logs will be displayed here</p>
          <p className="text-sm text-gray-500 mt-2">
            Shows events emitted by smart contracts in this block
          </p>
        </div>
      )}
    </div>
  );
};
