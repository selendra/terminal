"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  ChevronRight,
  Shield,
  Key,
  Users,
  Link as LinkIcon,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Hexagon,
  Circle,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useWallet } from "../providers/WalletProvider";
import { useBlockchain } from "../providers/BlockchainProvider";
import { AddressDisplay, VMBadge } from "../common";
import { AccountPickerModal } from "./AccountPickerModal";

interface AccountDetails {
  address: string;
  evmAddress?: string;
  name: string;
  source: string;
  balance: {
    free: string;
    reserved: string;
    locked: string;
    total: string;
    formatted: string;
    usdValue?: string;
  };
  nonce: number;
  identity?: {
    display?: string;
    email?: string;
    twitter?: string;
    web?: string;
    verified: boolean;
  };
  isMultisig?: boolean;
  isProxy?: boolean;
  stakingInfo?: {
    bonded: string;
    unbonding: string;
    rewards: string;
    nominations: number;
  };
}

interface Transaction {
  hash: string;
  type: "send" | "receive" | "stake" | "unstake" | "contract" | "other";
  amount: string;
  to?: string;
  from?: string;
  timestamp: Date;
  status: "pending" | "success" | "failed";
  vm: "substrate" | "evm";
}

export function MyAccounts() {
  const {
    isConnected,
    isConnecting,
    substrateAccounts,
    evmAccount,
    selectedSubstrateAccount,
    substrateBalance,
    evmBalance,
    connectSubstrateWallet,
    connectEvmWallet,
    disconnectWallet,
    selectSubstrateAccount,
    refreshBalances,
  } = useWallet();

  const { isConnected: blockchainConnected } = useBlockchain();

  const [activeTab, setActiveTab] = useState<"overview" | "substrate" | "evm" | "activity">("overview");
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [accountNicknames, setAccountNicknames] = useState<Record<string, string>>({});

  // Mock recent transactions
  const [recentTransactions] = useState<Transaction[]>([
    {
      hash: "0x1234...5678",
      type: "send",
      amount: "100 SEL",
      to: "0xabcd...efgh",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "success",
      vm: "evm",
    },
    {
      hash: "0x8765...4321",
      type: "receive",
      amount: "50 SEL",
      from: "seH5Wc...Fg8K",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "success",
      vm: "substrate",
    },
    {
      hash: "0xfedc...ba98",
      type: "stake",
      amount: "500 SEL",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "success",
      vm: "substrate",
    },
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalances();
      toast.success("Balances refreshed");
    } catch {
      toast.error("Failed to refresh balances");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const saveNickname = (address: string, nickname: string) => {
    setAccountNicknames((prev) => ({ ...prev, [address]: nickname }));
    setEditingAccount(null);
    toast.success("Nickname saved");
  };

  const exportAccount = async (address: string) => {
    // In a real implementation, this would export account data
    toast.success("Account data exported");
  };

  const totalBalance = {
    substrate: substrateBalance?.formatted || "0",
    evm: evmBalance?.formatted || "0",
    total: (
      parseFloat(substrateBalance?.formatted || "0") +
      parseFloat(evmBalance?.formatted || "0")
    ).toFixed(4),
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 text-selendra-400" />
            My Accounts
          </h1>
          <p className="text-foreground-secondary mt-1">
            Manage your connected wallets and accounts
          </p>
        </div>

        <div className="bg-background-card border border-border rounded-xl p-12 text-center">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Wallet Connected
          </h2>
          <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
            Connect your wallet to view and manage your accounts, track balances,
            and perform transactions.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => connectSubstrateWallet()}
              disabled={isConnecting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Hexagon className="h-5 w-5" />
              Connect Substrate Wallet
            </button>
            <button
              onClick={connectEvmWallet}
              disabled={isConnecting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Circle className="h-5 w-5" />
              Connect EVM Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Wallet className="h-6 w-6 text-selendra-400" />
            My Accounts
          </h1>
          <p className="text-foreground-secondary mt-1">
            Manage your connected wallets and accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
            title={showBalances ? "Hide balances" : "Show balances"}
          >
            {showBalances ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors disabled:opacity-50"
            title="Refresh balances"
          >
            <RefreshCw className={clsx("h-5 w-5", isRefreshing && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowAccountPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Total Portfolio Value */}
      <div className="bg-gradient-to-r from-selendra-600 to-selendra-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-selendra-200">Total Portfolio Value</span>
          <div className="flex items-center gap-2">
            <VMBadge vm="substrate" size="sm" />
            <span className="text-selendra-200">+</span>
            <VMBadge vm="evm" size="sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {showBalances ? `${totalBalance.total} SEL` : "••••••"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-selendra-500/30">
          <div>
            <span className="text-selendra-200 text-sm">Substrate</span>
            <p className="text-lg font-semibold">
              {showBalances ? `${totalBalance.substrate} SEL` : "••••"}
            </p>
          </div>
          <div>
            <span className="text-selendra-200 text-sm">EVM</span>
            <p className="text-lg font-semibold">
              {showBalances ? `${totalBalance.evm} SEL` : "••••"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background-tertiary rounded-lg">
        {[
          { id: "overview", label: "Overview" },
          { id: "substrate", label: "Substrate Accounts" },
          { id: "evm", label: "EVM Account" },
          { id: "activity", label: "Activity" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background-card text-foreground shadow-sm"
                : "text-foreground-secondary hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Substrate Accounts Summary */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <VMBadge vm="substrate" showLabel />
                <span className="text-foreground font-medium">
                  ({substrateAccounts.length} accounts)
                </span>
              </div>
              <button
                onClick={() => connectSubstrateWallet()}
                className="text-sm text-selendra-400 hover:text-selendra-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {substrateAccounts.slice(0, 3).map((account) => (
                <div
                  key={account.address}
                  onClick={() => selectSubstrateAccount(account)}
                  className={clsx(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedSubstrateAccount?.address === account.address
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border hover:border-border-hover"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {accountNicknames[account.address] || account.name || "Account"}
                      </p>
                      <AddressDisplay
                        address={account.address}
                        type="substrate"
                        size="sm"
                        showCopy={false}
                        showToggle={false}
                      />
                    </div>
                    {selectedSubstrateAccount?.address === account.address && (
                      <div className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Active
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {substrateAccounts.length > 3 && (
                <button
                  onClick={() => setActiveTab("substrate")}
                  className="w-full py-2 text-sm text-foreground-secondary hover:text-foreground"
                >
                  View all {substrateAccounts.length} accounts →
                </button>
              )}
            </div>
          </div>

          {/* EVM Account Summary */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <VMBadge vm="evm" showLabel />
              {!evmAccount && (
                <button
                  onClick={connectEvmWallet}
                  className="text-sm text-selendra-400 hover:text-selendra-300"
                >
                  Connect
                </button>
              )}
            </div>
            {evmAccount ? (
              <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">MetaMask</p>
                    <AddressDisplay
                      address={evmAccount.address}
                      type="evm"
                      size="sm"
                      showCopy={false}
                      showToggle={false}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground-secondary">Balance</p>
                    <p className="font-medium text-foreground">
                      {showBalances ? `${evmBalance?.formatted || "0"} SEL` : "••••"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-foreground-secondary">
                <Circle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No EVM wallet connected</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 p-3 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                <span className="text-foreground">Send</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors">
                <ArrowDownRight className="h-5 w-5 text-blue-500" />
                <span className="text-foreground">Receive</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors">
                <QrCode className="h-5 w-5 text-purple-500" />
                <span className="text-foreground">QR Code</span>
              </button>
              <button className="flex items-center gap-2 p-3 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors">
                <Download className="h-5 w-5 text-orange-500" />
                <span className="text-foreground">Export</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-background-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Activity</h3>
              <button
                onClick={() => setActiveTab("activity")}
                className="text-sm text-selendra-400 hover:text-selendra-300"
              >
                View all
              </button>
            </div>
            <div className="space-y-3">
              {recentTransactions.slice(0, 3).map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.type === "send"
                          ? "bg-red-500/20"
                          : tx.type === "receive"
                          ? "bg-green-500/20"
                          : "bg-blue-500/20"
                      )}
                    >
                      {tx.type === "send" ? (
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      ) : tx.type === "receive" ? (
                        <ArrowDownRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <Wallet className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {tx.type}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {tx.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={clsx(
                        "text-sm font-medium",
                        tx.type === "send" ? "text-red-400" : "text-green-400"
                      )}
                    >
                      {tx.type === "send" ? "-" : "+"}
                      {tx.amount}
                    </p>
                    <VMBadge vm={tx.vm} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Substrate Accounts Tab */}
      {activeTab === "substrate" && (
        <div className="space-y-4">
          {substrateAccounts.map((account) => (
            <div
              key={account.address}
              className="bg-background-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Hexagon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    {editingAccount === account.address ? (
                      <input
                        type="text"
                        defaultValue={accountNicknames[account.address] || account.name}
                        onBlur={(e) => saveNickname(account.address, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveNickname(account.address, e.currentTarget.value);
                          }
                        }}
                        className="px-2 py-1 bg-background-tertiary border border-border rounded text-foreground focus:outline-none focus:border-selendra-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {accountNicknames[account.address] || account.name || "Account"}
                        </h3>
                        <button
                          onClick={() => setEditingAccount(account.address)}
                          className="p-1 text-foreground-secondary hover:text-foreground"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <AddressDisplay
                      address={account.address}
                      type="substrate"
                      size="sm"
                      showToggle
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-foreground-secondary bg-background px-2 py-0.5 rounded">
                        {account.source}
                      </span>
                      {selectedSubstrateAccount?.address === account.address && (
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyAddress(account.address)}
                    className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportAccount(account.address)}
                    className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
                    title="Export account"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">Balance</p>
                  <p className="font-semibold text-foreground">
                    {showBalances
                      ? selectedSubstrateAccount?.address === account.address
                        ? `${substrateBalance?.formatted || "0"} SEL`
                        : "-- SEL"
                      : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Reserved</p>
                  <p className="font-semibold text-foreground">
                    {showBalances ? "0 SEL" : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Staked</p>
                  <p className="font-semibold text-foreground">
                    {showBalances ? "0 SEL" : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Nonce</p>
                  <p className="font-semibold text-foreground">0</p>
                </div>
              </div>
              {selectedSubstrateAccount?.address !== account.address && (
                <button
                  onClick={() => selectSubstrateAccount(account)}
                  className="mt-4 w-full py-2 border border-selendra-500 text-selendra-400 rounded-lg hover:bg-selendra-500/10 transition-colors"
                >
                  Set as Active Account
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => connectSubstrateWallet()}
            className="w-full py-4 border-2 border-dashed border-border rounded-xl text-foreground-secondary hover:text-foreground hover:border-border-hover transition-colors"
          >
            + Connect Another Substrate Wallet
          </button>
        </div>
      )}

      {/* EVM Account Tab */}
      {activeTab === "evm" && (
        <div className="space-y-4">
          {evmAccount ? (
            <div className="bg-background-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Circle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">MetaMask</h3>
                    <AddressDisplay
                      address={evmAccount.address}
                      type="evm"
                      size="sm"
                      showToggle
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-foreground-secondary bg-background px-2 py-0.5 rounded">
                        Chain ID: {evmAccount.chainId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyAddress(evmAccount.address)}
                    className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={disconnectWallet}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-foreground-secondary">Balance</p>
                  <p className="font-semibold text-foreground">
                    {showBalances ? `${evmBalance?.formatted || "0"} SEL` : "••••"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Network</p>
                  <p className="font-semibold text-foreground">
                    {evmAccount.chainId === 1961
                      ? "Selendra Mainnet"
                      : evmAccount.chainId === 1953
                      ? "Selendra Testnet"
                      : `Chain ${evmAccount.chainId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">Tokens</p>
                  <p className="font-semibold text-foreground">0</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">NFTs</p>
                  <p className="font-semibold text-foreground">0</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-background-card border border-border rounded-xl p-12 text-center">
              <Circle className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No EVM Wallet Connected
              </h2>
              <p className="text-foreground-secondary mb-6">
                Connect MetaMask or another EVM-compatible wallet to access your EVM account.
              </p>
              <button
                onClick={connectEvmWallet}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
              >
                Connect MetaMask
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="bg-background-card border border-border rounded-xl">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Transaction History</h3>
            <button className="text-sm text-selendra-400 hover:text-selendra-300">
              Export CSV
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.map((tx, index) => (
              <div key={index} className="p-4 flex items-center justify-between hover:bg-background-hover">
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      tx.type === "send"
                        ? "bg-red-500/20"
                        : tx.type === "receive"
                        ? "bg-green-500/20"
                        : "bg-blue-500/20"
                    )}
                  >
                    {tx.type === "send" ? (
                      <ArrowUpRight className="h-5 w-5 text-red-500" />
                    ) : tx.type === "receive" ? (
                      <ArrowDownRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <Wallet className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">{tx.type}</p>
                    <p className="text-sm text-foreground-secondary">
                      {tx.to ? `To: ${tx.to}` : tx.from ? `From: ${tx.from}` : tx.hash}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={clsx(
                      "font-semibold",
                      tx.type === "send" ? "text-red-400" : "text-green-400"
                    )}
                  >
                    {tx.type === "send" ? "-" : "+"}
                    {tx.amount}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-foreground-secondary">
                      {tx.timestamp.toLocaleDateString()}
                    </span>
                    <VMBadge vm={tx.vm} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {recentTransactions.length === 0 && (
            <div className="p-12 text-center text-foreground-secondary">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
            </div>
          )}
        </div>
      )}

      {/* Account Picker Modal */}
      <AccountPickerModal
        isOpen={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        onAccountSelect={(account) => {
          if ("source" in account) {
            selectSubstrateAccount(account);
          }
          setShowAccountPicker(false);
        }}
      />
    </div>
  );
}
