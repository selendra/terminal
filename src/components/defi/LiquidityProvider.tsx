"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus,
  Minus,
  Droplets,
  Settings,
  Info,
  AlertTriangle,
  ChevronDown,
  X,
  Loader2,
  TrendingUp,
  Percent,
  Search,
  ExternalLink,
  RefreshCw,
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
  balance?: string;
  priceUsd?: number;
}

export interface LiquidityPool {
  id: string;
  token0: Token;
  token1: Token;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  apr: number;
  volume24h: string;
  tvl: string;
  fee: number;
  userLiquidity?: {
    lpBalance: string;
    share: number;
    token0Amount: string;
    token1Amount: string;
  };
}

interface LiquidityProviderProps {
  defaultPool?: LiquidityPool;
  onSuccess?: (txHash: string, action: "add" | "remove") => void;
}

interface PoolSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pool: LiquidityPool) => void;
  pools: LiquidityPool[];
  selectedPool?: LiquidityPool;
}

// Default token list (mock)
const DEFAULT_TOKENS: Token[] = [
  { symbol: "SEL", name: "Selendra", address: "0x0000", decimals: 18, priceUsd: 0.15 },
  { symbol: "USDT", name: "Tether USD", address: "0x1234", decimals: 6, priceUsd: 1.0 },
  { symbol: "USDC", name: "USD Coin", address: "0x2345", decimals: 6, priceUsd: 1.0 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x3456", decimals: 8, priceUsd: 67500 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0x4567", decimals: 18, priceUsd: 3450 },
];

// Mock pools
const DEFAULT_POOLS: LiquidityPool[] = [
  {
    id: "sel-usdt",
    token0: DEFAULT_TOKENS[0],
    token1: DEFAULT_TOKENS[1],
    reserve0: "5000000",
    reserve1: "750000",
    totalSupply: "1500000",
    apr: 45.2,
    volume24h: "250000",
    tvl: "1500000",
    fee: 0.3,
    userLiquidity: {
      lpBalance: "1500",
      share: 0.1,
      token0Amount: "5000",
      token1Amount: "750",
    },
  },
  {
    id: "sel-usdc",
    token0: DEFAULT_TOKENS[0],
    token1: DEFAULT_TOKENS[2],
    reserve0: "3500000",
    reserve1: "525000",
    totalSupply: "1050000",
    apr: 38.7,
    volume24h: "180000",
    tvl: "1050000",
    fee: 0.3,
  },
  {
    id: "weth-usdt",
    token0: DEFAULT_TOKENS[4],
    token1: DEFAULT_TOKENS[1],
    reserve0: "450",
    reserve1: "1552500",
    totalSupply: "450000",
    apr: 28.5,
    volume24h: "320000",
    tvl: "3105000",
    fee: 0.3,
  },
  {
    id: "wbtc-usdt",
    token0: DEFAULT_TOKENS[3],
    token1: DEFAULT_TOKENS[1],
    reserve0: "25",
    reserve1: "1687500",
    totalSupply: "320000",
    apr: 22.3,
    volume24h: "410000",
    tvl: "3375000",
    fee: 0.3,
  },
];

