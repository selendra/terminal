# Selendra Terminal - Technical Implementation Tasks

## Current Sprint: MVP Phase 1 - Real Data Integration

### Task 1: Robust RPC Connection

**File**: `src/components/providers/BlockchainProvider.tsx`
**Priority**: 🔴 CRITICAL
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 1.1 Add retry logic with exponential backoff

  ```typescript
  const connectWithRetry = async (maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await connect();
        return;
      } catch (e) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    // Fall back to mock data
    initializeMockData();
  };
  ```

- [ ] 1.2 WebSocket reconnection handling

  ```typescript
  api.on("disconnected", () => {
    setIsConnected(false);
    reconnect();
  });
  ```

- [ ] 1.3 Connection status indicator component
  ```typescript
  // New component: src/components/common/ConnectionStatus.tsx
  export function ConnectionStatus() {
    const { isConnected, useMockData, currentNetwork } = useBlockchain();
    // Show green dot for live, yellow for mock, red for disconnected
  }
  ```

### Task 2: Real Block Data Subscription

**File**: `src/components/providers/BlockchainProvider.tsx`
**Priority**: 🔴 CRITICAL  
**Estimate**: 3 days

#### Sub-tasks:

- [ ] 2.1 Subscribe to new block headers

  ```typescript
  const subscribeToBlocks = useCallback(async () => {
    if (!substrateSDK) return;
    const api = substrateSDK.getApi();

    const unsub = await api.rpc.chain.subscribeNewHeads((header) => {
      setLatestSubstrateBlock({
        number: header.number.toNumber(),
        hash: header.hash.toHex(),
        parentHash: header.parentHash.toHex(),
        stateRoot: header.stateRoot.toHex(),
        extrinsicsRoot: header.extrinsicsRoot.toHex(),
        timestamp: Date.now(),
      });
    });

    return unsub;
  }, [substrateSDK]);
  ```

- [ ] 2.2 Fetch full block with extrinsics

  ```typescript
  const fetchFullBlock = async (blockHash: string) => {
    const api = substrateSDK.getApi();
    const signedBlock = await api.rpc.chain.getBlock(blockHash);
    const events = await api.query.system.events.at(blockHash);

    return {
      block: signedBlock,
      events: events,
    };
  };
  ```

- [ ] 2.3 Decode extrinsics and events
  ```typescript
  // New file: src/lib/decoder.ts
  export function decodeExtrinsic(extrinsic: GenericExtrinsic) {
    return {
      method: extrinsic.method.method,
      section: extrinsic.method.section,
      args: extrinsic.method.args.map((a) => a.toHuman()),
      signer: extrinsic.signer?.toString(),
      isSigned: extrinsic.isSigned,
    };
  }
  ```

### Task 3: EVM Block Integration

**File**: `src/components/providers/BlockchainProvider.tsx`
**Priority**: 🟡 HIGH
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 3.1 EVM block polling

  ```typescript
  const pollEvmBlocks = useCallback(async () => {
    const provider = evmSDK.getEvmProvider();
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);

    setLatestEvmBlock({
      number: block.number,
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: block.timestamp,
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      miner: block.miner,
      transactions: block.transactions.map((tx) =>
        typeof tx === "string" ? tx : tx.hash
      ),
    });
  }, [evmSDK]);
  ```

- [ ] 3.2 EVM transaction decoding
  ```typescript
  // New file: src/lib/evm/decoder.ts
  export async function decodeEvmTransaction(
    tx: TransactionResponse,
    provider: Provider
  ) {
    const receipt = await provider.getTransactionReceipt(tx.hash);
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: formatEther(tx.value),
      gasPrice: tx.gasPrice?.toString(),
      gasUsed: receipt?.gasUsed.toString(),
      status: receipt?.status === 1 ? "success" : "failed",
      logs: receipt?.logs,
    };
  }
  ```

### Task 4: Blocks Explorer with Real Data

**File**: `src/components/explorer/BlocksExplorer.tsx`
**Priority**: 🟡 HIGH
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 4.1 Replace mock data with real block fetching

  ```typescript
  const fetchBlocks = useCallback(async () => {
    if (!isConnected || useMockData) {
      // Use mock data for now
      return;
    }

    const api = substrateSDK.getApi();
    const latestHeader = await api.rpc.chain.getHeader();
    const latestNumber = latestHeader.number.toNumber();

    const blocksToFetch = [];
    for (let i = 0; i < blocksPerPage; i++) {
      blocksToFetch.push(latestNumber - (currentPage - 1) * blocksPerPage - i);
    }

    const blocks = await Promise.all(
      blocksToFetch.map(async (num) => {
        const hash = await api.rpc.chain.getBlockHash(num);
        const block = await api.rpc.chain.getBlock(hash);
        return {
          number: num,
          hash: hash.toHex(),
          extrinsicsCount: block.block.extrinsics.length,
          // ...
        };
      })
    );

    setBlocks(blocks);
  }, [isConnected, substrateSDK, currentPage, useMockData]);
  ```

- [ ] 4.2 Add pagination controls
- [ ] 4.3 Add block type filter (all/substrate/evm)

### Task 5: Account Balance Lookup

**File**: `src/components/explorer/AccountDetail.tsx`
**Priority**: 🟡 HIGH
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 5.1 Substrate balance query

  ```typescript
  const fetchSubstrateBalance = async (address: string) => {
    const api = substrateSDK.getApi();
    const account = await api.query.system.account(address);

    return {
      free: formatBalance(account.data.free),
      reserved: formatBalance(account.data.reserved),
      locked: formatBalance(account.data.frozen),
      nonce: account.nonce.toNumber(),
    };
  };
  ```

