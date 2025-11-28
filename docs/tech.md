# Selendra Terminal - Technology Stack

> **Technical foundation for the unified dual-VM blockchain explorer**

---

## Overview

Selendra Terminal is built with modern web technologies optimized for real-time blockchain data, dual-VM support, and excellent developer experience.

---

## Core Framework

### Next.js 16

```json
{
  "next": "16.0.5"
}
```

**Configuration:**

- **Build Tool**: Turbopack (default in Next.js 16)
- **Rendering**: App Router with Server Components
- **Output**: Standalone for Docker deployment
- **Features**:
  - React Server Components
  - Streaming SSR
  - Automatic code splitting
  - Image optimization

### React 19

```json
{
  "react": "19.2.0",
  "react-dom": "19.2.0"
}
```

**Features Used:**

- Concurrent rendering
- Automatic batching
- Server Components
- Suspense for data fetching
- useTransition for non-blocking updates

### TypeScript 5.9

```json
{
  "typescript": "5.9.0"
}
```

**Configuration:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "preserve"
  }
}
```

---

## Styling

### Tailwind CSS 3.4

```json
{
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.31",
  "autoprefixer": "^10.4.16"
}
```

**Custom Configuration:**

```javascript
// tailwind.config.ts
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "selendra-teal": "#0db0a4",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... CSS variable mappings
      },
    },
  },
};
```

### CSS Variables Theme System

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --selendra-teal: 175 93% 35%;
  /* ... */
}

.dark {
  --background: 0 0% 7%;
  --foreground: 0 0% 95%;
  /* ... */
}
```

---

## Blockchain SDKs

### @selendrajs/sdk

```json
{
  "@selendrajs/sdk": "1.0.4"
}
```

**Purpose**: Primary SDK for Selendra-specific functionality

- Chain constants (decimals, SS58 prefix)
- Precompile addresses
- Helper utilities

### @polkadot/api

```json
{
  "@polkadot/api": "14.3.1",
  "@polkadot/extension-dapp": "^0.46.x",
  "@polkadot/util": "^13.4.4",
  "@polkadot/util-crypto": "^13.4.4"
}
```

**Purpose**: Substrate chain interaction

- RPC queries
- Extrinsic building
- Event subscriptions
- Wallet extension integration

### ethers.js

```json
{
  "ethers": "6.15.0"
}
```

**Purpose**: EVM layer interaction

- JSON-RPC calls
- Transaction building
- Contract interaction
- Event filtering

---

## State Management

### React Context

**Purpose**: Global state for providers

- `BlockchainProvider` - Chain connection state
- `WalletProvider` - Wallet connection state
- `ThemeProvider` - Theme preferences

### Zustand (Planned)

```json
{
  "zustand": "^4.5.0"
}
```

**Purpose**: Complex state management

- Account data caching
- Transaction queue
- UI preferences

### React Query (TanStack Query)

```json
{
  "@tanstack/react-query": "^5.0.0"
}
```

**Purpose**: Server state management

- Data fetching with caching
- Background refetching
- Optimistic updates
- Infinite scrolling

---

## UI Components

### Icons

```json
{
  "lucide-react": "^0.460.0"
}
```

**Usage**: Consistent icon set across the application

### Animation

```json
{
  "framer-motion": "^10.16.0"
}
```

**Usage**: Page transitions, micro-interactions

### Charts

```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0"
}
```

**Usage**: Price charts, analytics visualizations

### Code Editor (Planned)

```json
{
  "@monaco-editor/react": "^4.6.x"
}
```

**Usage**: Contract source viewer, JS console

---

## Network Configuration

### Selendra Mainnet

| Property         | Value                       |
| ---------------- | --------------------------- |
| **Chain ID**     | 1961                        |
| **SS58 Prefix**  | 42                          |
| **Decimals**     | 18                          |
| **Token Symbol** | SEL                         |
| **Block Time**   | ~1 second                   |
| **Consensus**    | AlephBFT (instant finality) |

### RPC Endpoints

| Type               | URL                            |
| ------------------ | ------------------------------ |
| **Substrate WS**   | `wss://rpc.selendra.org`       |
| **Substrate HTTP** | `https://rpc.selendra.org`     |
| **EVM HTTP**       | `https://rpc-evm.selendra.org` |

