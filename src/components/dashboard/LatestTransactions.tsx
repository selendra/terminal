"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FileText, ArrowRight, ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { clsx } from "clsx";

interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value?: string;
  method?: string;
  success: boolean;
  type: "substrate" | "evm";
  timestamp?: number;
}

export function LatestTransactions() {
  const { substrateSDK, isConnected, latestSubstrateBlock } = useBlockchain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = React.useRef(false);

  const lastProcessedBlockRef = useRef<number>(0);

  useEffect(() => {
    console.log("LatestTransactions useEffect triggered", { isConnected, latestBlock: latestSubstrateBlock?.number });

    if (!isConnected) {
      console.log("Not connected, returning");
      return;
    }

    if (!substrateSDK || !latestSubstrateBlock) {
      console.log("Missing SDK or latest block", { hasSDK: !!substrateSDK, hasBlock: !!latestSubstrateBlock });
      return;
    }

    if (fetchingRef.current) {
      console.log("Already fetching, skipping");
      return;
    }

    const fetchTransactions = async () => {
      console.log("Starting fetchTransactions");
      fetchingRef.current = true;
      const currentBlockNum = latestSubstrateBlock.number;

      // Skip if we already processed this block
      if (lastProcessedBlockRef.current === currentBlockNum) {
        console.log("Block already processed", currentBlockNum);
        fetchingRef.current = false;
        return;
      }

      // Only show loading state on initial load
      if (transactions.length === 0) {
        setIsLoading(true);
      }

      try {
        const api = substrateSDK.getApi();
        if (!api) return;

        const newTxs: Transaction[] = [];

        // Determine range to fetch
        let startBlock: number;
        let endBlock = currentBlockNum;

        if (transactions.length === 0) {
          // Initial load: fetch last 10 blocks
          startBlock = Math.max(0, currentBlockNum - 9);
        } else {
          // Update: fetch from last processed + 1
          startBlock = lastProcessedBlockRef.current + 1;
        }

        // Fetch blocks in range (reverse order to get newest first)
        for (let i = endBlock; i >= startBlock; i--) {
          try {
            const hash = await api.rpc.chain.getBlockHash(i);
            const block = await api.rpc.chain.getBlock(hash);
            const events = await api.query.system.events.at(hash);

            // Process extrinsics in reverse order (newest first)
            for (let j = block.block.extrinsics.length - 1; j >= 0; j--) {
              const ext = block.block.extrinsics[j];

              // Find the success/failure event for this extrinsic
              const extEvents = (events as any[]).filter(
                ({ phase }) =>
                  phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(j)
              );

              const success = extEvents.some(
                ({ event }) =>
                  api.events.system.ExtrinsicSuccess.is(event)
              );

              const extrinsicHash = ext.hash.toString();
              const method = `${ext.method.section}.${ext.method.method}`;

              // Skip timestamp.set and other system calls
              if (ext.method.section === "timestamp") continue;

              newTxs.push({
                hash: extrinsicHash,
                blockNumber: i,
                from: ext.signer?.toString() || "System",
                to: "",
                method,
                success,
                type: "substrate",
              });
            }
          } catch (err) {
            console.error(`Error fetching block ${i}:`, err);
          }
        }

        if (newTxs.length > 0) {
          setTransactions(prev => {
            // Prepend new transactions and limit to 20
            const updated = [...newTxs, ...prev];
            // Remove duplicates just in case
            const unique = updated.filter((tx, index, self) =>
              index === self.findIndex((t) => t.hash === tx.hash)
            );
            return unique.slice(0, 20);
          });
        }

        lastProcessedBlockRef.current = currentBlockNum;
      } catch (err) {
        console.error("Transaction fetch failed:", err);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchTransactions();
  }, [isConnected, substrateSDK, latestSubstrateBlock?.number]);

  const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-selendra-400" />
          <h2 className="text-lg font-semibold text-foreground">Latest Transactions</h2>
        </div>
        <Link
          href="/transactions"
          className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background-hover">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-background-tertiary rounded-lg" />
                  <div>
                    <div className="h-4 w-24 bg-background-tertiary rounded mb-2" />
                    <div className="h-3 w-40 bg-background-tertiary rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-background-tertiary rounded" />
              </div>
            </div>
          ))
        ) : transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <Link
              key={`tx-${tx.hash}-${tx.blockNumber}-${index}`}
              href={`/tx/${tx.hash}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-background-hover transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    "h-10 w-10 rounded-lg flex items-center justify-center",
                    tx.success
                      ? "bg-accent-green/10"
                      : "bg-accent-red/10"
                  )}
                >
                  {tx.success ? (
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
                      className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        tx.type === "substrate"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-orange-500/10 text-orange-400"
                      )}
                    >
                      {tx.type === "substrate" ? "Substrate" : "EVM"}
                    </span>
                  </div>
                  <div className="text-xs text-foreground-secondary mt-0.5">
                    <span className="font-mono">{truncateAddress(tx.from)}</span>
                    <span className="mx-1">•</span>
                    <span className="text-foreground-secondary">{tx.method}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded-full",
                    tx.success
                      ? "bg-accent-green/10 text-accent-green"
                      : "bg-accent-red/10 text-accent-red"
                  )}
                >
                  {tx.success ? "Success" : "Failed"}
                </span>
                <ExternalLink className="h-3 w-3 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-foreground-secondary">
            No transactions available
          </div>
        )}
      </div>
    </div>
  );
}
