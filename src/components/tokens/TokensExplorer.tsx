"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  ExternalLink,
  Filter,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle,
  Coins,
  BarChart3,
  Users,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface Token {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  logo: string;
  address: string;
  price: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  holders: number;
  totalSupply: string;
  type: "native" | "erc20" | "substrate";
  verified: boolean;
  favorite: boolean;
}

const mockTokens: Token[] = [
  {
    id: "1",
    rank: 1,
    name: "Selendra",
    symbol: "SEL",
    logo: "🔮",
    address: "Native",
    price: "$0.0456",
    priceChange24h: 5.23,
    volume24h: "$1,250,000",
    marketCap: "$45,600,000",
    holders: 15420,
    totalSupply: "1,000,000,000",
    type: "native",
    verified: true,
    favorite: true,
  },
  {
    id: "2",
    rank: 2,
    name: "Wrapped SEL",
    symbol: "WSEL",
    logo: "🔮",
    address: "0x7c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b",
    price: "$0.0455",
    priceChange24h: 5.18,
    volume24h: "$850,000",
    marketCap: "$22,750,000",
    holders: 8750,
    totalSupply: "500,000,000",
    type: "erc20",
    verified: true,
    favorite: false,
  },
  {
    id: "3",
    rank: 3,
    name: "USD Tether",
    symbol: "USDT",
    logo: "💵",
    address: "0x55d398326f99059ff775485246999027b3197955",
    price: "$1.00",
    priceChange24h: 0.01,
    volume24h: "$5,200,000",
    marketCap: "$12,000,000",
    holders: 32150,
    totalSupply: "12,000,000",
    type: "erc20",
    verified: true,
    favorite: true,
  },
  {
    id: "4",
    rank: 4,
    name: "USD Coin",
    symbol: "USDC",
    logo: "💲",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    price: "$1.00",
    priceChange24h: -0.02,
    volume24h: "$3,800,000",
    marketCap: "$8,500,000",
    holders: 18920,
    totalSupply: "8,500,000",
    type: "erc20",
    verified: true,
    favorite: false,
  },
  {
    id: "5",
    rank: 5,
    name: "Selendra DeFi",
    symbol: "SDEFI",
    logo: "💎",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    price: "$0.125",
    priceChange24h: 12.45,
    volume24h: "$450,000",
    marketCap: "$6,250,000",
    holders: 4520,
    totalSupply: "50,000,000",
    type: "erc20",
    verified: true,
    favorite: false,
  },
  {
    id: "6",
    rank: 6,
    name: "Selendra NFT",
    symbol: "SNFT",
    logo: "🎨",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    price: "$0.0085",
    priceChange24h: -3.21,
    volume24h: "$125,000",
    marketCap: "$850,000",
    holders: 2150,
    totalSupply: "100,000,000",
    type: "erc20",
    verified: true,
    favorite: false,
  },
  {
    id: "7",
    rank: 7,
    name: "Selendra Gaming",
    symbol: "SGAME",
    logo: "🎮",
    address: "0xfedcba0987654321fedcba0987654321fedcba09",
    price: "$0.0032",
    priceChange24h: 8.76,
    volume24h: "$85,000",
    marketCap: "$320,000",
    holders: 1890,
    totalSupply: "100,000,000",
    type: "erc20",
    verified: false,
    favorite: false,
  },
  {
    id: "8",
    rank: 8,
    name: "Khmer Riel Token",
    symbol: "KRT",
    logo: "🇰🇭",
    address: "0x0123456789abcdef0123456789abcdef01234567",
    price: "$0.00024",
    priceChange24h: -1.52,
    volume24h: "$42,000",
    marketCap: "$240,000",
    holders: 3420,
    totalSupply: "1,000,000,000",
    type: "erc20",
    verified: true,
    favorite: false,
  },
];

