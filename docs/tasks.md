# Selendra Terminal - Development Tasks

> **Actionable task list for implementation**

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

## Phase 1: Foundation (Completed) ✅

### Core Infrastructure

| Task                            | Status | Priority | Notes                      |
| ------------------------------- | ------ | -------- | -------------------------- |
| RPC Connection with retry logic | ✅     | 🔴       | `BlockchainProvider.tsx`   |
| WebSocket reconnection handling | ✅     | 🔴       | Auto-reconnect implemented |
| Real block subscription         | ✅     | 🔴       | `subscribeNewHeads`        |
| EVM integration                 | ✅     | 🔴       | Dual VM support            |
| Docker configuration            | ✅     | 🟡       | Local node + production    |
| Theme system (light/dark)       | ✅     | 🟡       | CSS variables              |

### Explorer Foundation

| Task                        | Status | Priority | Notes              |
| --------------------------- | ------ | -------- | ------------------ |
| Blocks explorer             | ✅     | 🔴       | With pagination    |
| Transactions explorer       | ✅     | 🔴       | Basic view         |
| Account detail              | ✅     | 🔴       | Balance lookup     |
| Universal search            | ✅     | 🟡       | Block, tx, address |
| Connection status indicator | ✅     | 🟡       | Header component   |

### Wallet Integration

| Task                  | Status | Priority | Notes             |
| --------------------- | ------ | -------- | ----------------- |
| MetaMask connection   | ✅     | 🔴       | EVM wallet        |
| Polkadot.js extension | ✅     | 🔴       | Substrate wallet  |
| Talisman support      | ✅     | 🟡       | Multi-wallet      |
| SubWallet support     | ✅     | 🟡       | Multi-wallet      |
| Balance display       | ✅     | 🔴       | Real-time updates |

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

## Phase 3: Unified Dual-VM (Current Focus)

### Unification Layer

| Task                     | Status | Priority | Notes                      |
| ------------------------ | ------ | -------- | -------------------------- |
| Address resolver service | ⏳     | 🔴       | SS58 ↔ 0x mapping          |
| Transaction normalizer   | ⏳     | 🔴       | Merge substrate + EVM txns |
| Contract aggregator      | ⏳     | 🟡       | ink! + EVM contracts       |
| Token standard mapper    | ⏳     | 🟡       | ERC-20 ↔ PSP-22            |

### Unified Components

| Task                        | Status | Priority | Notes                   |
| --------------------------- | ------ | -------- | ----------------------- |
| AddressDisplay component    | ⏳     | 🔴       | Format toggle, copy     |
| VMBadge component           | ⏳     | 🔴       | Substrate/EVM indicator |
| Unified transaction list    | ⏳     | 🔴       | Merged view with tabs   |
| Unified account view        | ⏳     | 🔴       | Both VM balances        |
| User address format setting | ⏳     | 🟡       | Persist preference      |

### Indexer Setup

| Task                      | Status | Priority | Notes                |
| ------------------------- | ------ | -------- | -------------------- |
| SubQuery project setup    | ⏳     | 🔴       | Substrate indexing   |
| SubQuery schema design    | ⏳     | 🔴       | See tech.md          |
| Frontier indexer config   | ⏳     | 🔴       | EVM indexing         |
| Unification service       | ⏳     | 🟡       | Thin merging layer   |
| GraphQL API               | ⏳     | 🟡       | Unified queries      |
| Historical data migration | ⏳     | 🟢       | Pre-unified-accounts |

---

## Phase 4: Portal Integration

### Wallet Enhancement

| Task                     | Status | Priority | Notes                    |
| ------------------------ | ------ | -------- | ------------------------ |
| Multi-account selection  | ⏳     | 🔴       | Account picker UI        |
| Signing modal            | ⏳     | 🔴       | Transaction confirmation |
| WalletConnect v2         | ⏳     | 🟡       | Mobile wallet support    |
| Nova wallet              | ⏳     | 🟢       | Mobile support           |
| Hardware wallet (Ledger) | ⏳     | 🟢       | Future                   |

### Account Management

| Task                | Status | Priority | Notes                  |
| ------------------- | ------ | -------- | ---------------------- |
| My Accounts page    | ⏳     | 🔴       | Connected accounts     |
| Address Book        | ⏳     | 🟡       | Saved contacts         |
| Account tags/labels | ⏳     | 🟢       | Custom labels          |
| Multisig management | ⏳     | 🟢       | Create/manage multisig |
| Proxy accounts      | ⏳     | 🟢       | Proxy relationships    |

