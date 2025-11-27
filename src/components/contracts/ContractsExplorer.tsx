"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  FileCode,
  CheckCircle,
  ExternalLink,
  Copy,
  Filter,
  ChevronLeft,
  ChevronRight,
  Code,
  Activity,
  Clock,
  Users,
  Shield,
  Upload,
  Play,
} from "lucide-react";
import Link from "next/link";

interface Contract {
  address: string;
  name: string;
  compiler: string;
  version: string;
  verified: boolean;
  createdAt: Date;
  creator: string;
  txCount: number;
  balance: string;
  type: "erc20" | "erc721" | "erc1155" | "defi" | "other";
}

const mockContracts: Contract[] = [
  {
    address: "0x55d398326f99059ff775485246999027b3197955",
    name: "Selendra USDT",
    compiler: "Solidity",
    version: "0.8.19",
    verified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    creator: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    txCount: 125420,
    balance: "0 SEL",
    type: "erc20",
  },
  {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    name: "Selendra USDC",
    compiler: "Solidity",
    version: "0.8.17",
    verified: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    creator: "0x123abc456def789ghi012jkl345mno678pqr",
    txCount: 98500,
    balance: "0 SEL",
    type: "erc20",
  },
  {
    address: "0x7c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b9e0f1a2b",
    name: "SelendraSwap Router",
    compiler: "Solidity",
    version: "0.8.20",
    verified: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    creator: "0xabc123def456789012345678901234567890abcd",
    txCount: 256780,
    balance: "1,250.50 SEL",
    type: "defi",
  },
  {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Selendra NFT Collection",
    compiler: "Solidity",
    version: "0.8.18",
    verified: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    creator: "0xdef456789012345678901234567890abcdef1234",
    txCount: 45200,
    balance: "0 SEL",
    type: "erc721",
  },
  {
    address: "0xfedcba0987654321fedcba0987654321fedcba09",
    name: "Selendra Staking",
    compiler: "Solidity",
    version: "0.8.19",
    verified: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    creator: "0x567890abcdef1234567890abcdef123456789012",
    txCount: 78900,
    balance: "5,420,000 SEL",
    type: "defi",
  },
  {
    address: "0x0123456789abcdef0123456789abcdef01234567",
    name: "Unknown Contract",
    compiler: "Solidity",
    version: "0.8.15",
    verified: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    creator: "0x890abcdef1234567890abcdef1234567890abcde",
    txCount: 1250,
    balance: "50.25 SEL",
    type: "other",
  },
];

export const ContractsExplorer: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "erc20" | "erc721" | "erc1155" | "defi" | "other">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const contractsPerPage = 10;

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || contract.type === filterType;
    const matchesVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" && contract.verified) ||
      (filterVerified === "unverified" && !contract.verified);
    return matchesSearch && matchesType && matchesVerified;
  });

  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * contractsPerPage,
    currentPage * contractsPerPage
  );

  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getTypeColor = (type: Contract["type"]) => {
    switch (type) {
      case "erc20":
        return "bg-green-500/20 text-green-400";
      case "erc721":
        return "bg-purple-500/20 text-purple-400";
      case "erc1155":
        return "bg-pink-500/20 text-pink-400";
      case "defi":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeLabel = (type: Contract["type"]) => {
    switch (type) {
      case "erc20":
        return "ERC-20";
      case "erc721":
        return "ERC-721";
      case "erc1155":
        return "ERC-1155";
      case "defi":
        return "DeFi";
      default:
        return "Other";
    }
  };

  const stats = {
    totalContracts: contracts.length,
    verifiedContracts: contracts.filter((c) => c.verified).length,
    defiContracts: contracts.filter((c) => c.type === "defi").length,
    tokenContracts: contracts.filter((c) => ["erc20", "erc721", "erc1155"].includes(c.type)).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Contracts</h1>
          <p className="text-gray-400 mt-1">
            Explore and interact with verified contracts on Selendra
          </p>
        </div>
        <Link
          href="/contracts/verify"
          className="px-4 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Verify Contract
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileCode className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Contracts</p>
              <p className="text-xl font-bold">{stats.totalContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Verified</p>
              <p className="text-xl font-bold">{stats.verifiedContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">DeFi Contracts</p>
              <p className="text-xl font-bold">{stats.defiContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Token Contracts</p>
              <p className="text-xl font-bold">{stats.tokenContracts}</p>
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
              placeholder="Search by name or address..."
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
            <option value="erc20">ERC-20</option>
            <option value="erc721">ERC-721</option>
            <option value="erc1155">ERC-1155</option>
            <option value="defi">DeFi</option>
            <option value="other">Other</option>
          </select>

          {/* Verified Filter */}
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value as typeof filterVerified)}
            className="px-4 py-2.5 bg-background-secondary border border-gray-700 rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-secondary border-b border-gray-800">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Contract
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Compiler
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                  Transactions
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                  Balance
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                  Created
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-400 w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.map((contract) => (
                <tr
                  key={contract.address}
                  className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-selendra-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/address/${contract.address}`}
                            className="font-medium hover:text-selendra-400 transition-colors"
                          >
                            {contract.name}
                          </Link>
                          {contract.verified && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => copyAddress(contract.address)}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 font-mono"
                          >
                            {contract.address.slice(0, 10)}...{contract.address.slice(-6)}
                            {copiedAddress === contract.address ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(contract.type)}`}>
                      {getTypeLabel(contract.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p>{contract.compiler}</p>
                      <p className="text-gray-500">v{contract.version}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-300">
                    {contract.txCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-300">
                    {contract.balance}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-400 text-sm">
                    {Math.floor((Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/address/${contract.address}`}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="View Contract"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400 hover:text-white" />
                      </Link>
                      {contract.verified && (
                        <Link
                          href={`/address/${contract.address}#code`}
                          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                          title="View Source"
                        >
                          <Code className="w-4 h-4 text-gray-400 hover:text-white" />
                        </Link>
                      )}
                      {contract.verified && (
                        <Link
                          href={`/address/${contract.address}#interact`}
                          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                          title="Interact"
                        >
                          <Play className="w-4 h-4 text-gray-400 hover:text-white" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {(currentPage - 1) * contractsPerPage + 1} to{" "}
            {Math.min(currentPage * contractsPerPage, filteredContracts.length)} of{" "}
            {filteredContracts.length} contracts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
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
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
