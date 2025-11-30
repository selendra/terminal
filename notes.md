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
  - `Skeleton` - loading skeleton states with shimmer animation
  - `ErrorState`, `ErrorBanner`, `EmptyState` - consistent error handling UI
- Updated `.env.example` and `.env.local` with correct variables

---

## 🔄 In Progress / Known Issues

### Local Node + Indexer Setup

- **Local Selendra Node**: Running via `docker-compose.local.yml`
  - Image: `image.koompi.org/library/selendra-rpc:latest`
  - Port 9944 (RPC/WS), Port 30333 (P2P)
  - Node fully synced to latest block (~17M)
  - Archive mode enabled (170GB database)

- **Indexer Status** (as of Nov 30, 2025):
  - **FAST SYNC MODE ENABLED** 🚀
  - Speed: **5,000-18,000 blocks/second** (block-only, no events)
  - Estimated full sync: **~1 hour** (from block 0 to 17M)
  
- **Fast Sync Strategy**:
  1. Use minimal `project.yaml` with block handler only (modulo 5000)
  2. Disable all event handlers (balance transfers, EVM, staking, etc.)
  3. Use HTTP endpoint instead of WebSocket
  4. After fast sync completes, switch to full `project-full.yaml`

- **Monitor Progress**:
  ```bash
  # Check sync status
  curl -s 'http://localhost:3001/graphql' -H 'Content-Type: application/json' \
    -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}'
  
  # Watch benchmark
  docker logs -f selendra-indexer-node 2>&1 | grep INDEXING
  ```

### Fast Sync Complete? Enable Full Indexing

After the fast sync reaches the target height:

1. Restore full project.yaml:
   ```bash
   cp indexer/project-full.yaml indexer/project.yaml
   cd indexer && pnpm build
   docker-compose -f docker-compose.local.yml restart subquery-node
   ```

2. The indexer will re-process blocks with full handlers (slower but captures all events)

### Previous Issues (Resolved)

- Public `wss://rpc.selendra.org` had constant WebSocket 1006 disconnections
- HTTPS endpoint had HTTP/2 GOAWAY session issues
- **Solution**: Run local Selendra node for reliable indexing

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

- [x] Real-time block/transaction subscriptions (WebSocket) - LatestBlocksLive, LatestTransactionsLive components
- [ ] Token transfer indexing and display
- [ ] Contract verification and source code display
- [ ] Staking dashboard with real validator data
- [ ] Governance proposals from indexer
- [x] Search functionality across blocks/txs/accounts - SearchResults page with comprehensive search

### UI Polish

- [x] Loading skeleton states (Skeleton components)
- [x] Error handling UI (ErrorState, ErrorBanner, EmptyState components)
- [x] Mobile responsive improvements (MobileCards, responsive TransactionsExplorer, mobile search)
- [x] Dark/light theme toggle persistence (ThemeProvider)

---

## 🚀 Quick Start

```bash
# Option 1: Start with LOCAL node + indexer (recommended for development)
docker-compose -f docker-compose.local.yml up -d

# Option 2: Start indexer only (connects to public RPC - may be unstable)
docker-compose -f docker-compose.indexer.yml up -d

# Check indexer sync status
curl -s 'http://localhost:3001/graphql' \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ _metadata { lastProcessedHeight targetHeight } }"}'

# Check local node health
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"system_health","params":[]}' \
  http://localhost:9944

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

| Service           | URL                              |
| ----------------- | -------------------------------- |
| Terminal UI       | http://localhost:3000            |
| Indexer GraphQL   | http://localhost:3001/graphql    |
| Local Node RPC    | http://localhost:9944            |
| Local Node WS     | ws://localhost:9944              |
| Public RPC        | wss://rpc.selendra.org           |
| Health Check      | http://localhost:3000/api/health |

---

## 🔧 Selendra Chain Specifications

| Property | Value |
|----------|-------|
| **Consensus** | AURA (block production) + AlephBFT (finality) |
| **Block Time** | 1 second |
| **Finality** | Instant (AlephBFT) |
| **Chain ID (EVM)** | 1961 (Mainnet), 1953 (Testnet) |
| **SS58 Prefix** | 42 |
| **Token Symbol** | SEL |
| **Token Decimals** | 18 |
| **VM Architecture** | Unified Dual-VM (Substrate + Frontier EVM) |

### RPC Endpoints

| Network | Substrate WS | EVM HTTP |
|---------|-------------|----------|
| Mainnet | `wss://rpc.selendra.org` | `https://rpc.selendra.org` |
| Testnet | `wss://rpc-testnet.selendra.org` | `https://rpc-testnet.selendra.org` |

### Precompile Addresses

| Precompile | Address |
|------------|--------|
| Staking | `0x0000000000000000000000000000000000000403` |
| DEX | `0x0000000000000000000000000000000000000408` |
| Unified Accounts | `0x0000000000000000000000000000000000000801` |

---

_Last updated: November 30, 2025_
