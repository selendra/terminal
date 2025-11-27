"use client";

import React, { useState, useEffect } from "react";
import {
  Copy,
  CheckCircle,
  ExternalLink,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Activity,
  Coins,
  FileCode,
  Shield,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  QrCode,
} from "lucide-react";
import Link from "next/link";

interface AccountDetailProps {
  address: string;
}

interface AccountInfo {
  address: string;
  evmAddress?: string;
  substrateAddress?: string;
  type: "evm" | "substrate" | "unified";
  balance: string;
  balanceUSD: string;
  nonce: number;
  isContract: boolean;
  contractName?: string;
  verified?: boolean;
  createdAt?: Date;
  transactionCount: number;
  tokenCount: number;
}

interface TokenBalance {
  symbol: string;
  name: string;
  logo: string;
  balance: string;
  value: string;
  address: string;
}

interface Transaction {
  hash: string;
  type: "send" | "receive" | "contract";
  from: string;
  to: string;
  value: string;
  timestamp: Date;
  status: "success" | "failed" | "pending";
  fee: string;
}

const mockAccount: AccountInfo = {
  address: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  evmAddress: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  substrateAddress: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  type: "unified",
  balance: "1,250.5678 SEL",
  balanceUSD: "$57.02",
  nonce: 142,
  isContract: false,
  transactionCount: 342,
  tokenCount: 8,
};

const mockTokenBalances: TokenBalance[] = [
  {
    symbol: "SEL",
    name: "Selendra",
    logo: "🔮",
    balance: "1,250.5678",
    value: "$57.02",
    address: "native",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    logo: "💵",
    balance: "5,250.00",
    value: "$5,250.00",
    address: "0x55d398326f99059ff775485246999027b3197955",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    logo: "💲",
    balance: "2,100.00",
    value: "$2,100.00",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  },
  {
    symbol: "WSEL",
    name: "Wrapped SEL",
    logo: "🔮",
    balance: "500.00",
    value: "$22.75",
    address: "0x7c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b",
  },
  {
    symbol: "SDEFI",
    name: "Selendra DeFi",
    logo: "💎",
    balance: "10,000.00",
    value: "$1,250.00",
    address: "0x1234567890abcdef1234567890abcdef12345678",
  },
];

const mockTransactions: Transaction[] = [
  {
    hash: "0x8a5d3f2b1e9c4a7d6b8e5f2a1c3d4e5f6a7b8c9d",
    type: "receive",
    from: "0x123...abc",
    to: "0x742...f44e",
    value: "100.00 SEL",
    timestamp: new Date(Date.now() - 3600000),
    status: "success",
    fee: "0.0025 SEL",
  },
  {
    hash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
    type: "send",
    from: "0x742...f44e",
    to: "0x456...def",
    value: "50.00 USDT",
    timestamp: new Date(Date.now() - 7200000),
    status: "success",
    fee: "0.0015 SEL",
  },
  {
    hash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d",
    type: "contract",
    from: "0x742...f44e",
    to: "0x789...ghi",
    value: "0 SEL",
    timestamp: new Date(Date.now() - 14400000),
    status: "success",
    fee: "0.0045 SEL",
  },
  {
    hash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    type: "receive",
    from: "0xabc...123",
    to: "0x742...f44e",
    value: "1,000.00 USDC",
    timestamp: new Date(Date.now() - 28800000),
    status: "success",
    fee: "0.0020 SEL",
  },
  {
    hash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f",
    type: "send",
    from: "0x742...f44e",
    to: "0xdef...456",
    value: "25.50 SEL",
    timestamp: new Date(Date.now() - 43200000),
    status: "failed",
    fee: "0.0025 SEL",
  },
];

