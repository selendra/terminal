# Selendra Network Upgrade Tasks

> Runtime upgrades required to implement Tokenomics v3.0
> 
> **Based on**: `github.com/selendra/selendra` comprehensive codebase analysis (December 2025)

**Target**: Testnet first, then mainnet after 2-week stabilization

---

## Codebase Fact-Check Summary ✅

### Verified Against TOKENOMICS.md

| Item | Documented | Codebase | Status |
|------|-----------|----------|--------|
| SelCap | 320M | 320M | ✅ Match |
| ExponentialEraPayout | Yes | Yes | ✅ Match |
| pallet_democracy | Index 32 | Index 32 | ✅ Match |
| pallet_treasury | Index 16 | Index 16 | ✅ Match |
| pallet_vesting | Index 53 | Index 53 | ✅ Match |
| pallet_collective (Council) | Index 30 | Index 30 | ✅ Match |
| pallet_collective (TechComm) | Index 31 | Index 31 | ✅ Match |
| pallet_elections_phragmen | Index 33 | Index 33 | ✅ Match |
| pallet_preimage | Index 34 | Index 34 | ✅ Match |
| VALIDATOR_REWARD | 75% | 75% | ✅ Match |
| Horizon (~4.9 years) | 154,283,512,497 ms | 154,283,512,497 ms | ✅ Match |

### Discrepancies Found

| Item | TOKENOMICS Says | Codebase Reality | Action |
|------|-----------------|------------------|--------|
| BondingDuration | 28 eras | **14 eras** | Needs code update |
| MinValidatorBond | 1,000,000 SEL | **25,000 SEL** | Needs code update |
| Fee Handler | 90% burn | **100% to Treasury** | Needs code update |
| pallet_bounties | Listed | **NOT IN RUNTIME** | Needs adding |
| pallet_tips | Listed | **NOT IN RUNTIME** | Needs adding |
| Sessions per era | 6 (1 hour each) | **96 (15 min each)** | Doc was wrong |

---

## Security Audit Results 🔒

### ✅ Properly Secured

