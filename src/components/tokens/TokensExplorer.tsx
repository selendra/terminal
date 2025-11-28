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
  Grid,
  Image,
  Layers,
  Tag,
  Clock,
  Diamond,
  Code2,
  Shield,
  Palette,
  Info,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

// Token types
export type TokenType = "native" | "erc20" | "erc721" | "erc1155" | "psp22" | "psp34" | "psp37" | "substrate";
export type TokenStandard = "ERC-20" | "ERC-721" | "ERC-1155" | "PSP22" | "PSP34" | "PSP37" | "Native" | "Substrate Asset";

export interface Token {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  logo: string;
  address: string;
  price: string;
  priceChange24h: number;
  priceChange7d?: number;
  volume24h: string;
  marketCap: string;
  holders: number;
  totalSupply: string;
  circulatingSupply?: string;
  type: TokenType;
  standard: TokenStandard;
  verified: boolean;
  favorite: boolean;
  priceHistory: number[];
  decimals?: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  contractCreated?: Date;
  // NFT specific
  totalItems?: number;
  floorPrice?: string;
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 40;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

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
    priceChange7d: 12.45,
    volume24h: "$1,250,000",
    marketCap: "$45,600,000",
    holders: 15420,
    totalSupply: "1,000,000,000",
    circulatingSupply: "850,000,000",
    type: "native",
    standard: "Native",
    verified: true,
    favorite: true,
    priceHistory: [0.041, 0.042, 0.044, 0.043, 0.045, 0.046, 0.0456],
    decimals: 18,
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
    standard: "ERC-20",
    verified: true,
    favorite: false,
    priceHistory: [0.040, 0.041, 0.043, 0.044, 0.045, 0.045, 0.0455],
    decimals: 18,
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
    standard: "ERC-20",
    verified: true,
    favorite: true,
    priceHistory: [1.00, 0.99, 1.00, 1.01, 1.00, 1.00, 1.00],
    decimals: 6,
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
    standard: "ERC-20",
    verified: true,
    favorite: false,
    priceHistory: [1.00, 1.00, 1.00, 0.99, 1.00, 1.00, 1.00],
    decimals: 6,
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
    standard: "ERC-20",
    verified: true,
    favorite: false,
    priceHistory: [0.10, 0.11, 0.13, 0.12, 0.14, 0.12, 0.125],
    decimals: 18,
  },
  {
    id: "6",
    rank: 6,
    name: "Selendra NFT Collection",
    symbol: "SNFT",
    logo: "🎨",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    price: "-",
    priceChange24h: 0,
    volume24h: "$125,000",
    marketCap: "-",
    holders: 2150,
    totalSupply: "10,000",
    type: "erc721",
    standard: "ERC-721",
    verified: true,
    favorite: false,
    priceHistory: [0.009, 0.008, 0.0085, 0.008, 0.007, 0.008, 0.0085],
    totalItems: 10000,
    floorPrice: "25 SEL",
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
    standard: "ERC-20",
    verified: false,
    favorite: false,
    priceHistory: [0.002, 0.0025, 0.003, 0.0028, 0.0035, 0.003, 0.0032],
    decimals: 18,
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
    standard: "ERC-20",
    verified: true,
    favorite: false,
    priceHistory: [0.00025, 0.00024, 0.00024, 0.00023, 0.00024, 0.00024, 0.00024],
    decimals: 18,
  },
  {
    id: "9",
    rank: 9,
    name: "Ink! PSP22 Token",
    symbol: "IPSP",
    logo: "⚡",
    address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    price: "$0.015",
    priceChange24h: 3.25,
    volume24h: "$28,000",
    marketCap: "$150,000",
    holders: 520,
    totalSupply: "10,000,000",
    type: "psp22",
    standard: "PSP22",
    verified: true,
    favorite: false,
    priceHistory: [0.012, 0.013, 0.014, 0.0135, 0.015, 0.0145, 0.015],
    decimals: 12,
  },
  {
    id: "10",
    rank: 10,
    name: "Selendra Game Items",
    symbol: "SGI",
    logo: "🎮",
    address: "0x9876543210fedcba9876543210fedcba98765432",
    price: "-",
    priceChange24h: 0,
    volume24h: "$45,000",
    marketCap: "-",
    holders: 890,
    totalSupply: "50,000",
    type: "erc1155",
    standard: "ERC-1155",
    verified: true,
    favorite: false,
    priceHistory: [],
    totalItems: 50000,
    floorPrice: "5 SEL",
  },
];

