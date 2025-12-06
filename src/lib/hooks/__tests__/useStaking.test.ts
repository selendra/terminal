/**
 * Tests for useStaking hooks
 *
 * Tests staking-related hooks including era info, staking stats,
 * validator selection, and staking operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useStakingClient,
  useEraInfo,
  useStakingStats,
  useValidators,
} from "../useStaking";

// Mock dependencies
vi.mock("@/components/providers/BlockchainProvider", () => ({
  useBlockchain: vi.fn(() => ({
    substrateSDK: null,
    evmSDK: null,
  })),
}));

vi.mock("@/components/providers/WalletProvider", () => ({
  useWallet: vi.fn(() => ({
    isConnected: false,
    address: null,
    substrateAddress: null,
    evmAddress: null,
  })),
}));

vi.mock("ethers", () => ({
  ethers: {
    formatEther: vi.fn((val: bigint) => (Number(val) / 1e18).toString()),
    parseEther: vi.fn((val: string) => BigInt(Number(val) * 1e18)),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock staking library
vi.mock("@/lib/staking", () => ({
  SubstrateStakingClient: vi.fn(),
  EvmStakingClient: vi.fn(),
  NominationPoolsClient: vi.fn(),
  formatStakingAmount: vi.fn(
    (val: bigint) => (Number(val) / 1e18).toFixed(4) + " SEL"
  ),
  parseStakingAmount: vi.fn((val: string) => BigInt(Number(val) * 1e18)),
  createSubstrateStakingClient: vi.fn(() => null),
  createEvmStakingClient: vi.fn(() => null),
  createNominationPoolsClient: vi.fn(() => null),
}));

import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

const mockUseBlockchain = vi.mocked(useBlockchain);
const mockUseWallet = vi.mocked(useWallet);

describe("useStaking hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useStakingClient", () => {
    it("should return null clients when SDKs not available", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useStakingClient());

      expect(result.current.substrate).toBe(null);
      expect(result.current.evm).toBe(null);
      expect(result.current.pools).toBe(null);
    });

    it("should memoize clients", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result, rerender } = renderHook(() => useStakingClient());
      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });
  });

  describe("useEraInfo", () => {
    it("should return mock era info when client not available", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock data should be populated
      expect(result.current.eraInfo).not.toBe(null);
      expect(result.current.eraInfo?.currentEra).toBe(1234);
      expect(result.current.eraInfo?.sessionsPerEra).toBe(6);
    });

    it("should provide refresh function", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      expect(result.current.refresh).toBeTypeOf("function");
    });

    it("should have null error initially", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);
    });

    it("should complete loading quickly with mock data", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      // Should quickly complete with mock data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("useStakingStats", () => {
    it("should return mock staking stats when client not available", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useStakingStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock stats should be populated
      expect(result.current.stats).not.toBe(null);
      expect(result.current.stats?.totalStaked).toBeDefined();
      expect(result.current.stats?.stakingRate).toBeDefined();
    });

    it("should provide refresh function", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useStakingStats());

      expect(result.current.refresh).toBeTypeOf("function");
    });
  });

  describe("useValidators", () => {
    it("should return empty validators list initially", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useValidators());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have some validators (mock data)
      expect(Array.isArray(result.current.validators)).toBe(true);
    });

    it("should provide refresh function", () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useValidators());

      expect(result.current.refresh).toBeTypeOf("function");
    });

    it("should handle only active filter", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useValidators(true));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All returned validators should be active when filtered
      expect(
        result.current.validators.every(
          (v: { isActive?: boolean }) => v.isActive !== false
        )
      ).toBe(true);
    });
  });

  describe("era info calculations", () => {
    it("should include blocks remaining in era info", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.eraInfo).not.toBe(null);
      });

      expect(result.current.eraInfo?.blocksRemaining).toBeTypeOf("number");
      expect(result.current.eraInfo?.estimatedTimeRemaining).toBeTypeOf(
        "number"
      );
    });

    it("should include era progress percentage", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.eraInfo).not.toBe(null);
      });

      expect(result.current.eraInfo?.eraProgress).toBeGreaterThanOrEqual(0);
      expect(result.current.eraInfo?.eraProgress).toBeLessThanOrEqual(100);
    });
  });

  describe("wallet integration", () => {
    it("should work without wallet connected", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      mockUseWallet.mockReturnValue({
        isConnected: false,
        address: null,
        substrateAddress: null,
        evmAddress: null,
      } as unknown as ReturnType<typeof useWallet>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still return data without wallet
      expect(result.current.eraInfo).not.toBe(null);
    });
  });

  describe("error states", () => {
    it("should have null error on successful load", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useEraInfo());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe("staking stats values", () => {
    it("should have total staked amount", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useStakingStats());

      await waitFor(() => {
        expect(result.current.stats).not.toBe(null);
      });

      expect(result.current.stats?.totalStaked).toBeDefined();
    });

    it("should have minimum stake amount", async () => {
      mockUseBlockchain.mockReturnValue({
        substrateSDK: null,
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useStakingStats());

      await waitFor(() => {
        expect(result.current.stats).not.toBe(null);
      });

      expect(result.current.stats?.minNominatorBond).toBeDefined();
    });
  });
});