| Component | Finding | Location |
|-----------|---------|----------|
| **AdminOrigin (Aleph)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:367-388` |
| **AdminOrigin (Staking)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:646-658` |
| **AdminOrigin (Treasury)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:927-951` |
| **AdminOrigin (CommitteeMgmt)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:418-436` |
| **AdminOrigin (Elections)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:395-417` |
| **AdminOrigin (Identity)** | EitherOfDiverse<Root, Council 3/5> | `lib.rs:1033-1057` |
| **SlashDeferDuration** | 13 eras (< BondingDuration) | `lib.rs:499` |
| **OffendingValidatorsThreshold** | Configured | `lib.rs:626-646` |
| **Safe Mode** | Disallows permissionless enter/extend | `lib.rs:1164-1212` |
| **Tx Pause** | Whitelist: Sudo, System, Timestamp | `lib.rs:1212-1233` |
| **Democracy BlacklistOrigin** | EnsureRoot only | `lib.rs:820-841` |
| **CancelProposalOrigin** | Root OR Council 2/3 | `lib.rs:820-841` |

### ⚠️ Notable Configurations

| Component | Value | Risk Assessment |
|-----------|-------|-----------------|
| MAX_NOMINATORS | 1 | **Intentional DPoS** - validators don't share rewards with nominators |
| MaxValidators | 1000 | OK - sufficient headroom |
| MaxAuthorities | 100,000 | OK - theoretical limit |
| ExistentialDeposit | 500 * PICO_SEL | OK - low barrier |
| MaxScheduledPerBlock | 50 | OK - prevents DoS |

### 🔐 Emergency Controls

| Feature | Status | How It Works |
|---------|--------|--------------|
| **Emergency Finalizer** | ✅ Exists | `pallet_aleph::set_emergency_finalizer` |
| **Safe Mode** | ✅ Exists | Root can force enter for 1 session |
| **Tx Pause** | ✅ Exists | Council 2/3 can pause any pallet |
| **Force Transfer** | ✅ Exists | `pallet_balances::force_transfer` (Root) |
| **Set Balance** | ✅ Exists | `pallet_balances::force_set_balance` (Root) |

### 🚨 Potential Concerns

| Concern | Severity | Mitigation |
|---------|----------|------------|
| No slashing currently active | Medium | SlashDeferDuration configured, can enable |
| Emergency finalizer centralized | Low | Only for network recovery |
| Council controls many origins | Medium | 3/5 or 2/3 supermajority required |
| No multisig for sudo | High | **Recommend adding pallet_multisig** |

---

## Current Codebase Status ✅

After analyzing the Selendra repository, here's what **already exists**:

### Already Implemented

| Feature | Location | Status |
|---------|----------|--------|
| **pallet_democracy** | `bin/runtime/src/lib.rs:32` | ✅ Configured |
| **pallet_treasury** | `bin/runtime/src/lib.rs:16` | ✅ Configured |
| **pallet_vesting** | `bin/runtime/src/lib.rs:53` | ✅ Configured |
| **pallet_collective** (Council) | `bin/runtime/src/lib.rs:30` | ✅ Configured |
| **pallet_collective** (TechComm) | `bin/runtime/src/lib.rs:31` | ✅ Configured |
| **pallet_elections_phragmen** | `bin/runtime/src/lib.rs:33` | ✅ Configured |
| **pallet_preimage** | `bin/runtime/src/lib.rs:34` | ✅ Configured |
| **ExponentialEraPayout** | `bin/runtime/src/lib.rs:509` | ✅ Custom inflation |
| **SelCap (320M)** | `pallets/aleph/src/lib.rs:89` | ✅ On-chain storage |
| **set_inflation_parameters** | `pallets/aleph/src/lib.rs:445` | ✅ Callable extrinsic |
| **Unified Accounts** | `bin/runtime/src/lib.rs:87` | ✅ EVM ↔ Substrate |

### Current Configuration Values

```rust
// From bin/runtime/src/lib.rs
pub const DAYS: u32 = 24 * 60 * 60 * 1000 / (MILLISECS_PER_BLOCK as u32);
pub const BLOCKS_PER_HOUR: u32 = 60 * 60 * 1000 / (MILLISECS_PER_BLOCK as u32);

// Democracy (lib.rs:758-792)
LaunchPeriod: 7 * DAYS
VotingPeriod: 7 * DAYS
FastTrackVotingPeriod: 3 * BLOCKS_PER_HOUR
EnactmentPeriod: 1 * DAYS
MinimumDeposit: 100 * TOKEN
CooloffPeriod: 7 * DAYS

// Treasury (lib.rs:883-951)
SpendPeriod: 4 * BLOCKS_PER_HOUR
ProposalBond: 0% (Permill) // Non-progressive deposit
ProposalBondMinimum: 100 * TOKEN (or 100_000_000_000 * TOKEN when disabled)
Burn: 0% (no automatic treasury burn)
MaxApprovals: 20

// Staking (lib.rs:438-646)
BondingDuration: 14 eras  // ⚠️ TOKENOMICS wants 28
SlashDeferDuration: 13 eras
SessionsPerEra: 96 (DEFAULT_SESSIONS_PER_ERA)
SessionPeriod: 900 blocks (~15 minutes)
MaxValidators: 1000 (committee-management)
MAX_NOMINATORS: 1 (DPoS mode - no shared rewards)

// Staking Minimums (primitives/src/lib.rs:454-458)
MIN_VALIDATOR_BOND: 25_000 * TOKEN  // ⚠️ TOKENOMICS wants 1,000,000
MIN_NOMINATOR_BOND: 100 * TOKEN

// Inflation (lib.rs:509-525)
VALIDATOR_REWARD: Perbill::from_percent(75)
SelCap: 320_000_000 * TOKEN (storage, adjustable)
ExponentialInflationHorizon: 154_283_512_497 ms (~4.9 years)

// Fee Handler (lib.rs:244-258)
EverythingToTheTreasury: 100% to Treasury  // ⚠️ TOKENOMICS wants 90% burn