### Identity System

| Task            | Status | Priority | Notes                  |
| --------------- | ------ | -------- | ---------------------- |
| IdentityDisplay | ⏳     | 🟡       | Show verified identity |
| IdentityForm    | ⏳     | 🟢       | Set on-chain identity  |
| Registrar list  | ⏳     | 🟢       | Request judgement      |

---

## Phase 5: Staking & Nomination

### Read Operations

| Task                | Status | Priority | Notes              |
| ------------------- | ------ | -------- | ------------------ |
| Real validator data | ⏳     | 🔴       | From chain state   |
| Nominator view      | ⏳     | 🔴       | User's nominations |
| Era info display    | ⏳     | 🟡       | Current/next era   |
| APY calculations    | ⏳     | 🟡       | Estimated returns  |
| Rewards history     | ⏳     | 🟡       | Historical payouts |

### Write Operations

| Task                | Status | Priority | Notes             |
| ------------------- | ------ | -------- | ----------------- |
| Bond tokens         | ⏳     | 🔴       | Stake SEL         |
| Nominate validators | ⏳     | 🔴       | Select validators |
| Unbond tokens       | ⏳     | 🔴       | 28-day unlock     |
| Claim rewards       | ⏳     | 🔴       | Payout stakers    |
| Rebond              | ⏳     | 🟡       | Cancel unbonding  |
| Chill               | ⏳     | 🟢       | Stop nominating   |

### Nomination Pools

| Task             | Status | Priority | Notes              |
| ---------------- | ------ | -------- | ------------------ |
| Pool list/search | ⏳     | 🟡       | Browse pools       |
| Join pool        | ⏳     | 🟡       | Pool staking       |
| Pool rewards     | ⏳     | 🟡       | Claim pool rewards |
| Create pool      | ⏳     | 🟢       | Admin feature      |

### EVM Staking (Precompile)

| Task                     | Status | Priority | Notes                |
| ------------------------ | ------ | -------- | -------------------- |
| Precompile integration   | ⏳     | 🟡       | 0x...0403            |
| EVM staking UI           | ⏳     | 🟡       | MetaMask staking     |
| Precompile read methods  | ⏳     | 🟡       | stake_of, validators |
| Precompile write methods | ⏳     | 🟡       | nominate, bond       |

---

## Phase 6: Governance (OpenGov)

### Referenda

| Task                | Status | Priority | Notes             |
| ------------------- | ------ | -------- | ----------------- |
| Real referenda data | ⏳     | 🔴       | From chain        |
| Vote modal          | ⏳     | 🔴       | Cast vote         |
| Conviction selector | ⏳     | 🟡       | Lock multiplier   |
| Delegation          | ⏳     | 🟡       | Delegate votes    |
| Track info          | ⏳     | 🟢       | Governance tracks |

### Proposals

| Task                | Status | Priority | Notes            |
| ------------------- | ------ | -------- | ---------------- |
| Submit proposal     | ⏳     | 🟡       | Create proposal  |
| Preimage submission | ⏳     | 🟡       | Proposal content |
| Proposal templates  | ⏳     | 🟢       | Common types     |

### Treasury

| Task               | Status | Priority | Notes              |
| ------------------ | ------ | -------- | ------------------ |
| Real treasury data | ⏳     | 🔴       | Balance, proposals |
| Spend proposal     | ⏳     | 🟡       | Request funds      |
| Bounties           | ⏳     | 🟢       | Bounty management  |
| Tips               | ⏳     | 🟢       | Tip proposals      |

---

## Phase 7: Developer Tools

### Extrinsic Builder

| Task                | Status | Priority | Notes              |
| ------------------- | ------ | -------- | ------------------ |
| Pallet/call browser | ⏳     | 🔴       | From metadata      |
| Parameter inputs    | ⏳     | 🔴       | Type-aware forms   |
| Fee estimation      | ⏳     | 🔴       | Before signing     |
| Batch builder       | ⏳     | 🟡       | utility.batch      |
| Extrinsic history   | ⏳     | 🟢       | Recent submissions |

### Chain State Explorer

