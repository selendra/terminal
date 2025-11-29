# Selendra Terminal - Architecture Overview

> **Implementation Reference for the Unified Dual-VM Blockchain Explorer**

Last Updated: 2025

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Main layout routes
│   │   ├── accounts/             # Account explorer
│   │   ├── blocks/               # Block explorer
│   │   ├── transactions/         # Transaction explorer
│   │   ├── contracts/            # Contract explorer
│   │   ├── tokens/               # Token explorer
│   │   ├── staking/              # Staking UI
│   │   ├── governance/           # Governance UI
│   │   └── developers/           # Developer tools
│   ├── api/                      # API routes
│   └── settings/                 # Settings page
│
├── components/
│   ├── common/                   # Shared UI components
│   │   ├── AddressDisplay.tsx    # ✅ Unified address with format toggle
│   │   ├── VMBadge.tsx           # ✅ Substrate/EVM indicator
│   │   ├── StatusBadge.tsx       # ✅ Transaction status badges
│   │   ├── ConnectionStatus.tsx  # ✅ RPC connection indicator
│   │   ├── SearchBar.tsx         # ✅ Universal search
│   │   ├── ThemeToggle.tsx       # ✅ Theme switcher
│   │   └── index.ts              # Component exports
│   │
│   ├── explorer/                 # Explorer feature components
│   │   ├── UnifiedTransactionList.tsx  # ✅ Merged tx list
│   │   ├── UnifiedAccountView.tsx      # ✅ Unified account view
│   │   ├── AccountDetail.tsx     # Account detail page
│   │   ├── BlockDetail.tsx       # Block detail page
│   │   └── ...
│   │
│   ├── providers/                # Context providers
│   │   ├── BlockchainProvider.tsx  # ✅ Chain connection
│   │   ├── WalletProvider.tsx      # ✅ Wallet connection
│   │   ├── ThemeProvider.tsx       # ✅ Theme management
│   │   └── Providers.tsx           # Combined providers
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # App header
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── MainLayout.tsx        # Main page layout
│   │
│   └── [feature]/                # Feature-specific components
│       ├── staking/
│       ├── governance/
│       ├── contracts/
│       └── ...
│
├── lib/
│   ├── stores/                   # Zustand stores
│   │   ├── preferences.ts        # ✅ User preferences store
│   │   └── index.ts
│   │
│   ├── unified/                  # Dual-VM unification utilities
│   │   ├── address-resolver.ts   # ✅ SS58 ↔ 0x conversion
│   │   └── index.ts
│   │
│   ├── address.ts                # ✅ Address utilities
│   ├── decoder.ts                # Extrinsic decoder
│   ├── search.ts                 # Search utilities
│   └── utils.ts                  # General utilities
│
└── styles/
    └── globals.css               # Global styles + CSS variables
```

---

## Key Implementation Details

### 1. Unified Address System

The address system handles Selendra's dual-VM architecture where every account has both a Substrate (SS58) and EVM (0x) address.

**Components:**

- `AddressDisplay` - Main component with format toggle
- `DualAddressDisplay` - Shows both formats side by side

**Service:**

- `lib/unified/address-resolver.ts` - Address conversion and resolution

**Store:**

- `lib/stores/preferences.ts` - User's preferred address format

**Usage:**

```tsx
import { AddressDisplay } from "@/components/common";

// Basic usage - respects user preference
<AddressDisplay address="0x7a3cEfC7Ac..." />

// With all features
<AddressDisplay
  address="seH5WcHC7dXPjg..."
  showVMBadge
  showCopy
  showToggle
  linkToAccount
/>
```

### 2. VM Indicator System

Visual distinction between Substrate and EVM transactions/data.

**Components:**

- `VMBadge` - Badge with icon and optional label
- `VMDot` - Minimal colored dot
- `VMLabel` - Text-only indicator

**Colors:**

- Substrate: Blue (`#3B82F6`)
- EVM: Purple (`#8B5CF6`)

### 3. User Preferences

Zustand store with localStorage persistence.

**Key Preferences:**

