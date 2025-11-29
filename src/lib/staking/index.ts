/**
 * Selendra Staking Service
 *
 * Provides comprehensive staking functionality for both Substrate (native)
 * and EVM (precompile) staking operations.
 *
 * Selendra Chain Constants:
 * - SS58 Prefix: 42
 * - Token Decimals: 18
 * - Unbonding Period: 28 eras (configurable)
 * - Max Nominations: 16
 * - Min Nomination Amount: 1000 SEL
 */

import { ethers } from "ethers";

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface ValidatorInfo {
  address: string;
  controllerAddress?: string;
  stash?: string;
  name?: string;
  commission: number; // Percentage (0-100)
  totalStake: bigint;
  ownStake: bigint;
  nominatorStake: bigint;
  nominators: number;
  nominatorCap?: number;
  isActive: boolean;
  isElected: boolean;
  isOversubscribed: boolean;
  isBlocked: boolean;
  isSlashed: boolean;
  slashingSpans?: number;
  apy: number;
  eraPoints: number;
  blocksProduced: number;
  rewardsLastEra?: bigint;
  identity?: ValidatorIdentity;
  preferences?: ValidatorPreferences;
}

export interface ValidatorIdentity {
  display?: string;
  legal?: string;
  web?: string;
  email?: string;
  twitter?: string;
  riot?: string;
  verified: boolean;
  judgements?: Array<{
    registrar: number;
    judgement: string;
  }>;
}

export interface ValidatorPreferences {
  commission: number;
  blocked: boolean;
}

export interface StakingInfo {
  // User's staking state
  bonded: bigint;
  unbonding: bigint;
  redeemable: bigint;
  totalRewards: bigint;
  claimableRewards: bigint;

  // Nominations
  nominations: string[];
  nominationStatus: "active" | "inactive" | "waiting" | "none";

  // Controller/Stash
  stashAccount?: string;
  controllerAccount?: string;

  // Reward destination
  rewardDestination: RewardDestination;
}

export type RewardDestination =
  | { type: "Staked" }
  | { type: "Stash" }
  | { type: "Controller" }
  | { type: "Account"; address: string }
  | { type: "None" };

export interface EraInfo {
  currentEra: number;
  activeEra: number;
  activeEraStart?: number;
  sessionIndex: number;
  sessionsPerEra: number;
  eraProgress: number; // Percentage
  eraLength: number; // In blocks
  blocksRemaining: number;
  estimatedTimeRemaining: number; // In seconds
}

export interface StakingStats {
  totalStaked: bigint;
  totalIssuance: bigint;
  stakingRate: number; // Percentage
  idealStakingRate: number;
  inflationRate: number;
  averageValidatorReward: bigint;
  minNominatorBond: bigint;
  minValidatorBond: bigint;
  maxNominations: number;
  maxNominatorRewardedPerValidator: number;
  bondingDuration: number; // In eras
  slashDeferDuration: number; // In eras
}

export interface UnbondingInfo {
  amount: bigint;
  era: number;
  estimatedTime: number; // Timestamp when redeemable
}

export interface NominationPoolInfo {
  id: number;
  name?: string;
  state: "Open" | "Blocked" | "Destroying";
  memberCount: number;
  points: bigint;
  bonded: bigint;
  roles: {
    depositor: string;
    root?: string;
    nominator?: string;
    bouncer?: string;
  };
  commission?: {
    current: number;
    max?: number;
    changeRate?: {
      maxIncrease: number;
      minDelay: number;
    };
  };
  metadata?: string;
}

export interface PoolMemberInfo {
  poolId: number;
  points: bigint;
  bonded: bigint;
  claimableRewards: bigint;
  unbondingEras: Map<number, bigint>;
}

export interface RewardInfo {
  era: number;
  validator: string;
  amount: bigint;
  claimed: boolean;
  timestamp?: number;
}

// =============================================================================
// Staking Precompile ABI (for EVM staking)
// =============================================================================

// Selendra Staking Precompile at 0x0000000000000000000000000000000000000403
export const STAKING_PRECOMPILE_ADDRESS =
  "0x0000000000000000000000000000000000000403";

