/**
 * Selendra Chain Constants
 * Contains core blockchain constants for Selendra network
 */
export const SELENDRA_CONSTANTS = {
  BLOCK_TIME_MS: 1000, // 1 second block time
  TOKEN_DECIMALS: 18,
  SS58_PREFIX: 42,
  MAINNET_EVM_CHAIN_ID: 1961,
  TESTNET_EVM_CHAIN_ID: 1953,
} as const;

/**
 * Public RPC endpoints (always available as fallback)
 */
export const PUBLIC_RPC = {
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

/**
 * Network configuration - Selendra uses unified RPC for both Substrate and EVM
 * Both VMs share the same block height (unified architecture)
 */
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

/**
 * RPC endpoint configuration type
 */
export interface RpcEndpoints {
  substrate: string;
  substrateHttp: string;
  evm: string;
}

/**
 * Get RPC endpoints from environment variables
 * Priority: Local node (Docker) → Public RPC (fallback)
 */
export function getEndpoints() {
  // Primary endpoints (typically local Docker node)
  const primarySubstrateWs = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS;
  const primarySubstrateHttp = process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP;
  const primaryEvmHttp = process.env.NEXT_PUBLIC_EVM_RPC_HTTP;

  // Testnet primary endpoints
  const primarySubstrateWsTestnet =
    process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS_TESTNET;
  const primarySubstrateHttpTestnet =
    process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP_TESTNET;
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
      fallback: primarySubstrateWs
        ? {
            substrate: PUBLIC_RPC.mainnet.substrateWs,
            substrateHttp: PUBLIC_RPC.mainnet.substrateHttp,
            evm: PUBLIC_RPC.mainnet.evmHttp,
          }
        : null,
    },
    testnet: {
      primary: {
        substrate: primarySubstrateWsTestnet || PUBLIC_RPC.testnet.substrateWs,
        substrateHttp:
          primarySubstrateHttpTestnet || PUBLIC_RPC.testnet.substrateHttp,
        evm: primaryEvmHttpTestnet || PUBLIC_RPC.testnet.evmHttp,
      },
      fallback: primarySubstrateWsTestnet
        ? {
            substrate: PUBLIC_RPC.testnet.substrateWs,
            substrateHttp: PUBLIC_RPC.testnet.substrateHttp,
            evm: PUBLIC_RPC.testnet.evmHttp,
          }
        : null,
    },
  };
}

export const ENDPOINTS = getEndpoints();
