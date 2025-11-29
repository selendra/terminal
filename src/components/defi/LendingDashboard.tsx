"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Percent,
  Shield,
  AlertTriangle,
  Info,
  ChevronDown,
  X,
  Loader2,
  RefreshCw,
  Clock,
  DollarSign,
  Activity,
  PieChart,
  ExternalLink,
  Search,
  CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/components/providers/WalletProvider";
import toast from "react-hot-toast";

// Types
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl?: string;
  priceUsd?: number;
}

export interface LendingMarket {
  id: string;
  token: Token;
  totalSupply: string;
  totalBorrow: string;
  supplyApy: number;
  borrowApy: number;
  utilizationRate: number;
  collateralFactor: number;
  liquidationThreshold: number;
  liquidationPenalty: number;
  available: string;
  userPosition?: {
    supplied: string;
    borrowed: string;
    collateralEnabled: boolean;
  };
}

export interface UserPosition {
  totalSupplyUsd: string;
  totalBorrowUsd: string;
  netApy: number;
  healthFactor: number;
  borrowLimit: string;
  borrowLimitUsed: number;
}

interface LendingDashboardProps {
  onSuccess?: (txHash: string, action: "supply" | "withdraw" | "borrow" | "repay") => void;
}

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: LendingMarket | null;
  action: "supply" | "withdraw" | "borrow" | "repay";
  onSuccess?: (txHash: string) => void;
}

