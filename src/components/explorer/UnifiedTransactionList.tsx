"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileCode, 
  Coins,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock
} from "lucide-react";

import { AddressDisplay } from "@/components/common/AddressDisplay";
import { VMBadge, VMDot, type VMType } from "@/components/common/VMBadge";
import { StatusBadge, type Status } from "@/components/common/StatusBadge";
import { formatAddress } from "@/lib/address";

/**
 * Unified transaction type combining both Substrate and EVM transactions
 */
export interface UnifiedTransaction {
  /** Transaction hash */
  hash: string;
  /** VM type (substrate or evm) */
  vm: VMType;
  /** Block number */
  blockNumber: number;
  /** Timestamp */
  timestamp: number;
  /** From address */
  from: string;
  /** To address (null for contract creation) */
  to: string | null;
  /** Transaction value in native token (SEL) */
  value: string;
  /** Transaction fee */
  fee: string;
  /** Transaction status */
  status: Status;
  /** Transaction type/method */
  method: string;
  /** Module/section for Substrate or contract name for EVM */
  module?: string;
  /** Is this a contract interaction */
  isContractCall: boolean;
  /** Is this a contract creation */
  isContractCreation: boolean;
  /** Number of events/logs */
  eventsCount: number;
}

/**
 * Filter options for transaction list
 */
export type TransactionFilter = "all" | "substrate" | "evm" | "transfers" | "contracts";

interface UnifiedTransactionListProps {
  /** List of transactions to display */
  transactions: UnifiedTransaction[];
  /** Loading state */
  isLoading?: boolean;
  /** Current account address (to determine direction) */
  currentAddress?: string;
  /** Show VM column */
  showVMColumn?: boolean;
  /** Enable filtering */
  enableFilter?: boolean;
  /** Default filter */
  defaultFilter?: TransactionFilter;
  /** Compact mode */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** On transaction click handler */
  onTransactionClick?: (tx: UnifiedTransaction) => void;
}

/**
 * UnifiedTransactionList Component
 * 
 * Displays a merged list of Substrate extrinsics and EVM transactions
 * with filtering, sorting, and unified styling.
 */
