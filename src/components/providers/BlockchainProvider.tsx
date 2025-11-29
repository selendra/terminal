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

// Selendra Chain Constants
export const SELENDRA_CONSTANTS = {
  BLOCK_TIME_MS: 1000, // 1 second block time
  TOKEN_DECIMALS: 18,
  SS58_PREFIX: 42,
  MAINNET_EVM_CHAIN_ID: 1961,
  TESTNET_EVM_CHAIN_ID: 1953,
} as const;

// Public RPC endpoints (always available as fallback)
const PUBLIC_RPC = {
  mainnet: {
    substrateWs: "wss://rpc.selendra.org",
    substrateHttp: "https://rpc.selendra.org",
    evmHttp: "https://rpc.selendra.org",
  },
  testnet: {
    substrateWs: "wss://rpc-testnet.selendra.org",
    substrateHttp: "https://rpc-testnet.selendra.org",
    evmHttp: "https://rpc-testnet.selendra.org",
  },
} as const;

// Get RPC endpoints from environment variables
// Priority: Local node (Docker) → Public RPC (fallback)
const getEndpoints = () => {
  // Primary endpoints (typically local Docker node)
  const primarySubstrateWs = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS;
  const primarySubstrateHttp = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP;
  const primaryEvmHttp = process.env.NEXT_PUBLIC_EVM_RPC_HTTP;

  // Testnet primary endpoints
  const primarySubstrateWsTestnet = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS_TESTNET;
  const primarySubstrateHttpTestnet = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP_TESTNET;
  const primaryEvmHttpTestnet = process.env.NEXT_PUBLIC_EVM_RPC_HTTP_TESTNET;

  return {
    mainnet: {
      // Primary endpoints (local node if configured, otherwise public)
      primary: {
        substrate: primarySubstrateWs || PUBLIC_RPC.mainnet.substrateWs,
        substrateHttp: primarySubstrateHttp || PUBLIC_RPC.mainnet.substrateHttp,
        evm: primaryEvmHttp || PUBLIC_RPC.mainnet.evmHttp,
      },
      // Fallback to public RPC (only if primary is different)
      fallback: primarySubstrateWs ? {
        substrate: PUBLIC_RPC.mainnet.substrateWs,
        substrateHttp: PUBLIC_RPC.mainnet.substrateHttp,
        evm: PUBLIC_RPC.mainnet.evmHttp,
      } : null,
    },
    testnet: {
      primary: {
        substrate: primarySubstrateWsTestnet || PUBLIC_RPC.testnet.substrateWs,
        substrateHttp: primarySubstrateHttpTestnet || PUBLIC_RPC.testnet.substrateHttp,
        evm: primaryEvmHttpTestnet || PUBLIC_RPC.testnet.evmHttp,
      },
      fallback: primarySubstrateWsTestnet ? {
        substrate: PUBLIC_RPC.testnet.substrateWs,
        substrateHttp: PUBLIC_RPC.testnet.substrateHttp,
        evm: PUBLIC_RPC.testnet.evmHttp,
      } : null,
    },
  };
};

const ENDPOINTS = getEndpoints();

// RPC endpoint configuration type
interface RpcEndpoints {
  substrate: string;
  substrateHttp: string;
  evm: string;
}

// Network configuration - Selendra uses unified RPC for both Substrate and EVM
// Both VMs share the same block height (unified architecture)
export const NETWORKS = {
  mainnet: {
    name: "Selendra Mainnet",
    chainId: 1961,
  },
  testnet: {
    name: "Selendra Testnet",
    chainId: 1953,
  },
} as const;

export type NetworkType = keyof typeof NETWORKS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SelendraSDKType = any;

interface BlockInfo {
  number: number;
  hash: string;
  timestamp?: number;
  parentHash?: string;
  extrinsicsRoot?: string;
  stateRoot?: string;
  gasLimit?: string;
  gasUsed?: string;
  miner?: string;
  transactions?: string[];
}

interface ChainInfo {
  name: string;
  version: string;
  chainId?: number;
  ss58Format?: number;
}

interface NetworkStats {
  totalTransactions: number;
  averageBlockTime: number;
  tps: number;
  gasPrice?: string;
  validators?: number;
}

