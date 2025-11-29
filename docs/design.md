# Selendra Terminal - Design Document

> **Unified Dual-VM Blockchain Explorer & Portal**  
> A comprehensive interface for Selendra's Substrate + EVM ecosystem

---

## Vision

Selendra Terminal is the **single, unified interface** for interacting with Selendra blockchain. It replaces the fragmented experience of separate tools (EVM explorer, Substrate explorer, Polkadot.js portal) with one cohesive application that understands Selendra's dual-VM architecture.

### Core Principles

1. **Unified Experience** - One interface for both VMs, no context switching
2. **Progressive Disclosure** - Simple by default, powerful when needed
3. **User-Controlled** - Preferences (address format, theme) persist and respect user choice
4. **Accessibility First** - Works without wallet (read-only), enhanced with wallet connection
5. **Theme Aware** - Full light/dark mode support using CSS variables

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           SELENDRA TERMINAL                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Explorer │ │ Accounts │ │ Staking  │ │Governance│ │Developer │   │   │
│  │  │ Blocks   │ │ Wallet   │ │ Nominate │ │ Referenda│ │Extrinsics│   │   │
│  │  │ Txns     │ │ Identity │ │ Pools    │ │ Treasury │ │ChainState│   │   │
│  │  │ Accounts │ │ Multisig │ │Validators│ │ Bounties │ │ Contracts│   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                      UNIFICATION LAYER                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │ Address     │  │ Transaction │  │ Contract    │                  │   │
│  │  │ Resolver    │  │ Normalizer  │  │ Aggregator  │                  │   │
│  │  │ SS58 ↔ 0x   │  │ Extr + EVMTx│  │ ink! + EVM  │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                        DATA LAYER                                   │   │
│  │  ┌────────────────────┐     ┌────────────────────┐                  │   │
│  │  │   Substrate API    │     │      EVM API       │                  │   │
│  │  │   @polkadot/api    │     │   ethers.js        │                  │   │
│  │  │   @selendrajs/sdk  │     │   Frontier RPC     │                  │   │
│  │  └────────────────────┘     └────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                       INDEXER LAYER                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   SubQuery   │  │   Frontier   │  │  Unification │               │   │
│  │  │  (Substrate) │  │    (EVM)     │  │    Service   │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Unified Accounts System

### The Challenge

Selendra uses **Unified Accounts** - every user has both:

- **Substrate address** (SS58 format, e.g., `seH5WcHC7dXPjg...`)
- **EVM address** (0x format, e.g., `0x7a3cEfC7Ac...`)

These are **mathematically linked** via the unified-accounts pallet.

### Design Decision: User-Controlled Display

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings → Display Preferences                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Address Format:                                                │
│  ○ Substrate (Default) - Show seH5WcHC7dXPjg...                 │
│  ○ EVM - Show 0x7a3cEfC7Ac...                                   │
│  ○ Both - Show primary with toggle                              │
│                                                                 │
│  Note: You can always click any address to see both formats     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Address Component Design

```tsx
// AddressDisplay component behavior
<AddressDisplay address="seH5WcHC7dXPjg..." />

// Renders based on user preference:
// - Substrate mode: seH5WcHC...dXPjg (copy icon) (toggle icon)
// - EVM mode: 0x7a3c...C7Ac (copy icon) (toggle icon)
// - Both mode: seH5WcHC...dXPjg | 0x7a3c...C7Ac

// Clicking toggle reveals the alternate format
// Clicking copy copies the displayed format
// Hover shows full address in tooltip
```

---

## Unified Transaction View

### Transaction Normalization

All transactions from both VMs display in unified format with source indicator:

