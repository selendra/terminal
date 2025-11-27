# Selendra Terminal

The ultimate super dApp for Selendra blockchain - featuring a comprehensive blockchain explorer with dual VM (EVM + WASM) support, wallet integration, staking, governance, and cross-chain bridge.

![Selendra Terminal](./docs/preview.png)

## Features

### 🔍 Blockchain Explorer

- **Dual VM Support**: Explore both EVM and Substrate (WASM) transactions
- **Block Explorer**: View latest blocks with detailed information
- **Transaction Viewer**: Track transactions with decoded input data
- **Account Details**: View balances, token holdings, and transaction history
- **Token Tracker**: Explore all tokens on Selendra network
- **Smart Contracts**: Browse and interact with verified contracts

### 💰 DeFi Features

- **Staking**: Stake SEL tokens with validators
- **Governance**: Participate in network governance through proposals
- **Bridge**: Cross-chain asset transfers (Ethereum, BSC, Polygon, etc.)
- **DeFi Dashboard**: Track TVL, yields, and protocol metrics

### 🔧 Developer Tools

- **API Documentation**: REST API for building applications
- **Gas Tracker**: Real-time gas fee estimates
- **Contract Verification**: Verify and publish smart contract source code

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **State Management**: React Context + Hooks
- **Blockchain SDK**: @selendrajs/sdk
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
cd ~/projects/selendra-biz/selendra/devtools/terminal
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Configure environment variables:

```env
NEXT_PUBLIC_SELENDRA_RPC=wss://rpc.selendra.org
NEXT_PUBLIC_SELENDRA_EVM_RPC=https://evm.selendra.org
NEXT_PUBLIC_EXPLORER_API=https://api.selendra.org
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── address/           # Account details pages
│   ├── api-docs/          # API documentation
│   ├── blocks/            # Block explorer
│   ├── bridge/            # Cross-chain bridge
│   ├── contracts/         # Smart contracts
│   ├── governance/        # Governance proposals
│   ├── staking/           # Staking interface
│   ├── tokens/            # Token tracker
│   ├── transactions/      # Transaction explorer
│   └── tx/               # Transaction details
├── components/
│   ├── api/              # API documentation components
│   ├── bridge/           # Bridge components
│   ├── contracts/        # Contract explorer components
│   ├── dashboard/        # Dashboard widgets
│   ├── explorer/         # Explorer components
│   ├── governance/       # Governance components
│   ├── layout/           # Layout components (Sidebar, Header)
│   ├── providers/        # React Context providers
│   ├── staking/          # Staking components
│   └── tokens/           # Token explorer components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and SDK integration
│   └── selendra/         # Selendra SDK integration
└── types/                # TypeScript type definitions
```

## SDK Integration

This project uses `@selendrajs/sdk` for blockchain interactions:

```typescript
import { Selendra } from "@/lib/selendra/client";

// Initialize client
const selendra = new Selendra({
  rpcUrl: process.env.NEXT_PUBLIC_SELENDRA_RPC,
  evmRpcUrl: process.env.NEXT_PUBLIC_SELENDRA_EVM_RPC,
});

// Get account balance
const balance = await selendra.getBalance(address);

// Send transaction
const tx = await selendra.transfer(to, amount);
```

## API Endpoints

The Terminal provides a REST API for developers:

### Accounts

- `GET /api/v1/account/{address}` - Get account information
- `GET /api/v1/account/{address}/transactions` - Get account transactions
- `GET /api/v1/account/{address}/tokens` - Get token balances

### Blocks

- `GET /api/v1/block/{number}` - Get block by number
- `GET /api/v1/blocks` - List recent blocks

### Transactions

- `GET /api/v1/tx/{hash}` - Get transaction details
- `GET /api/v1/transactions` - List transactions

### Tokens

- `GET /api/v1/token/{address}` - Get token information
- `GET /api/v1/tokens` - List all tokens

### Stats

- `GET /api/v1/stats` - Network statistics
- `GET /api/v1/stats/price` - SEL price information

## Wallet Support

Supported wallets:

- MetaMask (EVM)
- Selendra Wallet (Native)
- Talisman (Substrate)
- SubWallet (Substrate)
- WalletConnect

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues

# Type checking
npm run typecheck    # Run TypeScript compiler
```

## Environment Variables

| Variable                       | Description                     | Default                       |
| ------------------------------ | ------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_SELENDRA_RPC`     | Selendra WebSocket RPC endpoint | `wss://rpc.selendra.org`      |
| `NEXT_PUBLIC_SELENDRA_EVM_RPC` | Selendra EVM HTTP RPC endpoint  | `https://evm.selendra.org`    |
| `NEXT_PUBLIC_EXPLORER_API`     | Explorer API endpoint           | `https://api.selendra.org`    |
| `NEXT_PUBLIC_BRIDGE_API`       | Bridge service API              | `https://bridge.selendra.org` |

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Selendra Website](https://selendra.org)
- [Documentation](https://docs.selendra.org)
- [GitHub](https://github.com/selendra)
- [Discord](https://discord.gg/selendra)
- [Twitter](https://twitter.com/selaborative)
