# Selendra Terminal - Development Tasks

> **Actionable task list for implementation**

**Version**: 1.1.0-beta.4  
**Last Updated**: November 29, 2025  
**Status**: Phase 7 Complete → Production Readiness Stage

---

## 📊 Project Status Summary

| Metric                   | Status                              |
| ------------------------ | ----------------------------------- |
| **Overall Progress**     | ~95% Feature Complete               |
| **Phases 1-7**           | ✅ Complete (UI/Services)           |
| **Phase 8 (Production)** | 🔄 In Progress                      |
| **RPC Architecture**     | ✅ Hybrid Fallback Deployed         |
| **Indexer Deployment**   | ✅ Local Docker Working             |
| **Test Coverage**        | ✅ Foundation Complete (31 tests)   |
| **Error Tracking**       | ✅ Sentry Configured                |
| **Health Endpoint**      | ✅ Implemented                      |
| **Production Ready**     | 🟡 Partial - Need Production Deploy |

### Critical Gaps Identified

| Gap                               | Impact                      | Status                   |
| --------------------------------- | --------------------------- | ------------------------ |
| ~~Indexer not deployed~~          | ~~No historical data~~      | ✅ **RESOLVED** (Docker) |
| ~~Mock data fallback active~~     | ~~Real-time only, poor UX~~ | ✅ **RESOLVED** (v1.1.0) |
| ~~No test coverage~~              | ~~Regression risk~~         | ✅ **RESOLVED** (v1.1.0) |
| ~~No error tracking~~             | ~~Silent failures~~         | ✅ **RESOLVED** (v1.1.0) |
| SNS contracts may not be deployed | .sel domains non-functional | 🟡 Needs Verification    |
| DEX precompile not integrated     | Swap UI is cosmetic         | 🟢 Known Limitation      |

---

## 🌐 RPC Architecture (NEW - v1.1.0)

> **Hybrid Local Node + Public RPC with Automatic Fallback**

The explorer now uses a resilient hybrid architecture that automatically falls back to public RPC when the local Docker node is unavailable.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Explorer Starts                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Try Primary RPC       │
              │ (Local Docker Node)   │
              │ ws://selendra-node:9944│
              └───────────┬───────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
      ✅ Success                    ❌ Failed
           │                             │
           ▼                             ▼
   connectionSource="local"    ┌─────────────────────┐
   activeEndpoints=primary     │ Try Fallback RPC    │
                               │ (Public RPC)        │
                               │ wss://rpc.selendra.org│
                               └──────────┬──────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                     ✅ Success                      ❌ Failed
                          │                               │
                          ▼                               ▼
                connectionSource="public"        Show error message
                activeEndpoints=fallback         (no mock data)
```

### Key Features

| Feature                   | Description                                                    |
| ------------------------- | -------------------------------------------------------------- |
| **Automatic Fallback**    | Local node → Public RPC without manual intervention            |
| **No Mock Data**          | Real blockchain data only - errors shown if both RPCs fail     |
| **Connection Source**     | UI can display whether connected to "local" or "public" RPC    |
| **Active Endpoints**      | Runtime access to currently active RPC endpoints for debugging |
| **Chain ID Verification** | Validates chain ID matches expected network (1961/1953)        |
| **Graceful Reconnection** | Auto-reconnect with fallback on WebSocket disconnection        |
| **Real Validator Count**  | Fetches actual validator count from chain state                |

### Configuration

#### Docker Compose (Default - Hybrid Mode)

```yaml
# docker-compose.yml
services:
  explorer:
    environment:
      # Primary: Local Docker node (tried first)
      - NEXT_PUBLIC_SUBSTRATE_RPC_WS=ws://selendra-node:9944
      - NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=http://selendra-node:9933
      - NEXT_PUBLIC_EVM_RPC_HTTP=http://selendra-node:9933
      # Fallback: Public RPC (automatic, no config needed)
```

#### Standalone (Public RPC Only)

```yaml
# docker-compose.yml --profile standalone
services:
  explorer-standalone:
    # No env vars = uses public RPC directly
    # (BlockchainProvider defaults to rpc.selendra.org)
```

#### Environment Variables

| Variable                               | Default                          | Description            |
| -------------------------------------- | -------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUBSTRATE_RPC_WS`         | `wss://rpc.selendra.org`         | Primary Substrate WS   |
| `NEXT_PUBLIC_SUBSTRATE_RPC_HTTP`       | `https://rpc.selendra.org`       | Primary Substrate HTTP |
| `NEXT_PUBLIC_EVM_RPC_HTTP`             | `https://rpc.selendra.org`       | Primary EVM HTTP       |
| `NEXT_PUBLIC_SUBSTRATE_RPC_WS_TESTNET` | `wss://rpc-testnet.selendra.org` | Testnet Substrate WS   |

### Implementation Details

**File**: `src/components/providers/BlockchainProvider.tsx`

```typescript
// New context properties
interface BlockchainContextType {
  connectionSource: "local" | "public" | null; // Which RPC we're connected to
  activeEndpoints: RpcEndpoints | null; // Current endpoints for debugging
  // ... other properties
}

// Key functions
tryConnectToEndpoints(endpoints, source); // Try specific endpoint set
connectWithFallback(); // Orchestrates fallback chain
```

### Files Changed (v1.1.0)

| File                                              | Changes                                |
| ------------------------------------------------- | -------------------------------------- |
| `src/components/providers/BlockchainProvider.tsx` | Complete rewrite - hybrid architecture |
| `docker-compose.yml`                              | Updated docs, simplified standalone    |
| `.env.example`                                    | Documented hybrid architecture         |

---

## Task Status Legend

| Status | Meaning     |
| ------ | ----------- |
| ✅     | Completed   |
| 🔄     | In Progress |
| ⏳     | Not Started |
| 🚫     | Blocked     |

## Priority Legend

| Priority | Meaning                    |
| -------- | -------------------------- |
| 🔴       | Critical - Must have       |
| 🟡       | High - Should have         |
| 🟢       | Medium - Nice to have      |
| ⚪       | Low - Future consideration |

---

## 🚀 PRODUCTION READINESS STAGES (NEW)

> **These stages must be completed before Terminal can be considered production-ready.**

### Stage A: Indexer Deployment (Priority 1) ✅ LOCAL DOCKER COMPLETE

**Goal**: Deploy SubQuery indexer for historical data and efficient queries

| Task                           | Status | Priority | Owner  | Notes                                       |
| ------------------------------ | ------ | -------- | ------ | ------------------------------------------- |
| Docker Compose setup           | ✅     | 🔴       | DevOps | `docker-compose.indexer.yml`                |
| PostgreSQL with btree_gist     | ✅     | 🔴       | DevOps | `indexer/init.sql` extension script         |
| SubQuery node syncing          | ✅     | 🔴       | DevOps | ~35 blocks/sec, syncing to 17M blocks       |
| GraphQL API working            | ✅     | 🔴       | DevOps | `http://localhost:3001/graphql`             |
| Configure for Selendra mainnet | ✅     | 🔴       | DevOps | `wss://rpc.selendra.org` endpoint           |
| Deploy to production server    | ⏳     | 🔴       | DevOps | Target: `api.terminal.selendra.org/graphql` |
| Set up indexer monitoring      | ⏳     | 🟡       | DevOps | Sync lag alerts                             |
| Deploy to testnet first        | ⏳     | 🟡       | DevOps | Validation before mainnet                   |

