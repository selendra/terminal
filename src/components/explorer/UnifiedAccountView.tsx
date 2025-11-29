"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  History,
  Coins,
  FileCode,
  Star,
  StarOff,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

import { AddressDisplay, DualAddressDisplay } from "@/components/common/AddressDisplay";
import { VMBadge, type VMType } from "@/components/common/VMBadge";
import { 
  UnifiedTransactionList, 
  type UnifiedTransaction 
} from "@/components/explorer/UnifiedTransactionList";
import { usePreferences } from "@/lib/stores/preferences";
import { resolveAddress, type UnifiedAddress } from "@/lib/unified/address-resolver";
import { detectAddressType } from "@/lib/address";

/**
 * Account balance information
 */
export interface AccountBalance {
  /** Free/available balance */
  free: string;
  /** Reserved/locked balance */
  reserved: string;
  /** Total balance */
  total: string;
  /** Formatted display value */
  formatted: string;
  /** USD value (if available) */
  usdValue?: string;
}

/**
 * Token holding for an account
 */
export interface TokenHolding {
  /** Token address/ID */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Token decimals */
  decimals: number;
  /** Balance in smallest unit */
  balance: string;
  /** Formatted balance */
  formatted: string;
  /** USD value */
  usdValue?: string;
  /** Token logo URL */
  logoUrl?: string;
  /** Token type */
  type: "native" | "erc20" | "psp22";
}

/**
 * Unified account data
 */
export interface UnifiedAccountData {
  /** Primary address (as provided) */
  address: string;
  /** Resolved unified addresses */
  unifiedAddress?: UnifiedAddress;
  /** Substrate balance */
  substrateBalance?: AccountBalance;
  /** EVM balance */
  evmBalance?: AccountBalance;
  /** Token holdings */
  tokens: TokenHolding[];
  /** Recent transactions */
  transactions: UnifiedTransaction[];
  /** Account identity (if set) */
  identity?: {
    display?: string;
    legal?: string;
    web?: string;
    email?: string;
    twitter?: string;
  };
  /** Is this a contract account */
  isContract: boolean;
  /** Contract type (if applicable) */
  contractType?: "evm" | "ink";
  /** Account created block */
  createdAtBlock?: number;
  /** Total transaction count */
  transactionCount: number;
}

