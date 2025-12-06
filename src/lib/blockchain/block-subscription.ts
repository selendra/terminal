/**
 * Block Subscription
 * Handles real-time block updates from the Substrate chain
 */

import type { SelendraSDKType, BlockInfo } from "./types";

/**
 * Block header interface from Polkadot API
 */
interface BlockHeader {
  number: { toNumber: () => number };
  hash: { toString: () => string };
  parentHash: { toString: () => string };
  stateRoot: { toString: () => string };
  extrinsicsRoot: { toString: () => string };
}

/**
 * Subscribe to new block headers
 * @param substrateSDK The Substrate SDK instance
 * @param onBlock Callback function called for each new block
 * @param onDisconnect Callback function called when connection is lost
 * @returns Cleanup function to unsubscribe
 */
export async function subscribeToBlocks(
  substrateSDK: SelendraSDKType,
  onBlock: (block: BlockInfo) => void,
  onDisconnect: () => void
): Promise<() => void> {
  const api = substrateSDK.getApi();
  if (!api) {
    return () => {};
  }

  let unsubscribe: (() => void) | undefined;
  let hasDisconnectHandler = false;

  // Set up WebSocket disconnection handler
  const setupDisconnectHandler = () => {
    try {
      // Listen for disconnection event on the API
      // api.on() returns the API instance for chaining, not an unsubscribe function
      api.on("disconnected", onDisconnect);
      hasDisconnectHandler = true;
    } catch {
      // Failed to set up disconnect handler
    }
  };

  try {
    unsubscribe = await api.rpc.chain.subscribeNewHeads(
      (header: BlockHeader) => {
        onBlock({
          number: header.number.toNumber(),
          hash: header.hash.toString(),
          parentHash: header.parentHash.toString(),
          stateRoot: header.stateRoot.toString(),
          extrinsicsRoot: header.extrinsicsRoot.toString(),
        });
      }
    );

    setupDisconnectHandler();
  } catch {
    // Subscription failed - using mock data, no need to subscribe
  }

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
    // Use api.off() to remove the event listener
    if (hasDisconnectHandler && api) {
      try {
        api.off("disconnected", onDisconnect);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}