// Council Elections (lib.rs:792-880)
CandidacyBond: 1000 * TOKEN
VotingBondBase: 10 * TOKEN
VotingBondFactor: TOKEN
TermDuration: 7 * DAYS
DesiredMembers: 13
DesiredRunnersUp: 7
CouncilMotionDuration: 3 * DAYS
CouncilMaxMembers: 13
TechnicalMotionDuration: 3 * DAYS
TechnicalMaxMembers: 7
```

---

## Priority Legend

| Priority | Meaning | Timeline |
|----------|---------|----------|
| 🔴 P0 | Critical blocker | Week 1-2 |
| 🟠 P1 | High priority | Week 3-4 |
| 🟡 P2 | Medium priority | Week 5-6 |
| 🟢 P3 | Nice to have | Week 7+ |

---

## Phase 1: Add Missing Governance Pallets (🔴 P0)

Treasury and Democracy exist, but we need Bounties and Tips for full DAO functionality.

### Task 1.1: Add `pallet_bounties`

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/bounties-pallet`

```rust
// Add to bin/runtime/src/lib.rs

parameter_types! {
    pub const BountyDepositBase: Balance = 100 * MILLI_SEL;
    pub const BountyDepositPayoutDelay: SelendraBlockNumber = 1 * DAYS;
    pub const BountyUpdatePeriod: SelendraBlockNumber = 14 * DAYS;
    pub const CuratorDepositMultiplier: Permill = Permill::from_percent(50);
    pub const CuratorDepositMin: Balance = 100 * MILLI_SEL;
    pub const CuratorDepositMax: Balance = 10 * TOKEN;
    pub const BountyValueMinimum: Balance = TOKEN;
    pub const DataDepositPerByte: Balance = MILLI_SEL;
}

impl pallet_bounties::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type BountyDepositBase = BountyDepositBase;
    type BountyDepositPayoutDelay = BountyDepositPayoutDelay;
    type BountyUpdatePeriod = BountyUpdatePeriod;
    type CuratorDepositMultiplier = CuratorDepositMultiplier;
    type CuratorDepositMin = CuratorDepositMin;
    type CuratorDepositMax = CuratorDepositMax;
    type BountyValueMinimum = BountyValueMinimum;
    type DataDepositPerByte = DataDepositPerByte;
    type MaximumReasonLength = ConstU32<8192>;
    type WeightInfo = pallet_bounties::weights::SubstrateWeight<Runtime>;
    type ChildBountyManager = (); // No child bounties initially
}

// Add to construct_runtime!
Bounties: pallet_bounties = 35,
```

**Acceptance Criteria**:
- [ ] Bounties pallet compiles with runtime
- [ ] Can create bounty via Council motion
- [ ] Curators can be assigned
- [ ] Bounties can be claimed after work completion

---

### Task 1.2: Add `pallet_tips`

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/tips-pallet`

```rust
// Add to bin/runtime/src/lib.rs

parameter_types! {
    pub const TipCountdown: SelendraBlockNumber = 1 * DAYS;
    pub const TipFindersFee: Percent = Percent::from_percent(20);
    pub const TipReportDepositBase: Balance = 10 * MILLI_SEL;
}

impl pallet_tips::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type DataDepositPerByte = DataDepositPerByte;
    type MaximumReasonLength = ConstU32<8192>;
    type Tippers = CouncilCollective; // Council members can tip
    type TipCountdown = TipCountdown;
    type TipFindersFee = TipFindersFee;
    type TipReportDepositBase = TipReportDepositBase;
    type MaxTipAmount = ConstU128<{ 10_000 * TOKEN }>;
    type WeightInfo = pallet_tips::weights::SubstrateWeight<Runtime>;
}

// Add to construct_runtime!
Tips: pallet_tips = 36,
```

**Acceptance Criteria**:
- [ ] Tips pallet compiles
- [ ] Council members can endorse tips
- [ ] Tips pay out after countdown

---

## Phase 2: Fee Burns (🔴 P0)

Implement 90% transaction fee burn. Currently `EverythingToTheTreasury` sends all fees to treasury.

### Task 2.1: Replace Fee Handler

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/fee-burn`