**Local Development**: ✅ COMPLETE  
**Production Deployment**: ⏳ Pending  
**Blocker For**: Historical data features (resolved for development)

### Stage B: Replace Mock Data (Priority 2) ✅ MOSTLY COMPLETE

**Goal**: Connect all components to real blockchain data via indexer

| Task                                     | Status | Priority | Notes                                 |
| ---------------------------------------- | ------ | -------- | ------------------------------------- |
| Remove mock data from BlockchainProvider | ✅     | 🔴       | v1.1.0 - No more mock data            |
| Hybrid RPC with fallback                 | ✅     | 🔴       | Local node → Public RPC               |
| Real validator count from chain          | ✅     | 🔴       | Fetches from session.validators       |
| Create GraphQL client service            | ✅     | 🔴       | `lib/api/graphql.ts`                  |
| Create useIndexerBlocks hook             | ✅     | 🔴       | `lib/hooks/useIndexerBlocks.ts`       |
| Create useIndexerTransactions hook       | ✅     | 🔴       | `lib/hooks/useIndexerTransactions.ts` |
| Create useIndexerAccount hook            | ✅     | 🔴       | `lib/hooks/useIndexerAccount.ts`      |
| Create useIndexerStatus hook             | ✅     | 🔴       | `lib/hooks/useIndexerStatus.ts`       |
| Replace mock governance with chain data  | ✅     | 🔴       | Done - real chain data                |
| Replace mock gas tracker                 | ⏳     | 🟡       | Real gas price from RPC               |
| Add "syncing" indicator                  | ✅     | 🟡       | SyncIndicator component               |
| Remove mock data files                   | ✅     | 🟢       | Done - no mock files                  |
| Wire hooks to explorer components        | ⏳     | 🟡       | Awaiting indexer deployment           |

**Estimated Effort**: ~~1 week~~ Hooks DONE, awaiting indexer  
**Dependency**: Stage A complete for historical data

### Stage C: Error Tracking & Monitoring (Priority 3) ✅ COMPLETE

**Goal**: Catch and diagnose production issues

| Task                          | Status | Priority | Notes                              |
| ----------------------------- | ------ | -------- | ---------------------------------- |
| Integrate Sentry              | ✅     | 🔴       | `sentry.*.config.ts` files created |
| Set up source maps            | ✅     | 🟡       | Configured in next.config.js       |
| Create `/api/health` endpoint | ✅     | 🔴       | `src/app/api/health/route.ts`      |
| Add RPC health check          | ✅     | 🟡       | Substrate + EVM checks             |
| Add indexer health check      | ✅     | 🟡       | GraphQL metadata check             |
| Set up uptime monitoring      | ⏳     | 🟡       | Uptime Robot or similar            |
| Configure error alerts        | ⏳     | 🟢       | Slack/Discord integration          |

**Estimated Effort**: ~~3 days~~ DONE  
**Dependency**: None

### Stage D: Testing Foundation (Priority 4) ✅ COMPLETE

**Goal**: Prevent regressions and ensure reliability

| Task                              | Status | Priority | Notes                             |
| --------------------------------- | ------ | -------- | --------------------------------- |
| Set up Vitest                     | ✅     | 🔴       | `vitest.config.ts` configured     |
| Unit tests for `lib/address.ts`   | ✅     | 🔴       | 15 tests passing                  |
| Unit tests for `lib/unified/*`    | ✅     | 🔴       | 16 tests for address-resolver     |
| Unit tests for staking service    | ⏳     | 🟡       | Future enhancement                |
| Unit tests for governance service | ⏳     | 🟡       | Future enhancement                |
| Set up Playwright                 | ✅     | 🟡       | `playwright.config.ts` configured |
| E2E: Homepage test                | ✅     | 🟡       | `tests/e2e/homepage.spec.ts`      |
| E2E: Connect wallet flow          | ⏳     | 🟡       | Requires wallet mock              |
| E2E: Staking flow                 | ⏳     | 🟢       | Complex flow                      |
| Add to CI/CD pipeline             | ⏳     | 🟡       | GitHub Actions                    |

**Estimated Effort**: ~~1 week~~ Foundation DONE (31 tests passing)  
**Dependency**: None

### Stage E: Performance Optimization (Priority 5) 🟢

**Goal**: Improve UX with fast, responsive UI

| Task                        | Status | Priority | Notes                               |
| --------------------------- | ------ | -------- | ----------------------------------- |
| Implement virtual scrolling | ⏳     | 🟡       | Validator list, tx list             |
| Add React Query caching     | ⏳     | 🟡       | Stale-while-revalidate              |
| Bundle size audit           | ⏳     | 🟢       | Analyze with `next/bundle-analyzer` |
| Code-split heavy components | ⏳     | 🟢       | Charts, developer tools             |
| Add loading skeletons       | ⏳     | 🟢       | Better perceived performance        |
| Lighthouse audit            | ⏳     | 🟡       | Target: Score > 90                  |

**Estimated Effort**: 1 week  
**Dependency**: Stages A-B recommended first

---

## 🔌 ECOSYSTEM INTEGRATION STAGES (NEW)

> **Connect Terminal to Selendra ecosystem tools and external services.**

### Stage F: SNS (Selendra Naming Service) 🟡

**Goal**: Enable .sel domain registration and resolution

| Task                          | Status | Priority | Notes                       |
| ----------------------------- | ------ | -------- | --------------------------- |
| Verify SNS contracts deployed | ⏳     | 🔴       | Check mainnet deployment    |
| Test domain resolution        | ⏳     | 🔴       | `SNSClient.resolveName()`   |
| Test reverse lookup           | ⏳     | 🟡       | `SNSClient.lookupAddress()` |
| Enable registration UI        | ⏳     | 🟡       | Domain registration flow    |
| Add profile editing           | ⏳     | 🟢       | Update avatar, bio, etc.    |
| Integrate with AddressDisplay | ⏳     | 🟡       | Show .sel names             |

**Estimated Effort**: 1 week (if contracts deployed)  
**Blocker**: SNS contracts must be deployed on mainnet

### Stage G: DeFi Integration 🟢

**Goal**: Connect DeFi UI to actual protocols

| Task                                      | Status | Priority | Notes                |
| ----------------------------------------- | ------ | -------- | -------------------- |
| Verify DEX precompile availability        | ⏳     | 🟡       | Check `0x...0408`    |
| Integrate swap functionality              | ⏳     | 🟡       | If DEX available     |
| Add token price feeds                     | ⏳     | 🟢       | CoinGecko or similar |
| Portfolio tracking                        | ⏳     | 🟢       | Aggregate holdings   |
| Mark DeFi as "Coming Soon" if unavailable | ⏳     | 🟡       | UI indicator         |

**Estimated Effort**: 1-2 weeks (dependent on DEX availability)  
**Blocker**: DEX precompile must be deployed

### Stage H: Bridge Preparation 🟢

**Goal**: Prepare UI for cross-chain bridging

| Task                      | Status | Priority | Notes                    |
| ------------------------- | ------ | -------- | ------------------------ |
| Bridge UI skeleton        | ⏳     | 🟢       | Basic transfer interface |
| Chain selector component  | ⏳     | 🟢       | Ethereum, BNB, Polkadot  |
| Transaction tracking UI   | ⏳     | 🟢       | Cross-chain status       |
| Placeholder for LayerZero | ⏳     | ⚪       | When available           |
| Placeholder for XCMP      | ⏳     | ⚪       | When available           |