| Task                 | Status | Priority | Notes               |
| -------------------- | ------ | -------- | ------------------- |
| Storage query        | ⏳     | 🔴       | Query storage items |
| Constants explorer   | ⏳     | 🟡       | View constants      |
| Storage subscription | ⏳     | 🟢       | Watch changes       |
| Raw storage query    | ⏳     | 🟢       | Advanced            |

### RPC Calls

| Task               | Status | Priority | Notes             |
| ------------------ | ------ | -------- | ----------------- |
| RPC method browser | ⏳     | 🟡       | Available methods |
| Execute RPC call   | ⏳     | 🟡       | Test calls        |
| Custom JSON-RPC    | ⏳     | 🟢       | Raw requests      |

### ink! Contracts

| Task                 | Status | Priority | Notes            |
| -------------------- | ------ | -------- | ---------------- |
| Contract upload      | ⏳     | 🟡       | Upload .contract |
| Contract instantiate | ⏳     | 🟡       | Deploy with args |
| Contract query       | ⏳     | 🟡       | Read state       |
| Contract call        | ⏳     | 🟡       | Execute methods  |

### Utility Tools

| Task              | Status | Priority | Notes                  |
| ----------------- | ------ | -------- | ---------------------- |
| Sign message      | ⏳     | 🟢       | Arbitrary signing      |
| Verify signature  | ⏳     | 🟢       | Signature verification |
| Address converter | ⏳     | 🟢       | SS58 formats           |
| Hash calculator   | ⏳     | 🟢       | Various hashes         |
| SCALE decoder     | ⏳     | 🟢       | Codec decoder          |
| JS Console        | ⏳     | 🟢       | Interactive console    |

---

## Phase 8: Polish & Production

### Performance

| Task                      | Status | Priority | Notes          |
| ------------------------- | ------ | -------- | -------------- |
| Virtual scrolling         | ⏳     | 🟡       | Large lists    |
| Data caching optimization | ⏳     | 🟡       | React Query    |
| Bundle size audit         | ⏳     | 🟢       | Reduce JS size |
| Image optimization        | ⏳     | 🟢       | Next.js Image  |

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
| Unit tests (core utils) | ⏳     | 🟡       | Jest/Vitest           |
| Component tests         | ⏳     | 🟢       | React Testing Library |
| E2E tests               | ⏳     | 🟢       | Playwright            |
| Visual regression       | ⏳     | ⚪       | Chromatic             |

### Monitoring

| Task              | Status | Priority | Notes            |
| ----------------- | ------ | -------- | ---------------- |
| Error tracking    | ⏳     | 🟡       | Sentry           |
| Analytics         | ⏳     | 🟢       | Plausible        |
| Health endpoint   | ⏳     | 🟢       | /api/health      |
| Uptime monitoring | ⏳     | 🟢       | External service |

### Documentation

| Task               | Status | Priority | Notes             |
| ------------------ | ------ | -------- | ----------------- |
| User guide         | ⏳     | 🟡       | How to use        |
| API documentation  | ⏳     | 🟡       | Endpoint docs     |
| Contributing guide | ⏳     | 🟢       | For developers    |
| Architecture docs  | ⏳     | 🟢       | Technical details |

---

## Future Phases (Post-Launch)

### Phase 9: Bridge Integration

| Task                  | Status | Priority | Notes                |
| --------------------- | ------ | -------- | -------------------- |
| Bridge UI             | ⏳     | 🟡       | Cross-chain transfer |
| LayerZero integration | ⏳     | 🟡       | OFT support          |
| XCMP support          | ⏳     | 🟢       | Polkadot XCM         |

### Phase 10: DeFi Integration

| Task                | Status | Priority | Notes         |
| ------------------- | ------ | -------- | ------------- |
| DEX precompile UI   | ⏳     | 🟡       | Token swaps   |
| Liquidity provision | ⏳     | 🟢       | LP management |
| DEX aggregator      | ⏳     | 🟢       | Best route    |

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

### Immediate (This Sprint)

1. ⏳ Create `AddressDisplay` component with format toggle
2. ⏳ Create `VMBadge` component
3. ⏳ Implement address resolver service
4. ⏳ Set up SubQuery project structure
5. ⏳ Add user preference for address format

### Next Sprint

1. ⏳ Transaction normalizer service
2. ⏳ Unified transaction list component
3. ⏳ Unified account view
4. ⏳ SubQuery schema and mappings
5. ⏳ Multi-account wallet selection

---

_Document Version: 1.0_  
_Last Updated: 2025_  
_Project: Selendra Terminal_
