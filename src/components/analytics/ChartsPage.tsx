"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Blocks,
  FileText,
  Coins,
  Clock,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

// Time range options
type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

// Chart data point interface
interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Mock chart data generators
const generateMockData = (days: number, baseValue: number, variance: number): ChartDataPoint[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: baseValue + Math.random() * variance - variance / 2 + (i / days) * variance * 0.3,
    };
  });
};

// Simple area chart component
const AreaChart: React.FC<{
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  title?: string;
}> = ({ data, color = "#0db0a4", height = 200, showGrid = true, title }) => {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M0,100 L${data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" L")} L100,100 Z`;

  return (
    <div className="relative" style={{ height }}>
      {title && (
        <div className="absolute top-0 left-0 text-sm font-medium text-foreground">
          {title}
        </div>
      )}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showGrid && (
          <>
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </>
        )}
        <path d={areaPath} fill={`url(#gradient-${color.replace("#", "")})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Y axis labels */}
      <div className="absolute top-0 right-0 text-xs text-foreground-secondary">
        {max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div className="absolute bottom-0 right-0 text-xs text-foreground-secondary">
        {min.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
};

// Bar chart component
const BarChartComponent: React.FC<{
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}> = ({ data, color = "#0db0a4", height = 200 }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="flex items-end gap-1 h-full" style={{ height }}>
      {data.map((point, idx) => (
        <div
          key={idx}
          className="flex-1 flex flex-col items-center gap-1 group"
        >
          <div
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{
              height: `${(point.value / maxValue) * 100}%`,
              backgroundColor: color,
            }}
            title={`${point.date}: ${point.value.toLocaleString()}`}
          />
          {idx % Math.ceil(data.length / 7) === 0 && (
            <span className="text-xs text-foreground-secondary truncate max-w-full">
              {point.date}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Pie chart component (simple)
const SimplePieChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size = 200 }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  let currentAngle = 0;

  const paths = data.map((d) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const start = polarToCartesian(50, 50, 40, startAngle);
    const end = polarToCartesian(50, 50, 40, endAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;

    return {
      path: `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`,
      color: d.color,
      label: d.label,
      percentage,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {paths.map((p, idx) => (
          <path key={idx} d={p.path} fill={p.color} className="hover:opacity-80 transition-opacity" />
        ))}
        <circle cx="50" cy="50" r="25" className="fill-background-card" />
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
            <span className="text-sm text-foreground-secondary">{d.label}</span>
            <span className="text-sm font-medium">{((d.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function for pie chart
const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const angleRad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

export const ChartsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getDays = (range: TimeRange): number => {
    switch (range) {
      case "24h": return 24;
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
      case "1y": return 365;
      case "all": return 365;
      default: return 30;
    }
  };

  // Generate mock data
  const days = getDays(timeRange);
  const transactionData = generateMockData(days, 50000, 20000);
  const uniqueAddressData = generateMockData(days, 15000, 5000);
  const gasPriceData = generateMockData(days, 25, 15);
  const tvlData = generateMockData(days, 50000000, 20000000);
  const blockTimeData = generateMockData(days, 6, 0.5);

  // Stats summary
  const stats = [
    {
      label: "Total Transactions",
      value: "12.5M",
      change: "+12.3%",
      isPositive: true,
      icon: FileText,
    },
    {
      label: "Unique Addresses",
      value: "856K",
      change: "+8.7%",
      isPositive: true,
      icon: Users,
    },
    {
      label: "Total Blocks",
      value: "1.23M",
      change: "+2.1%",
      isPositive: true,
      icon: Blocks,
    },
    {
      label: "Avg Gas Price",
      value: "2.5 Gwei",
      change: "-5.2%",
      isPositive: true,
      icon: Activity,
    },
  ];

  // Token distribution mock data
  const tokenDistribution = [
    { label: "Staked", value: 45, color: "#0db0a4" },
    { label: "Circulating", value: 35, color: "#6366f1" },
    { label: "Treasury", value: 15, color: "#f59e0b" },
    { label: "Team", value: 5, color: "#ef4444" },
  ];

  // Transaction types mock data
  const txTypeDistribution = [
    { label: "Transfers", value: 40, color: "#0db0a4" },
    { label: "Contract Calls", value: 30, color: "#6366f1" },
    { label: "Swaps", value: 20, color: "#f59e0b" },
    { label: "Other", value: 10, color: "#94a3b8" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-selendra-400" />
            Network Charts & Statistics
          </h1>
          <p className="text-foreground-secondary mt-1">
            Comprehensive analytics and historical data for Selendra Network
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-background-secondary rounded-lg p-1">
            {(["24h", "7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  timeRange === range
                    ? "bg-selendra-600 text-white"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-background-secondary rounded-lg hover:bg-background-hover transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-background-secondary rounded-lg hover:bg-background-hover transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-background-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-foreground-secondary text-sm">{stat.label}</span>
                <Icon className="w-5 h-5 text-selendra-400" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span
                  className={`flex items-center gap-1 text-sm ${
                    stat.isPositive ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions Chart */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-selendra-400" />
              Daily Transactions
            </h3>
            <Link
              href="/transactions"
              className="text-sm text-selendra-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <AreaChart data={transactionData} color="#0db0a4" height={220} />
          <div className="flex justify-between mt-4 text-xs text-foreground-secondary">
            <span>{transactionData[0]?.date}</span>
            <span>{transactionData[transactionData.length - 1]?.date}</span>
          </div>
        </div>

        {/* Unique Addresses Chart */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Active Addresses
            </h3>
            <Link
              href="/accounts"
              className="text-sm text-selendra-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <AreaChart data={uniqueAddressData} color="#a855f7" height={220} />
          <div className="flex justify-between mt-4 text-xs text-foreground-secondary">
            <span>{uniqueAddressData[0]?.date}</span>
            <span>{uniqueAddressData[uniqueAddressData.length - 1]?.date}</span>
          </div>
        </div>

        {/* Gas Price Chart */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              Average Gas Price (Gwei)
            </h3>
            <Link
              href="/gas"
              className="text-sm text-selendra-400 hover:underline flex items-center gap-1"
            >
              Gas Tracker <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <BarChartComponent data={gasPriceData} color="#f59e0b" height={220} />
        </div>

        {/* TVL Chart */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5 text-green-400" />
              Total Value Locked (TVL)
            </h3>
            <Link
              href="/defi"
              className="text-sm text-selendra-400 hover:underline flex items-center gap-1"
            >
              DeFi Dashboard <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <AreaChart data={tvlData} color="#4ade80" height={220} />
          <div className="flex justify-between mt-4 text-xs text-foreground-secondary">
            <span>{tvlData[0]?.date}</span>
            <span>{tvlData[tvlData.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Distribution */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-selendra-400" />
            SEL Token Distribution
          </h3>
          <SimplePieChart data={tokenDistribution} />
        </div>

        {/* Transaction Types */}
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Transaction Types
          </h3>
          <SimplePieChart data={txTypeDistribution} />
        </div>
      </div>

      {/* Block Time Chart */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Average Block Time (seconds)
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">Target:</span>
              <span className="font-medium">6.0s</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">Current Avg:</span>
              <span className="font-medium text-green-400">5.98s</span>
            </div>
          </div>
        </div>
        <AreaChart data={blockTimeData} color="#3b82f6" height={180} />
        <div className="flex justify-between mt-4 text-xs text-foreground-secondary">
          <span>{blockTimeData[0]?.date}</span>
          <span>{blockTimeData[blockTimeData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/tokens"
          className="bg-gradient-to-r from-selendra-600/10 to-purple-600/10 border border-selendra-500/20 rounded-xl p-5 hover:border-selendra-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Token Analytics</h4>
              <p className="text-sm text-foreground-secondary mt-1">
                Explore token metrics and holders
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-selendra-400" />
          </div>
        </Link>
        <Link
          href="/contracts"
          className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Smart Contracts</h4>
              <p className="text-sm text-foreground-secondary mt-1">
                View verified contracts and ABIs
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-purple-400" />
          </div>
        </Link>
        <Link
          href="/validators"
          className="bg-gradient-to-r from-blue-600/10 to-green-600/10 border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Validator Stats</h4>
              <p className="text-sm text-foreground-secondary mt-1">
                Network validators and staking
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-blue-400" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ChartsPage;
