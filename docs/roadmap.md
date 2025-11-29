# Selendra Terminal - Roadmap

> **The unified dual-VM blockchain explorer & portal for Selendra**

---

## Vision

Selendra Terminal will be the **single, definitive interface** for the Selendra ecosystem, replacing:

- Traditional block explorers (EVM-only)
- Polkadot.js Apps portal
- Multiple fragmented tools

One unified experience for **exploration, wallet operations, staking, governance, and development**.

---

## Release Timeline

```
2025 Q1                    2025 Q2                    2025 Q3
────────────────────────────────────────────────────────────────────────
  │                           │                           │
  ▼                           ▼                           ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│    v1.0      │        │    v2.0      │        │    v3.0      │
│  Foundation  │───────▶│   Portal     │───────▶│    DeFi      │
│  + Unified   │        │  Features    │        │   + Bridge   │
│   Explorer   │        │              │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## v1.0 - Unified Explorer (Q1 2025)

**Goal**: Complete block explorer with dual-VM unification

### Core Features

| Feature                  | Description                                 | Status |
| ------------------------ | ------------------------------------------- | ------ |
| **Unified Blocks**       | Single timeline of Substrate + EVM blocks   | ⏳     |
| **Unified Transactions** | Merged extrinsic + EVM tx list with filters | 🔄     |
| **Unified Accounts**     | SS58 ↔ 0x address linking                   | 🔄     |
| **Unified Contracts**    | ink! + Solidity contracts in one view       | ⏳     |
| **Unified Tokens**       | ERC-20/PSP-22, ERC-721/PSP-34 with tabs     | ⏳     |

### Completed Foundation

| Feature              | Description                      | Status |
| -------------------- | -------------------------------- | ------ |
| Block Explorer       | Real-time blocks with pagination | ✅     |
| Transaction Explorer | Extrinsic decoding               | ✅     |
| Account Detail       | Balance lookup                   | ✅     |
| Universal Search     | Block, tx, address search        | ✅     |
| Wallet Connection    | MetaMask, Polkadot.js, Talisman  | ✅     |
| Theme System         | Light/dark/system                | ✅     |
| Docker Setup         | Local node + production          | ✅     |
| AddressDisplay       | Format toggle, copy, resolve     | ✅     |
| VMBadge              | Substrate/EVM indicator          | ✅     |
| StatusBadge          | Transaction status indicators    | ✅     |
| User Preferences     | Zustand store with persistence   | ✅     |
| Address Resolver     | SS58 ↔ 0x conversion             | ✅     |

### v1.0 Deliverables

- [x] AddressDisplay component with format toggle
- [x] VMBadge component (Substrate/EVM indicator)
- [x] StatusBadge component (transaction status)
- [x] User setting for preferred address format
- [x] Address resolver service
- [x] Unified transaction list component
- [x] Unified account view component
- [ ] SubQuery indexer setup
- [ ] Historical data support
- [ ] Real data integration (replace mock data)

### Timeline: 6-8 weeks

---

## v2.0 - Portal Features (Q2 2025)

**Goal**: Full Polkadot.js Apps functionality in Terminal

### Account Management

| Feature          | Description               | Priority |
| ---------------- | ------------------------- | -------- |
| My Accounts      | Connected wallet accounts | 🔴       |
| Address Book     | Saved contacts            | 🟡       |
| Account Creation | Generate new accounts     | 🟢       |
| Multisig         | Create/manage multisig    | 🟢       |
| Proxy Accounts   | Proxy relationships       | 🟢       |

### Staking & Nomination

| Feature           | Description                | Priority |
| ----------------- | -------------------------- | -------- |
| Staking Dashboard | Real validator data, APY   | 🔴       |
| Bond/Unbond       | Stake/unstake tokens       | 🔴       |
| Nominate          | Select validators          | 🔴       |
| Claim Rewards     | Payout stakers             | 🔴       |
| Nomination Pools  | Pool staking               | 🟡       |
| EVM Staking       | Via precompile (0x...0403) | 🟡       |

### Governance (OpenGov)

| Feature           | Description                     | Priority |
| ----------------- | ------------------------------- | -------- |
| Referenda         | View and vote on proposals      | 🔴       |
| Treasury          | View treasury, submit proposals | 🟡       |
| Conviction Voting | Lock multiplier                 | 🟡       |
| Delegation        | Delegate voting power           | 🟢       |
| Bounties          | Bounty program                  | 🟢       |

### Developer Tools

| Feature           | Description               | Priority |
| ----------------- | ------------------------- | -------- |
| Extrinsic Builder | Build & submit extrinsics | 🔴       |
| Chain State       | Query storage items       | 🔴       |
| RPC Calls         | Execute RPC methods       | 🟡       |
| ink! Contracts    | Deploy & interact         | 🟡       |
| JS Console        | Interactive API console   | 🟢       |

### v2.0 Deliverables

- [ ] Full staking workflow (bond, nominate, claim)
- [ ] Governance voting with conviction
- [ ] Treasury proposal submission
- [ ] Extrinsic builder with type-aware inputs
- [ ] Chain state explorer
- [ ] ink! contract deployment

### Timeline: 10-12 weeks

---

## v3.0 - DeFi & Bridge (Q3 2025)

**Goal**: Cross-chain and DeFi capabilities

### Bridge Integration

| Feature         | Description                      | Priority |
| --------------- | -------------------------------- | -------- |
| Bridge UI       | Cross-chain transfer interface   | 🔴       |
| LayerZero       | OFT token bridging               | 🟡       |
| XCMP            | Polkadot parachain transfers     | 🟢       |
| Bridge Tracking | Transaction status across chains | 🟡       |

### DeFi Features

| Feature         | Description                | Priority |
| --------------- | -------------------------- | -------- |
| DEX Interface   | Token swaps via precompile | 🔴       |
| Liquidity Pools | Add/remove liquidity       | 🟡       |
| Yield Farming   | Farm rewards               | 🟢       |
| Portfolio       | Aggregate holdings         | 🟡       |

### v3.0 Deliverables

- [ ] Cross-chain bridge to Ethereum, BNB Chain
- [ ] DEX precompile integration (0x...0408)
- [ ] Liquidity provision UI
- [ ] Portfolio tracking dashboard
- [ ] Price feeds integration

### Timeline: 12-14 weeks

---

## Future Releases (2025 Q4+)

### v4.0 - NFT & Marketplace

- NFT collection explorer
- NFT minting interface
- Marketplace (buy/sell/auction)
- Batch operations

### v5.0 - Mobile & Advanced

- React Native mobile app
- Push notifications
- Hardware wallet (Ledger)
- Advanced analytics

### v6.0 - Ecosystem Integration

- sUSD stablecoin features
- Merchant gateway
- Payment requests
- Invoice management

---

## Architecture Evolution

### Current State (v0.x)

```
┌─────────────────────────────────────────┐
│           Selendra Terminal              │
├─────────────────────────────────────────┤
│  Next.js Frontend                        │
│  ├─ BlockchainProvider (Substrate)       │
│  └─ EVM Provider (ethers)                │
├─────────────────────────────────────────┤
│  Direct RPC Queries                      │
│  ├─ wss://rpc.selendra.org              │
│  └─ https://rpc-evm.selendra.org        │
└─────────────────────────────────────────┘
```

### v1.0 Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                      Selendra Terminal                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend                                                │
│  ├─ Unified Components (AddressDisplay, VMBadge, etc.)          │
│  ├─ BlockchainProvider (Substrate + EVM)                        │
│  └─ WalletProvider (Multi-wallet)                               │
├─────────────────────────────────────────────────────────────────┤
│  Unification Layer                                               │
│  ├─ Address Resolver (SS58 ↔ 0x)                                │
│  ├─ Transaction Normalizer                                       │
│  └─ Contract Aggregator                                          │
├─────────────────────────────────────────────────────────────────┤
│  Hybrid Indexer                                                  │
│  ├─ SubQuery (Substrate events, extrinsics)                     │
│  ├─ Frontier (EVM transactions, logs)                           │
│  └─ Unification Service (merge layer)                           │
├─────────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                                │
│  ├─ Selendra Substrate Node                                      │
│  └─ Frontier EVM                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### v3.0+ Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                      Selendra Terminal                           │
├─────────────────────────────────────────────────────────────────┤
│  Presentation Layer                                              │
│  ├─ Explorer    │ Accounts   │ Staking   │ Governance          │
│  ├─ DeFi        │ Bridge     │ NFTs      │ Developer           │
│  └─ Portfolio   │ Settings   │ Mobile    │                     │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                   │
│  ├─ GraphQL API (Unified queries)                               │
│  ├─ WebSocket (Real-time subscriptions)                         │
│  ├─ Price Oracle (Token prices)                                 │
│  └─ Bridge Service (Cross-chain tracking)                       │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├─ SubQuery Indexer    │ Frontier Indexer                      │
│  ├─ Unification DB      │ Cache (Redis)                         │
│  └─ Analytics DB        │ Time-series data                      │
├─────────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                                │
│  ├─ Selendra         │ Ethereum    │ BNB Chain                  │
│  ├─ Polkadot Relay   │ Asset Hub   │ Other Parachains           │
│  └─ Bridge Contracts │ LayerZero   │ Axelar                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### v1.0 Goals

| Metric                | Target    |
| --------------------- | --------- |
| Page Load             | < 2s      |
| Block Display Latency | < 1s      |
| Search Response       | < 500ms   |
| Uptime                | 99.9%     |
| Mobile Responsive     | All pages |

### v2.0 Goals

| Metric               | Target           |
| -------------------- | ---------------- |
| Staking Transactions | 1,000+ processed |
| Governance Votes     | 100+ cast        |
| Daily Active Users   | 500+             |
| Wallet Connections   | 1,000+           |

### v3.0 Goals

| Metric                   | Target  |
| ------------------------ | ------- |
| Bridge Volume            | $1M+    |
| DEX Transactions         | 10,000+ |
| Cross-chain Success Rate | 99%+    |
| Monthly Active Users     | 5,000+  |

### Ultimate Goals

| Metric                     | Target          |
| -------------------------- | --------------- |
| Monthly Active Users       | 10,000+         |
| Primary Ecosystem Portal   | Yes             |
| Feature Parity with Portal | 100%            |
| Self-sustaining            | Via grants/fees |

---

## Resource Requirements

### Development Team

| Phase | Frontend | Backend | Duration |
| ----- | -------- | ------- | -------- |
| v1.0  | 2        | 1       | 8 weeks  |
| v2.0  | 2        | 1       | 12 weeks |
| v3.0  | 3        | 2       | 14 weeks |

### Infrastructure

| Component  | v1.0 | v2.0 | v3.0 |
| ---------- | ---- | ---- | ---- |
| Web Server | 1    | 2    | 3    |
| Database   | -    | 1    | 2    |
| Indexer    | 1    | 2    | 3    |
| Cache      | -    | 1    | 1    |

---

## Risk Mitigation

### Technical Risks

| Risk                    | Mitigation                      |
| ----------------------- | ------------------------------- |
| RPC instability         | Multiple endpoint fallback      |
| Indexer lag             | Real-time + indexed data hybrid |
| Wallet incompatibility  | Standardized adapter pattern    |
| Breaking chain upgrades | Metadata-driven decoding        |

### Product Risks

| Risk               | Mitigation                           |
| ------------------ | ------------------------------------ |
| User adoption      | Progressive enhancement, familiar UX |
| Feature complexity | Contextual help, tutorials           |
| Performance        | Aggressive caching, lazy loading     |

---

## Migration Strategy

### From Existing Tools

1. **Portal (portal.selendra.org)**

   - Soft launch Terminal alongside Portal
   - Feature parity announcement
   - 3-month deprecation notice
   - DNS redirect after shutdown

2. **EVM Explorer**
   - Unified view includes all EVM data
   - Deep links preserved via redirects

### User Communication

| Phase          | Action                        |
| -------------- | ----------------------------- |
| Pre-launch     | Blog post, documentation      |
| Launch         | Announcement, tutorial videos |
| Migration      | In-app guidance, support      |
| Post-migration | Feedback collection           |

---

## Decision Log

### Architecture Decisions

| Decision        | Choice                       | Rationale                       |
| --------------- | ---------------------------- | ------------------------------- |
| Address Display | User setting                 | Respect user preference         |
| Contract View   | Unified + tabs               | Single search, filtered results |
| Token View      | Unified + tabs               | Consistent with contracts       |
| Indexer         | Hybrid (SubQuery + Frontier) | Best of both worlds             |
| Historical Data | Support pre-unified          | Complete history                |

### Technology Decisions

| Decision        | Choice                | Rationale                    |
| --------------- | --------------------- | ---------------------------- |
| Framework       | Next.js 16            | Server components, Turbopack |
| State           | React Query + Context | Simple, efficient            |
| Styling         | Tailwind + CSS vars   | Theme-aware, maintainable    |
| Indexer         | SubQuery              | Substrate-native             |
| Bridge Protocol | LayerZero             | Battle-tested, wide support  |

---

## Appendix: Feature Comparison

### vs Polkadot.js Apps

| Feature            | Apps | Terminal v1 | Terminal v2 |
| ------------------ | ---- | ----------- | ----------- |
| Account Management | ✅   | ⏳          | ✅          |
| Staking            | ✅   | ⏳          | ✅          |
| Governance         | ✅   | ⏳          | ✅          |
| Extrinsics         | ✅   | ⏳          | ✅          |
| Chain State        | ✅   | ⏳          | ✅          |
| EVM Support        | ❌   | ✅          | ✅          |
| Unified View       | ❌   | ✅          | ✅          |
| Modern UI          | ❌   | ✅          | ✅          |
| Mobile             | ❌   | ✅          | ✅          |

### vs Etherscan

| Feature               | Etherscan | Terminal v1 | Terminal v2 |
| --------------------- | --------- | ----------- | ----------- |
| Block Explorer        | ✅        | ✅          | ✅          |
| Token Tracking        | ✅        | ✅          | ✅          |
| Contract Verification | ✅        | ✅          | ✅          |
| Substrate Support     | ❌        | ✅          | ✅          |
| Staking UI            | ❌        | ⏳          | ✅          |
| Governance            | ❌        | ⏳          | ✅          |
| Wallet Operations     | ❌        | ✅          | ✅          |

---

_Document Version: 1.0_  
_Last Updated: 2025_  
_Project: Selendra Terminal_
