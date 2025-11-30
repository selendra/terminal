"use client";

import { NetworkOverview } from "./NetworkOverview";
import { LatestBlocks } from "./LatestBlocksLive";
import { LatestTransactions } from "./LatestTransactionsLive";
import { PriceChart } from "./PriceChart";
import { QuickStats } from "./QuickStats";
import { TransactionHistory } from "./TransactionHistory";

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <NetworkOverview />

      {/* Price and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChart />
        </div>
        <QuickStats />
      </div>

      {/* Transaction History Chart */}
      <TransactionHistory />

      {/* Latest Blocks and Transactions - Real-time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatestBlocks />
        <LatestTransactions />
      </div>
    </div>
  );
}