```
┌─────────────────────────────────────────────────────────────────┐
│  Transactions                                     [All ▼]       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────┬───────────────────────────────────────────────────┐    │
│  │ Tab │  All  │  Substrate  │  EVM  │  Transfers  │       │    │
│  └─────┴───────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟣 0x7a2f...c4d8                              2 secs ago  │  │
│  │ EVM │ Transfer │ 100 SEL → 0x8b4c...                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔵 0x923a...ff12                              5 secs ago  │  │
│  │ Substrate │ balances.transfer │ seH5Wc... → seK3Rf...     │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟣 0x1bc4...a829                              8 secs ago  │  │
│  │ EVM │ Contract Call │ swap() on 0x5a2...                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Legend: 🔵 Substrate  🟣 EVM
```

### Transaction Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Transaction Details                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hash: 0x7a2f9c8d...                                [Copy]      │
│  Status: ✅ Success                                             │
│  Block: 1,234,567 (finalized)                                   │
│  Timestamp: 2024-01-15 10:23:45 UTC (2 minutes ago)             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Type: EVM Transaction                          🟣 EVM  │     │
│  ├────────────────────────────────────────────────────────┤     │
│  │ From: 0x7a3cEfC7Ac...  [📋] [🔄]                       │     │
│  │ To: 0x5a2b8cDf39...    [📋] [🔄]                       │     │
│  │ Value: 100 SEL ($XX.XX USD)                            │     │
│  │ Gas Used: 21,000 / 21,000 (100%)                       │     │
│  │ Gas Price: 1 Gwei                                      │     │
│  │ Transaction Fee: 0.000021 SEL                          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  Tabs: [Overview] [Logs] [State Changes] [Raw]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

[📋] = Copy  [🔄] = Toggle address format
```

---

## Unified Contracts View

### Smart Contract Discovery

```
┌─────────────────────────────────────────────────────────────────┐
│  Smart Contracts                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────┬───────────────────────────────────────────────────┐    │
│  │ Tab │  All  │  EVM (Solidity)  │  ink! (WASM)  │        │    │
│  └─────┴───────────────────────────────────────────────────┘    │
│                                                                 │
│  Search: [________________________] [Filter: Verified ▼]        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟣 WSEL Token                                    Verified │  │
│  │ 0x5a2b8cDf39...                     ERC-20 │ Solidity     │  │
│  │ Txns: 12,345 │ Balance: 1.2M SEL │ Created: 30 days ago   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔵 Governance Contract                                    │  │
│  │ seContract123...                    PSP-22 │ ink! (Rust)  │  │
│  │ Calls: 567 │ Balance: 50K SEL │ Created: 60 days ago      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Contract Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Contract: WSEL Token                              🟣 EVM       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Address: 0x5a2b8cDf39...                   [📋] [🔄]           │
│  Creator: 0x7a3cEfC7Ac...                                      │
│  Created: Block 1,000,000 (30 days ago)                        │
│  Balance: 1,234,567 SEL                                        │
│                                                                 │
│  Tabs:                                                          │
│  [Overview] [Code] [Read] [Write] [Events] [Analytics]         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Code Tab                                               │    │
│  │ ┌──────────────────────────────────────────────────┐  │    │
│  │ │ ✅ Verified Source Code (Solidity 0.8.19)        │  │    │
│  │ │ Compiler: solc │ Optimization: Yes (200 runs)    │  │    │
│  │ │                                                  │  │    │
│  │ │ Files: [WSEL.sol] [IERC20.sol] [Ownable.sol]    │  │    │
│  │ │                                                  │  │    │
│  │ │ // SPDX-License-Identifier: MIT                 │  │    │
│  │ │ pragma solidity ^0.8.19;                        │  │    │
│  │ │ ...                                             │  │    │
│  │ └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Unified Token View

### Token Standards Mapping

| EVM Standard | Substrate/ink! Standard | Display Name   |
| ------------ | ----------------------- | -------------- |
| ERC-20       | PSP-22                  | Fungible Token |
| ERC-721      | PSP-34                  | NFT            |
| ERC-1155     | PSP-37                  | Multi-Token    |

### Token Explorer