export const AccountDetail: React.FC<AccountDetailProps> = ({ address }) => {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"transactions" | "tokens" | "internal" | "analytics">("transactions");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching account data
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAccount({ ...mockAccount, address });
      setTokens(mockTokenBalances);
      setTransactions(mockTransactions);
      setIsLoading(false);
    };
    fetchData();
  }, [address]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getTransactionIcon = (type: Transaction["type"]) => {
    switch (type) {
      case "send":
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case "receive":
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case "contract":
        return <FileCode className="w-4 h-4 text-blue-400" />;
    }
  };

  if (isLoading || !account) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-selendra-500" />
      </div>
    );
  }

  const totalValue = tokens.reduce(
    (sum, token) => sum + parseFloat(token.value.replace(/[$,]/g, "")),
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-selendra-600 to-selendra-400 rounded-2xl flex items-center justify-center">
            {account.isContract ? (
              <FileCode className="w-8 h-8" />
            ) : (
              <Wallet className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {account.isContract ? account.contractName || "Contract" : "Account"}
              </h1>
              {account.isContract && account.verified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                account.type === "evm" ? "bg-orange-500/20 text-orange-400" :
                account.type === "substrate" ? "bg-cyan-500/20 text-cyan-400" :
                "bg-purple-500/20 text-purple-400"
              }`}>
                {account.type === "unified" ? "Unified" : account.type.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-gray-400 text-sm font-mono">
                {address.slice(0, 10)}...{address.slice(-8)}
              </code>
              <button
                onClick={() => copyToClipboard(address, "address")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied === "address" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button className="text-gray-400 hover:text-white transition-colors">
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-lg transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Explorer
          </button>
        </div>
      </div>

      {/* Unified Address Info */}
      {account.type === "unified" && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Unified Account Addresses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div>
                <p className="text-xs text-orange-400 mb-1">EVM Address</p>
                <code className="text-sm font-mono">
                  {account.evmAddress?.slice(0, 18)}...{account.evmAddress?.slice(-8)}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(account.evmAddress || "", "evm")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied === "evm" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div>
                <p className="text-xs text-cyan-400 mb-1">Substrate Address</p>
                <code className="text-sm font-mono">
                  {account.substrateAddress?.slice(0, 18)}...{account.substrateAddress?.slice(-8)}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(account.substrateAddress || "", "substrate")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copied === "substrate" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">SEL Balance</p>
              <p className="text-lg font-bold">{account.balance}</p>
              <p className="text-xs text-gray-500">{account.balanceUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-lg font-bold">${totalValue.toLocaleString()}</p>
              <p className="text-xs text-green-400">+5.2% (24h)</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Transactions</p>
              <p className="text-lg font-bold">{account.transactionCount}</p>
              <p className="text-xs text-gray-500">Nonce: {account.nonce}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Tokens Held</p>
              <p className="text-lg font-bold">{account.tokenCount}</p>
              <p className="text-xs text-gray-500">{tokens.length} types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex gap-4">
          {(["transactions", "tokens", "internal", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-selendra-400 border-selendra-400"
                  : "text-gray-400 border-transparent hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "transactions" && (
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Txn Hash
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    To
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Value
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Fee
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.hash}
                    className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                        {tx.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : tx.status === "failed" ? (
                          <span className="text-red-400 text-xs">Failed</span>
                        ) : (
                          <RefreshCw className="w-4 h-4 animate-spin text-yellow-400" />
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="capitalize text-sm">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/address/${tx.from}`}
                        className="text-gray-400 hover:text-white font-mono text-sm"
                      >
                        {tx.from}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/address/${tx.to}`}
                        className="text-gray-400 hover:text-white font-mono text-sm"
                      >
                        {tx.to}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      {tx.value}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">
                      {tx.fee}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">
                      {Math.round((Date.now() - tx.timestamp.getTime()) / 60000)}m ago
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "tokens" && (
        <div className="bg-background-card border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Token
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                    Contract
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Balance
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr
                    key={token.symbol}
                    className="border-b border-gray-800 hover:bg-background-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{token.logo}</span>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-gray-400">{token.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {token.address === "native" ? (
                        <span className="text-gray-400">Native</span>
                      ) : (
                        <Link
                          href={`/tokens/${token.address}`}
                          className="text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                        >
                          {token.address.slice(0, 10)}...{token.address.slice(-6)}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono">
                      {token.balance}
                    </td>
                    <td className="px-4 py-4 text-right font-medium">
                      {token.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "internal" && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Internal transactions will be displayed here</p>
          <p className="text-sm text-gray-500 mt-2">
            Shows internal transactions triggered by smart contracts
          </p>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="bg-background-card border border-gray-800 rounded-xl p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Analytics dashboard coming soon</p>
          <p className="text-sm text-gray-500 mt-2">
            Track balance history, transaction volume, and more
          </p>
        </div>
      )}
    </div>
  );
};