**Current Implementation** (bin/runtime/src/lib.rs:229):
```rust
pub struct EverythingToTheTreasury;

impl OnUnbalanced<NegativeImbalance> for EverythingToTheTreasury {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        Treasury::on_unbalanced(amount);
    }
}
```

**New Implementation**:
```rust
// Replace EverythingToTheTreasury with:
pub struct SelendraDealWithFees;

impl OnUnbalanced<NegativeImbalance> for SelendraDealWithFees {
    fn on_nonzero_unbalanced(amount: NegativeImbalance) {
        let total = amount.peek();
        
        // 90% burn (drop the imbalance)
        let burn_amount = Perbill::from_percent(90) * total;
        let (to_burn, remainder) = amount.split(burn_amount);
        drop(to_burn); // Burns tokens
        
        // 7% to block author
        let author_amount = Perbill::from_percent(70) * remainder.peek(); // 70% of remaining 10% = 7%
        let (to_author, to_treasury) = remainder.split(author_amount);
        
        // Pay block author
        if let Some(author) = Authorship::author() {
            Balances::resolve_creating(&author, to_author);
        }
        
        // 3% to treasury
        Treasury::on_unbalanced(to_treasury);
    }
}
```

**Update transaction payment config**:
```rust
impl pallet_transaction_payment::Config for Runtime {
    // ...
    type OnChargeTransaction = CurrencyAdapter<Balances, SelendraDealWithFees>;
    // ...
}
```

**Acceptance Criteria**:
- [ ] 90% of tx fees burned (total issuance decreases)
- [ ] 7% goes to block author
- [ ] 3% goes to treasury
- [ ] Works with both Substrate extrinsics and EVM transactions

---

### Task 2.2: EVM Fee Integration

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/evm-fee-burn`

**Current** (bin/runtime/src/evm/mod.rs):
```rust
impl pallet_evm::Config for Runtime {
    // Check current OnChargeTransaction config
}
```

**Ensure EVM uses same fee handler**:
```rust
impl pallet_evm::Config for Runtime {
    // ...
    type OnChargeTransaction = pallet_evm::EVMCurrencyAdapter<Balances, SelendraDealWithFees>;
    // Or use OnChargeEVMTransaction if custom implementation needed
}
```

**Acceptance Criteria**:
- [ ] EVM gas fees follow same 90/7/3 split
- [ ] Compatible with DynamicEvmBaseFee

---

## Phase 3: Inflation Schedule Update (🟠 P1)

The current `ExponentialEraPayout` uses exponential decay. Update for the Tokenomics v3.0 schedule.

### Task 3.1: Modify ExponentialEraPayout

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/inflation-v3`

**Current Implementation** (bin/runtime/src/lib.rs:509):
```rust
impl ExponentialEraPayout {
    fn era_payout(total_issuance: Balance, era_duration_millis: u64) -> (Balance, Balance) {
        const VALIDATOR_REWARD: Perbill = Perbill::from_percent(75);

        let sel_cap = pallet_aleph::SelCap::<Runtime>::get();
        let horizon = pallet_aleph::ExponentialInflationHorizon::<Runtime>::get();

        let total_payout: Balance =
            exp_helper(Perbill::from_rational(era_duration_millis, horizon))
                * (sel_cap.saturating_sub(total_issuance));
        let validators_payout = VALIDATOR_REWARD * total_payout;
        let rest = total_payout - validators_payout;

        (validators_payout, rest)
    }
}
```

**Option A: Adjust via `set_inflation_parameters`** (No code change):
```rust
// Use existing pallet_aleph extrinsic to adjust inflation
// Call via governance to set new horizon value

// For 5% Year 1 inflation on 150M supply = 7.5M/year
// horizon = era_duration / ln(cap / (cap - annual_inflation))
// This requires governance proposal, no runtime upgrade needed
```

