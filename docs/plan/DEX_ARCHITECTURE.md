# Selendra DEX Architecture

> **SelendraDEX** - The Native Decentralized Exchange for ASEAN

---

## Overview

SelendraDEX is an Automated Market Maker (AMM) DEX built natively on Selendra blockchain. It serves as the primary trading venue for SEL tokens and the ecosystem's DeFi hub.

---

## Design Goals

| Goal | Description |
|------|-------------|
| **Native First** | Built on Selendra, not BSC/Ethereum |
| **Anti-Dump** | Friction for BSC holders wanting to sell |
| **Fee Capture** | All fees stay in Selendra ecosystem |
| **Deflationary** | Burns built into every swap |
| **Simple** | Uniswap v2 style for reliability |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SELENDRA DEX ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   Frontend  │    │   Router    │    │   Factory   │              │
│  │  (Terminal) │───▶│  Contract   │───▶│  Contract   │              │
│  └─────────────┘    └─────────────┘    └─────────────┘              │
│         │                  │                  │                     │
│         │                  │                  ▼                     │
│         │                  │           ┌─────────────┐              │
│         │                  │           │    Pair     │              │
│         │                  └──────────▶│  Contracts  │              │
│         │                              └─────────────┘              │
│         │                                     │                     │
│         │                                     ▼                     │
│         │                              ┌─────────────┐              │
│         │                              │   Burn      │              │
│         └─────────────────────────────▶│   Handler   │              │
│                                        └─────────────┘              │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  PERIPHERAL CONTRACTS                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Oracle    │  │   Farms     │  │  Staking    │  │   Vesting   │ │
│  │  (TWAP)     │  │  (LP Rewards│  │  (SEL Lock) │  │  (Team/VC)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Contracts

### 1. Factory Contract

Creates and manages all trading pairs.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISelendraFactory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 pairCount
    );
    
    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function burnAddress() external view returns (address);
    
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint256) external view returns (address pair);
    function allPairsLength() external view returns (uint256);
    
    function createPair(address tokenA, address tokenB) external returns (address pair);
    
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function setBurnAddress(address) external;
}
```

**Key Features:**
- Creates new trading pairs
- Tracks all pairs in registry
- Configurable fee recipient
- Dedicated burn address

---

### 2. Pair Contract

Each trading pair is a separate contract holding liquidity.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISelendraPair {
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);
    
    function MINIMUM_LIQUIDITY() external pure returns (uint256);
    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32 blockTimestampLast
    );
    
    function price0CumulativeLast() external view returns (uint256);
    function price1CumulativeLast() external view returns (uint256);
    function kLast() external view returns (uint256);
    
    function mint(address to) external returns (uint256 liquidity);
    function burn(address to) external returns (uint256 amount0, uint256 amount1);
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;
}
```

**Key Features:**
- Constant product formula (x * y = k)
- LP token minting/burning
- Flash swap support
- Price oracle (TWAP)

---

### 3. Router Contract

User-facing contract for swaps and liquidity.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISelendraRouter {
    function factory() external view returns (address);
    // Note: No WSEL needed - Selendra uses unified accounts
    // Native SEL works directly on EVM through pallet_unified_accounts
    
    // Add Liquidity
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
    
    function addLiquiditySEL(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountSELMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountSEL, uint256 liquidity);
    
    // Remove Liquidity
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);
    
    function removeLiquiditySEL(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountSELMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountSEL);
    
    // Swap
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function swapExactSELForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
    
    function swapTokensForExactSEL(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function swapExactTokensForSEL(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
    
    function swapSELForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
    
    // Quotes
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) 
        external pure returns (uint256 amountB);
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) 
        external pure returns (uint256 amountOut);
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) 
        external pure returns (uint256 amountIn);
    function getAmountsOut(uint256 amountIn, address[] calldata path) 
        external view returns (uint256[] memory amounts);
    function getAmountsIn(uint256 amountOut, address[] calldata path) 
        external view returns (uint256[] memory amounts);
}
```

---

## Fee Structure

### Swap Fees (0.30%)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  User swaps 1000 USDT → SEL                                 │
│                                                             │
│  Swap Fee: 1000 × 0.30% = 3 USDT                            │
│                                                             │
│  Distribution:                                              │
│  ├── 2.00 USDT (0.20%) → LP Providers                       │
│  ├── 0.50 USDT (0.05%) → BURNED 🔥                          │
│  └── 0.50 USDT (0.05%) → Treasury                           │
│                                                             │
│  Net to user: 997 USDT worth of SEL                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```solidity
// In Pair contract
uint256 public constant FEE_DENOMINATOR = 10000;
uint256 public constant TOTAL_FEE = 30;        // 0.30%
uint256 public constant LP_FEE = 20;           // 0.20%
uint256 public constant BURN_FEE = 5;          // 0.05%
uint256 public constant TREASURY_FEE = 5;      // 0.05%