interface UnifiedAccountViewProps {
  /** Account address (SS58 or 0x) */
  address: string;
  /** Pre-loaded account data (optional) */
  accountData?: UnifiedAccountData;
  /** Loading state */
  isLoading?: boolean;
  /** Show transactions section */
  showTransactions?: boolean;
  /** Show tokens section */
  showTokens?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * UnifiedAccountView Component
 * 
 * Comprehensive account view showing both Substrate and EVM data:
 * - Unified addresses (SS58 and 0x)
 * - Balance on both VMs
 * - Token holdings
 * - Transaction history
 * - Identity information
 */
export function UnifiedAccountView({
  address,
  accountData,
  isLoading = false,
  showTransactions = true,
  showTokens = true,
  compact = false,
  className,
}: UnifiedAccountViewProps) {
  const { savedAddresses, addSavedAddress, removeSavedAddress } = usePreferences();
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "tokens" | "internal">("overview");
  const [unifiedAddress, setUnifiedAddress] = useState<UnifiedAddress | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  const addressType = detectAddressType(address) as VMType;
  const isSaved = savedAddresses.some(a => a.address === address);
  
  // Resolve unified address on mount
  useEffect(() => {
    const resolve = async () => {
      const resolved = await resolveAddress(address);
      setUnifiedAddress(resolved);
    };
    resolve();
  }, [address]);
  
  // Copy address handler
  const handleCopy = async (addr: string, label: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(label);
    toast.success(`${label} address copied!`);
    setTimeout(() => setCopied(null), 2000);
  };
  
  // Toggle save address
  const handleToggleSave = () => {
    if (isSaved) {
      removeSavedAddress(address);
      toast.success("Address removed from saved");
    } else {
      addSavedAddress({
        address,
        label: accountData?.identity?.display || `Account ${address.slice(0, 8)}...`,
        type: addressType,
        savedAt: Date.now(),
      });
      toast.success("Address saved!");
    }
  };
  
  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Wallet },
    { id: "transactions" as const, label: "Transactions", icon: History },
    { id: "tokens" as const, label: "Tokens", icon: Coins },
    ...(accountData?.isContract ? [{ id: "internal" as const, label: "Internal Txns", icon: FileCode }] : []),
  ];
  
  if (compact) {
    return (
      <UnifiedAccountViewCompact
        address={address}
        accountData={accountData}
        isLoading={isLoading}
        className={className}
      />
    );
  }
  
  return (
    <div className={clsx("space-y-6", className)}>
      {/* Header */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Account info */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-selendra-400 to-selendra-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {accountData?.identity?.display?.[0]?.toUpperCase() || address[0]?.toUpperCase()}
            </div>
            
            <div className="min-w-0">
              {/* Identity/Name */}
              {accountData?.identity?.display && (
                <h1 className="text-xl font-bold text-foreground mb-1">
                  {accountData.identity.display}
                </h1>
              )}
              
              {/* Contract badge */}
              {accountData?.isContract && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium mb-2">
                  <FileCode className="h-3 w-3" />
                  {accountData.contractType === "ink" ? "ink! Contract" : "EVM Contract"}
                </div>
              )}
              
              {/* Unified addresses */}
              <div className="space-y-2">
                {unifiedAddress ? (
                  <DualAddressDisplay
                    substrateAddress={unifiedAddress.substrate}
                    evmAddress={unifiedAddress.evm}
                    size="md"
                  />
                ) : (
                  <AddressDisplay
                    address={address}
                    size="md"
                    showCopy
                    showToggle
                    showVMBadge
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleSave}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                isSaved 
                  ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                  : "bg-background-secondary text-foreground-secondary hover:text-foreground"
              )}
              title={isSaved ? "Remove from saved" : "Save address"}
            >
              {isSaved ? <Star className="h-5 w-5 fill-current" /> : <StarOff className="h-5 w-5" />}
            </button>
            <button
              className="p-2 rounded-lg bg-background-secondary text-foreground-secondary hover:text-foreground transition-colors"
              title="Show QR Code"
            >
              <QrCode className="h-5 w-5" />
            </button>
            <a
              href={`/accounts/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-background-secondary text-foreground-secondary hover:text-foreground transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        {/* Balance cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Substrate balance */}
          <div className="p-4 bg-background-secondary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <VMBadge vm="substrate" size="sm" showLabel />
              <span className="text-sm text-foreground-secondary">Balance</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <div className="h-8 w-32 bg-background-hover rounded animate-pulse" />
              ) : (
                accountData?.substrateBalance?.formatted || "0 SEL"
              )}
            </div>
            {accountData?.substrateBalance?.usdValue && (
              <div className="text-sm text-foreground-secondary mt-1">
                ≈ ${accountData.substrateBalance.usdValue}
              </div>
            )}
          </div>
          
          {/* EVM balance */}
          <div className="p-4 bg-background-secondary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <VMBadge vm="evm" size="sm" showLabel />
              <span className="text-sm text-foreground-secondary">Balance</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <div className="h-8 w-32 bg-background-hover rounded animate-pulse" />
              ) : (
                accountData?.evmBalance?.formatted || "0 SEL"
              )}
            </div>
            {accountData?.evmBalance?.usdValue && (
              <div className="text-sm text-foreground-secondary mt-1">
                ≈ ${accountData.evmBalance.usdValue}
              </div>
            )}
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
          <div>
            <div className="text-sm text-foreground-secondary">Transactions</div>
            <div className="text-lg font-semibold text-foreground">
              {accountData?.transactionCount?.toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-foreground-secondary">Tokens</div>
            <div className="text-lg font-semibold text-foreground">
              {accountData?.tokens?.length || 0}
            </div>
          </div>
          {accountData?.createdAtBlock && (
            <div>
              <div className="text-sm text-foreground-secondary">Created At</div>
              <div className="text-lg font-semibold text-foreground">
                Block #{accountData.createdAtBlock.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "text-selendra-400 border-selendra-400"
                    : "text-foreground-secondary border-transparent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tab content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick stats */}
            {accountData?.identity && Object.keys(accountData.identity).length > 0 && (
              <div className="bg-background-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Identity</h3>
                <div className="grid grid-cols-2 gap-4">
                  {accountData.identity.legal && (
                    <div>
                      <div className="text-sm text-foreground-secondary">Legal Name</div>
                      <div className="text-foreground">{accountData.identity.legal}</div>
                    </div>
                  )}
                  {accountData.identity.email && (
                    <div>
                      <div className="text-sm text-foreground-secondary">Email</div>
                      <div className="text-foreground">{accountData.identity.email}</div>
                    </div>
                  )}
                  {accountData.identity.web && (
                    <div>
                      <div className="text-sm text-foreground-secondary">Website</div>
                      <a href={accountData.identity.web} target="_blank" rel="noopener noreferrer" className="text-selendra-400 hover:underline">
                        {accountData.identity.web}
                      </a>
                    </div>
                  )}
                  {accountData.identity.twitter && (
                    <div>
                      <div className="text-sm text-foreground-secondary">Twitter</div>
                      <a href={`https://twitter.com/${accountData.identity.twitter}`} target="_blank" rel="noopener noreferrer" className="text-selendra-400 hover:underline">
                        @{accountData.identity.twitter}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Recent transactions preview */}
            {showTransactions && accountData?.transactions && (
              <div className="bg-background-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-sm text-selendra-400 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <UnifiedTransactionList
                  transactions={accountData.transactions.slice(0, 5)}
                  currentAddress={address}
                  enableFilter={false}
                />
              </div>
            )}
          </div>
        )}
        
        {activeTab === "transactions" && showTransactions && (
          <UnifiedTransactionList
            transactions={accountData?.transactions || []}
            currentAddress={address}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === "tokens" && showTokens && (
          <TokenHoldingsList
            tokens={accountData?.tokens || []}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Compact account view for widgets and sidebars
 */
function UnifiedAccountViewCompact({
  address,
  accountData,
  isLoading,
  className,
}: {
  address: string;
  accountData?: UnifiedAccountData;
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("bg-background-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-selendra-400 to-selendra-600 flex items-center justify-center text-white font-bold">
          {address[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <AddressDisplay
            address={address}
            size="sm"
            showCopy
            showToggle
          />
          <div className="text-lg font-bold text-foreground mt-1">
            {isLoading ? (
              <div className="h-6 w-24 bg-background-hover rounded animate-pulse" />
            ) : (
              accountData?.substrateBalance?.formatted || "0 SEL"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Token holdings list component
 */
function TokenHoldingsList({
  tokens,
  isLoading,
}: {
  tokens: TokenHolding[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-background-card border border-border rounded-xl p-8 text-center text-foreground-secondary">
        <div className="animate-spin h-8 w-8 border-2 border-selendra-400 border-t-transparent rounded-full mx-auto mb-3" />
        Loading tokens...
      </div>
    );
  }
  
  if (tokens.length === 0) {
    return (
      <div className="bg-background-card border border-border rounded-xl p-8 text-center text-foreground-secondary">
        <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
        No token holdings found
      </div>
    );
  }
  
  return (
    <div className="bg-background-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 bg-background-secondary border-b border-border text-sm font-medium text-foreground-secondary">
        <div>Token</div>
        <div className="text-right">Balance</div>
        <div className="text-right">Value</div>
      </div>
      
      {tokens.map((token) => (
        <div
          key={token.address}
          className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-background-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            {token.logoUrl ? (
              <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-sm font-bold text-foreground-secondary">
                {token.symbol[0]}
              </div>
            )}
            <div>
              <div className="font-medium text-foreground">{token.symbol}</div>
              <div className="text-xs text-foreground-secondary">{token.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-foreground">{token.formatted}</div>
          </div>
          <div className="text-right text-foreground-secondary">
            {token.usdValue ? `$${token.usdValue}` : "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