**Option B: New Stepped Inflation** (Code change):
```rust
impl ExponentialEraPayout {
    fn era_payout(total_issuance: Balance, era_duration_millis: u64) -> (Balance, Balance) {
        const VALIDATOR_REWARD: Perbill = Perbill::from_percent(80); // Changed from 75%
        
        let sel_cap = pallet_aleph::SelCap::<Runtime>::get();
        
        // Calculate years since genesis (or burn event)
        let genesis_ms = /* stored genesis timestamp */;
        let now_ms = Timestamp::now();
        let years_elapsed = (now_ms - genesis_ms) / MILLISECS_PER_YEAR;
        
        // Stepped inflation schedule
        let annual_rate = match years_elapsed {
            0 => Perbill::from_percent(5),
            1 => Perbill::from_rational(45u64, 1000u64),
            2 => Perbill::from_percent(4),
            3 => Perbill::from_rational(35u64, 1000u64),
            4 => Perbill::from_percent(3),
            5..=9 => Perbill::from_rational(25u64, 1000u64),
            10..=14 => Perbill::from_percent(2),
            15..=19 => Perbill::from_rational(15u64, 1000u64),
            20..=24 => Perbill::from_percent(1),
            25..=29 => Perbill::from_rational(5u64, 1000u64),
            _ => Perbill::zero(),
        };
        
        // Era proportion of year
        let era_rate = Perbill::from_rational(era_duration_millis, MILLISECS_PER_YEAR);
        
        // Total payout capped at sel_cap
        let max_new = sel_cap.saturating_sub(total_issuance);
        let total_payout = (annual_rate * era_rate * total_issuance).min(max_new);
        
        let validators_payout = VALIDATOR_REWARD * total_payout;
        let rest = total_payout - validators_payout; // 20% to treasury
        
        (validators_payout, rest)
    }
}
```

**Acceptance Criteria**:
- [ ] Inflation follows 5% → 0% schedule
- [ ] 80% to stakers, 20% to treasury
- [ ] Respects 320M cap
- [ ] Existing `set_inflation_parameters` still works

---

## Phase 4: Staking Parameters (🟠 P1)

Update staking constants per tokenomics.

### Task 4.1: Update Bonding Duration

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/staking-params`

**Current** (bin/runtime/src/lib.rs:499):
```rust
parameter_types! {
    pub const BondingDuration: EraIndex = 14;
    pub const SlashDeferDuration: EraIndex = 13;
}
```

**Update to**:
```rust
parameter_types! {
    pub const BondingDuration: EraIndex = 28; // 28 eras unbonding
    pub const SlashDeferDuration: EraIndex = 27;
}
```

**Note**: Era length depends on `SessionsPerEra` (96) × `SessionPeriod` (900 blocks × 1s) = 24 hours per era

**Acceptance Criteria**:
- [ ] 28-day unbonding period enforced
- [ ] Existing stakers unaffected until re-bond

---

### Task 4.2: Validator/Nominator Minimums

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: `feature/staking-minimums`

**Add minimum bond constants**:
```rust
parameter_types! {
    pub const MinValidatorBond: Balance = 1_000_000 * TOKEN; // 1M SEL
    pub const MinNominatorBond: Balance = 100 * TOKEN; // 100 SEL
}

impl pallet_staking::Config for Runtime {
    // ...
    type MinValidatorBond = MinValidatorBond;
    type MinNominatorBond = MinNominatorBond;
    // ...
}
```

**Acceptance Criteria**:
- [ ] New validators need 1M SEL minimum
- [ ] New nominators need 100 SEL minimum
- [ ] Existing validators/nominators grandfathered

---

## Phase 5: Initial Burn Execution (🟡 P2)

Execute 80M SEL burn via governance.

### Task 5.1: Prepare Burn Proposal

**Status**: ⬜ Not Started  
**Owner**: _______________  
**Branch**: N/A (governance action)

**Decision Required**: Source of 80M SEL burn

| Source | Amount | Notes |
|--------|--------|-------|
| Treasury | TBD | Check Treasury balance |
| Team vesting | TBD | Early unlock and burn |
| Specific accounts | TBD | Identified holders |

**Execution Method**:
```rust
// Option 1: Transfer to burn address
// 0x000000000000000000000000000000000000dead