// Connection source tracking
type ConnectionSource = "local" | "public" | null;

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
  const [substrateSDK, setSubstrateSDK] = useState<SelendraSDKType | null>(null);
  const [evmSDK, setEvmSDK] = useState<SelendraSDKType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>("mainnet");
  const [connectionSource, setConnectionSource] = useState<ConnectionSource>(null);
  const [activeEndpoints, setActiveEndpoints] = useState<RpcEndpoints | null>(null);

  // Ref to track if a reconnection is in progress
  const isReconnectingRef = useRef(false);

  const [substrateChainInfo, setSubstrateChainInfo] = useState<ChainInfo | null>(null);
  const [evmChainInfo, setEvmChainInfo] = useState<ChainInfo | null>(null);
  const [latestSubstrateBlock, setLatestSubstrateBlock] = useState<BlockInfo | null>(null);
  const [latestEvmBlock, setLatestEvmBlock] = useState<BlockInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);

  // Check if RPC is available before attempting SDK connection
  const checkRpcAvailability = useCallback(async (endpoint: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) return false;
      
      // Verify we got a valid response
      const data = await response.json();
      return data.result !== undefined;
    } catch {
      return false;
    }
  }, []);

  /**
   * Try to connect to a specific set of RPC endpoints
   * @returns Promise that resolves to true if connection succeeded
   */
  const tryConnectToEndpoints = useCallback(
    async (endpoints: RpcEndpoints, source: ConnectionSource): Promise<boolean> => {
      const network = NETWORKS[currentNetwork];
      
      try {
        // First check if EVM RPC is available
        const evmAvailable = await checkRpcAvailability(endpoints.evm);
        if (!evmAvailable) {
          console.log(`[BlockchainProvider] ${source} EVM RPC not available: ${endpoints.evm}`);
          return false;
        }

        console.log(`[BlockchainProvider] Connecting to ${source} RPC: ${endpoints.evm}`);

        // Import SDK
        const { SelendraSDK, ChainType } = await import("@selendrajs/sdk");

        // Connect to EVM first since we verified it's available
        const evSdk = new SelendraSDK({
          endpoint: endpoints.evm,
          chainType: ChainType.EVM,
        });

        await evSdk.connect();
        setEvmSDK(evSdk);

        // Get EVM chain info
        const provider = evSdk.getEvmProvider();
        if (provider) {
          const netInfo = await provider.getNetwork();
          const chainId = Number(netInfo.chainId);
          
          // Verify chain ID matches expected network
          if (chainId !== network.chainId) {
            console.warn(`[BlockchainProvider] Chain ID mismatch: expected ${network.chainId}, got ${chainId}`);
          }
          
          setEvmChainInfo({
            name: `Selendra EVM (${currentNetwork})`,
            version: "1.0.0",
            chainId,
          });

          // Get latest EVM block
          const evmBlock = await evSdk.getCurrentBlock();
          setLatestEvmBlock(evmBlock);
        }

        // Try Substrate connection
        try {
          const subSdk = new SelendraSDK({
            endpoint: endpoints.substrate,
            chainType: ChainType.Substrate,
            network: currentNetwork === "mainnet" ? "selendra" : "selendra-testnet",
          });

          await subSdk.connect();
          setSubstrateSDK(subSdk);

          const api = subSdk.getApi();
          if (api) {
            const [chain, version] = await Promise.all([
              api.rpc.system.chain(),
              api.rpc.system.version(),
            ]);
            setSubstrateChainInfo({
              name: chain.toString(),
              version: version.toString(),
              ss58Format: api.registry.chainSS58 || SELENDRA_CONSTANTS.SS58_PREFIX,
            });

            const block = await subSdk.getCurrentBlock();
            setLatestSubstrateBlock(block);

            // Get validator count from chain state
            try {
              const validators = await api.query.session.validators();
              const validatorCount = Array.isArray(validators) ? validators.length : 4;
              
              setNetworkStats({
                totalTransactions: 0, // Will be updated via indexer
                averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
                tps: 0, // Will be calculated from real data
                validators: validatorCount,
              });
            } catch {
              setNetworkStats({
                totalTransactions: 0,
                averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
                tps: 0,
                validators: 4, // Default Selendra validators
              });
            }
          }
        } catch (subError) {
          console.warn(`[BlockchainProvider] Substrate connection failed, EVM-only mode:`, subError);
          // EVM connected but Substrate failed - still usable
          setSubstrateChainInfo({
            name: "Selendra",
            version: "unknown",
            ss58Format: SELENDRA_CONSTANTS.SS58_PREFIX,
          });
          setNetworkStats({
            totalTransactions: 0,
            averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
            tps: 0,
            validators: 4,
          });
        }

        // Success - update connection state
        setConnectionSource(source);
        setActiveEndpoints(endpoints);
        console.log(`[BlockchainProvider] Successfully connected to ${source} RPC`);
        return true;
      } catch (err) {
        console.error(`[BlockchainProvider] Failed to connect to ${source} RPC:`, err);
        return false;
      }
    },
    [currentNetwork, checkRpcAvailability]
  );

  /**
   * Connect with hybrid fallback: Local Node → Public RPC
   * Tries local Docker node first, falls back to public RPC if unavailable
   */
  const connectWithFallback = useCallback(
    async (): Promise<boolean> => {
      const networkEndpoints = ENDPOINTS[currentNetwork];

      // Try primary endpoints first (local Docker node if configured)
      console.log(`[BlockchainProvider] Attempting primary connection...`);
      const primarySuccess = await tryConnectToEndpoints(
        networkEndpoints.primary,
        networkEndpoints.fallback ? "local" : "public"
      );

      if (primarySuccess) {
        return true;
      }

      // If primary failed and we have fallback (public RPC), try that
      if (networkEndpoints.fallback) {
        console.log(`[BlockchainProvider] Primary failed, trying public RPC fallback...`);
        const fallbackSuccess = await tryConnectToEndpoints(
          networkEndpoints.fallback,
          "public"
        );

        if (fallbackSuccess) {
          return true;
        }
      }

      // All connection attempts failed
      return false;
    },
    [currentNetwork, tryConnectToEndpoints]
  );

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    // Try to connect with fallback logic
    const connectionSucceeded = await connectWithFallback();

    if (connectionSucceeded) {
      setIsConnected(true);
      setIsConnecting(false);
    } else {
      // All connection attempts failed
      setIsConnecting(false);
      setError("Unable to connect to Selendra network. Please check your connection and try again.");
    }
  }, [isConnecting, isConnected, connectWithFallback]);

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

    // Try to reconnect with fallback logic
    const reconnectionSucceeded = await connectWithFallback();

    if (reconnectionSucceeded) {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    } else {
      setIsConnecting(false);
      setError("Unable to reconnect to Selendra network. Please check your connection.");
    }

    isReconnectingRef.current = false;
  }, [substrateSDK, evmSDK, connectWithFallback]);

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
    [currentNetwork, disconnect]
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

    const api = substrateSDK.getApi();
    if (!api) return;

    let unsubscribe: (() => void) | undefined;
    let hasDisconnectHandler = false;

    // Disconnect handler function - stored separately for cleanup
    const onDisconnected = () => {
      console.warn("WebSocket disconnected from Substrate node");
      setIsConnected(false);
      setError("Connection to Substrate node lost");

      // Trigger reconnection attempt
      attemptReconnect();
    };

    const subscribeToBlocks = async () => {
      try {
        unsubscribe = await api.rpc.chain.subscribeNewHeads((header: { number: { toNumber: () => number }; hash: { toString: () => string }; parentHash: { toString: () => string }; stateRoot: { toString: () => string }; extrinsicsRoot: { toString: () => string } }) => {
          // Store in ref without triggering re-render
          latestBlockRef.current = {
            number: header.number.toNumber(),
            hash: header.hash.toString(),
            parentHash: header.parentHash.toString(),
            stateRoot: header.stateRoot.toString(),
            extrinsicsRoot: header.extrinsicsRoot.toString(),
          };
        });
      } catch {
        // Subscription failed - using mock data, no need to subscribe
      }
    };

    // Set up WebSocket disconnection handler
    const setupDisconnectHandler = () => {
      try {
        // Listen for disconnection event on the API
        // api.on() returns the API instance for chaining, not an unsubscribe function
        api.on("disconnected", onDisconnected);
        hasDisconnectHandler = true;
      } catch {
        // Failed to set up disconnect handler
      }
    };

    subscribeToBlocks();
    setupDisconnectHandler();

    // Update state periodically (every 3 seconds) - Selendra has 1s blocks, update UI every 3 blocks
    const updateInterval = setInterval(() => {
      if (latestBlockRef.current) {
        setLatestSubstrateBlock(latestBlockRef.current);
      }
    }, 3000);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      // Use api.off() to remove the event listener (api.on returns the API instance, not an unsubscribe function)
      if (hasDisconnectHandler && api) {
        try {
          api.off("disconnected", onDisconnected);
        } catch {
          // Ignore cleanup errors
        }
      }
      clearInterval(updateInterval);
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