**Estimated Effort**: 1 week  
**Blocker**: Bridge backend must be available

---

## 📋 RECOMMENDED PRIORITY ORDER

| Order | Stage                          | Justification                    | Status     |
| ----- | ------------------------------ | -------------------------------- | ---------- |
| 1     | **Stage A: Deploy Indexer**    | All real data depends on this    | ⏳ Pending |
| 2     | ~~Stage B: Replace Mock Data~~ | ~~Core functionality must work~~ | ✅ DONE    |
| 3     | ~~Stage C: Error Tracking~~    | ~~Catch issues before users~~    | ✅ DONE    |
| 4     | ~~Stage D: Testing~~           | ~~Prevent regressions~~          | ✅ DONE    |
| 5     | **Stage E: Performance**       | UX improvement for adoption      | ⏳ Next    |
| 6     | **Stage F: SNS Integration**   | Key differentiator               | ⏳ Pending |
| 7     | **Stage G: DeFi**              | Dependent on DEX availability    | ⏳ Pending |
| 8     | **Stage H: Bridge**            | Dependent on bridge backend      | ⏳ Pending |

**Remaining Time to Production**: ~3-4 weeks (indexer + polish)

---

## Phase 1: Foundation (Completed) ✅

### Core Infrastructure

| Task                            | Status | Priority | Notes                         |
| ------------------------------- | ------ | -------- | ----------------------------- |
| RPC Connection with retry logic | ✅     | 🔴       | `BlockchainProvider.tsx`      |
| **Hybrid RPC Architecture**     | ✅     | 🔴       | Local node → Public fallback  |
| WebSocket reconnection handling | ✅     | 🔴       | Auto-reconnect with fallback  |
| Real block subscription         | ✅     | 🔴       | `subscribeNewHeads`           |
| EVM integration                 | ✅     | 🔴       | Dual VM support               |
| **Chain ID verification**       | ✅     | 🟡       | Validates 1961/1953           |
| **Connection source tracking**  | ✅     | 🟡       | "local" or "public" indicator |
| Docker configuration            | ✅     | 🟡       | Local node + production       |
| Theme system (light/dark)       | ✅     | 🟡       | CSS variables                 |
| Address utilities               | ✅     | 🔴       | `lib/address.ts`              |
| Zustand state management        | ✅     | 🟡       | Installed, ready to use       |
| React Query                     | ✅     | 🟡       | Installed for data caching    |

### Explorer Foundation

| Task                        | Status | Priority | Notes                    |
| --------------------------- | ------ | -------- | ------------------------ |
| Blocks explorer             | ✅     | 🔴       | With pagination          |
| Transactions explorer       | ✅     | 🔴       | Basic view               |
| Account detail              | ✅     | 🔴       | Balance lookup           |
| Universal search            | ✅     | 🟡       | Block, tx, address       |
| Connection status indicator | ✅     | 🟡       | Header component         |
| SearchBar component         | ✅     | 🟡       | `common/SearchBar.tsx`   |
| ThemeToggle component       | ✅     | 🟡       | `common/ThemeToggle.tsx` |

### Wallet Integration

| Task                  | Status | Priority | Notes                          |
| --------------------- | ------ | -------- | ------------------------------ |
| MetaMask connection   | ✅     | 🔴       | EVM wallet                     |
| Polkadot.js extension | ✅     | 🔴       | Substrate wallet               |
| Talisman support      | ✅     | 🟡       | Multi-wallet                   |
| SubWallet support     | ✅     | 🟡       | Multi-wallet                   |
| Balance display       | ✅     | 🔴       | Real-time updates              |
| WalletProvider        | ✅     | 🔴       | `providers/WalletProvider.tsx` |

---

## Phase 2: Explorer Enhancement (Completed) ✅

### Smart Contracts

| Task               | Status | Priority | Notes                     |
| ------------------ | ------ | -------- | ------------------------- |
| ContractsExplorer  | ✅     | 🔴       | All/Verified/Proxies tabs |
| ContractDetailView | ✅     | 🔴       | Multi-tab layout          |
| CodeViewer         | ✅     | 🟡       | Syntax highlighting       |
| ReadContract       | ✅     | 🟡       | Query methods             |
| WriteContract      | ✅     | 🟡       | Execute methods           |
| EventLogs          | ✅     | 🟢       | Event filtering           |

### Token Analytics

| Task             | Status | Priority | Notes                         |
| ---------------- | ------ | -------- | ----------------------------- |
| TokensExplorer   | ✅     | 🔴       | ERC-20/721/1155 tabs          |
| TokenDetailView  | ✅     | 🔴       | Holders, transfers, inventory |
| NFT grid display | ✅     | 🟡       | Inventory tab                 |

### Analytics & Charts

| Task                   | Status | Priority | Notes                    |
| ---------------------- | ------ | -------- | ------------------------ |
| ChartsPage             | ✅     | 🟡       | Transaction/block charts |
| StatisticsPage         | ✅     | 🟡       | Comprehensive stats      |
| GasTracker enhancement | ✅     | 🟢       | Calculator, meters       |

### Governance

| Task                | Status | Priority | Notes            |
| ------------------- | ------ | -------- | ---------------- |
| GovernanceDashboard | ✅     | 🟡       | Proposal listing |
| ProposalDetailView  | ✅     | 🟡       | Multi-tab layout |
| TreasuryDashboard   | ✅     | 🟢       | Treasury stats   |

### Validators/Staking

| Task                | Status | Priority | Notes               |
| ------------------- | ------ | -------- | ------------------- |
| ValidatorsExplorer  | ✅     | 🟡       | Sorting, favorites  |
| ValidatorDetailView | ✅     | 🟡       | Nominators, rewards |
| StakingDashboard    | ✅     | 🟡       | Basic UI            |

### Developer Tools

| Task            | Status | Priority | Notes         |
| --------------- | ------ | -------- | ------------- |
| ApiDocs         | ✅     | 🟢       | REST API docs |
| DeveloperPortal | ✅     | 🟢       | SDK examples  |

---

## Phase 3: Unified Dual-VM (Completed) ✅

### Unification Layer

| Task                     | Status | Priority | Notes                      |
| ------------------------ | ------ | -------- | -------------------------- |
| Address resolver service | ✅     | 🔴       | SS58 ↔ 0x mapping          |
| User preferences store   | ✅     | 🔴       | Zustand store for settings |
| Transaction normalizer   | ✅     | 🔴       | Merge substrate + EVM txns |
| Contract aggregator      | ✅     | 🟡       | ink! + EVM contracts       |
| Token standard mapper    | ✅     | 🟡       | ERC-20 ↔ PSP-22            |

### Unified Components

| Task                        | Status | Priority | Notes                          |
| --------------------------- | ------ | -------- | ------------------------------ |
| AddressDisplay component    | ✅     | 🔴       | Format toggle, copy            |
| VMBadge component           | ✅     | 🔴       | Substrate/EVM indicator        |
| StatusBadge component       | ✅     | 🟡       | Transaction status             |
| Unified transaction list    | ✅     | 🔴       | Merged view with tabs          |
| Unified account view        | ✅     | 🔴       | Both VM balances               |
| User address format setting | ✅     | 🟡       | Persist preference             |
| Explorer integration        | ✅     | 🔴       | Components integrated in pages |

