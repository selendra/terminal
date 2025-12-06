"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Droplets,
  Repeat,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
  Info,
  Clock,
  Wallet,
  Percent,
  DollarSign,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Protocol {
  id: string;
  name: string;
  logo: string;
  category: "dex" | "lending" | "staking" | "yield" | "nft";
  tvl: string;
  tvlChange24h: number;
  volume24h: string;
  apy?: number;
  chains: string[];
  url: string;
}

interface Pool {
  id: string;
  protocol: string;
  pair: string;
  token0: { symbol: string; logo?: string };
  token1: { symbol: string; logo?: string };
  tvl: string;
  apy: number;
  volume24h: string;
  fees24h: string;
}

interface DeFiStats {
  totalTvl: string;
  tvlChange24h: number;
  totalVolume24h: string;
  volumeChange24h: number;
  totalProtocols: number;
  averageApy: number;
}

// TODO: Fetch from DeFi protocols / indexer
const mockStats: DeFiStats = {
  totalTvl: "N/A",
  tvlChange24h: 0,
  totalVolume24h: "N/A",
  volumeChange24h: 0,
  totalProtocols: 0,
  averageApy: 0,
};

// TODO: Query deployed DeFi contracts from indexer
const mockProtocols: Protocol[] = [];

// TODO: Query liquidity pools from DEX contracts
const mockPools: Pool[] = [];

const categories = [
  { key: "all", label: "All", icon: Activity },
  { key: "dex", label: "DEX", icon: Repeat },
  { key: "lending", label: "Lending", icon: PiggyBank },
  { key: "staking", label: "Staking", icon: Wallet },
  { key: "yield", label: "Yield", icon: TrendingUp },
  { key: "nft", label: "NFT", icon: BarChart3 },
];

