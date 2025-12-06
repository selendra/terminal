/**
 * Connection Manager
 * Handles SDK initialization and connection with fallback logic
 */

import { NETWORKS, SELENDRA_CONSTANTS } from "./constants";
import { checkRpcAvailability } from "./rpc-utils";
import type {
  RpcEndpoints,
  NetworkType,
  SelendraSDKType,
  BlockInfo,
  ChainInfo,
  NetworkStats,
  ConnectionSource,
} from "./types";

/**
 * Result of a connection attempt
 */
export interface ConnectionResult {
  success: boolean;
  substrateSDK: SelendraSDKType | null;
  evmSDK: SelendraSDKType | null;
  substrateChainInfo: ChainInfo | null;
  evmChainInfo: ChainInfo | null;
  latestSubstrateBlock: BlockInfo | null;
  latestEvmBlock: BlockInfo | null;
  networkStats: NetworkStats | null;
}

/**
 * Try to connect to a specific set of RPC endpoints
 * @param endpoints The RPC endpoints to connect to
 * @param source The connection source type (local or public)
 * @param currentNetwork The current network (mainnet or testnet)
 * @returns Promise that resolves to connection result
 */
export async function tryConnectToEndpoints(
  endpoints: RpcEndpoints,
  source: ConnectionSource,
  currentNetwork: NetworkType
): Promise<ConnectionResult> {
  const network = NETWORKS[currentNetwork];
  const result: ConnectionResult = {
    success: false,
    substrateSDK: null,
    evmSDK: null,
    substrateChainInfo: null,
    evmChainInfo: null,
    latestSubstrateBlock: null,
    latestEvmBlock: null,
    networkStats: null,
  };

  try {
    // First check if EVM RPC is available
    const evmAvailable = await checkRpcAvailability(endpoints.evm);
    if (!evmAvailable) {
      console.log(
        `[ConnectionManager] ${source} EVM RPC not available: ${endpoints.evm}`
      );
      return result;
    }

    console.log(
      `[ConnectionManager] Connecting to ${source} RPC: ${endpoints.evm}`
    );

    // Import SDK
    const { SelendraSDK, ChainType } = await import("@selendrajs/sdk");

    // Connect to EVM first since we verified it's available
    const evSdk = new SelendraSDK({
      endpoint: endpoints.evm,
      chainType: ChainType.EVM,
    });

    await evSdk.connect();
    result.evmSDK = evSdk;

    // Get EVM chain info
    const provider = evSdk.getEvmProvider();
    if (provider) {
      const netInfo = await provider.getNetwork();
      const chainId = Number(netInfo.chainId);

      // Verify chain ID matches expected network
      if (chainId !== network.chainId) {
        console.warn(
          `[ConnectionManager] Chain ID mismatch: expected ${network.chainId}, got ${chainId}`
        );
      }

      result.evmChainInfo = {
        name: `Selendra EVM (${currentNetwork})`,
        version: "1.0.0",
        chainId,
      };

      // Get latest EVM block
      const evmBlock = await evSdk.getCurrentBlock();
      result.latestEvmBlock = evmBlock;
    }

    // Try Substrate connection
    try {
      const subSdk = new SelendraSDK({
        endpoint: endpoints.substrate,
        chainType: ChainType.Substrate,
        network: currentNetwork === "mainnet" ? "selendra" : "selendra-testnet",
      });

      await subSdk.connect();
      result.substrateSDK = subSdk;

      const api = subSdk.getApi();
      if (api) {
        const [chain, version] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.version(),
        ]);
        result.substrateChainInfo = {
          name: chain.toString(),
          version: version.toString(),
          ss58Format: api.registry.chainSS58 || SELENDRA_CONSTANTS.SS58_PREFIX,
        };

        const block = await subSdk.getCurrentBlock();
        result.latestSubstrateBlock = block;

        // Get validator count from chain state
        try {
          const validators = await api.query.session.validators();
          const validatorCount = Array.isArray(validators)
            ? validators.length
            : 4;

          result.networkStats = {
            totalTransactions: 0, // Will be updated via indexer
            averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
            tps: 0, // Will be calculated from real data
            validators: validatorCount,
          };
        } catch {
          result.networkStats = {
            totalTransactions: 0,
            averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
            tps: 0,
            validators: 4, // Default Selendra validators
          };
        }
      }
    } catch (subError) {
      console.warn(
        `[ConnectionManager] Substrate connection failed, EVM-only mode:`,
        subError
      );
      // EVM connected but Substrate failed - still usable
      result.substrateChainInfo = {
        name: "Selendra",
        version: "unknown",
        ss58Format: SELENDRA_CONSTANTS.SS58_PREFIX,
      };
      result.networkStats = {
        totalTransactions: 0,
        averageBlockTime: SELENDRA_CONSTANTS.BLOCK_TIME_MS / 1000,
        tps: 0,
        validators: 4,
      };
    }

    // Success - mark connection as successful
    result.success = true;
    console.log(`[ConnectionManager] Successfully connected to ${source} RPC`);
    return result;
  } catch (err) {
    console.error(
      `[ConnectionManager] Failed to connect to ${source} RPC:`,
      err
    );
    return result;
  }
}

/**
 * Connect with hybrid fallback: Local Node → Public RPC
 * Tries local Docker node first, falls back to public RPC if unavailable
 * @param networkEndpoints The network endpoints configuration
 * @param currentNetwork The current network
 * @returns Promise that resolves to connection result
 */
export async function connectWithFallback(
  networkEndpoints: {
    primary: RpcEndpoints;
    fallback: RpcEndpoints | null;
  },
  currentNetwork: NetworkType
): Promise<ConnectionResult> {
  // Try primary endpoints first (local Docker node if configured)
  console.log(`[ConnectionManager] Attempting primary connection...`);
  const primaryResult = await tryConnectToEndpoints(
    networkEndpoints.primary,
    networkEndpoints.fallback ? "local" : "public",
    currentNetwork
  );

  if (primaryResult.success) {
    return primaryResult;
  }

  // If primary failed and we have fallback (public RPC), try that
  if (networkEndpoints.fallback) {
    console.log(
      `[ConnectionManager] Primary failed, trying public RPC fallback...`
    );
    const fallbackResult = await tryConnectToEndpoints(
      networkEndpoints.fallback,
      "public",
      currentNetwork
    );

    if (fallbackResult.success) {
      return fallbackResult;
    }
  }

  // All connection attempts failed
  return primaryResult;
}