### Indexer Setup

| Task                      | Status | Priority | Notes                    |
| ------------------------- | ------ | -------- | ------------------------ |
| SubQuery project setup    | ✅     | 🔴       | `indexer/project.yaml`   |
| SubQuery schema design    | ✅     | 🔴       | `indexer/schema.graphql` |
| Frontier indexer config   | ✅     | 🔴       | EVM handlers in project  |
| Mapping handlers          | ✅     | 🔴       | Substrate + EVM handlers |
| Unification service       | ⏳     | 🟡       | Thin merging layer       |
| GraphQL API               | ✅     | 🟡       | Via SubQuery Query       |
| Historical data migration | ⏳     | 🟢       | Pre-unified-accounts     |

### Real-time Subscriptions

| Task                          | Status | Priority | Notes                                 |
| ----------------------------- | ------ | -------- | ------------------------------------- |
| Transaction subscription      | ✅     | 🔴       | `hooks/useTransactionSubscription.ts` |
| Block subscription            | ✅     | 🔴       | `hooks/useBlockSubscription.ts`       |
| Address-specific subscription | ✅     | 🟡       | Via filter options                    |
| Pending transactions          | ✅     | 🟢       | `usePendingTransactions` hook         |

---

## Implementation Notes (Phase 3)

### Completed Components

The following unified dual-VM components have been implemented:

#### 1. AddressDisplay Component (`components/common/AddressDisplay.tsx`)

- Displays addresses in user-preferred format (SS58/0x/Both)
- Toggle between formats with a single click
- Copy to clipboard functionality
- Automatic alternate address resolution
- Multiple variants: `AddressDisplay`, `AddressDisplayCompact`, `AddressDisplayFull`, `DualAddressDisplay`

#### 2. VMBadge Component (`components/common/VMBadge.tsx`)

- Visual indicator for Substrate (blue) vs EVM (purple) transactions
- Multiple variants: `VMBadge`, `VMDot`, `VMLabel`
- Size options: sm, md, lg

#### 3. StatusBadge Component (`components/common/StatusBadge.tsx`)

- Transaction status indicators (success, failed, pending, processing, etc.)
- Supports blockchain-specific statuses (finalized, in-block)
- Multiple variants: `StatusBadge`, `StatusDot`, `TransactionStatusBadge`

#### 4. User Preferences Store (`lib/stores/preferences.ts`)

- Zustand store with localStorage persistence
- Address format preference (substrate/evm/both)
- Theme, currency, and explorer preferences
- Address book (saved addresses)
- Recent searches

#### 5. Address Resolver Service (`lib/unified/address-resolver.ts`)

- SS58 ↔ 0x address conversion
- Chain-verified and derived mappings
- Address caching for performance
- Account comparison utilities

#### 6. Transaction Normalizer Service (`lib/unified/transaction-normalizer.ts`)

- Normalizes Substrate extrinsics and EVM transactions to unified format
- `normalizeSubstrateExtrinsic()` - converts Substrate extrinsics
- `normalizeEvmTransaction()` - converts EVM transactions
- `normalizeAndMergeTransactions()` - merges and sorts by timestamp
- `filterTransactions()` - filter by VM type, category, status, address, value range
- `groupTransactionsByDate()` - group for timeline display
- `calculateTransactionStats()` - aggregate statistics
- Category detection (transfer, contract_call, staking, governance, etc.)

#### 7. Contract Aggregator Service (`lib/unified/contract-aggregator.ts`)

- Unified interface for ink! (WASM) and EVM (Solidity) contracts
- `normalizeInkContract()` - normalize ink! contract with metadata
- `normalizeEvmContract()` - normalize EVM contract with ABI
- Contract standard detection (ERC-20/721/1155, PSP-22/34/37)
- Proxy detection (transparent, UUPS, beacon, diamond)
- Method/event/constructor normalization
- `mapPspToErc()` / `mapErcToPsp()` - standard mapping helpers

#### 8. Token Standard Mapper (`lib/unified/token-mapper.ts`)

- Maps ERC-20/721/1155 ↔ PSP-22/34/37 token standards
- `normalizeErc20Token()`, `normalizePsp22Token()` - fungible tokens
- `normalizeErc721Collection()`, `normalizePsp34Collection()` - NFT collections
- `normalizeErc1155Token()`, `normalizePsp37Token()` - multi-tokens
- `convertMethodEvmToInk()` / `convertMethodInkToEvm()` - method mapping
- `formatTokenAmount()` / `parseTokenAmount()` - token amount formatting
- `TokenMapper` class for batch operations and caching
- `findPairedTokens()` - find equivalent tokens on both VMs

#### 9. Explorer Integration (Completed)

The unified components have been integrated into all major explorer pages:

- **TransactionsExplorer**: Uses AddressDisplay for from/to, VMBadge for VM type, StatusDot for status
- **AccountDetail**: Uses AddressDisplay header, DualAddressDisplay for unified accounts, VMBadge
- **TransactionDetail**: Uses AddressDisplay for from/to, VMBadge in header
- **BlockDetail**: Uses AddressDisplay for validator, VMBadge in header, StatusDot for tx status
- **AccountsExplorer**: Uses AddressDisplay with identity, VMBadge for account type

---

## Phase 4: Portal Integration (Completed) ✅

### Wallet Enhancement

| Task                     | Status | Priority | Notes                                      |
| ------------------------ | ------ | -------- | ------------------------------------------ |
| Multi-account selection  | ✅     | 🔴       | `components/wallet/AccountPickerModal.tsx` |
| Signing modal            | ✅     | 🔴       | `components/wallet/SigningModal.tsx`       |
| WalletConnect v2         | ✅     | 🟡       | `components/wallet/WalletConnectV2.tsx`    |
| Nova wallet              | ⏳     | 🟢       | Mobile support                             |
| Hardware wallet (Ledger) | ⏳     | 🟢       | Future                                     |

### Account Management

| Task                | Status | Priority | Notes                                     |
| ------------------- | ------ | -------- | ----------------------------------------- |
| My Accounts page    | ✅     | 🔴       | `components/wallet/MyAccounts.tsx`        |
| Address Book        | ✅     | 🟡       | `components/wallet/AddressBook.tsx`       |
| Account tags/labels | ✅     | 🟢       | `components/identity/AccountTags.tsx`     |
| Multisig management | ✅     | 🟢       | `components/identity/MultisigManager.tsx` |
| Proxy accounts      | ✅     | 🟢       | `components/identity/ProxyManager.tsx`    |

### Identity System

| Task            | Status | Priority | Notes                                   |
| --------------- | ------ | -------- | --------------------------------------- |
| IdentityDisplay | ✅     | 🟡       | `components/common/IdentityDisplay.tsx` |
| SNS Integration | ✅     | 🔴       | `lib/sns/index.ts` - .sel domains       |
| SNS React Hooks | ✅     | 🔴       | `lib/hooks/useSNS.ts`                   |
| Domain Search   | ✅     | 🟡       | Search/register .sel domains            |
| IdentityForm    | ✅     | 🟢       | `components/identity/IdentityForm.tsx`  |
| Registrar list  | ✅     | 🟢       | `components/identity/RegistrarList.tsx` |

---

## Implementation Notes (Phase 4 - Identity Components)

### Identity Components (`components/identity/`)

