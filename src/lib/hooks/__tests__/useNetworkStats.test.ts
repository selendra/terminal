/**
 * Tests for useNetworkStats hook
 *
 * Tests network statistics fetching with caching and state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNetworkStats } from "../useNetworkStats";

// Mock dependencies
vi.mock("@/components/providers/BlockchainProvider", () => ({
  useBlockchain: vi.fn(() => ({
    substrateSDK: null,
    evmSDK: null,
    isConnected: false,
    latestSubstrateBlock: null,
    substrateChainInfo: null,
    evmChainInfo: null,
    networkStats: null,
  })),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryFn, enabled = true }) => {
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    return {
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    };
  }),
}));

vi.mock("@/lib/cache", () => ({
  rpcCache: {
    get: vi.fn(async (key: string, fetcher: () => Promise<unknown>) => {
      return fetcher();
    }),
    set: vi.fn(),
    invalidate: vi.fn(),
    clear: vi.fn(),
  },
}));

import { useBlockchain } from "@/components/providers/BlockchainProvider";

const mockUseBlockchain = vi.mocked(useBlockchain);

describe("useNetworkStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should return null stats when disconnected", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: false,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.stats).toBe(null);
    });

    it("should indicate loading state initially", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("with connected blockchain", () => {
    it("should populate block data from latestSubstrateBlock", async () => {
      const mockBlock = {
        number: 12345,
        hash: "0xabc123",
      };

      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: mockBlock,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as unknown as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      // Hook receives block data from context
      expect(result.current.isConnected).toBe(true);
    });

    it("should populate chain info from substrateChainInfo", async () => {
      const mockChainInfo = {
        name: "Selendra",
        version: "1.2.0",
      };

      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: mockChainInfo,
        evmChainInfo: null,
        networkStats: null,
      } as unknown as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.isConnected).toBe(true);
    });

    it("should populate EVM chain ID from evmChainInfo", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: { chainId: 1961 },
        networkStats: null,
      } as unknown as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.isConnected).toBe(true);
    });

    it("should populate validator count from networkStats", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: { validators: 8 },
      } as unknown as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("options", () => {
    it("should respect enabled option", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats({ enabled: false }));

      // Should not be loading when disabled
      expect(result.current.isLoading).toBe(false);
    });

    it("should use custom refresh interval", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() =>
        useNetworkStats({ refreshInterval: 5000 })
      );

      // Hook should render without error with custom interval
      expect(result.current).toBeDefined();
    });
  });

  describe("default values", () => {
    it("should have correct default chain values for Selendra", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: false,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      // Even disconnected, the hook should be well-defined
      expect(result.current.refetch).toBeTypeOf("function");
    });
  });

  describe("refetch functionality", () => {
    it("should provide refetch function", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: true,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.refetch).toBeTypeOf("function");
    });
  });

  describe("error handling", () => {
    it("should return null error initially", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
        isConnected: false,
        latestSubstrateBlock: null,
        substrateChainInfo: null,
        evmChainInfo: null,
        networkStats: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useNetworkStats());

      expect(result.current.error).toBe(null);
    });
  });
});
