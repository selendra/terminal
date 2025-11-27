"use client";

import {
  Activity,
  Blocks,
  Clock,
  Cpu,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
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
    latestEvmBlock,
    substrateChainInfo,
    evmChainInfo,
    networkStats,
  } = useBlockchain();

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
      title: "Substrate Block",
      value: latestSubstrateBlock?.number?.toLocaleString() || "---",
      icon: <Blocks className="h-5 w-5" />,
      subValue: `Hash: ${
        latestSubstrateBlock?.hash
          ? `${latestSubstrateBlock.hash.slice(0, 10)}...`
          : "---"
      }`,
    },
    {
      title: "EVM Block",
      value: latestEvmBlock?.number?.toLocaleString() || "---",
      icon: <Cpu className="h-5 w-5" />,
      subValue: evmChainInfo ? `Chain ID: ${evmChainInfo.chainId}` : "---",
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
          <h1 className="text-2xl font-bold text-white">
            Selendra <span className="gradient-text">Terminal</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            The ultimate gateway to Selendra blockchain
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Substrate network badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <div
              className={clsx(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-purple-400 animate-pulse" : "bg-gray-500"
              )}
            />
            <span className="text-xs text-purple-400 font-medium">
              Substrate: {substrateChainInfo?.name || "Connecting..."}
            </span>
          </div>
          {/* EVM network badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <div
              className={clsx(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-orange-400 animate-pulse" : "bg-gray-500"
              )}
            />
            <span className="text-xs text-orange-400 font-medium">
              EVM: {evmChainInfo?.name || "Connecting..."}
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
                    stat.changeType === "neutral" && "bg-gray-500/10 text-gray-400"
                  )}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-1">{stat.title}</h3>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              {stat.subValue && (
                <p className="text-xs text-gray-500 mt-1 truncate">
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