#### IdentityForm (`IdentityForm.tsx`)

- Set on-chain identity with all standard fields
- Fields: Display name, Legal name, Email, Web, Twitter, Matrix, GitHub
- Fee estimation before submission
- Clear identity option with deposit return

#### MultisigManager (`MultisigManager.tsx`)

- Create multisig accounts with configurable threshold
- Add/remove signatories dynamically
- View pending multisig approvals
- Approve, reject, or cancel pending operations

#### ProxyManager (`ProxyManager.tsx`)

- Add proxy accounts with type selection (Any, NonTransfer, Governance, Staking, etc.)
- Remove existing proxies
- Time delay configuration for security
- Pure/anonymous proxy support

#### RegistrarList (`RegistrarList.tsx`)

- View all identity registrars with their fees
- Request identity judgement from registrars
- Track judgement request status
- Cancel pending requests
- View verification levels (Reasonable, KnownGood, etc.)

#### AccountTags (`AccountTags.tsx`)

- Create and manage custom tags with colors
- Label accounts with custom names, notes, and tags
- Default tags: Personal, Exchange, DeFi, Staking, Cold, Hot, Contract, Multisig
- Search and filter labeled accounts
- Local storage persistence

---

## Implementation Notes (Phase 4 - SNS Integration)

### SNS (Selendra Naming Service) Integration

The identity system is built on **sel-domains** (ENS-inspired naming service for Selendra):

#### 1. SNS Client Service (`lib/sns/index.ts`)

- **SNSClient class**: Full-featured client for .sel domain operations

  - `resolveName(domain)` - Resolve domain to addresses (EVM + Substrate)
  - `lookupAddress(address)` - Reverse lookup address to domain
  - `getProfile(domain)` - Full profile with avatar, social links, etc.
  - `isAvailable(domain)` - Check domain availability
  - `getPrice(domain, years)` - Get registration price

- **Helper functions**:

  - `namehash(domain)` - ENS-compatible domain hash
  - `labelhash(label)` - Label hash for registrar
  - `normalizeDomain(domain)` - Normalize input
  - `isValidDomain(domain)` - Validate domain format
  - `calculatePrice(label, years)` - Local price calculation

- **Contract ABIs**: SNSRegistry, PublicResolver, RegistrarController, ReverseRegistrar

#### 2. SNS React Hooks (`lib/hooks/useSNS.ts`)

- `useSNSProfile(domain)` - Fetch and cache profile by domain
- `useSNSLookup(address)` - Reverse lookup with caching
- `useSNSAvailability(domain)` - Check availability and price
- `useSNSRegistration()` - Handle domain registration flow

#### 3. Identity Components (`components/common/IdentityDisplay.tsx`)

- **IdentityBadge**: Compact display with avatar and verification badge
- **IdentityDisplay**: Full profile card with social links and expiry
- **IdentityInline**: Minimal display for tables/lists
- **DomainSearch**: Search and register .sel domains UI

#### SNS Profile Fields Supported

- `domain` - The .sel domain name
- `evmAddress` / `substrateAddress` - Linked addresses
- `avatar` - Profile image URL (IPFS supported)
- `description` - Bio text
- `email`, `url` - Contact info
- `twitter`, `github`, `telegram`, `discord` - Social links
- `contenthash` - IPFS/IPNS content hash
- `verification` - Verification level (none/self/basic/verified/official)
- `expiry` - Domain expiration timestamp

---

## Phase 5: Staking & Nomination (Completed) ✅

### UI Components

| Task                       | Status | Priority | Notes                                     |
| -------------------------- | ------ | -------- | ----------------------------------------- |
| ValidatorList component    | ✅     | 🔴       | `components/staking/ValidatorList.tsx`    |
| NominationPools component  | ✅     | 🟡       | `components/staking/NominationPools.tsx`  |
| StakingDashboard component | ✅     | 🔴       | `components/staking/StakingDashboard.tsx` |

### Read Operations

| Task                | Status | Priority | Notes                      |
| ------------------- | ------ | -------- | -------------------------- |
| Real validator data | ✅     | 🔴       | `lib/staking/index.ts`     |
| Nominator view      | ✅     | 🔴       | `useUserStaking` hook      |
| Era info display    | ✅     | 🟡       | `useEraInfo` hook          |
| APY calculations    | ✅     | 🟡       | `calculateApy` utility     |
| Rewards history     | ✅     | 🟡       | `getRewardsHistory` method |

### Write Operations

| Task                | Status | Priority | Notes                            |
| ------------------- | ------ | -------- | -------------------------------- |
| Bond tokens         | ✅     | 🔴       | `useStakingActions.bond`         |
| Nominate validators | ✅     | 🔴       | `useStakingActions.nominate`     |
| Unbond tokens       | ✅     | 🔴       | `useStakingActions.unbond`       |
| Claim rewards       | ✅     | 🔴       | `useStakingActions.claimRewards` |
| Rebond              | ✅     | 🟡       | `useStakingActions.rebond`       |
| Chill               | ✅     | 🟢       | `useStakingActions.chill`        |

### Nomination Pools

| Task             | Status | Priority | Notes                                 |
| ---------------- | ------ | -------- | ------------------------------------- |
| Pool list/search | ✅     | 🟡       | `useNominationPools` hook             |
| Join pool        | ✅     | 🟡       | `useNominationPools.joinPool`         |
| Pool rewards     | ✅     | 🟡       | `useNominationPools.claimPoolRewards` |
| Create pool      | ⏳     | 🟢       | Admin feature                         |

### EVM Staking (Precompile)

| Task                     | Status | Priority | Notes                           |
| ------------------------ | ------ | -------- | ------------------------------- |
| Precompile integration   | ✅     | 🟡       | `EvmStakingClient` at 0x...0403 |
| EVM staking UI           | ✅     | 🟡       | `useEvmStaking` hook            |
| Precompile read methods  | ✅     | 🟡       | `getMinNominatorBond`, etc.     |
| Precompile write methods | ✅     | 🟡       | `bond`, `nominate`, `unbond`    |

---

## Implementation Notes (Phase 5 - Staking)

### Staking Service (`lib/staking/index.ts`)

Complete staking service with:

#### Substrate Staking Client

- **Read Operations**:

  - `getEraInfo()` - Current/active era, session info, progress
  - `getStakingStats()` - Total staked, rates, min bonds, durations
  - `getValidators(activeOnly)` - List validators with full info
  - `getValidatorInfo(address)` - Single validator details
  - `getStakingInfo(address)` - User's bonded, unbonding, nominations
  - `getUnbondingInfo(address)` - Unbonding chunks with time estimates
  - `getRewardsHistory(address, eras)` - Historical reward payouts

- **Write Operations** (create unsigned transactions):
  - `createBondTx(value, payee)` - Initial bond
  - `createBondExtraTx(value)` - Add to existing bond
  - `createUnbondTx(value)` - Start unbonding
  - `createNominateTx(validators)` - Set nominations
  - `createWithdrawUnbondedTx()` - Withdraw after unbonding period
  - `createRebondTx(value)` - Cancel unbonding
  - `createChillTx()` - Stop nominating
  - `createSetPayeeTx(payee)` - Change reward destination
  - `createPayoutStakersTx(validator, era)` - Claim rewards
  - `createBatchPayoutTx(validator, eras)` - Claim multiple eras

#### EVM Staking Client (via Precompile)

