/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_SUBSTRATE_RPC_WS = "wss://rpc.selendra.org";
process.env.NEXT_PUBLIC_SUBSTRATE_RPC_HTTP = "https://rpc.selendra.org";
process.env.NEXT_PUBLIC_EVM_RPC_HTTP = "https://rpc.selendra.org";
process.env.NEXT_PUBLIC_CHAIN_ID = "1961";
process.env.NEXT_PUBLIC_SS58_PREFIX = "42";
process.env.NEXT_PUBLIC_TOKEN_SYMBOL = "SEL";
process.env.NEXT_PUBLIC_TOKEN_DECIMALS = "18";

// Mock fetch for tests
global.fetch = vi.fn();

// Mock crypto for Substrate address utilities
if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error - polyfill for Node.js environment
  globalThis.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

// Mock ethers isAddress function
vi.mock("ethers", () => ({
  isAddress: (address: string): boolean => {
    // Check if it's a valid hex string with 0x prefix and 40 hex chars
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
