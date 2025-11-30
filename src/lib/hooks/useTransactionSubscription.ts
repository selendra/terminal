/**
 * Real-time Transaction Subscription Hook
 *
 * Provides WebSocket-based subscriptions for new transactions
 * from both Substrate and EVM layers.
 * 
 * Selendra uses AlephBFT consensus with 1-second block time and instant finality.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

/**
 * Unified transaction type for real-time updates
 */
export interface RealtimeTransaction {
  id: string;
  hash: string;
  type: "substrate" | "evm";
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: string;
  fee?: string;
  status: "pending" | "success" | "failed";
  method?: string;
  gasUsed?: string;
  gasPrice?: string;
}

interface UseTransactionSubscriptionOptions {
  /** Maximum number of transactions to keep in memory */
  maxTransactions?: number;
  /** Whether to include pending transactions (mempool) */
  includePending?: boolean;
  /** Filter by specific address (from or to) */
  filterAddress?: string;
  /** Filter by transaction type */
  filterType?: "substrate" | "evm" | "all";
  /** Callback when new transaction is received */
  onTransaction?: (tx: RealtimeTransaction) => void;
}

interface UseTransactionSubscriptionReturn {
  /** List of recent transactions */
  transactions: RealtimeTransaction[];
  /** Whether currently subscribed */
  isSubscribed: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Manually start subscription */
  subscribe: () => void;
  /** Manually stop subscription */
  unsubscribe: () => void;
  /** Clear transaction list */
  clear: () => void;
}

/**
 * Hook for subscribing to real-time transactions
 */
