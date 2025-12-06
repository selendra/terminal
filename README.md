# Selendra Terminal

> **The Unified Dual-VM Blockchain Explorer & Portal**

A comprehensive interface for Selendra's Substrate + EVM ecosystem. One application for exploring, transacting, staking, and governing.

![Version](https://img.shields.io/badge/version-1.0.0--beta.1-blue?style=for-the-badge)
![Selendra Terminal](https://img.shields.io/badge/Selendra-Terminal-0db0a4?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square)

---

## Overview

Selendra Terminal replaces multiple fragmented tools with a **single unified interface**:

- ✅ **Block Explorer** - Substrate + EVM blocks, transactions, accounts
- ✅ **Wallet Portal** - Multi-wallet connection (Polkadot.js, Talisman, SubWallet, MetaMask, WalletConnect)
- ✅ **Staking** - Nominate validators, nomination pools, EVM staking precompile
- ✅ **Governance** - OpenGov referenda, voting, delegation, treasury proposals
- ✅ **Identity** - On-chain identity, multisig, proxy accounts, .sel domains (SNS)
- ✅ **Developer Tools** - Extrinsic builder, chain state, RPC browser, ink! contracts
- ✅ **DeFi** - Token swaps, liquidity, lending (UI ready)

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

### Production Deployment (with Indexer and Reverse Proxy)

This setup runs the full Selendra Terminal stack in a production-like environment, including the application, the SubQuery indexer, and a Traefik reverse proxy for SSL termination.

**Prerequisites:**

*   Docker and Docker Compose
*   A registered domain name pointed to your server's IP address.
*   An email address for Let's Encrypt SSL certificate registration.

**Setup:**

1.  **Create an Environment File:**

    Create a `.env` file in the root of the project and add the following variables:

    ```bash
    # .env
    # Your domain for the indexer's GraphQL API
    INDEXER_HOSTNAME=indexer.your-domain.com

    # Your email for Let's Encrypt
    ACME_EMAIL=your-email@example.com
    ```

2.  **Create Secret Files:**

    Create a `secrets` directory inside the `indexer` directory. Then, create the following files inside `indexer/secrets`:

    *   `postgres_user`: This file should contain the desired username for the PostgreSQL database.
    *   `postgres_password`: This file should contain the desired password for the PostgreSQL database.
    *   `postgres_db`: This file should contain the desired name for the PostgreSQL database.

    **Example:**

    ```bash
    mkdir -p indexer/secrets
    echo "myuser" > indexer/secrets/postgres_user
    echo "a-very-secure-password" > indexer/secrets/postgres_password
    echo "mydatabase" > indexer/secrets/postgres_db
    ```

    These files will be used as Docker secrets to securely provide the database credentials to the services. A `.gitignore` file is included in the `indexer/secrets` directory to prevent you from accidentally committing these files to your repository.

3.  **Create the Docker Network:**

    Traefik and the indexer services run in separate Docker Compose files but need to communicate. Create an external Docker network for them to share:

    ```bash
    docker network create selendra-indexer-prod
    ```

3.  **Run the Services:**

    Start the Traefik reverse proxy first, then the indexer services:

    ```bash
    # Start Traefik
    docker compose -f docker-compose.reverse-proxy.yml up -d

    # Start the indexer services
    docker compose -f indexer/docker-compose.prod.yml up -d
    ```

    Finally, start the main application:

    ```bash
    # Start the Selendra Terminal application
    docker compose up -d
    ```

4.  **Run the Monitoring Stack (Optional):**

    To monitor the indexer services, you can run the monitoring stack which includes Prometheus and Grafana:

    ```bash
    docker compose -f docker-compose.monitoring.yml up -d
    ```

**Services:**

*   **Selendra Terminal:** The main Next.js application. The domain for this service should be configured in your main `docker-compose.yml` file.
*   **Indexer GraphQL API:** The SubQuery GraphQL API, accessible at the `INDEXER_HOSTNAME` you configured (e.g., `https://indexer.your-domain.com`). You can use this endpoint to query the indexed blockchain data.
*   **Traefik Dashboard:** The Traefik dashboard is available at `http://localhost:8080`. It provides a web UI to see the status of your services and the routes that have been created.
*   **Prometheus:** The Prometheus server is available at `http://localhost:9090`. You can use it to view the metrics of the indexer services.
*   **Grafana:** The Grafana server is available at `http://localhost:3000`. You can use it to create dashboards to visualize the metrics collected by Prometheus. The default login is `admin`/`admin`.

**Note on Initial Indexer Sync:**

When you first start the indexer, it will need to sync the entire history of the Selendra blockchain. This process can take a significant amount of time, depending on the size of the chain. You can monitor the progress by checking the logs of the `selendra-indexer-node-prod` container. You can also use the Prometheus and Grafana dashboards to monitor the sync status.

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

| Category      | Technology                              |
| ------------- | --------------------------------------- |
| **Framework** | Next.js 16 (Turbopack)                  |
| **UI**        | React 19, TypeScript 5.6                |
| **Styling**   | Tailwind CSS 3.4, CSS Variables         |
| **Substrate** | @polkadot/api 14.x, @selendrajs/sdk     |
| **EVM**       | ethers.js 6.13                          |
| **State**     | React Context, Zustand 5, React Query 5 |
| **Charts**    | Chart.js 4, react-chartjs-2             |

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
│   ├── common/            # Shared components (AddressDisplay, VMBadge, etc.)
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers (Blockchain, Wallet, Theme)
│   ├── explorer/          # Explorer components
│   ├── staking/           # Staking components
│   ├── governance/        # Governance components
│   ├── identity/          # Identity & account management
│   ├── developer/         # Developer tools
│   ├── defi/              # DeFi components
│   └── wallet/            # Wallet components
├── lib/
│   ├── staking/           # Staking service
│   ├── governance/        # Governance service
│   ├── unified/           # Dual-VM unification layer
│   ├── sns/               # Selendra Naming Service
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores
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
