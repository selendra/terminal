"use client";

import {
  Activity,
  Blocks,
  Clock,
  Cpu,
  Zap,
  Users,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import {
  useSELPrice,
  formatPrice,
  formatMarketCap,
  formatPriceChange,
} from "@/lib/hooks/usePriceData";
import { useNetworkStats } from "@/lib/hooks/useNetworkStats";
import { useTransactionStats } from "@/lib/hooks/useNetworkStats";
import { clsx } from "clsx";
import { Skeleton } from "@/components/common/Skeleton";

interface StatCard {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  subValue?: string;
  isLoading?: boolean;
}

export function NetworkOverview() {
  const {
    isConnected,
    latestSubstrateBlock,
    substrateChainInfo,
    evmChainInfo,
  } = useBlockchain();

  // Fetch real price data
  const {
    price,
    priceChangePercent24h,
    marketCap,
    isLoading: priceLoading,
  } = useSELPrice({ refreshInterval: 60000 });

  // Fetch network stats
  const { stats: networkStats, isLoading: statsLoading } = useNetworkStats({
    refreshInterval: 10000,
  });

  // Fetch transaction stats
  const {
    totalTransactions,
    tps,
    isLoading: txStatsLoading,
  } = useTransactionStats({ refreshInterval: 30000 });

  // In Selendra, EVM and Substrate share the same block height
  const currentBlock = latestSubstrateBlock?.number;
  const blockHash = latestSubstrateBlock?.hash;

  // Format values with loading states
  const formatValue = (
    value: string | number | null | undefined,
    isLoading: boolean,
  ): string => {
    if (isLoading) return "---";
    if (value === null || value === undefined) return "---";
    return String(value);
  };

  const stats: StatCard[] = [
    {
      title: "SEL Price",
      value: price !== null ? formatPrice(price) : "---",
      change:
        priceChangePercent24h !== null
          ? formatPriceChange(priceChangePercent24h)
          : undefined,
      changeType:
        priceChangePercent24h !== null
          ? priceChangePercent24h >= 0
            ? "positive"
            : "negative"
          : undefined,
      icon: <TrendingUp className="h-5 w-5" />,
      subValue:
        marketCap !== null
          ? `Market Cap: ${formatMarketCap(marketCap)}`
          : "Market Cap: ---",
      isLoading: priceLoading,
    },
    {
      title: "Block Height",
      value: currentBlock?.toLocaleString() || "---",
      icon: <Blocks className="h-5 w-5" />,
      subValue: `Hash: ${blockHash ? `${blockHash.slice(0, 10)}...` : "---"}`,
      isLoading: !isConnected,
    },
    {
      title: "EVM Chain ID",
      value:
        evmChainInfo?.chainId?.toString() ||
        networkStats?.evmChainId?.toString() ||
        "1961",
      icon: <Cpu className="h-5 w-5" />,
      subValue: "Unified EVM + Substrate",
      isLoading: statsLoading && !evmChainInfo,
    },
    {
      title: "Block Time",
      value: networkStats?.blockTime ? `${networkStats.blockTime}s` : "1s",
      icon: <Clock className="h-5 w-5" />,
      subValue: "Instant finality (AlephBFT)",
      isLoading: false,
    },
    {
      title: "Transactions",
      value:
        totalTransactions !== null
          ? formatLargeNumber(totalTransactions)
          : "---",
      change: undefined, // Could add 24h change if available
      changeType: undefined,
      icon: <Activity className="h-5 w-5" />,
      subValue: "Total transactions",
      isLoading: txStatsLoading,
    },
    {
      title: "Active Validators",
      value: formatValue(networkStats?.activeValidators, statsLoading),
      icon: <Users className="h-5 w-5" />,
      subValue:
        networkStats?.activeValidators === 4
          ? "Phase 1 - Core team validators"
          : `Total: ${networkStats?.totalValidators || "---"}`,
      isLoading: statsLoading,
    },
    {
      title: "Gas Price",
      value: networkStats?.gasPrice || "0.1 Gwei",
      change: undefined,
      changeType: undefined,
      icon: <Zap className="h-5 w-5" />,
      subValue: "Est. $0.00025/tx",
      isLoading: statsLoading,
    },
    {
      title: "TPS",
      value: tps !== null ? formatTPS(tps) : "2,000+",
      icon: <TrendingUp className="h-5 w-5" />,
      subValue: "Transactions per second",
      isLoading: txStatsLoading,
    },
  ];

  return (
    <div>
      {/* Network status banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selendra <span className="gradient-text">Terminal</span>
          </h1>
          <p className="text-foreground-secondary text-sm mt-1">
            The ultimate gateway to Selendra blockchain
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Unified network badge - Selendra supports both VMs on same chain */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-selendra-500/10 border border-selendra-500/20">
            <div
              className={clsx(
                "h-2 w-2 rounded-full",
                isConnected
                  ? "bg-selendra-400 animate-pulse"
                  : "bg-foreground-secondary",
              )}
            />
            <span className="text-xs text-selendra-400 font-medium">
              {substrateChainInfo?.name || "Connecting..."}
            </span>
          </div>
          {/* VM support badges */}
          <div className="hidden md:flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Substrate
            </span>
            <span className="px-2 py-1 text-xs rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
              EVM
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="card card-hover group cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-selendra-500/10 text-selendra-400 group-hover:bg-selendra-500/20 transition-colors">
                {stat.icon}
              </div>
              {stat.change && (
                <span
                  className={clsx(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    stat.changeType === "positive" &&
                      "bg-accent-green/10 text-accent-green",
                    stat.changeType === "negative" &&
                      "bg-accent-red/10 text-accent-red",
                    stat.changeType === "neutral" &&
                      "bg-foreground-secondary/10 text-foreground-secondary",
                  )}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm text-foreground-secondary mb-1">
                {stat.title}
              </h3>
              {stat.isLoading ? (
                <Skeleton className="h-7 w-24 mb-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">
                  {stat.value}
                </p>
              )}
              {stat.subValue && (
                <p className="text-xs text-foreground-secondary mt-1 truncate">
                  {stat.subValue}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format large numbers with abbreviations
 */
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format TPS for display
 */
function formatTPS(tps: number): string {
  if (tps >= 1000) {
    return `${(tps / 1000).toFixed(1)}K+`;
  }
  return `${tps.toFixed(0)}+`;
}
