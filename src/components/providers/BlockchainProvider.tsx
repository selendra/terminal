"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";

// Import blockchain utilities
import {
  ENDPOINTS,
  connectWithFallback,
  subscribeToBlocks,
  type NetworkType,
  type SelendraSDKType,
  type BlockInfo,
  type ChainInfo,
  type NetworkStats,
  type ConnectionSource,
  type RpcEndpoints,
} from "@/lib/blockchain";

// Re-export for backward compatibility
export { SELENDRA_CONSTANTS, NETWORKS } from "@/lib/blockchain";
export type { NetworkType } from "@/lib/blockchain";

interface BlockchainContextType {
  // SDK instances (typed as any to avoid import issues)
  substrateSDK: SelendraSDKType | null;
  evmSDK: SelendraSDKType | null;

  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connectionSource: ConnectionSource; // Which RPC we're connected to

  // Network
  currentNetwork: NetworkType;
  setNetwork: (network: NetworkType) => Promise<void>;

  // Chain data
  substrateChainInfo: ChainInfo | null;
  evmChainInfo: ChainInfo | null;
  latestSubstrateBlock: BlockInfo | null;
  latestEvmBlock: BlockInfo | null;
  networkStats: NetworkStats | null;

  // Active endpoints (for debugging/display)
  activeEndpoints: RpcEndpoints | null;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType | null>(null);

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
}

interface BlockchainProviderProps {
  children: ReactNode;
}

