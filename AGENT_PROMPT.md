# Selendra Terminal - Production Readiness Implementation

You are a senior full-stack developer working on the Selendra Terminal project at `/home/user0/projects/selendra-biz/selendra/devtools/terminal`.

## Context

- **Version**: 1.1.0-beta.1 (Next.js 16, React 19, TypeScript 5.6)
- **State**: UI ~85% complete, but using mock data fallback. No tests, no monitoring.
- **Stack**: `@selendrajs/sdk`, `@polkadot/api`, `ethers.js`, Zustand, React Query
- **Chain**: Selendra (Substrate + EVM dual-VM), Chain ID 1961, SS58 prefix 42

## Read First

```bash
cd /home/user0/projects/selendra-biz/selendra/devtools/terminal

# Understand the task breakdown
cat docs/tasks.md | head -200

# Review architecture
cat docs/architecture.md

# Current RPC connection logic (important - don't break this)
cat src/components/providers/BlockchainProvider.tsx

# Existing indexer setup
ls -la indexer/
cat indexer/project.yaml
cat indexer/schema.graphql | head -100

# Check existing utilities you'll be testing
cat src/lib/address.ts
cat src/lib/unified/address-resolver.ts
```

## Environment Variables

**Existing in `.env.local`:**

```bash
NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=https://rpc.selendra.org
NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc.selendra.org
NEXT_PUBLIC_CHAIN_ID=1961
NEXT_PUBLIC_SS58_PREFIX=42
NEXT_PUBLIC_TOKEN_SYMBOL=SEL
NEXT_PUBLIC_TOKEN_DECIMALS=18
```

**Need to add:**

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:3001  # SubQuery GraphQL (local dev)
SENTRY_DSN=  # Add when Sentry project is created
```

## Your Task

Implement Production Readiness stages from `docs/tasks.md` in this order:

---

### Stage C: Error Tracking & Monitoring (Start Here - No Dependencies)

**1. Create `/src/app/api/health/route.ts`:**

```typescript
// Health endpoint that checks:
// - Substrate RPC: try connecting to wss://rpc.selendra.org
// - EVM RPC: try eth_chainId on https://rpc.selendra.org
// - Indexer: if NEXT_PUBLIC_GRAPHQL_ENDPOINT set, check sync status
//
// Response format:
// {
//   status: "ok" | "degraded" | "down",
//   timestamp: ISO string,
//   services: {
//     substrate: { status, latency?, error? },
//     evm: { status, latency?, chainId? },
//     indexer: { status, blockHeight?, chainHeight?, lag? }
//   }
// }
```

**2. Install and configure Sentry:**

```bash
pnpm add @sentry/nextjs
```

Create these files:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.js` to use `withSentryConfig`

---

### Stage D: Testing Foundation

**1. Set up Vitest:**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom";
```

**2. Write unit tests:**

Create `src/lib/__tests__/address.test.ts`:

- Test `isValidSubstrateAddress()`
- Test `isValidEvmAddress()`
- Test `formatAddress()` with different formats
- Test `truncateAddress()`

Create `src/lib/unified/__tests__/address-resolver.test.ts`:

- Test SS58 to EVM conversion
- Test EVM to SS58 conversion
- Test invalid address handling

**3. Set up Playwright:**

```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

Create `playwright.config.ts`

Create `tests/e2e/homepage.spec.ts`:

- Test homepage loads
- Test navigation works
- Test wallet connect button exists

**4. Add scripts to package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### Stage A: Indexer Deployment

**1. Update `indexer/project.yaml`:**

- Verify chainId matches Selendra mainnet genesis hash
- Ensure endpoint is `wss://rpc.selendra.org`

**2. Create `indexer/docker-compose.yml`:**