### Testnet

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| **Chain ID**     | 1953                                   |
| **Substrate WS** | `wss://rpc-testnet.selendra.org`       |
| **EVM HTTP**     | `https://rpc-evm-testnet.selendra.org` |

---

## Precompile Addresses

Selendra exposes Substrate functionality to EVM via precompiles:

| Precompile           | Address                                      | Purpose                        |
| -------------------- | -------------------------------------------- | ------------------------------ |
| **Staking**          | `0x0000000000000000000000000000000000000403` | Stake, nominate, claim rewards |
| **DEX**              | `0x0000000000000000000000000000000000000408` | Token swaps, liquidity         |
| **Unified Accounts** | `0x0000000000000000000000000000000000000801` | Address linking                |

---

## Indexer Strategy

### Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                      INDEXER ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │     SubQuery        │    │   Frontier Indexer  │            │
│  │   (Substrate)       │    │      (EVM)          │            │
│  │                     │    │                     │            │
│  │ - Extrinsics        │    │ - EVM Transactions  │            │
│  │ - Events            │    │ - Contract Events   │            │
│  │ - Staking           │    │ - Token Transfers   │            │
│  │ - Governance        │    │ - Contract State    │            │
│  │ - Identity          │    │                     │            │
│  └──────────┬──────────┘    └──────────┬──────────┘            │
│             │                          │                        │
│             └────────────┬─────────────┘                        │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              UNIFICATION SERVICE (Thin Layer)            │   │
│  │                                                          │   │
│  │  - Address mapping (SS58 ↔ 0x)                          │   │
│  │  - Transaction merging                                   │   │
│  │  - Contract type detection                               │   │
│  │  - Token standard mapping (ERC-20 ↔ PSP-22)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GraphQL API                           │   │
│  │                                                          │   │
│  │  query GetAccountActivity($address: String!) {          │   │
│  │    account(address: $address) {                         │   │
│  │      substrateAddress                                   │   │
│  │      evmAddress                                         │   │
│  │      transactions(first: 20) { ... }                    │   │
│  │    }                                                    │   │
│  │  }                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SubQuery Setup

```typescript
// subquery/project.yaml
specVersion: 1.0.0
name: selendra-substrate-indexer
version: 1.0.0
runner:
  node:
    name: '@subql/node-substrate'
    version: '*'
  query:
    name: '@subql/query'
    version: '*'
description: Selendra Substrate chain indexer
repository: https://github.com/selendra/terminal-indexer
schema:
  file: ./schema.graphql
network:
  chainId: '0x...'
  endpoint: wss://rpc.selendra.org
  dictionary: https://api.subquery.network/sq/subquery/selendra-dictionary
```

### Data Models

```graphql
# Unified account
type Account @entity {
  id: ID! # Primary address (SS58)
  evmAddress: String @index
  substrateAddress: String! @index
  balance: BigInt!
  nonce: Int!
  createdAt: DateTime!
}

# Unified transaction
type Transaction @entity {
  id: ID! # Transaction hash
  type: TransactionType! # SUBSTRATE or EVM
  blockNumber: Int! @index
  timestamp: DateTime! @index
  from: Account!
  to: Account
  value: BigInt
  fee: BigInt
  success: Boolean!
  method: String # For Substrate: pallet.method
  data: String # Raw input data
}

enum TransactionType {
  SUBSTRATE
  EVM
}
```

---

## Infrastructure

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  terminal:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
      - NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc-evm.selendra.org
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Local node for development
  selendra-node:
    image: image.koompi.org/library/selendra-rpc:latest
    ports:
      - "9933:9933"
      - "9944:9944"
    volumes:
      - selendra-data:/data
    command: |
      --chain=selendra
      --rpc-external
      --rpc-cors=all
      --name=local-terminal-node

volumes:
  selendra-data:
```

---

## Environment Variables

```bash
# .env.local
# Network
NEXT_PUBLIC_SUBSTRATE_RPC_WS=wss://rpc.selendra.org
NEXT_PUBLIC_SUBSTRATE_RPC_HTTP=https://rpc.selendra.org
NEXT_PUBLIC_EVM_RPC_HTTP=https://rpc-evm.selendra.org