export const STAKING_PRECOMPILE_ABI = [
  // Read methods
  "function minNominatorBond() view returns (uint256)",
  "function minValidatorBond() view returns (uint256)",
  "function minActiveBond() view returns (uint256)",
  "function currentEra() view returns (uint256)",
  "function activeEra() view returns (uint256)",
  "function erasTotalStake(uint256 era) view returns (uint256)",
  "function erasValidatorReward(uint256 era) view returns (uint256)",
  "function bondedPool() view returns (uint256)",
  "function nominatorCount() view returns (uint256)",
  "function validatorCount() view returns (uint256)",
  "function isActiveValidator(bytes32 validatorId) view returns (bool)",
  "function stakingLedger(bytes32 stash) view returns (uint256 stash_balance, uint256 total, uint256 active, uint256[] unlocking)",

  // Write methods
  "function bond(uint256 value, uint8 payee) external",
  "function bondExtra(uint256 value) external",
  "function unbond(uint256 value) external",
  "function withdrawUnbonded(uint32 numSlashingSpans) external",
  "function validate(uint256 commission) external",
  "function nominate(bytes32[] validators) external",
  "function chill() external",
  "function setPayee(uint8 payee) external",
  "function setController() external",
  "function rebond(uint256 value) external",
  "function payoutStakers(bytes32 validatorStash, uint256 era) external",
];

// Payee enum for EVM precompile
export enum EvmPayee {
  Staked = 0,
  Stash = 1,
  Controller = 2,
  Account = 3,
  None = 4,
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format token amount from raw bigint to human-readable string
 */
export function formatStakingAmount(amount: bigint, decimals = 18): string {
  if (amount === BigInt(0)) return "0";

  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === BigInt(0)) {
    return whole.toLocaleString();
  }

  // Format with up to 4 decimal places
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const significantDecimals = remainderStr.slice(0, 4).replace(/0+$/, "");

  if (significantDecimals.length === 0) {
    return whole.toLocaleString();
  }

  return `${whole.toLocaleString()}.${significantDecimals}`;
}

/**
 * Parse human-readable amount to raw bigint
 */
export function parseStakingAmount(amount: string, decimals = 18): bigint {
  if (!amount || amount === "0") return BigInt(0);

  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);

  return (
    BigInt(whole || "0") * BigInt(10) ** BigInt(decimals) +
    BigInt(paddedFraction)
  );
}

/**
 * Calculate APY from era rewards
 */
export function calculateApy(
  totalStake: bigint,
  rewardPerEra: bigint,
  erasPerYear: number
): number {
  if (totalStake === BigInt(0)) return 0;

  const yearlyReward = rewardPerEra * BigInt(erasPerYear);
  const apyBps = (yearlyReward * BigInt(10000)) / totalStake;

  return Number(apyBps) / 100;
}

/**
 * Calculate estimated rewards
 */
export function estimateRewards(
  stakedAmount: bigint,
  validatorCommission: number,
  networkApy: number
): bigint {
  const apyAfterCommission = networkApy * (1 - validatorCommission / 100);
  const yearlyReward =
    (stakedAmount * BigInt(Math.floor(apyAfterCommission * 100))) /
    BigInt(10000);
  return yearlyReward;
}

/**
 * Calculate time remaining until unbonding completes
 */
export function calculateUnbondingTimeRemaining(
  currentEra: number,
  unbondingEra: number,
  bondingDuration: number,
  eraLengthMs: number
): number {
  const erasRemaining = unbondingEra + bondingDuration - currentEra;
  if (erasRemaining <= 0) return 0;
  return erasRemaining * eraLengthMs;
}

// =============================================================================
// Substrate Staking Client
// =============================================================================

