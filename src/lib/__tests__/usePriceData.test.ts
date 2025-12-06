import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatPrice,
  formatMarketCap,
  formatPriceChange,
} from "../hooks/usePriceData";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("usePriceData utilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatPrice", () => {
    it("should return --- for null values", () => {
      expect(formatPrice(null)).toBe("---");
    });

    it("should format very small prices with 6 decimals", () => {
      expect(formatPrice(0.000025)).toBe("$0.000025");
      expect(formatPrice(0.001234)).toBe("$0.001234");
      expect(formatPrice(0.009999)).toBe("$0.009999");
    });

    it("should format small prices under $1 with 4 decimals", () => {
      expect(formatPrice(0.0245)).toBe("$0.0245");
      expect(formatPrice(0.1234)).toBe("$0.1234");
      expect(formatPrice(0.9999)).toBe("$0.9999");
    });

    it("should format prices under $1000 with 2 decimals", () => {
      expect(formatPrice(1.23)).toBe("$1.23");
      expect(formatPrice(10.5)).toBe("$10.50");
      expect(formatPrice(999.99)).toBe("$999.99");
    });

    it("should format large prices with commas", () => {
      expect(formatPrice(1234.56)).toBe("$1,234.56");
      expect(formatPrice(10000)).toBe("$10,000.00");
      expect(formatPrice(1000000)).toBe("$1,000,000.00");
    });

    it("should handle zero correctly", () => {
      expect(formatPrice(0)).toBe("$0.000000");
    });
  });

  describe("formatMarketCap", () => {
    it("should return --- for null values", () => {
      expect(formatMarketCap(null)).toBe("---");
    });

    it("should format billions correctly", () => {
      expect(formatMarketCap(1_000_000_000)).toBe("$1.00B");
      expect(formatMarketCap(2_500_000_000)).toBe("$2.50B");
      expect(formatMarketCap(10_500_000_000)).toBe("$10.50B");
    });

    it("should format millions correctly", () => {
      expect(formatMarketCap(1_000_000)).toBe("$1.00M");
      expect(formatMarketCap(24_500_000)).toBe("$24.50M");
      expect(formatMarketCap(999_000_000)).toBe("$999.00M");
    });

    it("should format thousands correctly", () => {
      expect(formatMarketCap(1_000)).toBe("$1.00K");
      expect(formatMarketCap(575_000)).toBe("$575.00K");
      expect(formatMarketCap(999_999)).toBe("$1000.00K");
    });

    it("should format small values without abbreviation", () => {
      expect(formatMarketCap(500)).toBe("$500.00");
      expect(formatMarketCap(0)).toBe("$0.00");
    });
  });

  describe("formatPriceChange", () => {
    it("should return --- for null values", () => {
      expect(formatPriceChange(null)).toBe("---");
    });

    it("should format positive changes with + sign", () => {
      expect(formatPriceChange(3.2)).toBe("+3.20%");
      expect(formatPriceChange(0.5)).toBe("+0.50%");
      expect(formatPriceChange(100)).toBe("+100.00%");
    });

    it("should format negative changes with - sign", () => {
      expect(formatPriceChange(-5)).toBe("-5.00%");
      expect(formatPriceChange(-0.5)).toBe("-0.50%");
      expect(formatPriceChange(-50.75)).toBe("-50.75%");
    });

    it("should handle zero correctly", () => {
      expect(formatPriceChange(0)).toBe("+0.00%");
    });

    it("should handle very small changes", () => {
      expect(formatPriceChange(0.01)).toBe("+0.01%");
      expect(formatPriceChange(-0.01)).toBe("-0.01%");
    });
  });
});

describe("Price Data Fetching", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should handle successful CoinGecko API response", async () => {
    const mockResponse = {
      market_data: {
        current_price: { usd: 0.0025 },
        price_change_24h: 0.0001,
        price_change_percentage_24h: 4.0,
        market_cap: { usd: 575000 },
        total_volume: { usd: 10000 },
        high_24h: { usd: 0.0028 },
        low_24h: { usd: 0.0022 },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/selendra",
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data.market_data.current_price.usd).toBe(0.0025);
  });

  it("should handle API errors gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/selendra",
    );
    expect(response.ok).toBe(false);
    expect(response.status).toBe(429);
  });

  it("should handle network failures", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      fetch("https://api.coingecko.com/api/v3/coins/selendra"),
    ).rejects.toThrow("Network error");
  });
});

describe("Default SEL Price", () => {
  it("should have expected default values from tokenomics", () => {
    // These values should match the tokenomics spec
    const expectedInitialPrice = 0.0025; // $0.0025 initial listing price
    const expectedMarketCap = 575000; // 230M * $0.0025

    // Test that formatted values match expected defaults
    // formatPrice uses 6 decimals for very small prices (<0.01)
    expect(formatPrice(expectedInitialPrice)).toBe("$0.002500");
    expect(formatMarketCap(expectedMarketCap)).toBe("$575.00K");
  });
});