export default function DeFiDashboard() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"protocols" | "pools">(
    "protocols",
  );

  const filteredProtocols = mockProtocols.filter((protocol) => {
    if (categoryFilter === "all") return true;
    return protocol.category === categoryFilter;
  });

  const getCategoryBadge = (category: Protocol["category"]) => {
    const styles: Record<Protocol["category"], string> = {
      dex: "bg-blue-500/20 text-blue-400",
      lending: "bg-green-500/20 text-green-400",
      staking: "bg-purple-500/20 text-purple-400",
      yield: "bg-yellow-500/20 text-yellow-400",
      nft: "bg-pink-500/20 text-pink-400",
    };
    return (
      <span
        className={cn(
          "px-2 py-1 rounded-full text-xs capitalize",
          styles[category],
        )}
      >
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SelendraDEX</h1>
          <p className="text-foreground-secondary mt-1">
            Native DEX on Selendra — Trade, provide liquidity, and earn rewards
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">
              Total Value Locked
            </span>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockStats.totalTvl}
          </p>
          <p
            className={cn(
              "text-sm mt-1 flex items-center gap-1",
              mockStats.tvlChange24h >= 0 ? "text-green-400" : "text-red-400",
            )}
          >
            {mockStats.tvlChange24h >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(mockStats.tvlChange24h)}% (24h)
          </p>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">
              24h Volume
            </span>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockStats.totalVolume24h}
          </p>
          <p
            className={cn(
              "text-sm mt-1 flex items-center gap-1",
              mockStats.volumeChange24h >= 0
                ? "text-green-400"
                : "text-red-400",
            )}
          >
            {mockStats.volumeChange24h >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(mockStats.volumeChange24h)}% (24h)
          </p>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">
              Total Protocols
            </span>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Droplets className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockStats.totalProtocols}
          </p>
          <p className="text-sm text-foreground-secondary mt-1">
            Across all categories
          </p>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">
              Average APY
            </span>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Percent className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {mockStats.averageApy}%
          </p>
          <p className="text-sm text-foreground-secondary mt-1">
            Across top pools
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.key}
              onClick={() => setCategoryFilter(category.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                categoryFilter === category.key
                  ? "bg-selendra-primary text-white"
                  : "bg-background-card text-foreground-secondary hover:text-foreground border border-border",
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab("protocols")}
            className={cn(
              "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "protocols"
                ? "border-selendra-primary text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground",
            )}
          >
            Protocols
          </button>
          <button
            onClick={() => setActiveTab("pools")}
            className={cn(
              "py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "pools"
                ? "border-selendra-primary text-foreground"
                : "border-transparent text-foreground-secondary hover:text-foreground",
            )}
          >
            Top Pools
          </button>
        </nav>
      </div>

      {/* Protocols Tab */}
      {activeTab === "protocols" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProtocols.length === 0 ? (
            <div className="col-span-full bg-background-card border border-border rounded-xl p-12 text-center">
              <Activity className="w-16 h-16 text-foreground-secondary mx-auto mb-4 opacity-50" />
              <p className="text-foreground-secondary text-lg mb-2">N/A</p>
              <p className="text-foreground-secondary text-sm">
                DeFi protocols integration pending
              </p>
            </div>
          ) : (
            filteredProtocols.map((protocol) => (
              <div
                key={protocol.id}
                className="bg-background-card border border-border rounded-xl p-5 hover:border-selendra-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-background-tertiary flex items-center justify-center text-2xl">
                      {protocol.logo}
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">
                        {protocol.name}
                      </h3>
                      {getCategoryBadge(protocol.category)}
                    </div>
                  </div>
                  <a
                    href={protocol.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary text-sm">
                      TVL
                    </span>
                    <div className="text-right">
                      <span className="text-foreground font-medium">
                        {protocol.tvl}
                      </span>
                      <span
                        className={cn(
                          "ml-2 text-xs",
                          protocol.tvlChange24h >= 0
                            ? "text-green-400"
                            : "text-red-400",
                        )}
                      >
                        {protocol.tvlChange24h >= 0 ? "+" : ""}
                        {protocol.tvlChange24h}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary text-sm">
                      24h Volume
                    </span>
                    <span className="text-foreground font-medium">
                      {protocol.volume24h}
                    </span>
                  </div>

                  {protocol.apy && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary text-sm">
                        Top APY
                      </span>
                      <span className="text-green-400 font-medium">
                        {protocol.apy}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {protocol.chains.map((chain) => (
                      <span
                        key={chain}
                        className="px-2 py-1 bg-background-tertiary rounded text-xs text-foreground-secondary"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pools Tab */}
      {activeTab === "pools" && (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-tertiary/50">
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    #
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    Pool
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    Protocol
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    TVL
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    APY
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    24h Volume
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    24h Fees
                  </th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-selendra-border">
                {mockPools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <Droplets className="w-16 h-16 text-foreground-secondary mx-auto mb-4 opacity-50" />
                      <p className="text-foreground-secondary text-lg mb-2">
                        N/A
                      </p>
                      <p className="text-foreground-secondary text-sm">
                        Liquidity pools integration pending
                      </p>
                    </td>
                  </tr>
                ) : (
                  mockPools.map((pool, index) => (
                    <tr
                      key={pool.id}
                      className="hover:bg-background-tertiary/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="text-foreground-secondary">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-selendra-primary flex items-center justify-center text-xs text-white font-medium ring-2 ring-selendra-card">
                              {pool.token0.symbol.charAt(0)}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium ring-2 ring-selendra-card">
                              {pool.token1.symbol.charAt(0)}
                            </div>
                          </div>
                          <span className="text-foreground font-medium">
                            {pool.pair}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground-secondary">
                          {pool.protocol}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground font-medium">
                          {pool.tvl}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-green-400 font-medium">
                          {pool.apy}%
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground-secondary">
                          {pool.volume24h}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-foreground-secondary">
                          {pool.fees24h}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button className="px-3 py-1.5 bg-selendra-primary text-white text-sm rounded-lg hover:bg-selendra-primary/90 transition-colors">
                          Add Liquidity
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-foreground font-medium mb-1">
              SelendraDEX — Native Trading on Selendra
            </h3>
            <p className="text-foreground-secondary text-sm">
              SelendraDEX is the official decentralized exchange built on
              Selendra. Trade SEL and other tokens with low fees (0.30% swap fee
              — 0.20% to LPs, 0.05% burned, 0.05% to treasury). Bridge tokens
              from BSC to Selendra to access the native ecosystem. All bridge
              fees are burned, creating continuous deflation. Connect your
              wallet to start trading!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
