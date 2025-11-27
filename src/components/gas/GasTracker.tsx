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
}

interface TransactionCost {
  type: string;
  gasLimit: number;
  slow: string;
  standard: string;
  fast: string;
}

const mockGasPrice: GasPrice = {
  slow: { price: 1.2, time: '~5 min' },
  standard: { price: 2.5, time: '~2 min' },
  fast: { price: 4.0, time: '~30 sec' },
  instant: { price: 6.0, time: '~10 sec' },
};

const mockHistory: GasHistory[] = [
  { timestamp: '00:00', price: 2.1 },
  { timestamp: '02:00', price: 1.8 },
  { timestamp: '04:00', price: 1.5 },
  { timestamp: '06:00', price: 2.0 },
  { timestamp: '08:00', price: 3.5 },
  { timestamp: '10:00', price: 4.2 },
  { timestamp: '12:00', price: 3.8 },
  { timestamp: '14:00', price: 2.9 },
  { timestamp: '16:00', price: 3.2 },
  { timestamp: '18:00', price: 4.5 },
  { timestamp: '20:00', price: 3.1 },
  { timestamp: '22:00', price: 2.5 },
];

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

export default function GasTracker() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'standard' | 'fast' | 'instant'>('standard');

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

  const maxPrice = Math.max(...mockHistory.map((h) => h.price));

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
          <h1 className="text-2xl font-bold text-white">Gas Tracker</h1>
          <p className="text-gray-400 mt-1">Real-time gas prices and transaction cost estimates</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 bg-selendra-card border border-selendra-border rounded-lg text-gray-400 hover:text-white transition-colors',
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
                'bg-selendra-card border rounded-xl p-5 text-left transition-all',
                isSelected ? `border-2 ${style.border}` : 'border-selendra-border hover:border-gray-600'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn('capitalize font-medium', style.text)}>{speed}</span>
                <div className={cn('p-2 rounded-lg', style.bg)}>
                  {speed === 'slow' && <Clock className={cn('h-5 w-5', style.text)} />}
                  {speed === 'standard' && <Timer className={cn('h-5 w-5', style.text)} />}
                  {speed === 'fast' && <Zap className={cn('h-5 w-5', style.text)} />}
                  {speed === 'instant' && <Activity className={cn('h-5 w-5', style.text)} />}
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{data.price}</p>
              <p className="text-sm text-gray-400">Gwei</p>
              <p className={cn('text-sm mt-2', style.text)}>{data.time}</p>
            </button>
          );
        })}
      </div>

      {/* Gas Price Chart */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">24h Gas Price History</h2>
        <div className="h-48 flex items-end gap-2">
          {mockHistory.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-selendra-primary to-purple-500 rounded-t transition-all hover:from-selendra-primary/80 hover:to-purple-400"
                style={{ height: `${(point.price / maxPrice) * 100}%` }}
                title={`${point.price} Gwei`}
              />
              <span className="text-xs text-gray-500 rotate-45 origin-left">{point.timestamp}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between text-sm text-gray-400">
          <span>Low: 1.5 Gwei</span>
          <span>Avg: 2.9 Gwei</span>
          <span>High: 4.5 Gwei</span>
        </div>
      </div>

      {/* Transaction Cost Estimates */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-selendra-border">
          <h2 className="text-lg font-semibold text-white">Transaction Cost Estimates</h2>
          <p className="text-gray-400 text-sm mt-1">Based on current gas prices (SEL ≈ $0.30)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-selendra-dark/50">
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Transaction Type</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">Gas Limit</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                  <span className="text-blue-400">Slow</span>
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                  <span className="text-green-400">Standard</span>
                </th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium text-sm">
                  <span className="text-yellow-400">Fast</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-selendra-border">
              {mockTransactionCosts.map((tx) => (
                <tr key={tx.type} className="hover:bg-selendra-dark/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-white font-medium">{tx.type}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-400 font-mono">{tx.gasLimit.toLocaleString()}</span>
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
              <h3 className="text-white font-medium mb-1">Save on Gas</h3>
              <p className="text-gray-400 text-sm">
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
              <h3 className="text-white font-medium mb-1">EIP-1559 Support</h3>
              <p className="text-gray-400 text-sm">
                Selendra EVM supports EIP-1559. Base fee is burned while priority fee goes to validators.
                Set a reasonable max fee to avoid overpaying.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Comparison */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Network Gas Comparison</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-selendra-primary flex items-center justify-center text-xs text-white font-bold">
                S
              </div>
              <span className="text-white font-medium">Selendra</span>
            </div>
            <p className="text-2xl font-bold text-green-400">2.5</p>
            <p className="text-xs text-gray-500">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                E
              </div>
              <span className="text-white font-medium">Ethereum</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">25</p>
            <p className="text-xs text-gray-500">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs text-white font-bold">
                B
              </div>
              <span className="text-white font-medium">BSC</span>
            </div>
            <p className="text-2xl font-bold text-green-400">3</p>
            <p className="text-xs text-gray-500">Gwei avg</p>
          </div>
          <div className="p-4 bg-selendra-dark rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white font-bold">
                P
              </div>
              <span className="text-white font-medium">Polygon</span>
            </div>
            <p className="text-2xl font-bold text-green-400">50</p>
            <p className="text-xs text-gray-500">Gwei avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
