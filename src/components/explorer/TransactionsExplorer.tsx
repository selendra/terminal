"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileCode,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Coins,
  Flame,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface Transaction {
  hash: string;
  block: number;
  timestamp: Date;
  from: string;
  to: string;
  value: string;
  fee: string;
  status: "success" | "failed" | "pending";
  type: "transfer" | "contract" | "token" | "stake" | "governance";
  vmType: "evm" | "substrate";
}

const generateMockTransactions = (count: number): Transaction[] => {
  const types: Transaction["type"][] = ["transfer", "contract", "token", "stake", "governance"];
  const statuses: Transaction["status"][] = ["success", "success", "success", "failed", "pending"];
  const vmTypes: Transaction["vmType"][] = ["evm", "evm", "evm", "substrate", "substrate"];

  return Array.from({ length: count }, (_, i) => ({
    hash: `0x${Math.random().toString(16).slice(2, 18)}${Math.random().toString(16).slice(2, 18)}`,
    block: 1234567 - i,
    timestamp: new Date(Date.now() - i * 15000),
    from: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 6)}`,
    to: `0x${Math.random().toString(16).slice(2, 14)}...${Math.random().toString(16).slice(2, 6)}`,
    value: `${(Math.random() * 1000).toFixed(4)} SEL`,
    fee: `${(Math.random() * 0.01).toFixed(6)} SEL`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    type: types[Math.floor(Math.random() * types.length)],
    vmType: vmTypes[Math.floor(Math.random() * vmTypes.length)],
  }));
};

export const TransactionsExplorer: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | Transaction["type"]>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | Transaction["status"]>("all");
  const [filterVm, setFilterVm] = useState<"all" | Transaction["vmType"]>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const txPerPage = 20;

  useEffect(() => {
    // Simulate fetching transactions
    setIsLoading(true);
    const timer = setTimeout(() => {
      setTransactions(generateMockTransactions(100));
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus;
    const matchesVm = filterVm === "all" || tx.vmType === filterVm;
    return matchesSearch && matchesType && matchesStatus && matchesVm;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * txPerPage,
    currentPage * txPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / txPerPage);

  const getTypeIcon = (type: Transaction["type"]) => {
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

  const getTypeColor = (type: Transaction["type"]) => {
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

  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const stats = {
    total24h: "125,420",
    avgFee: "0.0025 SEL",
    tps: "125.5",
    pending: "42",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-400 mt-1">
            Explore all transactions on Selendra Network
          </p>
        </div>
        <button
          onClick={() => setTransactions(generateMockTransactions(100))}
          className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">24h Transactions</p>
              <p className="text-xl font-bold">{stats.total24h}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">TPS</p>
              <p className="text-xl font-bold">{stats.tps}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg. Fee</p>
              <p className="text-xl font-bold">{stats.avgFee}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hash, from, or to address..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-gray-700 rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2.5 bg-background-secondary border border-gray-700 rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
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
            className="px-4 py-2.5 bg-background-secondary border border-gray-700 rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterVm === vm
                    ? "bg-selendra-600 text-white"
                    : "bg-background-secondary text-gray-400 hover:text-white"
                }`}
              >
                {vm === "all" ? "All" : vm.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-selendra-500" />
          </div>
        ) : (
          <>
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
                      Block
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
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.hash}
                      className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/tx/${tx.hash}`}
                          className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                        >
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                          {getStatusIcon(tx.status)}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getTypeColor(tx.type)}`}>
                            {getTypeIcon(tx.type)}
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            tx.vmType === "evm" ? "bg-orange-500/20 text-orange-400" : "bg-cyan-500/20 text-cyan-400"
                          }`}>
                            {tx.vmType.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/blocks/${tx.block}`}
                          className="text-gray-400 hover:text-white"
                        >
                          {tx.block.toLocaleString()}
                        </Link>
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
                      <td className="px-4 py-4 text-right text-gray-400 text-sm">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-400">
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
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
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
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
