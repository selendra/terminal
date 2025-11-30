"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  BarChart3,
  Clock,
  Star,
  StarOff,
  Send,
  Grid,
  FileText,
  Code2,
  Diamond,
  Shield,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Globe,
  Twitter,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Token, TokenType, TokenStandard } from "./TokensExplorer";
import { AddToWalletButton } from "./AddToWalletButton";
import { TokenIcon } from "./TokenIcon";

// Tab types
type TabType = "overview" | "holders" | "transfers" | "inventory" | "analytics";

// Holder interface
interface TokenHolder {
  rank: number;
  address: string;
  label?: string;
  balance: string;
  balanceUSD?: string;
  percentage: number;
  txCount?: number;
}

// Transfer interface
interface TokenTransfer {
  hash: string;
  from: string;
  fromLabel?: string;
  to: string;
  toLabel?: string;
  value: string;
  valueUSD?: string;
  timestamp: string;
  block: number;
  tokenId?: string; // For NFTs
}

// NFT Item interface
interface NFTItem {
  tokenId: string;
  name: string;
  image: string;
  owner: string;
  ownerLabel?: string;
  rarity?: string;
  lastSale?: string;
  listPrice?: string;
}

// Price history point
interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface TokenDetailViewProps {
  tokenId: string;
}

// Simple price chart component
const PriceChart: React.FC<{ data: PricePoint[]; height?: number }> = ({
  data,
  height = 200
}) => {
  if (data.length === 0) return null;

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.price - minPrice) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1].price >= data[0].price;
  const color = isPositive ? "#4ade80" : "#f87171";

  // Create filled area path
  const areaPath = `M0,100 L${points} L100,100 Z`;
  const linePath = `M${points}`;

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#chartGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Price labels */}
      <div className="absolute top-0 right-0 text-xs text-foreground-secondary">
        ${maxPrice.toFixed(4)}
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-foreground-secondary">
        ${minPrice.toFixed(4)}
      </div>
    </div>
  );
};

// Mock token detail data
const getMockTokenDetail = (tokenId: string): Token & {
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  contractCreator?: string;
  createdAt?: string;
  totalTransfers?: number;
  priceHistoryDetailed?: PricePoint[];
} => ({
  id: tokenId,
  rank: 1,
  logo: "🔷",
  name: tokenId === "sel" ? "Selendra" : "Sample Token",
  symbol: tokenId === "sel" ? "SEL" : "TOKEN",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  price: "$0.0234",
  priceChange24h: 5.67,
  priceChange7d: 12.34,
  volume24h: "$1.2M",
  marketCap: "$23.4M",
  holders: 12500,
  totalSupply: "1,000,000,000",
  circulatingSupply: "750,000,000",
  type: "native",
  standard: "Native",
  decimals: 18,
  verified: true,
  favorite: false,
  priceHistory: [30, 35, 32, 40, 38, 45, 42, 50],
  description: "Selendra is the native token of the Selendra Network, a unified blockchain platform supporting both WASM and EVM smart contracts.",
  website: "https://selendra.org",
  twitter: "https://twitter.com/selaborative",
  telegram: "https://t.me/selendraorg",
  contractCreator: "0xabcd...1234",
  createdAt: "2023-01-15",
  totalTransfers: 125678,
  priceHistoryDetailed: Array.from({ length: 30 }, (_, i) => ({
    timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
    price: 0.0234 * (0.9 + Math.random() * 0.2),
    volume: 1000000 * (0.5 + Math.random()),
  })),
});

// Mock holders data
const mockHolders: TokenHolder[] = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
  label: i === 0 ? "Treasury" : i === 1 ? "Staking Pool" : i === 2 ? "DEX LP" : undefined,
  balance: (10000000 * Math.pow(0.7, i)).toLocaleString(),
  balanceUSD: `$${(234567 * Math.pow(0.7, i)).toLocaleString()}`,
  percentage: 10 * Math.pow(0.7, i),
  txCount: Math.floor(Math.random() * 1000),
}));