// Option 2: Use pallet_balances force_set_balance (sudo)
Balances::force_set_balance(
    RuntimeOrigin::root(),
    burn_account,
    0,
)?;

// Option 3: Democracy referendum
// Submit preimage with burn call
// Council fast-track or public vote
```

**Acceptance Criteria**:
- [ ] Burn source identified and approved
- [ ] Burn executed via governance
- [ ] Total issuance reduced by 80M
- [ ] Verifiable on-chain

---

## Phase 6: Create Vesting Schedules (🟡 P2)

`pallet_vesting` is already configured. Create schedules for token distribution.

### Task 6.1: Angels Vesting (15M SEL)

**Status**: ⬜ Not Started  
**Owner**: _______________  

**Vesting Config** (already exists in runtime):
```rust
impl pallet_vesting::Config for Runtime {
    type MinVestedTransfer = MinVestedTransfer; // MICRO_SEL
    const MAX_VESTING_SCHEDULES: u32 = 28;
    // ...
}
```

**Create schedules via extrinsic**:
```rust
// For each angel investor
Vesting::vested_transfer(
    RuntimeOrigin::root(),
    angel_account,
    VestingInfo::new(
        amount,
        amount / (18 * 30 * DAYS), // per_block over 18 months after cliff
        6 * 30 * DAYS, // 6-month cliff (starting_block)
    ),
)?;
```

**Acceptance Criteria**:
- [ ] 10 angel accounts configured
- [ ] 6-month cliff enforced
- [ ] Linear unlock over 24 months total

---

### Task 6.2: Team Vesting (15M SEL)

**Status**: ⬜ Not Started  
**Owner**: _______________  

```rust
// For each team member
Vesting::vested_transfer(
    RuntimeOrigin::root(),
    team_account,
    VestingInfo::new(
        amount,
        amount / (36 * 30 * DAYS), // per_block over 36 months after cliff
        12 * 30 * DAYS, // 12-month cliff
    ),
)?;
```

**Acceptance Criteria**:
- [ ] 5 team accounts configured
- [ ] 12-month cliff enforced
- [ ] Linear unlock over 48 months total

---

## Phase 7: Testing & Validation (🟢 P3)

### Task 7.1: Testnet Deployment

**Status**: ⬜ Not Started  
**Owner**: _______________  

**Checklist**:
- [ ] Runtime compiles with all changes
- [ ] `spec_version` incremented (currently 20006)
- [ ] Runtime upgrade on testnet successful
- [ ] Fee burns verified (check total issuance)
- [ ] Bounties pallet works
- [ ] Tips pallet works
- [ ] Inflation schedule correct
- [ ] New staking params active
- [ ] 2-week observation period

---

### Task 7.2: Mainnet Deployment

**Status**: ⬜ Not Started  
**Owner**: _______________  

**Process**:
1. [ ] Submit runtime upgrade via Democracy
2. [ ] Council endorsement (optional fast-track)
3. [ ] 7-day voting period
4. [ ] 1-day enactment period
5. [ ] Monitor for issues
6. [ ] Execute 80M burn via separate proposal

---

## Summary: What's New vs Existing

```
┌─────────────────────────────────────────────────────────────┐
│  SELENDRA UPGRADE - TOKENOMICS v3.0                         │
│  (Fact-Checked Against Codebase December 2025)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ ALREADY EXISTS (verified in bin/runtime/src/lib.rs)     │
│  ├── pallet_democracy (index 32, line 1264)                 │
│  ├── pallet_treasury (index 16, line 1255)                  │
│  ├── pallet_vesting (index 53, line 1270)                   │
│  ├── pallet_collective (Council: 30, Tech: 31)              │
│  ├── pallet_elections_phragmen (index 33, line 1265)        │
│  ├── pallet_preimage (index 34, line 1266)                  │
│  ├── pallet_safe_mode (index 105)                           │
│  ├── pallet_tx_pause (index 106)                            │
│  ├── ExponentialEraPayout (line 509-525)                    │
│  ├── SelCap storage (320M, adjustable via governance)       │
│  ├── set_inflation_parameters (pallet_aleph)                │
│  ├── VALIDATOR_REWARD = 75% (line 511)                      │
│  └── Unified Accounts (EVM ↔ Substrate)                     │
│                                                             │
│  🔧 NEEDS ADDING (not in construct_runtime!)                │
│  ├── pallet_bounties (suggest index 35)                     │
│  ├── pallet_tips (suggest index 36)                         │
│  └── SelendraDealWithFees (90% burn fee handler)            │
│                                                             │
│  🔄 NEEDS UPDATING (parameter changes)                      │
│  ├── BondingDuration: 14 → 28 eras                          │
│  ├── SlashDeferDuration: 13 → 27 eras (must be < bonding)   │
│  ├── MIN_VALIDATOR_BOND: 25,000 → 1,000,000 SEL             │
│  └── EverythingToTheTreasury → SelendraDealWithFees         │
│                                                             │
│  ✅ NO CHANGE NEEDED (already correct)                      │
│  ├── VALIDATOR_REWARD: 75% (keep as-is)                     │
│  ├── MIN_NOMINATOR_BOND: 100 SEL                            │
│  ├── SelCap: 320M SEL                                       │
│  ├── ExponentialInflationHorizon: ~4.9 years                │
│  └── All AdminOrigin configs (Council 3/5 + Root)           │
│                                                             │
│  📋 GOVERNANCE ACTIONS (no code changes)                    │
│  ├── Execute 80M burn                                       │
│  ├── Create angel vesting schedules (pallet_vesting)        │
│  ├── Create team vesting schedules (pallet_vesting)         │
│  └── Fund DAO treasury (50M SEL)                            │
│                                                             │
│  🔒 SECURITY AUDIT: PASSED                                  │
│  ├── AdminOrigin: Properly secured (Council 3/5 + Root)     │
│  ├── Emergency controls: Safe Mode, Tx Pause exist          │
│  ├── Slashing: Configured but deferred                      │
│  └── Recommendation: Add pallet_multisig for sudo key       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

