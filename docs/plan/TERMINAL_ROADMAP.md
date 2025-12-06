# Selendra Terminal — DEX-First Roadmap

> **Priority**: SelendraDEX and Bridge as core features for token launch
> **Timeline**: Q1 2025 Launch Target
> **Status**: Active Development

---

## Vision

Selendra Terminal becomes the **primary interface** for trading SEL on the native blockchain. By prioritizing DEX and Bridge features, we create:

1. **Native trading experience** — No external DEXes needed
2. **Anti-dump friction** — Bridge fees burned, delays prevent flash dumps
3. **Value accrual** — 0.30% swap fees with 0.05% burned per trade
4. **Community-first** — Build liquidity on Selendra, not external chains

---

## Phase 1: DEX Foundation (Current Sprint)

### ✅ Completed
- [x] Tokenomics v3.0 configuration (320M cap, 150M post-burn)
- [x] SelendraDEX branding in Terminal
- [x] SwapInterface with 0.30% fee structure (LP/Burn/Treasury split)
- [x] Bridge anti-dump friction (progressive fees, delays, rate limits)
- [x] DeFiDashboard rebranded as SelendraDEX

### 🔄 In Progress
- [ ] Connect SwapInterface to real DEX contracts
- [ ] Implement actual token balance fetching
- [ ] Real-time price oracle integration

### 📋 TODO
- [ ] Deploy SelendraDEX Factory contract
- [ ] Deploy SelendraDEX Router contract
- [ ] Create initial liquidity pools (SEL/USDT, SEL/USDC, SEL/WETH)
- [ ] Deploy Bridge contracts (BSC <-> Selendra)

---

## Phase 2: Launch Preparation

### Week 1-2: Smart Contracts
```
Priority: HIGH
```

| Task | Description | Status |
|------|-------------|--------|
| Factory Contract | Deploy SelendraDEXFactory.sol | ⬜ |
| Pair Contract | SelendraDEXPair.sol (LP tokens) | ⬜ |
| Router Contract | SelendraDEXRouter.sol | ⬜ |
| Bridge Lock | SelBridgeLock.sol (BSC side) | ⬜ |
| Bridge Mint | SelBridgeMint.sol (Selendra side) | ⬜ |
| Fee Manager | FeeManager.sol (burn distribution) | ⬜ |

### Week 3-4: Terminal Integration
```
Priority: HIGH
```

| Task | Description | Status |
|------|-------------|--------|
| Wallet Integration | Real balance fetching | ⬜ |
| Swap Execution | Call Router.swapExactTokensForTokens | ⬜ |
| LP Management | Add/Remove liquidity | ⬜ |
| Bridge Execution | Lock on BSC, Mint on Selendra | ⬜ |
| Transaction History | Real bridge/swap history | ⬜ |

### Week 5-6: Testing & Audit
```
Priority: CRITICAL
```

| Task | Description | Status |
|------|-------------|--------|
| Testnet Deploy | Deploy all contracts to testnet | ⬜ |
| Internal Testing | Full swap/bridge flow testing | ⬜ |
| Security Review | Internal audit of contracts | ⬜ |
| External Audit | Professional audit (if budget) | ⬜ |
| Bug Bounty | Launch pre-mainnet bug bounty | ⬜ |

---

## Phase 3: Token Launch

### Initial Liquidity Setup
```
Budget: $3,000 worth of USDT + SEL
Initial Price: $0.0025/SEL
Initial Market Cap: ~$375,000 (150M * $0.0025)
```

**Launch Pools:**
| Pool | SEL Amount | Paired Token | Initial Liquidity |
|------|------------|--------------|-------------------|
| SEL/USDT | 600,000 SEL | $1,500 USDT | Primary |
| SEL/USDC | 400,000 SEL | $1,000 USDC | Secondary |
| SEL/WETH | 200,000 SEL | ~0.3 WETH | Tertiary |

