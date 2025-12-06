import { describe, it, expect } from "vitest";
import {
  cn,
  formatNumber,
  formatLargeNumber,
  truncateHash,
  formatBalance,
  formatDistanceToNow,
  formatDate,
  isEvmAddress,
  isSubstrateAddress,
  isTxHash,
  detectSearchType,
  sleep,
  retryWithBackoff,
  weiToSel,
  planckToSel,
  toBigInt,
} from "../utils";

describe("cn - Class Name Merge", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", null, "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should handle Tailwind conflicts", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("bg-white", "bg-black")).toBe("bg-black");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
    expect(cn("base", !isActive && "inactive")).toBe("base");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn("base", ["foo", "bar"])).toBe("base foo bar");
  });

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});

describe("formatNumber", () => {
  it("should format numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(1234567890)).toBe("1,234,567,890");
  });

  it("should handle small numbers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1)).toBe("1");
    expect(formatNumber(999)).toBe("999");
  });

  it("should handle string input", () => {
    expect(formatNumber("1000")).toBe("1,000");
    expect(formatNumber("1234567")).toBe("1,234,567");
  });
});

describe("formatLargeNumber", () => {
  it("should format billions", () => {
    expect(formatLargeNumber(1000000000)).toBe("1.00B");
    expect(formatLargeNumber(2500000000)).toBe("2.50B");
    expect(formatLargeNumber(10000000000)).toBe("10.00B");
  });

  it("should format millions", () => {
    expect(formatLargeNumber(1000000)).toBe("1.00M");
    expect(formatLargeNumber(24500000)).toBe("24.50M");
    expect(formatLargeNumber(999000000)).toBe("999.00M");
  });

  it("should format thousands", () => {
    expect(formatLargeNumber(1000)).toBe("1.00K");
    expect(formatLargeNumber(57500)).toBe("57.50K");
    expect(formatLargeNumber(999000)).toBe("999.00K");
  });

  it("should not abbreviate small numbers", () => {
    expect(formatLargeNumber(500)).toBe("500");
    expect(formatLargeNumber(0)).toBe("0");
    expect(formatLargeNumber(999)).toBe("999");
  });
});

describe("truncateHash", () => {
  it("should truncate long hashes", () => {
    const hash = "0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21";
    expect(truncateHash(hash)).toBe("0x742d...Eb21");
    expect(truncateHash(hash, 8, 6)).toBe("0x742d35...f1Eb21");
    expect(truncateHash(hash, 4, 2)).toBe("0x74...21");
  });

  it("should not truncate short strings", () => {
    expect(truncateHash("0x1234")).toBe("0x1234");
    expect(truncateHash("abc")).toBe("abc");
  });

  it("should handle empty string", () => {
    expect(truncateHash("")).toBe("");
  });

  it("should handle Substrate addresses", () => {
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    expect(truncateHash(address)).toBe("5Grwva...utQY");
  });
});

describe("formatBalance", () => {
  it("should format wei to SEL correctly", () => {
    expect(formatBalance(BigInt("1000000000000000000"), 18, 4)).toBe("1.0000");
    expect(formatBalance(BigInt("1500000000000000000"), 18, 4)).toBe("1.5000");
    expect(formatBalance(BigInt("123456789012345678"), 18, 4)).toBe("0.1234");
  });

  it("should handle different decimal places", () => {
    expect(formatBalance(BigInt("1000000"), 6, 2)).toBe("1.00"); // USDC format
    expect(formatBalance(BigInt("100000000"), 8, 4)).toBe("1.0000"); // BTC format
  });

  it("should handle string input", () => {
    expect(formatBalance("1000000000000000000", 18, 4)).toBe("1.0000");
  });

  it("should handle zero", () => {
    expect(formatBalance(BigInt(0), 18, 4)).toBe("0.0000");
  });

  it("should handle large numbers", () => {
    expect(formatBalance(BigInt("1000000000000000000000000"), 18, 2)).toBe(
      "1000000.00"
    );
  });
});

describe("formatDistanceToNow", () => {
  it("should format just now correctly", () => {
    const now = Date.now();
    expect(formatDistanceToNow(now)).toBe("Just now");
    expect(formatDistanceToNow(now - 1000)).toBe("Just now");
  });

  it("should format seconds correctly", () => {
    const now = Date.now();
    expect(formatDistanceToNow(now - 5000)).toBe("5 secs ago");
    expect(formatDistanceToNow(now - 30000)).toBe("30 secs ago");
    expect(formatDistanceToNow(now - 59000)).toBe("59 secs ago");
  });

  it("should format minutes correctly", () => {
    const now = Date.now();
    expect(formatDistanceToNow(now - 60000)).toBe("1 min ago");
    expect(formatDistanceToNow(now - 120000)).toBe("2 mins ago");
    expect(formatDistanceToNow(now - 3540000)).toBe("59 mins ago");
  });

  it("should format hours correctly", () => {
    const now = Date.now();
    expect(formatDistanceToNow(now - 3600000)).toBe("1 hour ago");
    expect(formatDistanceToNow(now - 7200000)).toBe("2 hours ago");
    expect(formatDistanceToNow(now - 82800000)).toBe("23 hours ago");
  });

  it("should format days correctly", () => {
    const now = Date.now();
    expect(formatDistanceToNow(now - 86400000)).toBe("1 day ago");
    expect(formatDistanceToNow(now - 172800000)).toBe("2 days ago");
    expect(formatDistanceToNow(now - 518400000)).toBe("6 days ago");
  });

  it("should handle Date objects", () => {
    const date = new Date(Date.now() - 60000);
    expect(formatDistanceToNow(date)).toBe("1 min ago");
  });
});

