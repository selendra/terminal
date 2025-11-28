"use client";

import { Wallet, Users, Coins, FileText, ArrowUpRight } from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import Link from "next/link";

interface QuickStat {
  title: string;
  value: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export function QuickStats() {
  const { isConnected } = useBlockchain();

  const stats: QuickStat[] = [
    {
      title: "Total Accounts",
      value: "125.4K",
      icon: <Users className="h-5 w-5" />,
      href: "/accounts",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      title: "Total Contracts",
      value: "8,542",
      icon: <FileText className="h-5 w-5" />,
      href: "/contracts",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Total Tokens",
      value: "342",
      icon: <Coins className="h-5 w-5" />,
      href: "/tokens",
      color: "text-yellow-400 bg-yellow-500/10",
    },
    {
      title: "Staked SEL",
      value: "245.2M",
      icon: <Wallet className="h-5 w-5" />,
      href: "/staking",
      color: "text-green-400 bg-green-500/10",
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
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Network Health */}
      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-3">Network Health</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Staking Rate</span>
              <span className="text-xs text-foreground">72%</span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-selendra-500 rounded-full"
                style={{ width: "72%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Network Load</span>
              <span className="text-xs text-foreground">34%</span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full"
                style={{ width: "34%" }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-foreground-secondary">Validator Performance</span>
              <span className="text-xs text-foreground">98.5%</span>
            </div>
            <div className="h-1.5 bg-background-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: "98.5%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
