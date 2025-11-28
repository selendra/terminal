"use client";

import {
  Activity,
  Blocks,
  Clock,
  Cpu,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { clsx } from "clsx";

interface StatCard {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  subValue?: string;
}

export function NetworkOverview() {
  const {
    isConnected,
    latestSubstrateBlock,
    substrateChainInfo,
    evmChainInfo,
  } = useBlockchain();

  // In Selendra, EVM and Substrate share the same block height
  const currentBlock = latestSubstrateBlock?.number;
  const blockHash = latestSubstrateBlock?.hash;

  const stats: StatCard[] = [
    {
      title: "SEL Price",
      value: "$0.0245",
      change: "+3.2%",
      changeType: "positive",
      icon: <TrendingUp className="h-5 w-5" />,
      subValue: "Market Cap: $24.5M",
    },
    {
      title: "Block Height",
      value: currentBlock?.toLocaleString() || "---",
      icon: <Blocks className="h-5 w-5" />,
      subValue: `Hash: ${
        blockHash
          ? `${blockHash.slice(0, 10)}...`
          : "---"
      }`,
    },
    {
      title: "EVM Chain ID",
      value: evmChainInfo?.chainId?.toString() || "1961",
      icon: <Cpu className="h-5 w-5" />,
      subValue: "Unified EVM + Substrate",
    },
    {
      title: "Block Time",
      value: "1s",
      icon: <Clock className="h-5 w-5" />,
      subValue: "Instant finality (AlephBFT)",
    },
    {
      title: "Transactions",
      value: "3.2M",
      change: "+12.5%",
      changeType: "positive",
      icon: <Activity className="h-5 w-5" />,
      subValue: "Total transactions",
    },
    {
      title: "Active Validators",
      value: "4",
      icon: <Users className="h-5 w-5" />,
      subValue: "Phase 1 - Core team validators",
    },
    {
      title: "Gas Price",
      value: "0.1 Gwei",
      change: "-5%",
      changeType: "positive",
      icon: <Zap className="h-5 w-5" />,
      subValue: "Est. $0.00025/tx",
    },
    {
      title: "TPS",
      value: "2,000+",
      icon: <TrendingUp className="h-5 w-5" />,
      subValue: "Transactions per second",
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
                isConnected ? "bg-selendra-400 animate-pulse" : "bg-foreground-secondary"
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
                    stat.changeType === "neutral" && "bg-foreground-secondary/10 text-foreground-secondary"
                  )}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm text-foreground-secondary mb-1">{stat.title}</h3>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
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