```
┌─────────────────────────────────────────────────────────────────┐
│  Tokens                                                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────┬───────────────────────────────────────────────────┐   │
│  │ Tab │  All  │  Fungible  │  NFTs  │  Multi-Token  │     │   │
│  └─────┴───────────────────────────────────────────────────┘   │
│                                                                 │
│  Secondary Filter: [All VMs ▼] [Verified Only ☐]               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟣 WSEL                                          ERC-20   │ │
│  │ Wrapped SEL │ 0x5a2b...                                   │ │
│  │ Supply: 10M │ Holders: 5,432 │ Price: $0.50               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔵 sUSD                                          PSP-22   │ │
│  │ Selendra USD │ seToken456...                              │ │
│  │ Supply: 1M │ Holders: 1,234 │ Price: $1.00                │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🟣 Selendra Punks                                ERC-721  │ │
│  │ NFT Collection │ 0x8c4d...                                │ │
│  │ Items: 10,000 │ Owners: 3,456 │ Floor: 50 SEL             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation Structure

### Primary Navigation (Sidebar)

```
┌──────────────────────────┐
│ 🏠 SELENDRA TERMINAL     │
├──────────────────────────┤
│                          │
│ 📊 Dashboard             │
│                          │
│ 🔍 Explorer              │
│   ├─ Blocks              │
│   ├─ Transactions        │
│   ├─ Accounts            │
│   └─ Events              │
│                          │
│ 👛 Accounts              │
│   ├─ My Accounts         │
│   ├─ Address Book        │
│   └─ Multisig            │
│                          │
│ 💰 Staking               │
│   ├─ Overview            │
│   ├─ Nominate            │
│   ├─ Pools               │
│   ├─ Validators          │
│   └─ Payouts             │
│                          │
│ 🏛️ Governance            │
│   ├─ Referenda           │
│   ├─ Treasury            │
│   └─ Bounties            │
│                          │
│ 📜 Contracts             │
│   ├─ Explorer            │
│   ├─ Verify              │
│   └─ Deploy              │
│                          │
│ 🪙 Tokens                │
│   ├─ All Tokens          │
│   └─ NFTs                │
│                          │
│ 🛠️ Developer             │
│   ├─ Extrinsics          │
│   ├─ Chain State         │
│   ├─ RPC Calls           │
│   └─ Tools               │
│                          │
│ 📈 Analytics             │
│   ├─ Charts              │
│   └─ Statistics          │
│                          │
│ ⚙️ Settings              │
│                          │
└──────────────────────────┘
```

### Header Design

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] SELENDRA  │ 🔍 Search blocks, txns, addresses...           │
├───────────────┴─────────────────────────────────────────────────┤
│                                      [🌐 Mainnet ▼] [🌙] [👛]  │
└─────────────────────────────────────────────────────────────────┘

[≡] = Mobile menu toggle
[🌐] = Network selector (Mainnet/Testnet/Custom)
[🌙] = Theme toggle (Light/Dark/System)
[👛] = Wallet connection button
```

---

## Theming System

### CSS Variable Architecture

```css
:root {
  /* Background */
  --background: 0 0% 100%;
  --background-secondary: 0 0% 98%;
  --background-tertiary: 0 0% 96%;

  /* Foreground */
  --foreground: 0 0% 9%;
  --foreground-secondary: 0 0% 45%;
  --foreground-muted: 0 0% 64%;

  /* Brand */
  --selendra-teal: 175 93% 35%;
  --selendra-teal-hover: 175 93% 30%;

  /* Semantic */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
  --info: 221 83% 53%;

  /* VM Colors */
  --substrate-color: 221 83% 53%; /* Blue */
  --evm-color: 271 76% 53%; /* Purple */

  /* Borders & Cards */
  --border: 0 0% 90%;
  --card: 0 0% 100%;
  --card-hover: 0 0% 98%;
}

.dark {
  --background: 0 0% 7%;
  --background-secondary: 0 0% 10%;
  --background-tertiary: 0 0% 13%;

  --foreground: 0 0% 95%;
  --foreground-secondary: 0 0% 70%;
  --foreground-muted: 0 0% 50%;

  --border: 0 0% 20%;
  --card: 0 0% 10%;
  --card-hover: 0 0% 13%;
}
```

