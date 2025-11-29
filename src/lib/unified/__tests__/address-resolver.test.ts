import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  substrateToEvm,
  evmToSubstrate,
  resolveAddress,
  clearAddressCache,
  getAlternateAddress,
  isSameAccount,
} from "../address-resolver";

// Mock the polkadot imports
vi.mock("@polkadot/util-crypto", () => ({
  decodeAddress: vi.fn((address: string) => {
    // Return a mock 32-byte public key based on the address
    if (address === "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") {
      return new Uint8Array(32).fill(1);
    }
    if (address === "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty") {
      return new Uint8Array(32).fill(2);
    }
    throw new Error("Invalid address");
  }),
  encodeAddress: vi.fn((publicKey: Uint8Array, ss58Format: number) => {
    // Return mock SS58 address
    const sum = Array.from(publicKey).reduce((a, b) => a + b, 0);
    return `5MockAddress${sum}${ss58Format}`;
  }),
  blake2AsU8a: vi.fn((data: Uint8Array) => {
    // Return mock hash
    return new Uint8Array(32).fill(3);
  }),
}));

vi.mock("@polkadot/util", () => ({
  u8aToHex: vi.fn((bytes: Uint8Array) => {
    // Convert last 20 bytes to hex
    const last20 = bytes.slice(-20);
    let hex = "0x";
    for (const byte of last20) {
      hex += byte.toString(16).padStart(2, "0");
    }
    return hex;
  }),
  hexToU8a: vi.fn((hex: string) => {
    // Convert hex to Uint8Array
    const bytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) {
      bytes[i] = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
    }
    return bytes;
  }),
  u8aConcat: vi.fn((...arrays: Uint8Array[]) => {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }),
}));

describe("Address Resolver", () => {
  beforeEach(() => {
    clearAddressCache();
    vi.clearAllMocks();
  });

  describe("substrateToEvm", () => {
    it("should convert a valid Substrate address to EVM address", async () => {
      const result = await substrateToEvm(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should return null for invalid Substrate address", async () => {
      const result = await substrateToEvm("invalid-address");

      expect(result).toBeNull();
    });
  });

  describe("evmToSubstrate", () => {
    it("should convert a valid EVM address to Substrate address", async () => {
      const result = await evmToSubstrate(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21"
      );

      expect(result).toBeDefined();
      expect(result).toMatch(/^5/); // Selendra SS58 addresses start with 5
    });

    it("should query chain state if API is provided", async () => {
      const mockApi = {
        query: {
          unifiedAccounts: {
            evmToSubstrate: vi.fn().mockResolvedValue({
              isEmpty: false,
              toU8a: () => new Uint8Array(32).fill(4),
            }),
          },
        },
      };

      const result = await evmToSubstrate(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21",
        mockApi
      );

      expect(result).toBeDefined();
      expect(mockApi.query.unifiedAccounts.evmToSubstrate).toHaveBeenCalled();
    });
  });

  describe("resolveAddress", () => {
    it("should resolve an EVM address to unified format", async () => {
      const result = await resolveAddress(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21"
      );

      expect(result).toBeDefined();
      expect(result?.evm).toBe("0x742d35cc6634c0532925a3b844bc9e7595f1eb21");
      expect(result?.substrate).toBeDefined();
      expect(result?.isVerified).toBe(false);
      expect(result?.source).toBe("derived");
    });

    it("should resolve a Substrate address to unified format", async () => {
      const result = await resolveAddress(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );

      expect(result).toBeDefined();
      expect(result?.substrate).toBe(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );
      expect(result?.evm).toMatch(/^0x/);
      expect(result?.source).toBe("derived");
    });

    it("should return null for invalid address", async () => {
      const result = await resolveAddress("invalid-address");

      expect(result).toBeNull();
    });

    it("should use cache for repeated lookups", async () => {
      const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21";

      const result1 = await resolveAddress(address);
      const result2 = await resolveAddress(address);

      expect(result2?.source).toBe("cache");
    });
  });

  describe("getAlternateAddress", () => {
    it("should return EVM address for Substrate input", async () => {
      const result = await getAlternateAddress(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );

      expect(result).toMatch(/^0x/);
    });

    it("should return Substrate address for EVM input", async () => {
      const result = await getAlternateAddress(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21"
      );

      expect(result).toMatch(/^5/);
    });

    it("should return null for invalid address", async () => {
      const result = await getAlternateAddress("invalid");

      expect(result).toBeNull();
    });
  });

  describe("isSameAccount", () => {
    it("should return true for same EVM addresses", async () => {
      const result = await isSameAccount(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21",
        "0x742D35CC6634C0532925A3B844BC9E7595F1EB21"
      );

      expect(result).toBe(true);
    });

    it("should return false for different EVM addresses", async () => {
      const result = await isSameAccount(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21",
        "0x0000000000000000000000000000000000000000"
      );

      expect(result).toBe(false);
    });

    it("should return true for same Substrate addresses", async () => {
      const result = await isSameAccount(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );

      expect(result).toBe(true);
    });

    it("should return false for different Substrate addresses", async () => {
      const result = await isSameAccount(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
      );

      expect(result).toBe(false);
    });
  });

  describe("clearAddressCache", () => {
    it("should clear the cache", async () => {
      const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21";

      await resolveAddress(address);
      clearAddressCache();
      const result = await resolveAddress(address);

      expect(result?.source).toBe("derived");
    });
  });
});