```yaml
version: "3"
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - 5432:5432
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: subquery

  subquery-node:
    image: subquerynetwork/subql-node-substrate:latest
    depends_on:
      - postgres
    restart: always
    environment:
      DB_USER: postgres
      DB_PASS: postgres
      DB_DATABASE: subquery
      DB_HOST: postgres
      DB_PORT: 5432
    volumes:
      - ./:/app
    command:
      - -f=/app
      - --db-schema=app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/ready"]
      interval: 30s
      timeout: 10s
      retries: 5

  graphql-engine:
    image: subquerynetwork/subql-query:latest
    ports:
      - 3001:3000
    depends_on:
      - postgres
      - subquery-node
    restart: always
    environment:
      DB_USER: postgres
      DB_PASS: postgres
      DB_DATABASE: subquery
      DB_HOST: postgres
      DB_PORT: 5432
    command:
      - --name=app
      - --playground

volumes:
  postgres_data:
```

**3. Create `indexer/README.md`:**

- Prerequisites (Docker, Node.js 20+)
- Local development: `docker compose up`
- Production deployment steps
- Troubleshooting common issues

---

### Stage B: Replace Mock Data

**1. Create `src/lib/api/graphql.ts`:**

```typescript
// GraphQL client for SubQuery
// - Use fetch with proper error handling
// - Include retry logic (3 attempts)
// - Cache responses with React Query
// - Handle connection failures gracefully

export class IndexerClient {
  constructor(endpoint: string) {}

  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T>;

  async getBlocks(first: number, offset?: number): Promise<Block[]>;
  async getTransactions(first: number, offset?: number): Promise<Transaction[]>;
  async getAccount(address: string): Promise<Account | null>;
  async getSyncStatus(): Promise<{ indexerBlock: number; chainBlock: number }>;
}
```

**2. Create React Query hooks in `src/lib/hooks/`:**

- `useIndexerBlocks.ts` - Fetch blocks from indexer with pagination
- `useIndexerTransactions.ts` - Fetch transactions with filters
- `useIndexerAccount.ts` - Fetch account with history
- `useIndexerStatus.ts` - Check sync status

**3. Update `BlockchainProvider.tsx`:**

```typescript
// Add indexer status to context
// Prefer indexer for historical data queries
// Fall back to direct RPC if indexer unavailable
// Keep existing mock data fallback for development
```

**4. Create `src/components/common/SyncIndicator.tsx`:**

```typescript
// Show when indexer is syncing
// Display: "Syncing... X blocks behind"
// Hide when fully synced
// Use subtle UI (small badge in header)
```

---

## Guidelines

1. **Read before write** - Understand existing patterns in the codebase
2. **TypeScript strict** - No `any` types unless absolutely necessary
3. **Don't break existing** - Mock data fallback must still work
4. **Incremental changes** - Small, testable changes
5. **Test your changes** - Run `pnpm dev` and verify UI works

## Selendra Chain Details

| Property        | Value                       |
| --------------- | --------------------------- |
| Chain ID (EVM)  | 1961                        |
| SS58 Prefix     | 42                          |
| Token           | SEL (18 decimals)           |
| Block Time      | ~1 second                   |
| Consensus       | AlephBFT (instant finality) |
| RPC (Substrate) | wss://rpc.selendra.org      |
| RPC (EVM)       | https://rpc.selendra.org    |

## Success Criteria

- [ ] `curl http://localhost:3000/api/health` returns accurate JSON status
- [ ] `pnpm test` runs Vitest with passing unit tests
- [ ] `pnpm test:e2e` runs Playwright with passing E2E tests
- [ ] `cd indexer && docker compose up` starts SubQuery successfully
- [ ] GraphQL playground accessible at http://localhost:3001
- [ ] UI shows sync indicator when indexer is behind
- [ ] Existing functionality still works (staking, governance, explorer)

## Verification Commands

```bash
# After Stage C
curl http://localhost:3000/api/health | jq

# After Stage D
pnpm test
pnpm test:e2e

# After Stage A
cd indexer
docker compose up -d
curl http://localhost:3001 # Should show GraphQL playground

# After Stage B
# Open browser, verify blocks/transactions load from indexer
# Check Network tab - should see GraphQL requests to localhost:3001
```

---

## Notes

- The project already has a comprehensive indexer schema in `indexer/schema.graphql`
- Mapping handlers exist in `indexer/src/` but may need review
- SNS (Selendra Naming Service) integration exists but may not be deployed on mainnet yet
- DeFi components are UI-only (no DEX precompile integration yet)

Start with Stage C since it has no dependencies and provides immediate value for debugging.