### Component Theming Guidelines

1. **Never use hardcoded colors** - Always use CSS variables via Tailwind
2. **Text colors**: `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`
3. **Backgrounds**: `bg-background`, `bg-background-secondary`, `bg-card`
4. **Borders**: `border-border`
5. **Interactive states**: Use `hover:bg-card-hover`, `hover:text-selendra-teal`

---

## Responsive Design

### Breakpoints

| Breakpoint | Width  | Target           |
| ---------- | ------ | ---------------- |
| `sm`       | 640px  | Mobile landscape |
| `md`       | 768px  | Tablets          |
| `lg`       | 1024px | Small laptops    |
| `xl`       | 1280px | Desktops         |
| `2xl`      | 1536px | Large screens    |

### Mobile Navigation

```
┌────────────────────────────────────────┐
│ [≡] SELENDRA           [🔍] [🌙] [👛] │
└────────────────────────────────────────┘

// Menu expanded (slide from left):
┌────────────────────────────────────────┐
│ ✕ Close                                │
├────────────────────────────────────────┤
│ 📊 Dashboard                           │
│ 🔍 Explorer ▼                          │
│    Blocks                              │
│    Transactions                        │
│    Accounts                            │
│ 💰 Staking ▼                           │
│    ...                                 │
├────────────────────────────────────────┤
│ Network: [Mainnet ▼]                   │
│ Theme: [System ▼]                      │
└────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Address Lookup

```
User enters address in search
        │
        ▼
┌───────────────────────┐
│ Detect address format │
│ (SS58 or 0x)          │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Resolve linked address│
│ via unified-accounts  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Fetch data from both  │
│ Substrate & EVM layers│
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Display unified       │
│ account view          │
└───────────────────────┘
```

### Flow 2: Transaction Submission (with wallet)

```
User initiates action (stake, transfer, etc.)
        │
        ▼
┌───────────────────────┐
│ Build transaction     │
│ (Substrate extrinsic  │
│  or EVM transaction)  │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Show confirmation     │
│ - Amount              │
│ - Fees (estimated)    │
│ - Destination         │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Sign with wallet      │
│ (Extension popup)     │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Submit & track        │
│ - Pending             │
│ - In block            │
│ - Finalized           │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│ Show result           │
│ - Success toast       │
│ - Link to tx details  │
└───────────────────────┘
```

### Flow 3: Historical Data Query

```
User searches old transaction
        │
        ▼
┌───────────────────────┐
│ Query hybrid indexer  │
│ (SubQuery + Frontier) │
└───────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ Check if pre-unified-accounts     │
│ (before pallet was deployed)      │
└───────────────────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
┌───────┐ ┌────────────────────────┐
│ Post  │ │ Pre-unified            │
│ Show  │ │ Show with notice:      │
│ linked│ │ "Historical data,      │
│address│ │ address may not be     │
└───────┘ │ linked to current ID"  │
          └────────────────────────┘
```

---

## Error States & Loading

### Loading States

```
┌─────────────────────────────────────────┐
│  Transactions                           │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ ████████████████░░░░░░░░░░░░░░ │   │  ← Skeleton
│  │ ██████████░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ████████████████░░░░░░░░░░░░░░ │   │
│  │ ██████████░░░░░░░░░░░░░░░░░░░░ │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Error States

```
┌─────────────────────────────────────────┐
│  ⚠️ Unable to load transactions         │
│                                         │
│  We couldn't connect to the network.    │
│  This might be temporary.               │
│                                         │
│  [🔄 Retry]  [📋 View cached data]      │
└─────────────────────────────────────────┘
```

### Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│           📭 No transactions            │
│                                         │
│  This account has no transaction        │
│  history yet.                           │
│                                         │
│  [📤 Make your first transfer]          │
│                                         │
└─────────────────────────────────────────┘
```

---

## Accessibility

### Requirements

1. **Keyboard Navigation** - All interactive elements reachable via Tab
2. **Screen Reader Support** - Proper ARIA labels and roles
3. **Color Contrast** - WCAG 2.1 AA compliance (4.5:1 for text)
4. **Focus Indicators** - Visible focus rings on all interactive elements
5. **Reduced Motion** - Respect `prefers-reduced-motion`

### Implementation

```tsx
// Focus ring utility
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-selendra-teal focus-visible:ring-offset-2"

// Screen reader only text
<span className="sr-only">Copy address to clipboard</span>

// ARIA labels
<button aria-label="Toggle theme between light and dark mode">
  <MoonIcon />
</button>
```

---

## Component Library

### Core Components (Implemented ✅)

| Component                | Purpose                                    | Status |
| ------------------------ | ------------------------------------------ | ------ |
| `AddressDisplay`         | Unified address display with format toggle | ✅     |
| `AddressDisplayCompact`  | Minimal address display                    | ✅     |
| `AddressDisplayFull`     | Full-featured address display              | ✅     |
| `DualAddressDisplay`     | Shows both SS58 and 0x addresses           | ✅     |
| `VMBadge`                | Substrate/EVM indicator badge              | ✅     |
| `VMDot`                  | Minimal VM indicator dot                   | ✅     |
| `VMLabel`                | Text-only VM indicator                     | ✅     |
| `StatusBadge`            | Transaction/proposal status                | ✅     |
| `StatusDot`              | Minimal status indicator                   | ✅     |
| `TransactionStatusBadge` | Transaction status with context            | ✅     |
| `SearchBar`              | Universal search with type detection       | ✅     |
| `ConnectionStatus`       | RPC connection indicator                   | ✅     |
| `ThemeToggle`            | Theme switcher                             | ✅     |

### Explorer Components (Implemented ✅)

| Component                       | Purpose                        | Status |
| ------------------------------- | ------------------------------ | ------ |
| `UnifiedTransactionList`        | Merged Substrate + EVM tx list | ✅     |
| `UnifiedTransactionListCompact` | Compact tx list for widgets    | ✅     |
| `UnifiedAccountView`            | Unified account detail view    | ✅     |

### Planned Components (Phase 2+)

| Component          | Purpose                          | Status |
| ------------------ | -------------------------------- | ------ |
| `DataTable`        | Sortable, paginated data table   | ⏳     |
| `TabGroup`         | Tab navigation with URL sync     | ⏳     |
| `WalletButton`     | Wallet connection UI             | ✅     |
| `TransactionToast` | Transaction status notifications | ⏳     |
| `Skeleton`         | Loading placeholder              | ⏳     |
| `EmptyState`       | No data placeholder              | ⏳     |
| `ErrorBoundary`    | Error recovery UI                | ⏳     |

### Form Components

| Component       | Purpose                       |
| --------------- | ----------------------------- |
| `AddressInput`  | Address input with validation |
| `BalanceInput`  | Token amount with max button  |
| `TokenSelector` | Token dropdown with balances  |
| `GasSettings`   | Gas price/limit configuration |

---

## Future Considerations

### Phase 2 Enhancements

1. **Portfolio View** - Aggregate all tokens, NFTs, staking positions
2. **Transaction Builder** - Visual extrinsic construction
3. **Batch Operations** - Multiple transactions in one
4. **Alerts** - Price alerts, whale watching
5. **API Keys** - Developer API access management

### Performance Optimizations

1. **Virtual Scrolling** - For large lists (holders, transactions)
2. **Data Caching** - React Query with stale-while-revalidate
3. **Code Splitting** - Route-based chunks
4. **Image Optimization** - Next.js Image with CDN

---

_Document Version: 1.0_  
_Last Updated: 2025_  
_Project: Selendra Terminal_