- [ ] 5.2 EVM balance query

  ```typescript
  const fetchEvmBalance = async (address: string) => {
    const provider = evmSDK.getEvmProvider();
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  };
  ```

- [ ] 5.3 Auto-detect address format (SS58 vs EVM)

  ```typescript
  // New file: src/lib/address.ts
  import { isAddress as isEvmAddress } from "ethers";
  import { decodeAddress, encodeAddress } from "@polkadot/util-crypto";

  export function detectAddressType(
    address: string
  ): "substrate" | "evm" | "unknown" {
    if (address.startsWith("0x") && isEvmAddress(address)) {
      return "evm";
    }
    try {
      decodeAddress(address);
      return "substrate";
    } catch {
      return "unknown";
    }
  }
  ```

### Task 6: Universal Search

**Files**: `src/components/layout/Header.tsx`, new `src/lib/search.ts`
**Priority**: 🟢 MEDIUM
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 6.1 Create search service

  ```typescript
  // src/lib/search.ts
  export async function universalSearch(
    query: string,
    { substrateSDK, evmSDK }: SDKs
  ): Promise<SearchResult> {
    // Check if block number
    if (/^\d+$/.test(query)) {
      return { type: "block", number: parseInt(query) };
    }

    // Check if transaction hash
    if (query.startsWith("0x") && query.length === 66) {
      // Try EVM first
      const evmTx = await evmSDK.getEvmProvider().getTransaction(query);
      if (evmTx) return { type: "evm-tx", hash: query };

      // Try Substrate
      // ...
    }

    // Check if address
    const addressType = detectAddressType(query);
    if (addressType !== "unknown") {
      return { type: "account", address: query, addressType };
    }

    return { type: "not-found" };
  }
  ```

- [ ] 6.2 Search UI with autocomplete
- [ ] 6.3 Search history (localStorage)

### Task 7: Wallet Connection Polish

**File**: `src/components/providers/WalletProvider.tsx`
**Priority**: 🟢 MEDIUM
**Estimate**: 2 days

#### Sub-tasks:

- [ ] 7.1 Multi-wallet support

  ```typescript
  const supportedWallets = [
    { id: "polkadot-js", name: "Polkadot.js" },
    { id: "talisman", name: "Talisman" },
    { id: "subwallet-js", name: "SubWallet" },
  ];

  const connectWallet = async (walletId: string) => {
    const { web3Enable, web3AccountsSubscribe } = await import(
      "@polkadot/extension-dapp"
    );
    const extensions = await web3Enable("Selendra Terminal");

    const wallet = extensions.find((ext) => ext.name === walletId);
    if (!wallet) throw new Error(`${walletId} not installed`);

    // Subscribe to account changes
    web3AccountsSubscribe((accounts) => {
      setSubstrateAccounts(accounts.map(formatAccount));
    });
  };
  ```

- [ ] 7.2 Add Selendra network to MetaMask

  ```typescript
  const addSelendraNetwork = async () => {
    const ethereum = (window as any).ethereum;
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0x7A9", // 1961
          chainName: "Selendra",
          nativeCurrency: { name: "SEL", symbol: "SEL", decimals: 18 },
          rpcUrls: ["https://rpc-evm.selendra.org"],
          blockExplorerUrls: ["https://scan.selendra.org"],
        },
      ],
    });
  };
  ```

- [ ] 7.3 Real-time balance subscription

  ```typescript
  useEffect(() => {
    if (!selectedSubstrateAccount || !substrateSDK) return;

    const api = substrateSDK.getApi();
    let unsub: () => void;

    api.query.system
      .account(selectedSubstrateAccount.address, (account) => {
        setSubstrateBalance({
          free: formatBalance(account.data.free),
          reserved: formatBalance(account.data.reserved),
          locked: formatBalance(account.data.frozen),
        });
      })
      .then((u) => (unsub = u));

    return () => unsub?.();
  }, [selectedSubstrateAccount, substrateSDK]);
  ```

---

## Utility Functions Needed

### File: `src/lib/utils.ts` (extend existing)

```typescript
// Format balance with proper decimals
export function formatBalance(
  balance: BN | string | number,
  decimals: number = 18,
  precision: number = 4
): string {
  const bn =
    typeof balance === "string" || typeof balance === "number"
      ? new BN(balance.toString())
      : balance;

  const divisor = new BN(10).pow(new BN(decimals));
  const whole = bn.div(divisor);
  const fraction = bn.mod(divisor).toString().padStart(decimals, "0");

  return `${whole.toString()}.${fraction.slice(0, precision)}`;
}

// Format timestamp to relative time
export function formatDistanceToNow(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Truncate hash for display
export function truncateHash(
  hash: string,
  startChars = 6,
  endChars = 4
): string {
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}
```

---

## Testing Checklist

### MVP Phase 1 Tests

- [ ] Connect to mainnet RPC successfully
- [ ] Display latest block number in real-time
- [ ] Block explorer shows last 25 blocks
- [ ] Click block shows detail page with extrinsics
- [ ] Search by block number works
- [ ] Search by tx hash works
- [ ] Search by address works
- [ ] Substrate wallet connects
- [ ] EVM wallet connects
- [ ] Balance displays correctly
- [ ] Network switch works (mainnet/testnet)
- [ ] Mobile responsive on all pages
- [ ] Error states handled gracefully
- [ ] Fallback to mock data when RPC unavailable

---

## Definition of Done (MVP)

- [ ] All critical and high priority tasks completed
- [ ] No TypeScript errors
- [ ] No console errors in production build
- [ ] Lighthouse score > 90 for performance
- [ ] Works on Chrome, Firefox, Safari
- [ ] Mobile responsive (tested on 375px, 768px, 1024px)
- [ ] README updated with setup instructions
- [ ] Environment variables documented