function _calculateFees(uint256 amount) internal pure returns (
    uint256 lpFee,
    uint256 burnFee,
    uint256 treasuryFee
) {
    lpFee = (amount * LP_FEE) / FEE_DENOMINATOR;
    burnFee = (amount * BURN_FEE) / FEE_DENOMINATOR;
    treasuryFee = (amount * TREASURY_FEE) / FEE_DENOMINATOR;
}
```

---

## Initial Liquidity Pools

### Core Pairs

| Pair | Initial SEL | Initial Token | Initial Price | TVL |
|------|-------------|---------------|---------------|-----|
| SEL/USDT | 4,000,000 | 10,000 USDT | $0.0025 | $20,000 |
| SEL/USDC | 2,000,000 | 5,000 USDC | $0.0025 | $10,000 |
| SEL/KHRt | 2,000,000 | 10,000,000 KHRt | 5 KHRt | $5,000 |
| SEL/WBTC | 1,000,000 | 0.05 WBTC | - | $2,500 |
| SEL/WETH | 1,000,000 | 0.8 WETH | - | $2,500 |
| **Total** | **10,000,000** | - | - | **$40,000** |

### LP Token Locking

```
All initial LP tokens:
├── Locked for 2 years
├── Controlled by multi-sig
└── Publicly verifiable
```

---

## Farming (LP Rewards)

### Farm Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISelendraFarm {
    struct PoolInfo {
        address lpToken;          // LP token address
        uint256 allocPoint;       // Allocation points
        uint256 lastRewardBlock;  // Last block with rewards
        uint256 accSelPerShare;   // Accumulated SEL per share
    }
    
    struct UserInfo {
        uint256 amount;           // LP tokens staked
        uint256 rewardDebt;       // Reward debt
    }
    
    function poolLength() external view returns (uint256);
    function add(uint256 allocPoint, address lpToken, bool withUpdate) external;
    function set(uint256 pid, uint256 allocPoint, bool withUpdate) external;
    function deposit(uint256 pid, uint256 amount) external;
    function withdraw(uint256 pid, uint256 amount) external;
    function emergencyWithdraw(uint256 pid) external;
    function pendingSel(uint256 pid, address user) external view returns (uint256);
}
```

### Reward Distribution

| Pool | Allocation | APY Target | Notes |
|------|------------|------------|-------|
| SEL/USDT | 40% | 50-100% | Main pair, highest rewards |
| SEL/USDC | 20% | 40-80% | Stablecoin pair |
| SEL/KHRt | 25% | 60-100% | Khmer stablecoin, local focus |
| SEL/WBTC | 10% | 30-50% | BTC pair |
| SEL/WETH | 5% | 20-40% | ETH pair |

### Emission Schedule

```
Year 1:  5,000,000 SEL (from Staking Pool allocation)
Year 2:  4,000,000 SEL
Year 3:  3,000,000 SEL
Year 4:  2,000,000 SEL
Year 5+: 1,000,000 SEL per year

Total Farm Emissions: ~20M SEL over 10 years
```

---

## Oracle (TWAP)

