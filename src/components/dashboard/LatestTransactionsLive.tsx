"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
    FileText,
    ArrowRight,
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
} from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import {
    useTransactionSubscription,
    RealtimeTransaction,
} from "@/lib/hooks/useTransactionSubscription";
import { useBlockscoutTransactions, TransformedTransaction } from "@/lib/hooks/useBlockscoutTransactions";
import { LiveIndicator, NewItemPulse } from "@/components/common/LiveIndicator";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";

const MAX_DISPLAY_TXS = 10;

export function LatestTransactions() {
    const { isConnected } = useBlockchain();
    const [newTxIds, setNewTxIds] = useState<Set<string>>(new Set());

    // Subscribe to real-time transactions (for new ones)
    const {
        transactions: realtimeTxs,
        isSubscribed,
        error: wsError,
    } = useTransactionSubscription({
        maxTransactions: MAX_DISPLAY_TXS * 2,
        filterType: "all",
        onTransaction: useCallback((tx: RealtimeTransaction) => {
            setNewTxIds((prev) => new Set([...prev, tx.hash]));
            setTimeout(() => {
                setNewTxIds((prev) => {
                    const next = new Set(prev);
                    next.delete(tx.hash);
                    return next;
                });
            }, 3000);
        }, []),
    });

    // Fetch from Blockscout API as primary historical data source
    const {
        transactions: blockscoutTxs,
        isLoading: blockscoutLoading,
        error: blockscoutError
    } = useBlockscoutTransactions({
        limit: MAX_DISPLAY_TXS * 2,
        refetchInterval: 15000, // Refresh every 15 seconds
    });

    // Merge realtime and Blockscout transactions
    const displayTxs = useMemo(() => {
        const realtimeHashes = new Set(realtimeTxs.map(tx => tx.hash));

        // Convert Blockscout transactions to RealtimeTransaction format
        const blockscoutConverted: RealtimeTransaction[] = blockscoutTxs
            .filter((tx: TransformedTransaction) => !realtimeHashes.has(tx.hash))
            .map((tx: TransformedTransaction) => ({
                id: tx.hash,
                hash: tx.hash,
                type: tx.type,
                blockNumber: tx.blockNumber,
                timestamp: tx.timestamp,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                fee: tx.fee,
                status: tx.status,
                method: tx.method,
            }));

        // Combine and sort by timestamp (newest first)
        const combined = [...realtimeTxs, ...blockscoutConverted]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_DISPLAY_TXS);

        return combined;
    }, [realtimeTxs, blockscoutTxs]);

    const isLoading = blockscoutLoading && realtimeTxs.length === 0;

    const truncateHash = (hash: string) =>
        `${hash.slice(0, 8)}...${hash.slice(-6)}`;
    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const formatValue = (value: string) => {
        try {
            const val = BigInt(value);
            const decimals = 18;
            const whole = val / BigInt(10 ** decimals);
            const fraction = val % BigInt(10 ** decimals);
            const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4);
            if (whole === BigInt(0) && fraction === BigInt(0)) return "";
            return `${whole.toLocaleString()}.${fractionStr} SEL`;
        } catch {
            return "";
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return "Just now";
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-selendra-400" />
                    <h2 className="text-lg font-semibold text-foreground">
                        Latest Transactions
                    </h2>
                    <LiveIndicator
                        isLive={isSubscribed && isConnected}
                        size="sm"
                        variant="badge"
                    />
                </div>
                <Link
                    href="/transactions"
                    className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1"
                >
                    View all <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Stats summary */}
            {displayTxs.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 mb-3 bg-background-secondary rounded-lg text-xs">
                    <span className="text-foreground-secondary">
                        Showing {displayTxs.length} recent transactions
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-purple-400">
                            {displayTxs.filter((tx) => tx.type === "substrate").length} Substrate
                        </span>
                        <span className="text-orange-400">
                            {displayTxs.filter((tx) => tx.type === "evm").length} EVM
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-background-hover">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="rectangular" className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                    ))
                ) : displayTxs.length > 0 ? (
                    displayTxs.map((tx) => {
                        const isNew = newTxIds.has(tx.hash);
                        const isSuccess = tx.status === "success";
                        const value = formatValue(tx.value);

                        return (
                            <Link
                                key={tx.hash}
                                href={`/tx/${tx.hash}`}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg transition-all duration-300 group",
                                    isNew
                                        ? "bg-selendra-500/10 border border-selendra-500/30"
                                        : "hover:bg-background-hover"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                            isNew
                                                ? "bg-selendra-500/20"
                                                : isSuccess
                                                    ? "bg-accent-green/10"
                                                    : "bg-accent-red/10"
                                        )}
                                    >
                                        {isNew ? (
                                            <Zap className="h-5 w-5 text-selendra-400" />
                                        ) : isSuccess ? (
                                            <ArrowUpRight className="h-5 w-5 text-accent-green" />
                                        ) : (
                                            <ArrowDownLeft className="h-5 w-5 text-accent-red" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-foreground">
                                                {truncateHash(tx.hash)}
                                            </span>
                                            <span
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded",
                                                    tx.type === "substrate"
                                                        ? "bg-purple-500/10 text-purple-400"
                                                        : "bg-orange-500/10 text-orange-400"
                                                )}
                                            >
                                                {tx.type === "substrate" ? "Substrate" : "EVM"}
                                            </span>
                                            {isNew && <NewItemPulse />}
                                        </div>
                                        <div className="text-xs text-foreground-secondary mt-0.5 flex items-center gap-1">
                                            <span className="font-mono">
                                                {truncateAddress(tx.from)}
                                            </span>
                                            {tx.to && (
                                                <>
                                                    <ArrowRight className="h-3 w-3" />
                                                    <span className="font-mono">
                                                        {truncateAddress(tx.to)}
                                                    </span>
                                                </>
                                            )}
                                            {tx.method && (
                                                <>
                                                    <span className="mx-1">•</span>
                                                    <span className="text-foreground-secondary truncate max-w-[120px]">
                                                        {tx.method}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={cn(
                                            "text-xs px-2 py-0.5 rounded-full",
                                            isSuccess
                                                ? "bg-accent-green/10 text-accent-green"
                                                : tx.status === "pending"
                                                    ? "bg-yellow-500/10 text-yellow-400"
                                                    : "bg-accent-red/10 text-accent-red"
                                        )}
                                    >
                                        {tx.status === "pending"
                                            ? "Pending"
                                            : isSuccess
                                                ? "Success"
                                                : "Failed"}
                                    </span>
                                    {value && (
                                        <span className="text-xs text-foreground-secondary font-mono">
                                            {value}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-foreground-secondary">
                                        {formatTimestamp(tx.timestamp)}
                                    </span>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-foreground-secondary">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No transactions yet</p>
                        <p className="text-xs mt-1">Waiting for network activity...</p>
                        {wsError && <p className="text-xs text-yellow-400 mt-2">WS: {wsError}</p>}
                        {blockscoutError && <p className="text-xs text-yellow-400 mt-2">API: {blockscoutError}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
