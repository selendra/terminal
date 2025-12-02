# Unified Account Mapping System

> Replacing `address-converter` with Selendra's on-chain Unified Accounts

## Overview

Selendra implements a **Unified Accounts** pallet that provides on-chain bidirectional mapping between:
- **SS58 addresses** (Substrate native, e.g., `seL...`)
- **H160 addresses** (EVM/Ethereum style, e.g., `0x...`)

This eliminates the need for client-side address conversion and ensures consistency across the entire network.

## Why Replace Address Converter?

| Aspect | Old: address-converter | New: Unified Accounts |
|--------|----------------------|----------------------|
| **Source of Truth** | Client-side calculation | On-chain storage |
| **Consistency** | May vary by implementation | Network-wide consensus |
| **Existing Wallets** | Cannot link MetaMask addresses | Can claim existing 0x addresses |
| **User Experience** | Shows both address formats | Single 0x address for users |
| **Verification** | Trust client library | Verifiable on-chain |

## How It Works

### Address Claiming Methods

#### 1. `claim_default_evm_address()`
Auto-generates a deterministic H160 address from the SS58 account.

```typescript
// User calls this to get their default 0x address
const tx = api.tx.unifiedAccounts.claimDefaultEvmAddress();
await tx.signAndSend(account);
```

**Use Case**: New users who don't have an existing MetaMask wallet.

#### 2. `claim_evm_address(evm_address, signature)`
Links an existing MetaMask/EVM address using EIP-712 signature.

```typescript
// User signs a message in MetaMask, then claims on-chain
const tx = api.tx.unifiedAccounts.claimEvmAddress(evmAddress, signature);
await tx.signAndSend(account);
```

**Use Case**: Users who want to use their existing MetaMask address.

### Storage Maps

```rust
// On-chain storage (read-only for frontend)
NativeToEvm: Map<AccountId32, H160>    // SS58 → 0x
EvmToNative: Map<H160, AccountId32>    // 0x → SS58
```

## Frontend Implementation

### 1. Check if Address is Mapped

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';

async function getEvmAddress(ss58Address: string): Promise<string | null> {
  const api = await ApiPromise.create({ 
    provider: new WsProvider('wss://rpc.selendra.org') 
  });
  
  // Query the NativeToEvm storage map
  const evmAddress = await api.query.unifiedAccounts.nativeToEvm(ss58Address);
  
  if (evmAddress.isSome) {
    return evmAddress.unwrap().toHex();
  }
  return null;
}

async function getNativeAddress(evmAddress: string): Promise<string | null> {
  const api = await ApiPromise.create({ 
    provider: new WsProvider('wss://rpc.selendra.org') 
  });
  
  // Query the EvmToNative storage map
  const nativeAddress = await api.query.unifiedAccounts.evmToNative(evmAddress);
  
  if (nativeAddress.isSome) {
    return nativeAddress.unwrap().toString();
  }
  return null;
}
```

### 2. Wallet Creation Flow (Show Only 0x)

```typescript
import { Keyring } from '@polkadot/keyring';
import { ApiPromise, WsProvider } from '@polkadot/api';

async function createWalletWithUnifiedAddress() {
  const api = await ApiPromise.create({ 
    provider: new WsProvider('wss://rpc.selendra.org') 
  });
  
  // 1. Generate new keypair (internally SS58)
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromMnemonic(generateMnemonic());
  
  // 2. Claim default EVM address on-chain
  const tx = api.tx.unifiedAccounts.claimDefaultEvmAddress();
  await tx.signAndSend(account, ({ status }) => {
    if (status.isFinalized) {
      console.log('Address claimed on-chain');
    }
  });
  
  // 3. Fetch the mapped 0x address
  const evmAddress = await api.query.unifiedAccounts.nativeToEvm(account.address);
  
  // 4. Display ONLY the 0x address to user
  return {
    displayAddress: evmAddress.unwrap().toHex(), // "0x..."
    // Keep SS58 internally for signing
    _internal: account.address
  };
}
```

### 3. Address Display Component

```tsx
// components/AddressDisplay.tsx
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/hooks/useApi';

interface Props {
  address: string; // Can be SS58 or H160
}

