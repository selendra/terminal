"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isConnected || !substrateSDK || !latestSubstrateBlock) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const api = substrateSDK.getApi();
        if (!api) return;

        const txs: Transaction[] = [];
        const latestNumber = latestSubstrateBlock.number;

        // Fetch extrinsics from last 5 blocks
        for (let i = 0; i < 5 && txs.length < 10; i++) {
          const blockNumber = latestNumber - i;
          if (blockNumber < 0) break;

          const hash = await api.rpc.chain.getBlockHash(blockNumber);
          const block = await api.rpc.chain.getBlock(hash);
          const events = await api.query.system.events.at(hash);

          for (const [index, ext] of block.block.extrinsics.entries()) {
            if (txs.length >= 10) break;

            // Find the success/failure event for this extrinsic
            const extEvents = (events as any[]).filter(
              ({ phase }) =>
                phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
            );

            const success = extEvents.some(
              ({ event }) =>
                api.events.system.ExtrinsicSuccess.is(event)
            );

            const extrinsicHash = ext.hash.toString();
            const method = `${ext.method.section}.${ext.method.method}`;
            
            // Skip timestamp.set and other system calls
            if (ext.method.section === "timestamp") continue;

            txs.push({
              hash: extrinsicHash,
              blockNumber,
              from: ext.signer?.toString() || "System",
              to: "",
              method,
              success,
              type: "substrate",
            });
          }
        }

        setTransactions(txs);
      } catch {
        // Fetch failed, will retry
      } finally {
        setIsLoading(false);
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
          <h2 className="text-lg font-semibold text-white">Latest Transactions</h2>
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
                  <div className="h-10 w-10 bg-gray-700 rounded-lg" />
                  <div>
                    <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-40 bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-gray-700 rounded" />
              </div>
            </div>
          ))
        ) : transactions.length > 0 ? (
          transactions.map((tx) => (
            <Link
              key={tx.hash}
              href={`/transactions/${tx.hash}`}
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
                    <span className="font-mono text-sm text-white">
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
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{truncateAddress(tx.from)}</span>
                    <span className="mx-1">•</span>
                    <span className="text-gray-400">{tx.method}</span>
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
                <ExternalLink className="h-3 w-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No transactions available
          </div>
        )}
      </div>
    </div>
  );
}
