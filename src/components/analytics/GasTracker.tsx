"use client";

import React, { useState, useEffect } from "react";
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Activity,
  BarChart3,
  RefreshCw,
  Info,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Flame,
  Timer,
} from "lucide-react";

// Gas price tiers
interface GasTier {
  label: string;
  icon: React.ReactNode;
  price: string;
  priceGwei: number;
  time: string;
  color: string;
  bgColor: string;
  description: string;
}

// Historical gas data point
interface GasHistoryPoint {
  timestamp: number;
  low: number;
  average: number;
  high: number;
}

// Gas price estimation
interface GasEstimate {
  action: string;
  gasLimit: number;
  estimatedCost: string;
  estimatedCostUSD: string;
}

// Network stats
interface NetworkStats {
  baseFee: string;
  priorityFee: string;
  pendingTxns: number;
  lastBlock: number;
  blockTime: string;
  gasUsedRatio: number;
  burnedFees24h: string;
}

// Generate mock gas history data
const generateGasHistory = (hours: number): GasHistoryPoint[] => {
  return Array.from({ length: hours }, (_, i) => {
    const basePrice = 25 + Math.sin(i / 6) * 10 + Math.random() * 5;
    return {
      timestamp: Date.now() - (hours - i - 1) * 60 * 60 * 1000,
      low: Math.max(10, basePrice - 5 - Math.random() * 3),
      average: basePrice,
      high: basePrice + 10 + Math.random() * 10,
    };
  });
};

// Gas History Chart Component
const GasHistoryChart: React.FC<{ data: GasHistoryPoint[]; height?: number }> = ({
  data,
  height = 200,
}) => {
  if (data.length === 0) return null;

  const allValues = data.flatMap((d) => [d.low, d.average, d.high]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 100;
  };

  const lowPoints = data.map((d, i) => `${(i / (data.length - 1)) * 100},${getY(d.low)}`).join(" ");
  const avgPoints = data.map((d, i) => `${(i / (data.length - 1)) * 100},${getY(d.average)}`).join(" ");
  const highPoints = data.map((d, i) => `${(i / (data.length - 1)) * 100},${getY(d.high)}`).join(" ");

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* High line (red) */}
        <polyline
          points={highPoints}
          fill="none"
          stroke="#f87171"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="2,2"
        />
        {/* Average line (yellow) */}
        <polyline
          points={avgPoints}
          fill="none"
          stroke="#facc15"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Low line (green) */}
        <polyline
          points={lowPoints}
          fill="none"
          stroke="#4ade80"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="2,2"
        />
      </svg>
      {/* Legend */}
      <div className="absolute bottom-0 left-0 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-400 rounded"></span>
          <span className="text-foreground-secondary">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-yellow-400 rounded"></span>
          <span className="text-foreground-secondary">Average</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-400 rounded dashed"></span>
          <span className="text-foreground-secondary">High</span>
        </div>
      </div>
      {/* Y-axis labels */}
      <div className="absolute top-0 right-0 text-xs text-foreground-secondary">
        {maxValue.toFixed(0)} Gwei
      </div>
      <div className="absolute bottom-6 right-0 text-xs text-foreground-secondary">
        {minValue.toFixed(0)} Gwei
      </div>
    </div>
  );
};

