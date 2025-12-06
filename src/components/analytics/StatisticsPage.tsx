"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Blocks,
  Fuel,
  FileCode,
  Coins,
  Clock,
  HardDrive,
  Cpu,
  Database,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { useTokenomics } from "@/lib/hooks/useTokenomics";
import { SEL_TOKEN_CONFIG } from "@/lib/tokenomics";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-background-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground-secondary mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-foreground-secondary mt-1">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : null}
              <span
                className={clsx(
                  "text-sm font-medium",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500",
                  trend === "neutral" && "text-foreground-secondary",
                )}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-foreground-secondary ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="p-3 bg-selendra-500/10 rounded-lg">
          <Icon className="w-6 h-6 text-selendra-500" />
        </div>
      </div>
    </div>
  );
}

interface CategoryStatsProps {
  title: string;
  stats: {
    label: string;
    value: string;
    subValue?: string;
  }[];
}

function CategoryStats({ title, stats }: CategoryStatsProps) {
  return (
    <div className="bg-background-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-foreground-secondary">{stat.label}</span>
            <div className="text-right">
              <span className="font-semibold text-foreground">
                {stat.value}
              </span>
              {stat.subValue && (
                <span className="text-xs text-foreground-secondary ml-2">
                  {stat.subValue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TopListProps {
  title: string;
  items: {
    rank: number;
    name: string;
    value: string;
    change?: number;
  }[];
  valueLabel: string;
}

function TopList({ title, items, valueLabel }: TopListProps) {
  return (
    <div className="bg-background-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.rank}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover transition-colors"
          >
            <span
              className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                item.rank === 1 && "bg-yellow-500/20 text-yellow-500",
                item.rank === 2 && "bg-gray-500/20 text-foreground-secondary",
                item.rank === 3 && "bg-orange-500/20 text-orange-500",
                item.rank > 3 &&
                  "bg-background-secondary text-foreground-secondary",
              )}
            >
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-selendra-500 truncate">
                {item.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {item.value}
              </p>
              {item.change !== undefined && (
                <p
                  className={clsx(
                    "text-xs",
                    item.change >= 0 ? "text-green-500" : "text-red-500",
                  )}
                >
                  {item.change >= 0 ? "+" : ""}
                  {item.change}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-foreground-secondary mt-4 text-center">
        {valueLabel}
      </p>
    </div>
  );
}

// Mock data - TODO: Replace with real data from indexer
const networkStats = {
  totalTransactions: "45,892,341",
  totalBlocks: "3,456,789",
  totalAccounts: "1,234,567",
  totalContracts: "23,456",
  avgBlockTime: "1.0s", // Updated to match Selendra's actual 1s block time
  avgGasPrice: "25 Gwei",
  tps: "N/A", // TPS varies based on transaction complexity; no fixed maximum
  networkUtilization: "67.8%",
};

const vmStats = {
  wasm: {
    contracts: "8,234",
    transactions: "12,456,789",
    avgGas: "450,000",
  },
  evm: {
    contracts: "15,222",
    transactions: "33,435,552",
    avgGas: "21,000",
  },
};

const tokenStats = {
  erc20: "3,456",
  erc721: "892",
  erc1155: "234",
  totalTransfers: "89,234,567",
};

const topGasConsumers = [
  {
    rank: 1,
    name: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    value: "2.4M SEL",
    change: 12.5,
  },
  {
    rank: 2,
    name: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    value: "1.8M SEL",
    change: -5.2,
  },
  {
    rank: 3,
    name: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    value: "1.2M SEL",
    change: 8.3,
  },
  {
    rank: 4,
    name: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    value: "890K SEL",
    change: 2.1,
  },
  {
    rank: 5,
    name: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    value: "654K SEL",
    change: -1.5,
  },
];

const topActiveContracts = [
  { rank: 1, name: "Selendra DEX Router", value: "234,567 txns", change: 15.2 },
  { rank: 2, name: "USDT Token", value: "189,432 txns", change: 8.7 },
  { rank: 3, name: "Wrapped SEL", value: "156,789 txns", change: 12.3 },
  { rank: 4, name: "NFT Marketplace", value: "98,456 txns", change: -3.2 },
  { rank: 5, name: "Staking Contract", value: "67,234 txns", change: 5.6 },
];

export function StatisticsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real tokenomics data
  const {
    totalSupply,
    circulatingSupply,
    stakedSupply,
    stakingRate,
    isLoading: tokenomicsLoading,
    refresh: refreshTokenomics,
  } = useTokenomics({
    refreshInterval: 60000,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshTokenomics();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Network Statistics
          </h1>
          <p className="text-foreground-secondary mt-1">
            Comprehensive blockchain metrics and analytics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-selendra-500 hover:bg-selendra-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw
            className={clsx("w-4 h-4", isRefreshing && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={networkStats.totalTransactions}
          change={5.2}
          changeLabel="vs last month"
          icon={Activity}
          trend="up"
        />
        <StatCard
          title="Total Blocks"
          value={networkStats.totalBlocks}
          change={2.1}
          changeLabel="vs last month"
          icon={Blocks}
          trend="up"
        />
        <StatCard
          title="Total Accounts"
          value={networkStats.totalAccounts}
          change={8.7}
          changeLabel="vs last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Contracts"
          value={networkStats.totalContracts}
          change={12.3}
          changeLabel="vs last month"
          icon={FileCode}
          trend="up"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Block Time"
          value={networkStats.avgBlockTime}
          icon={Clock}
          subtitle="Target: 6s"
        />
        <StatCard
          title="Average Gas Price"
          value={networkStats.avgGasPrice}
          change={-2.5}
          changeLabel="vs yesterday"
          icon={Fuel}
          trend="down"
        />
        <StatCard
          title="TPS (Transactions/sec)"
          value={networkStats.tps}
          change={3.2}
          changeLabel="vs yesterday"
          icon={Zap}
          trend="up"
        />
        <StatCard
          title="Network Utilization"
          value={networkStats.networkUtilization}
          icon={Cpu}
          subtitle="Block gas limit usage"
        />
      </div>

      {/* VM Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-purple-500/10 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Database className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              WASM Layer Statistics
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">Contracts</p>
              <p className="text-xl font-bold text-purple-500">
                {vmStats.wasm.contracts}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Transactions</p>
              <p className="text-xl font-bold text-purple-500">
                {vmStats.wasm.transactions}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Avg Gas</p>
              <p className="text-xl font-bold text-purple-500">
                {vmStats.wasm.avgGas}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              EVM Layer Statistics
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">Contracts</p>
              <p className="text-xl font-bold text-blue-500">
                {vmStats.evm.contracts}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Transactions</p>
              <p className="text-xl font-bold text-blue-500">
                {vmStats.evm.transactions}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Avg Gas</p>
              <p className="text-xl font-bold text-blue-500">
                {vmStats.evm.avgGas}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Token Statistics and Category Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryStats
          title="Token Statistics"
          stats={[
            { label: "ERC-20 Tokens", value: tokenStats.erc20 },
            { label: "ERC-721 (NFT) Collections", value: tokenStats.erc721 },
            { label: "ERC-1155 Collections", value: tokenStats.erc1155 },
            {
              label: "Total Token Transfers",
              value: tokenStats.totalTransfers,
            },
          ]}
        />
        <CategoryStats
          title="Block Statistics"
          stats={[
            { label: "Average Block Size", value: "45.2 KB" },
            { label: "Avg Txns per Block", value: "87.3" },
            { label: "Uncles/Ommers", value: "234" },
            {
              label: "Finalized Blocks",
              value: "3,456,750",
              subValue: "99.99%",
            },
          ]}
        />
        <CategoryStats
          title="Network Health"
          stats={[
            { label: "Active Validators", value: "128" },
            {
              label: "Total Staked",
              value: tokenomicsLoading ? "..." : `${stakedSupply} SEL`,
            },
            {
              label: "Staking Rate",
              value: tokenomicsLoading ? "..." : `${stakingRate.toFixed(1)}%`,
            },
            {
              label: "Total Supply",
              value: tokenomicsLoading ? "..." : `${totalSupply} SEL`,
            },
          ]}
        />
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopList
          title="Top Gas Consumers (24h)"
          items={topGasConsumers}
          valueLabel="Gas spent in last 24 hours"
        />
        <TopList
          title="Most Active Contracts (24h)"
          items={topActiveContracts}
          valueLabel="Transaction count in last 24 hours"
        />
      </div>

      {/* Historical Milestones */}
      <div className="bg-background-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Network Milestones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: "Genesis Block", date: "Jan 1, 2024" },
            { label: "1M Transactions", date: "Feb 15, 2024" },
            { label: "10K Accounts", date: "Mar 1, 2024" },
            { label: "100K Accounts", date: "Apr 20, 2024" },
            { label: "10M Transactions", date: "Jun 10, 2024" },
            { label: "1M Accounts", date: "Aug 5, 2024" },
          ].map((milestone, idx) => (
            <div
              key={idx}
              className="text-center p-3 bg-background-secondary rounded-lg"
            >
              <p className="text-xs text-foreground-secondary mb-1">
                {milestone.date}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {milestone.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-foreground-secondary">
        <p>
          Statistics are updated every 15 minutes. Last updated:{" "}
          <span className="font-medium" suppressHydrationWarning>
            {new Date().toLocaleString()}
          </span>
        </p>
      </div>
    </div>
  );
}