// Mock data
const DEFAULT_MARKETS: LendingMarket[] = [
  {
    id: "sel",
    token: { symbol: "SEL", name: "Selendra", address: "0x0000", decimals: 18, priceUsd: 0.15 },
    totalSupply: "15000000",
    totalBorrow: "8500000",
    supplyApy: 4.5,
    borrowApy: 7.2,
    utilizationRate: 56.7,
    collateralFactor: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.08,
    available: "6500000",
    userPosition: {
      supplied: "10000",
      borrowed: "0",
      collateralEnabled: true,
    },
  },
  {
    id: "usdt",
    token: { symbol: "USDT", name: "Tether USD", address: "0x1234", decimals: 6, priceUsd: 1.0 },
    totalSupply: "25000000",
    totalBorrow: "18750000",
    supplyApy: 8.2,
    borrowApy: 12.5,
    utilizationRate: 75,
    collateralFactor: 0.8,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.05,
    available: "6250000",
    userPosition: {
      supplied: "5000",
      borrowed: "2000",
      collateralEnabled: true,
    },
  },
  {
    id: "usdc",
    token: { symbol: "USDC", name: "USD Coin", address: "0x2345", decimals: 6, priceUsd: 1.0 },
    totalSupply: "20000000",
    totalBorrow: "14000000",
    supplyApy: 7.8,
    borrowApy: 11.9,
    utilizationRate: 70,
    collateralFactor: 0.8,
    liquidationThreshold: 0.85,
    liquidationPenalty: 0.05,
    available: "6000000",
  },
  {
    id: "wbtc",
    token: { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x3456", decimals: 8, priceUsd: 67500 },
    totalSupply: "150",
    totalBorrow: "75",
    supplyApy: 2.1,
    borrowApy: 4.8,
    utilizationRate: 50,
    collateralFactor: 0.7,
    liquidationThreshold: 0.78,
    liquidationPenalty: 0.1,
    available: "75",
  },
  {
    id: "weth",
    token: { symbol: "WETH", name: "Wrapped Ether", address: "0x4567", decimals: 18, priceUsd: 3450 },
    totalSupply: "2500",
    totalBorrow: "1500",
    supplyApy: 3.2,
    borrowApy: 5.9,
    utilizationRate: 60,
    collateralFactor: 0.75,
    liquidationThreshold: 0.82,
    liquidationPenalty: 0.08,
    available: "1000",
  },
];

// Action Modal Component
function ActionModal({
  isOpen,
  onClose,
  market,
  action,
  onSuccess,
}: ActionModalProps) {
  const { evmAccount } = useWallet();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset amount when modal opens/closes
  useEffect(() => {
    if (!isOpen) setAmount("");
  }, [isOpen]);

  const maxAmount = useMemo(() => {
    if (!market) return "0";
    switch (action) {
      case "supply":
        return "10000"; // Mock wallet balance
      case "withdraw":
        return market.userPosition?.supplied || "0";
      case "borrow":
        return market.available;
      case "repay":
        return market.userPosition?.borrowed || "0";
      default:
        return "0";
    }
  }, [market, action]);

  const actionLabels = {
    supply: { title: "Supply", button: "Supply", color: "emerald" },
    withdraw: { title: "Withdraw", button: "Withdraw", color: "amber" },
    borrow: { title: "Borrow", button: "Borrow", color: "purple" },
    repay: { title: "Repay", button: "Repay", color: "blue" },
  };

  const handleAction = useCallback(async () => {
    if (!market || !amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

      toast.success(
        <div>
          <div className="font-medium">{actionLabels[action].title} Successful!</div>
          <div className="text-sm text-gray-400">
            {amount} {market.token.symbol}
          </div>
        </div>
      );

      onSuccess?.(mockTxHash);
      onClose();
    } catch (error) {
      console.error(`${action} failed:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${action}`);
    } finally {
      setIsLoading(false);
    }
  }, [market, amount, action, onSuccess, onClose, actionLabels]);

  if (!isOpen || !market) return null;

  const config = actionLabels[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {market.token.symbol.slice(0, 2)}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{config.title} {market.token.symbol}</h2>
              <div className="text-sm text-gray-400">${market.token.priceUsd?.toLocaleString()}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Amount</label>
              <span className="text-sm text-gray-400">
                Max: {parseFloat(maxAmount).toLocaleString()} {market.token.symbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-20 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setAmount(maxAmount)}
                  className="px-2 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded transition-colors"
                >
                  MAX
                </button>
                <span className="text-gray-400 text-sm">{market.token.symbol}</span>
              </div>
            </div>
            {amount && (
              <div className="mt-1 text-sm text-gray-500">
                ~${(parseFloat(amount) * (market.token.priceUsd || 0)).toLocaleString()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="p-3 bg-gray-800/50 rounded-lg space-y-2 text-sm">
            {(action === "supply" || action === "withdraw") && (
              <div className="flex justify-between">
                <span className="text-gray-400">Supply APY</span>
                <span className="text-emerald-400">{market.supplyApy.toFixed(2)}%</span>
              </div>
            )}
            {(action === "borrow" || action === "repay") && (
              <div className="flex justify-between">
                <span className="text-gray-400">Borrow APY</span>
                <span className="text-red-400">{market.borrowApy.toFixed(2)}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization</span>
              <span className="text-white">{market.utilizationRate.toFixed(1)}%</span>
            </div>
            {(action === "supply" && market.collateralFactor > 0) && (
              <div className="flex justify-between">
                <span className="text-gray-400">Collateral Factor</span>
                <span className="text-white">{(market.collateralFactor * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {action === "borrow" && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Borrowing will reduce your health factor. If it drops below 1, your position may be liquidated.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleAction}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
            className={clsx(
              "w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors",
              isLoading || !amount || parseFloat(amount) <= 0
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : action === "supply"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : action === "withdraw"
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : action === "borrow"
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              config.button
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Market Row Component
function MarketRow({
  market,
  onAction,
}: {
  market: LendingMarket;
  onAction: (market: LendingMarket, action: "supply" | "withdraw" | "borrow" | "repay") => void;
}) {
  const hasPosition = market.userPosition && (
    parseFloat(market.userPosition.supplied) > 0 ||
    parseFloat(market.userPosition.borrowed) > 0
  );

  return (
    <div className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Token Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {market.token.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-medium text-white">{market.token.symbol}</div>
            <div className="text-sm text-gray-400">{market.token.name}</div>
          </div>
        </div>

        {/* APY */}
        <div className="hidden sm:block text-center">
          <div className="text-sm text-gray-400">Supply APY</div>
          <div className="text-emerald-400 font-medium">{market.supplyApy.toFixed(2)}%</div>
        </div>

        <div className="hidden sm:block text-center">
          <div className="text-sm text-gray-400">Borrow APY</div>
          <div className="text-red-400 font-medium">{market.borrowApy.toFixed(2)}%</div>
        </div>

        {/* Total Supply/Borrow */}
        <div className="hidden md:block text-center">
          <div className="text-sm text-gray-400">Total Supply</div>
          <div className="text-white font-medium">
            ${(parseFloat(market.totalSupply) * (market.token.priceUsd || 0) / 1e6).toFixed(2)}M
          </div>
        </div>

        <div className="hidden md:block text-center">
          <div className="text-sm text-gray-400">Available</div>
          <div className="text-white font-medium">
            ${(parseFloat(market.available) * (market.token.priceUsd || 0) / 1e6).toFixed(2)}M
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {hasPosition && parseFloat(market.userPosition!.supplied) > 0 ? (
            <button
              onClick={() => onAction(market, "withdraw")}
              className="px-3 py-1.5 text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
            >
              Withdraw
            </button>
          ) : (
            <button
              onClick={() => onAction(market, "supply")}
              className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
            >
              Supply
            </button>
          )}
          {hasPosition && parseFloat(market.userPosition!.borrowed) > 0 ? (
            <button
              onClick={() => onAction(market, "repay")}
              className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
            >
              Repay
            </button>
          ) : (
            <button
              onClick={() => onAction(market, "borrow")}
              className="px-3 py-1.5 text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              Borrow
            </button>
          )}
        </div>
      </div>

      {/* User Position */}
      {hasPosition && (
        <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Supplied</div>
            <div className="text-white font-medium">
              {parseFloat(market.userPosition!.supplied).toLocaleString()} {market.token.symbol}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Borrowed</div>
            <div className="text-white font-medium">
              {parseFloat(market.userPosition!.borrowed).toLocaleString()} {market.token.symbol}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Collateral</div>
            <div className={clsx(
              "font-medium",
              market.userPosition!.collateralEnabled ? "text-emerald-400" : "text-gray-400"
            )}>
              {market.userPosition!.collateralEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
          <div>
            <div className="text-gray-400">LTV</div>
            <div className="text-white font-medium">{(market.collateralFactor * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export function LendingDashboard({ onSuccess }: LendingDashboardProps) {
  const { evmAccount, isConnected } = useWallet();

  // State
  const [markets, setMarkets] = useState<LendingMarket[]>(DEFAULT_MARKETS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    market: LendingMarket | null;
    action: "supply" | "withdraw" | "borrow" | "repay";
  }>({
    isOpen: false,
    market: null,
    action: "supply",
  });

  // Load markets
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculate user position
  const userPosition = useMemo((): UserPosition | null => {
    const marketsWithPosition = markets.filter((m) => m.userPosition);
    if (marketsWithPosition.length === 0) return null;

    let totalSupplyUsd = 0;
    let totalBorrowUsd = 0;
    let totalSupplyApy = 0;
    let totalBorrowApy = 0;
    let borrowLimit = 0;

    marketsWithPosition.forEach((market) => {
      if (!market.userPosition) return;
      const price = market.token.priceUsd || 0;
      const supplied = parseFloat(market.userPosition.supplied) * price;
      const borrowed = parseFloat(market.userPosition.borrowed) * price;

      totalSupplyUsd += supplied;
      totalBorrowUsd += borrowed;
      totalSupplyApy += supplied * market.supplyApy;
      totalBorrowApy += borrowed * market.borrowApy;

      if (market.userPosition.collateralEnabled) {
        borrowLimit += supplied * market.collateralFactor;
      }
    });

    const netApy = totalSupplyUsd > 0
      ? (totalSupplyApy - totalBorrowApy) / totalSupplyUsd
      : 0;

    const healthFactor = totalBorrowUsd > 0
      ? borrowLimit / totalBorrowUsd
      : Infinity;

    const borrowLimitUsed = borrowLimit > 0
      ? (totalBorrowUsd / borrowLimit) * 100
      : 0;

    return {
      totalSupplyUsd: totalSupplyUsd.toFixed(2),
      totalBorrowUsd: totalBorrowUsd.toFixed(2),
      netApy,
      healthFactor,
      borrowLimit: borrowLimit.toFixed(2),
      borrowLimitUsed,
    };
  }, [markets]);

  // Filter markets
  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return markets;
    const query = searchQuery.toLowerCase();
    return markets.filter(
      (m) =>
        m.token.symbol.toLowerCase().includes(query) ||
        m.token.name.toLowerCase().includes(query)
    );
  }, [markets, searchQuery]);

  const openActionModal = useCallback(
    (market: LendingMarket, action: "supply" | "withdraw" | "borrow" | "repay") => {
      setActionModal({ isOpen: true, market, action });
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Lending</h2>
          <p className="text-gray-400">Supply assets to earn interest or borrow against collateral</p>
        </div>
      </div>

      {/* User Position Overview */}
      {userPosition && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              Total Supplied
            </div>
            <div className="text-xl font-bold text-white">
              ${parseFloat(userPosition.totalSupplyUsd).toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <TrendingDown className="w-4 h-4" />
              Total Borrowed
            </div>
            <div className="text-xl font-bold text-white">
              ${parseFloat(userPosition.totalBorrowUsd).toLocaleString()}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Percent className="w-4 h-4" />
              Net APY
            </div>
            <div className={clsx(
              "text-xl font-bold",
              userPosition.netApy >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {userPosition.netApy >= 0 ? "+" : ""}{userPosition.netApy.toFixed(2)}%
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Shield className="w-4 h-4" />
              Health Factor
            </div>
            <div className={clsx(
              "text-xl font-bold",
              userPosition.healthFactor === Infinity
                ? "text-gray-400"
                : userPosition.healthFactor >= 2
                ? "text-emerald-400"
                : userPosition.healthFactor >= 1.5
                ? "text-amber-400"
                : "text-red-400"
            )}>
              {userPosition.healthFactor === Infinity
                ? "∞"
                : userPosition.healthFactor.toFixed(2)}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Activity className="w-4 h-4" />
              Borrow Limit Used
            </div>
            <div className="text-xl font-bold text-white">
              {userPosition.borrowLimitUsed.toFixed(1)}%
            </div>
            <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  userPosition.borrowLimitUsed > 80
                    ? "bg-red-500"
                    : userPosition.borrowLimitUsed > 60
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(userPosition.borrowLimitUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search markets..."
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Markets List */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">All Markets</h3>
        </div>

        <div className="p-4 space-y-3">
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-8">
              <Landmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No markets found</p>
            </div>
          ) : (
            filteredMarkets.map((market) => (
              <MarketRow
                key={market.id}
                market={market}
                onAction={openActionModal}
              />
            ))
          )}
        </div>
      </div>

      {/* Protocol Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Value Locked</div>
          <div className="text-xl font-bold text-white">
            $
            {(
              markets.reduce(
                (sum, m) =>
                  sum + parseFloat(m.totalSupply) * (m.token.priceUsd || 0),
                0
              ) / 1e6
            ).toFixed(2)}
            M
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
          <div className="text-xl font-bold text-white">
            $
            {(
              markets.reduce(
                (sum, m) =>
                  sum + parseFloat(m.totalBorrow) * (m.token.priceUsd || 0),
                0
              ) / 1e6
            ).toFixed(2)}
            M
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Markets</div>
          <div className="text-xl font-bold text-white">{markets.length}</div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-1">Avg Supply APY</div>
          <div className="text-xl font-bold text-emerald-400">
            {(
              markets.reduce((sum, m) => sum + m.supplyApy, 0) / markets.length
            ).toFixed(2)}
            %
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() =>
          setActionModal({ isOpen: false, market: null, action: "supply" })
        }
        market={actionModal.market}
        action={actionModal.action}
        onSuccess={(txHash) => onSuccess?.(txHash, actionModal.action)}
      />
    </div>
  );
}

export default LendingDashboard;
