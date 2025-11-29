/**
 * Real-time Block Subscription Hook
 *
 * Provides WebSocket-based subscriptions for new blocks
 * from both Substrate and EVM layers.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

/**
 * Block information type
 */
export interface RealtimeBlock {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  type: "substrate" | "evm";
  extrinsicCount?: number;
  transactionCount?: number;
  validator?: string;
  gasUsed?: string;
  gasLimit?: string;
  stateRoot?: string;
  extrinsicsRoot?: string;
}

interface UseBlockSubscriptionOptions {
  /** Maximum number of blocks to keep in memory */
  maxBlocks?: number;
  /** Filter by block type */
  filterType?: "substrate" | "evm" | "all";
  /** Callback when new block is received */
  onBlock?: (block: RealtimeBlock) => void;
}

interface UseBlockSubscriptionReturn {
  /** List of recent blocks */
  blocks: RealtimeBlock[];
  /** Latest block */
  latestBlock: RealtimeBlock | null;
  /** Whether currently subscribed */
  isSubscribed: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Manually start subscription */
  subscribe: () => void;
  /** Manually stop subscription */
  unsubscribe: () => void;
  /** Clear block list */
  clear: () => void;
}

/**
 * Hook for subscribing to real-time blocks
 */
export function useBlockSubscription(
  options: UseBlockSubscriptionOptions = {}
): UseBlockSubscriptionReturn {
  const { maxBlocks = 50, filterType = "all", onBlock } = options;

  const { substrateSDK, evmSDK, isConnected } = useBlockchain();

  const [blocks, setBlocks] = useState<RealtimeBlock[]>([]);
  const [latestBlock, setLatestBlock] = useState<RealtimeBlock | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for callbacks and subscriptions
  const onBlockRef = useRef(onBlock);
  const substrateUnsubRef = useRef<(() => void) | null>(null);
  const evmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEvmBlockRef = useRef<number>(0);

  // Keep callback ref updated
  useEffect(() => {
    onBlockRef.current = onBlock;
  }, [onBlock]);

  /**
   * Add a block to the list
   */
  const addBlock = useCallback(
    (block: RealtimeBlock) => {
      // Apply filters
      if (filterType !== "all" && block.type !== filterType) return;

      setLatestBlock(block);
      setBlocks((prev) => {
        // Check for duplicates
        if (prev.some((b) => b.hash === block.hash)) return prev;

        // Add to front, maintain max size
        const updated = [block, ...prev];
        if (updated.length > maxBlocks) {
          updated.length = maxBlocks;
        }
        return updated;
      });

      // Call user callback
      onBlockRef.current?.(block);
    },
    [filterType, maxBlocks]
  );

  /**
   * Subscribe to Substrate new heads
   */
  const subscribeSubstrate = useCallback(async () => {
    if (!substrateSDK) return;

    const api = substrateSDK.getApi();
    if (!api) return;

    try {
      substrateUnsubRef.current = await api.rpc.chain.subscribeNewHeads(
        async (header: {
          number: { toNumber: () => number };
          hash: { toString: () => string };
          parentHash: { toString: () => string };
          stateRoot: { toString: () => string };
          extrinsicsRoot: { toString: () => string };
          digest: { logs: unknown[] };
        }) => {
          try {
            // Get block details
            const blockHash = header.hash;
            const [signedBlock, timestamp] = await Promise.all([
              api.rpc.chain.getBlock(blockHash),
              api.query.timestamp.now.at(blockHash),
            ]);

            // Extract validator from consensus logs
            let validator: string | undefined;
            for (const log of header.digest.logs) {
              const logObj = log as {
                isPreRuntime?: boolean;
                asPreRuntime?: [{ toString: () => string }, unknown];
              };
              if (logObj.isPreRuntime) {
                const [engine] = logObj.asPreRuntime || [];
                if (engine?.toString() === "aura") {
                  // AURA consensus - first 32 bytes is the authority index
                  // Would need to decode properly
                  validator = "Validator (AURA)";
                }
              }
            }

            const block: RealtimeBlock = {
              number: header.number.toNumber(),
              hash: header.hash.toString(),
              parentHash: header.parentHash.toString(),
              timestamp: Number(timestamp.toString()),
              type: "substrate",
              extrinsicCount: signedBlock.block.extrinsics.length,
              validator,
              stateRoot: header.stateRoot.toString(),
              extrinsicsRoot: header.extrinsicsRoot.toString(),
            };

            addBlock(block);
          } catch (err) {
            console.error("Error processing Substrate block:", err);
          }
        }
      );
    } catch (err) {
      console.error("Failed to subscribe to Substrate blocks:", err);
      setError("Failed to subscribe to Substrate blocks");
    }
  }, [substrateSDK, addBlock]);

  /**
   * Poll for EVM blocks
   */
  const subscribeEvm = useCallback(async () => {
    if (!evmSDK) return;

    const provider = evmSDK.getEvmProvider();
    if (!provider) return;

    // Get initial block
    try {
      const initialBlock = await provider.getBlock("latest");
      if (initialBlock) {
        lastEvmBlockRef.current = initialBlock.number;
      }
    } catch {
      // Ignore
    }

    // Poll for new blocks
    evmIntervalRef.current = setInterval(async () => {
      try {
        const latestEvmBlock = await provider.getBlock("latest");
        if (!latestEvmBlock) return;

        // Skip if already processed
        if (latestEvmBlock.number <= lastEvmBlockRef.current) return;
        lastEvmBlockRef.current = latestEvmBlock.number;

        const block: RealtimeBlock = {
          number: latestEvmBlock.number,
          hash: latestEvmBlock.hash || "",
          parentHash: latestEvmBlock.parentHash,
          timestamp: latestEvmBlock.timestamp * 1000,
          type: "evm",
          transactionCount: latestEvmBlock.transactions?.length || 0,
          gasUsed: latestEvmBlock.gasUsed.toString(),
          gasLimit: latestEvmBlock.gasLimit.toString(),
          validator: latestEvmBlock.miner,
        };

        addBlock(block);
      } catch (err) {
        console.error("Error polling EVM blocks:", err);
      }
    }, 1000);
  }, [evmSDK, addBlock]);

  /**
   * Start all subscriptions
   */
  const subscribe = useCallback(() => {
    if (isSubscribed) return;

    setIsSubscribed(true);
    setError(null);

    if (filterType === "all" || filterType === "substrate") {
      subscribeSubstrate();
    }
    if (filterType === "all" || filterType === "evm") {
      subscribeEvm();
    }
  }, [isSubscribed, filterType, subscribeSubstrate, subscribeEvm]);

  /**
   * Stop all subscriptions
   */
  const unsubscribe = useCallback(() => {
    if (!isSubscribed) return;

    setIsSubscribed(false);

    if (substrateUnsubRef.current) {
      substrateUnsubRef.current();
      substrateUnsubRef.current = null;
    }

    if (evmIntervalRef.current) {
      clearInterval(evmIntervalRef.current);
      evmIntervalRef.current = null;
    }
  }, [isSubscribed]);

  /**
   * Clear block list
   */
  const clear = useCallback(() => {
    setBlocks([]);
    setLatestBlock(null);
  }, []);

  // Auto-subscribe when connected
  useEffect(() => {
    if (isConnected && !isSubscribed) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [isConnected, isSubscribed, subscribe, unsubscribe]);

  return {
    blocks,
    latestBlock,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
    clear,
  };
}