describe("formatDate", () => {
  it("should format dates correctly", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const formatted = formatDate(date);
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
  });

  it("should handle string input", () => {
    const formatted = formatDate("2024-06-15T14:30:00Z");
    expect(formatted).toContain("Jun");
    expect(formatted).toContain("15");
    expect(formatted).toContain("2024");
  });

  it("should handle timestamp input", () => {
    const timestamp = 1705315800000; // Jan 15, 2024
    const formatted = formatDate(timestamp);
    expect(formatted).toContain("2024");
  });
});

describe("isEvmAddress", () => {
  it("should return true for valid EVM addresses", () => {
    expect(isEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
      true
    );
    expect(isEvmAddress("0x0000000000000000000000000000000000000000")).toBe(
      true
    );
    expect(isEvmAddress("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toBe(
      true
    );
  });

  it("should return false for invalid EVM addresses", () => {
    expect(isEvmAddress("")).toBe(false);
    expect(isEvmAddress("0x")).toBe(false);
    expect(isEvmAddress("0x123")).toBe(false);
    expect(isEvmAddress("742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
      false
    ); // Missing 0x
    expect(isEvmAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21X")).toBe(
      false
    ); // Too long
    expect(isEvmAddress("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")).toBe(
      false
    ); // Substrate address
  });

  it("should be case insensitive", () => {
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
    expect(isSubstrateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(
      false
    ); // EVM address
    expect(isSubstrateAddress("abc")).toBe(false);
  });
});

describe("isTxHash", () => {
  it("should return true for valid transaction hashes", () => {
    expect(
      isTxHash(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      )
    ).toBe(true);
    expect(
      isTxHash(
        "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
      )
    ).toBe(true);
  });

  it("should return false for invalid transaction hashes", () => {
    expect(isTxHash("")).toBe(false);
    expect(isTxHash("0x")).toBe(false);
    expect(isTxHash("0x1234")).toBe(false);
    expect(isTxHash("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")).toBe(false); // Address, not tx hash
    expect(
      isTxHash(
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      )
    ).toBe(false); // Missing 0x
  });
});

describe("detectSearchType", () => {
  it("should detect block numbers", () => {
    expect(detectSearchType("12345")).toBe("block");
    expect(detectSearchType("1")).toBe("block");
    expect(detectSearchType("999999999")).toBe("block");
  });

  it("should detect transaction hashes", () => {
    expect(
      detectSearchType(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      )
    ).toBe("transaction");
  });

  it("should detect EVM addresses", () => {
    expect(
      detectSearchType("0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21")
    ).toBe("evm_address");
  });

  it("should detect Substrate addresses", () => {
    expect(
      detectSearchType("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")
    ).toBe("substrate_address");
  });

  it("should return unknown for invalid queries", () => {
    expect(detectSearchType("")).toBe("unknown");
    expect(detectSearchType("random text")).toBe("unknown");
    expect(detectSearchType("0x123")).toBe("unknown");
  });

  it("should handle whitespace", () => {
    expect(detectSearchType("  12345  ")).toBe("block");
    expect(
      detectSearchType("  0x742d35Cc6634C0532925a3b844Bc9e7595f1Eb21  ")
    ).toBe("evm_address");
  });
});

describe("sleep", () => {
  it("should sleep for specified time", async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(95); // Allow some timing variance
    expect(elapsed).toBeLessThan(200);
  });

  it("should return a promise", () => {
    const result = sleep(10);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe("retryWithBackoff", () => {
  it("should return result on first success", async () => {
    const fn = async () => "success";
    const result = await retryWithBackoff(fn);
    expect(result).toBe("success");
  });

  it("should retry on failure and succeed eventually", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Temporary failure");
      }
      return "success";
    };

    const result = await retryWithBackoff(fn, 3, 10);
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should throw after max retries", async () => {
    const fn = async () => {
      throw new Error("Permanent failure");
    };

    await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow(
      "Permanent failure"
    );
  });
});

describe("weiToSel", () => {
  it("should convert wei to SEL", () => {
    expect(weiToSel(BigInt("1000000000000000000"))).toBe("1.000000");
    expect(weiToSel(BigInt("1500000000000000000"))).toBe("1.500000");
    expect(weiToSel(BigInt("100000000000000000"))).toBe("0.100000");
  });

  it("should handle string input", () => {
    expect(weiToSel("1000000000000000000")).toBe("1.000000");
  });
});

describe("planckToSel", () => {
  it("should convert planck to SEL", () => {
    expect(planckToSel(BigInt("1000000000000000000"))).toBe("1.000000");
    expect(planckToSel(BigInt("500000000000000000"))).toBe("0.500000");
  });

  it("should handle string input", () => {
    expect(planckToSel("1000000000000000000")).toBe("1.000000");
  });
});

describe("toBigInt", () => {
  it("should handle bigint input", () => {
    expect(toBigInt(BigInt(123))).toBe(BigInt(123));
  });

  it("should handle number input", () => {
    expect(toBigInt(123)).toBe(BigInt(123));
    expect(toBigInt(123.7)).toBe(BigInt(123)); // Should floor
  });

  it("should handle string input", () => {
    expect(toBigInt("123")).toBe(BigInt(123));
    expect(toBigInt("1000000000000000000")).toBe(BigInt("1000000000000000000"));
  });
});