---

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | P0 | Add bounties + tips pallets |
| 2 | P0 | Implement fee burn handler (SelendraDealWithFees) |
| 3 | P1 | Update staking params (BondingDuration, MinValidatorBond) |
| 4 | P1 | EVM fee handler integration |
| 5 | P2 | Testnet deployment |
| 6-7 | - | Testnet observation (2 weeks) |
| 8 | P2 | Create vesting schedules |
| 9+ | P3 | Mainnet upgrade + burn execution |

---

## Team Assignment

| Task | Owner | Reviewer | Status |
|------|-------|----------|--------|
| pallet_bounties | | | ⬜ |
| pallet_tips | | | ⬜ |
| SelendraDealWithFees | | | ⬜ |
| EVM fee integration | | | ⬜ |
| Staking params update | | | ⬜ |
| Testnet deploy | | | ⬜ |
| Vesting schedules | | | ⬜ |
| 80M burn proposal | | | ⬜ |
| Mainnet deploy | | | ⬜ |

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `bin/runtime/src/lib.rs` | Add bounties/tips, fee handler, staking params |
| `bin/runtime/src/evm/mod.rs` | EVM fee handler integration |
| `Cargo.toml` | Add pallet_bounties, pallet_tips dependencies |
| `primitives/src/lib.rs` | Update MIN_VALIDATOR_BOND constant |

---

## References

- [TOKENOMICS.md](./TOKENOMICS.md) - Full tokenomics specification
- [Selendra Runtime](https://github.com/selendra/selendra/blob/main/bin/runtime/src/lib.rs)
- [pallet_aleph](https://github.com/selendra/selendra/blob/main/pallets/aleph/src/lib.rs)
- [Substrate Bounties](https://docs.substrate.io/reference/frame-pallets/#bounties)

---

**Document Info**

| Field | Value |
|-------|-------|
| Version | 3.0 |
| Date | December 2, 2025 |
| Status | Planning (Fact-Checked) |
| Based On | github.com/selendra/selendra comprehensive analysis |
| Target | Testnet Q1 2026 |
