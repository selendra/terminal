'use client';

import React, { useState, useEffect } from 'react';
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Timer,
  Activity,
  Info,
  RefreshCw,
  AlertCircle,
  BarChart3,
  ChevronDown,
  Flame,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GasPrice {
  slow: { price: number; time: string };
  standard: { price: number; time: string };
  fast: { price: number; time: string };
  instant: { price: number; time: string };
}

interface GasHistory {
  timestamp: string;
  price: number;
  low?: number;
  high?: number;
}

interface TransactionCost {
  type: string;
  gasLimit: number;
  slow: string;
  standard: string;
  fast: string;
}

interface NetworkStats {
  baseFee: string;
  priorityFee: string;
  pendingTxns: number;
  lastBlock: number;
  blockTime: string;
  gasUsedRatio: number;
}

const mockGasPrice: GasPrice = {
  slow: { price: 1.2, time: '~5 min' },
  standard: { price: 2.5, time: '~2 min' },
  fast: { price: 4.0, time: '~30 sec' },
  instant: { price: 6.0, time: '~10 sec' },
};

const mockHistory: GasHistory[] = [
  { timestamp: '00:00', price: 2.1, low: 1.5, high: 2.8 },
  { timestamp: '02:00', price: 1.8, low: 1.2, high: 2.4 },
  { timestamp: '04:00', price: 1.5, low: 1.0, high: 2.0 },
  { timestamp: '06:00', price: 2.0, low: 1.4, high: 2.6 },
  { timestamp: '08:00', price: 3.5, low: 2.8, high: 4.2 },
  { timestamp: '10:00', price: 4.2, low: 3.5, high: 5.0 },
  { timestamp: '12:00', price: 3.8, low: 3.0, high: 4.5 },
  { timestamp: '14:00', price: 2.9, low: 2.2, high: 3.6 },
  { timestamp: '16:00', price: 3.2, low: 2.5, high: 4.0 },
  { timestamp: '18:00', price: 4.5, low: 3.8, high: 5.5 },
  { timestamp: '20:00', price: 3.1, low: 2.4, high: 3.8 },
  { timestamp: '22:00', price: 2.5, low: 1.8, high: 3.2 },
];

const mockNetworkStats: NetworkStats = {
  baseFee: '1.8 Gwei',
  priorityFee: '0.7 Gwei',
  pendingTxns: 156,
  lastBlock: 1234567,
  blockTime: '6.0s',
  gasUsedRatio: 45.2,
};

const mockTransactionCosts: TransactionCost[] = [
  {
    type: 'SEL Transfer',
    gasLimit: 21000,
    slow: '$0.03',
    standard: '$0.05',
    fast: '$0.08',
  },
  {
    type: 'Token Transfer',
    gasLimit: 65000,
    slow: '$0.08',
    standard: '$0.16',
    fast: '$0.26',
  },
  {
    type: 'Token Swap',
    gasLimit: 150000,
    slow: '$0.18',
    standard: '$0.38',
    fast: '$0.60',
  },
  {
    type: 'NFT Transfer',
    gasLimit: 85000,
    slow: '$0.10',
    standard: '$0.21',
    fast: '$0.34',
  },
  {
    type: 'Add Liquidity',
    gasLimit: 200000,
    slow: '$0.24',
    standard: '$0.50',
    fast: '$0.80',
  },
  {
    type: 'Contract Deploy',
    gasLimit: 1500000,
    slow: '$1.80',
    standard: '$3.75',
    fast: '$6.00',
  },
];