# Chain
NEXT_PUBLIC_CHAIN_ID=1961
NEXT_PUBLIC_SS58_PREFIX=42
NEXT_PUBLIC_TOKEN_SYMBOL=SEL
NEXT_PUBLIC_TOKEN_DECIMALS=18

# Indexer (when available)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.terminal.selendra.org/graphql

# Features
NEXT_PUBLIC_ENABLE_TESTNET=true
NEXT_PUBLIC_ENABLE_DEV_TOOLS=true
```

---

## Project Structure

```
/src
├── app/                      # Next.js App Router
│   ├── (main)/              # Main layout group
│   │   ├── page.tsx         # Dashboard
│   │   ├── blocks/          # Block explorer
│   │   ├── transactions/    # Transaction explorer
│   │   ├── accounts/        # Account explorer
│   │   ├── staking/         # Staking UI
│   │   ├── governance/      # Governance UI
│   │   ├── contracts/       # Contract explorer
│   │   ├── tokens/          # Token explorer
│   │   └── developers/      # Developer tools
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
│
├── components/
│   ├── common/              # Shared components
│   │   ├── AddressDisplay.tsx
│   │   ├── VMBadge.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── DataTable.tsx
│   │   └── ...
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── providers/           # Context providers
│   │   ├── BlockchainProvider.tsx
│   │   ├── WalletProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── explorer/            # Explorer components
│   ├── staking/             # Staking components
│   ├── governance/          # Governance components
│   ├── contracts/           # Contract components
│   └── tokens/              # Token components
│
├── lib/
│   ├── api/                 # API clients
│   ├── blockchain/          # Blockchain utilities
│   │   ├── substrate.ts
│   │   ├── evm.ts
│   │   └── unified.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useBalance.ts
│   │   ├── useBlocks.ts
│   │   └── ...
│   └── utils/               # Helper functions
│       ├── format.ts
│       ├── address.ts
│       └── ...
│
├── styles/
│   └── globals.css          # Global styles + CSS variables
│
└── types/
    ├── blockchain.ts        # Blockchain types
    ├── api.ts              # API types
    └── ui.ts               # UI types
```

---

## Development Workflow

### Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Building
npm run build           # Production build
npm run start           # Start production server

# Quality
npm run lint            # ESLint
npm run type-check      # TypeScript check

# Docker
docker compose up -d                      # Production
docker compose -f docker-compose.local.yml up -d  # With local node
```

### Git Workflow

```
main          ← Production releases
  │
  └── develop ← Integration branch
        │
        ├── feature/xxx  ← New features
        ├── fix/xxx      ← Bug fixes
        └── docs/xxx     ← Documentation
```

---

## Performance Targets

| Metric                     | Target |
| -------------------------- | ------ |
| **First Contentful Paint** | < 1.5s |
| **Time to Interactive**    | < 3s   |
| **Lighthouse Performance** | > 90   |
| **Block Display Latency**  | < 1s   |
| **Transaction Submission** | < 3s   |

### Optimization Strategies

1. **Code Splitting** - Route-based chunking via Next.js
2. **Data Caching** - React Query with stale-while-revalidate
3. **Virtual Scrolling** - For large lists (react-virtual)
4. **Image Optimization** - Next.js Image component
5. **WebSocket Efficiency** - Single connection, multiplexed subscriptions

---

## Security Considerations

### Client-Side

1. **No Private Keys** - Never handle private keys in frontend
2. **Wallet Integration** - Delegate signing to wallet extensions
3. **Input Validation** - Validate all user inputs before submission
4. **CORS** - Proper CORS configuration for API calls

### Data Handling

1. **Address Validation** - Verify address formats before queries
2. **Amount Validation** - Check balance before transaction building
3. **Gas Estimation** - Always estimate before submission
4. **Error Boundaries** - Graceful error handling

---

## Monitoring & Analytics

### Error Tracking (Planned)

```json
{
  "@sentry/nextjs": "^7.x"
}
```

### Analytics (Planned)

```json
{
  "plausible-tracker": "^0.3.x"
}
```

### Health Checks

```typescript
// /api/health/route.ts
export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      substrate: await checkSubstrateConnection(),
      evm: await checkEvmConnection(),
    },
  };
  return Response.json(health);
}
```

---

_Document Version: 1.0_  
_Last Updated: 2025_  
_Project: Selendra Terminal_
