"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Blocks, ArrowRight, ExternalLink, Zap } from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useBlockSubscription, RealtimeBlock } from "@/lib/hooks/useBlockSubscription";
import { LiveIndicator, NewItemPulse } from "@/components/common/LiveIndicator";
import { Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";

const MAX_DISPLAY_BLOCKS = 10;

export function LatestBlocks() {
    const { isConnected, latestSubstrateBlock } = useBlockchain();
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [newBlockIds, setNewBlockIds] = useState<Set<string>>(new Set());

    // Subscribe to real-time blocks
    const {
        blocks: realtimeBlocks,
        latestBlock,
        isSubscribed,
        error,
    } = useBlockSubscription({
        maxBlocks: MAX_DISPLAY_BLOCKS,
        filterType: "substrate",
        onBlock: useCallback((block: RealtimeBlock) => {
            // Mark new blocks for animation
            setNewBlockIds((prev) => new Set([...prev, block.hash]));

            // Remove animation after 2 seconds
            setTimeout(() => {
                setNewBlockIds((prev) => {
                    const next = new Set(prev);
                    next.delete(block.hash);
                    return next;
                });
            }, 2000);
        }, []),
    });

    // Combine realtime blocks with initial load
    const displayBlocks = realtimeBlocks.slice(0, MAX_DISPLAY_BLOCKS);

    useEffect(() => {
        if (displayBlocks.length > 0) {
            setIsInitialLoad(false);
        }
    }, [displayBlocks.length]);

    const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;

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
                    <Blocks className="h-5 w-5 text-selendra-400" />
                    <h2 className="text-lg font-semibold text-foreground">Latest Blocks</h2>
                    <LiveIndicator isLive={isSubscribed && isConnected} size="sm" variant="badge" />
                </div>
                <Link
                    href="/blocks"
                    className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1"
                >
                    View all <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Current block height */}
            {latestBlock && (
                <div className="flex items-center justify-between px-3 py-2 mb-3 bg-background-secondary rounded-lg">
                    <span className="text-xs text-foreground-secondary">Current Height</span>
                    <span className="font-mono text-sm text-foreground font-medium">
                        #{latestBlock.number.toLocaleString()}
                    </span>
                </div>
            )}

            <div className="space-y-2">
                {isInitialLoad && displayBlocks.length === 0 ? (
                    // Loading skeleton
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-background-hover">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="rectangular" className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    ))
                ) : displayBlocks.length > 0 ? (
                    displayBlocks.map((block) => {
                        const isNew = newBlockIds.has(block.hash);
                        return (
                            <Link
                                key={block.hash}
                                href={`/blocks/${block.number}`}
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
                                            isNew ? "bg-selendra-500/20" : "bg-selendra-500/10"
                                        )}
                                    >
                                        {isNew ? (
                                            <Zap className="h-5 w-5 text-selendra-400" />
                                        ) : (
                                            <Blocks className="h-5 w-5 text-selendra-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">
                                                #{block.number.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-foreground-secondary font-mono">
                                                {truncateHash(block.hash)}
                                            </span>
                                            {isNew && <NewItemPulse />}
                                        </div>
                                        <div className="text-xs text-foreground-secondary mt-0.5 flex items-center gap-2">
                                            <span>{block.extrinsicCount || 0} extrinsics</span>
                                            {block.validator && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-purple-400">{block.validator}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground-secondary">
                                        {formatTimestamp(block.timestamp)}
                                    </span>
                                    <ExternalLink className="h-3 w-3 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-foreground-secondary">
                        <Blocks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Waiting for blocks...</p>
                        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
