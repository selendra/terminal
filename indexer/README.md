# Selendra Terminal Unified Indexer

SubQuery-based indexer for the Selendra Terminal blockchain explorer. Indexes both Substrate and EVM (Frontier) data into a unified schema.

## Features

- **Dual-VM Indexing**: Indexes both Substrate extrinsics and EVM transactions
- **Unified Accounts**: Maps SS58 and 0x addresses to unified account records
- **Token Tracking**: ERC-20, ERC-721, and ERC-1155 token transfers and balances
- **Staking Data**: Bond, unbond, and reward events
- **Governance**: Democracy proposals and votes
- **Statistics**: Daily chain statistics and analytics

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- pnpm or npm

### Local Development (Full Stack)

The easiest way to run the indexer locally is with the full docker-compose setup:

```bash
# From the terminal directory (parent of indexer/)
cd /path/to/devtools/terminal

# Start everything: Selendra node, PostgreSQL, SubQuery Node, GraphQL API
docker compose -f docker-compose.local.yml up -d

# View logs
docker compose -f docker-compose.local.yml logs -f subquery-node graphql-engine

# Stop everything
docker compose -f docker-compose.local.yml down
```

**Services available:**

| Service      | URL                           | Description                  |
| ------------ | ----------------------------- | ---------------------------- |
| GraphQL API  | http://localhost:3001/graphql | SubQuery GraphQL Playground  |
| Selendra RPC | http://localhost:9933         | HTTP JSON-RPC                |
| Selendra WS  | ws://localhost:9944           | WebSocket RPC                |
| PostgreSQL   | localhost:5432                | Database (subquery/subquery) |

### Development Setup (Indexer Only)

If you already have a Selendra node running:

```bash
cd indexer

# Install dependencies
npm install

# Generate types from schema
npm run codegen

# Build the project
npm run build

# Start indexer services only (requires running node at ws://localhost:9944)
npm run start:local

# View logs
npm run logs

# Stop services
npm run stop:local
```

## GraphQL API

### Sample Queries

**Get account with transactions:**

```graphql
query GetAccount($address: String!) {
  account(id: $address) {
    substrateAddress
    evmAddress
    isUnified
    freeBalance
    transactionCount
    transactionsSent(first: 10, orderBy: TIMESTAMP_DESC) {
      nodes {
        hash
        type
        value
        fee
        status
        timestamp
      }
    }
  }
}
```

**Get recent transactions:**

```graphql
query RecentTransactions {
  transactions(first: 20, orderBy: TIMESTAMP_DESC) {
    nodes {
      hash
      type
      from {
        substrateAddress
        evmAddress
      }
      to {
        substrateAddress
        evmAddress
      }
      value
      status
      timestamp
    }
  }
}
```

**Get sync status:**

```graphql
query SyncStatus {
  _metadata {
    lastProcessedHeight
    targetHeight
  }
}
```

## Schema

### Core Entities

| Entity        | Description                                     |
| ------------- | ----------------------------------------------- |
| `Account`     | Unified account with both SS58 and 0x addresses |
| `Block`       | Block with aggregated statistics                |
| `Transaction` | Unified transaction (Substrate or EVM)          |
| `Event`       | Blockchain events/logs                          |

### Token Entities

| Entity          | Description                     |
| --------------- | ------------------------------- |
| `Token`         | ERC-20/721/1155 token contracts |
| `TokenBalance`  | Account token balances          |
| `TokenTransfer` | Token transfer events           |

### Staking & Governance Entities

| Entity          | Description                         |
| --------------- | ----------------------------------- |
| `StakingInfo`   | Account staking status and balances |
| `StakingReward` | Historical staking rewards          |
| `Proposal`      | Democracy proposals                 |
| `Vote`          | Individual votes on proposals       |

## Configuration

### Environment Variables

| Variable      | Default    | Description       |
| ------------- | ---------- | ----------------- |
| `DB_HOST`     | `postgres` | PostgreSQL host   |
| `DB_PORT`     | `5432`     | PostgreSQL port   |
| `DB_USER`     | `subquery` | Database user     |
| `DB_PASS`     | `subquery` | Database password |
| `DB_DATABASE` | `subquery` | Database name     |

## Project Structure

```
indexer/
├── src/
│   ├── index.ts                 # Entry point
│   └── mappings/
│       ├── blockHandler.ts      # Block processing
│       ├── substrateHandlers.ts # Substrate events
│       ├── evmHandlers.ts       # EVM transactions
│       ├── tokenHandlers.ts     # Token transfers
│       ├── stakingHandlers.ts   # Staking events
│       ├── governanceHandlers.ts # Governance
│       └── utils.ts             # Helper functions
├── abis/                        # Contract ABIs
├── schema.graphql               # GraphQL schema
├── project.yaml                 # SubQuery config
├── chaintypes.yaml              # Selendra types
├── docker-compose.yml           # Docker setup (standalone)
└── package.json
```

## License

MIT License
