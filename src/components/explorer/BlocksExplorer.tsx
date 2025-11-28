"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
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
  type: "substrate" | "evm";
}

// Mock block data generator for demo mode
function generateMockBlocks(
  startBlock: number,
  count: number,
  type: "substrate" | "evm" | "all"
): BlockData[] {
  const blocks: BlockData[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const blockNumber = startBlock - i;
    if (blockNumber < 0) break;

    // Generate blocks based on filter
    const blockType: "substrate" | "evm" =
      type === "all"
        ? Math.random() > 0.3
          ? "substrate"
          : "evm"
        : type === "evm"
        ? "evm"
        : "substrate";

    blocks.push({
      number: blockNumber,
      hash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`,
      parentHash: `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`,
      extrinsicsCount: Math.floor(Math.random() * 20) + 1,
      timestamp: now - i * 1000, // 1 second per block
      type: blockType,
    });
  }

  return blocks;
}

export function BlocksExplorer() {
  const { substrateSDK, evmSDK, isConnected, useMockData, latestSubstrateBlock, latestEvmBlock } =
    useBlockchain();
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [vmFilter, setVmFilter] = useState<"all" | "substrate" | "evm">("all");

  // Track if this is the initial load
  const isInitialLoad = useRef(true);

  const blocksPerPage = 25;

  // Fetch blocks from Substrate chain
  const fetchSubstrateBlocks = useCallback(
    async (startBlock: number, count: number): Promise<BlockData[]> => {
      if (!substrateSDK) return [];

      const api = substrateSDK.getApi();
      if (!api) return [];

      const blocksData: BlockData[] = [];

      // Fetch blocks in parallel for better performance
      const blockPromises = [];
      for (let i = 0; i < count; i++) {
        const blockNumber = startBlock - i;
        if (blockNumber < 0) break;
        blockPromises.push(
          (async () => {
            try {
              const hash = await api.rpc.chain.getBlockHash(blockNumber);
              const block = await api.rpc.chain.getBlock(hash);

              // Try to extract timestamp from extrinsics
              let timestamp: number | undefined;
              for (const ext of block.block.extrinsics) {
                if (
                  ext.method.section === "timestamp" &&
                  ext.method.method === "set"
                ) {
                  timestamp = parseInt(ext.method.args[0].toString(), 10);
                  break;
                }
              }

              return {
                number: blockNumber,
                hash: hash.toString(),
                parentHash: block.block.header.parentHash.toString(),
                extrinsicsCount: block.block.extrinsics.length,
                timestamp,
                type: "substrate" as const,
              };
            } catch {
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(blockPromises);
      for (const block of results) {
        if (block) blocksData.push(block);
      }

      return blocksData;
    },
    [substrateSDK]
  );

  // Fetch blocks from EVM chain
  const fetchEvmBlocks = useCallback(
    async (startBlock: number, count: number): Promise<BlockData[]> => {
      if (!evmSDK) return [];

      const provider = evmSDK.getEvmProvider();
      if (!provider) return [];

      const blocksData: BlockData[] = [];

      // Fetch blocks in parallel
      const blockPromises = [];
      for (let i = 0; i < count; i++) {
        const blockNumber = startBlock - i;
        if (blockNumber < 0) break;
        blockPromises.push(
          (async () => {
            try {
              const block = await provider.getBlock(blockNumber);
              if (!block) return null;

              return {
                number: block.number,
                hash: block.hash || "",
                parentHash: block.parentHash,
                extrinsicsCount: block.transactions?.length || 0,
                timestamp: block.timestamp ? block.timestamp * 1000 : undefined,
                type: "evm" as const,
              };
            } catch {
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(blockPromises);
      for (const block of results) {
        if (block) blocksData.push(block);
      }

      return blocksData;
    },
    [evmSDK]
  );

  // Main fetch function
  const fetchBlocks = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      // Determine which data source to use
      if (useMockData) {
        // Use mock data
        const latestNumber = latestSubstrateBlock?.number || 1000000;
        setTotalBlocks(latestNumber);

        const startBlock = latestNumber - (currentPage - 1) * blocksPerPage;
        const mockBlocks = generateMockBlocks(startBlock, blocksPerPage, vmFilter);
        setBlocks(mockBlocks);
      } else {
        // Fetch real data based on filter
        let blocksData: BlockData[] = [];
        let total = 0;

        if (vmFilter === "substrate" || vmFilter === "all") {
          const latestNumber = latestSubstrateBlock?.number || 0;
          total = Math.max(total, latestNumber);

          if (latestNumber > 0) {
            const startBlock = latestNumber - (currentPage - 1) * blocksPerPage;
            const substrateBlocks = await fetchSubstrateBlocks(
              startBlock,
              vmFilter === "all" ? Math.ceil(blocksPerPage / 2) : blocksPerPage
            );
            blocksData = [...blocksData, ...substrateBlocks];
          }
        }

        if (vmFilter === "evm" || vmFilter === "all") {
          const latestNumber = latestEvmBlock?.number || 0;
          total = Math.max(total, latestNumber);

          if (latestNumber > 0) {
            const startBlock = latestNumber - (currentPage - 1) * blocksPerPage;
            const evmBlocks = await fetchEvmBlocks(
              startBlock,
              vmFilter === "all" ? Math.ceil(blocksPerPage / 2) : blocksPerPage
            );
            blocksData = [...blocksData, ...evmBlocks];
          }
        }

        // Sort by block number descending
        blocksData.sort((a, b) => b.number - a.number);

        // Limit to blocksPerPage
        blocksData = blocksData.slice(0, blocksPerPage);

        setTotalBlocks(total);
        setBlocks(blocksData);
      }
    } catch (err) {
      setFetchError("Failed to fetch blocks. Please try again.");
      console.error("Block fetch error:", err);
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, [
    isConnected,
    useMockData,
    latestSubstrateBlock,
    latestEvmBlock,
    currentPage,
    vmFilter,
    fetchSubstrateBlocks,
    fetchEvmBlocks,
  ]);

  // Fetch blocks when dependencies change
  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Auto-refresh blocks when new blocks arrive (but not on every render)
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (currentPage !== 1) return; // Only auto-refresh on first page

    const refreshTimeout = setTimeout(() => {
      fetchBlocks();
    }, 5000); // Refresh every 5 seconds

    return () => clearTimeout(refreshTimeout);
  }, [latestSubstrateBlock?.number, latestEvmBlock?.number, currentPage, fetchBlocks]);

  const totalPages = Math.ceil(totalBlocks / blocksPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Blocks className="h-6 w-6 text-selendra-400" />
            Blocks
          </h1>
          <p className="text-foreground-secondary mt-1">
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
                    : "text-foreground-secondary hover:text-foreground"
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
          <p className="text-sm text-foreground-secondary">Total Blocks</p>
          <p className="text-xl font-bold text-foreground">
            {totalBlocks.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-secondary">Latest Block</p>
          <p className="text-xl font-bold text-foreground">
            #{latestSubstrateBlock?.number?.toLocaleString() || "---"}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-secondary">Avg Block Time</p>
          <p className="text-xl font-bold text-foreground">1 second</p>
        </div>
        <div className="card">
          <p className="text-sm text-foreground-secondary">Network</p>
          <p className="text-xl font-bold text-foreground">Selendra</p>
        </div>
      </div>

      {/* Blocks Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                  Block
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                  Hash
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                  Extrinsics
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                  Time
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-foreground-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-selendra-500 mx-auto mb-2" />
                    <p className="text-foreground-secondary">Loading blocks...</p>
                  </td>
                </tr>
              ) : blocks.length > 0 ? (
                blocks.map((block, index) => (
                  <tr
                    key={`${block.type}-${block.number}-${index}`}
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
                      <span className="font-mono text-sm text-foreground-secondary">
                        {truncateHash(block.hash, 10, 8)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-foreground">{block.extrinsicsCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-foreground-secondary text-sm">Just now</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/blocks/${block.number}`}
                        className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-foreground-secondary">
                    No blocks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm text-foreground-secondary">
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
            <span className="text-sm text-foreground px-3">
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
