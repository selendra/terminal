"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Shield,
  Loader2,
} from "lucide-react";
import { useWallet } from "@/components/providers/WalletProvider";

interface Network {
  id: string;
  name: string;
  logo: string;
  chainId?: number;
  nativeCurrency: string;
  type: "evm" | "substrate";
  color: string;
}

interface Token {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
  decimals: number;
  minBridge: string;
  maxBridge: string;
  fee: string;
}

interface BridgeTransaction {
  id: string;
  fromNetwork: string;
  toNetwork: string;
  token: string;
  amount: string;
  status: "pending" | "confirming" | "completed" | "failed";
  timestamp: Date;
  txHash: string;
}

const networks: Network[] = [
  {
    id: "selendra-evm",
    name: "Selendra EVM",
    logo: "🔮",
    chainId: 1961,
    nativeCurrency: "SEL",
    type: "evm",
    color: "#7C3AED",
  },
  {
    id: "selendra-substrate",
    name: "Selendra Substrate",
    logo: "⚛️",
    nativeCurrency: "SEL",
    type: "substrate",
    color: "#06B6D4",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    logo: "⟠",
    chainId: 1,
    nativeCurrency: "ETH",
    type: "evm",
    color: "#627EEA",
  },
  {
    id: "bsc",
    name: "BNB Chain",
    logo: "🔶",
    chainId: 56,
    nativeCurrency: "BNB",
    type: "evm",
    color: "#F0B90B",
  },
  {
    id: "polygon",
    name: "Polygon",
    logo: "🟣",
    chainId: 137,
    nativeCurrency: "MATIC",
    type: "evm",
    color: "#8247E5",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    logo: "⬡",
    nativeCurrency: "DOT",
    type: "substrate",
    color: "#E6007A",
  },
];

const tokens: Token[] = [
  {
    symbol: "SEL",
    name: "Selendra",
    logo: "🔮",
    balance: "1,250.00",
    decimals: 18,
    minBridge: "10",
    maxBridge: "1000000",
    fee: "0.1%",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    logo: "💵",
    balance: "5,000.00",
    decimals: 6,
    minBridge: "10",
    maxBridge: "500000",
    fee: "0.05%",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    logo: "💲",
    balance: "3,200.00",
    decimals: 6,
    minBridge: "10",
    maxBridge: "500000",
    fee: "0.05%",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    logo: "⟠",
    balance: "2.5",
    decimals: 18,
    minBridge: "0.01",
    maxBridge: "1000",
    fee: "0.1%",
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    logo: "₿",
    balance: "0.15",
    decimals: 8,
    minBridge: "0.001",
    maxBridge: "100",
    fee: "0.15%",
  },
];

const mockTransactions: BridgeTransaction[] = [
  {
    id: "1",
    fromNetwork: "Ethereum",
    toNetwork: "Selendra EVM",
    token: "USDT",
    amount: "1,000.00",
    status: "completed",
    timestamp: new Date(Date.now() - 3600000),
    txHash: "0x123...abc",
  },
  {
    id: "2",
    fromNetwork: "Selendra EVM",
    toNetwork: "BNB Chain",
    token: "SEL",
    amount: "500.00",
    status: "confirming",
    timestamp: new Date(Date.now() - 1800000),
    txHash: "0x456...def",
  },
  {
    id: "3",
    fromNetwork: "Polygon",
    toNetwork: "Selendra EVM",
    token: "USDC",
    amount: "2,500.00",
    status: "pending",
    timestamp: new Date(Date.now() - 600000),
    txHash: "0x789...ghi",
  },
];

