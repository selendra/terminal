"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowUpRight,
  FileCode,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Coins,
  Flame,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

import { AddressDisplay } from "@/components/common/AddressDisplay";
import { VMBadge } from "@/components/common/VMBadge";
import { StatusDot } from "@/components/common/StatusBadge";
import { SkeletonTransactionTable, SkeletonCard, ErrorState, MobileTransactionList } from "@/components/common";
import { useIndexerTransactions } from "@/lib/hooks/useIndexerTransactions";
import { useIndexerStatus } from "@/lib/hooks/useIndexerStatus";
import { IndexerTransaction } from "@/lib/api/graphql";

type TransactionType = "transfer" | "contract" | "token" | "stake" | "governance";
type VmType = "evm" | "substrate";

// Convert indexer transaction to display format
function getTransactionType(tx: IndexerTransaction): TransactionType {
  if (tx.section === "staking" || tx.method?.toLowerCase().includes("stake")) {
    return "stake";
  }
  if (tx.section === "democracy" || tx.section === "convictionVoting") {
    return "governance";
  }
  if (tx.method?.toLowerCase().includes("transfer") && tx.section === "assets") {
    return "token";
  }
  if (tx.type === "EVM" && tx.to === null) {
    return "contract"; // Contract deployment
  }
  if (tx.gasUsed && BigInt(tx.gasUsed) > BigInt(21000)) {
    return "contract"; // Contract interaction
  }
  return "transfer";
}

function getVmType(tx: IndexerTransaction): VmType {
  return tx.type === "EVM" || tx.type === "EVM_WRAPPED" ? "evm" : "substrate";
}

function getStatus(tx: IndexerTransaction): "success" | "failed" | "pending" {
  switch (tx.status) {
    case "SUCCESS":
      return "success";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

function formatValue(value: string): string {
  try {
    const val = BigInt(value);
    const decimals = 18;
    const whole = val / BigInt(10 ** decimals);
    const fraction = val % BigInt(10 ** decimals);
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4);
    return `${whole.toLocaleString()}.${fractionStr} SEL`;
  } catch {
    return "0 SEL";
  }
}

function formatFee(fee: string): string {
  try {
    const val = BigInt(fee);
    const decimals = 18;
    const whole = val / BigInt(10 ** decimals);
    const fraction = val % BigInt(10 ** decimals);
    const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 6);
    return `${whole}.${fractionStr} SEL`;
  } catch {
    return "0 SEL";
  }
}

