"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ArrowDownUp,
  Settings,
  RefreshCw,
  Info,
  AlertTriangle,
  ChevronDown,
  X,
  Loader2,
  Zap,
  BarChart3,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/components/providers/WalletProvider";
import { AddressDisplay } from "@/components/common/AddressDisplay";
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

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
  fee: string;
  gasCost: string;
  exchangeRate: string;
}

interface SwapInterfaceProps {
  defaultInputToken?: Token;
  defaultOutputToken?: Token;
  onSwapSuccess?: (txHash: string) => void;
}

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  excludeToken?: Token;
  tokens: Token[];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (value: number) => void;
  deadline: number;
  setDeadline: (value: number) => void;
}

// Default token list (mock - real implementation would fetch from chain/API)
// Note: Selendra uses Unified Accounts - no WSEL needed, native SEL works on EVM
const DEFAULT_TOKENS: Token[] = [
  {
    symbol: "SEL",
    name: "Selendra",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    priceUsd: 0.0025, // Initial price target
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x1234567890123456789012345678901234567890",
    decimals: 6,
    priceUsd: 1.0,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x2345678901234567890123456789012345678901",
    decimals: 6,
    priceUsd: 1.0,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x3456789012345678901234567890123456789012",
    decimals: 8,
    priceUsd: 67500,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4567890123456789012345678901234567890123",
    decimals: 18,
    priceUsd: 3450,
  },
];

// SelendraDEX fee configuration
const DEX_CONFIG = {
  swapFee: 0.003, // 0.30% total
  lpShare: 0.002, // 0.20% to LPs
  burnShare: 0.0005, // 0.05% burned
  treasuryShare: 0.0005, // 0.05% to treasury
};

