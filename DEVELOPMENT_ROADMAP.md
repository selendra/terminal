# Selendra Terminal Development Roadmap

> **The Ultimate Super dApp for Selendra Blockchain**
>
> A comprehensive blockchain explorer supporting both EVM and WASM (Substrate) with integrated wallet, staking, governance, bridge, and DeFi capabilities.

---

## 📊 Current State Analysis

### What's Built (UI Foundation)

| Category      | Components                                             | Status                                |
| ------------- | ------------------------------------------------------ | ------------------------------------- |
| **Providers** | BlockchainProvider, WalletProvider                     | ✅ Scaffolded with mock data fallback |
| **Explorer**  | Blocks, Transactions, Account, Block Detail, TX Detail | ✅ UI complete                        |
| **Network**   | Validators, Staking, Governance, Treasury              | ✅ UI complete                        |
| **DeFi**      | Bridge, Tokens, DeFi Dashboard                         | ✅ UI complete                        |
| **Developer** | Contracts, API Docs, Gas Tracker                       | ✅ UI complete                        |
| **Layout**    | Sidebar, Header, MainLayout                            | ✅ Complete with Selendra branding    |

### Current Technical Limitations

1. **Mock Data Everywhere** - All components use hardcoded mock data
2. **No Real RPC Integration** - SDK connection falls back to mock when RPC unavailable
3. **No Transaction Signing** - Wallet connect exists but no actual transactions
4. **No Backend/Indexer** - No historical data, search, or analytics
5. **No Precompile Integration** - Staking/DEX precompiles not connected
6. **No Bridge Protocol** - Mock UI only, no LayerZero/Axelar integration

### Technical Stack

