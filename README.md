# Selendra Bridge Contracts

> Cross-chain asset bridge for Selendra Network using Sygma Protocol (ChainSafe Systems)

## Overview

This repository contains the **Sygma Protocol** bridge implementation for Selendra Network. It enables secure cross-chain asset transfers between Selendra and other EVM-compatible chains using Multi-Party Computation (MPC) security.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BRIDGE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌─────────────┐    ┌─────────────────────────────┐ │
│  │    User      │───▶│   Bridge    │───▶│        FeeRouter           │ │
│  │  deposit()   │    │  Contract   │    │  ┌─────────┐ ┌───────────┐ │ │
│  └──────────────┘    │  (420 LOC)  │    │  │ Basic   │ │ Percentage│ │ │
│                      └─────────────┘    │  │FeeHandler│ │FeeHandler │ │ │
│                            │            │  └─────────┘ └───────────┘ │ │
│                            ▼            └─────────────────────────────┘ │
│                      ┌─────────────┐                                    │
│                      │ Resource ID │───▶ Maps to Handler                │
│                      └─────────────┘                                    │
│                            │                                            │
│          ┌─────────────────┼─────────────────┐                          │
│          ▼                 ▼                 ▼                          │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│   │ ERC20Handler│   │ ERC721Handler│  │ GMP Handler │                   │
│   │ (lock/mint) │   │  (NFTs)     │   │ (messages)  │                   │
│   └─────────────┘   └─────────────┘   └─────────────┘                   │
│          │                                                              │
│          ▼                                                              │
│   ┌─────────────┐                                                       │
│   │  ERC20Safe  │ ← Holds locked tokens                                 │
│   └─────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### MPC Relayer System

```
   Chain A (Selendra)              Chain B (Ethereum/BSC/etc)
   ┌──────────────┐                ┌──────────────┐
   │   deposit()  │  ──Deposit──▶  │              │
   │   emit event │    Event       │   MPC        │
   └──────────────┘                │   Relayers   │
                                   │   (TSS)      │
   ┌──────────────┐                │              │
   │executeProposal│ ◀──Signed──── │              │
   │ verify(MPC)  │   Proposal     └──────────────┘
   └──────────────┘
```

## Contract Structure

| Contract                          | Purpose                                                  | Lines |
| --------------------------------- | -------------------------------------------------------- | ----- |
| **Bridge.sol**                    | Main entry point - deposits, proposals, MPC verification | 420   |
| **ERC20Handler.sol**              | Handle ERC20 lock/release or mint/burn                   | 165   |
| **BasicFeeHandler.sol**           | Flat fee collection                                      | 133   |
| **PercentageERC20FeeHandler.sol** | Percentage-based fee                                     | ~150  |
| **FeeHandlerRouter.sol**          | Route fees to correct handler                            | ~80   |
| **AccessControlSegregator.sol**   | Fine-grained access control                              | ~100  |

## Key Features

### 1. Multi-Party Computation (MPC) Security

```solidity
// Bridge uses MPC address for proposal verification
address public _MPCAddress;

function verify(Proposal[] memory proposals, bytes calldata signature) public view returns (bool) {
    // EIP-712 typed data signing
    address signer = _hashTypedDataV4(...).recover(signature);
    return signer == _MPCAddress;
}
```

### 2. Domain-Based Routing

```typescript
// Domain IDs
enum DomainId {
  local = 0,
  selendra = 1, // Mainnet
  selendraTestnet = 10, // Testnet
}
```

### 3. Resource ID System

Each token gets a unique 32-byte `resourceID` that maps to a handler address:

```solidity
mapping(bytes32 => address) public _resourceIDToHandlerAddress;
```

### 4. Two Token Strategies

- **Lock/Release (lr)**: Tokens locked on source, released on destination
- **Mint/Burn (mb)**: Tokens burned on source, minted on destination

## Network Configuration

| Network          | RPC URL                          | Chain ID | Domain ID |
| ---------------- | -------------------------------- | -------- | --------- |
| Selendra Mainnet | https://rpc.selendra.org         | 1961     | 1         |
| Selendra Testnet | https://rpc-testnet.selendra.org | 1953     | 10        |

## Deployment

### Prerequisites

