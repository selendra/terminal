# Selendra Terminal - Development Notes

## ✅ Completed

### Stage A: SubQuery Indexer Infrastructure

- Created `docker-compose.indexer.yml` for local SubQuery stack
- Built complete indexer in `indexer/` directory with:
  - Block, transaction, account, staking, governance handlers
  - GraphQL schema with all entity types
  - Support for both Substrate extrinsics and EVM transactions
- Fixed issues:
  - Added `btree_gist` PostgreSQL extension for historical state
  - Simplified `utils.ts` to avoid TextEncoder polyfill issues
  - Added `--subquery-name=app` flag for correct schema resolution

### Stage B: Real Data Integration

- Replaced mock data in `TransactionsExplorer.tsx`:
  - Uses `useIndexerTransactions` hook
  - Shows real transactions from indexer
  - Displays sync status banner when indexer is catching up
- Replaced mock data in `AccountsExplorer.tsx`:
  - Uses `useTopAccounts` hook
  - Shows real account balances and transaction counts
- Created GraphQL client (`src/lib/api/graphql.ts`) with methods:
  - `getBlocks`, `getBlock`
  - `getTransactions`, `getTransaction`, `getAccountTransactions`
  - `getAccount`, `searchAccounts`, `getTopAccounts`, `getAccountsCount`
  - `getSyncStatus`, `getDailyStats`
- Created React Query hooks:
  - `useIndexerTransactions`, `useAccountTransactions`
  - `useIndexerAccount`, `useTopAccounts`, `useAccountsCount`
  - `useIndexerBlocks`, `useIndexerStatus`

### Stage C: Sentry Integration

- Added Sentry config files:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`

### Stage D: Testing Infrastructure

- Added Vitest for unit testing (`vitest.config.ts`)
- Added Playwright for E2E testing (`playwright.config.ts`)
- Created test files:
  - `src/lib/__tests__/address.test.ts`
  - `src/lib/unified/__tests__/address-resolver.test.ts`
  - `tests/e2e/homepage.spec.ts`
- Test setup in `src/test/setup.ts`

### Other Improvements

- Health API endpoint (`/api/health`) checking all 3 services
- Fixed `evmSDK.getProvider()` → `evmSDK.getEvmProvider()` calls
- Added common components:
  - `AddressDisplay` - unified address display with copy/toggle
  - `VMBadge` - EVM/Substrate badge
  - `StatusBadge`, `StatusDot` - transaction status indicators
  - `SyncIndicator` - indexer sync progress
- Updated `.env.example` and `.env.local` with correct variables

---

## 🔄 In Progress / Known Issues

### Indexer Syncing

- Indexer was at ~225,000 blocks (still syncing historical data)
- Full sync may take several hours depending on chain height
- Transactions/accounts will populate as sync progresses

---

## 📋 TODO

### Stage E: Production Deployment

- [ ] Deploy indexer to cloud (SubQuery Managed Service or self-hosted)
- [ ] Set up production PostgreSQL database
- [ ] Configure production environment variables
- [ ] Set up CI/CD pipeline for automatic deployments
- [ ] Configure Sentry DSN for production error tracking

### Stage F: Performance Optimization

- [ ] Add Redis caching layer for frequently accessed data
- [ ] Implement connection pooling for RPC calls
- [ ] Add request rate limiting
- [ ] Optimize GraphQL queries with proper indexing

### Additional Features

- [ ] Real-time block/transaction subscriptions (WebSocket)
- [ ] Token transfer indexing and display
- [ ] Contract verification and source code display
- [ ] Staking dashboard with real validator data
- [ ] Governance proposals from indexer
- [ ] Search functionality across blocks/txs/accounts

### UI Polish

- [ ] Mobile responsive improvements
- [ ] Dark/light theme toggle persistence
- [ ] Loading skeleton states
- [ ] Better error handling UI

---

## 🚀 Quick Start

```bash
# Start indexer stack (PostgreSQL + SubQuery)
docker-compose -f docker-compose.indexer.yml up -d

# Check indexer sync status
curl -s 'http://localhost:3001/graphql' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}'

# Start dev server
pnpm dev

# Check health
curl http://localhost:3000/api/health
```

---

## 📁 Key Files

| File                            | Purpose                  |
| ------------------------------- | ------------------------ |
| `docker-compose.indexer.yml`    | Local SubQuery stack     |
| `indexer/project.yaml`          | SubQuery project config  |
| `indexer/schema.graphql`        | GraphQL schema           |
| `src/lib/api/graphql.ts`        | GraphQL client           |
| `src/lib/hooks/*.ts`            | React Query hooks        |
| `src/components/explorer/*.tsx` | Explorer UI components   |
| `.env.local`                    | Local environment config |

---

## 🔗 Endpoints

| Service         | URL                              |
| --------------- | -------------------------------- |
| Terminal UI     | http://localhost:3000            |
| Indexer GraphQL | http://localhost:3001/graphql    |
| Public RPC      | wss://rpc.selendra.org           |
| Health Check    | http://localhost:3000/api/health |

---

_Last updated: November 29, 2025_
