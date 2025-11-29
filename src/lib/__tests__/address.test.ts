import { describe, it, expect, vi } from "vitest";
import {
  isEvmAddress,
  isSubstrateAddress,
  detectAddressType,
  formatAddress,
} from "../address";

describe("Address Utilities", () => {
  describe("isEvmAddress", () => {
    it("should return true for valid EVM addresses", () => {
      expect(isEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
        true
      );
      expect(isEvmAddress("0x0000000000000000000000000000000000000000")).toBe(
        true
      );
      expect(isEvmAddress("0xffffffffffffffffffffffffffffffffffffffff")).toBe(
        true
      );
    });

    it("should return false for invalid EVM addresses", () => {
      expect(isEvmAddress("")).toBe(false);
      expect(isEvmAddress("0x")).toBe(false);
      expect(isEvmAddress("0x123")).toBe(false);
      expect(isEvmAddress("742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
        false
      ); // Missing 0x prefix
      expect(
        isEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21extra")
      ).toBe(false); // Too long
      expect(isEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eg21")).toBe(
        false
      ); // Invalid character 'g'
    });

    it("should be case insensitive for EVM addresses", () => {
      expect(isEvmAddress("0x742d35cc6634c0532925a3b844bc9e7595f1eb21")).toBe(
        true
      );
      expect(isEvmAddress("0x742D35CC6634C0532925A3B844BC9E7595F1EB21")).toBe(
        true
      );
    });
  });

  describe("isSubstrateAddress", () => {
    it("should return true for valid Substrate addresses", () => {
      // Selendra uses SS58 prefix 42, addresses typically start with '5'
      expect(
        isSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
      ).toBe(true);
      expect(
        isSubstrateAddress("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty")
      ).toBe(true);
    });

    it("should return false for invalid Substrate addresses", () => {
      expect(isSubstrateAddress("")).toBe(false);
      expect(isSubstrateAddress("123")).toBe(false);
      expect(
        isSubstrateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")
      ).toBe(false); // EVM address
    });

    it("should return false for addresses with invalid characters", () => {
      // O, I, l are not valid in base58
      expect(
        isSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKut0Y")
      ).toBe(false);
      expect(
        isSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutOY")
      ).toBe(false);
      expect(
        isSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutIY")
      ).toBe(false);
      expect(
        isSubstrateAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutlY")
      ).toBe(false);
    });
  });

  describe("detectAddressType", () => {
    it("should detect EVM addresses", () => {
      expect(
        detectAddressType("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")
      ).toBe("evm");
    });

    it("should detect Substrate addresses", () => {
      expect(
        detectAddressType("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
      ).toBe("substrate");
    });

    it("should return unknown for invalid addresses", () => {
      expect(detectAddressType("")).toBe("unknown");
      expect(detectAddressType("invalid")).toBe("unknown");
      expect(detectAddressType("0x123")).toBe("unknown");
    });

    it("should handle null and undefined", () => {
      expect(detectAddressType(null as unknown as string)).toBe("unknown");
      expect(detectAddressType(undefined as unknown as string)).toBe("unknown");
    });

    it("should trim whitespace", () => {
      expect(
        detectAddressType("  0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21  ")
      ).toBe("evm");
    });
  });

  describe("formatAddress", () => {
    it("should truncate long addresses", () => {
      expect(formatAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
        "0x742d...Eb21"
      );
      expect(
        formatAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
      ).toBe("5Grwva...utQY");
    });

    it("should not truncate short addresses", () => {
      expect(formatAddress("0x1234")).toBe("0x1234");
      expect(formatAddress("abc")).toBe("abc");
    });

    it("should handle custom truncation lengths", () => {
      expect(
        formatAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21", 8, 6)
      ).toBe("0x742d35...f1Eb21");
      expect(
        formatAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21", 4, 2)
      ).toBe("0x74...21");
    });

    it("should handle empty address", () => {
      expect(formatAddress("")).toBe("");
    });
  });
});