export function UnifiedTransactionList({
  transactions,
  isLoading = false,
  currentAddress,
  showVMColumn = true,
  enableFilter = true,
  defaultFilter = "all",
  compact = false,
  className,
  onTransactionClick,
}: UnifiedTransactionListProps) {
  const [filter, setFilter] = useState<TransactionFilter>(defaultFilter);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Filter transactions based on selected filter
  const filteredTransactions = useMemo(() => {
    switch (filter) {
      case "substrate":
        return transactions.filter(tx => tx.vm === "substrate");
      case "evm":
        return transactions.filter(tx => tx.vm === "evm");
      case "transfers":
        return transactions.filter(tx => 
          tx.method.toLowerCase().includes("transfer") || 
          (!tx.isContractCall && !tx.isContractCreation && tx.value !== "0")
        );
      case "contracts":
        return transactions.filter(tx => tx.isContractCall || tx.isContractCreation);
      default:
        return transactions;
    }
  }, [transactions, filter]);
  
  // Determine transaction direction relative to current address
  const getDirection = (tx: UnifiedTransaction): "in" | "out" | "self" | null => {
    if (!currentAddress) return null;
    const currentLower = currentAddress.toLowerCase();
    const fromMatch = tx.from.toLowerCase() === currentLower;
    const toMatch = tx.to?.toLowerCase() === currentLower;
    
    if (fromMatch && toMatch) return "self";
    if (fromMatch) return "out";
    if (toMatch) return "in";
    return null;
  };
  
  // Get icon for transaction type
  const getTransactionIcon = (tx: UnifiedTransaction, direction: "in" | "out" | "self" | null) => {
    if (tx.isContractCreation) {
      return <FileCode className="h-4 w-4" />;
    }
    if (tx.isContractCall) {
      return <Coins className="h-4 w-4" />;
    }
    if (direction === "in") {
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    }
    if (direction === "out") {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    }
    return <ArrowUpRight className="h-4 w-4" />;
  };
  
  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };
  
  const filterOptions: { value: TransactionFilter; label: string }[] = [
    { value: "all", label: "All Transactions" },
    { value: "substrate", label: "Substrate Only" },
    { value: "evm", label: "EVM Only" },
    { value: "transfers", label: "Transfers" },
    { value: "contracts", label: "Contract Calls" },
  ];
  
  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header with filter */}
      {enableFilter && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Transactions</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-background-secondary border border-border rounded-lg text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>{filterOptions.find(o => o.value === filter)?.label}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-background-card border border-border rounded-lg shadow-lg z-50">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg",
                      filter === option.value
                        ? "text-selendra-400 bg-selendra-500/10"
                        : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Transaction list */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className={clsx(
          "grid gap-4 px-4 py-3 bg-background-secondary border-b border-border text-sm font-medium text-foreground-secondary",
          showVMColumn 
            ? "grid-cols-[auto_1fr_1fr_auto_auto_auto]" 
            : "grid-cols-[1fr_1fr_auto_auto_auto]"
        )}>
          {showVMColumn && <div>VM</div>}
          <div>Transaction</div>
          <div>From / To</div>
          <div className="text-right">Value</div>
          <div className="text-right">Status</div>
          <div className="text-right">Time</div>
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="p-8 text-center text-foreground-secondary">
            <div className="animate-spin h-8 w-8 border-2 border-selendra-400 border-t-transparent rounded-full mx-auto mb-3" />
            Loading transactions...
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && filteredTransactions.length === 0 && (
          <div className="p-8 text-center text-foreground-secondary">
            <div className="text-4xl mb-3">📭</div>
            No transactions found
          </div>
        )}
        
        {/* Transaction rows */}
        {!isLoading && filteredTransactions.map((tx) => {
          const direction = getDirection(tx);
          
          return (
            <div
              key={`${tx.vm}-${tx.hash}`}
              onClick={() => onTransactionClick?.(tx)}
              className={clsx(
                "grid gap-4 px-4 py-3 border-b border-border last:border-0 transition-colors",
                "hover:bg-background-hover cursor-pointer",
                showVMColumn 
                  ? "grid-cols-[auto_1fr_1fr_auto_auto_auto]" 
                  : "grid-cols-[1fr_1fr_auto_auto_auto]"
              )}
            >
              {/* VM indicator */}
              {showVMColumn && (
                <div className="flex items-center">
                  <VMBadge vm={tx.vm} size="sm" />
                </div>
              )}
              
              {/* Transaction hash and method */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={clsx(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                  tx.isContractCreation ? "bg-purple-500/20 text-purple-400" :
                  tx.isContractCall ? "bg-blue-500/20 text-blue-400" :
                  direction === "in" ? "bg-green-500/20" :
                  "bg-gray-500/20 text-foreground-secondary"
                )}>
                  {getTransactionIcon(tx, direction)}
                </div>
                <div className="min-w-0">
                  <a 
                    href={`/tx/${tx.hash}`}
                    className="font-mono text-sm text-foreground hover:text-selendra-400 truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatAddress(tx.hash, 8, 6)}
                  </a>
                  <div className="text-xs text-foreground-secondary truncate">
                    {tx.module && <span>{tx.module}.</span>}
                    {tx.method}
                  </div>
                </div>
              </div>
              
              {/* From / To addresses */}
              <div className="flex flex-col justify-center gap-0.5 min-w-0">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-foreground-muted">From:</span>
                  <AddressDisplay 
                    address={tx.from} 
                    size="sm" 
                    showCopy={false}
                    showToggle={false}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-foreground-muted">To:</span>
                  {tx.to ? (
                    <AddressDisplay 
                      address={tx.to} 
                      size="sm" 
                      showCopy={false}
                      showToggle={false}
                    />
                  ) : (
                    <span className="text-purple-400">Contract Creation</span>
                  )}
                </div>
              </div>
              
              {/* Value */}
              <div className="flex items-center justify-end">
                <span className={clsx(
                  "font-medium text-sm",
                  direction === "in" && "text-green-500",
                  direction === "out" && "text-red-500"
                )}>
                  {direction === "in" && "+"}
                  {direction === "out" && "-"}
                  {tx.value} SEL
                </span>
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-end">
                <StatusBadge status={tx.status} size="sm" showLabel={false} />
              </div>
              
              {/* Time */}
              <div className="flex items-center justify-end text-sm text-foreground-secondary">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(tx.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * UnifiedTransactionListCompact
 * 
 * Compact version for sidebars and widgets
 */
interface UnifiedTransactionListCompactProps {
  transactions: UnifiedTransaction[];
  maxItems?: number;
  className?: string;
}

export function UnifiedTransactionListCompact({
  transactions,
  maxItems = 5,
  className,
}: UnifiedTransactionListCompactProps) {
  const displayedTx = transactions.slice(0, maxItems);
  
  return (
    <div className={clsx("space-y-2", className)}>
      {displayedTx.map((tx) => (
        <a
          key={`${tx.vm}-${tx.hash}`}
          href={`/tx/${tx.hash}`}
          className="flex items-center justify-between p-3 bg-background-secondary rounded-lg hover:bg-background-hover transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <VMDot vm={tx.vm} size="sm" />
            <span className="font-mono text-sm text-foreground truncate">
              {formatAddress(tx.hash, 6, 4)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">
              {tx.value} SEL
            </span>
            <StatusBadge status={tx.status} size="sm" showLabel={false} />
          </div>
        </a>
      ))}
    </div>
  );
}
