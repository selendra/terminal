# Selendra Tokenomics v3.0

> **Settlement layer for tokenized assets** — Built for Cambodia. Open to all.

---

## Executive Summary

Selendra is a dual-VM blockchain (EVM + WASM) with 1-second finality, designed as the settlement layer for tokenized assets. Starting with loyalty points in Cambodia, the network is open to all builders worldwide.

This document outlines the tokenomics model designed to achieve a **$10B market cap** within 10 years through strategic scarcity, deflationary mechanisms, and sustainable growth.

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

**Simple Analogy:** Think of filling a bathtub with a leaky bucket:
- A **shorter horizon** = faster leak = slower fill = less inflation
- A **longer horizon** = slower leak = faster fill = more inflation

The current value (`154,283,512,497 ms ≈ 4.89 years`) was chosen to produce ~5% inflation in year 1, decreasing smoothly over time.

### The Formula (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   New Tokens per Era = (1 - e^(-time/horizon)) × Gap        │
│                                                             │
│   Where:                                                    │
│   • Gap = 320M (cap) - Current Supply                       │
│   • time = era duration in milliseconds                     │
│   • horizon = ExponentialInflationHorizon (~4.9 years)      │
│                                                             │
│   In plain English:                                         │
│   "Mint a small percentage of the remaining gap each era"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Exponential Decay?

| Benefit | Explanation |
|---------|-------------|
| **Cap Guaranteed** | Mathematically impossible to exceed 320M |
| **Self-Adjusting** | No manual intervention needed |
| **Smooth Curve** | No sudden inflation changes |
| **Governance Tunable** | `SelCap` and `horizon` adjustable via governance |
| **Battle-Tested** | Same model used by Aleph Zero |

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

### Fee-Based Security Model

At cap, validator incentives come entirely from transaction fees:

| Fee Source | Split | Recipient |
|------------|-------|-----------|
| Gas fees | 90% | Burned 🔥 |
| Gas fees | 7% | Validators |
| Gas fees | 3% | Treasury |
| DEX fees | 0.05% | Burned 🔥 |
| Bridge fees | 0.25% | Burned 🔥 |

> **Result**: Validators earn from fees, while burns can push supply **below** 320M.

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

### Governance Options (If Needed)

If fee revenue proves insufficient for security, governance can:

1. **Adjust fee split** — Increase validator share from 7% to higher
2. **Reduce burn rate** — Lower 90% burn to maintain validator income
3. **Micro-inflation** — Vote to allow 0.1-0.5% perpetual inflation (requires community consensus)

> **Note**: These are emergency options. The design goal is fee-sustainable security.

---

## Deflationary Mechanisms

### 1. Initial Burn (One-time)

```
Burn Amount: 80,000,000 SEL (35% of current supply)
Source: Undecided/Treasury allocation
Method: Send to burn address 0x000...dead
Result: Permanent removal, provable on-chain
```

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

### Reward Distribution

From the on-chain `ExponentialEraPayout` implementation:

```
Era Rewards Pool (from exponential decay)
      │
      ├── 75% → Validators (VALIDATOR_REWARD constant)
      │         └── Validators share with nominators
      │
      └── 25% → Treasury (for ecosystem growth)
```

> **Note**: The 75/25 split is defined in `bin/runtime/src/lib.rs` as `VALIDATOR_REWARD = Perbill::from_percent(75)`. This is a compile-time constant and requires a runtime upgrade to change.

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

## Price Projections

### Path to $10B Market Cap

| Milestone | Price | Market Cap | Timeline | Catalyst |
|-----------|-------|------------|----------|----------|
| Launch | $0.0025 | $375K | Now | DEX launch |
| Seed | $0.01 | $1.5M | +3 months | First investors |
| Private Sale | $0.05 | $7.5M | +6 months | Strategic partners |
| Series A | $0.25 | $37.5M | +12 months | VC funding |
| DEX Growth | $1.00 | $150M | +24 months | Ecosystem traction |
| CEX Listing | $5.00 | $750M | +36 months | Tier-1 exchange |
| Adoption | $15.00 | $2.25B | +60 months | ASEAN growth |
| **Target** | **$31.25** | **$10B** | **+120 months** | Mass adoption |

### Growth Multiple

```
From $0.0025 to $31.25 = 12,500x over 10 years

For comparison:
- Solana: $0.22 → $250 = 1,136x in 4 years
- Avalanche: $4 → $140 = 35x in 2 years
- Polygon: $0.01 → $2.80 = 280x in 2 years
```

---

## Anti-Dump Protections

### 1. Vesting Schedules

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ANGELS (15M SEL):                                          │
│  ├── 6-month cliff (0% unlocked)                            │
│  ├── Month 7-24: Linear unlock                              │
│  └── Month 24: 100% unlocked                                │
│                                                             │
│  TEAM (15M SEL):                                            │
│  ├── 12-month cliff (0% unlocked)                           │
│  ├── Month 13-48: Linear unlock                             │
│  └── Month 48: 100% unlocked                                │
│                                                             │
│  DAO TREASURY (50M SEL):                                    │
│  ├── Held in on-chain Treasury pallet                       │
│  ├── Released only via governance proposals                 │
│  └── No vesting - fully governance-controlled               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Bridge Friction (BSC → Selendra)

