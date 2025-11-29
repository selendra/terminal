import { NextResponse } from "next/server";

// Version from package.json
const VERSION = "1.1.0-beta.2";

// Default RPC endpoints (can be overridden by environment variables)
const SUBSTRATE_RPC_WS =
  process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS || "wss://rpc.selendra.org";
const EVM_RPC_HTTP =
  process.env.NEXT_PUBLIC_EVM_RPC_HTTP || "https://rpc.selendra.org";
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_INDEXER_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  "";

// Health check timeout in milliseconds
const HEALTH_CHECK_TIMEOUT = 5000;

type ServiceStatus = "up" | "down" | "not_configured";
type OverallStatus = "ok" | "degraded" | "down";

interface SubstrateHealth {
  status: ServiceStatus;
  latency?: number;
  error?: string;
}

interface EvmHealth {
  status: ServiceStatus;
  latency?: number;
  chainId?: number;
  error?: string;
}

interface IndexerHealth {
  status: ServiceStatus;
  latency?: number;
  blockHeight?: number;
  chainHeight?: number;
  lag?: number;
  error?: string;
}

interface HealthResponse {
  status: OverallStatus;
  timestamp: string;
  version: string;
  services: {
    substrate: SubstrateHealth;
    evm: EvmHealth;
    indexer: IndexerHealth;
  };
}

/**
 * Check Substrate RPC connectivity via WebSocket
 * Attempts to connect and get basic chain info
 */
async function checkSubstrateHealth(): Promise<SubstrateHealth> {
  const startTime = Date.now();

  try {
    // Convert WebSocket URL to HTTP for health check
    // wss://rpc.selendra.org -> https://rpc.selendra.org
    // ws://localhost:9933 -> http://localhost:9933
    const httpUrl = SUBSTRATE_RPC_WS.replace("wss://", "https://").replace(
      "ws://",
      "http://"
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT
    );

    // Use system_health RPC method to check Substrate node
    const response = await fetch(httpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "system_health",
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: data.error.message || "RPC error",
      };
    }

    return {
      status: "up",
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Check EVM RPC connectivity
 * Attempts to call eth_chainId to verify EVM endpoint
 */
async function checkEvmHealth(): Promise<EvmHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT
    );

    const response = await fetch(EVM_RPC_HTTP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: data.error.message || "RPC error",
      };
    }

    // Validate chain ID is present
    if (!data.result) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: "No chain ID returned",
      };
    }

    // Parse chain ID from hex
    const chainId = parseInt(data.result, 16);

    return {
      status: "up",
      latency: Date.now() - startTime,
      chainId,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Check Indexer health (if configured)
 * Queries GraphQL metadata for sync status
 */
async function checkIndexerHealth(): Promise<IndexerHealth> {
  if (!GRAPHQL_ENDPOINT) {
    return {
      status: "not_configured",
    };
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT
    );

    // Query SubQuery metadata for sync status
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            _metadata {
              lastProcessedHeight
              targetHeight
            }
          }
        `,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.errors && data.errors.length > 0) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: data.errors[0].message || "GraphQL error",
      };
    }

    const metadata = data.data?._metadata;
    if (!metadata) {
      return {
        status: "down",
        latency: Date.now() - startTime,
        error: "No metadata returned",
      };
    }

    const blockHeight = metadata.lastProcessedHeight;
    const chainHeight = metadata.targetHeight;
    const lag = chainHeight - blockHeight;

    return {
      status: "up",
      latency: Date.now() - startTime,
      blockHeight,
      chainHeight,
      lag,
    };
  } catch (error) {
    return {
      status: "down",
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Determine overall health status based on service health
 */
function determineOverallStatus(
  substrate: SubstrateHealth,
  evm: EvmHealth,
  indexer: IndexerHealth
): OverallStatus {
  // If both core services are down, system is down
  if (substrate.status === "down" && evm.status === "down") {
    return "down";
  }

  // If any core service is down, or indexer is down (when configured), system is degraded
  if (
    substrate.status === "down" ||
    evm.status === "down" ||
    (indexer.status === "down" && GRAPHQL_ENDPOINT)
  ) {
    return "degraded";
  }

  return "ok";
}

/**
 * GET /api/health
 * Health check endpoint for production monitoring
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  // Run all health checks in parallel
  const [substrate, evm, indexer] = await Promise.all([
    checkSubstrateHealth(),
    checkEvmHealth(),
    checkIndexerHealth(),
  ]);

  const status = determineOverallStatus(substrate, evm, indexer);

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: VERSION,
    services: {
      substrate,
      evm,
      indexer,
    },
  };

  // Return appropriate HTTP status code
  const httpStatus = status === "ok" ? 200 : status === "degraded" ? 503 : 503;

  return NextResponse.json(response, { status: httpStatus });
}

// Also support HEAD requests for simple uptime checks
export async function HEAD(): Promise<NextResponse> {
  const [substrate, evm, indexer] = await Promise.all([
    checkSubstrateHealth(),
    checkEvmHealth(),
    checkIndexerHealth(),
  ]);

  const status = determineOverallStatus(substrate, evm, indexer);
  const httpStatus = status === "ok" ? 200 : 503;

  return new NextResponse(null, { status: httpStatus });
}
