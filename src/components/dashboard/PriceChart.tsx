"use client";

import { TrendingUp, Clock, BarChart3 } from "lucide-react";
import { useTokenomics } from "@/lib/hooks/useTokenomics";

// SEL is not yet listed on exchanges - show placeholder until listing
const IS_LISTED_ON_EXCHANGE = false; // TODO: Set to true when SEL is listed

export function PriceChart() {
  // Fetch real tokenomics data
  const { totalSupply, circulatingSupply, isLoading: supplyLoading } = useTokenomics({
    refreshInterval: 300000, // 5 minutes
  });

  // Show "Coming Soon" placeholder until SEL is listed
  if (!IS_LISTED_ON_EXCHANGE) {
    return (
      <div className="card h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">SEL Price</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Not Listed Yet
              </span>
            </div>
          </div>
        </div>

        {/* Placeholder chart area */}
        <div className="relative h-48 flex flex-col items-center justify-center bg-background-secondary/30 rounded-lg border border-dashed border-border">
          <BarChart3 className="h-12 w-12 text-foreground-secondary/30 mb-3" />
          <p className="text-foreground-secondary text-sm font-medium">Price Chart Coming Soon</p>
          <p className="text-foreground-secondary/60 text-xs mt-1">
            Price data will be available after exchange listing
          </p>
        </div>

        {/* Supply information - this is real data */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <span className="text-xs text-foreground-secondary">Market Cap</span>
            <p className="text-sm font-medium text-foreground">---</p>
          </div>
          <div>
            <span className="text-xs text-foreground-secondary">24h Volume</span>
            <p className="text-sm font-medium text-foreground">---</p>
          </div>
          <div>
            <span className="text-xs text-foreground-secondary">Circulating Supply</span>
            <p className="text-sm font-medium text-foreground">
              {supplyLoading ? "..." : circulatingSupply ? `${circulatingSupply} SEL` : "---"}
            </p>
          </div>
          <div>
            <span className="text-xs text-foreground-secondary">Total Supply</span>
            <p className="text-sm font-medium text-foreground">
              {supplyLoading ? "..." : totalSupply ? `${totalSupply} SEL` : "---"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // TODO: Implement real price chart when SEL is listed
  return null;
}