// Mock transfers data
const mockTransfers: TokenTransfer[] = Array.from({ length: 20 }, (_, i) => ({
  hash: `0x${Math.random().toString(16).slice(2, 66)}`,
  from: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
  fromLabel: Math.random() > 0.7 ? "Selendra: Staking" : undefined,
  to: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
  toLabel: Math.random() > 0.7 ? "DEX: Router" : undefined,
  value: (1000 * Math.random()).toFixed(2),
  valueUSD: `$${(23.4 * Math.random()).toFixed(2)}`,
  timestamp: `${Math.floor(Math.random() * 60)} mins ago`,
  block: 1000000 - i,
}));

// Mock NFT items
const mockNFTItems: NFTItem[] = Array.from({ length: 12 }, (_, i) => ({
  tokenId: `#${1000 + i}`,
  name: `Selendra Genesis #${1000 + i}`,
  image: `https://picsum.photos/seed/${i}/200/200`,
  owner: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
  ownerLabel: Math.random() > 0.8 ? "selendra.sel" : undefined,
  rarity: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Math.floor(Math.random() * 5)],
  lastSale: Math.random() > 0.5 ? `${(Math.random() * 100).toFixed(2)} SEL` : undefined,
  listPrice: Math.random() > 0.6 ? `${(Math.random() * 150).toFixed(2)} SEL` : undefined,
}));