### Launch Sequence
1. **T-7 days**: Announce bridge opening date
2. **T-3 days**: Open bridge for community (BSC -> Selendra only)
3. **T-1 day**: Seed initial DEX liquidity
4. **T-0**: Enable trading on SelendraDEX
5. **T+1 day**: Open reverse bridge (Selendra -> BSC)

### Anti-Dump Measures Active at Launch
- ✅ 0.5-3% progressive bridge fees (burned)
- ✅ 15 minute minimum bridge delay
- ✅ 1M SEL daily limit per address
- ✅ 0.05% swap fee burned per trade
- ✅ Bridge to Selendra required before trading

---

## Phase 4: Post-Launch Features

### Month 1: Stability
- [ ] Monitor bridge/DEX usage
- [ ] Adjust rate limits if needed
- [ ] Launch LP incentive program
- [ ] Community pool voting

### Month 2-3: Expansion
- [ ] Add more trading pairs
- [ ] Lending protocol integration (SelLend)
- [ ] Farming/Staking rewards UI
- [ ] Charts and analytics dashboard

### Month 4-6: Ecosystem Growth
- [ ] Mobile wallet integration
- [ ] Third-party DEX aggregator listings
- [ ] Cross-chain bridges (Polygon, Ethereum)
- [ ] NFT marketplace integration

---

## Terminal Component Priority

### Tier 1 — Must Have for Launch
```
/src/components/defi/SwapInterface.tsx      ✅ Updated
/src/components/defi/LiquidityProvider.tsx  🔄 Needs contract integration
/src/components/bridge/BridgeInterface.tsx  ✅ Updated with anti-dump
/src/components/defi/DeFiDashboard.tsx      ✅ Rebranded
```

### Tier 2 — Launch Week
```
/src/components/staking/StakingDashboard.tsx
/src/components/tokens/TokenList.tsx
/src/components/analytics/ChartsPage.tsx
```

### Tier 3 — Post-Launch
```
/src/components/governance/GovernanceDashboard.tsx
/src/components/treasury/TreasuryDashboard.tsx
/src/components/validators/ValidatorList.tsx
```

---

## Technical Dependencies

### Smart Contract Addresses (TBD)
```typescript
// To be updated after deployment
export const DEX_CONTRACTS = {
  factory: "0x...",
  router: "0x...",
  feeManager: "0x...",
};

export const BRIDGE_CONTRACTS = {
  bsc: {
    lock: "0x...",
  },
  selendra: {
    mint: "0x...",
  },
};
```

### RPC Endpoints
```typescript
export const RPC = {
  selendra: "https://rpc.selendra.org",
  bsc: "https://bsc-dataseed.binance.org",
};
```

---

## Success Metrics

### Week 1 Post-Launch
| Metric | Target |
|--------|--------|
| Bridge Volume | $50,000+ |
| DEX Volume | $100,000+ |
| Unique Wallets | 500+ |
| LP Providers | 50+ |

### Month 1 Post-Launch
| Metric | Target |
|--------|--------|
| TVL in Pools | $500,000+ |
| Daily Volume | $50,000+ |
| SEL Burned | 100,000+ |
| Market Cap | $1,000,000+ |

### Year 1 Targets
| Metric | Target |
|--------|--------|
| TVL | $10,000,000+ |
| Market Cap | $50,000,000+ |
| SEL Burned | 10,000,000+ |
| Daily Active Users | 1,000+ |

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Smart contract bug | Audit + bug bounty + gradual rollout |
| Bridge exploit | Rate limits + delays + multi-sig |
| Price manipulation | Oracle integration + TWAP |
| Front-running | Private mempool consideration |

### Economic Risks
| Risk | Mitigation |
|------|------------|
| Low liquidity | Seed liquidity + LP incentives |
| Dump at launch | Bridge friction + progressive fees |
| Whale manipulation | Rate limits + position limits |
| No buy pressure | Ecosystem utility + staking rewards |

---

## Contact

- **GitHub**: selendra/terminal
- **Discord**: discord.selendra.org
- **Telegram**: t.me/selaboratory

---

*Last Updated: January 2025*
*Document Version: 1.0*