// Block Fill Meter Component
const BlockFillMeter: React.FC<{ percentage: number }> = ({ percentage }) => {
  const getColor = () => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative w-full h-4 bg-selendra-dark rounded-full overflow-hidden">
      <div
        className={`h-full ${getColor()} transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
        {percentage.toFixed(1)}% Full
      </div>
    </div>
  );
};

export default function GasTracker() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'standard' | 'fast' | 'instant'>('standard');
  const [showGasCalculator, setShowGasCalculator] = useState(false);
  const [customGasLimit, setCustomGasLimit] = useState('21000');
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');

  // Initialize lastUpdate on client only
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const maxPrice = Math.max(...mockHistory.map((h) => h.high || h.price));
  const minPrice = Math.min(...mockHistory.map((h) => h.low || h.price));

  // Calculate custom gas cost
  const calculateCustomGas = (gwei: number) => {
    const gasLimit = parseInt(customGasLimit) || 21000;
    const costInSel = (gasLimit * gwei * 1e-9).toFixed(6);
    const costInUSD = (parseFloat(costInSel) * 0.30).toFixed(4);
    return { costInSel, costInUSD };
  };

  const getSpeedStyle = (speed: string) => {
    switch (speed) {
      case 'slow':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' };
      case 'standard':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' };
      case 'fast':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' };
      case 'instant':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gas Tracker</h1>
          <p className="text-foreground-secondary mt-1">Real-time gas prices and transaction cost estimates</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-foreground-secondary text-sm">
            Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 bg-selendra-card border border-selendra-border rounded-lg text-foreground-secondary hover:text-foreground transition-colors',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Gas Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(mockGasPrice).map(([speed, data]) => {
          const style = getSpeedStyle(speed);
          const isSelected = selectedSpeed === speed;
          return (
            <button
              key={speed}
              onClick={() => setSelectedSpeed(speed as typeof selectedSpeed)}
              className={cn(
                'bg-selendra-card border rounded-xl p-5 text-left transition-all relative overflow-hidden',
                isSelected ? `border-2 ${style.border}` : 'border-selendra-border hover:border-selendra-500/50'
              )}
            >
              {speed === 'standard' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-selendra-primary text-white text-xs rounded-full">
                  Recommended
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className={cn('capitalize font-medium', style.text)}>{speed}</span>
                <div className={cn('p-2 rounded-lg', style.bg)}>
                  {speed === 'slow' && <Clock className={cn('h-5 w-5', style.text)} />}
                  {speed === 'standard' && <Timer className={cn('h-5 w-5', style.text)} />}
                  {speed === 'fast' && <Zap className={cn('h-5 w-5', style.text)} />}
                  {speed === 'instant' && <Activity className={cn('h-5 w-5', style.text)} />}
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{data.price}</p>
              <p className="text-sm text-foreground-secondary">Gwei</p>
              <p className={cn('text-sm mt-2', style.text)}>{data.time}</p>
            </button>
          );
        })}
      </div>

      {/* Network Stats & Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Stats */}
        <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-selendra-primary" />
            Network Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Base Fee</span>
              <span className="font-mono text-foreground">{mockNetworkStats.baseFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Priority Fee</span>
              <span className="font-mono text-foreground">{mockNetworkStats.priorityFee}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Pending Txns</span>
              <span className="font-mono text-yellow-400">{mockNetworkStats.pendingTxns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Latest Block</span>
              <a href="#" className="font-mono text-selendra-primary hover:underline">
                #{mockNetworkStats.lastBlock.toLocaleString()}
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground-secondary">Block Time</span>
              <span className="font-mono text-foreground">{mockNetworkStats.blockTime}</span>
            </div>
            <div className="pt-2 border-t border-selendra-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-foreground-secondary">Block Gas Usage</span>
              </div>
              <BlockFillMeter percentage={mockNetworkStats.gasUsedRatio} />
            </div>
          </div>
        </div>

        {/* Gas Price Chart */}
        <div className="lg:col-span-2 bg-selendra-card border border-selendra-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-selendra-primary" />
              Gas Price History
            </h2>
            <div className="flex items-center gap-1">
              {(['1h', '24h', '7d'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    'px-3 py-1 rounded text-sm transition-colors',
                    timeframe === tf
                      ? 'bg-selendra-primary text-white'
                      : 'bg-selendra-dark text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end gap-2">
            {mockHistory.map((point, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                {/* High range indicator */}
                {point.high && (
                  <div
                    className="absolute w-full bg-red-500/20 rounded-t"
                    style={{
                      height: `${((point.high - point.price) / maxPrice) * 100}%`,
                      bottom: `${(point.price / maxPrice) * 100}%`,
                    }}
                  />
                )}
                {/* Main bar */}
                <div
                  className="w-full bg-gradient-to-t from-selendra-primary to-purple-500 rounded-t transition-all hover:from-selendra-primary/80 hover:to-purple-400 relative z-10"
                  style={{ height: `${(point.price / maxPrice) * 100}%` }}
                  title={`Avg: ${point.price} Gwei${point.low ? ` | Low: ${point.low}` : ''}${point.high ? ` | High: ${point.high}` : ''}`}
                />
                {/* Low range indicator */}
                {point.low && (
                  <div
                    className="absolute w-full bg-green-500/20 rounded-b"
                    style={{
                      height: `${((point.price - point.low) / maxPrice) * 100}%`,
                      bottom: `${(point.low / maxPrice) * 100}%`,
                    }}
                  />
                )}
                <span className="text-xs text-foreground-secondary rotate-45 origin-left">{point.timestamp}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500/30 rounded"></span>
                <span className="text-foreground-secondary">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-gradient-to-t from-selendra-primary to-purple-500 rounded"></span>
                <span className="text-foreground-secondary">Average</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500/30 rounded"></span>
                <span className="text-foreground-secondary">High</span>
              </div>
            </div>
            <div className="flex gap-4 text-sm text-foreground-secondary">
              <span>Low: {minPrice.toFixed(1)} Gwei</span>
              <span>High: {maxPrice.toFixed(1)} Gwei</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Cost Estimates */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-selendra-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transaction Cost Estimates</h2>
            <p className="text-foreground-secondary text-sm mt-1">Based on current gas prices (SEL ≈ $0.30)</p>
          </div>
          <button
            onClick={() => setShowGasCalculator(!showGasCalculator)}
            className="flex items-center gap-2 px-4 py-2 bg-selendra-dark rounded-lg text-sm hover:bg-selendra-dark/70 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Custom Calculator
            <ChevronDown className={cn('w-4 h-4 transition-transform', showGasCalculator && 'rotate-180')} />
          </button>
        </div>
        
        {/* Custom Gas Calculator */}
        {showGasCalculator && (
          <div className="p-4 bg-selendra-dark/50 border-b border-selendra-border">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm text-foreground-secondary mb-1">Gas Limit</label>
                <input
                  type="number"
                  value={customGasLimit}
                  onChange={(e) => setCustomGasLimit(e.target.value)}
                  className="w-40 px-3 py-2 bg-selendra-card border border-selendra-border rounded-lg focus:outline-none focus:border-selendra-primary text-foreground"
                  placeholder="21000"
                />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(mockGasPrice).map(([speed, data]) => {
                  const { costInSel, costInUSD } = calculateCustomGas(data.price);
                  const style = getSpeedStyle(speed);
                  return (
                    <div key={speed} className="text-center p-2 bg-selendra-card rounded-lg">
                      <span className={cn('text-sm capitalize', style.text)}>{speed}</span>
                      <p className={cn('font-mono', style.text)}>{costInSel} SEL</p>
                      <p className="text-xs text-foreground-secondary">${costInUSD}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-selendra-dark/50">
                <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Transaction Type</th>
                <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Gas Limit</th>
                <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                  <span className="text-blue-400">Slow</span>
                </th>
                <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                  <span className="text-green-400">Standard</span>
                </th>
                <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">
                  <span className="text-yellow-400">Fast</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-selendra-border">
              {mockTransactionCosts.map((tx) => (
                <tr key={tx.type} className="hover:bg-selendra-dark/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-foreground font-medium">{tx.type}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-foreground-secondary font-mono">{tx.gasLimit.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-blue-400">{tx.slow}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-green-400">{tx.standard}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-yellow-400">{tx.fast}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">Save on Gas</h3>
              <p className="text-foreground-secondary text-sm">
                Gas prices are typically lower during off-peak hours (UTC 02:00 - 08:00). Consider
                scheduling non-urgent transactions during these times.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-foreground font-medium mb-1">EIP-1559 Support</h3>
              <p className="text-foreground-secondary text-sm">
                Selendra EVM supports EIP-1559. Base fee is burned while priority fee goes to validators.
                Set a reasonable max fee to avoid overpaying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Comparison */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Network Gas Comparison</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-selendra-primary flex items-center justify-center text-xs text-white font-bold">
                S
              </div>
              <span className="text-foreground font-medium">Selendra</span>
            </div>
            <p className="text-2xl font-bold text-green-400">2.5</p>
            <p className="text-xs text-foreground-secondary">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                E
              </div>
              <span className="text-foreground font-medium">Ethereum</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">25</p>
            <p className="text-xs text-foreground-secondary">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs text-white font-bold">
                B
              </div>
              <span className="text-foreground font-medium">BSC</span>
            </div>
            <p className="text-2xl font-bold text-green-400">3</p>
            <p className="text-xs text-foreground-secondary">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white font-bold">
                P
              </div>
              <span className="text-foreground font-medium">Polygon</span>
            </div>
            <p className="text-2xl font-bold text-green-400">50</p>
            <p className="text-xs text-foreground-secondary">Gwei avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