export const TokenDetailView: React.FC<TokenDetailViewProps> = ({ tokenId }) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [token, setToken] = useState<ReturnType<typeof getMockTokenDetail> | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [holdersPage, setHoldersPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);

  useEffect(() => {
    // Simulate loading
    setLoading(true);
    const timer = setTimeout(() => {
      setToken(getMockTokenDetail(tokenId));
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [tokenId]);

  const copyAddress = () => {
    if (token) {
      navigator.clipboard.writeText(token.address);
      setCopiedAddress(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const isNFT = token?.type === "erc721" || token?.type === "erc1155";

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: FileText },
    { id: "holders" as TabType, label: isNFT ? "Owners" : "Holders", icon: Users },
    { id: "transfers" as TabType, label: "Transfers", icon: Activity },
    ...(isNFT ? [{ id: "inventory" as TabType, label: "Inventory", icon: Grid }] : []),
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-background-secondary rounded" />
          <div className="h-64 bg-background-secondary rounded-xl" />
          <div className="h-96 bg-background-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-foreground-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Token Not Found</h2>
          <p className="text-foreground-secondary mb-4">
            The token you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/tokens"
            className="inline-flex items-center gap-2 px-4 py-2 bg-selendra-600 text-white rounded-lg hover:bg-selendra-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <Link
        href="/tokens"
        className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Token Tracker
      </Link>

      {/* Token Header */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Token Info */}
          <div className="flex items-start gap-4">
            <TokenIcon symbol={token.symbol} size={64} />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{token.name}</h1>
                <span className="text-lg text-foreground-secondary">({token.symbol})</span>
                {token.verified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                    <Shield className="w-3 h-3" />
                    Verified
                  </div>
                )}
                {token.standard && (
                  <span className="px-2 py-1 bg-background-secondary text-foreground-secondary rounded text-xs">
                    {token.standard}
                  </span>
                )}
              </div>

              {/* Address */}
              {token.type !== "native" && (
                <div className="flex items-center gap-2 mt-2">
                  <code className="font-mono text-sm text-foreground-secondary">
                    {token.address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-1 hover:bg-background-secondary rounded transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-foreground-secondary" />
                    )}
                  </button>
                  <a
                    href={`https://selendra.org/address/${token.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-background-secondary rounded transition-colors"
                    title="View on explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-foreground-secondary" />
                  </a>
                </div>
              )}

              {/* Description */}
              {token.description && (
                <p className="text-foreground-secondary mt-3 max-w-2xl text-sm">
                  {token.description}
                </p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-3">
                {token.website && (
                  <a
                    href={token.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {token.twitter && (
                  <a
                    href={token.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {token.telegram && (
                  <a
                    href={token.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors"
                    title="Telegram"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex flex-col items-end gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold">{token.price}</div>
              <div className={`flex items-center justify-end gap-1 mt-1 ${token.priceChange24h >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                {token.priceChange24h >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(token.priceChange24h).toFixed(2)}% (24h)
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFavorite(!favorite)}
                className={`p-2 rounded-lg transition-colors ${favorite
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-background-secondary text-foreground-secondary hover:text-foreground"
                  }`}
              >
                {favorite ? (
                  <Star className="w-5 h-5 fill-yellow-400" />
                ) : (
                  <StarOff className="w-5 h-5" />
                )}
              </button>
              {token.type !== "native" && token.address && (
                <AddToWalletButton
                  token={{
                    address: token.address,
                    symbol: token.symbol,
                    decimals: token.decimals || 18,
                    name: token.name,
                    logoUrl: typeof token.logo === "string" && token.logo.startsWith("http") ? token.logo : undefined,
                    type: token.type === "erc721" ? "erc721" : token.type === "erc1155" ? "erc1155" : "erc20",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-sm text-foreground-secondary">Market Cap</p>
            <p className="font-semibold">{token.marketCap}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-secondary">Volume (24h)</p>
            <p className="font-semibold">{token.volume24h}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-secondary">{isNFT ? "Owners" : "Holders"}</p>
            <p className="font-semibold">{token.holders.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-secondary">Total Supply</p>
            <p className="font-semibold">{token.totalSupply}</p>
          </div>
          {token.circulatingSupply && (
            <div>
              <p className="text-sm text-foreground-secondary">Circulating Supply</p>
              <p className="font-semibold">{token.circulatingSupply}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-foreground-secondary">Transfers</p>
            <p className="font-semibold">{token.totalTransfers?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                  ? "border-selendra-500 text-selendra-400"
                  : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
                  }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Price Chart */}
            <div className="lg:col-span-2 bg-background-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Price Chart</h3>
                <div className="flex items-center gap-1">
                  {(["24h", "7d", "30d", "all"] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${timeframe === tf
                        ? "bg-selendra-600 text-white"
                        : "bg-background-secondary text-foreground-secondary hover:text-foreground"
                        }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <PriceChart data={token.priceHistoryDetailed || []} height={300} />
            </div>

            {/* Token Info Card */}
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Token Info</h3>
              <div className="space-y-4">
                {token.type !== "native" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Contract Creator</span>
                      <a href="#" className="text-selendra-400 hover:underline font-mono text-sm">
                        {token.contractCreator}
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Decimals</span>
                      <span>{token.decimals}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Token Standard</span>
                  <span>{token.standard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Created</span>
                  <span>{token.createdAt}</span>
                </div>
                {token.priceChange7d !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">7d Change</span>
                    <span className={token.priceChange7d >= 0 ? "text-green-400" : "text-red-400"}>
                      {token.priceChange7d >= 0 ? "+" : ""}{token.priceChange7d.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Holders Tab */}
        {activeTab === "holders" && (
          <div className="bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Top {isNFT ? "Owners" : "Holders"}</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg text-sm hover:bg-background-hover transition-colors">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background-secondary">
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">Rank</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">Address</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Balance</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">% of Supply</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {mockHolders.slice((holdersPage - 1) * 10, holdersPage * 10).map((holder) => (
                    <tr key={holder.rank} className="border-b border-border hover:bg-background-hover">
                      <td className="px-4 py-3 text-foreground-secondary">{holder.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a href="#" className="font-mono text-sm text-selendra-400 hover:underline">
                            {holder.address}
                          </a>
                          {holder.label && (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                              {holder.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{holder.balance}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-background-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-selendra-500 rounded-full"
                              style={{ width: `${Math.min(holder.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-foreground-secondary text-sm">
                            {holder.percentage.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground-secondary">{holder.balanceUSD}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-sm text-foreground-secondary">
                Showing {(holdersPage - 1) * 10 + 1} to {Math.min(holdersPage * 10, mockHolders.length)} of {mockHolders.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHoldersPage(p => Math.max(1, p - 1))}
                  disabled={holdersPage === 1}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">Page {holdersPage}</span>
                <button
                  onClick={() => setHoldersPage(p => p + 1)}
                  disabled={holdersPage * 10 >= mockHolders.length}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === "transfers" && (
          <div className="bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Token Transfers</h3>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg text-sm hover:bg-background-hover transition-colors">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg text-sm hover:bg-background-hover transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background-secondary">
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">Tx Hash</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">From</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">To</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Value</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTransfers.slice((transfersPage - 1) * 10, transfersPage * 10).map((transfer, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-background-hover">
                      <td className="px-4 py-3">
                        <a href="#" className="font-mono text-sm text-selendra-400 hover:underline">
                          {transfer.hash.slice(0, 10)}...{transfer.hash.slice(-6)}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a href="#" className="font-mono text-sm text-selendra-400 hover:underline">
                            {transfer.from}
                          </a>
                          {transfer.fromLabel && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                              {transfer.fromLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-foreground-secondary" />
                          <a href="#" className="font-mono text-sm text-selendra-400 hover:underline">
                            {transfer.to}
                          </a>
                          {transfer.toLabel && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {transfer.toLabel}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono">{transfer.value} {token.symbol}</div>
                        <div className="text-xs text-foreground-secondary">{transfer.valueUSD}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground-secondary">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {transfer.timestamp}
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
                Showing {(transfersPage - 1) * 10 + 1} to {Math.min(transfersPage * 10, mockTransfers.length)} of {mockTransfers.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTransfersPage(p => Math.max(1, p - 1))}
                  disabled={transfersPage === 1}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">Page {transfersPage}</span>
                <button
                  onClick={() => setTransfersPage(p => p + 1)}
                  disabled={transfersPage * 10 >= mockTransfers.length}
                  className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab (NFTs only) */}
        {activeTab === "inventory" && isNFT && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select className="px-3 py-2 bg-background-secondary border border-border rounded-lg text-sm">
                  <option>All Items</option>
                  <option>Listed</option>
                  <option>Not Listed</option>
                </select>
                <select className="px-3 py-2 bg-background-secondary border border-border rounded-lg text-sm">
                  <option>Sort by: Token ID</option>
                  <option>Sort by: Price Low to High</option>
                  <option>Sort by: Price High to Low</option>
                  <option>Sort by: Rarity</option>
                </select>
              </div>
              <p className="text-sm text-foreground-secondary">
                {mockNFTItems.length} items
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {mockNFTItems.map((item) => (
                <Link
                  key={item.tokenId}
                  href={`/tokens/${tokenId}/${item.tokenId.replace("#", "")}`}
                  className="bg-background-card border border-border rounded-xl overflow-hidden hover:border-selendra-500 transition-colors group"
                >
                  <div className="aspect-square bg-background-secondary relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {item.rarity && (
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${item.rarity === "Legendary" ? "bg-yellow-500/20 text-yellow-400" :
                        item.rarity === "Epic" ? "bg-purple-500/20 text-purple-400" :
                          item.rarity === "Rare" ? "bg-blue-500/20 text-blue-400" :
                            item.rarity === "Uncommon" ? "bg-green-500/20 text-green-400" :
                              "bg-gray-500/20 text-gray-400"
                        }`}>
                        {item.rarity}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate group-hover:text-selendra-400 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-xs text-foreground-secondary mt-1">
                      {item.tokenId}
                    </p>
                    {item.listPrice ? (
                      <p className="text-sm font-semibold text-selendra-400 mt-2">
                        {item.listPrice}
                      </p>
                    ) : item.lastSale ? (
                      <p className="text-xs text-foreground-secondary mt-2">
                        Last: {item.lastSale}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Volume Chart Placeholder */}
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Trading Volume</h3>
              <div className="h-64 flex items-center justify-center text-foreground-secondary">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Volume chart coming soon</p>
                </div>
              </div>
            </div>

            {/* Holder Distribution */}
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Holder Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: "Top 10 Holders", percentage: 45 },
                  { label: "Top 50 Holders", percentage: 65 },
                  { label: "Top 100 Holders", percentage: 78 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground-secondary">{item.label}</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-selendra-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer Activity */}
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Transfer Activity (30d)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">12.5K</p>
                  <p className="text-sm text-foreground-secondary">Transfers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">4.2K</p>
                  <p className="text-sm text-foreground-secondary">Unique Addresses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+8.5%</p>
                  <p className="text-sm text-foreground-secondary">vs. Last Period</p>
                </div>
              </div>
            </div>

            {/* DEX Trading */}
            <div className="bg-background-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">DEX Trading</h3>
              <div className="space-y-3">
                {[
                  { dex: "SelSwap", volume: "$890K", percentage: 72 },
                  { dex: "UniSwap V3", volume: "$210K", percentage: 17 },
                  { dex: "Other", volume: "$135K", percentage: 11 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-background-secondary rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-foreground-secondary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.dex}</p>
                        <p className="text-sm text-foreground-secondary">{item.volume}</p>
                      </div>
                    </div>
                    <span className="text-foreground-secondary">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetailView;