type TabType = "erc20" | "erc721" | "erc1155" | "substrate";

export const TokensExplorer: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("erc20");
  const [filterType, setFilterType] = useState<"all" | "native" | "erc20" | "substrate" | "erc721" | "erc1155">("all");
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change" | "volume" | "holders" | "items">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const tokensPerPage = 10;
  
  const tabs = [
    { id: "erc20" as TabType, label: "ERC-20 Tokens", icon: Coins, description: "Fungible tokens" },
    { id: "erc721" as TabType, label: "ERC-721 NFTs", icon: Diamond, description: "Non-fungible tokens" },
    { id: "erc1155" as TabType, label: "ERC-1155", icon: Layers, description: "Multi tokens" },
    { id: "substrate" as TabType, label: "PSP Tokens", icon: Code2, description: "ink! tokens" },
  ];
  
  // Filter tokens based on active tab
  const getTabTokenTypes = (tab: TabType): string[] => {
    switch (tab) {
      case "erc20": return ["native", "erc20"];
      case "erc721": return ["erc721"];
      case "erc1155": return ["erc1155"];
      case "substrate": return ["substrate"];
      default: return [];
    }
  };

  const filteredTokens = tokens
    .filter((token) => {
      const matchesSearch =
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by active tab
      const tabTypes = getTabTokenTypes(activeTab);
      const matchesTab = tabTypes.includes(token.type);
      
      const matchesType = filterType === "all" || token.type === filterType;
      const matchesFavorites = !showFavoritesOnly || token.favorite;
      const matchesVerified = !showVerifiedOnly || token.verified;
      return matchesSearch && matchesTab && matchesType && matchesFavorites && matchesVerified;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "rank":
          comparison = a.rank - b.rank;
          break;
        case "price":
          comparison =
            parseFloat(a.price.replace(/[$,]/g, "") || "0") -
            parseFloat(b.price.replace(/[$,]/g, "") || "0");
          break;
        case "change":
          comparison = a.priceChange24h - b.priceChange24h;
          break;
        case "volume":
          comparison =
            parseFloat(a.volume24h.replace(/[$,]/g, "") || "0") -
            parseFloat(b.volume24h.replace(/[$,]/g, "") || "0");
          break;
        case "holders":
          comparison = a.holders - b.holders;
          break;
        case "items":
          comparison = (a.totalItems || 0) - (b.totalItems || 0);
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

  // Dynamic stats based on active tab
  const tabTokens = tokens.filter(t => getTabTokenTypes(activeTab).includes(t.type));
  const stats = {
    totalTokens: tabTokens.length,
    totalVolume: activeTab === "erc20" ? "$11.8M" : activeTab === "erc721" ? "$2.5M" : activeTab === "erc1155" ? "$1.2M" : "$500K",
    totalHolders: tabTokens.reduce((acc, t) => acc + t.holders, 0).toLocaleString(),
    verifiedTokens: tabTokens.filter((t) => t.verified).length,
    totalItems: tabTokens.reduce((acc, t) => acc + (t.totalItems || 0), 0).toLocaleString(),
  };
  
  // Check if current tab is NFT-related
  const isNFTTab = activeTab === "erc721" || activeTab === "erc1155";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Token Tracker</h1>
          <p className="text-foreground-secondary mt-1">
            Explore all tokens and NFTs on Selendra Network
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const tabCount = tokens.filter(t => getTabTokenTypes(tab.id).includes(t.type)).length;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                  setFilterType("all");
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-selendra-500 text-selendra-400"
                    : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? "bg-selendra-500/20 text-selendra-400"
                    : "bg-background-secondary text-foreground-secondary"
                }`}>
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              {isNFTTab ? <Palette className="w-5 h-5 text-purple-400" /> : <Coins className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">{isNFTTab ? "Collections" : "Total Tokens"}</p>
              <p className="text-xl font-bold">{stats.totalTokens}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">{isNFTTab ? "Total Volume" : "24h Volume"}</p>
              <p className="text-xl font-bold">{stats.totalVolume}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              {isNFTTab ? <Diamond className="w-5 h-5 text-blue-400" /> : <Users className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">{isNFTTab ? "Total Items" : "Total Holders"}</p>
              <p className="text-xl font-bold">{isNFTTab ? stats.totalItems : stats.totalHolders}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Verified</p>
              <p className="text-xl font-bold">{stats.verifiedTokens}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isNFTTab ? "Search collections by name or address..." : "Search by name, symbol, or address..."}
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex items-center gap-2">
          {/* Verified Filter */}
          <button
            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showVerifiedOnly
              ? "bg-blue-500/20 text-blue-400"
              : "bg-background-secondary text-foreground-secondary hover:text-foreground"
              }`}
          >
            <Shield className={`w-4 h-4`} />
            Verified
          </button>
          
          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFavoritesOnly
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-background-secondary text-foreground-secondary hover:text-foreground"
              }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? "fill-yellow-400" : ""}`} />
            Favorites
          </button>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-secondary border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary w-12">
                  #
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  {isNFTTab ? "Collection" : "Token"}
                </th>
                {isNFTTab ? (
                  <>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Floor Price
                    </th>
                    <th
                      onClick={() => handleSort("items")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Items {sortBy === "items" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("holders")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Owners {sortBy === "holders" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("volume")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Volume {sortBy === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </>
                ) : (
                  <>
                    <th
                      onClick={() => handleSort("price")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Price {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("change")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      24h Change {sortBy === "change" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      onClick={() => handleSort("volume")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Volume (24h) {sortBy === "volume" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                      Market Cap
                    </th>
                    <th
                      onClick={() => handleSort("holders")}
                      className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary cursor-pointer hover:text-foreground"
                    >
                      Holders {sortBy === "holders" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary w-40">
                      Last 7 Days
                    </th>
                  </>
                )}
                <th className="text-center px-4 py-3 text-sm font-medium text-foreground-secondary w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTokens.map((token, idx) => (
                <tr
                  key={token.id}
                  className="border-b border-border hover:bg-background-hover transition-colors"
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleFavorite(token.id)}
                      className="text-foreground-secondary hover:text-yellow-400 transition-colors"
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
                          {token.standard && (
                            <span className="px-1.5 py-0.5 text-xs rounded bg-background-secondary text-foreground-secondary">
                              {token.standard}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-foreground-secondary">{token.symbol}</span>
                          {token.type !== "native" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                copyAddress(token.address);
                              }}
                              className="flex items-center gap-1 text-foreground-secondary hover:text-foreground"
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
                  {isNFTTab ? (
                    <>
                      <td className="px-4 py-4 text-right font-mono text-selendra-400">
                        {token.floorPrice || "-"}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {(token.totalItems || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {token.holders.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {token.volume24h}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-4 text-right font-mono">
                        {token.price}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`flex items-center justify-end gap-1 ${token.priceChange24h >= 0
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
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {token.volume24h}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {token.marketCap}
                      </td>
                      <td className="px-4 py-4 text-right text-foreground-secondary">
                        {token.holders.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end">
                          <Sparkline
                            data={token.priceHistory}
                            color={token.priceChange24h >= 0 ? "#4ade80" : "#f87171"}
                          />
                        </div>
                      </td>
                    </>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/tokens/${token.id}`}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                        title="View Details"
                      >
                        <ArrowUpRight className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                      </Link>
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