- Address: `0x0000000000000000000000000000000000000403`
- Full precompile ABI for read/write operations
- Methods: `bond`, `bondExtra`, `unbond`, `nominate`, `chill`, `rebond`, `payoutStakers`

#### Nomination Pools Client

- `getPools()` - List all nomination pools
- `getMemberInfo(address)` - User's pool membership
- Pool operations: join, bond extra, unbond, withdraw, claim

### Staking Hooks (`lib/hooks/useStaking.ts`)

- `useStakingClient()` - Get client instances
- `useEraInfo()` - Era data with auto-refresh
- `useStakingStats()` - Network staking statistics
- `useValidators(activeOnly)` - Validator list with caching
- `useUserStaking()` - User's staking state
- `useStakingActions()` - All staking write operations
- `useEvmStaking()` - EVM staking via precompile
- `useNominationPools()` - Pool data and operations

---

## Phase 6: Governance (OpenGov) (Completed) ✅

### UI Components

| Task                          | Status | Priority | Notes                                           |
| ----------------------------- | ------ | -------- | ----------------------------------------------- |
| VoteModal component           | ✅     | 🔴       | `components/governance/VoteModal.tsx`           |
| ReferendumDetail component    | ✅     | 🟡       | `components/governance/ReferendumDetail.tsx`    |
| DelegateVotes component       | ✅     | 🟡       | `components/governance/DelegateVotes.tsx`       |
| GovernanceDashboard component | ✅     | 🔴       | `components/governance/GovernanceDashboard.tsx` |
| ProposalSubmission component  | ✅     | 🟡       | `components/governance/ProposalSubmission.tsx`  |
| TrackInfo component           | ✅     | 🟢       | `components/governance/TrackInfo.tsx`           |

### Governance Service & Hooks

| Task                | Status | Priority | Notes                           |
| ------------------- | ------ | -------- | ------------------------------- |
| Governance service  | ✅     | 🔴       | `lib/governance/index.ts`       |
| useGovernance hooks | ✅     | 🔴       | `lib/hooks/useGovernance.ts`    |
| Conviction options  | ✅     | 🟡       | 0x - 6x multiplier with lockups |
| Delegation actions  | ✅     | 🟡       | delegate, undelegate, unlock    |
| Treasury actions    | ✅     | 🟡       | proposeSpend, reject, approve   |
| Bounty actions      | ✅     | 🟢       | proposeBounty                   |

### Referenda

| Task                | Status | Priority | Notes                                 |
| ------------------- | ------ | -------- | ------------------------------------- |
| Real referenda data | ✅     | 🔴       | Via `useGovernance` hooks             |
| Vote modal          | ✅     | 🔴       | Cast vote UI                          |
| Conviction selector | ✅     | 🟡       | Lock multiplier                       |
| Delegation          | ✅     | 🟡       | Delegate votes UI                     |
| Track info          | ✅     | 🟢       | `components/governance/TrackInfo.tsx` |

### Proposals

| Task                | Status | Priority | Notes                                          |
| ------------------- | ------ | -------- | ---------------------------------------------- |
| Submit proposal     | ✅     | 🟡       | `components/governance/ProposalSubmission.tsx` |
| Preimage submission | ✅     | 🟡       | Included in ProposalSubmission                 |
| Proposal templates  | ✅     | 🟢       | Treasury, System, Governance templates         |

### Treasury

| Task               | Status | Priority | Notes                      |
| ------------------ | ------ | -------- | -------------------------- |
| Real treasury data | ✅     | 🔴       | Via `useTreasuryInfo` hook |
| Spend proposal     | ✅     | 🟡       | `createProposeSpendTx`     |
| Bounties           | ✅     | 🟢       | `createProposeBountyTx`    |
| Tips               | ⏳     | 🟢       | Tip proposals              |

---

## Implementation Notes (Phase 6 - Governance)

### Governance Service (`lib/governance/index.ts`)

Complete governance client with:

#### Referenda Operations

- `getReferenda(trackId?, status?)` - List referenda with filtering
- `getReferendumInfo(index)` - Single referendum details
- `getUserVotes(address)` - User's votes across referenda
- `getTracks()` - All governance tracks with thresholds
- `getTrackInfo(trackId)` - Single track details

#### Voting Operations (create unsigned transactions)

- `createVoteTx(referendumIndex, vote, balance)` - Standard vote
- `createRemoveVoteTx(trackId, referendumIndex)` - Remove vote
- `createDelegateTx(trackId, target, conviction, balance)` - Delegate
- `createUndelegateTx(trackId)` - Undelegate
- `createUnlockTx(trackId, target?)` - Unlock tokens

#### Treasury Operations

- `getTreasuryInfo()` - Balance, proposals, spendPeriod
- `getTreasuryProposals()` - Active proposals
- `createProposeSpendTx(value, beneficiary)` - Propose spend
- `createRejectProposalTx(proposalId)` - Reject proposal
- `createApproveProposalTx(proposalId)` - Approve proposal

#### Bounty & Tip Operations

- `getBounties()` - All bounties with status
- `getTips()` - All tip proposals
- `createProposeBountyTx(value, description)` - Create bounty

#### Delegation Management

- `getDelegations(address)` - User's delegations
- `calculateVotingPower(balance, conviction)` - Power calculation

### Governance Hooks (`lib/hooks/useGovernance.ts`)

- `useGovernanceClient()` - Get client instance
- `useReferenda(trackId?, status?)` - Referenda with filtering
- `useReferendum(index)` - Single referendum
- `useTracks()` - All governance tracks
- `useUserVotes()` - User's votes
- `useVotingActions()` - vote, removeVote, delegate, undelegate, unlock
- `useDelegations()` - User's delegations
- `useTreasuryInfo()` - Treasury balance and stats
- `useTreasuryProposals()` - Active treasury proposals
- `useTreasuryActions()` - proposeSpend, reject, approve
- `useBounties()` - All bounties
- `useTips()` - All tips
- `useBountyActions()` - proposeBounty
- `useConvictionCalculator()` - Conviction utilities

### Governance Components (Completed)

#### ProposalSubmission (`ProposalSubmission.tsx`)

- Three-step wizard: Select Track → Preimage → Submit
- Track selection with parameters display
- Use existing preimage or submit new
- Preimage hash lookup and validation
- Proposal templates for common operations
- Fee estimation before submission

#### TrackInfo (`TrackInfo.tsx`)

- List all OpenGov tracks with parameters
- Show decision deposit, periods, thresholds
- Visual timeline for referendum lifecycle
- Active referenda count per track
- Expandable cards with full details
- Search and sort functionality

---

## Phase 7: Developer Tools (Completed) ✅

### Extrinsic Builder

| Task                | Status | Priority | Notes                                       |
| ------------------- | ------ | -------- | ------------------------------------------- |
| Pallet/call browser | ✅     | 🔴       | `components/developer/ExtrinsicBuilder.tsx` |
| Parameter inputs    | ✅     | 🔴       | Dynamic type-aware form inputs              |
| Fee estimation      | ✅     | 🔴       | `paymentInfo` before signing                |
| Batch builder       | ✅     | 🟡       | `utility.batch` call support                |
| Extrinsic history   | ✅     | 🟢       | Transaction history with status             |

### Chain State Explorer