```
To sell BSC SEL on Selendra DEX:
├── Bridge fee: 0.5%
├── Minimum bridge: 10,000 SEL
├── Time delay: 15 minutes
├── Daily limit: 1,000,000 SEL per wallet
└── Must hold SEL for gas on Selendra

Result: Small holders won't bother selling
```

### 3. DEX on Selendra (Not BSC)

```
Primary trading on Selendra native DEX:
├── All fees stay in ecosystem
├── All burns happen on Selendra
├── Reduces BSC dumping
└── Builds Selendra TVL
```

---

## Governance

### DAO Treasury (50M SEL) — On-Chain Governance

All treasury funds are controlled by Substrate governance pallets (Democracy + Treasury). **No foundation, no centralized control.**

```
┌─────────────────────────────────────────────────────────────┐
│  GOVERNANCE PALLETS (Current Status)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ pallet_democracy    → Referenda & voting (index 32)     │
│  ✅ pallet_treasury     → Treasury spend proposals (16)     │
│  ✅ pallet_collective   → Council motions (30/31)           │
│  ✅ pallet_vesting      → Token vesting schedules (53)      │
│  ✅ pallet_preimage     → Proposal preimages (34)           │
│  ⬜ pallet_bounties     → Developer bounties (NEEDS ADDING) │
│  ⬜ pallet_tips         → Community tips (NEEDS ADDING)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Upgrade Required**: `pallet_bounties` and `pallet_tips` must be added via runtime upgrade to enable full DAO functionality.

| Proposal Type | Quorum | Approval | Voting Period |
|---------------|--------|----------|---------------|
| Parameter change | 5% | 50%+1 | 7 days |
| Treasury spend (<1M) | 10% | 50%+1 | 14 days |
| Treasury spend (>1M) | 20% | 66% | 28 days |
| Protocol upgrade | 25% | 75% | 28 days |
| Bounty creation | 5% | 50%+1 | 7 days |

### Voting Power

```
1 SEL = 1 Vote

Conviction Voting (Standard Substrate):
├── 0.1x → No lock (10% weight)
├── 1x   → Lock for 1 era
├── 2x   → Lock for 2 eras
├── 3x   → Lock for 4 eras
├── 4x   → Lock for 8 eras
├── 5x   → Lock for 16 eras
└── 6x   → Lock for 32 eras (maximum conviction)

Bonuses:
├── Staked SEL: Can vote while staked
├── LP providers: 1.25x voting power
└── Long-term stakers: Natural conviction bonus
```

### Treasury Spend Categories

| Category | Example Uses | Typical Spend |
|----------|--------------|---------------|
| **Development** | Core protocol, tooling | 500K-5M SEL |
| **Grants** | dApp builders, integrations | 10K-500K SEL |
| **Marketing** | Events, partnerships | 50K-1M SEL |
| **Bounties** | Bug fixes, features | 1K-100K SEL |
| **Tips** | Community contributions | 100-10K SEL |

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

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SELENDRA TOKENOMICS v3.0                                   │
│  "Settlement Layer for Tokenized Assets"                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SUPPLY                                                     │
│  ├── Current: 230M SEL                                      │
│  ├── Burn: -80M SEL (35%)                                   │
│  ├── Post-Burn: 150M SEL                                    │
│  └── Max Cap: 320M SEL                                      │
│                                                             │
│  INFLATION (Exponential Decay)                              │
│  ├── Model: (1 - e^(-t/horizon)) × (cap - supply)           │
│  ├── Year 1: ~5% (auto-adjusting)                           │
│  ├── Year 10: ~2% (auto-adjusting)                          │
│  └── Terminal: Asymptotic to 0% (cap guaranteed)            │
│                                                             │
│  BURNS                                                      │
│  ├── Initial: 80M SEL                                       │
│  ├── Tx Fees: 90% burned                                    │
│  ├── DEX Fees: 0.05% burned                                 │
│  └── Bridge Fees: 0.25% burned                              │
│                                                             │
│  STAKING                                                    │
│  ├── Validator Share: 75% of era rewards (on-chain)         │
│  ├── Treasury Share: 25% of era rewards (on-chain)          │
│  ├── Unbonding: Currently 14 eras (target: 28 eras)         │
│  └── APY: Dynamic based on staking rate                     │
│                                                             │
│  TARGET                                                     │
│  ├── Market Cap: $10B                                       │
│  ├── Price: $31.25/SEL                                      │
│  └── Timeline: 10 years                                     │
│                                                             │
│  NARRATIVE                                                  │
│  "Built for Cambodia. Open to all."                         │
│  "Starting with loyalty points, scaling to all assets"      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Document Info

| Field | Value |
|-------|-------|
| Version | 3.0 |
| Date | November 30, 2025 |
| Author | Selendra Core Team |
| Status | Draft |
| Review | Pending community feedback |

---

*This document is subject to change based on community governance decisions.*