export const TokensExplorer: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "native" | "erc20" | "substrate">("all");
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change" | "volume" | "holders">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const tokensPerPage = 10;

  const filteredTokens = tokens
    .filter((token) => {
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || token.type === filterType;
      const matchesFavorites = !showFavoritesOnly || token.favorite;
      return matchesSearch && matchesType && matchesFavorites;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "rank":
          comparison = a.rank - b.rank;
          break;
        case "price":
          comparison =
            parseFloat(a.price.replace(/[$,]/g, "")) -
            parseFloat(b.price.replace(/[$,]/g, ""));
          break;
        case "change":
          comparison = a.priceChange24h - b.priceChange24h;
          break;
        case "volume":
          comparison =
            parseFloat(a.volume24h.replace(/[$,]/g, "")) -
            parseFloat(b.volume24h.replace(/[$,]/g, ""));
          break;
        case "holders":
          comparison = a.holders - b.holders;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const paginatedTokens = filteredTokens.slice(
    (currentPage - 1) * tokensPerPage,
    currentPage * tokensPerPage
  );

  const totalPages = Math.ceil(filteredTokens.length / tokensPerPage);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const toggleFavorite = (tokenId: string) => {
    setTokens(
      tokens.map((token) =>
        token.id === tokenId ? { ...token, favorite: !token.favorite } : token
      )
    );
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const stats = {
    totalTokens: tokens.length,
    totalVolume: "$11.8M",
    totalHolders: "87,220",
    verifiedTokens: tokens.filter((t) => t.verified).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Token Tracker</h1>
          <p className="text-gray-400 mt-1">
            Explore all tokens on Selendra Network
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Tokens</p>
              <p className="text-xl font-bold">{stats.totalTokens}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">24h Volume</p>
              <p className="text-xl font-bold">{stats.totalVolume}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Holders</p>
              <p className="text-xl font-bold">{stats.totalHolders}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Verified</p>
              <p className="text-xl font-bold">{stats.verifiedTokens}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, symbol, or address..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-gray-700 rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            {(["all", "native", "erc20", "substrate"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? "bg-selendra-600 text-white"
                    : "bg-background-secondary text-gray-400 hover:text-white"
                }`}
              >
                {type === "all" ? "All" : type === "erc20" ? "ERC-20" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites Toggle */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showFavoritesOnly
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-background-secondary text-gray-400 hover:text-white"
          }`}
        >
          <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
          Favorites
        </button>
      </div>

      {/* Tokens Table */}
      <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-secondary border-b border-gray-800">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                  Token
                </th>
                <th
                  onClick={() => handleSort("price")}
                  className="text-right px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                >
                  Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("change")}
                  className="text-right px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                >
                  24h Change {sortBy === "change" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => handleSort("volume")}
                  className="text-right px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                >
                  Volume (24h) {sortBy === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                  Market Cap
                </th>
                <th
                  onClick={() => handleSort("holders")}
                  className="text-right px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer hover:text-white"
                >
                  Holders {sortBy === "holders" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-400 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token) => (
                <tr
                  key={token.id}
                  className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleFavorite(token.id)}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      {token.favorite ? (
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/tokens/${token.id}`}
                      className="flex items-center gap-3 hover:text-selendra-400 transition-colors"
                    >
                      <span className="text-2xl">{token.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{token.name}</span>
                          {token.verified && (
                            <CheckCircle className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{token.symbol}</span>
                          {token.type !== "native" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                copyAddress(token.address);
                              }}
                              className="flex items-center gap-1 text-gray-500 hover:text-gray-300"
                            >
                              <span className="font-mono text-xs">
                                {token.address.slice(0, 6)}...{token.address.slice(-4)}
                              </span>
                              {copiedAddress === token.address ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    {token.price}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`flex items-center justify-end gap-1 ${
                        token.priceChange24h >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {token.priceChange24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {Math.abs(token.priceChange24h).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-300">
                    {token.volume24h}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-300">
                    {token.marketCap}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-300">
                    {token.holders.toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/tokens/${token.id}`}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="View Details"
                      >
                        <ArrowUpRight className="w-4 h-4 text-gray-400 hover:text-white" />
                      </Link>
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
            Showing {(currentPage - 1) * tokensPerPage + 1} to{" "}
            {Math.min(currentPage * tokensPerPage, filteredTokens.length)} of{" "}
            {filteredTokens.length} tokens
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
      </div>
    </div>
  );
};