| Task                 | Status | Priority | Notes                                         |
| -------------------- | ------ | -------- | --------------------------------------------- |
| Storage query        | ✅     | 🔴       | `components/developer/ChainStateExplorer.tsx` |
| Constants explorer   | ✅     | 🟡       | View all runtime constants by pallet          |
| Storage subscription | ✅     | 🟢       | Subscribe/unsubscribe to storage changes      |
| Raw storage query    | ✅     | 🟢       | Query raw hex storage keys                    |

### RPC Calls

| Task               | Status | Priority | Notes                                 |
| ------------------ | ------ | -------- | ------------------------------------- |
| RPC method browser | ✅     | 🟡       | `components/developer/RpcBrowser.tsx` |
| Execute RPC call   | ✅     | 🟡       | Test calls with parameter inputs      |
| Custom JSON-RPC    | ✅     | 🟢       | Section-based RPC method organization |

### ink! Contracts

| Task                 | Status | Priority | Notes                                        |
| -------------------- | ------ | -------- | -------------------------------------------- |
| Contract upload      | ✅     | 🟡       | `components/developer/InkContracts.tsx`      |
| Contract instantiate | ✅     | 🟡       | Deploy with constructor args, gas, endowment |
| Contract query       | ✅     | 🟡       | Read-only message execution                  |
| Contract call        | ✅     | 🟡       | Mutating message execution with signing      |

### Utility Tools

| Task              | Status | Priority | Notes                                       |
| ----------------- | ------ | -------- | ------------------------------------------- |
| Sign message      | ✅     | 🟢       | `components/developer/UtilityTools.tsx`     |
| Verify signature  | ✅     | 🟢       | Signature verification with address         |
| Address converter | ✅     | 🟢       | SS58 formats (multiple prefixes), hex, EVM  |
| Hash calculator   | ✅     | 🟢       | Blake2, SHA-256, Keccak-256, XX-Hash        |
| SCALE decoder     | ✅     | 🟢       | Encode/decode common types (u32-u128, etc.) |
| JS Console        | ⏳     | 🟢       | Interactive console (future)                |

---

## Implementation Notes (Phase 7 - Developer Tools)

### Developer Components (`components/developer/`)

#### ExtrinsicBuilder (`ExtrinsicBuilder.tsx`)

- Browse all pallets and extrinsics from chain metadata
- Dynamic parameter input fields based on argument types
- Fee estimation before signing
- Transaction submission with wallet integration
- Extrinsic history with status tracking (pending/success/failed)

#### ChainStateExplorer (`ChainStateExplorer.tsx`)

- Three tabs: Storage, Constants, Raw
- Browse storage items organized by pallet
- Query storage with optional map keys
- View runtime constants with full values
- Subscribe to storage changes for live updates
- Raw storage key queries with hex output

#### RpcBrowser (`RpcBrowser.tsx`)

- Browse all RPC methods organized by section
- Execute RPC calls with parameter inputs
- View results with JSON formatting
- Connection status indicator
- Response timing metrics

#### InkContracts (`InkContracts.tsx`)

- Deploy tab: Upload .wasm code and metadata .json
- Configure endowment, gas limit, salt
- Interact tab: Manage deployed contracts
- Execute read-only queries (free)
- Execute mutating calls (requires signing)
- View execution results and gas usage

#### UtilityTools (`UtilityTools.tsx`)

- Sign/Verify tab: Sign messages with Substrate wallet, verify signatures
- Address tab: Convert between SS58 prefixes, hex, and EVM formats
- Hash tab: Calculate Blake2-256, SHA-256, Keccak-256, XX-Hash
- SCALE tab: Encode/decode SCALE codec types (u32, u64, u128, AccountId, etc.)

---

## Phase 8: Production Readiness 🔄

> **This phase is now tracked via the Production Readiness Stages (A-E) above.**

### Performance

| Task                      | Status | Priority | Notes         |
| ------------------------- | ------ | -------- | ------------- |
| Virtual scrolling         | ⏳     | 🟡       | Stage E       |
| Data caching optimization | ⏳     | 🟡       | Stage E       |
| Bundle size audit         | ⏳     | 🟢       | Stage E       |
| Image optimization        | ⏳     | 🟢       | Next.js Image |

### Accessibility

| Task                  | Status | Priority | Notes         |
| --------------------- | ------ | -------- | ------------- |
| Keyboard navigation   | ⏳     | 🟡       | Tab order     |
| Screen reader support | ⏳     | 🟡       | ARIA labels   |
| Color contrast audit  | ⏳     | 🟢       | WCAG 2.1 AA   |
| Focus indicators      | ⏳     | 🟢       | Visible focus |

### Testing

| Task                    | Status | Priority | Notes                 |
| ----------------------- | ------ | -------- | --------------------- |
| Unit tests (core utils) | ⏳     | 🔴       | Stage D - Vitest      |
| Component tests         | ⏳     | 🟡       | React Testing Library |
| E2E tests               | ⏳     | 🔴       | Stage D - Playwright  |
| Visual regression       | ⏳     | ⚪       | Chromatic             |

### Monitoring

| Task              | Status | Priority | Notes                 |
| ----------------- | ------ | -------- | --------------------- |
| Error tracking    | ⏳     | 🔴       | Stage C - Sentry      |
| Analytics         | ⏳     | 🟢       | Plausible             |
| Health endpoint   | ⏳     | 🔴       | Stage C - /api/health |
| Uptime monitoring | ⏳     | 🟡       | Stage C               |

### Documentation

| Task               | Status | Priority | Notes                  |
| ------------------ | ------ | -------- | ---------------------- |
| User guide         | ⏳     | 🟡       | How to use             |
| API documentation  | ⏳     | 🟡       | Endpoint docs          |
| Contributing guide | ⏳     | 🟢       | For developers         |
| Architecture docs  | ✅     | 🟢       | `docs/architecture.md` |

---

## Future Phases (Post-Launch)

### Phase 9: Bridge Integration

| Task                  | Status | Priority | Notes                |
| --------------------- | ------ | -------- | -------------------- |
| Bridge UI             | ⏳     | 🟡       | Cross-chain transfer |
| LayerZero integration | ⏳     | 🟡       | OFT support          |
| XCMP support          | ⏳     | 🟢       | Polkadot XCM         |

### Phase 10: DeFi Integration (Partial) 🔄

| Task                        | Status | Priority | Notes                                   |
| --------------------------- | ------ | -------- | --------------------------------------- |
| SwapInterface component     | ✅     | 🟡       | `components/defi/SwapInterface.tsx`     |
| LiquidityProvider component | ✅     | 🟢       | `components/defi/LiquidityProvider.tsx` |
| LendingDashboard component  | ✅     | 🟢       | `components/defi/LendingDashboard.tsx`  |
| DeFiDashboard component     | ✅     | 🟡       | `components/defi/DeFiDashboard.tsx`     |
| DEX precompile integration  | ⏳     | 🟡       | Real swap execution                     |
| DEX aggregator              | ⏳     | 🟢       | Best route finder                       |

### Phase 11: NFT Marketplace

| Task         | Status | Priority | Notes              |
| ------------ | ------ | -------- | ------------------ |
| NFT explorer | ⏳     | 🟢       | Collection browser |
| NFT trading  | ⏳     | 🟢       | Buy/sell/auction   |

### Phase 12: Mobile App

