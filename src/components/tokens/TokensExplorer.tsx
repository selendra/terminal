"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
  Copy,
  CheckCircle,
  Coins,
  BarChart3,
  Users,
  ArrowUpRight,
  Layers,
  Diamond,
  Code2,
  Shield,
  Palette,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { TokenIcon } from "./TokenIcon";

import { Skeleton, SkeletonTableRow } from "@/components/common/Skeleton";
import { useTokens } from "@/lib/hooks/useTokens";
import { Token, TokenType, TokenStandard } from "@/types/tokens";

type TabType = "erc20" | "erc721" | "erc1155" | "substrate";

const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 30;
  const width = 100;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

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

export const TokensExplorer: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get initial tab from URL params
  const urlTab = searchParams.get("tab") as TabType | null;
  const validTabs: TabType[] = ["erc20", "erc721", "erc1155", "substrate"];
  const initialTab: TabType = urlTab && validTabs.includes(urlTab) ? urlTab : "erc20";

  const { tokens: fetchedTokens, isLoading } = useTokens();
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (fetchedTokens.length > 0) {
      setTokens(fetchedTokens);
    }
  }, [fetchedTokens]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [filterType, setFilterType] = useState<"all" | "native" | "erc20" | "substrate" | "erc721" | "erc1155">("all");
  const [sortBy, setSortBy] = useState<"rank" | "price" | "change" | "volume" | "holders" | "items">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Sync tab state with URL params on mount and when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
      setCurrentPage(1);
      setFilterType("all");
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setFilterType("all");
    // Update URL without full page reload
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "erc20") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const newUrl = params.toString() ? `/tokens?${params.toString()}` : "/tokens";
    router.push(newUrl, { scroll: false });
  };

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
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? "border-selendra-500 text-selendra-400"
                  : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
                  }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-background-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-3 w-20" />
                  <Skeleton variant="text" className="h-6 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}

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
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={8} />
                ))
              ) : (
                paginatedTokens.map((token, idx) => (
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
                        href={`/tokens/${token.symbol.toLowerCase()}`}
                        className="flex items-center gap-3 hover:text-selendra-400 transition-colors"
                      >
                        <TokenIcon symbol={token.symbol} size={32} />
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
                          href={`/tokens/${token.symbol.toLowerCase()}`}
                          className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                          title="View Details"
                        >
                          <ArrowUpRight className="w-4 h-4 text-foreground-secondary hover:text-foreground" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