- `addressFormat`: "substrate" | "evm" | "both"
- `theme`: "light" | "dark" | "system"
- `currency`: "USD" | "EUR" | "SEL" | etc.
- `savedAddresses`: Address book entries
- `recentSearches`: Search history

**Usage:**

```tsx
import { usePreferences } from "@/lib/stores/preferences";

const { addressFormat, setAddressFormat } = usePreferences();
```

### 4. Transaction System

Unified transaction display merging Substrate extrinsics and EVM transactions.

**Interface:**

```tsx
interface UnifiedTransaction {
  hash: string;
  vm: "substrate" | "evm";
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string | null;
  value: string;
  fee: string;
  status: Status;
  method: string;
  isContractCall: boolean;
  isContractCreation: boolean;
}
```

**Components:**

- `UnifiedTransactionList` - Full list with filtering
- `UnifiedTransactionListCompact` - Widget version

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
├─────────────────────────────────────────────────────────────────┤
│  AddressDisplay ◄──────┐                                        │
│  VMBadge               │  usePreferences() - Address format     │
│  UnifiedTransactionList│                                        │
│  UnifiedAccountView    │                                        │
└────────────┬───────────┴────────────────────────────────────────┘
             │
             │ Address Resolution
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  address-resolver.ts                                            │
│  ├─ resolveAddress(addr) → UnifiedAddress                       │
│  ├─ substrateToEvm(ss58) → 0x                                   │
│  ├─ evmToSubstrate(0x) → ss58                                   │
│  └─ isSameAccount(addr1, addr2) → boolean                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ API Calls
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Providers)                        │
├─────────────────────────────────────────────────────────────────┤
│  BlockchainProvider                                              │
│  ├─ substrateSDK (SelendraSDK - Substrate)                      │
│  ├─ evmSDK (SelendraSDK - EVM)                                  │
│  ├─ Real-time block subscription                                │
│  └─ Network switching (Mainnet/Testnet)                         │
│                                                                  │
│  WalletProvider                                                  │
│  ├─ Polkadot.js extension                                       │
│  ├─ MetaMask (EVM)                                              │
│  └─ Balance tracking                                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SELENDRA BLOCKCHAIN                           │
├─────────────────────────────────────────────────────────────────┤
│  Substrate Layer         │  Frontier EVM Layer                  │
│  ├─ wss://rpc.selendra.org                                      │
│  ├─ AlephBFT consensus                                          │
│  └─ 1s block time, instant finality                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Configuration

```bash
# .env.local
NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=https://rpc.selendra.org
NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc.selendra.org

NEXT_PUBLIC_CHAIN_ID=1961
NEXT_PUBLIC_SS58_PREFIX=42
NEXT_PUBLIC_TOKEN_SYMBOL=SEL
NEXT_PUBLIC_TOKEN_DECIMALS=18
```

---

## Development Commands

```bash
# Start development server
pnpm dev

# Type checking
pnpm type-check

# Production build
pnpm build

# Start production server
pnpm start
```

---

## Next Steps (Phase 3 Completion)

1. **Integrate unified components** into existing pages
2. **Replace mock data** with real chain queries
3. **Set up SubQuery indexer** for historical data
4. **Add transaction normalizer** service
5. **Implement staking with real data**

---

## File Locations Quick Reference

| Feature             | Files                                            |
| ------------------- | ------------------------------------------------ |
| Address Display     | `components/common/AddressDisplay.tsx`           |
| VM Indicators       | `components/common/VMBadge.tsx`                  |
| Status Badges       | `components/common/StatusBadge.tsx`              |
| Address Resolver    | `lib/unified/address-resolver.ts`                |
| User Preferences    | `lib/stores/preferences.ts`                      |
| Unified Tx List     | `components/explorer/UnifiedTransactionList.tsx` |
| Unified Account     | `components/explorer/UnifiedAccountView.tsx`     |
| Blockchain Provider | `components/providers/BlockchainProvider.tsx`    |
| Wallet Provider     | `components/providers/WalletProvider.tsx`        |
| Settings Page       | `components/settings/Settings.tsx`               |