Time-Weighted Average Price for DeFi integrations.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISelendraOracle {
    function update(address pair) external;
    
    function consult(
        address pair,
        address tokenIn,
        uint256 amountIn
    ) external view returns (uint256 amountOut);
    
    function getAveragePrice(
        address pair,
        address token,
        uint256 period
    ) external view returns (uint256 price);
}
```

### Oracle Parameters

| Parameter | Value |
|-----------|-------|
| Update frequency | Every block |
| TWAP window | 30 minutes |
| Min liquidity | $1,000 |

---

## Security Measures

### 1. Reentrancy Protection

```solidity
modifier nonReentrant() {
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
    _status = _ENTERED;
    _;
    _status = _NOT_ENTERED;
}
```

### 2. Slippage Protection

```solidity
require(amountOut >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");
require(block.timestamp <= deadline, "EXPIRED");
```

### 3. Price Impact Limits

```solidity
uint256 public constant MAX_PRICE_IMPACT = 1000; // 10%

function _checkPriceImpact(uint256 amountIn, uint256 reserveIn) internal view {
    uint256 impact = (amountIn * 10000) / reserveIn;
    require(impact <= MAX_PRICE_IMPACT, "PRICE_IMPACT_TOO_HIGH");
}
```

### 4. Flash Loan Protection

```solidity
// Ensure reserves are correct after flash swap
require(balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * 1000000, "K");
```

---

## Contract Addresses (Planned)

| Contract | Address | Status |
|----------|---------|--------|
| Factory | `0x...` | Pending deployment |
| Router | `0x...` | Pending deployment |
| Farm | `0x...` | Pending deployment |
| Oracle | `0x...` | Pending deployment |
| Burn Address | `0x000000000000000000000000000000000000dEaD` | Standard |

> **Note**: No WSEL contract needed — Selendra uses **Unified Accounts** (`pallet_unified_accounts`) which allows native SEL to work seamlessly on both EVM and Substrate. The same balance is accessible from both VMs.

---

## Integration Guide

### JavaScript/TypeScript

```typescript
import { ethers } from 'ethers';
import { ROUTER_ABI, FACTORY_ABI } from './abis';

const ROUTER_ADDRESS = '0x...';
const FACTORY_ADDRESS = '0x...';

// Initialize
const provider = new ethers.JsonRpcProvider('https://rpc.selendra.org');
const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

// Get pair address
const pairAddress = await factory.getPair(tokenA, tokenB);

// Get quote
const amountsOut = await router.getAmountsOut(amountIn, [tokenA, tokenB]);

// Execute swap (with signer)
const signer = new ethers.Wallet(privateKey, provider);
const routerWithSigner = router.connect(signer);

await routerWithSigner.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    [tokenA, tokenB],
    recipientAddress,
    deadline
);
```

### React Hook (for Terminal)

```typescript
import { useState, useCallback } from 'react';
import { useContract } from '@/lib/hooks/useContract';

export function useSwap() {
    const router = useContract('SelendraRouter');
    const [loading, setLoading] = useState(false);
    
    const swap = useCallback(async (
        tokenIn: string,
        tokenOut: string,
        amountIn: bigint,
        slippage: number = 0.5
    ) => {
        setLoading(true);
        try {
            const amounts = await router.getAmountsOut(amountIn, [tokenIn, tokenOut]);
            const amountOutMin = amounts[1] * BigInt(100 - slippage * 100) / BigInt(10000);
            
            const tx = await router.swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                [tokenIn, tokenOut],
                userAddress,
                Math.floor(Date.now() / 1000) + 1200 // 20 min deadline
            );
            
            return await tx.wait();
        } finally {
            setLoading(false);
        }
    }, [router]);
    
    return { swap, loading };
}
```

---

## Deployment Checklist

- [ ] Deploy Factory contract
- [ ] Deploy Router contract
- [ ] Verify Unified Accounts mapping works (EVM ↔ Substrate)
- [ ] Create initial pairs (SEL/USDT, SEL/USDC)
- [ ] Add initial liquidity
- [ ] Lock LP tokens
- [ ] Deploy Farm contract
- [ ] Configure farm pools
- [ ] Deploy Oracle
- [ ] Integrate with Terminal frontend
- [ ] Security audit
- [ ] Bug bounty program

---

## Timeline

| Week | Milestone |
|------|-----------|
| 1 | Factory + Pair contracts |
| 2 | Router contract |
| 3 | Farm contracts |
| 4 | Oracle + Testing |
| 5 | Frontend integration |
| 6 | Testnet deployment |
| 7 | Audit |
| 8 | **Mainnet Launch** 🚀 |

---

## Document Info

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | November 30, 2025 |
| Author | Selendra Core Team |
| Status | Draft |

---

*Architecture based on Uniswap v2 with Selendra-specific modifications for fee burns and ecosystem integration.*