| Task               | Status | Priority | Notes              |
| ------------------ | ------ | -------- | ------------------ |
| React Native app   | ⏳     | ⚪       | iOS/Android        |
| Push notifications | ⏳     | ⚪       | Transaction alerts |

---

## Quick Reference: Next Actions

### Recently Completed ✅

1. ✅ Create `AddressDisplay` component with format toggle
2. ✅ Create `VMBadge` component
3. ✅ Create `StatusBadge` component
4. ✅ Implement address resolver service
5. ✅ Create user preferences Zustand store
6. ✅ Add address format setting to Settings page
7. ✅ Create unified transaction list component
8. ✅ Create unified account view component
9. ✅ Integrate unified components into explorer pages
10. ✅ Transaction normalizer service (`lib/unified/transaction-normalizer.ts`)
11. ✅ Contract aggregator (`lib/unified/contract-aggregator.ts`)
12. ✅ Token standard mapper (`lib/unified/token-mapper.ts`)
13. ✅ SubQuery indexer setup (`indexer/` directory)
14. ✅ Real-time subscription hooks (`lib/hooks/`)
15. ✅ Multi-account wallet picker modal (`components/wallet/AccountPickerModal.tsx`)
16. ✅ Transaction signing modal (`components/wallet/SigningModal.tsx`)

#### Phase 4 Completed (Nov 2025)

17. ✅ My Accounts page (`components/wallet/MyAccounts.tsx`)
18. ✅ Address Book UI (`components/wallet/AddressBook.tsx`)
19. ✅ WalletConnect v2 (`components/wallet/WalletConnectV2.tsx`)
20. ✅ Identity display component (`components/common/IdentityDisplay.tsx`)
21. ✅ SNS client service (`lib/sns/index.ts`) - Full .sel domain support
22. ✅ SNS React hooks (`lib/hooks/useSNS.ts`) - Profile, lookup, registration

#### Phase 5-6 UI Components (Nov 2025)

23. ✅ ValidatorList (`components/staking/ValidatorList.tsx`)
24. ✅ NominationPools (`components/staking/NominationPools.tsx`)
25. ✅ VoteModal (`components/governance/VoteModal.tsx`)
26. ✅ ReferendumDetail (`components/governance/ReferendumDetail.tsx`)
27. ✅ DelegateVotes (`components/governance/DelegateVotes.tsx`)

#### Phase 5 Staking Chain Integration (Nov 2025)

31. ✅ Staking service (`lib/staking/index.ts`) - Full Substrate + EVM staking
32. ✅ Staking hooks (`lib/hooks/useStaking.ts`) - React hooks for all operations
33. ✅ Real validator data from chain state - `useValidators` hook
34. ✅ Bond/Nominate/Unbond operations with signing - `useStakingActions`
35. ✅ EVM staking precompile integration - `EvmStakingClient` at 0x...0403
36. ✅ Nomination pools support - `useNominationPools` hook

#### Phase 7 DeFi Components (Nov 2025)

28. ✅ SwapInterface (`components/defi/SwapInterface.tsx`)
29. ✅ LiquidityProvider (`components/defi/LiquidityProvider.tsx`)
30. ✅ LendingDashboard (`components/defi/LendingDashboard.tsx`)

#### Phase 4 Identity Components (Latest)

37. ✅ IdentityForm (`components/identity/IdentityForm.tsx`) - On-chain identity
38. ✅ MultisigManager (`components/identity/MultisigManager.tsx`) - Multisig accounts
39. ✅ ProxyManager (`components/identity/ProxyManager.tsx`) - Proxy accounts
40. ✅ RegistrarList (`components/identity/RegistrarList.tsx`) - Registrar judgements
41. ✅ AccountTags (`components/identity/AccountTags.tsx`) - Account labels/tags

#### Phase 6 Governance Additions (Latest)

42. ✅ ProposalSubmission (`components/governance/ProposalSubmission.tsx`) - Create proposals
43. ✅ TrackInfo (`components/governance/TrackInfo.tsx`) - OpenGov tracks display

#### Phase 7 Developer Tools (Latest)

44. ✅ ChainStateExplorer (`components/developer/ChainStateExplorer.tsx`)
45. ✅ RpcBrowser (`components/developer/RpcBrowser.tsx`)
46. ✅ InkContracts (`components/developer/InkContracts.tsx`)
47. ✅ UtilityTools (`components/developer/UtilityTools.tsx`)

#### RPC Architecture Overhaul (Nov 29, 2025)

48. ✅ Hybrid RPC fallback architecture (`BlockchainProvider.tsx`)
49. ✅ Removed all mock data - real blockchain data only
50. ✅ Connection source tracking ("local" / "public")
51. ✅ Active endpoints exposed for debugging
52. ✅ Chain ID verification (1961 mainnet / 1953 testnet)
53. ✅ Real validator count from chain state

### Immediate (Next Sprint) - Remaining Items

> **Note**: These items are now superseded by the Production Readiness Stages above.  
> Focus should shift to Stages A-E before adding new features.

1. ⏳ **Stage A**: Deploy SubQuery indexer to production
2. ⏳ **Stage B**: Replace all mock data with real data
3. ⏳ **Stage C**: Integrate Sentry error tracking
4. ⏳ **Stage D**: Set up E2E tests with Playwright
5. ⏳ Phase 3: Unification service (thin merging layer) - Deferred
6. ⏳ Phase 3: Historical data migration - Requires indexer
7. ⏳ Phase 6: Tips component - Low priority
8. ⏳ Phase 4: Nova wallet mobile support - Future
9. ⏳ Phase 4: Hardware wallet (Ledger) support - Future
10. ⏳ Phase 7: JS Console (interactive REPL) - Future

### Future Sprint - Polish & Production

1. ⏳ Virtual scrolling for large lists (Stage E)
2. ⏳ Data caching optimization (Stage E)
3. ⏳ Accessibility improvements
4. ⏳ Additional unit tests (Stage D expansion)
5. ⏳ Documentation

---

## 📈 Version History

| Version      | Date         | Changes                                                                                    |
| ------------ | ------------ | ------------------------------------------------------------------------------------------ |
| 1.1.0-beta.4 | Nov 29, 2025 | Stage A complete (local): SubQuery indexer syncing, GraphQL API working                    |
| 1.1.0-beta.3 | Nov 29, 2025 | Stages B/C/D complete: GraphQL client, indexer hooks, Sentry, Vitest, Playwright, 31 tests |
| 1.1.0-beta.2 | Nov 29, 2025 | Hybrid RPC architecture, removed mock data, connection source tracking                     |
| 1.1.0-beta.1 | Nov 29, 2025 | Added Production Readiness Stages, gap analysis, priority order                            |
| 1.0.0-beta.1 | Nov 2025     | Initial beta with Phases 1-7 complete                                                      |

---

## 🎯 Success Criteria for v1.1.0 Release

Before releasing v1.1.0, the following must be complete:

- [x] SubQuery indexer deployed and syncing (local Docker ✅, production ⏳)
- [x] All explorer pages using real data (no mock fallback)
- [x] Sentry error tracking configured
- [x] Health endpoint returning accurate status
- [x] Unit tests for core utilities (31 passing)
- [ ] E2E tests for critical paths passing
- [ ] Lighthouse Performance Score > 85
- [ ] 95%+ uptime over 2 weeks on testnet

---

_Document Version: 1.1.0-beta.4_  
_Last Updated: November 29, 2025_  
_Project: Selendra Terminal_
