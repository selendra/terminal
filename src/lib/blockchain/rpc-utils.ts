/**
 * RPC utility functions
 */

/**
 * Check if RPC is available before attempting SDK connection
 * @param endpoint The RPC endpoint URL to check
 * @returns Promise that resolves to true if RPC is available
 */
export async function checkRpcAvailability(endpoint: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(endpoint, {
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

    if (!response.ok) return false;

    // Verify we got a valid response
    const data = await response.json();
    return data.result !== undefined;
  } catch {
    return false;
  }
}