```bash
cd bridge-contracts
npm install
```

### Deploy Bridge

```bash
# Set your private key
export PRIVATE_KEY=your_private_key

# Deploy to testnet
npx hardhat run scripts/01.deloy_brigde.ts --network selendraTestnet

# Deploy to mainnet
npx hardhat run scripts/01.deloy_brigde.ts --network selendra
```

### Deployment Order

1. **Deploy AccessControlSegregator** (13 admin functions)
2. **Deploy Bridge** (domainId, accessControlAddr)
3. **Deploy DefaultMessageReceiver**
4. **Deploy ERC20Handler** (bridgeAddr, messageReceiverAddr)
5. **Deploy FeeHandlerRouter** (bridgeAddr)
6. **Deploy BasicFeeHandler** (bridgeAddr, feeRouterAddr)
7. **Deploy PercentageERC20FeeHandler** (bridgeAddr, feeRouterAddr)
8. **Configure Bridge**: `Bridge.adminChangeFeeHandler(feeRouterAddr)`
9. **For each token**: `setupErc20()` and `bridgeRegister()`

### Setup ERC20 Token

```bash
# Edit scripts/02.setup_erc20.ts with token details
npx hardhat run scripts/02.setup_erc20.ts --network selendraTestnet
```

### Register Bridge Resource

```bash
# Edit scripts/03.bridge_resgister.ts with addresses
npx hardhat run scripts/03.bridge_resgister.ts --network selendraTestnet
```

## Security Features

| Feature            | Implementation                                         |
| ------------------ | ------------------------------------------------------ |
| **Pausing**        | `adminPauseTransfers()` / `adminUnpauseTransfers()`    |
| **Access Control** | Function-level permissions via AccessControlSegregator |
| **Nonce Tracking** | Bitmap for efficient storage of used nonces            |
| **MPC Keygen**     | `startKeygen()` → `endKeygen()` → MPC address set      |
| **Key Refresh**    | `refreshKey(hash)` for topology changes                |
| **Retry Failed**   | `retry(txHash)` for failed deposits                    |

## Integration Guide

### Read Bridge State

```typescript
import { ethers } from "ethers";

const bridge = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, provider);

// Fetch deposit count per domain
const depositCount = await bridge._depositCounts(destinationDomainID);

// Check if proposal executed
const isExecuted = await bridge.isProposalExecuted(domainID, nonce);

// Get fee for transfer
const feeHandler = new ethers.Contract(
  FEE_HANDLER_ADDRESS,
  FEE_HANDLER_ABI,
  provider
);
const [fee, tokenAddress] = await feeHandler.calculateFee(
  sender,
  fromDomainID,
  destinationDomainID,
  resourceID,
  depositData,
  feeData
);
```

### Listen for Events

```typescript
// Listen for deposits
bridge.on("Deposit", (destDomain, resourceID, nonce, user, data, response) => {
  console.log(`Deposit #${nonce} to domain ${destDomain} by ${user}`);
});

// Listen for executions
bridge.on("ProposalExecution", (originDomain, nonce, dataHash, response) => {
  console.log(`Proposal #${nonce} from domain ${originDomain} executed`);
});
```

### Execute Bridge Transfer

```typescript
// 1. Approve token spending
const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
await token.approve(ERC20_HANDLER_ADDRESS, amount);

// 2. Encode deposit data
const depositData = ethers.AbiCoder.defaultAbiCoder().encode(
  ["uint256", "uint256", "bytes"],
  [amount, recipientAddress.length, recipientAddress]
);

// 3. Call deposit
const bridge = new ethers.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, signer);
const tx = await bridge.deposit(
  destinationDomainID,
  resourceID,
  depositData,
  "0x", // feeData
  { value: bridgeFee }
);

await tx.wait();
```

## TODO

- [ ] Deploy contracts to mainnet with real addresses
- [ ] Add ERC721 Handler for NFT bridging
- [ ] Add GMP Handler for arbitrary message passing
- [ ] Create Subgraph to index bridge events
- [ ] Write comprehensive tests
- [ ] Document deployed contract addresses

## License

LGPL-3.0-only

## Credits

Based on [Sygma Protocol](https://github.com/sygmaprotocol) by ChainSafe Systems.
