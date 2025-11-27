"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { truncateHash, formatDistanceToNow } from "@/lib/utils";
import { clsx } from "clsx";

interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  extrinsicsCount: number;
  timestamp?: number;
  validator?: string;
}

export function BlocksExplorer() {
  const { substrateSDK, isConnected, latestSubstrateBlock } = useBlockchain();
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [vmFilter, setVmFilter] = useState<"all" | "substrate" | "evm">("all");

  const blocksPerPage = 25;

  const fetchBlocks = useCallback(async () => {
    if (!isConnected || !substrateSDK || !latestSubstrateBlock) return;

    setIsLoading(true);
    try {
      const api = substrateSDK.getApi();
      if (!api) return;

      const latestNumber = latestSubstrateBlock.number;
      setTotalBlocks(latestNumber);

      const startBlock = latestNumber - (currentPage - 1) * blocksPerPage;
      const blocksData: BlockData[] = [];

      for (let i = 0; i < blocksPerPage; i++) {
        const blockNumber = startBlock - i;
        if (blockNumber < 0) break;

        const hash = await api.rpc.chain.getBlockHash(blockNumber);
        const block = await api.rpc.chain.getBlock(hash);

        blocksData.push({
          number: blockNumber,
          hash: hash.toString(),
          parentHash: block.block.header.parentHash.toString(),
          extrinsicsCount: block.block.extrinsics.length,
        });
      }

      setBlocks(blocksData);
    } catch {
      // Fetch failed, will retry
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, substrateSDK, latestSubstrateBlock, currentPage]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const totalPages = Math.ceil(totalBlocks / blocksPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Blocks className="h-6 w-6 text-selendra-400" />
            Blocks
          </h1>
          <p className="text-gray-500 mt-1">
            Latest blocks on Selendra network
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background-card border border-border rounded-lg p-1">
            {(["all", "substrate", "evm"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setVmFilter(filter)}
                className={clsx(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                  vmFilter === filter
                    ? "bg-selendra-500/20 text-selendra-400"
                    : "text-gray-500 hover:text-white"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Blocks</p>
          <p className="text-xl font-bold text-white">
            {totalBlocks.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Latest Block</p>
          <p className="text-xl font-bold text-white">
            #{latestSubstrateBlock?.number?.toLocaleString() || "---"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Avg Block Time</p>
          <p className="text-xl font-bold text-white">1 second</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Network</p>
          <p className="text-xl font-bold text-white">Selendra</p>
        </div>
      </div>

      {/* Blocks Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Block
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Hash
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Extrinsics
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Time
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-selendra-500 mx-auto mb-2" />
                    <p className="text-gray-500">Loading blocks...</p>
                  </td>
                </tr>
              ) : blocks.length > 0 ? (
                blocks.map((block) => (
                  <tr
                    key={block.number}
                    className="border-b border-border last:border-b-0 hover:bg-background-hover transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/blocks/${block.number}`}
                        className="font-medium text-selendra-400 hover:text-selendra-300"
                      >
                        #{block.number.toLocaleString()}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-400">
                        {truncateHash(block.hash, 10, 8)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white">{block.extrinsicsCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-500 text-sm">Just now</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/blocks/${block.number}`}
                        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    No blocks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm text-gray-500">
            Showing {blocks.length} of {totalBlocks.toLocaleString()} blocks
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-white px-3">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
