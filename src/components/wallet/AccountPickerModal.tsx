"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Copy,
  ExternalLink,
  Wallet,
  ChevronRight,
  Search,
  Plus,
  RefreshCw,
  User,
  Hexagon,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "../providers/WalletProvider";
import { AddressDisplay, VMBadge } from "@/components/common";
import toast from "react-hot-toast";

interface AccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect?: (account: SubstrateAccount | EVMAccount) => void;
  mode?: "substrate" | "evm" | "all";
  title?: string;
}

interface SubstrateAccount {
  address: string;
  name?: string;
  source: string;
}

interface EVMAccount {
  address: string;
  chainId: number;
}

interface Balance {
  free: string;
  formatted: string;
}

export function AccountPickerModal({
  isOpen,
  onClose,
  onAccountSelect,
  mode = "all",
  title = "Select Account",
}: AccountPickerModalProps) {
  const {
    substrateAccounts,
    evmAccount,
    selectedSubstrateAccount,
    selectSubstrateAccount,
    connectSubstrateWallet,
    connectEvmWallet,
    substrateBalance,
    evmBalance,
    isConnecting,
    refreshBalances,
  } = useWallet();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"substrate" | "evm">(
    mode === "evm" ? "evm" : "substrate"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter accounts based on search
  const filteredSubstrateAccounts = substrateAccounts.filter(
    (account) =>
      account.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSubstrateAccount = (account: SubstrateAccount) => {
    selectSubstrateAccount(account);
    onAccountSelect?.(account);
    toast.success(`Selected ${account.name || "account"}`);
    onClose();
  };

  const handleSelectEvmAccount = () => {
    if (evmAccount) {
      onAccountSelect?.(evmAccount);
      toast.success("Selected EVM account");
      onClose();
    }
  };

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

  const handleConnectWallet = async () => {
    try {
      if (activeTab === "substrate") {
        await connectSubstrateWallet();
      } else {
        await connectEvmWallet();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-foreground-secondary">
                Choose an account to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Tabs (if mode is "all") */}
        {mode === "all" && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("substrate")}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium transition-colors relative",
                activeTab === "substrate"
                  ? "text-primary"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Hexagon className="w-4 h-4" />
                Substrate
                {substrateAccounts.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                    {substrateAccounts.length}
                  </span>
                )}
              </div>
              {activeTab === "substrate" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("evm")}
              className={cn(
                "flex-1 py-3 px-4 text-sm font-medium transition-colors relative",
                activeTab === "evm"
                  ? "text-primary"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Circle className="w-4 h-4" />
                EVM
                {evmAccount && (
                  <span className="bg-purple-500/10 text-purple-500 text-xs px-1.5 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </div>
              {activeTab === "evm" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Account List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeTab === "substrate" ? (
            <>
              {filteredSubstrateAccounts.length > 0 ? (
                filteredSubstrateAccounts.map((account) => (
                  <SubstrateAccountCard
                    key={account.address}
                    account={account}
                    isSelected={
                      selectedSubstrateAccount?.address === account.address
                    }
                    balance={
                      selectedSubstrateAccount?.address === account.address
                        ? substrateBalance
                        : null
                    }
                    onSelect={() => handleSelectSubstrateAccount(account)}
                    onCopy={() => copyAddress(account.address)}
                  />
                ))
              ) : substrateAccounts.length === 0 ? (
                <EmptyState
                  type="substrate"
                  onConnect={handleConnectWallet}
                  isConnecting={isConnecting}
                />
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  No accounts match your search
                </div>
              )}
            </>
          ) : (
            <>
              {evmAccount ? (
                <EVMAccountCard
                  account={evmAccount}
                  balance={evmBalance}
                  onSelect={handleSelectEvmAccount}
                  onCopy={() => copyAddress(evmAccount.address)}
                />
              ) : (
                <EmptyState
                  type="evm"
                  onConnect={handleConnectWallet}
                  isConnecting={isConnecting}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin")}
            />
            Refresh
          </button>
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

// Substrate Account Card Component
interface SubstrateAccountCardProps {
  account: SubstrateAccount;
  isSelected: boolean;
  balance: Balance | null;
  onSelect: () => void;
  onCopy: () => void;
}

function SubstrateAccountCard({
  account,
  isSelected,
  balance,
  onSelect,
  onCopy,
}: SubstrateAccountCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 border rounded-xl cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-background-hover"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isSelected ? "bg-primary/20" : "bg-background"
            )}
          >
            <User
              className={cn(
                "w-5 h-5",
                isSelected ? "text-primary" : "text-foreground-secondary"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {account.name || "Account"}
              </span>
              <VMBadge vm="substrate" size="sm" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <AddressDisplay
                address={account.address}
                type="substrate"
                size="sm"
                showCopy={false}
                showToggle={false}
                className="text-sm text-foreground-secondary"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="p-1 hover:bg-background-hover rounded transition-colors"
              >
                <Copy className="w-3 h-3 text-foreground-secondary" />
              </button>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="p-1 bg-primary rounded-full">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
      {balance && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">Balance</span>
            <span className="font-medium text-foreground">
              {balance.formatted}
            </span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-foreground-secondary bg-background px-2 py-0.5 rounded">
          {account.source}
        </span>
      </div>
    </div>
  );
}

// EVM Account Card Component
interface EVMAccountCardProps {
  account: EVMAccount;
  balance: Balance | null;
  onSelect: () => void;
  onCopy: () => void;
}

function EVMAccountCard({
  account,
  balance,
  onSelect,
  onCopy,
}: EVMAccountCardProps) {
  return (
    <div
      onClick={onSelect}
      className="p-4 border border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-background-hover transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Circle className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">MetaMask</span>
              <VMBadge vm="evm" size="sm" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <AddressDisplay
                address={account.address}
                type="evm"
                size="sm"
                showCopy={false}
                showToggle={false}
                className="text-sm text-foreground-secondary"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="p-1 hover:bg-background-hover rounded transition-colors"
              >
                <Copy className="w-3 h-3 text-foreground-secondary" />
              </button>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-foreground-secondary" />
      </div>
      {balance && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">Balance</span>
            <span className="font-medium text-foreground">
              {balance.formatted}
            </span>
          </div>
        </div>
      )}
      <div className="mt-2">
        <span className="text-xs text-foreground-secondary bg-background px-2 py-0.5 rounded">
          Chain ID: {account.chainId}
        </span>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  type: "substrate" | "evm";
  onConnect: () => void;
  isConnecting: boolean;
}

function EmptyState({ type, onConnect, isConnecting }: EmptyStateProps) {
  return (
    <div className="text-center py-8">
      <div
        className={cn(
          "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
          type === "substrate" ? "bg-blue-500/10" : "bg-purple-500/10"
        )}
      >
        {type === "substrate" ? (
          <Hexagon
            className={cn(
              "w-8 h-8",
              type === "substrate" ? "text-blue-500" : "text-purple-500"
            )}
          />
        ) : (
          <Circle className="w-8 h-8 text-purple-500" />
        )}
      </div>
      <h3 className="font-medium text-foreground mb-1">
        No {type === "substrate" ? "Substrate" : "EVM"} Wallet Connected
      </h3>
      <p className="text-sm text-foreground-secondary mb-4">
        {type === "substrate"
          ? "Connect Polkadot.js, Talisman, or SubWallet"
          : "Connect MetaMask or another EVM wallet"}
      </p>
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
          type === "substrate"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-purple-500 text-white hover:bg-purple-600"
        )}
      >
        {isConnecting ? "Connecting..." : `Connect ${type === "substrate" ? "Substrate" : "EVM"} Wallet`}
      </button>
    </div>
  );
}

export default AccountPickerModal;