export function useTransactionSubscription(
  options: UseTransactionSubscriptionOptions = {}
): UseTransactionSubscriptionReturn {
  const {
    maxTransactions = 100,
    includePending = false,
    filterAddress,
    filterType = "all",
    onTransaction,
  } = options;

  const { substrateSDK, evmSDK, isConnected } = useBlockchain();

  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for callbacks and subscriptions
  const onTransactionRef = useRef(onTransaction);
  const substrateUnsubRef = useRef<(() => void) | null>(null);
  const evmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEvmBlockRef = useRef<number>(0);

  // Keep callback ref updated
  useEffect(() => {
    onTransactionRef.current = onTransaction;
  }, [onTransaction]);

  /**
   * Add a transaction to the list
   */
  const addTransaction = useCallback(
    (tx: RealtimeTransaction) => {
      // Apply filters
      if (filterType !== "all" && tx.type !== filterType) return;
      if (filterAddress) {
        const normalizedFilter = filterAddress.toLowerCase();
        const fromMatch = tx.from.toLowerCase() === normalizedFilter;
        const toMatch = tx.to?.toLowerCase() === normalizedFilter;
        if (!fromMatch && !toMatch) return;
      }

      setTransactions((prev) => {
        // Check for duplicates
        if (prev.some((t) => t.hash === tx.hash)) return prev;

        // Add to front, maintain max size
        const updated = [tx, ...prev];
        if (updated.length > maxTransactions) {
          updated.length = maxTransactions;
        }
        return updated;
      });

      // Call user callback
      onTransactionRef.current?.(tx);
    },
    [filterType, filterAddress, maxTransactions]
  );

  /**
   * Subscribe to Substrate new blocks (faster than finalized)
   */
  const subscribeSubstrate = useCallback(async () => {
    if (!substrateSDK) return;

    const api = substrateSDK.getApi();
    if (!api || !api.isConnected) return;

    try {
      // Subscribe to new heads (faster than finalized)
      substrateUnsubRef.current = await api.rpc.chain.subscribeNewHeads(
        async (header: {
          number: { toNumber: () => number };
          hash: { toString: () => string };
        }) => {
          // Wrap block processing in try-catch to handle disconnections gracefully
          try {
            // Check if still connected before making RPC calls
            if (!api.isConnected) return;

            // Get block with extrinsics
            const blockHash = header.hash;
            const [signedBlock, events] = await Promise.all([
              api.rpc.chain.getBlock(blockHash),
              api.query.system.events.at(blockHash),
            ]);

            const blockNumber = header.number.toNumber();
            const timestamp = Date.now();

            // Process each extrinsic
            signedBlock.block.extrinsics.forEach(
              (
                extrinsic: {
                  hash: { toString: () => string };
                  signer: { toString: () => string };
                  method: {
                    section: string;
                    method: string;
                    args: Array<{ toString: () => string }>;
                  };
                  isSigned: boolean;
                },
                index: number
              ) => {
                // Only process signed extrinsics
                if (!extrinsic.isSigned) return;

                const extrinsicHash = extrinsic.hash.toString();
                const signer = extrinsic.signer.toString();
                const method = `${extrinsic.method.section}.${extrinsic.method.method}`;

                // Find success/failure events for this extrinsic
                const extrinsicEvents = (events as unknown[]).filter(
                  (event: unknown) => {
                    const e = event as {
                      phase: {
                        isApplyExtrinsic: boolean;
                        asApplyExtrinsic: { toNumber: () => number };
                      };
                    };
                    return (
                      e.phase.isApplyExtrinsic &&
                      e.phase.asApplyExtrinsic.toNumber() === index
                    );
                  }
                );

                const success = !extrinsicEvents.some((event: unknown) => {
                  const e = event as {
                    event: { section: string; method: string };
                  };
                  return (
                    e.event.section === "system" &&
                    e.event.method === "ExtrinsicFailed"
                  );
                });

                // Extract transfer info if this is a balance transfer
                let to: string | null = null;
                let value = "0";

                if (
                  extrinsic.method.section === "balances" &&
                  [
                    "transfer",
                    "transferKeepAlive",
                    "transferAllowDeath",
                  ].includes(extrinsic.method.method)
                ) {
                  to = extrinsic.method.args[0]?.toString() || null;
                  value = extrinsic.method.args[1]?.toString() || "0";
                }

                // Extract fee from events
                let fee: string | undefined;
                const feeEvent = extrinsicEvents.find((event: unknown) => {
                  const e = event as {
                    event: { section: string; method: string };
                  };
                  return (
                    e.event.section === "transactionPayment" &&
                    e.event.method === "TransactionFeePaid"
                  );
                });
                if (feeEvent) {
                  fee = (
                    feeEvent as unknown as {
                      event: { data: Array<{ toString: () => string }> };
                    }
                  ).event.data[1]?.toString();
                }

                const tx: RealtimeTransaction = {
                  id: `substrate-${extrinsicHash}`,
                  hash: extrinsicHash,
                  type: "substrate",
                  blockNumber,
                  timestamp,
                  from: signer,
                  to,
                  value,
                  fee,
                  status: success ? "success" : "failed",
                  method,
                };

                addTransaction(tx);
              }
            );
          } catch (err) {
            // Silently ignore disconnection errors - BlockchainProvider handles reconnection
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (!errorMessage.includes("disconnected") && !errorMessage.includes("1006")) {
              console.error("Error processing Substrate block:", err);
            }
          }
        }
      );
    } catch (err) {
      // Silently ignore connection errors during subscription setup
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes("disconnected") && !errorMessage.includes("1006")) {
        console.error("Failed to subscribe to Substrate blocks:", err);
        setError("Failed to subscribe to Substrate transactions");
      }
    }
  }, [substrateSDK, addTransaction]);

  /**
   * Poll for EVM transactions (ethers doesn't have native tx subscription)
   */
  const subscribeEvm = useCallback(async () => {
    if (!evmSDK) return;

    const provider = evmSDK.getEvmProvider();
    if (!provider) return;

    // Get initial block number
    try {
      const initialBlock = await provider.getBlockNumber();
      lastEvmBlockRef.current = initialBlock;
    } catch (err) {
      console.error("Failed to get initial EVM block:", err);
    }

    // Poll for new blocks every 1 second (Selendra block time)
    evmIntervalRef.current = setInterval(async () => {
      try {
        const latestBlockNum = await provider.getBlockNumber();

        // Skip if we already processed this block
        if (latestBlockNum <= lastEvmBlockRef.current) return;

        // Process all blocks we might have missed
        for (let blockNum = lastEvmBlockRef.current + 1; blockNum <= latestBlockNum; blockNum++) {
          const block = await provider.getBlock(blockNum, true);
          if (!block) continue;

          // Process transactions in block using prefetchedTransactions (ethers v6)
          const txs = block.prefetchedTransactions || [];

          for (const tx of txs) {
            // Get receipt for status
            const receipt = await provider.getTransactionReceipt(tx.hash);

            const transaction: RealtimeTransaction = {
              id: `evm-${tx.hash}`,
              hash: tx.hash,
              type: "evm",
              blockNumber: block.number,
              timestamp: block.timestamp * 1000,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              status: receipt?.status === 1 ? "success" : "failed",
              gasUsed: receipt?.gasUsed.toString(),
              gasPrice: tx.gasPrice?.toString(),
            };

            addTransaction(transaction);
          }
        }

        lastEvmBlockRef.current = latestBlockNum;
      } catch (err) {
        // Silently ignore network errors during polling
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes("disconnected") && !errorMessage.includes("network") && !errorMessage.includes("fetch")) {
          console.error("Error polling EVM blocks:", err);
        }
      }
    }, 1000);
  }, [evmSDK, addTransaction]);

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
   * Clear transaction list
   */
  const clear = useCallback(() => {
    setTransactions([]);
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
    transactions,
    isSubscribed,
    error,
    subscribe,
    unsubscribe,
    clear,
  };
}

/**
 * Hook for subscribing to pending transactions (mempool)
 */
export function usePendingTransactions(
  options: Omit<UseTransactionSubscriptionOptions, "includePending"> = {}
): UseTransactionSubscriptionReturn {
  return useTransactionSubscription({
    ...options,
    includePending: true,
  });
}

/**
 * Hook for subscribing to a specific address's transactions
 */
export function useAddressTransactions(
  address: string,
  options: Omit<UseTransactionSubscriptionOptions, "filterAddress"> = {}
): UseTransactionSubscriptionReturn {
  return useTransactionSubscription({
    ...options,
    filterAddress: address,
  });
}
