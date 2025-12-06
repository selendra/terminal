# Selendra Tokenomics v3.2

> **Settlement layer for tokenized assets** — Built for Cambodia. Open to all.
>
> 📦 **Source**: [github.com/selendra/selendra](https://github.com/selendra/selendra)

---

## Executive Summary

Selendra is a dual-VM blockchain (EVM + WASM) with 1-second finality, designed as the settlement layer for tokenized assets. Starting with loyalty points in Cambodia, the network is open to all builders worldwide.

This document outlines the tokenomics model: strategic scarcity via 320M hard cap, deflationary mechanisms (90% fee burn), and sustainable validator incentives.

### What is Selendra?

- **Dual VM Support** — Deploy Solidity (EVM) or ink! (WASM) smart contracts on the same chain
- **1-Second Finality** — AURA + AlephBFT hybrid consensus, no waiting for confirmations
- **Sub-Cent Fees** — Transaction costs under $0.01, affordable for real businesses
- **Unified Accounts** — Single `0x...` address works across all VMs
- **Cambodia First** — KHQR payment integration, local currency settlement

### Strategy: Cambodia First, Then ASEAN

```
Phase 1: Cambodia (Current)
├── Loyalty points tokenization (Bitriel)
├── KHQR payment integration
├── CPL fan engagement (StadiumX)
└── Local merchant network

Phase 2: ASEAN Expansion
├── Thailand, Vietnam, Philippines
├── Cross-border settlements
└── Regional payment corridors

Phase 3: Global
├── Emerging markets
├── Enterprise adoption
└── Full decentralization
```

---

## Token Overview

| Parameter | Value |
|-----------|-------|
| **Token Name** | Selendra |
| **Symbol** | SEL |
| **Decimals** | 18 |
| **Current Supply** | 230,000,000 SEL |
| **Burn Amount** | 80,000,000 SEL (35%) |
| **Post-Burn Supply** | 150,000,000 SEL |
| **Maximum Cap** | 320,000,000 SEL (on-chain) |
| **Future Inflation** | 170,000,000 SEL |
| **Consensus** | NPoS (Nominated Proof of Stake) |

> **Note**: The 320M cap is already set in the Selendra codebase (`DefaultSelCap` in `primitives/src/lib.rs`). This is an immutable on-chain parameter.

---

## Supply Model

### The Burn & Rebuild Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   CURRENT         BURN           POST-BURN       MAX CAP    │
│   230M SEL   →   -80M SEL   →    150M SEL   →   320M SEL    │
│                    🔥                                       │
│                                                             │
│   35% burned to create scarcity                             │
│   170M available for future staking rewards                 │
│   ~25-30 year runway to max cap                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The 320M Cap (Already On-Chain)

The 320M maximum supply is hardcoded in the Selendra blockchain:

```rust
// From github.com/selendra/selendra/primitives/src/lib.rs
pub const DEFAULT_SEL_CAP: u128 = 320_000_000 * TOKEN;
```

**Verify on-chain**:
```bash
curl -sX POST https://rpc.selendra.org -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"state_getStorage","params":["0x..."]}'
```

| At 320M Cap | Value |
|-------------|-------|
| Price @ $10B MC | $31.25 |
| Staking runway | ~25-30 years |
| vs Avalanche (720M) | 2.25x more scarce |
| vs Cosmos (390M) | 1.2x more scarce |

---

## Token Distribution

### Post-Burn Allocation (150M SEL)

| Category | Amount | Percentage | Vesting | Purpose |
|----------|--------|------------|---------|---------|
| **Angels (10 investors)** | 15M | 10.0% | 2yr linear, 6mo cliff | Early supporters |
| **Community (34k holders)** | 20M | 13.3% | Unlocked | BSC community |
| **Team & Founders (5 people)** | 15M | 10.0% | 4yr linear, 1yr cliff | Core team retention |
| **DAO Treasury** | 50M | 33.3% | Governance-controlled | All development & grants |
| **Staking Rewards Pool** | 20M | 13.3% | Emission schedule | Initial validator rewards |
| **DEX Liquidity** | 10M | 6.7% | LP locked 2 years | Initial DEX liquidity |
| **Ecosystem Grants** | 20M | 13.3% | DAO proposals | Developer incentives |
| **Total** | **150M** | **100%** | | |

> **No Foundation**: All treasury funds are controlled by on-chain governance (Democracy + Treasury pallets). No centralized entity holds tokens.

### Visual Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Angels           ████████████ 10.0%                        │
│  Community        █████████████████ 13.3%                   │
│  Team             ████████████ 10.0%                        │
│  DAO Treasury     ██████████████████████████████████ 33.3%  │
│  Staking Pool     ████████████████ 13.3%                    │
│  DEX Liquidity    ████████ 6.7%                             │
│  Ecosystem        ████████████████ 13.3%                    │
│                                                             │
│  DAO-Controlled: 60.0% ✅                                   │
│  (DAO Treasury + Ecosystem + Staking)                       │
│                                                             │
│  Community Total: 73.3% ✅                                  │
│  (Community + DAO + Ecosystem + Staking + DEX)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Inflation Schedule

### How Selendra Inflation Works (Exponential Decay)

Selendra uses an **exponential decay** model — the same mathematical principle that governs natural processes like radioactive decay. In simple terms:

> **"The closer you get to the cap, the slower the emissions."**

This is implemented on-chain in `ExponentialEraPayout` and controlled by two parameters:

| Parameter | Value | Meaning |
|-----------|-------|--------|
| `SelCap` | 320,000,000 SEL | Maximum supply (hard cap) |
| `ExponentialInflationHorizon` | ~4.9 years | Decay speed constant (see below) |

### Understanding the Horizon (~4.9 years)

The horizon is **not** a countdown or a cycle — it's a **mathematical constant** that controls how fast inflation decays.

In exponential decay, the horizon is the time it takes to fill **~63.2%** of the remaining gap between current supply and the cap. This then repeats for the remaining gap:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   After 1 horizon (~4.9 years):  63.2% of gap filled        │
│   After 2 horizons (~9.8 years): 86.5% of gap filled        │
│   After 3 horizons (~14.7 years): 95.0% of gap filled       │
│   After 5 horizons (~24.5 years): 99.3% of gap filled       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Concrete Example (Starting at 150M SEL):**

| Time | Gap Remaining | Supply | What Happened |
|------|---------------|--------|---------------|
| Start | 170M (320M - 150M) | 150M | Initial state |
| +4.9 years | ~63M | ~257M | Filled 63% of 170M gap |
| +9.8 years | ~23M | ~297M | Filled 63% of remaining 63M |
| +14.7 years | ~8.5M | ~311M | Filled 63% of remaining 23M |
| +24.5 years | ~1.2M | ~319M | Nearly at cap |

> The horizon value (`154,283,512,497 ms ≈ 4.89 years`) produces ~5% inflation in year 1, decreasing smoothly over time.

### The Formula

```
New Tokens per Era = (1 - e^(-time/horizon)) × (SelCap - CurrentSupply)
```

**Benefits**: Cap guaranteed (mathematically impossible to exceed 320M), self-adjusting, smooth curve, governance-tunable via `aleph.set_inflation_parameters()`. Same model used by Aleph Zero.

### Approximate Year-by-Year Projection

*These are approximations — actual rates depend on staking participation and era timing.*

| Year | ~Supply | ~Effective Rate | ~New Tokens | Notes |
|------|---------|-----------------|-------------|-------|
| 1 | 150M → 158M | ~5.0% | ~7.5M | Early growth phase |
| 2 | 158M → 165M | ~4.4% | ~7.0M | Rate auto-decreases |
| 3 | 165M → 172M | ~3.9% | ~6.4M | As gap shrinks |
| 5 | 177M → 187M | ~3.0% | ~5.5M | Smooth decline |
| 10 | 206M → 215M | ~2.0% | ~4.4M | Approaching maturity |
| 15 | 228M → 235M | ~1.5% | ~3.5M | Long-term stability |
| 20 | 247M → 252M | ~1.0% | ~2.5M | Near terminal |
| 30 | 273M → 276M | ~0.5% | ~1.5M | Asymptotic approach |
| 50+ | 310M → 320M | ~0.1% | <0.5M | Effectively capped |

### Inflation Curve (Exponential Decay)

```
Inflation %
    │
 5% ┤ ●
    │  ╲
 4% ┤   ╲
    │    ╲
 3% ┤     ╲
    │      ╲╲
 2% ┤        ╲╲
    │          ╲╲╲
 1% ┤             ╲╲╲╲
    │                 ╲╲╲╲╲╲
0.5%┤                       ╲╲╲╲╲╲╲╲→ asymptotic to 0%
    │
    └─────────────────────────────────────────────────────→
      1   5    10    15    20    25    30    40    50+ years

    SMOOTH CURVE: No sudden drops, mathematically guaranteed cap
```

### Validator vs Treasury Split

From each era's inflation rewards:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Era Payout Split (on-chain constant):                     │
│                                                             │
│   ├── 75% → Validators & Nominators (VALIDATOR_REWARD)      │
│   └── 25% → Treasury (for ecosystem growth)                 │
│                                                             │
│   Note: This split is adjustable via runtime upgrade        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Adjusting Inflation via Governance

The inflation model can be tuned without a runtime upgrade:

```rust
// Governance call to adjust inflation parameters
aleph.set_inflation_parameters(
    sel_cap: Option<Balance>,           // Change the cap
    horizon_millisecs: Option<u64>      // Change decay speed
)
```

| Adjustment | Effect |
|------------|--------|
| ↑ Increase horizon | Slower decay, more inflation |
| ↓ Decrease horizon | Faster decay, less inflation |
| ↓ Decrease cap | Less total supply possible |
| ↑ Increase cap | Not recommended (requires governance) |

---

## Post-Cap Economics

### What Happens When Supply Reaches 320M?

When `total_issuance >= sel_cap`, the exponential decay formula produces **zero new tokens**. The network transitions from inflation-funded to fee-funded security.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   BEFORE CAP            │       AT/AFTER CAP                │
│   ──────────────────────│─────────────────────────────      │
│   Validators earn:      │   Validators earn:                │
│   • Inflation rewards   │   • Transaction fees only         │
│   • Transaction fees    │   • No new token minting          │
│                         │                                   │
│   Supply: Growing       │   Supply: Stable or Deflationary  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

At cap, validator incentives come entirely from transaction fees (see [Deflationary Mechanisms](#deflationary-mechanisms) for fee split details). Burns can push supply **below** 320M.

### Self-Balancing Supply

Post-cap, the supply oscillates based on network activity:

```
         High Activity              Low Activity
         ─────────────              ────────────
         Burns > 0                  Burns ≈ 0
         Supply ↓ (deflation)       Supply = 320M (stable)
         
Supply
320M ━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 ╲      ╱╲      ╱╲
                  ╲    ╱  ╲    ╱  ╲    ← Oscillates based
                   ╲  ╱    ╲  ╱    ╲     on network usage
                    ╲╱      ╲╱      ╲
310M ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
     │
     └──────────────────────────────────────────────────→
       Cap reached                              time
```

### Comparison to Other Networks

| Network | Post-Cap Model | Validator Incentive |
|---------|---------------|---------------------|
| **Bitcoin** | Fixed 21M cap, fees only | Transaction fees |
| **Ethereum** | No cap, but burns offset | Inflation + fees - burns |
| **Cosmos** | Perpetual 7-20% inflation | Inflation rewards |
| **Selendra** | 320M cap + fee burns | Fees (deflationary possible) ✅ |

### Timeline Estimate

| Phase | ~Year | Supply | Validator Revenue Source |
|-------|-------|--------|-------------------------|
| Growth | 1-15 | 150M → 280M | ~80% inflation, ~20% fees |
| Transition | 15-25 | 280M → 310M | ~50% inflation, ~50% fees |
| Maturity | 25-35 | 310M → 320M | ~10% inflation, ~90% fees |
| Post-Cap | 35+ | ≤320M | 100% fees (deflationary) |

---

## Deflationary Mechanisms

### 1. Initial Burn (One-time)

| Parameter | Value |
|-----------|-------|
| **Amount** | 80,000,000 SEL (35% of current) |
| **Source** | Team (40M) + Angels (40M) pre-distribution |
| **Method** | Sent to `0x000...dead` in genesis block |
| **Verification** | On-chain, provable via block explorer |

### 2. Transaction Fee Burns (Ongoing)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  EVERY TRANSACTION ON SELENDRA                              │
│                                                             │
│  Gas Fee Split:                                             │
│  ├── 90% → BURNED 🔥 (permanent removal)                    │
│  ├── 7%  → Block Validators                                 │
│  └── 3%  → DAO Treasury                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. DEX & Bridge Burns

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DEX SWAP FEE (0.30%):                                      │
│  ├── 0.20% → LP Providers (incentive)                       │
│  ├── 0.05% → BURNED 🔥                                      │
│  └── 0.05% → DAO Treasury                                   │
│                                                             │
│  BRIDGE FEE (0.50%):                                        │
│  ├── 0.25% → BURNED 🔥                                      │
│  └── 0.25% → DAO Treasury                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Projected Burn Impact

| Scenario | Annual Tx Volume | Fee Revenue | Annual Burn | Net Inflation |
|----------|------------------|-------------|-------------|---------------|
| Low activity | $10M | $30K | ~1M SEL | 4.3% (Year 1) |
| Medium activity | $100M | $300K | ~10M SEL | 0% (breakeven) |
| High activity | $1B | $3M | ~100M SEL | **-2% deflationary** |

**At scale, Selendra becomes deflationary like Ethereum post-merge.**

---

## Staking Economics

### Validator Requirements

| Parameter | Current Value | Target Value |
|-----------|---------------|--------------|
| Minimum stake (Validator) | 25,000 SEL | 1,000,000 SEL |
| Minimum stake (Nominator) | 100 SEL | 100 SEL |
| Unbonding period | 14 eras (~14 days) | 28 eras (~28 days) |
| Max validators | 1,000 (expandable) | 1,000 (expandable) |
| Sessions per era | 96 (15 min each) | 96 (15 min each) |
| Nominators per validator | 1 (DPoS mode) | 1 (DPoS mode) |

> **Note**: "Current Value" reflects what's in the codebase today. "Target Value" is the Tokenomics v3.0 goal requiring a runtime upgrade.

### Slashing (Penalties)

| Offense | Penalty | Notes |
|---------|---------|-------|
| **Equivocation** (double-signing) | 10% of stake | Immediate slash |
| **Unresponsiveness** | 0.1% per era offline | Cumulative |
| **Invalid blocks** | Up to 100% | Severe, rare |

> Slashed funds go to Treasury. Nominators share the slash proportionally.

### Reward Distribution

From each era's inflation: **75%** → Validators & Nominators | **25%** → Treasury (defined as `VALIDATOR_REWARD` in runtime).

### APY Projections

| Staking Rate | Validator APY | Nominator APY | Interpretation |
|--------------|---------------|---------------|----------------|
| 30% | 18% | 15% | Need more stakers |
| 50% | 12% | 10% | Below target |
| **65%** | **10%** | **8%** | **Target** ✅ |
| 80% | 7% | 5% | Above target |
| 90% | 5% | 3% | Over-staked |

**Dynamic adjustment**: APY increases when staking is low, decreases when high.

---

## Vesting & Anti-Dump

| Allocation | Cliff | Vesting | Full Unlock |
|------------|-------|---------|-------------|
| Angels (15M) | 6 months | Linear | 24 months |
| Team (15M) | 12 months | Linear | 48 months |
| DAO Treasury (50M) | None | Governance-controlled | On-demand |

**Bridge Friction (BSC → Selendra)**: 0.5% fee, 10K SEL minimum, 15min delay, 1M daily limit per wallet.

---

## Governance

All treasury funds controlled by on-chain governance. **No foundation.**

**Active Pallets**: democracy (32), treasury (16), collective (30/31), vesting (53), preimage (34)

**Needs Adding**: `pallet_bounties`, `pallet_tips` (requires runtime upgrade)

| Proposal Type | Quorum | Approval | Voting Period |
|---------------|--------|----------|---------------|
| Parameter change | 5% | 50%+1 | 7 days |
| Treasury spend (<1M) | 10% | 50%+1 | 14 days |
| Treasury spend (>1M) | 20% | 66% | 28 days |
| Protocol upgrade | 25% | 75% | 28 days |

**Voting**: 1 SEL = 1 Vote. Standard Substrate conviction voting (0.1x–6x multiplier based on lock period).

---

## Technical Comparison

| Metric | Selendra | Ethereum | Solana | Avalanche |
|--------|----------|----------|--------|-----------|
| **VM Support** | EVM + WASM | EVM | SVM | EVM |
| **Block Time** | 1 second | 12 seconds | 0.4 seconds | 2 seconds |
| **Finality** | 1 second | 15 minutes | 12 seconds | 2 seconds |
| **Max Supply** | 320M | Uncapped | Uncapped | 720M |
| **Current Supply** | 150M* | 120M | 570M | 450M |
| **Fee Burn** | 90% | ~80% | 50% | 100% |
| **Consensus** | NPoS + AlephBFT | PoS | PoH + PoS | Avalanche |

*Post-burn

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Low fee revenue post-cap** | Validators leave | Governance can reduce burn rate (90% → 70%) or add micro-inflation |
| **Validator centralization** | 1M SEL requirement too high | Target value adjustable via governance; start lower |
| **BSC dump at migration** | Price crash | Bridge friction (0.5% fee, 15min delay, daily limits) |
| **Governance attack** | Treasury drained | 20-25% quorum + 66-75% approval for large spends |
| **Smart contract exploit** | Loss of funds | Audits required before mainnet; bug bounty program |

---

## Document Info

| Field | Value |
|-------|-------|
| Version | 3.2 |
| Date | December 3, 2025 |
| Author | Selendra Core Team |
| Status | Draft |
| Review | Pending community feedback |

---

*This document is subject to change based on community governance decisions.*