- **Frontend**: Next.js 15.0.3, React 18, TypeScript
- **Styling**: TailwindCSS with Selendra Teal theme (#0db0a4)
- **Blockchain**: @selendrajs/sdk 1.0.4, @polkadot/api 14.0.1, ethers 6.13.2
- **State**: React Context + Zustand
- **UI**: Lucide icons, Framer Motion, Chart.js

---

## 🚀 MVP (Minimum Viable Product)

**Timeline: 4-6 weeks**
**Goal: Basic functional blockchain explorer with real data**

### Phase MVP-1: Core Explorer (Week 1-2)

#### 1.1 Real RPC Connection

```
Priority: CRITICAL
Files: src/components/providers/BlockchainProvider.tsx
```

- [ ] **Robust SDK Connection**

  - Implement retry logic with exponential backoff
  - Add WebSocket reconnection handling for wss://rpc.selendra.org
  - Handle chain disconnection gracefully
  - Add connection status indicator in UI

- [ ] **Real Block Data**

  - Fetch latest blocks from Substrate chain
  - Decode extrinsics and events
  - Subscribe to new block headers (already started with useRef)
  - Display real validator info per block

- [ ] **Real Transaction Data**
  - Parse extrinsics from blocks
  - Decode module/method calls
  - Extract transaction fees
  - Link to accounts involved

#### 1.2 EVM Integration (Week 2)

```
Priority: HIGH
Files: src/components/providers/BlockchainProvider.tsx
```

- [ ] **EVM Block Fetching**

  - Connect to https://rpc.selendra.org
  - Fetch EVM blocks and transactions
  - Display gas usage, miner info
  - Show EVM transaction logs/events

- [ ] **Dual Display Mode**
  - Toggle between Substrate/EVM view
  - Show unified block timeline
  - Cross-reference EVM <-> Substrate blocks

### Phase MVP-2: Account & Search (Week 3-4)

#### 2.1 Account Details

```
Files: src/components/explorer/AccountDetail.tsx
```

- [ ] **Substrate Accounts**

  - Query balance (free, reserved, locked)
  - Show transaction history from account
  - Display staking info (if nominator/validator)
  - Show governance activity

- [ ] **EVM Accounts**
  - ETH balance from EVM RPC
  - Token balances (ERC20)
  - Transaction history
  - Contract interactions

#### 2.2 Search Functionality

```
Files: src/components/layout/Header.tsx (search bar)
New: src/lib/search.ts
```

- [ ] **Universal Search**
  - Block number/hash lookup
  - Transaction hash lookup
  - Account address lookup (SS58 and EVM)
  - Auto-detect input type

### Phase MVP-3: Basic Wallet (Week 5-6)

#### 3.1 Wallet Connection

```
Files: src/components/providers/WalletProvider.tsx
```

- [ ] **Substrate Wallet**

  - Connect via Polkadot.js extension
  - Talisman, SubWallet support
  - Display all accounts from extensions
  - Real-time balance updates

- [ ] **EVM Wallet**
  - MetaMask integration (already started)
  - Switch to Selendra network
  - Add network button if not configured
  - Handle account/chain change events

### MVP Deliverables

✅ Real-time block explorer (Substrate + EVM)
✅ Transaction viewing with decoded data
✅ Account balance lookup
✅ Universal search
✅ Wallet connection (view only)

---

## 📦 Version 1.0 - Core Features

**Timeline: 8-10 weeks after MVP**
**Goal: Full explorer + basic staking and wallet operations**

### Phase 1.1: Backend/Indexer Setup (Week 1-3)

#### Indexer Architecture

```
New directory: /backend or separate repo
```

- [ ] **Subsquid/SubQuery Indexer**

  - Index all Substrate events
  - Process extrinsics and store decoded data
  - Track account histories
  - Store token transfers

- [ ] **GraphQL API**

  - Block queries with pagination
  - Transaction search and filters
  - Account history queries
  - Statistics aggregation

- [ ] **Database Schema**
  ```
  blocks (id, hash, timestamp, validator, extrinsics_count)
  extrinsics (id, block_id, module, method, signer, args, events)
  accounts (address, balance_free, balance_reserved, nonce)
  transfers (id, from, to, amount, token, block_id)
  ```

### Phase 1.2: Staking Integration (Week 4-6)

#### 3.2 Read Staking Data

```
Files: src/components/staking/StakingDashboard.tsx
```

- [ ] **Validator List**

  - Query validators from chain state
  - Show commission, self-stake, nominators
  - Calculate and display APY
  - Sort by stake, commission, reward rate

- [ ] **Nominator View**
  - User's staked amount
  - Active nominations
  - Pending rewards
  - Unbonding amounts and timers

#### 3.3 Staking Operations

```
Files: src/components/staking/StakingDashboard.tsx
```

- [ ] **Nominate Validators**

  - Build nominate transaction
  - Sign with connected wallet
  - Submit to chain
  - Track transaction status

- [ ] **Manage Stake**
  - Bond more tokens
  - Unbond (with 28-day lock)
  - Rebond
  - Claim rewards
  - Chill (stop nominating)

### Phase 1.3: EVM Staking Precompile (Week 7-8)

#### Precompile Integration

```
Address: 0x0000000000000000000000000000000000000403
New file: src/lib/precompiles/staking.ts
```

- [ ] **Read Functions**

  ```solidity
  function stake_of(address) returns (uint256)
  function validators() returns (address[])
  function validator_info(address) returns (ValidatorInfo)
  ```

- [ ] **Write Functions**

  ```solidity
  function nominate(address[] validators)
  function bond(uint256 amount)
  function unbond(uint256 amount)
  function withdraw_unbonded()
  function payout_stakers(address validator)
  ```

- [ ] **EVM Staking UI**
  - Connect MetaMask for staking
  - Display stake through precompile
  - Enable EVM-native staking operations

### Phase 1.4: Transaction Building (Week 9-10)

#### Transaction System

```
New file: src/lib/transactions/builder.ts
New file: src/lib/transactions/signer.ts
```

- [ ] **Substrate Transactions**

  - Build transactions with polkadot.js
  - Estimate fees
  - Sign with extension
  - Submit and track status

- [ ] **EVM Transactions**
  - Build transactions with ethers.js
  - Gas estimation
  - Sign with MetaMask
  - Receipt tracking

### V1 Deliverables

✅ Backend indexer with GraphQL API
✅ Full staking functionality (nominate, bond, unbond, claim)
✅ EVM staking via precompile
✅ Transaction history with search and filters
✅ Token transfer capability
✅ Mobile-responsive design

---

## 🔧 Version 2.0 - Governance & Treasury

**Timeline: 6-8 weeks after V1**
**Goal: Complete on-chain governance participation**

### Phase 2.1: Governance Read (Week 1-2)

#### Governance Data

```
Files: src/components/governance/GovernanceDashboard.tsx
```

- [ ] **Proposals List**

  - Fetch from democracy pallet
  - Referenda status
  - Council motions
  - Technical committee proposals

- [ ] **Proposal Details**
  - Proposal content (IPFS/on-chain)
  - Current votes (Aye/Nay/Abstain)
  - Turnout and conviction
  - Timeline and deadline

### Phase 2.2: Governance Write (Week 3-4)

#### Voting Operations

```
Files: src/components/governance/GovernanceDashboard.tsx
New: src/lib/governance/voting.ts
```

- [ ] **Vote on Referenda**

  - Standard vote (Aye/Nay)
  - Conviction voting (1x to 6x lock)
  - Split voting
  - Delegated voting

- [ ] **Propose Changes**
  - Submit public proposals
  - Second proposals
  - Council member actions

### Phase 2.3: Treasury (Week 5-6)

#### Treasury Dashboard

```
Files: src/components/treasury/TreasuryDashboard.tsx
```

- [ ] **Treasury Stats**

  - Available balance
  - Approved spend
  - Spending periods
  - Burn rate

- [ ] **Proposals**
  - Submit treasury proposals
  - View pending proposals
  - Council approve/reject
  - Track payment status

### Phase 2.4: Democracy UI Polish (Week 7-8)

- [ ] **Rich Proposal View**

  - Markdown rendering
  - Discussion forum integration
  - Vote breakdown charts
  - Historical voting record

- [ ] **Notifications**
  - New proposal alerts
  - Vote ending reminders
  - Proposal status changes

### V2 Deliverables

✅ Full governance participation (view, vote, propose)
✅ Treasury management
✅ Conviction voting with lock visualization
✅ Proposal discussions
✅ Governance history and analytics

---

## 🌉 Version 3.0 - Bridge & Cross-Chain

**Timeline: 10-12 weeks after V2**
**Goal: Cross-chain asset transfers**

### Phase 3.1: Bridge Architecture (Week 1-3)

#### Bridge Protocol Selection

```
Options: LayerZero, Axelar, Wormhole
New directory: src/lib/bridge/
```

- [ ] **Protocol Integration**

  - LayerZero OFT (Omnichain Fungible Token)
  - Axelar GMP (General Message Passing)
  - OR custom bridge contract

- [ ] **Supported Chains**
  - Ethereum mainnet
  - BNB Chain
  - Polygon
  - Polkadot parachains

### Phase 3.2: Bridge UI (Week 4-6)

#### Bridge Interface

```
Files: src/components/bridge/BridgeInterface.tsx
```

- [ ] **Token Selection**

  - Source chain selection
  - Destination chain selection
  - Token dropdown with balances
  - Amount input with MAX button

- [ ] **Bridge Transaction**
  - Fee estimation
  - Slippage settings
  - Transaction preview
  - Execute bridge
  - Track cross-chain status

### Phase 3.3: Bridge Security (Week 7-8)

- [ ] **Transaction Limits**

  - Per-transaction limits
  - Daily limits
  - Multi-sig for large amounts

- [ ] **Monitoring**
  - Bridge TVL dashboard
  - Transaction history
  - Failed transaction recovery

### Phase 3.4: XCMP Integration (Week 9-12)

#### Polkadot Cross-Chain

```
New file: src/lib/bridge/xcmp.ts
```

- [ ] **XCM Transfers**

  - DOT transfers from Relay Chain
  - Asset transfers from Asset Hub
  - Custom XCM programs

- [ ] **Parachain Connections**
  - Moonbeam
  - Astar
  - Other Substrate chains

### V3 Deliverables

✅ Cross-chain bridge to major EVM chains
✅ XCMP integration with Polkadot ecosystem
✅ Bridge transaction tracking
✅ Security limits and monitoring
✅ Multi-chain asset management

---

## 🎯 Ultimate Goal - The Complete Terminal

**Timeline: Ongoing after V3**
**Goal: The definitive Selendra ecosystem portal**

### Ultimate Features

#### 1. DEX Integration

```
Precompile Address: 0x0000000000000000000000000000000000000408
Files: src/components/defi/DexInterface.tsx
```

- [ ] **Native DEX via Precompile**

  - Token swaps
  - Liquidity provision
  - Pool creation
  - Yield farming

- [ ] **DEX Aggregator**
  - Best route finding
  - Split trades
  - MEV protection

#### 2. NFT Marketplace

```
New directory: src/components/nft/
```

- [ ] **NFT Explorer**

  - Collection browser
  - NFT details and metadata
  - Owner history
  - Price history

- [ ] **NFT Trading**
  - List for sale
  - Make offers
  - Auction system
  - Batch operations

#### 3. Developer Portal

```
Files: src/components/api/ApiDocs.tsx
New: src/components/developer/
```

- [ ] **API Playground**

  - Interactive RPC testing
  - Code generation
  - WebSocket subscriptions

- [ ] **Contract Tools**

  - Contract verification
  - Source code viewer
  - ABI decoder
  - Read/Write interface

- [ ] **SDKs & Documentation**
  - @selendra/sdk integration guides
  - Precompile documentation
  - Example dApps

#### 4. Analytics Dashboard

```
New directory: src/components/analytics/
```

- [ ] **Network Analytics**

  - TPS over time
  - Active accounts
  - Transaction volume
  - Fee trends

- [ ] **Token Analytics**

  - Price charts
  - Volume analysis
  - Holder distribution
  - Top holders

- [ ] **DeFi Analytics**
  - TVL tracking
  - Pool performance
  - Yield comparisons

#### 5. Mobile App

```
New repo: selendra-terminal-mobile
```

- [ ] **React Native App**
  - iOS and Android
  - Wallet functionality
  - Push notifications
  - Biometric auth

#### 6. sUSD Stablecoin Integration

```
Per Selendra Phase 2 roadmap
```

- [ ] **sUSD Features**
  - Balance display
  - Transfer
  - Mint/Redeem (if applicable)
  - Price feed integration

#### 7. Merchant Gateway

```
Per Selendra Phase 2 roadmap
```

- [ ] **Payment Integration**
  - QR code generation
  - Payment requests
  - Invoice management
  - Settlement options

### Ultimate Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELENDRA TERMINAL                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  Explorer   │  │   Wallet    │  │   Staking   │  │  Bridge │ │
│  │  Blocks/TX  │  │  Multi-sig  │  │  Nominate   │  │  Cross- │ │
│  │  Accounts   │  │  Hardware   │  │  Validate   │  │  Chain  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ Governance  │  │    DeFi     │  │    NFTs     │  │Developer│ │
│  │  Proposals  │  │  DEX/AMM    │  │ Marketplace │  │   API   │ │
│  │  Treasury   │  │   Lending   │  │ Collections │  │  Tools  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                         SERVICES LAYER                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GraphQL API  │  Indexer  │  Price Feeds  │  Analytics    │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       BLOCKCHAIN LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Selendra Substrate │ Selendra EVM │ Precompiles │ XCMP/XCM ││
│  │ wss://rpc.selendra │ rpc-evm.sel  │ 0x0403/0408 │ Relay    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Priorities

### Immediate Next Steps (This Week)

1. **Fix SDK Connection** - Ensure real RPC data flows through
2. **Block Subscription** - Subscribe to new blocks, display real data
3. **Account Lookup** - Query real balances for any address

### Key Technical Decisions

| Decision         | Recommendation        | Rationale                         |
| ---------------- | --------------------- | --------------------------------- |
| Indexer          | Subsquid              | Substrate-native, fast sync       |
| Bridge Protocol  | LayerZero             | Wide chain support, battle-tested |
| State Management | Zustand + React Query | Simple, efficient caching         |
| Backend          | Node.js + GraphQL     | Type safety, ecosystem fit        |

### Resource Requirements

| Phase    | Frontend Dev | Backend Dev | Duration |
| -------- | ------------ | ----------- | -------- |
| MVP      | 2            | 0           | 6 weeks  |
| V1       | 2            | 1           | 10 weeks |
| V2       | 2            | 1           | 8 weeks  |
| V3       | 3            | 2           | 12 weeks |
| Ultimate | 4            | 2           | Ongoing  |

---

## 🔗 Reference Links

- **Selendra RPC**: `wss://rpc.selendra.org` / `https://rpc-evm.selendra.org`
- **Chain IDs**: Mainnet 1961, Testnet 1953
- **SS58 Prefix**: 42
- **Block Time**: 1 second
- **Consensus**: AlephBFT (instant finality)
- **Validators**: 4 (Phase 1) → 100 → 1000+
- **Staking Precompile**: `0x0000000000000000000000000000000000000403`
- **DEX Precompile**: `0x0000000000000000000000000000000000000408`

---

## ✅ Success Metrics

### MVP Success

- [ ] 99%+ uptime for explorer
- [ ] < 1s block display latency
- [ ] 100+ daily active users

### V1 Success

- [ ] 1000+ staking transactions processed
- [ ] 50+ validators displayed
- [ ] Mobile responsive on all pages

### V2 Success

- [ ] 100+ governance votes cast through UI
- [ ] 10+ treasury proposals submitted
- [ ] Community engagement tracking

### V3 Success

- [ ] $1M+ bridged volume
- [ ] 5+ chains supported
- [ ] < 5 min bridge completion time

### Ultimate Success

- [ ] 10,000+ monthly active users
- [ ] Primary Selendra ecosystem portal
- [ ] Self-sustaining through fees/grants

---

_Document Version: 1.0_
_Last Updated: {{ now }}_
_Project: Selendra Terminal_
