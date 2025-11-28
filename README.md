# Selendra Terminal

> **The Unified Dual-VM Blockchain Explorer & Portal**

A comprehensive interface for Selendra's Substrate + EVM ecosystem. One application for exploring, transacting, staking, and governing.

![Selendra Terminal](https://img.shields.io/badge/Selendra-Terminal-0db0a4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square)

---

## Overview

Selendra Terminal replaces multiple fragmented tools with a **single unified interface**:

- ✅ **Block Explorer** - Substrate + EVM blocks, transactions, accounts
- ✅ **Wallet Portal** - Multi-wallet connection, transfers, signing
- ✅ **Staking** - Nominate validators, manage stake, claim rewards
- ✅ **Governance** - Vote on referenda, submit proposals
- ✅ **Developer Tools** - Extrinsics, chain state, contract interaction

### Key Feature: Unified Dual-VM

Selendra runs both **Substrate** and **EVM** simultaneously. Terminal provides:

- 🔗 **Linked Addresses** - SS58 ↔ 0x mapping via unified-accounts pallet
- 📊 **Merged Views** - Transactions from both VMs in one timeline
- 🏷️ **VM Badges** - Clear indicators for Substrate vs EVM data
- ⚙️ **User Preference** - Choose your preferred address format

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Using Docker

```bash
# Development with local node
docker compose -f docker-compose.local.yml up -d

# Production
docker compose up -d
```

---

## Documentation

| Document                        | Description                            |
| ------------------------------- | -------------------------------------- |
| [📐 Design](./docs/design.md)   | UI/UX design, architecture, user flows |
| [🔧 Tech Stack](./docs/tech.md) | Technology choices, configuration      |
| [📋 Tasks](./docs/tasks.md)     | Development task list by phase         |
| [🗺️ Roadmap](./docs/roadmap.md) | Feature roadmap, release timeline      |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     SELENDRA TERMINAL                           │
├────────────────────────────────────────────────────────────────┤
│  PRESENTATION        UNIFICATION         DATA LAYER            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │ Explorer     │   │ Address      │   │ Substrate    │       │
│  │ Staking      │──▶│ Resolver     │──▶│ @polkadot/api│       │
│  │ Governance   │   │ Transaction  │   │              │       │
│  │ Developer    │   │ Normalizer   │   │ EVM          │       │
│  └──────────────┘   └──────────────┘   │ ethers.js    │       │
│                                        └──────────────┘       │
├────────────────────────────────────────────────────────────────┤
│  BLOCKCHAIN: Selendra (Substrate + Frontier EVM)               │
│  Consensus: AlephBFT │ Block Time: ~1s │ Finality: Instant    │
└────────────────────────────────────────────────────────────────┘
```

---

## Network Configuration

### Selendra Mainnet

| Property      | Value                          |
| ------------- | ------------------------------ |
| Chain ID      | 1961                           |
| SS58 Prefix   | 42                             |
| Token         | SEL (18 decimals)              |
| Substrate RPC | `wss://rpc.selendra.org`       |
| EVM RPC       | `https://rpc-evm.selendra.org` |

### Testnet

| Property      | Value                                  |
| ------------- | -------------------------------------- |
| Chain ID      | 1953                                   |
| Substrate RPC | `wss://rpc-testnet.selendra.org`       |
| EVM RPC       | `https://rpc-evm-testnet.selendra.org` |

---

## Tech Stack

| Category      | Technology                          |
| ------------- | ----------------------------------- |
| **Framework** | Next.js 16 (Turbopack)              |
| **UI**        | React 19, TypeScript 5.9            |
| **Styling**   | Tailwind CSS 3.4, CSS Variables     |
| **Substrate** | @polkadot/api, @selendrajs/sdk      |
| **EVM**       | ethers.js 6.15                      |
| **State**     | React Context, Zustand, React Query |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main layout routes
│   │   ├── blocks/        # Block explorer
│   │   ├── transactions/  # Transaction explorer
│   │   ├── accounts/      # Account explorer
│   │   ├── staking/       # Staking UI
│   │   ├── governance/    # Governance UI
│   │   ├── contracts/     # Contract explorer
│   │   └── developers/    # Developer tools
│   └── api/               # API routes
├── components/
│   ├── common/            # Shared components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── [feature]/         # Feature components
├── lib/
│   ├── blockchain/        # Chain utilities
│   ├── hooks/             # Custom hooks
│   └── utils/             # Helpers
└── styles/
    └── globals.css        # Theme variables
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=https://rpc.selendra.org
NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc-evm.selendra.org
NEXT_PUBLIC_CHAIN_ID=1961
NEXT_PUBLIC_TOKEN_SYMBOL=SEL
NEXT_PUBLIC_TOKEN_DECIMALS=18
```

---

## Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # TypeScript check
```

---

## Contributing

1. Read the [Design Document](./docs/design.md)
2. Check [Tasks](./docs/tasks.md) for available work
3. Follow the coding standards (ESLint, Prettier)
4. Submit PR with clear description

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Links

- [Selendra Website](https://selendra.org)
- [Documentation](https://docs.selendra.org)
- [GitHub](https://github.com/selendra)
- [Discord](https://discord.gg/selendra)