// Pool Selector Modal
function PoolSelector({
  isOpen,
  onClose,
  onSelect,
  pools,
  selectedPool,
}: PoolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPools = useMemo(() => {
    if (!searchQuery) return pools;
    const query = searchQuery.toLowerCase();
    return pools.filter(
      (pool) =>
        pool.token0.symbol.toLowerCase().includes(query) ||
        pool.token1.symbol.toLowerCase().includes(query) ||
        pool.token0.name.toLowerCase().includes(query) ||
        pool.token1.name.toLowerCase().includes(query)
    );
  }, [pools, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-lg mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Select Pool</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pools..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        </div>

        {/* Pool List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredPools.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No pools found</p>
            </div>
          ) : (
            filteredPools.map((pool) => (
              <button
                key={pool.id}
                onClick={() => {
                  onSelect(pool);
                  onClose();
                }}
                className={clsx(
                  "w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors",
                  selectedPool?.id === pool.id && "bg-purple-500/10"
                )}
              >
                {/* Token Pair Icons */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {pool.token0.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center border-2 border-gray-900">
                    <span className="text-white font-bold text-[8px]">
                      {pool.token1.symbol.slice(0, 2)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-white">
                    {pool.token0.symbol}/{pool.token1.symbol}
                  </div>
                  <div className="text-sm text-gray-400">
                    TVL: ${parseFloat(pool.tvl).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-emerald-400 font-medium">{pool.apr.toFixed(1)}% APR</div>
                  <div className="text-sm text-gray-400">{pool.fee}% fee</div>
                </div>

                {selectedPool?.id === pool.id && (
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Amount Input Component
function AmountInput({
  token,
  amount,
  onAmountChange,
  label,
  balance,
  disabled = false,
  showMax = false,
}: {
  token: Token;
  amount: string;
  onAmountChange: (value: string) => void;
  label: string;
  balance?: string;
  disabled?: boolean;
  showMax?: boolean;
}) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {balance && (
          <span className="text-sm text-gray-400">
            Balance: {balance}
            {showMax && (
              <button
                onClick={() => onAmountChange(balance)}
                className="ml-2 text-purple-400 hover:text-purple-300"
              >
                MAX
              </button>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
          disabled={disabled}
          className={clsx(
            "flex-1 bg-transparent text-2xl font-medium text-white placeholder-gray-600 focus:outline-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {token.symbol.slice(0, 2)}
            </span>
          </div>
          <span className="font-medium text-white">{token.symbol}</span>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function LiquidityProvider({ defaultPool, onSuccess }: LiquidityProviderProps) {
  const { evmAccount, isConnected } = useWallet();

  // State
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | undefined>(
    defaultPool || DEFAULT_POOLS[0]
  );
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [removePercent, setRemovePercent] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const [showPoolSelector, setShowPoolSelector] = useState(false);
  const [pools] = useState<LiquidityPool[]>(DEFAULT_POOLS);
  const [slippage, setSlippage] = useState(0.5);

  // Auto-calculate paired amount based on pool ratio
  useEffect(() => {
    if (!selectedPool || mode !== "add") return;

    const reserve0 = parseFloat(selectedPool.reserve0);
    const reserve1 = parseFloat(selectedPool.reserve1);
    const ratio = reserve1 / reserve0;

    if (amount0 && parseFloat(amount0) > 0) {
      const calculated = (parseFloat(amount0) * ratio).toFixed(6);
      setAmount1(calculated);
    }
  }, [amount0, selectedPool, mode]);

  // Calculate remove amounts
  const removeAmounts = useMemo(() => {
    if (!selectedPool?.userLiquidity || mode !== "remove") {
      return { token0: "0", token1: "0", lpTokens: "0" };
    }

    const userLp = parseFloat(selectedPool.userLiquidity.lpBalance);
    const lpToRemove = (userLp * removePercent) / 100;
    
    const share = lpToRemove / parseFloat(selectedPool.totalSupply);
    const token0Amount = (parseFloat(selectedPool.reserve0) * share).toFixed(6);
    const token1Amount = (parseFloat(selectedPool.reserve1) * share).toFixed(6);

    return {
      token0: token0Amount,
      token1: token1Amount,
      lpTokens: lpToRemove.toFixed(6),
    };
  }, [selectedPool, removePercent, mode]);

  // Calculate share of pool
  const poolSharePercent = useMemo(() => {
    if (!selectedPool || mode !== "add" || !amount0) return 0;
    
    const newLp = parseFloat(amount0) * 2; // Simplified
    const totalSupply = parseFloat(selectedPool.totalSupply);
    return ((newLp / (totalSupply + newLp)) * 100).toFixed(4);
  }, [selectedPool, amount0, mode]);

  // Handle add liquidity
  const handleAddLiquidity = useCallback(async () => {
    if (!evmAccount || !selectedPool || !amount0 || !amount1) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;
      
      toast.success(
        <div>
          <div className="font-medium">Liquidity Added!</div>
          <div className="text-sm text-gray-400">
            {amount0} {selectedPool.token0.symbol} + {amount1} {selectedPool.token1.symbol}
          </div>
        </div>
      );

      onSuccess?.(mockTxHash, "add");
      setAmount0("");
      setAmount1("");
    } catch (error) {
      console.error("Add liquidity failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add liquidity");
    } finally {
      setIsLoading(false);
    }
  }, [evmAccount, selectedPool, amount0, amount1, onSuccess]);

  // Handle remove liquidity
  const handleRemoveLiquidity = useCallback(async () => {
    if (!evmAccount || !selectedPool?.userLiquidity || removePercent <= 0) {
      toast.error("Invalid remove amount");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;
      
      toast.success(
        <div>
          <div className="font-medium">Liquidity Removed!</div>
          <div className="text-sm text-gray-400">
            Received {removeAmounts.token0} {selectedPool.token0.symbol} + {removeAmounts.token1} {selectedPool.token1.symbol}
          </div>
        </div>
      );

      onSuccess?.(mockTxHash, "remove");
      setRemovePercent(25);
    } catch (error) {
      console.error("Remove liquidity failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove liquidity");
    } finally {
      setIsLoading(false);
    }
  }, [evmAccount, selectedPool, removePercent, removeAmounts, onSuccess]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Liquidity</h2>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-1 m-4 bg-gray-800 rounded-lg">
          <button
            onClick={() => setMode("add")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors",
              mode === "add"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          <button
            onClick={() => setMode("remove")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors",
              mode === "remove"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Minus className="w-4 h-4" />
            Remove
          </button>
        </div>

        {/* Pool Selector */}
        <div className="px-4 pb-4">
          <label className="text-sm text-gray-400 mb-2 block">Pool</label>
          <button
            onClick={() => setShowPoolSelector(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition-colors"
          >
            {selectedPool ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {selectedPool.token0.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center border-2 border-gray-800">
                    <span className="text-white font-bold text-[6px]">
                      {selectedPool.token1.symbol.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-white">
                    {selectedPool.token0.symbol}/{selectedPool.token1.symbol}
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedPool.fee}% fee · {selectedPool.apr.toFixed(1)}% APR
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Select a pool</span>
            )}
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Add Liquidity Form */}
        {mode === "add" && selectedPool && (
          <div className="px-4 pb-4 space-y-3">
            <AmountInput
              token={selectedPool.token0}
              amount={amount0}
              onAmountChange={setAmount0}
              label={selectedPool.token0.symbol}
              balance={selectedPool.token0.balance || "0"}
              showMax
            />

            <div className="flex justify-center">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Plus className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <AmountInput
              token={selectedPool.token1}
              amount={amount1}
              onAmountChange={setAmount1}
              label={selectedPool.token1.symbol}
              balance={selectedPool.token1.balance || "0"}
            />

            {/* Pool Info */}
            <div className="p-3 bg-gray-800/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Share of Pool</span>
                <span className="text-white">{poolSharePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pool APR</span>
                <span className="text-emerald-400">{selectedPool.apr.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage Tolerance</span>
                <span className="text-white">{slippage}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Remove Liquidity Form */}
        {mode === "remove" && selectedPool && (
          <div className="px-4 pb-4 space-y-4">
            {selectedPool.userLiquidity ? (
              <>
                {/* LP Balance */}
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Your Liquidity</span>
                    <span className="text-sm text-gray-400">
                      {selectedPool.userLiquidity.lpBalance} LP
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedPool.userLiquidity.token0Amount} {selectedPool.token0.symbol} + {selectedPool.userLiquidity.token1Amount} {selectedPool.token1.symbol}
                  </div>
                </div>

                {/* Percent Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">Amount to Remove</span>
                    <span className="text-lg font-semibold text-white">{removePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={removePercent}
                    onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between mt-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setRemovePercent(percent)}
                        className={clsx(
                          "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          removePercent === percent
                            ? "bg-purple-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        )}
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Preview */}
                <div className="p-4 bg-gray-800/50 rounded-xl space-y-3">
                  <div className="text-sm text-gray-400">You will receive</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {selectedPool.token0.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-white">{selectedPool.token0.symbol}</span>
                    </div>
                    <span className="text-white font-medium">{removeAmounts.token0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {selectedPool.token1.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-white">{selectedPool.token1.symbol}</span>
                    </div>
                    <span className="text-white font-medium">{removeAmounts.token1}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Liquidity</h3>
                <p className="text-gray-400 text-sm">
                  You don&apos;t have any liquidity in this pool.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="p-4 pt-0">
          {!evmAccount ? (
            <button
              disabled
              className="w-full py-4 bg-gray-700 rounded-xl text-gray-400 font-medium cursor-not-allowed"
            >
              Connect Wallet
            </button>
          ) : mode === "add" ? (
            <button
              onClick={handleAddLiquidity}
              disabled={isLoading || !amount0 || !amount1 || parseFloat(amount0) <= 0}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-colors",
                isLoading || !amount0 || !amount1 || parseFloat(amount0) <= 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Liquidity...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Liquidity
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRemoveLiquidity}
              disabled={isLoading || !selectedPool?.userLiquidity || removePercent <= 0}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-colors",
                isLoading || !selectedPool?.userLiquidity || removePercent <= 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Removing Liquidity...
                </>
              ) : (
                <>
                  <Minus className="w-5 h-5" />
                  Remove Liquidity
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Your Positions */}
      {pools.some((p) => p.userLiquidity) && (
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-4">
          <h3 className="font-medium text-white mb-4">Your Liquidity Positions</h3>
          <div className="space-y-3">
            {pools
              .filter((p) => p.userLiquidity)
              .map((pool) => (
                <div
                  key={pool.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {pool.token0.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center border-2 border-gray-800">
                        <span className="text-white font-bold text-[6px]">
                          {pool.token1.symbol.slice(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {pool.token0.symbol}/{pool.token1.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {pool.userLiquidity?.share.toFixed(2)}% share
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPool(pool);
                      setMode("remove");
                    }}
                    className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                  >
                    Manage
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pool Selector Modal */}
      <PoolSelector
        isOpen={showPoolSelector}
        onClose={() => setShowPoolSelector(false)}
        onSelect={setSelectedPool}
        pools={pools}
        selectedPool={selectedPool}
      />
    </div>
  );
}

export default LiquidityProvider;
