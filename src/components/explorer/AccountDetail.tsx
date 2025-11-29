"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { detectAddressType, isEvmAddress, isSubstrateAddress } from "@/lib/address";
import { formatUnits } from "ethers";

import { AddressDisplay, DualAddressDisplay } from "@/components/common/AddressDisplay";
import { VMBadge } from "@/components/common/VMBadge";
import { StatusBadge, StatusDot } from "@/components/common/StatusBadge";

interface AccountDetailProps {
  address: string;
}

interface AccountInfo {
  address: string;
  evmAddress?: string;
  substrateAddress?: string;
  type: "evm" | "substrate" | "unified";
  balance: string;
  balanceRaw: bigint;
  balanceUSD: string;
  nonce: number;
  isContract: boolean;
  contractName?: string;
  verified?: boolean;
  createdAt?: Date;
  transactionCount: number;
  tokenCount: number;
  freeBalance?: string;
  reservedBalance?: string;
  lockedBalance?: string;
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

// Selendra chain constants - 18 decimals
const TOKEN_DECIMALS = 18;
const TOKEN_SYMBOL = "SEL";

// Format balance from raw to human-readable with proper decimals
function formatBalance(rawBalance: bigint | string, decimals: number = TOKEN_DECIMALS): string {
  try {
    const value = typeof rawBalance === 'string' ? BigInt(rawBalance.replace(/,/g, '')) : rawBalance;
    const formatted = formatUnits(value, decimals);
    // Format with thousands separator and limit decimal places
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(num);
  } catch {
    return "0";
  }
}

// Mock data for fallback
const mockTokenBalances: TokenBalance[] = [
  {
    symbol: "SEL",
    name: "Selendra",
    logo: "🔮",
    balance: "0",
    value: "$0.00",
    address: "native",
  },
];

const mockTransactions: Transaction[] = [];

export const AccountDetail: React.FC<AccountDetailProps> = ({ address }) => {
  const { substrateSDK, evmSDK, isConnected } = useBlockchain();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"transactions" | "tokens" | "internal" | "analytics" | "code" | "read" | "write">("transactions");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch real account data from blockchain
  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const addressType = detectAddressType(address);
    let accountInfo: AccountInfo = {
      address,
      type: addressType === "unknown" ? "substrate" : addressType,
      balance: "0 SEL",
      balanceRaw: BigInt(0),
      balanceUSD: "$0.00",
      nonce: 0,
      isContract: false,
      transactionCount: 0,
      tokenCount: 1,
    };

    try {
      // Fetch Substrate account data
      if ((addressType === "substrate" || addressType === "unknown") && substrateSDK && isConnected) {
        try {
          const api = substrateSDK.getApi();
          if (api) {
            // Fetch account info using system.account
            const accountData = await api.query.system.account(address);
            const { nonce, data } = accountData;

            // Extract balance data
            const free = data.free ? BigInt(data.free.toString()) : BigInt(0);
            const reserved = data.reserved ? BigInt(data.reserved.toString()) : BigInt(0);
            const frozen = data.frozen ? BigInt(data.frozen.toString()) : BigInt(0);

            const totalBalance = free + reserved;

            accountInfo = {
              ...accountInfo,
              type: "substrate",
              balance: `${formatBalance(totalBalance)} ${TOKEN_SYMBOL}`,
              balanceRaw: totalBalance,
              balanceUSD: "$--", // Would need price feed
              nonce: nonce.toNumber(),
              freeBalance: `${formatBalance(free)} ${TOKEN_SYMBOL}`,
              reservedBalance: `${formatBalance(reserved)} ${TOKEN_SYMBOL}`,
              lockedBalance: `${formatBalance(frozen)} ${TOKEN_SYMBOL}`,
            };

            // Check if this is a unified account (has EVM mapping)
            try {
              const evmAddress = await api.query.unifiedAccounts?.evmAddresses?.(address);
              if (evmAddress && !evmAddress.isEmpty) {
                accountInfo.type = "unified";
                accountInfo.evmAddress = evmAddress.toString();
                accountInfo.substrateAddress = address;
              }
            } catch {
              // Unified accounts pallet may not be available
            }

            // Update tokens with native balance
            setTokens([
              {
                symbol: TOKEN_SYMBOL,
                name: "Selendra",
                logo: "🔮",
                balance: formatBalance(totalBalance),
                value: "$--",
                address: "native",
              },
            ]);
          }
        } catch (substrateError) {
          console.warn("Failed to fetch Substrate account data:", substrateError);
        }
      }

      // Fetch EVM account data
      if (addressType === "evm" && evmSDK && isConnected) {
        try {
          const provider = evmSDK.getEvmProvider();
          if (provider) {
            const [balance, nonce, code] = await Promise.all([
              provider.getBalance(address),
              provider.getTransactionCount(address),
              provider.getCode(address),
            ]);

            const isContract = code !== "0x";
            const balanceRaw = BigInt(balance.toString());

            accountInfo = {
              ...accountInfo,
              type: "evm",
              evmAddress: address,
              balance: `${formatBalance(balanceRaw)} ${TOKEN_SYMBOL}`,
              balanceRaw,
              balanceUSD: "$--",
              nonce,
              isContract,
            };

            // Check if this EVM address has a Substrate mapping
            if (substrateSDK && !isContract) {
              try {
                const api = substrateSDK.getApi();
                if (api) {
                  const substrateAddr = await api.query.unifiedAccounts?.nativeAddresses?.(address);
                  if (substrateAddr && !substrateAddr.isEmpty) {
                    accountInfo.type = "unified";
                    accountInfo.substrateAddress = substrateAddr.toString();
                  }
                }
              } catch {
                // Unified accounts pallet may not be available
              }
            }

            // Update tokens with native balance
            setTokens([
              {
                symbol: TOKEN_SYMBOL,
                name: "Selendra",
                logo: "🔮",
                balance: formatBalance(balanceRaw),
                value: "$--",
                address: "native",
              },
            ]);
          }
        } catch (evmError) {
          console.warn("Failed to fetch EVM account data:", evmError);
        }
      }

      // If this is a known mock contract, force UI for dev/demo
      const mockContracts = [
        "0x55d398326f99059ff775485246999027b3197955",
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "0x7c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b9e0f1a2b",
        "0x1234567890abcdef1234567890abcdef12345678",
        "0xfedcba0987654321fedcba0987654321fedcba09"
      ];
      if (mockContracts.includes(address.toLowerCase())) {
        console.log("Forcing mock contract for:", address);
        accountInfo.isContract = true;
        accountInfo.verified = true;
        accountInfo.contractName = "Mock Contract";
        // Ensure we have some mock tokens if it's a contract
        if (tokens.length <= 1) {
          setTokens(mockTokenBalances);
        }
      }

      setAccount(accountInfo);
      setTransactions(mockTransactions); // Transactions would require indexer
    } catch (error) {
      console.error("Error fetching account data:", error);
      setFetchError("Failed to fetch account data. Please try again.");

      // Set minimal account info
      setAccount({
        address,
        type: addressType === "evm" ? "evm" : "substrate",
        balance: "-- SEL",
        balanceRaw: BigInt(0),
        balanceUSD: "$--",
        nonce: 0,
        isContract: false,
        transactionCount: 0,
        tokenCount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, substrateSDK, evmSDK, isConnected]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

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
    (sum, token) => {
      const val = token.value.replace(/[$,\-]/g, "");
      return sum + (isNaN(parseFloat(val)) ? 0 : parseFloat(val));
    },
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Error Alert */}
      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{fetchError}</p>
          <button
            onClick={fetchAccountData}
            className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

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
              <VMBadge 
                vm={account.type === "unified" ? "substrate" : account.type as "evm" | "substrate"} 
                size="md"
                showLabel={account.type === "unified"}
              />
              {account.type === "unified" && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                  Unified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <AddressDisplay
                address={address}
                size="md"
                showCopy
                showToggle={account.type === "unified"}
                showVMBadge={false}
              />
              <button className="text-foreground-secondary hover:text-foreground transition-colors">
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAccountData}
            disabled={isLoading}
            className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Explorer
          </button>
        </div>
      </div>

      {/* Unified Address Info */}
      {account.type === "unified" && (
        <div className="bg-background-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground-secondary mb-3">Unified Account Addresses</h3>
          <DualAddressDisplay
            substrateAddress={account.substrateAddress}
            evmAddress={account.evmAddress}
            size="md"
          />
        </div>
      )}

      {/* Substrate Balance Breakdown (only for substrate/unified accounts) */}
      {(account.type === "substrate" || account.type === "unified") && account.freeBalance && (
        <div className="bg-background-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-medium text-foreground-secondary mb-3">Balance Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-background-secondary rounded-lg">
              <p className="text-xs text-green-400 mb-1">Free (Transferable)</p>
              <p className="font-mono text-sm">{account.freeBalance}</p>
            </div>
            <div className="p-3 bg-background-secondary rounded-lg">
              <p className="text-xs text-yellow-400 mb-1">Reserved</p>
              <p className="font-mono text-sm">{account.reservedBalance || "0 SEL"}</p>
            </div>
            <div className="p-3 bg-background-secondary rounded-lg">
              <p className="text-xs text-red-400 mb-1">Locked</p>
              <p className="font-mono text-sm">{account.lockedBalance || "0 SEL"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">SEL Balance</p>
              <p className="text-lg font-bold">{account.balance}</p>
              <p className="text-xs text-foreground-secondary">{account.balanceUSD}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total Value</p>
              <p className="text-lg font-bold">{totalValue > 0 ? `$${totalValue.toLocaleString()}` : '$--'}</p>
              <p className="text-xs text-foreground-secondary">Price data unavailable</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Nonce</p>
              <p className="text-lg font-bold">{account.nonce}</p>
              <p className="text-xs text-foreground-secondary">Transaction count</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Tokens Held</p>
              <p className="text-lg font-bold">{account.tokenCount}</p>
              <p className="text-xs text-foreground-secondary">{tokens.length} types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {(["transactions", "tokens", "internal", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? "text-selendra-400 border-selendra-400"
                : "text-foreground-secondary border-transparent hover:text-foreground"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          {account?.isContract && (["code", "read", "write"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? "text-selendra-400 border-selendra-400"
                : "text-foreground-secondary border-transparent hover:text-foreground"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "transactions" && (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Txn Hash
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    From
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    To
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Value
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Fee
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.hash}
                    className="border-b border-border hover:bg-background-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="flex items-center gap-2 text-selendra-400 hover:text-selendra-300 font-mono text-sm"
                      >
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                        <StatusDot status={tx.status} size="sm" />
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="capitalize text-sm">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AddressDisplay
                        address={tx.from}
                        size="sm"
                        showCopy={false}
                        showToggle={false}
                        linkToAccount
                      />
                    </td>
                    <td className="px-4 py-4">
                      <AddressDisplay
                        address={tx.to}
                        size="sm"
                        showCopy={false}
                        showToggle={false}
                        linkToAccount
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-sm">
                      {tx.value}
                    </td>
                    <td className="px-4 py-4 text-right text-foreground-secondary text-sm">
                      {tx.fee}
                    </td>
                    <td className="px-4 py-4 text-right text-foreground-secondary text-sm">
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
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background-secondary border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Token
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Contract
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Balance
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr
                    key={token.symbol}
                    className="border-b border-border hover:bg-background-hover transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{token.logo}</span>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-foreground-secondary">{token.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {token.address === "native" ? (
                        <span className="text-foreground-secondary">Native</span>
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
        <div className="bg-background-card border border-border rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
          <p className="text-foreground-secondary">Internal transactions will be displayed here</p>
          <p className="text-sm text-foreground-secondary mt-2">
            Shows internal transactions triggered by smart contracts
          </p>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="bg-background-card border border-border rounded-xl p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
          <p className="text-foreground-secondary">Analytics dashboard coming soon</p>
          <p className="text-sm text-foreground-secondary mt-2">
            Track balance history, transaction volume, and more
          </p>
        </div>
      )}

      {activeTab === "code" && (
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Contract Source Code</h3>
            {account.verified ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <button className="px-3 py-1.5 bg-selendra-600 hover:bg-selendra-500 rounded-lg text-xs font-medium transition-colors">
                Verify & Publish
              </button>
            )}
          </div>
          <div className="bg-background-secondary rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <p className="text-foreground-secondary">// Source code will be displayed here</p>
            <p className="text-foreground-secondary">pragma solidity ^0.8.0;</p>
            <p className="text-foreground-secondary">...</p>
          </div>
        </div>
      )}

      {activeTab === "read" && (
        <div className="bg-background-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Read Contract</h3>
          <div className="space-y-4">
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">1. balanceOf</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="address (account)"
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <button className="px-3 py-2 bg-background-hover border border-border rounded-lg text-sm">Query</button>
              </div>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">2. decimals</p>
              <p className="text-sm text-foreground-secondary">18</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "write" && (
        <div className="bg-background-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Write Contract</h3>
            <button className="px-3 py-1.5 bg-selendra-600 hover:bg-selendra-500 rounded-lg text-xs font-medium transition-colors">
              Connect to Web3
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">1. approve</p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="spender (address)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="amount (uint256)"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
                <button className="px-3 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg text-sm text-white">Write</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
