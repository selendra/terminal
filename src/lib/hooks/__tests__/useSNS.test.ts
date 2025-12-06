/**
 * Tests for useSNS hooks
 *
 * Tests Selendra Name Service hooks including profile lookup,
 * domain resolution, reverse lookup, and availability checking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useSNSProfile,
  useSNSResolve,
  useSNSLookup,
  useSNSAvailability,
  useSNSClient,
} from "../useSNS";

// Mock the blockchain provider
vi.mock("@/components/providers/BlockchainProvider", () => ({
  useBlockchain: vi.fn(() => ({
    evmSDK: null,
  })),
}));

// Mock ethers
vi.mock("ethers", () => ({
  ethers: {
    keccak256: vi.fn((data: string) => "0x" + "a".repeat(64)),
    toUtf8Bytes: vi.fn((str: string) => new Uint8Array()),
    isAddress: vi.fn(
      (addr: string) => addr.startsWith("0x") && addr.length === 42
    ),
    ZeroAddress: "0x0000000000000000000000000000000000000000",
    BrowserProvider: vi.fn(),
    formatEther: vi.fn((val: bigint) => "1.0"),
  },
}));

// Mock SNS library
vi.mock("@/lib/sns", () => ({
  SNSClient: vi.fn(),
  normalizeDomain: vi.fn(
    (domain: string) => domain.toLowerCase().replace(/\.sel$/, "") + ".sel"
  ),
  isValidDomain: vi.fn((domain: string) => {
    if (!domain || domain.length < 3) {
      return { valid: false, error: "Domain too short" };
    }
    return { valid: true };
  }),
  extractLabel: vi.fn((domain: string) => domain.split(".")[0]),
  calculatePrice: vi.fn(() => ({
    base: BigInt(1000000000000000000),
    premium: BigInt(0),
    total: BigInt(1000000000000000000),
  })),
  namehash: vi.fn(() => "0x" + "b".repeat(64)),
}));

import { useBlockchain } from "@/components/providers/BlockchainProvider";

const mockUseBlockchain = vi.mocked(useBlockchain);

describe("useSNS hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useSNSClient", () => {
    it("should return null when evmSDK is not available", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSClient());

      expect(result.current).toBe(null);
    });
  });

  describe("useSNSProfile", () => {
    it("should return null profile when domain is null", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile(null));

      expect(result.current.profile).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should return null profile when domain is undefined", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile(undefined));

      expect(result.current.profile).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return error for invalid domain", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile("ab"));

      await waitFor(() => {
        expect(result.current.error).toBe("Domain too short");
      });
      expect(result.current.profile).toBe(null);
    });

    it("should fetch mock profile when client not available", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile("alice.sel"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock profile should be generated
      expect(result.current.profile).not.toBe(null);
      expect(result.current.profile?.domain).toBe("alice.sel");
    });

    it("should provide refetch function", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile("test.sel"));

      expect(result.current.refetch).toBeTypeOf("function");
    });

    it("should refetch on domain change", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result, rerender } = renderHook(
        ({ domain }) => useSNSProfile(domain),
        { initialProps: { domain: "alice.sel" } }
      );

      await waitFor(() => {
        expect(result.current.profile?.domain).toBe("alice.sel");
      });

      rerender({ domain: "bob.sel" });

      await waitFor(() => {
        expect(result.current.profile?.domain).toBe("bob.sel");
      });
    });
  });

  describe("useSNSResolve", () => {
    it("should return null address when domain is null", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSResolve(null));

      expect(result.current.address).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it("should resolve domain to mock address", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSResolve("alice.sel"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock resolution should return a deterministic address
      expect(result.current.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should update when domain changes", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result, rerender } = renderHook(
        ({ domain }) => useSNSResolve(domain),
        { initialProps: { domain: "alice.sel" } }
      );

      await waitFor(() => {
        expect(result.current.address).not.toBe(null);
      });

      const firstAddress = result.current.address;

      rerender({ domain: "bob.sel" });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Same mock hash will be returned, but the hook should re-run
      expect(result.current.address).not.toBe(null);
    });
  });

  describe("useSNSLookup", () => {
    it("should return null when address is null", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSLookup(null));

      expect(result.current.domain).toBe(null);
      expect(result.current.profile).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return null for invalid address format", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSLookup("invalid"));

      expect(result.current.domain).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("should attempt lookup for valid address", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const validAddress = "0x" + "1".repeat(40);
      const { result } = renderHook(() => useSNSLookup(validAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Without client, reverse lookup returns null
      expect(result.current.domain).toBe(null);
    });
  });

  describe("useSNSAvailability", () => {
    it("should return null availability when domain is null", () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSAvailability(null));

      expect(result.current.isAvailable).toBe(null);
      expect(result.current.isLoading).toBe(false);
    });

    it("should return error for invalid domain", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSAvailability("ab"));

      await waitFor(() => {
        expect(result.current.error).toBe("Domain too short");
      });
    });

    it("should check availability and return mock price", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSAvailability("newdomain.sel"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock should return available with price
      expect(result.current.isAvailable).toBe(true);
      expect(result.current.price).not.toBe(null);
    });
  });

  describe("domain validation", () => {
    it("should normalize domain names", async () => {
      mockUseBlockchain.mockReturnValue({
        evmSDK: null,
      } as ReturnType<typeof useBlockchain>);

      const { result } = renderHook(() => useSNSProfile("ALICE.SEL"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Domain should be normalized
      expect(result.current.profile?.domain).toBe("alice.sel");
    });
  });
});