export const BridgeInterface: React.FC = () => {
  const { 
    isConnected, 
    selectedSubstrateAccount, 
    evmAccount, 
    connectEvmWallet,
    connectSubstrateWallet 
  } = useWallet();
  
  // Get address from whichever account is connected
  const address = selectedSubstrateAccount?.address || evmAccount?.address || null;
  
  const connect = () => {
    // Default to connecting EVM wallet for bridge
    connectEvmWallet();
  };
  
  const [fromNetwork, setFromNetwork] = useState<Network>(networks[0]);
  const [toNetwork, setToNetwork] = useState<Network>(networks[2]);
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0]);
  const [amount, setAmount] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>(mockTransactions);
  const [estimatedTime, setEstimatedTime] = useState("5-10 minutes");
  const [bridgeFee, setBridgeFee] = useState("0.00");

  useEffect(() => {
    // Calculate bridge fee
    if (amount && !isNaN(parseFloat(amount))) {
      const feePercent = parseFloat(selectedToken.fee) / 100;
      const fee = (parseFloat(amount.replace(/,/g, "")) * feePercent).toFixed(4);
      setBridgeFee(fee);
    } else {
      setBridgeFee("0.00");
    }
  }, [amount, selectedToken]);

  const swapNetworks = () => {
    const temp = fromNetwork;
    setFromNetwork(toNetwork);
    setToNetwork(temp);
  };

  const handleBridge = async () => {
    if (!isConnected) {
      connect();
      return;
    }

    setIsBridging(true);
    // Simulate bridge transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newTx: BridgeTransaction = {
      id: Date.now().toString(),
      fromNetwork: fromNetwork.name,
      toNetwork: toNetwork.name,
      token: selectedToken.symbol,
      amount,
      status: "pending",
      timestamp: new Date(),
      txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
    };

    setTransactions([newTx, ...transactions]);
    setIsBridging(false);
    setAmount("");
  };

  const getStatusIcon = (status: BridgeTransaction["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "confirming":
        return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: BridgeTransaction["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-400/10";
      case "confirming":
        return "text-blue-400 bg-blue-400/10";
      case "completed":
        return "text-green-400 bg-green-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
    }
  };

  const receiveAmount = amount
    ? (parseFloat(amount.replace(/,/g, "")) - parseFloat(bridgeFee)).toFixed(4)
    : "0.00";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bridge</h1>
          <p className="text-foreground-secondary mt-1">
            Transfer assets between Selendra and other networks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          <span className="text-sm text-foreground-secondary">Secured by Selendra</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bridge Card */}
        <div className="lg:col-span-2">
          <div className="bg-background-card border border-border rounded-xl p-6">
            {/* From Network */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">From</span>
                <span className="text-sm text-foreground-secondary">
                  Balance: {selectedToken.balance} {selectedToken.symbol}
                </span>
              </div>

              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  {/* Network Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFromDropdown(!showFromDropdown)}
                      className="flex items-center gap-2 bg-background-tertiary hover:bg-background-hover rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="text-2xl">{fromNetwork.logo}</span>
                      <span className="font-medium">{fromNetwork.name}</span>
                      <ArrowUpDown className="w-4 h-4 text-foreground-secondary" />
                    </button>

                    {showFromDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-background-secondary border border-border rounded-xl shadow-xl z-20">
                        {networks
                          .filter((n) => n.id !== toNetwork.id)
                          .map((network) => (
                            <button
                              key={network.id}
                              onClick={() => {
                                setFromNetwork(network);
                                setShowFromDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                              <span className="text-2xl">{network.logo}</span>
                              <div className="text-left">
                                <p className="font-medium">{network.name}</p>
                                <p className="text-xs text-foreground-secondary capitalize">
                                  {network.type}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Token Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                      className="flex items-center gap-2 bg-background-tertiary hover:bg-background-hover rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="text-xl">{selectedToken.logo}</span>
                      <span className="font-medium">{selectedToken.symbol}</span>
                      <ArrowUpDown className="w-4 h-4 text-foreground-secondary" />
                    </button>

                    {showTokenDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-background-secondary border border-border rounded-xl shadow-xl z-20">
                        {tokens.map((token) => (
                          <button
                            key={token.symbol}
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTokenDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-background-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{token.logo}</span>
                              <div className="text-left">
                                <p className="font-medium">{token.symbol}</p>
                                <p className="text-xs text-foreground-secondary">{token.name}</p>
                              </div>
                            </div>
                            <span className="text-sm text-foreground-secondary">
                              {token.balance}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-3xl font-medium placeholder-foreground-secondary outline-none"
                  />
                  <button
                    onClick={() => setAmount(selectedToken.balance.replace(/,/g, ""))}
                    className="px-3 py-1 text-sm text-selendra-500 hover:text-selendra-400 bg-selendra-500/10 rounded-lg transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={swapNetworks}
                className="bg-selendra-600 hover:bg-selendra-500 rounded-xl p-2 transition-colors border-4 border-background-card"
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>
            </div>

            {/* To Network */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">To</span>
              </div>

              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  {/* Network Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowToDropdown(!showToDropdown)}
                      className="flex items-center gap-2 bg-background-tertiary hover:bg-background-hover rounded-lg px-3 py-2 transition-colors"
                    >
                      <span className="text-2xl">{toNetwork.logo}</span>
                      <span className="font-medium">{toNetwork.name}</span>
                      <ArrowUpDown className="w-4 h-4 text-foreground-secondary" />
                    </button>

                    {showToDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-background-secondary border border-border rounded-xl shadow-xl z-20">
                        {networks
                          .filter((n) => n.id !== fromNetwork.id)
                          .map((network) => (
                            <button
                              key={network.id}
                              onClick={() => {
                                setToNetwork(network);
                                setShowToDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                            >
                              <span className="text-2xl">{network.logo}</span>
                              <div className="text-left">
                                <p className="font-medium">{network.name}</p>
                                <p className="text-xs text-foreground-secondary capitalize">
                                  {network.type}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xl">{selectedToken.logo}</span>
                    <span className="font-medium">{selectedToken.symbol}</span>
                  </div>
                </div>

                {/* Receive Amount */}
                <div className="text-3xl font-medium text-foreground-secondary">
                  {receiveAmount}
                </div>
              </div>
            </div>

            {/* Bridge Details */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Bridge Fee
                </span>
                <span>
                  {bridgeFee} {selectedToken.symbol} ({selectedToken.fee})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Estimated Time
                </span>
                <span>{estimatedTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary">Min Amount</span>
                <span>
                  {selectedToken.minBridge} {selectedToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary">Max Amount</span>
                <span>
                  {selectedToken.maxBridge} {selectedToken.symbol}
                </span>
              </div>
            </div>

            {/* Bridge Button */}
            <button
              onClick={handleBridge}
              disabled={!amount || parseFloat(amount) <= 0 || isBridging}
              className="w-full mt-6 py-4 bg-gradient-to-r from-selendra-600 to-selendra-500 hover:from-selendra-500 hover:to-selendra-400 disabled:from-background-tertiary disabled:to-background-tertiary disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isBridging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Bridge {selectedToken.symbol}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Bridge Info */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Bridge Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure & Audited</p>
                  <p className="text-xs text-foreground-secondary">
                    Smart contracts audited by leading security firms
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Fast Transfers</p>
                  <p className="text-xs text-foreground-secondary">
                    Most transfers complete in 5-10 minutes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Low Fees</p>
                  <p className="text-xs text-foreground-secondary">
                    Competitive fees starting at 0.05%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Routes */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Popular Routes</h3>
            <div className="space-y-3">
              {[
                { from: "Ethereum", to: "Selendra EVM", volume: "$1.2M" },
                { from: "BNB Chain", to: "Selendra EVM", volume: "$850K" },
                { from: "Polygon", to: "Selendra EVM", volume: "$620K" },
                { from: "Selendra", to: "Polkadot", volume: "$450K" },
              ].map((route, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{route.from}</span>
                    <ArrowRight className="w-3 h-3 text-foreground-secondary" />
                    <span>{route.to}</span>
                  </div>
                  <span className="text-foreground-secondary">{route.volume}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Your Bridge Transactions</h3>
          <button className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1">
            View All
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-foreground-secondary">
            <p>No bridge transactions yet</p>
            <p className="text-sm mt-1">Your bridge history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-background-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-selendra-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tx.fromNetwork}</span>
                        <ArrowRight className="w-4 h-4 text-foreground-secondary" />
                        <span className="font-medium">{tx.toNetwork}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                        <span>
                          {tx.amount} {tx.token}
                        </span>
                        <span>•</span>
                        <span>{tx.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                        tx.status
                      )}`}
                    >
                      {getStatusIcon(tx.status)}
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                    <button className="p-2 hover:bg-background-secondary rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-foreground-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
