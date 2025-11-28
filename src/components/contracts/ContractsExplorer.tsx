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
  Eye,
  Edit3,
  FileText,
  Zap,
  AlertCircle,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ContractVerification } from "./ContractVerification";

// Contract types
export type ContractType = "erc20" | "erc721" | "erc1155" | "defi" | "proxy" | "ink" | "other";
export type VMType = "evm" | "wasm";

export interface Contract {
  address: string;
  name: string;
  compiler: string;
  version: string;
  verified: boolean;
  createdAt: Date;
  creator: string;
  txCount: number;
  balance: string;
  type: ContractType;
  vmType: VMType;
  isProxy?: boolean;
  implementationAddress?: string;
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
    vmType: "evm",
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
    vmType: "evm",
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
    vmType: "evm",
    isProxy: true,
    implementationAddress: "0x8d9a0987654321098765432109876543210987654",
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
    vmType: "evm",
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
    vmType: "evm",
  },
  {
    address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    name: "Ink! PSP22 Token",
    compiler: "Ink!",
    version: "4.3.0",
    verified: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    creator: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    txCount: 12500,
    balance: "100 SEL",
    type: "erc20",
    vmType: "wasm",
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
    vmType: "evm",
  },
];

export const ContractsExplorer: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "erc20" | "erc721" | "erc1155" | "defi" | "proxy" | "ink" | "other">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [filterVM, setFilterVM] = useState<"all" | "evm" | "wasm">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "verified" | "recent">("list");

  const contractsPerPage = 10;

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || contract.type === filterType || (filterType === "proxy" && contract.isProxy);
    const matchesVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" && contract.verified) ||
      (filterVerified === "unverified" && !contract.verified);
    const matchesVM = filterVM === "all" || contract.vmType === filterVM;
    return matchesSearch && matchesType && matchesVerified && matchesVM;
  });

  // Tab content data
  const tabContracts = activeTab === "verified" 
    ? filteredContracts.filter(c => c.verified)
    : activeTab === "recent"
    ? [...filteredContracts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : filteredContracts;

  const paginatedContracts = tabContracts.slice(
    (currentPage - 1) * contractsPerPage,
    currentPage * contractsPerPage
  );

  const totalPages = Math.ceil(tabContracts.length / contractsPerPage);

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
      case "proxy":
        return "bg-orange-500/20 text-orange-400";
      case "ink":
        return "bg-cyan-500/20 text-cyan-400";
      default:
        return "bg-foreground-secondary/20 text-foreground-secondary";
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
      case "proxy":
        return "Proxy";
      case "ink":
        return "Ink!";
      default:
        return "Other";
    }
  };

  const getVMBadge = (vmType: VMType) => {
    return vmType === "evm" ? (
      <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded">
        EVM
      </span>
    ) : (
      <span className="px-1.5 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded">
        WASM
      </span>
    );
  };

  const stats = {
    totalContracts: contracts.length,
    verifiedContracts: contracts.filter((c) => c.verified).length,
    defiContracts: contracts.filter((c) => c.type === "defi").length,
    tokenContracts: contracts.filter((c) => ["erc20", "erc721", "erc1155"].includes(c.type)).length,
    wasmContracts: contracts.filter((c) => c.vmType === "wasm").length,
    proxyContracts: contracts.filter((c) => c.isProxy).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Contract Verification Modal */}
      <ContractVerification 
        isOpen={isVerificationOpen} 
        onClose={() => setIsVerificationOpen(false)} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Contracts</h1>
          <p className="text-foreground-secondary mt-1">
            Explore and interact with verified contracts on Selendra (EVM & WASM)
          </p>
        </div>
        <button
          onClick={() => setIsVerificationOpen(true)}
          className="px-4 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Verify Contract
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileCode className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total</p>
              <p className="text-xl font-bold">{stats.totalContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Verified</p>
              <p className="text-xl font-bold">{stats.verifiedContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">DeFi</p>
              <p className="text-xl font-bold">{stats.defiContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Tokens</p>
              <p className="text-xl font-bold">{stats.tokenContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">WASM</p>
              <p className="text-xl font-bold">{stats.wasmContracts}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Proxy</p>
              <p className="text-xl font-bold">{stats.proxyContracts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl w-fit">
        {[
          { id: "list", label: "All Contracts", icon: FileCode },
          { id: "verified", label: "Verified", icon: CheckCircle },
          { id: "recent", label: "Recently Added", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-selendra-600 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

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
              placeholder="Search by name or address..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>

          {/* VM Filter */}
          <select
            value={filterVM}
            onChange={(e) => setFilterVM(e.target.value as typeof filterVM)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All VMs</option>
            <option value="evm">EVM</option>
            <option value="wasm">WASM</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="erc20">ERC-20 / PSP22</option>
            <option value="erc721">ERC-721 / PSP34</option>
            <option value="erc1155">ERC-1155 / PSP37</option>
            <option value="defi">DeFi</option>
            <option value="proxy">Proxy</option>
            <option value="other">Other</option>
          </select>

          {/* Verified Filter */}
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value as typeof filterVerified)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-secondary border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Contract
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  VM
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Compiler
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Transactions
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Balance
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Created
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-foreground-secondary w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.map((contract) => (
                <tr
                  key={contract.address}
                  className="border-b border-border hover:bg-background-hover transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-selendra-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/contracts/${contract.address}`}
                            className="font-medium hover:text-selendra-400 transition-colors"
                          >
                            {contract.name}
                          </Link>
                          {contract.verified && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {contract.isProxy && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Proxy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <button
                            onClick={() => copyAddress(contract.address)}
                            className="flex items-center gap-1 text-foreground-secondary hover:text-foreground font-mono"
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
                    {getVMBadge(contract.vmType)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(contract.type)}`}>
                      {getTypeLabel(contract.type)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p>{contract.compiler}</p>
                      <p className="text-foreground-secondary">v{contract.version}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-foreground">
                    {contract.txCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right text-foreground">
                    {contract.balance}
                  </td>
                  <td className="px-4 py-4 text-right text-foreground-secondary text-sm">
                    {Math.floor((Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/contracts/${contract.address}`}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="View Contract"
                      >
                        <Eye className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                      </Link>
                      {contract.verified && (
                        <>
                          <Link
                            href={`/contracts/${contract.address}?tab=code`}
                            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                            title="View Source Code"
                          >
                            <Code className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                          </Link>
                          <Link
                            href={`/contracts/${contract.address}?tab=read`}
                            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                            title="Read Contract"
                          >
                            <FileText className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                          </Link>
                          <Link
                            href={`/contracts/${contract.address}?tab=write`}
                            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                            title="Write Contract"
                          >
                            <Edit3 className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-foreground-secondary">
            Showing {(currentPage - 1) * contractsPerPage + 1} to{" "}
            {Math.min(currentPage * contractsPerPage, tabContracts.length)} of{" "}
            {tabContracts.length} contracts
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