// Settings Modal
function SettingsModal({
  isOpen,
  onClose,
  slippage,
  setSlippage,
  deadline,
  setDeadline,
}: SettingsModalProps) {
  const slippagePresets = [0.1, 0.5, 1.0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Swap Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Slippage */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-300">Slippage Tolerance</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Maximum price difference you&apos;re willing to accept.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {slippagePresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setSlippage(preset)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg font-medium transition-colors",
                    slippage === preset
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  )}
                >
                  {preset}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  step="0.1"
                  min="0"
                  max="50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>
            {slippage > 5 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                High slippage may result in unfavorable trades
              </div>
            )}
          </div>

          {/* Transaction Deadline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm font-medium text-gray-300">Transaction Deadline</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Transaction will revert if pending longer than this.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="60"
              />
              <span className="text-gray-400">minutes</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// Token Selector Modal
function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  excludeToken,
  tokens,
}: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      if (excludeToken && token.address === excludeToken.address) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    });
  }, [tokens, searchQuery, excludeToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Select Token</h2>
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
              placeholder="Search by name or paste address"
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        </div>

        {/* Token List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredTokens.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No tokens found</p>
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
                className={clsx(
                  "w-full flex items-center gap-3 p-4 hover:bg-gray-800 transition-colors",
                  selectedToken?.address === token.address && "bg-purple-500/10"
                )}
              >
                {/* Token Icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {token.symbol.slice(0, 2)}
                  </span>
                </div>

                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-sm text-gray-400">{token.name}</div>
                </div>

                {token.balance && (
                  <div className="text-right">
                    <div className="text-white">{token.balance}</div>
                    {token.priceUsd && (
                      <div className="text-sm text-gray-400">
                        ${(parseFloat(token.balance) * token.priceUsd).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {selectedToken?.address === token.address && (
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Token Amount Input
function TokenAmountInput({
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  label,
  disabled = false,
  showMax = false,
  usdValue,
}: {
  token?: Token;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  label: string;
  disabled?: boolean;
  showMax?: boolean;
  usdValue?: string;
}) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {token?.balance && (
          <span className="text-sm text-gray-400">
            Balance: {token.balance}
            {showMax && (
              <button
                onClick={() => onAmountChange(token.balance || "0")}
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
        <button
          onClick={onTokenSelect}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          {token ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {token.symbol.slice(0, 2)}
                </span>
              </div>
              <span className="font-medium text-white">{token.symbol}</span>
            </>
          ) : (
            <span className="text-white">Select</span>
          )}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      {usdValue && (
        <div className="mt-1 text-sm text-gray-500">~${usdValue}</div>
      )}
    </div>
  );
}

// Main Swap Interface
export function SwapInterface({
  defaultInputToken,
  defaultOutputToken,
  onSwapSuccess,
}: SwapInterfaceProps) {
  const { evmAccount, isConnected } = useWallet();

  // State
  const [inputToken, setInputToken] = useState<Token | undefined>(
    defaultInputToken || DEFAULT_TOKENS[0]
  );
  const [outputToken, setOutputToken] = useState<Token | undefined>(
    defaultOutputToken || DEFAULT_TOKENS[2]
  );
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showInputTokenSelector, setShowInputTokenSelector] = useState(false);
  const [showOutputTokenSelector, setShowOutputTokenSelector] = useState(false);
  const [tokens, setTokens] = useState<Token[]>(DEFAULT_TOKENS);

  // Fetch quote when input changes
  useEffect(() => {
    async function fetchQuote() {
      if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
        setQuote(null);
        setOutputAmount("");
        return;
      }

      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock quote calculation using SelendraDEX fee structure
      const inputUsd = parseFloat(inputAmount) * (inputToken.priceUsd || 0);
      const outputValue = inputUsd / (outputToken.priceUsd || 1);
      const priceImpact = Math.random() * 0.5; // Random impact 0-0.5%
      const totalFee = inputUsd * DEX_CONFIG.swapFee; // 0.30% fee
      const burnedFee = inputUsd * DEX_CONFIG.burnShare; // 0.05% burned

      const mockQuote: SwapQuote = {
        inputAmount,
        outputAmount: outputValue.toFixed(6),
        priceImpact,
        minimumReceived: (outputValue * (1 - slippage / 100)).toFixed(6),
        route: [inputToken.symbol, outputToken.symbol],
        fee: totalFee.toFixed(4),
        gasCost: "0.001",
        exchangeRate: `1 ${inputToken.symbol} = ${(
          (inputToken.priceUsd || 0) / (outputToken.priceUsd || 1)
        ).toFixed(4)} ${outputToken.symbol}`,
      };

      setQuote(mockQuote);
      setOutputAmount(mockQuote.outputAmount);
      setIsLoading(false);
    }

    const debounce = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounce);
  }, [inputToken, outputToken, inputAmount, slippage]);

  // Calculate USD values
  const inputUsdValue = useMemo(() => {
    if (!inputAmount || !inputToken?.priceUsd) return undefined;
    return (parseFloat(inputAmount) * inputToken.priceUsd).toFixed(2);
  }, [inputAmount, inputToken]);

  const outputUsdValue = useMemo(() => {
    if (!outputAmount || !outputToken?.priceUsd) return undefined;
    return (parseFloat(outputAmount) * outputToken.priceUsd).toFixed(2);
  }, [outputAmount, outputToken]);

  // Switch tokens
  const handleSwitchTokens = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
  }, [inputToken, outputToken, inputAmount, outputAmount]);

  // Execute swap
  const handleSwap = useCallback(async () => {
    if (!isConnected || !quote || !inputToken || !outputToken) {
      toast.error("Please connect your wallet and select tokens");
      return;
    }

    setIsLoading(true);

    try {
      // In a real implementation, this would call a DEX contract
      // For now, simulate the swap
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock success
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

      toast.success(
        <div>
          <div className="font-medium">Swap Successful!</div>
          <div className="text-sm text-gray-400">
            {inputAmount} {inputToken.symbol} → {outputAmount} {outputToken.symbol}
          </div>
        </div>
      );

      onSwapSuccess?.(mockTxHash);

      // Reset form
      setInputAmount("");
      setOutputAmount("");
      setQuote(null);
    } catch (error) {
      console.error("Swap failed:", error);
      toast.error(error instanceof Error ? error.message : "Swap failed");
    } finally {
      setIsLoading(false);
    }
  }, [evmAccount, quote, inputToken, outputToken, inputAmount, outputAmount, onSwapSuccess]);

  // Check if swap is valid
  const canSwap = useMemo(() => {
    return (
      isConnected &&
      !!inputToken &&
      !!outputToken &&
      !!inputAmount &&
      parseFloat(inputAmount) > 0 &&
      !!quote &&
      !isLoading
    );
  }, [isConnected, inputToken, outputToken, inputAmount, quote, isLoading]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">SelendraDEX</h2>
            <span className="text-xs text-gray-500 ml-1">0.30% fee</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputAmount("");
                setOutputAmount("");
                setQuote(null);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Swap Form */}
        <div className="p-4 space-y-2">
          {/* Input Token */}
          <TokenAmountInput
            token={inputToken}
            amount={inputAmount}
            onAmountChange={setInputAmount}
            onTokenSelect={() => setShowInputTokenSelector(true)}
            label="You Pay"
            showMax
            usdValue={inputUsdValue}
          />

          {/* Switch Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwitchTokens}
              className="p-2 bg-gray-800 hover:bg-gray-700 border-4 border-gray-900 rounded-xl transition-colors"
            >
              <ArrowDownUp className="w-5 h-5 text-purple-400" />
            </button>
          </div>

          {/* Output Token */}
          <TokenAmountInput
            token={outputToken}
            amount={outputAmount}
            onAmountChange={() => { }}
            onTokenSelect={() => setShowOutputTokenSelector(true)}
            label="You Receive"
            disabled
            usdValue={outputUsdValue}
          />
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="px-4 pb-4 space-y-3">
            <div className="p-3 bg-gray-800/50 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange Rate</span>
                <span className="text-white">{quote.exchangeRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Impact</span>
                <span
                  className={clsx(
                    quote.priceImpact > 3
                      ? "text-red-400"
                      : quote.priceImpact > 1
                        ? "text-amber-400"
                        : "text-emerald-400"
                  )}
                >
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Received</span>
                <span className="text-white">
                  {quote.minimumReceived} {outputToken?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Swap Fee (0.30%)</span>
                <span className="text-white">${quote.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">→ LP Reward (0.20%)</span>
                <span className="text-emerald-400 text-xs">+ ${(parseFloat(quote.fee) * (DEX_CONFIG.lpShare / DEX_CONFIG.swapFee)).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs">→ Burned (0.05%)</span>
                <span className="text-orange-400 text-xs">🔥 ${(parseFloat(quote.fee) * (DEX_CONFIG.burnShare / DEX_CONFIG.swapFee)).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee</span>
                <span className="text-white">~{quote.gasCost} SEL</span>
              </div>
            </div>

            {quote.route.length > 2 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-4 h-4" />
                Route: {quote.route.join(" → ")}
              </div>
            )}

            {quote.priceImpact > 3 && (
              <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  High price impact! You may receive significantly less than expected.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <div className="p-4 pt-0">
          {!evmAccount ? (
            <button
              disabled
              className="w-full py-4 bg-gray-700 rounded-xl text-gray-400 font-medium cursor-not-allowed"
            >
              Connect Wallet
            </button>
          ) : !inputToken || !outputToken ? (
            <button
              disabled
              className="w-full py-4 bg-gray-700 rounded-xl text-gray-400 font-medium cursor-not-allowed"
            >
              Select Tokens
            </button>
          ) : !inputAmount || parseFloat(inputAmount) <= 0 ? (
            <button
              disabled
              className="w-full py-4 bg-gray-700 rounded-xl text-gray-400 font-medium cursor-not-allowed"
            >
              Enter Amount
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-colors",
                canSwap
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {quote ? "Swapping..." : "Getting Quote..."}
                </>
              ) : (
                "Swap"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        slippage={slippage}
        setSlippage={setSlippage}
        deadline={deadline}
        setDeadline={setDeadline}
      />

      <TokenSelector
        isOpen={showInputTokenSelector}
        onClose={() => setShowInputTokenSelector(false)}
        onSelect={setInputToken}
        selectedToken={inputToken}
        excludeToken={outputToken}
        tokens={tokens}
      />

      <TokenSelector
        isOpen={showOutputTokenSelector}
        onClose={() => setShowOutputTokenSelector(false)}
        onSelect={setOutputToken}
        selectedToken={outputToken}
        excludeToken={inputToken}
        tokens={tokens}
      />
    </div>
  );
}

export default SwapInterface;