export class SubstrateStakingClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(api: any) {
    this.api = api;
  }

  // ---------------------------------------------------------------------------
  // Read Operations
  // ---------------------------------------------------------------------------

  /**
   * Get current era information
   */
  async getEraInfo(): Promise<EraInfo> {
    if (!this.api) {
      return this.getMockEraInfo();
    }

    try {
      const [
        currentEra,
        activeEra,
        sessionIndex,
        sessionsPerEra,
        currentSlot,
        genesisSlot,
      ] = await Promise.all([
        this.api.query.staking.currentEra(),
        this.api.query.staking.activeEra(),
        this.api.query.session.currentIndex(),
        this.api.consts.staking.sessionsPerEra,
        this.api.query.babe?.currentSlot?.() || Promise.resolve(null),
        this.api.query.babe?.genesisSlot?.() || Promise.resolve(null),
      ]);

      const activeEraInfo = activeEra.unwrapOr(null);
      const currentEraIndex = currentEra.unwrapOr(0).toNumber();
      const activeEraIndex =
        activeEraInfo?.index?.toNumber() || currentEraIndex;

      // Calculate era progress
      const sessionsPerEraNum = sessionsPerEra.toNumber();
      const currentSession = sessionIndex.toNumber();
      const sessionInEra = currentSession % sessionsPerEraNum;
      const eraProgress = (sessionInEra / sessionsPerEraNum) * 100;

      // Estimate blocks - Selendra has ~1s blocks
      const blocksPerSession = 600; // ~10 minutes per session
      const eraLength = sessionsPerEraNum * blocksPerSession;
      const blocksRemaining = Math.floor(eraLength * (1 - eraProgress / 100));

      return {
        currentEra: currentEraIndex,
        activeEra: activeEraIndex,
        activeEraStart: activeEraInfo?.start?.toNumber(),
        sessionIndex: currentSession,
        sessionsPerEra: sessionsPerEraNum,
        eraProgress,
        eraLength,
        blocksRemaining,
        estimatedTimeRemaining: blocksRemaining * 1000, // 1s per block
      };
    } catch (error) {
      console.error("Failed to get era info:", error);
      return this.getMockEraInfo();
    }
  }

  private getMockEraInfo(): EraInfo {
    return {
      currentEra: 1234,
      activeEra: 1234,
      sessionIndex: 12340,
      sessionsPerEra: 6,
      eraProgress: 45,
      eraLength: 3600,
      blocksRemaining: 1980,
      estimatedTimeRemaining: 1980000,
    };
  }

  /**
   * Get staking statistics
   */
  async getStakingStats(): Promise<StakingStats> {
    if (!this.api) {
      return this.getMockStakingStats();
    }

    try {
      const [
        totalIssuance,
        erasTotalStake,
        minNominatorBond,
        minValidatorBond,
        maxNominations,
        maxNominatorRewardedPerValidator,
        bondingDuration,
        slashDeferDuration,
        currentEra,
      ] = await Promise.all([
        this.api.query.balances.totalIssuance(),
        this.api.query.staking.erasTotalStake.entries(),
        this.api.query.staking.minNominatorBond(),
        this.api.query.staking.minValidatorBond(),
        this.api.consts.staking.maxNominations ||
          Promise.resolve({ toNumber: () => 16 }),
        this.api.consts.staking.maxNominatorRewardedPerValidator ||
          Promise.resolve({ toNumber: () => 512 }),
        this.api.consts.staking.bondingDuration,
        this.api.consts.staking.slashDeferDuration,
        this.api.query.staking.currentEra(),
      ]);

      // Get current era's total stake
      const currentEraIndex = currentEra.unwrapOr(0).toNumber();
      let totalStaked = BigInt(0);

      for (const [key, value] of erasTotalStake) {
        const era = key.args[0].toNumber();
        if (era === currentEraIndex) {
          totalStaked = BigInt(value.toString());
          break;
        }
      }

      const total = BigInt(totalIssuance.toString());
      const stakingRate =
        total > BigInt(0)
          ? Number((totalStaked * BigInt(10000)) / total) / 100
          : 0;

      return {
        totalStaked,
        totalIssuance: total,
        stakingRate,
        idealStakingRate: 50, // Typical target
        inflationRate: 10, // Typical inflation
        averageValidatorReward: BigInt(0), // Calculated from era rewards
        minNominatorBond: BigInt(minNominatorBond.toString()),
        minValidatorBond: BigInt(minValidatorBond.toString()),
        maxNominations: maxNominations.toNumber(),
        maxNominatorRewardedPerValidator:
          maxNominatorRewardedPerValidator.toNumber(),
        bondingDuration: bondingDuration.toNumber(),
        slashDeferDuration: slashDeferDuration.toNumber(),
      };
    } catch (error) {
      console.error("Failed to get staking stats:", error);
      return this.getMockStakingStats();
    }
  }

  private getMockStakingStats(): StakingStats {
    return {
      totalStaked: parseStakingAmount("245000000"),
      totalIssuance: parseStakingAmount("1000000000"),
      stakingRate: 24.5,
      idealStakingRate: 50,
      inflationRate: 10,
      averageValidatorReward: parseStakingAmount("1000"),
      minNominatorBond: parseStakingAmount("1000"),
      minValidatorBond: parseStakingAmount("10000"),
      maxNominations: 16,
      maxNominatorRewardedPerValidator: 512,
      bondingDuration: 28,
      slashDeferDuration: 28,
    };
  }

  /**
   * Get list of validators
   */
  async getValidators(activeOnly = false): Promise<ValidatorInfo[]> {
    if (!this.api) {
      return this.getMockValidators();
    }

    try {
      // Get validator addresses
      const [validators, currentEra] = await Promise.all([
        activeOnly
          ? this.api.query.session.validators()
          : this.api.query.staking.validators.entries(),
        this.api.query.staking.currentEra(),
      ]);

      const eraIndex = currentEra.unwrapOr(0).toNumber();
      const validatorList: ValidatorInfo[] = [];

      const addresses = activeOnly
        ? validators.map((v: { toString: () => string }) => v.toString())
        : validators.map(([key]: [{ args: [{ toString: () => string }] }]) =>
            key.args[0].toString()
          );

      // Fetch details for each validator
      for (const address of addresses.slice(0, 50)) {
        // Limit for performance
        try {
          const info = await this.getValidatorInfo(address, eraIndex);
          if (info) {
            validatorList.push(info);
          }
        } catch {
          // Skip validators we can't fetch
        }
      }

      // Sort by total stake descending
      return validatorList.sort((a, b) => Number(b.totalStake - a.totalStake));
    } catch (error) {
      console.error("Failed to get validators:", error);
      return this.getMockValidators();
    }
  }

  /**
   * Get single validator info
   */
  async getValidatorInfo(
    address: string,
    era?: number
  ): Promise<ValidatorInfo | null> {
    if (!this.api) {
      return null;
    }

    try {
      const currentEra =
        era ||
        (await this.api.query.staking.currentEra()).unwrapOr(0).toNumber();

      const [prefs, exposure, slashingSpans, identity, ledger] =
        await Promise.all([
          this.api.query.staking.validators(address),
          this.api.query.staking.erasStakers(currentEra, address),
          this.api.query.staking.slashingSpans(address),
          this.api.query.identity?.identityOf?.(address) ||
            Promise.resolve(null),
          this.api.query.staking.ledger(address),
        ]);

      const commission = prefs.commission.toNumber() / 10000000; // Convert from Perbill
      const totalStake = BigInt(exposure.total?.toString() || "0");
      const ownStake = BigInt(exposure.own?.toString() || "0");
      const nominators = exposure.others?.length || 0;

      // Check if active in current session
      const activeValidators = await this.api.query.session.validators();
      const isActive = activeValidators.some(
        (v: { toString: () => string }) => v.toString() === address
      );

      // Parse identity
      let validatorIdentity: ValidatorIdentity | undefined;
      if (identity && !identity.isEmpty) {
        const info = identity.unwrap().info;
        validatorIdentity = {
          display: info.display?.asRaw?.toHuman?.() || info.display?.toString(),
          legal: info.legal?.asRaw?.toHuman?.(),
          web: info.web?.asRaw?.toHuman?.(),
          email: info.email?.asRaw?.toHuman?.(),
          twitter: info.twitter?.asRaw?.toHuman?.(),
          verified: identity.unwrap().judgements?.length > 0,
        };
      }

      return {
        address,
        commission,
        totalStake,
        ownStake,
        nominatorStake: totalStake - ownStake,
        nominators,
        isActive,
        isElected: isActive,
        isOversubscribed: nominators > 512,
        isBlocked: prefs.blocked?.valueOf() || false,
        isSlashed: slashingSpans && !slashingSpans.isEmpty,
        slashingSpans: slashingSpans?.unwrapOr(null)?.spanIndex?.toNumber(),
        apy: 12.5, // Calculate from era rewards
        eraPoints: 0,
        blocksProduced: 0,
        identity: validatorIdentity,
        preferences: {
          commission,
          blocked: prefs.blocked?.valueOf() || false,
        },
      };
    } catch (error) {
      console.error(`Failed to get validator info for ${address}:`, error);
      return null;
    }
  }

  private getMockValidators(): ValidatorInfo[] {
    return [
      {
        address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        commission: 5,
        totalStake: parseStakingAmount("15234567"),
        ownStake: parseStakingAmount("5000000"),
        nominatorStake: parseStakingAmount("10234567"),
        nominators: 245,
        nominatorCap: 512,
        isActive: true,
        isElected: true,
        isOversubscribed: false,
        isBlocked: false,
        isSlashed: false,
        apy: 14.2,
        eraPoints: 2450,
        blocksProduced: 156,
        identity: { display: "Selendra Foundation #1", verified: true },
      },
      {
        address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        commission: 3,
        totalStake: parseStakingAmount("12345678"),
        ownStake: parseStakingAmount("4500000"),
        nominatorStake: parseStakingAmount("7845678"),
        nominators: 198,
        isActive: true,
        isElected: true,
        isOversubscribed: false,
        isBlocked: false,
        isSlashed: false,
        apy: 13.8,
        eraPoints: 2380,
        blocksProduced: 142,
        identity: { display: "Selendra Foundation #2", verified: true },
      },
      {
        address: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        commission: 10,
        totalStake: parseStakingAmount("8765432"),
        ownStake: parseStakingAmount("2000000"),
        nominatorStake: parseStakingAmount("6765432"),
        nominators: 156,
        isActive: true,
        isElected: true,
        isOversubscribed: false,
        isBlocked: false,
        isSlashed: false,
        apy: 12.1,
        eraPoints: 2100,
        blocksProduced: 128,
        identity: { display: "Community Validator", verified: false },
      },
      {
        address: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
        commission: 8,
        totalStake: parseStakingAmount("6543210"),
        ownStake: parseStakingAmount("1500000"),
        nominatorStake: parseStakingAmount("5043210"),
        nominators: 87,
        isActive: true,
        isElected: true,
        isOversubscribed: false,
        isBlocked: false,
        isSlashed: false,
        apy: 11.5,
        eraPoints: 1950,
        blocksProduced: 115,
        identity: { display: "DeFi Stakers", verified: false },
      },
    ];
  }

  /**
   * Get user's staking info
   */
  async getStakingInfo(address: string): Promise<StakingInfo> {
    if (!this.api) {
      return this.getMockStakingInfo();
    }

    try {
      const [ledger, nominations, bonded, payee] = await Promise.all([
        this.api.query.staking.ledger(address),
        this.api.query.staking.nominators(address),
        this.api.query.staking.bonded(address),
        this.api.query.staking.payee(address),
      ]);

      let stakingInfo: StakingInfo = {
        bonded: BigInt(0),
        unbonding: BigInt(0),
        redeemable: BigInt(0),
        totalRewards: BigInt(0),
        claimableRewards: BigInt(0),
        nominations: [],
        nominationStatus: "none",
        rewardDestination: { type: "Staked" },
      };

      if (ledger && !ledger.isEmpty) {
        const ledgerData = ledger.unwrap();
        const active = BigInt(ledgerData.active.toString());
        const total = BigInt(ledgerData.total.toString());

        // Calculate unbonding
        let unbonding = BigInt(0);
        let redeemable = BigInt(0);
        const currentEra = (await this.api.query.staking.currentEra())
          .unwrapOr(0)
          .toNumber();

        for (const chunk of ledgerData.unlocking) {
          const amount = BigInt(chunk.value.toString());
          const era = chunk.era.toNumber();
          if (era <= currentEra) {
            redeemable += amount;
          } else {
            unbonding += amount;
          }
        }

        stakingInfo.bonded = active;
        stakingInfo.unbonding = unbonding;
        stakingInfo.redeemable = redeemable;
        stakingInfo.stashAccount = ledgerData.stash?.toString();
      }

      // Get nominations
      if (nominations && !nominations.isEmpty) {
        const nominationData = nominations.unwrap();
        stakingInfo.nominations = nominationData.targets.map(
          (t: { toString: () => string }) => t.toString()
        );
        stakingInfo.nominationStatus = nominationData.suppressed?.valueOf()
          ? "inactive"
          : "active";
      }

      // Get controller
      if (bonded && !bonded.isEmpty) {
        stakingInfo.controllerAccount = bonded.unwrap().toString();
      }

      // Parse payee
      if (payee && !payee.isEmpty) {
        const payeeType = payee.toString();
        if (payeeType === "Staked") {
          stakingInfo.rewardDestination = { type: "Staked" };
        } else if (payeeType === "Stash") {
          stakingInfo.rewardDestination = { type: "Stash" };
        } else if (payeeType === "Controller") {
          stakingInfo.rewardDestination = { type: "Controller" };
        } else if (payee.isAccount) {
          stakingInfo.rewardDestination = {
            type: "Account",
            address: payee.asAccount.toString(),
          };
        }
      }

      return stakingInfo;
    } catch (error) {
      console.error("Failed to get staking info:", error);
      return this.getMockStakingInfo();
    }
  }

  private getMockStakingInfo(): StakingInfo {
    return {
      bonded: BigInt(0),
      unbonding: BigInt(0),
      redeemable: BigInt(0),
      totalRewards: BigInt(0),
      claimableRewards: BigInt(0),
      nominations: [],
      nominationStatus: "none",
      rewardDestination: { type: "Staked" },
    };
  }

  /**
   * Get unbonding chunks
   */
  async getUnbondingInfo(address: string): Promise<UnbondingInfo[]> {
    if (!this.api) {
      return [];
    }

    try {
      const [ledger, currentEra] = await Promise.all([
        this.api.query.staking.ledger(address),
        this.api.query.staking.currentEra(),
      ]);

      if (!ledger || ledger.isEmpty) {
        return [];
      }

      const ledgerData = ledger.unwrap();
      const currentEraIndex = currentEra.unwrapOr(0).toNumber();
      const bondingDuration =
        this.api.consts.staking.bondingDuration.toNumber();
      const eraLengthMs = 3600000; // Approximate 1 hour per era

      return ledgerData.unlocking.map(
        (chunk: {
          value: { toString: () => string };
          era: { toNumber: () => number };
        }) => {
          const era = chunk.era.toNumber();
          const amount = BigInt(chunk.value.toString());
          const estimatedTime =
            Date.now() +
            calculateUnbondingTimeRemaining(
              currentEraIndex,
              era,
              bondingDuration,
              eraLengthMs
            );

          return {
            amount,
            era,
            estimatedTime,
          };
        }
      );
    } catch (error) {
      console.error("Failed to get unbonding info:", error);
      return [];
    }
  }

  /**
   * Get rewards history
   */
  async getRewardsHistory(address: string, eras = 10): Promise<RewardInfo[]> {
    if (!this.api) {
      return [];
    }

    try {
      const currentEra = (await this.api.query.staking.currentEra())
        .unwrapOr(0)
        .toNumber();
      const rewards: RewardInfo[] = [];

      // Check claimed rewards for recent eras
      for (let era = currentEra - eras; era < currentEra; era++) {
        if (era < 0) continue;

        try {
          const claimed = await this.api.query.staking.claimedRewards(
            era,
            address
          );

          // Get era reward points if available
          const eraRewardPoints = await this.api.query.staking.erasRewardPoints(
            era
          );
          const validatorPoints = eraRewardPoints.individual?.get(address);

          if (validatorPoints) {
            const totalReward =
              await this.api.query.staking.erasValidatorReward(era);
            const totalPoints = eraRewardPoints.total.toNumber();
            const points = validatorPoints.toNumber();

            if (totalPoints > 0 && totalReward && !totalReward.isEmpty) {
              const reward =
                (BigInt(totalReward.unwrap().toString()) * BigInt(points)) /
                BigInt(totalPoints);

              rewards.push({
                era,
                validator: address,
                amount: reward,
                claimed: claimed && !claimed.isEmpty,
              });
            }
          }
        } catch {
          // Skip this era
        }
      }

      return rewards.reverse(); // Most recent first
    } catch (error) {
      console.error("Failed to get rewards history:", error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Write Operations - Return unsigned transactions
  // ---------------------------------------------------------------------------

  /**
   * Create bond transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createBondTx(value: bigint, payee: RewardDestination): any {
    if (!this.api) return null;

    let payeeArg;
    switch (payee.type) {
      case "Staked":
        payeeArg = { Staked: null };
        break;
      case "Stash":
        payeeArg = { Stash: null };
        break;
      case "Controller":
        payeeArg = { Controller: null };
        break;
      case "Account":
        payeeArg = { Account: payee.address };
        break;
      case "None":
        payeeArg = { None: null };
        break;
    }

    return this.api.tx.staking.bond(value.toString(), payeeArg);
  }

  /**
   * Create bond extra transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createBondExtraTx(value: bigint): any {
    if (!this.api) return null;
    return this.api.tx.staking.bondExtra(value.toString());
  }

  /**
   * Create unbond transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUnbondTx(value: bigint): any {
    if (!this.api) return null;
    return this.api.tx.staking.unbond(value.toString());
  }

  /**
   * Create nominate transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createNominateTx(validators: string[]): any {
    if (!this.api) return null;
    return this.api.tx.staking.nominate(validators);
  }

  /**
   * Create withdraw unbonded transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createWithdrawUnbondedTx(numSlashingSpans = 0): any {
    if (!this.api) return null;
    return this.api.tx.staking.withdrawUnbonded(numSlashingSpans);
  }

  /**
   * Create rebond transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createRebondTx(value: bigint): any {
    if (!this.api) return null;
    return this.api.tx.staking.rebond(value.toString());
  }

  /**
   * Create chill transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createChillTx(): any {
    if (!this.api) return null;
    return this.api.tx.staking.chill();
  }

  /**
   * Create set payee transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSetPayeeTx(payee: RewardDestination): any {
    if (!this.api) return null;

    let payeeArg;
    switch (payee.type) {
      case "Staked":
        payeeArg = { Staked: null };
        break;
      case "Stash":
        payeeArg = { Stash: null };
        break;
      case "Controller":
        payeeArg = { Controller: null };
        break;
      case "Account":
        payeeArg = { Account: payee.address };
        break;
      case "None":
        payeeArg = { None: null };
        break;
    }

    return this.api.tx.staking.setPayee(payeeArg);
  }

  /**
   * Create payout stakers transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createPayoutStakersTx(validator: string, era: number): any {
    if (!this.api) return null;
    return this.api.tx.staking.payoutStakers(validator, era);
  }

  /**
   * Create batch payout transaction for multiple eras
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createBatchPayoutTx(validator: string, eras: number[]): any {
    if (!this.api) return null;

    const calls = eras.map((era) =>
      this.api.tx.staking.payoutStakers(validator, era)
    );

    return this.api.tx.utility.batchAll(calls);
  }

  // ---------------------------------------------------------------------------
  // Fee Estimation
  // ---------------------------------------------------------------------------

  /**
   * Estimate transaction fee
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async estimateFee(tx: any, sender: string): Promise<bigint> {
    if (!this.api || !tx) return BigInt(0);

    try {
      const info = await tx.paymentInfo(sender);
      return BigInt(info.partialFee.toString());
    } catch (error) {
      console.error("Failed to estimate fee:", error);
      return BigInt(0);
    }
  }
}

// =============================================================================
// EVM Staking Client (via Precompile)
// =============================================================================

export class EvmStakingClient {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.contract = new ethers.Contract(
      STAKING_PRECOMPILE_ADDRESS,
      STAKING_PRECOMPILE_ABI,
      provider
    );
  }

  setSigner(signer: ethers.Signer) {
    this.signer = signer;
    this.contract = new ethers.Contract(
      STAKING_PRECOMPILE_ADDRESS,
      STAKING_PRECOMPILE_ABI,
      signer
    );
  }

  // ---------------------------------------------------------------------------
  // Read Operations
  // ---------------------------------------------------------------------------

  async getMinNominatorBond(): Promise<bigint> {
    try {
      const result = await this.contract.minNominatorBond();
      return BigInt(result.toString());
    } catch (error) {
      console.error("Failed to get min nominator bond:", error);
      return parseStakingAmount("1000"); // Default
    }
  }

  async getCurrentEra(): Promise<number> {
    try {
      const result = await this.contract.currentEra();
      return Number(result);
    } catch (error) {
      console.error("Failed to get current era:", error);
      return 0;
    }
  }

  async getActiveEra(): Promise<number> {
    try {
      const result = await this.contract.activeEra();
      return Number(result);
    } catch (error) {
      console.error("Failed to get active era:", error);
      return 0;
    }
  }

  async isActiveValidator(validatorId: string): Promise<boolean> {
    try {
      return await this.contract.isActiveValidator(validatorId);
    } catch (error) {
      console.error("Failed to check validator status:", error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Write Operations
  // ---------------------------------------------------------------------------

  async bond(
    value: bigint,
    payee: EvmPayee
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.bond(value, payee);
  }

  async bondExtra(value: bigint): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.bondExtra(value);
  }

  async unbond(value: bigint): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.unbond(value);
  }

  async withdrawUnbonded(
    numSlashingSpans = 0
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.withdrawUnbonded(numSlashingSpans);
  }

  async nominate(validators: string[]): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    // Convert addresses to bytes32
    const validatorIds = validators.map((v) => ethers.zeroPadValue(v, 32));
    return await this.contract.nominate(validatorIds);
  }

  async chill(): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.chill();
  }

  async rebond(value: bigint): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.rebond(value);
  }

  async setPayee(payee: EvmPayee): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    return await this.contract.setPayee(payee);
  }

  async payoutStakers(
    validatorStash: string,
    era: number
  ): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error("Signer not set. Call setSigner first.");
    }
    const stashId = ethers.zeroPadValue(validatorStash, 32);
    return await this.contract.payoutStakers(stashId, era);
  }

  // ---------------------------------------------------------------------------
  // Fee Estimation
  // ---------------------------------------------------------------------------

  async estimateGas(method: string, ...args: unknown[]): Promise<bigint> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const estimate = await (this.contract as any)[method].estimateGas(
        ...args
      );
      return BigInt(estimate.toString());
    } catch (error) {
      console.error(`Failed to estimate gas for ${method}:`, error);
      return BigInt(100000); // Default gas limit
    }
  }
}

// =============================================================================
// Nomination Pools Client
// =============================================================================

export class NominationPoolsClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(api: any) {
    this.api = api;
  }

  /**
   * Get list of nomination pools
   */
  async getPools(limit = 50): Promise<NominationPoolInfo[]> {
    if (!this.api) {
      return this.getMockPools();
    }

    try {
      const poolMetadata =
        await this.api.query.nominationPools.metadata.entries();
      const pools: NominationPoolInfo[] = [];

      for (const [key, metadata] of poolMetadata.slice(0, limit)) {
        const poolId = key.args[0].toNumber();

        try {
          const [bondedPool, rewardPool] = await Promise.all([
            this.api.query.nominationPools.bondedPools(poolId),
            this.api.query.nominationPools.rewardPools(poolId),
          ]);

          if (bondedPool && !bondedPool.isEmpty) {
            const poolData = bondedPool.unwrap();

            pools.push({
              id: poolId,
              name: metadata.toHuman() as string,
              state: poolData.state.toString() as
                | "Open"
                | "Blocked"
                | "Destroying",
              memberCount: poolData.memberCounter?.toNumber() || 0,
              points: BigInt(poolData.points?.toString() || "0"),
              bonded: BigInt(0), // Get from bonded account
              roles: {
                depositor: poolData.roles.depositor.toString(),
                root: poolData.roles.root?.toString(),
                nominator: poolData.roles.nominator?.toString(),
                bouncer: poolData.roles.bouncer?.toString(),
              },
              metadata: metadata.toHuman() as string,
            });
          }
        } catch {
          // Skip this pool
        }
      }

      return pools;
    } catch (error) {
      console.error("Failed to get pools:", error);
      return this.getMockPools();
    }
  }

  private getMockPools(): NominationPoolInfo[] {
    return [
      {
        id: 1,
        name: "Selendra Community Pool",
        state: "Open",
        memberCount: 156,
        points: parseStakingAmount("5000000"),
        bonded: parseStakingAmount("5000000"),
        roles: {
          depositor: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          root: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          nominator: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        },
        commission: { current: 5 },
        metadata: "Official community staking pool",
      },
      {
        id: 2,
        name: "DeFi Stakers Pool",
        state: "Open",
        memberCount: 89,
        points: parseStakingAmount("2500000"),
        bonded: parseStakingAmount("2500000"),
        roles: {
          depositor: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        },
        commission: { current: 3 },
        metadata: "High-yield DeFi staking pool",
      },
    ];
  }

  /**
   * Get user's pool membership
   */
  async getMemberInfo(address: string): Promise<PoolMemberInfo | null> {
    if (!this.api) {
      return null;
    }

    try {
      const member = await this.api.query.nominationPools.poolMembers(address);

      if (!member || member.isEmpty) {
        return null;
      }

      const memberData = member.unwrap();

      const unbondingEras = new Map<number, bigint>();
      for (const [era, amount] of memberData.unbondingEras.entries()) {
        unbondingEras.set(era.toNumber(), BigInt(amount.toString()));
      }

      return {
        poolId: memberData.poolId.toNumber(),
        points: BigInt(memberData.points.toString()),
        bonded: BigInt(0), // Calculate from points
        claimableRewards: BigInt(0), // Get from reward pool
        unbondingEras,
      };
    } catch (error) {
      console.error("Failed to get pool member info:", error);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Write Operations
  // ---------------------------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createJoinPoolTx(amount: bigint, poolId: number): any {
    if (!this.api) return null;
    return this.api.tx.nominationPools.join(amount.toString(), poolId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createBondExtraPoolTx(extra: { FreeBalance: string } | "Rewards"): any {
    if (!this.api) return null;
    return this.api.tx.nominationPools.bondExtra(extra);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUnbondPoolTx(memberAccount: string, unbondingPoints: bigint): any {
    if (!this.api) return null;
    return this.api.tx.nominationPools.unbond(
      memberAccount,
      unbondingPoints.toString()
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createWithdrawUnbondedPoolTx(
    memberAccount: string,
    numSlashingSpans: number
  ): any {
    if (!this.api) return null;
    return this.api.tx.nominationPools.withdrawUnbonded(
      memberAccount,
      numSlashingSpans
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createClaimPayoutTx(): any {
    if (!this.api) return null;
    return this.api.tx.nominationPools.claimPayout();
  }
}

// =============================================================================
// Export factory functions
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSubstrateStakingClient(api: any): SubstrateStakingClient {
  return new SubstrateStakingClient(api);
}

export function createEvmStakingClient(
  provider: ethers.Provider
): EvmStakingClient {
  return new EvmStakingClient(provider);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createNominationPoolsClient(api: any): NominationPoolsClient {
  return new NominationPoolsClient(api);
}
