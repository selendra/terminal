# Remaining Implementation Tasks for Selendra Terminal

This document contains prompts for AI agents to complete the remaining implementation tasks identified during the codebase review.

---

## Task 1: Split BlockchainProvider into Smaller Modules

### Context
The `src/components/providers/BlockchainProvider.tsx` file is 682 lines long and handles too many responsibilities:
- SDK initialization (Substrate & EVM)
- Connection management with fallback logic
- Block subscription
- Chain info fetching
- Network statistics
- Reconnection handling

### Requirements
Split this file into smaller, focused modules while maintaining the same public API (`useBlockchain` hook).

### Suggested Structure
```
src/
├── lib/
│   └── blockchain/
│       ├── index.ts                    # Re-export everything
│       ├── constants.ts                # SELENDRA_CONSTANTS, PUBLIC_RPC, ENDPOINTS
│       ├── types.ts                    # All interfaces (BlockInfo, ChainInfo, NetworkStats, etc.)
│       ├── connection-manager.ts       # Connection logic with fallback
│       ├── block-subscription.ts       # Block subscription logic
│       └── rpc-utils.ts                # RPC availability checking
├── components/
│   └── providers/
│       └── BlockchainProvider.tsx      # Slim provider using the modules above
```

### Acceptance Criteria
- [ ] All existing functionality preserved
- [ ] `useBlockchain()` hook API unchanged
- [ ] Each new module is under 150 lines
- [ ] TypeScript compiles without errors
- [ ] All existing tests still pass

---

## Task 2: Add Comprehensive Test Coverage for Hooks

### Context
The codebase has several hooks that lack unit tests:
- `useBlockSubscription.ts`
- `useTransactionSubscription.ts`
- `useGovernance.ts`
- `useStaking.ts` (partially tested)
- `useSNS.ts`
- `useIndexerBlocks.ts`
- `useIndexerTransactions.ts`
- `useIndexerAccount.ts`
- `useIndexerStatus.ts`
- `useTokenomics.ts`
- `useNetworkStats.ts`

### Requirements
Create comprehensive unit tests for each hook using Vitest and React Testing Library.

### Test File Template
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHookName } from "../hookName";

// Mock dependencies
vi.mock("@/components/providers/BlockchainProvider", () => ({
  useBlockchain: () => ({
    substrateSDK: mockSubstrateSDK,
    evmSDK: mockEvmSDK,
    isConnected: true,
  }),
}));

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("useHookName", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useHookName(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it("should handle successful data fetch", async () => {
    // Test implementation
  });

  it("should handle errors gracefully", async () => {
    // Test implementation
  });
});
```

### Priority Order (by complexity/importance)
1. `useBlockSubscription.ts` - Core functionality
2. `useStaking.ts` - Complex with many sub-hooks
3. `useGovernance.ts` - Important feature
4. `useTokenomics.ts` - Recently used
5. `useNetworkStats.ts` - Recently created
6. Other indexer hooks

### Acceptance Criteria
- [ ] Each hook has at least 5 unit tests
- [ ] Tests cover: initial state, loading, success, error, and edge cases
- [ ] Mocking is properly set up for SDK/provider dependencies
- [ ] All tests pass with `npm run test:run`
- [ ] Code coverage for hooks reaches at least 70%

---

## Task 3: Implement RPC Caching Layer

### Context
Currently, RPC calls are made directly without caching, which can:
- Overload the RPC nodes with repeated requests
- Slow down the UI with redundant network calls
- Increase latency for users

### Requirements
Implement a caching layer for RPC calls that:
1. Caches responses with configurable TTL
2. Supports cache invalidation
3. Works with both Substrate and EVM RPCs
4. Integrates seamlessly with existing hooks

### Suggested Implementation

```typescript
// src/lib/cache/rpc-cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds
  key?: string; // Custom cache key
}

class RPCCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5000; // 5 seconds default

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Implementation
  }

  invalidate(key: string | RegExp): void {
    // Implementation
  }

  clear(): void {
    // Implementation
  }
}

export const rpcCache = new RPCCache();
```

### Cache Strategy by Data Type
| Data Type | TTL | Invalidation Trigger |
|-----------|-----|---------------------|
| Block height | 1s | New block subscription |
| Chain info | 60s | Manual refresh |
| Validator list | 30s | Era change |
| Token prices | 30s | Manual refresh |
| Account balance | 5s | Transaction confirmed |
| Gas price | 10s | New block |

### Acceptance Criteria
- [ ] Cache implementation with configurable TTL
- [ ] Integration with at least 3 existing hooks
- [ ] Cache invalidation on relevant events
- [ ] Memory management (max cache size, cleanup)
- [ ] Unit tests for cache functionality
- [ ] No breaking changes to existing API

---

## Task 4: Fix ESLint Configuration

### Context
The `npm run lint` command fails with:
```
Invalid project directory provided, no such directory: /home/user0/projects/selendra-biz/selendra/devtools/terminal/lint
```

### Requirements
1. Debug and fix the ESLint configuration
2. Ensure `npm run lint` runs successfully
3. Fix any linting errors found

### Files to Check
- `package.json` - lint script configuration
- `.eslintrc.json` or `eslint.config.js` - ESLint configuration
- `next.config.js` - Next.js ESLint settings

### Current package.json script
```json
{
  "scripts": {
    "lint": "next lint"
  }
}
```

### Acceptance Criteria
- [ ] `npm run lint` executes without path errors
- [ ] All linting errors are fixed or documented as intentional
- [ ] ESLint rules are appropriate for the project (Next.js + TypeScript)
- [ ] Pre-commit hook or CI integration considered

---

## General Guidelines for All Tasks

### Before Starting
1. Read the existing code thoroughly
2. Understand the dependencies and relationships
3. Check existing tests for patterns to follow
4. Run `npm run type-check` and `npm run test:run` to establish baseline

### During Implementation
1. Follow existing code style and patterns
2. Add JSDoc comments for public APIs
3. Use TypeScript strictly (no `any` unless absolutely necessary)
4. Handle errors gracefully with user-friendly messages

### After Implementation
1. Run `npm run type-check` - must pass
2. Run `npm run test:run` - all tests must pass
3. Run `npm run build` - production build must succeed
4. Test in browser if UI changes involved

### Code Style Reference
- Use `clsx` or `cn` for conditional classNames
- Use `react-hot-toast` for notifications
- Use TanStack Query for data fetching
- Follow existing component patterns in `src/components/`