export const TransactionsExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "pending">("all");
  const [filterVm, setFilterVm] = useState<"all" | VmType>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const txPerPage = 20;

  // Fetch transactions from indexer
  const { data: transactions, isLoading, error, refetch } = useIndexerTransactions({
    first: 100, // Fetch more to allow filtering
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch indexer status for stats
  const { data: syncStatus } = useIndexerStatus();

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((tx) => {
    const txType = getTransactionType(tx);
    const vmType = getVmType(tx);
    const status = getStatus(tx);

    const matchesSearch =
      !searchQuery ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from?.substrateAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from?.evmAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to?.substrateAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to?.evmAddress?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || txType === filterType;
    const matchesStatus = filterStatus === "all" || status === filterStatus;
    const matchesVm = filterVm === "all" || vmType === filterVm;

    return matchesSearch && matchesType && matchesStatus && matchesVm;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * txPerPage,
    currentPage * txPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / txPerPage);

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "transfer":
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case "contract":
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case "token":
        return <Coins className="w-4 h-4 text-yellow-400" />;
      case "stake":
        return <Activity className="w-4 h-4 text-purple-400" />;
      case "governance":
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "transfer":
        return "bg-green-500/20 text-green-400";
      case "contract":
        return "bg-blue-500/20 text-blue-400";
      case "token":
        return "bg-yellow-500/20 text-yellow-400";
      case "stake":
        return "bg-purple-500/20 text-purple-400";
      case "governance":
        return "bg-cyan-500/20 text-cyan-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Calculate stats from actual data
  const stats = {
    total: transactions?.length || 0,
    pending: transactions?.filter(tx => tx.status === "PENDING").length || 0,
    indexerBlock: syncStatus?.indexerBlock || 0,
    lag: syncStatus?.lag || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-foreground-secondary mt-1">
            Explore all transactions on Selendra Network
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && syncStatus.lag > 100 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-yellow-400">
              Indexer is syncing: {syncStatus.indexerBlock.toLocaleString()} / {syncStatus.chainBlock.toLocaleString()} blocks
            </p>
            <p className="text-xs text-yellow-500/70">
              Some recent transactions may not be visible yet
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Indexed Transactions</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-background-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Indexed Block</p>
                <p className="text-xl font-bold">{stats.indexerBlock.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-background-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Sync Lag</p>
                <p className="text-xl font-bold">{stats.lag.toLocaleString()} blocks</p>
              </div>
            </div>
          </div>
          <div className="bg-background-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Pending</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hash, from, or to address..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="transfer">Transfer</option>
            <option value="contract">Contract</option>
            <option value="token">Token</option>
            <option value="stake">Stake</option>
            <option value="governance">Governance</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* VM Filter */}
          <div className="flex items-center gap-2">
            {(["all", "evm", "substrate"] as const).map((vm) => (
              <button
                key={vm}
                onClick={() => setFilterVm(vm)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterVm === vm
                  ? "bg-selendra-600 text-white"
                  : "bg-background-secondary text-foreground-secondary hover:text-foreground"
                  }`}
              >
                {vm === "all" ? "All" : vm.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <SkeletonTransactionTable rows={10} />
      ) : error ? (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <ErrorState
            type="indexer"
            title="Failed to load transactions"
            message={error.message}
            onRetry={() => refetch()}
            size="md"
          />
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <ErrorState
            type="empty"
            title="No transactions found"
            message={
              searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterVm !== 'all'
                ? "No transactions match your current filters. Try adjusting your search criteria."
                : "The indexer is still syncing historical data. Transactions will appear as they are indexed."
            }
            size="md"
          />
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden">
            <MobileTransactionList
              transactions={paginatedTransactions.map((tx) => {
                const txType = getTransactionType(tx);
                const vmType = getVmType(tx);
                const status = getStatus(tx);
                const fromAddress = vmType === "evm"
                  ? tx.from?.evmAddress || tx.from?.substrateAddress || ""
                  : tx.from?.substrateAddress || "";
                const toAddress = tx.to
                  ? (vmType === "evm"
                    ? tx.to.evmAddress || tx.to.substrateAddress || ""
                    : tx.to.substrateAddress || "")
                  : "";
                return {
                  hash: tx.hash,
                  type: txType,
                  vmType,
                  status,
                  from: fromAddress,
                  to: toAddress,
                  value: formatValue(tx.value),
                  fee: formatFee(tx.fee),
                  blockNumber: tx.blockNumber,
                  timestamp: tx.timestamp,
                };
              })}
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background-secondary border-b border-border">
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Txn Hash
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Block
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                      From
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                      To
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Value
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Fee
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => {
                    const txType = getTransactionType(tx);
                    const vmType = getVmType(tx);
                    const status = getStatus(tx);
                    const fromAddress = vmType === "evm"
                      ? tx.from?.evmAddress || tx.from?.substrateAddress || ""
                      : tx.from?.substrateAddress || "";
                    const toAddress = tx.to
                      ? (vmType === "evm"
                        ? tx.to.evmAddress || tx.to.substrateAddress || ""
                        : tx.to.substrateAddress || "")
                      : "";

                    return (
                      <tr
                        key={tx.hash}
                        className="border-b border-border hover:bg-background-hover transition-colors"
                      >
                        <td className="px-4 py-4">
                          <Link
                            href={`/tx/${tx.hash}`}
                            className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                          >
                            {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                            <StatusDot status={status} size="sm" />
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getTypeColor(txType)}`}>
                              {getTypeIcon(txType)}
                              {txType.charAt(0).toUpperCase() + txType.slice(1)}
                            </span>
                            <VMBadge vm={vmType} size="sm" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/blocks/${tx.blockNumber}`}
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            {tx.blockNumber.toLocaleString()}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          {fromAddress && (
                            <AddressDisplay
                              address={fromAddress}
                              size="sm"
                              showCopy={false}
                              showToggle={false}
                              linkToAccount
                            />
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {toAddress ? (
                            <AddressDisplay
                              address={toAddress}
                              size="sm"
                              showCopy={false}
                              showToggle={false}
                              linkToAccount
                            />
                          ) : (
                            <span className="text-blue-400 text-sm">Contract Creation</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-sm">
                          {formatValue(tx.value)}
                        </td>
                        <td className="px-4 py-4 text-right text-foreground-secondary text-sm">
                          {formatFee(tx.fee)}
                        </td>
                        <td className="px-4 py-4 text-right text-foreground-secondary text-sm">
                          {formatTimestamp(tx.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-foreground-secondary">
                Showing {(currentPage - 1) * txPerPage + 1} to{" "}
                {Math.min(currentPage * txPerPage, filteredTransactions.length)} of{" "}
                {filteredTransactions.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                        ? "bg-selendra-600 text-white"
                        : "bg-background-secondary hover:bg-background-hover"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Pagination */}
          <div className="md:hidden px-4 py-3 bg-background-card border border-border rounded-xl mt-4 flex items-center justify-between">
            <p className="text-sm text-foreground-secondary">
              Page {currentPage} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2">{currentPage}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
