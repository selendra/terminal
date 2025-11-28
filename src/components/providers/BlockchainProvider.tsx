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
import { sleep } from "@/lib/utils";

// Selendra Chain Constants
export const SELENDRA_CONSTANTS = {
  BLOCK_TIME_MS: 1000, // 1 second block time
  TOKEN_DECIMALS: 18,
  SS58_PREFIX: 42,
  MAINNET_EVM_CHAIN_ID: 1961,
  TESTNET_EVM_CHAIN_ID: 1953,
} as const;

// Get RPC endpoints from environment variables or use defaults
// This allows configuration via Docker or .env files
const getEndpoints = () => {
  const substrateWs = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS || "wss://rpc.selendra.org";
  const substrateHttp = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP || "https://rpc.selendra.org";
  const evmHttp = process.env.NEXT_PUBLIC_EVM_RPC_HTTP || "https://rpc.selendra.org";

  return {
    mainnet: {
      substrate: substrateWs,
      substrateHttp: substrateHttp,
      evm: evmHttp,
    },
    testnet: {
      substrate: process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS_TESTNET || "wss://rpc-testnet.selendra.org",
      substrateHttp: process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP_TESTNET || "https://rpc-testnet.selendra.org",
      evm: process.env.NEXT_PUBLIC_EVM_RPC_HTTP_TESTNET || "https://rpc-testnet.selendra.org",
    }
  };
};

const ENDPOINTS = getEndpoints();