export function BlockchainProvider({ children }: BlockchainProviderProps) {
  const [substrateSDK, setSubstrateSDK] = useState<SelendraSDKType | null>(
    null,
  );
  const [evmSDK, setEvmSDK] = useState<SelendraSDKType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("mainnet");
  const [connectionSource, setConnectionSource] =
    useState<ConnectionSource>(null);
  const [activeEndpoints, setActiveEndpoints] = useState<RpcEndpoints | null>(
    null,
  );

  // Ref to track if a reconnection is in progress
  const isReconnectingRef = useRef(false);

  const [substrateChainInfo, setSubstrateChainInfo] =
    useState<ChainInfo | null>(null);
  const [evmChainInfo, setEvmChainInfo] = useState<ChainInfo | null>(null);
  const [latestSubstrateBlock, setLatestSubstrateBlock] =
    useState<BlockInfo | null>(null);
  const [latestEvmBlock, setLatestEvmBlock] = useState<BlockInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    const networkEndpoints = ENDPOINTS[currentNetwork];

    // Try to connect with fallback logic
    const result = await connectWithFallback(networkEndpoints, currentNetwork);

    if (result.success) {
      setSubstrateSDK(result.substrateSDK);
      setEvmSDK(result.evmSDK);
      setSubstrateChainInfo(result.substrateChainInfo);
      setEvmChainInfo(result.evmChainInfo);
      setLatestSubstrateBlock(result.latestSubstrateBlock);
      setLatestEvmBlock(result.latestEvmBlock);
      setNetworkStats(result.networkStats);
      setConnectionSource(networkEndpoints.fallback ? "local" : "public");
      setActiveEndpoints(networkEndpoints.primary);
      setIsConnected(true);
      setIsConnecting(false);
    } else {
      // All connection attempts failed
      setIsConnecting(false);
      setError(
        "Unable to connect to Selendra network. Please check your connection and try again.",
      );
    }
  }, [isConnecting, isConnected, currentNetwork]);

  /**
   * Attempt to reconnect after a disconnection
   * Uses the same hybrid fallback logic
   */
  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) return;

    isReconnectingRef.current = true;

    // Clean up existing connections
    try {
      if (substrateSDK) {
        await substrateSDK.destroy();
        setSubstrateSDK(null);
      }
      if (evmSDK) {
        await evmSDK.destroy();
        setEvmSDK(null);
      }
    } catch {
      // Cleanup failed silently
    }

    setIsConnected(false);
    setConnectionSource(null);
    setActiveEndpoints(null);
    setIsConnecting(true);
    setError("Connection lost. Attempting to reconnect...");

    const networkEndpoints = ENDPOINTS[currentNetwork];

    // Try to reconnect with fallback logic
    const result = await connectWithFallback(networkEndpoints, currentNetwork);

    if (result.success) {
      setSubstrateSDK(result.substrateSDK);
      setEvmSDK(result.evmSDK);
      setSubstrateChainInfo(result.substrateChainInfo);
      setEvmChainInfo(result.evmChainInfo);
      setLatestSubstrateBlock(result.latestSubstrateBlock);
      setLatestEvmBlock(result.latestEvmBlock);
      setNetworkStats(result.networkStats);
      setConnectionSource(networkEndpoints.fallback ? "local" : "public");
      setActiveEndpoints(networkEndpoints.primary);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    } else {
      setIsConnecting(false);
      setError(
        "Unable to reconnect to Selendra network. Please check your connection.",
      );
    }

    isReconnectingRef.current = false;
  }, [substrateSDK, evmSDK, currentNetwork]);

  const disconnect = useCallback(async () => {
    try {
      if (substrateSDK) {
        await substrateSDK.destroy();
        setSubstrateSDK(null);
      }
      if (evmSDK) {
        await evmSDK.destroy();
        setEvmSDK(null);
      }
      setIsConnected(false);
      setConnectionSource(null);
      setActiveEndpoints(null);
      setSubstrateChainInfo(null);
      setEvmChainInfo(null);
      setLatestSubstrateBlock(null);
      setLatestEvmBlock(null);
      setNetworkStats(null);
    } catch {
      // Disconnect failed silently
    }
  }, [substrateSDK, evmSDK]);

  const setNetwork = useCallback(
    async (network: NetworkType) => {
      if (network === currentNetwork) return;
      await disconnect();
      setCurrentNetwork(network);
    },
    [currentNetwork, disconnect],
  );

  const refreshData = useCallback(async () => {
    if (!isConnected) return;

    try {
      if (substrateSDK) {
        const block = await substrateSDK.getCurrentBlock();
        setLatestSubstrateBlock(block);
      }
    } catch {
      // Silently fail - keep existing data
    }

    try {
      if (evmSDK) {
        const block = await evmSDK.getCurrentBlock();
        setLatestEvmBlock(block);
      }
    } catch {
      // Silently fail - keep existing data
    }
  }, [isConnected, substrateSDK, evmSDK]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect when network changes
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
  }, [currentNetwork, isConnected, isConnecting, connect]);

  // Set up block subscription for real-time updates
  // Use ref to store latest block to avoid re-renders on every block
  const latestBlockRef = useRef<BlockInfo | null>(null);

  useEffect(() => {
    if (!isConnected || !substrateSDK) return;

    let unsubscribeFromBlocks: (() => void) | undefined;
    let updateInterval: NodeJS.Timeout | undefined;

    const onDisconnected = () => {
      console.warn("WebSocket disconnected from Substrate node");
      setIsConnected(false);
      setError("Connection to Substrate node lost");

      // Trigger reconnection attempt
      attemptReconnect();
    };

    const onBlock = (block: BlockInfo) => {
      // Store in ref without triggering re-render
      latestBlockRef.current = block;
    };

    // Subscribe to blocks
    subscribeToBlocks(substrateSDK, onBlock, onDisconnected).then(
      (cleanup) => {
        unsubscribeFromBlocks = cleanup;
      },
    );

    // Update state every block (1 second) - Selendra has 1s block time
    updateInterval = setInterval(() => {
      if (latestBlockRef.current) {
        setLatestSubstrateBlock(latestBlockRef.current);
      }
    }, 1000);

    return () => {
      if (unsubscribeFromBlocks) {
        unsubscribeFromBlocks();
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isConnected, substrateSDK, attemptReconnect]);

  const value: BlockchainContextType = {
    substrateSDK,
    evmSDK,
    isConnecting,
    isConnected,
    error,
    connectionSource,
    currentNetwork,
    setNetwork,
    substrateChainInfo,
    evmChainInfo,
    latestSubstrateBlock,
    latestEvmBlock,
    networkStats,
    activeEndpoints,
    connect,
    disconnect,
    refreshData,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}
