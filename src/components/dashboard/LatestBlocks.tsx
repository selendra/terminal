"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Blocks, ArrowRight, ExternalLink } from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { formatDistanceToNow } from "@/lib/utils";

interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp?: number;
  extrinsicsCount?: number;
  validator?: string;
}

export function LatestBlocks() {
  const { substrateSDK, isConnected, latestSubstrateBlock } = useBlockchain();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = React.useRef(false);

  useEffect(() => {
    if (!isConnected || !substrateSDK || !latestSubstrateBlock) return;
    if (fetchingRef.current) return; // Prevent concurrent fetches

    const fetchBlocks = async () => {
      fetchingRef.current = true;
      fetchingRef.current = true;
      // Only show loading state on initial load if we have no blocks
      if (blocks.length === 0) {
        setIsLoading(true);
      }
      try {
        const api = substrateSDK.getApi();
        if (!api) return;

        const latestNumber = latestSubstrateBlock.number;
        const blocksData: Block[] = [];

        // Fetch last 10 blocks
        for (let i = 0; i < 10; i++) {
          const blockNumber = latestNumber - i;
          if (blockNumber < 0) break;

          const hash = await api.rpc.chain.getBlockHash(blockNumber);
          const block = await api.rpc.chain.getBlock(hash);
          const header = block.block.header;

          blocksData.push({
            number: blockNumber,
            hash: hash.toString(),
            parentHash: header.parentHash.toString(),
            extrinsicsCount: block.block.extrinsics.length,
          });
        }

        setBlocks(blocksData);
      } catch {
        // Fetch failed, will retry
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchBlocks();
  }, [isConnected, substrateSDK, latestSubstrateBlock?.number]);

  const truncateHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Blocks className="h-5 w-5 text-selendra-400" />
          <h2 className="text-lg font-semibold text-foreground">Latest Blocks</h2>
        </div>
        <Link
          href="/blocks"
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
                    <div className="h-4 w-20 bg-background-tertiary rounded mb-2" />
                    <div className="h-3 w-32 bg-background-tertiary rounded" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-background-tertiary rounded" />
              </div>
            </div>
          ))
        ) : blocks.length > 0 ? (
          blocks.map((block, index) => (
            <Link
              key={`block-${block.number}-${block.hash.slice(-8)}`}
              href={`/blocks/${block.number}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-background-hover transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-selendra-500/10 flex items-center justify-center">
                  <Blocks className="h-5 w-5 text-selendra-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      #{block.number.toLocaleString()}
                    </span>
                    <span className="text-xs text-foreground-secondary font-mono">
                      {truncateHash(block.hash)}
                    </span>
                  </div>
                  <div className="text-xs text-foreground-secondary mt-0.5">
                    {block.extrinsicsCount} extrinsics
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-secondary">Just now</span>
                <ExternalLink className="h-3 w-3 text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-foreground-secondary">
            No blocks available
          </div>
        )}
      </div>
    </div>
  );
}