// Network configuration - Selendra uses unified RPC for both Substrate and EVM
// Both VMs share the same block height (unified architecture)
export const NETWORKS = {
  mainnet: {
    name: "Selendra Mainnet",
    substrate: {
      endpoint: ENDPOINTS.mainnet.substrate,
    },
    evm: {
      // Use HTTPS version of same RPC for EVM calls
      endpoint: ENDPOINTS.mainnet.evm,
      chainId: 1961,
    },
  },
  testnet: {
    name: "Selendra Testnet",
    substrate: {
      endpoint: ENDPOINTS.testnet.substrate,
    },
    evm: {
      endpoint: ENDPOINTS.testnet.evm,
      chainId: 1953,
    },
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

interface BlockchainContextType {
  // SDK instances (typed as any to avoid import issues)
  substrateSDK: SelendraSDKType | null;
  evmSDK: SelendraSDKType | null;

  // Connection state
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  useMockData: boolean;

  // Network
  currentNetwork: NetworkType;
  setNetwork: (network: NetworkType) => Promise<void>;

  // Chain data
  substrateChainInfo: ChainInfo | null;
  evmChainInfo: ChainInfo | null;
  latestSubstrateBlock: BlockInfo | null;
  latestEvmBlock: BlockInfo | null;
  networkStats: NetworkStats | null;

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
  const [useMockData, setUseMockData] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Ref to track if a reconnection is in progress
  const isReconnectingRef = useRef(false);

  const [substrateChainInfo, setSubstrateChainInfo] = useState<ChainInfo | null>(null);
  const [evmChainInfo, setEvmChainInfo] = useState<ChainInfo | null>(null);
  const [latestSubstrateBlock, setLatestSubstrateBlock] = useState<BlockInfo | null>(null);
  const [latestEvmBlock, setLatestEvmBlock] = useState<BlockInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);

  // Initialize with mock data to avoid SDK connection errors
  // TODO: REPLACE THIS MOCK DATA WITH REAL BLOCKCHAIN DATA
  // This function is called when connection fails or during initial load if configured.
  const initializeMockData = useCallback(() => {
    const network = NETWORKS[currentNetwork];

    setSubstrateChainInfo({
      name: "Selendra",
      version: "1.0.0",
      ss58Format: 42,
    });

    setLatestSubstrateBlock({
      number: 1234567,
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      timestamp: Date.now(),
      parentHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      stateRoot: "0x1111111111111111111111111111111111111111111111111111111111111111",
      extrinsicsRoot: "0x2222222222222222222222222222222222222222222222222222222222222222",
    });

    setEvmChainInfo({
      name: `Selendra EVM (${currentNetwork})`,
      version: "1.0.0",
      chainId: network.evm.chainId,
    });

    setLatestEvmBlock({
      number: 987654,
      hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      timestamp: Date.now(),
      gasLimit: "36000000",
      gasUsed: "15000000",
    });

    // Selendra specs: 1s blocks, 2000+ TPS, 4 validators (Phase 1)
    setNetworkStats({
      totalTransactions: 15420000,
      averageBlockTime: 1,
      tps: 2000,
      validators: 4,
    });

    setUseMockData(true);
    setIsConnected(true);
    setIsConnecting(false);
  }, [currentNetwork]);

  // Check if RPC is available before attempting SDK connection
  const checkRpcAvailability = useCallback(async (endpoint: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Connect with retry logic and exponential backoff
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000ms)
   * @returns Promise that resolves to true if connection succeeded, false if fell back to mock data
   */
  const connectWithRetry = useCallback(
    async (maxRetries = 3, baseDelay = 1000): Promise<boolean> => {
      const network = NETWORKS[currentNetwork];

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Check if EVM RPC is available
          const evmAvailable = await checkRpcAvailability(network.evm.endpoint);

          if (!evmAvailable) {
            if (attempt < maxRetries - 1) {
              // Wait with exponential backoff before next attempt
              const delay = baseDelay * Math.pow(2, attempt);
              await sleep(delay);
              continue;
            }
            // All retries exhausted
            return false;
          }

          // RPC is available - try to connect with SDK
          const { SelendraSDK, ChainType } = await import("@selendrajs/sdk");

          // Try EVM first since we already verified it's available
          const evSdk = new SelendraSDK({
            endpoint: network.evm.endpoint,
            chainType: ChainType.EVM,
          });

          await evSdk.connect();
          setEvmSDK(evSdk);
          setUseMockData(false);

          // Get EVM chain info
          const provider = evSdk.getEvmProvider();
          if (provider) {
            const netInfo = await provider.getNetwork();
            setEvmChainInfo({
              name: `Selendra EVM (${currentNetwork})`,
              version: "1.0.0",
              chainId: Number(netInfo.chainId),
            });

            // Get latest EVM block
            const evmBlock = await evSdk.getCurrentBlock();
            setLatestEvmBlock(evmBlock);
          }

          // Try Substrate connection (optional - won't fail if unavailable)
          try {
            const subSdk = new SelendraSDK({
              endpoint: network.substrate.endpoint,
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
            }
          } catch {
            // Substrate not available - use mock data for Substrate
            setSubstrateChainInfo({
              name: "Selendra",
              version: "1.0.0",
              ss58Format: SELENDRA_CONSTANTS.SS58_PREFIX,
            });
            setLatestSubstrateBlock({
              number: 1234567,
              hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
              timestamp: Date.now(),
            });
          }

          // Selendra specs: 1s blocks, 2000+ TPS, 4 validators (Phase 1)
          setNetworkStats({
            totalTransactions: 15420000,
            averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
            tps: 2000,
            validators: 4,
          });

          return true;
        } catch {
          if (attempt < maxRetries - 1) {
            // Wait with exponential backoff before next attempt
            const delay = baseDelay * Math.pow(2, attempt);
            await sleep(delay);
          }
        }
      }

      // All retries exhausted
      return false;
    },
    [currentNetwork, checkRpcAvailability]
  );

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);
    setReconnectAttempt(0);

    // Try to connect with retry logic
    const connectionSucceeded = await connectWithRetry(3, 1000);

    if (connectionSucceeded) {
      setIsConnected(true);
      setIsConnecting(false);
    } else {
      // Fall back to mock data after all retries exhausted
      initializeMockData();
    }
  }, [isConnecting, isConnected, connectWithRetry, initializeMockData]);

  /**
   * Attempt to reconnect after a disconnection
   */
  const attemptReconnect = useCallback(async () => {
    if (isReconnectingRef.current) return;

    isReconnectingRef.current = true;
    setReconnectAttempt((prev) => prev + 1);

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
    setIsConnecting(true);
    setError("Connection lost. Attempting to reconnect...");

    // Try to reconnect with retry logic
    const reconnectionSucceeded = await connectWithRetry(3, 1000);

    if (reconnectionSucceeded) {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    } else {
      // Fall back to mock data
      initializeMockData();
      setError("Could not reconnect to network. Using mock data.");
    }

    isReconnectingRef.current = false;
  }, [substrateSDK, evmSDK, connectWithRetry, initializeMockData]);

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
    if (!isConnected || !substrateSDK || useMockData) return;

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
  }, [isConnected, substrateSDK, useMockData, attemptReconnect]);

  const value: BlockchainContextType = {
    substrateSDK,
    evmSDK,
    isConnecting,
    isConnected,
    error,
    useMockData,
    currentNetwork,
    setNetwork,
    substrateChainInfo,
    evmChainInfo,
    latestSubstrateBlock,
    latestEvmBlock,
    networkStats,
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