export function UnifiedAddressDisplay({ address }: Props) {
  const { api } = useApi();
  const [displayAddress, setDisplayAddress] = useState<string>('');
  
  useEffect(() => {
    async function resolveAddress() {
      if (!api) return;
      
      // If already 0x format, use directly
      if (address.startsWith('0x')) {
        setDisplayAddress(address);
        return;
      }
      
      // Otherwise, look up the mapped EVM address
      const evmAddress = await api.query.unifiedAccounts.nativeToEvm(address);
      
      if (evmAddress.isSome) {
        setDisplayAddress(evmAddress.unwrap().toHex());
      } else {
        // Fallback: address not yet claimed
        setDisplayAddress(`${address.slice(0, 8)}...${address.slice(-6)}`);
      }
    }
    
    resolveAddress();
  }, [api, address]);
  
  return (
    <span className="font-mono text-sm">
      {displayAddress || 'Loading...'}
    </span>
  );
}
```

### 4. Link Existing MetaMask Address

```typescript
import { ethers } from 'ethers';

async function linkMetaMaskAddress(api: ApiPromise, substrateAccount: any) {
  // 1. Connect MetaMask
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const evmAddress = await signer.getAddress();
  
  // 2. Get the chain ID for EIP-712
  const chainId = api.consts.evmChainId?.chainId?.toNumber() || 1961;
  
  // 3. Create EIP-712 typed data
  const domain = {
    name: 'Selendra EVM Claim',
    version: '1',
    chainId: chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000'
  };
  
  const types = {
    Claim: [
      { name: 'substrateAddress', type: 'bytes32' }
    ]
  };
  
  const value = {
    substrateAddress: substrateAccount.publicKey
  };
  
  // 4. Sign with MetaMask
  const signature = await signer.signTypedData(domain, types, value);
  
  // 5. Submit claim transaction
  const tx = api.tx.unifiedAccounts.claimEvmAddress(evmAddress, signature);
  await tx.signAndSend(substrateAccount);
  
  return evmAddress;
}
```

## RPC Endpoints

### Direct Storage Queries

```bash
# Get EVM address for SS58 account
curl -X POST -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"state_getStorage",
    "params":["0x<NativeToEvm_prefix><account_hash>"]
  }' \
  https://rpc.selendra.org

# Check if EVM address is claimed
curl -X POST -H "Content-Type: application/json" \
  --data '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"unifiedAccounts_getNativeAddress",
    "params":["0x1234..."]
  }' \
  https://rpc.selendra.org
```

## Migration Checklist

### For Wallet Developers

- [ ] Remove `@selendra/address-converter` dependency
- [ ] Add unified accounts query on wallet creation
- [ ] Auto-call `claimDefaultEvmAddress()` for new accounts
- [ ] Display only `0x` address to users
- [ ] Keep SS58 address internally for transaction signing
- [ ] Add MetaMask linking flow for existing users

### For dApp Developers

- [ ] Replace client-side address conversion with on-chain queries
- [ ] Update address display components to show only `0x`
- [ ] Handle case where address is not yet claimed (prompt user)
- [ ] Cache mapped addresses to reduce RPC calls

### For Block Explorers

- [ ] Index `UnifiedAccounts.AccountClaimed` events
- [ ] Show unified address on account pages
- [ ] Support search by either SS58 or H160
- [ ] Link transactions across both address formats

## Event Handling

```typescript
// Listen for new address claims
api.query.system.events((events) => {
  events.forEach((record) => {
    const { event } = record;
    
    if (event.section === 'unifiedAccounts' && event.method === 'AccountClaimed') {
      const [accountId, evmAddress] = event.data;
      console.log(`${accountId} claimed ${evmAddress}`);
      
      // Update local cache/UI
    }
  });
});
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `AlreadyClaimed` | SS58 address already has a mapped 0x | Query existing mapping |
| `EvmAddressAlreadyLinked` | 0x address linked to different SS58 | User must use different 0x |
| `InvalidSignature` | EIP-712 signature invalid | Re-sign with correct params |
| `NotMapped` | Address has no on-chain mapping | Prompt user to claim |

## Best Practices

1. **Always query on-chain** - Don't cache mappings permanently; they're immutable but query fresh for new addresses
2. **Show 0x to users** - The goal is EVM-native UX
3. **Handle unclaimed gracefully** - Prompt new users to claim their address
4. **Batch queries** - Use `api.queryMulti()` for multiple address lookups
5. **Index events** - Build local index of claimed addresses for faster lookup

## Related Resources

- [Selendra Runtime Source](https://github.com/selendra/selendra)
- [pallet_unified_accounts](https://github.com/selendra/selendra/tree/main/pallets/unified-accounts)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
- [Polkadot.js API Docs](https://polkadot.js.org/docs/)
