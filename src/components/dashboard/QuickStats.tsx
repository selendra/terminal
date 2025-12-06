"use client";

import { Wallet, Users, Coins, FileText, ArrowUpRight } from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useIndexerTokens, useIndexerContracts } from "@/lib/hooks/useIndexer";
import { useStakingStats } from "@/lib/hooks/useStaking";
import { Skeleton } from "@/components/common/Skeleton";
import Link from "next/link";

interface QuickStat {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  isLoading?: boolean;
}

function formatLargeNumber(num: number | bigint): string {
  const n = typeof num === 'bigint' ? Number(num) : num;
  if (n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(1)}B`;
  }
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString();
}

export function QuickStats() {
  const { isConnected } = useBlockchain();
  
  // Fetch real data from indexer and chain
  const { data: tokensData, isLoading: tokensLoading } = useIndexerTokens();
  const { data: contractsData, isLoading: contractsLoading } = useIndexerContracts();
  const { stats: stakingStats, isLoading: stakingLoading } = useStakingStats();

  // TODO: Add useIndexerAccounts hook when available
  const accountsLoading = false;
  const totalAccounts: number | null = null; // Will be fetched from indexer

  const stats: QuickStat[] = [
    {
      title: "Total Accounts",
      value: totalAccounts !== null ? formatLargeNumber(totalAccounts) : "---",
      icon: <Users className="h-5 w-5" />,
      href: "/accounts",
      color: "text-purple-400 bg-purple-500/10",
      isLoading: accountsLoading,
    },
    {
      title: "Total Contracts",
      value: contractsData?.contracts?.length !== undefined 
        ? formatLargeNumber(contractsData.contracts.length) 
        : "---",
      icon: <FileText className="h-5 w-5" />,
      href: "/contracts",
      color: "text-blue-400 bg-blue-500/10",
      isLoading: contractsLoading,
    },
    {
      title: "Total Tokens",
      value: tokensData?.tokens?.length !== undefined 
        ? formatLargeNumber(tokensData.tokens.length) 
        : "---",
      icon: <Coins className="h-5 w-5" />,
      href: "/tokens",
      color: "text-yellow-400 bg-yellow-500/10",
      isLoading: tokensLoading,
    },
    {
      title: "Staked SEL",
      value: stakingStats?.totalStaked !== undefined 
        ? formatLargeNumber(stakingStats.totalStaked) 
        : "---",
      icon: <Wallet className="h-5 w-5" />,
      href: "/staking",
      color: "text-green-400 bg-green-500/10",
      isLoading: stakingLoading,
    },
  ];

  return (
    <div className="card h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
      <div className="space-y-3">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-background-hover transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-sm text-foreground-secondary">{stat.title}</p>
                {stat.isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                )}
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Network Health - Using real staking data where available */}
      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-3">Network Health</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Staking Rate</span>
              <span className="text-xs text-foreground">
                {stakingStats?.stakingRate !== undefined 
                  ? `${stakingStats.stakingRate.toFixed(0)}%` 
                  : "---"}
              </span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-selendra-500 rounded-full transition-all"
                style={{ width: stakingStats?.stakingRate !== undefined 
                  ? `${stakingStats.stakingRate}%` 
                  : "0%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Network Load</span>
              <span className="text-xs text-foreground">---</span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full"
                style={{ width: "0%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Validator Performance</span>
              <span className="text-xs text-foreground">---</span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