// Block Fill Meter Component
const BlockFillMeter: React.FC<{ percentage: number }> = ({ percentage }) => {
  const getColor = () => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="relative w-full h-4 bg-background-secondary rounded-full overflow-hidden">
      <div
        className={`h-full ${getColor()} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {percentage.toFixed(1)}% Full
      </div>
    </div>
  );
};

export const GasTracker: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<"1h" | "24h" | "7d">("24h");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showGasCalculator, setShowGasCalculator] = useState(false);
  const [customGasLimit, setCustomGasLimit] = useState("21000");

  // Mock current gas prices
  const [gasTiers] = useState<GasTier[]>([
    {
      label: "🐢 Low",
      icon: <Timer className="w-5 h-5" />,
      price: "15",
      priceGwei: 15,
      time: "~10 min",
      color: "text-green-400",
      bgColor: "bg-green-500/10 border-green-500/20",
      description: "For non-urgent transactions",
    },
    {
      label: "🚗 Standard",
      icon: <Activity className="w-5 h-5" />,
      price: "25",
      priceGwei: 25,
      time: "~3 min",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10 border-yellow-500/20",
      description: "Balanced speed and cost",
    },
    {
      label: "🚀 Fast",
      icon: <Zap className="w-5 h-5" />,
      price: "35",
      priceGwei: 35,
      time: "~30 sec",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10 border-orange-500/20",
      description: "For time-sensitive transactions",
    },
    {
      label: "⚡ Instant",
      icon: <Flame className="w-5 h-5" />,
      price: "50",
      priceGwei: 50,
      time: "Next block",
      color: "text-red-400",
      bgColor: "bg-red-500/10 border-red-500/20",
      description: "Highest priority",
    },
  ]);

  // Mock network stats
  const [networkStats] = useState<NetworkStats>({
    baseFee: "12.5 Gwei",
    priorityFee: "2.5 Gwei",
    pendingTxns: 1234,
    lastBlock: 1234567,
    blockTime: "6.0s",
    gasUsedRatio: 78.5,
    burnedFees24h: "1,234 SEL",
  });

  // Mock gas estimates for common actions
  const gasEstimates: GasEstimate[] = [
    {
      action: "SEL Transfer",
      gasLimit: 21000,
      estimatedCost: "0.000525 SEL",
      estimatedCostUSD: "$0.012",
    },
    {
      action: "ERC-20 Transfer",
      gasLimit: 65000,
      estimatedCost: "0.001625 SEL",
      estimatedCostUSD: "$0.038",
    },
    {
      action: "ERC-20 Approve",
      gasLimit: 45000,
      estimatedCost: "0.001125 SEL",
      estimatedCostUSD: "$0.026",
    },
    {
      action: "NFT Transfer",
      gasLimit: 85000,
      estimatedCost: "0.002125 SEL",
      estimatedCostUSD: "$0.050",
    },
    {
      action: "Uniswap Swap",
      gasLimit: 150000,
      estimatedCost: "0.00375 SEL",
      estimatedCostUSD: "$0.088",
    },
    {
      action: "Contract Deployment",
      gasLimit: 1500000,
      estimatedCost: "0.0375 SEL",
      estimatedCostUSD: "$0.88",
    },
  ];

  // Generate mock history based on timeframe
  const getHistoryData = (): GasHistoryPoint[] => {
    switch (timeframe) {
      case "1h":
        return generateGasHistory(12); // 5 min intervals
      case "24h":
        return generateGasHistory(24); // hourly
      case "7d":
        return generateGasHistory(168); // hourly for 7 days
      default:
        return generateGasHistory(24);
    }
  };

  const [historyData, setHistoryData] = useState<GasHistoryPoint[]>(getHistoryData());

  useEffect(() => {
    setHistoryData(getHistoryData());
  }, [timeframe]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setHistoryData(getHistoryData());
      setIsRefreshing(false);
    }, 1000);
  };

  // Calculate custom gas cost
  const calculateCustomGas = (gwei: number) => {
    const gasLimit = parseInt(customGasLimit) || 21000;
    const costInSel = (gasLimit * gwei * 1e-9).toFixed(6);
    const costInUSD = (parseFloat(costInSel) * 0.0234).toFixed(4);
    return { costInSel, costInUSD };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fuel className="w-7 h-7 text-selendra-400" />
            Gas Tracker
          </h1>
          <p className="text-foreground-secondary mt-1">
            Real-time gas prices and network statistics for Selendra
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-background-secondary rounded-lg hover:bg-background-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Gas Price Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gasTiers.map((tier, idx) => (
          <div
            key={idx}
            className={`${tier.bgColor} border rounded-xl p-5 relative overflow-hidden`}
          >
            {idx === 1 && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-selendra-600 text-white text-xs rounded-full">
                Recommended
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className={tier.color}>{tier.icon}</span>
              <span className="font-medium">{tier.label}</span>
            </div>
            <div className={`text-3xl font-bold ${tier.color}`}>
              {tier.price} <span className="text-lg font-normal">Gwei</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-foreground-secondary">
              <Clock className="w-4 h-4" />
              {tier.time}
            </div>
            <p className="text-xs text-foreground-secondary mt-2">{tier.description}</p>
          </div>
        ))}
      </div>

      {/* Network Stats & History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Stats */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-selendra-400" />
            Network Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Base Fee</span>
              <span className="font-mono">{networkStats.baseFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Priority Fee</span>
              <span className="font-mono">{networkStats.priorityFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Pending Txns</span>
              <span className="font-mono text-yellow-400">{networkStats.pendingTxns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Latest Block</span>
              <a href="#" className="font-mono text-selendra-400 hover:underline">
                #{networkStats.lastBlock.toLocaleString()}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Block Time</span>
              <span className="font-mono">{networkStats.blockTime}</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground-secondary">Block Gas Usage</span>
              </div>
              <BlockFillMeter percentage={networkStats.gasUsedRatio} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-foreground-secondary">Fees Burned (24h)</span>
              <span className="font-mono text-orange-400 flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {networkStats.burnedFees24h}
              </span>
            </div>
          </div>
        </div>

        {/* Gas Price History Chart */}
        <div className="lg:col-span-2 bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-selendra-400" />
              Gas Price History
            </h3>
            <div className="flex items-center gap-1">
              {(["1h", "24h", "7d"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    timeframe === tf
                      ? "bg-selendra-600 text-white"
                      : "bg-background-secondary text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <GasHistoryChart data={historyData} height={200} />
          <div className="flex justify-between mt-4 text-xs text-foreground-secondary">
            <span>{new Date(historyData[0]?.timestamp).toLocaleString()}</span>
            <span>{new Date(historyData[historyData.length - 1]?.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Gas Estimator */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-selendra-400" />
            Gas Estimator
          </h3>
          <button
            onClick={() => setShowGasCalculator(!showGasCalculator)}
            className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary rounded-lg text-sm hover:bg-background-hover transition-colors"
          >
            Custom Calculator
            <ChevronDown className={`w-4 h-4 transition-transform ${showGasCalculator ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Custom Gas Calculator */}
        {showGasCalculator && (
          <div className="p-4 bg-background-secondary border-b border-border">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm text-foreground-secondary mb-1">Gas Limit</label>
                <input
                  type="number"
                  value={customGasLimit}
                  onChange={(e) => setCustomGasLimit(e.target.value)}
                  className="w-40 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-selendra-500"
                  placeholder="21000"
                />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                {gasTiers.map((tier, idx) => {
                  const { costInSel, costInUSD } = calculateCustomGas(tier.priceGwei);
                  return (
                    <div key={idx} className="text-center p-2 bg-background rounded-lg">
                      <span className="text-sm text-foreground-secondary">{tier.label}</span>
                      <p className={`font-mono ${tier.color}`}>{costInSel} SEL</p>
                      <p className="text-xs text-foreground-secondary">${costInUSD}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Common Actions Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-secondary">
                <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Action
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                  Gas Limit
                </th>
                {gasTiers.map((tier, idx) => (
                  <th
                    key={idx}
                    className={`text-right px-4 py-3 text-sm font-medium ${tier.color}`}
                  >
                    {tier.label.split(" ")[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gasEstimates.map((estimate, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-background-hover">
                  <td className="px-4 py-3 font-medium">{estimate.action}</td>
                  <td className="px-4 py-3 text-right text-foreground-secondary font-mono">
                    {estimate.gasLimit.toLocaleString()}
                  </td>
                  {gasTiers.map((tier, tierIdx) => {
                    const cost = (estimate.gasLimit * tier.priceGwei * 1e-9).toFixed(6);
                    const costUSD = (parseFloat(cost) * 0.0234).toFixed(4);
                    return (
                      <td key={tierIdx} className="px-4 py-3 text-right">
                        <span className="font-mono">{cost}</span>
                        <br />
                        <span className="text-xs text-foreground-secondary">${costUSD}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gas Saving Tips */}
      <div className="bg-gradient-to-r from-selendra-600/10 to-purple-600/10 border border-selendra-500/20 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-selendra-400" />
          Gas Saving Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Time Your Transactions</p>
              <p className="text-xs text-foreground-secondary mt-1">
                Gas prices are typically lower during weekends and late nights (UTC).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Batch Transactions</p>
              <p className="text-xs text-foreground-secondary mt-1">
                Combine multiple operations into one transaction when possible.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Set Gas Limits Carefully</p>
              <p className="text-xs text-foreground-secondary mt-1">
                Don't overpay by setting excessive gas limits for simple transfers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasTracker;
