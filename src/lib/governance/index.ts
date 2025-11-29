/**
 * Selendra Governance Service (OpenGov)
 *
 * Provides comprehensive governance functionality including:
 * - Referenda (proposals, voting, tracks)
 * - Treasury (proposals, bounties, tips)
 * - Conviction voting and delegation
 *
 * Based on Polkadot OpenGov (Gov2) architecture.
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type ReferendumStatus =
  | "ongoing"
  | "approved"
  | "rejected"
  | "cancelled"
  | "timedOut"
  | "killed";

export type VoteType = "aye" | "nay" | "abstain" | "split";

export type ConvictionLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ConvictionInfo {
  level: ConvictionLevel;
  multiplier: number;
  lockPeriod: number; // In days
  description: string;
}

export const CONVICTION_OPTIONS: ConvictionInfo[] = [
  {
    level: 0,
    multiplier: 0.1,
    lockPeriod: 0,
    description: "0.1x voting power, no lock",
  },
  {
    level: 1,
    multiplier: 1,
    lockPeriod: 7,
    description: "1x voting power, 7 day lock",
  },
  {
    level: 2,
    multiplier: 2,
    lockPeriod: 14,
    description: "2x voting power, 14 day lock",
  },
  {
    level: 3,
    multiplier: 3,
    lockPeriod: 28,
    description: "3x voting power, 28 day lock",
  },
  {
    level: 4,
    multiplier: 4,
    lockPeriod: 56,
    description: "4x voting power, 56 day lock",
  },
  {
    level: 5,
    multiplier: 5,
    lockPeriod: 112,
    description: "5x voting power, 112 day lock",
  },
  {
    level: 6,
    multiplier: 6,
    lockPeriod: 224,
    description: "6x voting power, 224 day lock",
  },
];

export interface Vote {
  type: VoteType;
  balance: bigint;
  conviction: ConvictionLevel;
  votingPower: bigint;
  delegated?: boolean;
  delegator?: string;
}

export interface Referendum {
  index: number;
  trackId: number;
  trackName: string;
  proposer: string;
  status: ReferendumStatus;
  origin: string;
  proposal: ProposalInfo;

  // Tally
  ayes: bigint;
  nays: bigint;
  support: bigint;
  turnout: number;

  // Thresholds
  approvalThreshold: number;
  supportThreshold: number;
  approvalCurrent: number;
  supportCurrent: number;

  // Timeline
  submitted: number; // Block number
  submittedAt?: number; // Timestamp
  decisionDeposit?: bigint;
  decisionDepositPlaced?: boolean;
  preparingEnd?: number;
  decidingEnd?: number;
  confirmingEnd?: number;
  enactmentAfter?: number;

  // Metadata
  title?: string;
  description?: string;
  hash?: string;
}

export interface ProposalInfo {
  section: string;
  method: string;
  args: Record<string, unknown>;
  hash: string;
  encodedLength: number;
}

export interface Track {
  id: number;
  name: string;
  description: string;
  maxDeciding: number;
  decisionDeposit: bigint;
  preparePeriod: number;
  decisionPeriod: number;
  confirmPeriod: number;
  minEnactmentPeriod: number;
  minApproval: ThresholdCurve;
  minSupport: ThresholdCurve;
}

export interface ThresholdCurve {
  linearDecreasing?: {
    length: number;
    floor: number;
    ceil: number;
  };
  reciprocal?: {
    factor: number;
    xOffset: number;
    yOffset: number;
  };
}

export interface Delegation {
  target: string;
  conviction: ConvictionLevel;
  balance: bigint;
  trackId?: number; // Null for all tracks
}

export interface TreasuryInfo {
  balance: bigint;
  spendPeriod: number;
  burn: number; // Percentage
  nextBurn: bigint;
  approved: number;
  proposals: number;
  bounties: number;
  openBounties: number;
}

export interface TreasuryProposal {
  id: number;
  proposer: string;
  beneficiary: string;
  value: bigint;
  bond: bigint;
  status: "pending" | "approved" | "rejected";
  council?: {
    ayes: number;
    nays: number;
  };
}

export interface Bounty {
  id: number;
  proposer: string;
  value: bigint;
  fee: bigint;
  curatorDeposit: bigint;
  bond: bigint;
  status: BountyStatus;
  description?: string;
  curator?: string;
  updateDue?: number;
  beneficiary?: string;
}

export type BountyStatus =
  | "proposed"
  | "approved"
  | "funded"
  | "curatorProposed"
  | "active"
  | "pendingPayout"
  | "claimed"
  | "cancelled";

export interface Tip {
  hash: string;
  reason: string;
  who: string;
  finder: string;
  deposit: bigint;
  tips: Array<{
    tipper: string;
    value: bigint;
  }>;
  closes?: number;
  findersFee: boolean;
}

export interface GovernanceStats {
  activeReferenda: number;
  totalReferenda: number;
  totalVoters: number;
  treasuryBalance: bigint;
  totalDelegations: number;
  averageTurnout: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate voting power based on balance and conviction
 */
export function calculateVotingPower(
  balance: bigint,
  conviction: ConvictionLevel
): bigint {
  const convictionInfo = CONVICTION_OPTIONS[conviction];
  if (conviction === 0) {
    return balance / BigInt(10);
  }
  return balance * BigInt(convictionInfo.multiplier);
}

/**
 * Format balance for display
 */
export function formatGovernanceAmount(amount: bigint, decimals = 18): string {
  if (amount === BigInt(0)) return "0";

  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === BigInt(0)) {
    return whole.toLocaleString();
  }

  const remainderStr = remainder.toString().padStart(decimals, "0");
  const significantDecimals = remainderStr.slice(0, 4).replace(/0+$/, "");

  if (significantDecimals.length === 0) {
    return whole.toLocaleString();
  }

  return `${whole.toLocaleString()}.${significantDecimals}`;
}

/**
 * Parse amount string to bigint
 */
export function parseGovernanceAmount(amount: string, decimals = 18): bigint {
  if (!amount || amount === "0") return BigInt(0);

  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);

  return (
    BigInt(whole || "0") * BigInt(10) ** BigInt(decimals) +
    BigInt(paddedFraction)
  );
}

/**
 * Calculate threshold at a given percentage through the period
 */
export function calculateThreshold(
  curve: ThresholdCurve,
  progress: number
): number {
  if (curve.linearDecreasing) {
    const { length, floor, ceil } = curve.linearDecreasing;
    const normalized = Math.min(progress / length, 1);
    return ceil - (ceil - floor) * normalized;
  }

  if (curve.reciprocal) {
    const { factor, xOffset, yOffset } = curve.reciprocal;
    return factor / (progress + xOffset) + yOffset;
  }

  return 0.5; // Default 50%
}

/**
 * Get human-readable track name
 */
export function getTrackDisplayName(trackId: number): string {
  const trackNames: Record<number, string> = {
    0: "Root",
    1: "Whitelisted Caller",
    10: "Staking Admin",
    11: "Treasurer",
    12: "Lease Admin",
    13: "Fellowship Admin",
    14: "General Admin",
    15: "Auction Admin",
    20: "Referendum Canceller",
    21: "Referendum Killer",
    30: "Small Tipper",
    31: "Big Tipper",
    32: "Small Spender",
    33: "Medium Spender",
    34: "Big Spender",
  };

  return trackNames[trackId] || `Track ${trackId}`;
}

/**
 * Estimate time remaining for a period
 */
export function estimateTimeRemaining(
  blocksRemaining: number,
  blockTimeMs = 6000
): number {
  return blocksRemaining * blockTimeMs;
}

// =============================================================================
// Substrate Governance Client
// =============================================================================

export class SubstrateGovernanceClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private api: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(api: any) {
    this.api = api;
  }

  // ---------------------------------------------------------------------------
  // Referenda (OpenGov)
  // ---------------------------------------------------------------------------

  /**
   * Get all active referenda
   */
  async getReferenda(status?: ReferendumStatus): Promise<Referendum[]> {
    if (!this.api) {
      return this.getMockReferenda();
    }

    try {
      const entries =
        await this.api.query.referenda.referendumInfoFor.entries();
      const referenda: Referendum[] = [];

      for (const [key, value] of entries) {
        const index = key.args[0].toNumber();
        const info = value.unwrapOr(null);

        if (!info) continue;

        const referendum = await this.parseReferendumInfo(index, info);
        if (!status || referendum.status === status) {
          referenda.push(referendum);
        }
      }

      return referenda.sort((a, b) => b.index - a.index);
    } catch (error) {
      console.error("Failed to get referenda:", error);
      return this.getMockReferenda();
    }
  }

  /**
   * Get single referendum by index
   */
  async getReferendum(index: number): Promise<Referendum | null> {
    if (!this.api) {
      const mock = this.getMockReferenda().find((r) => r.index === index);
      return mock || null;
    }

    try {
      const info = await this.api.query.referenda.referendumInfoFor(index);
      if (info.isNone) return null;

      return this.parseReferendumInfo(index, info.unwrap());
    } catch (error) {
      console.error(`Failed to get referendum ${index}:`, error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async parseReferendumInfo(
    index: number,
    info: any
  ): Promise<Referendum> {
    let status: ReferendumStatus = "ongoing";
    let trackId = 0;
    let ayes = BigInt(0);
    let nays = BigInt(0);
    let support = BigInt(0);

    if (info.isOngoing) {
      const ongoing = info.asOngoing;
      status = "ongoing";
      trackId = ongoing.track?.toNumber() || 0;

      const tally = ongoing.tally;
      ayes = BigInt(tally?.ayes?.toString() || "0");
      nays = BigInt(tally?.nays?.toString() || "0");
      support = BigInt(tally?.support?.toString() || "0");
    } else if (info.isApproved) {
      status = "approved";
    } else if (info.isRejected) {
      status = "rejected";
    } else if (info.isCancelled) {
      status = "cancelled";
    } else if (info.isTimedOut) {
      status = "timedOut";
    } else if (info.isKilled) {
      status = "killed";
    }

    return {
      index,
      trackId,
      trackName: getTrackDisplayName(trackId),
      proposer: "", // Get from deposit info
      status,
      origin: "",
      proposal: {
        section: "",
        method: "",
        args: {},
        hash: "",
        encodedLength: 0,
      },
      ayes,
      nays,
      support,
      turnout: 0,
      approvalThreshold: 50,
      supportThreshold: 1,
      approvalCurrent:
        Number((ayes * BigInt(100)) / (ayes + nays || BigInt(1))) / 100,
      supportCurrent: 0,
      submitted: 0,
    };
  }

  private getMockReferenda(): Referendum[] {
    return [
      {
        index: 42,
        trackId: 33,
        trackName: "Medium Spender",
        proposer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        status: "ongoing",
        origin: "MediumSpender",
        proposal: {
          section: "treasury",
          method: "spend",
          args: { amount: "50000000000000000000000", beneficiary: "5FHneW..." },
          hash: "0x1234...",
          encodedLength: 128,
        },
        ayes: parseGovernanceAmount("1500000"),
        nays: parseGovernanceAmount("250000"),
        support: parseGovernanceAmount("1750000"),
        turnout: 12.5,
        approvalThreshold: 50,
        supportThreshold: 1,
        approvalCurrent: 85.7,
        supportCurrent: 3.5,
        submitted: 1234567,
        submittedAt: Date.now() - 86400000 * 3,
        decisionDeposit: parseGovernanceAmount("1000"),
        decisionDepositPlaced: true,
        decidingEnd: 1234567 + 100800,
        title: "Treasury Proposal: Developer Grant Program",
        description:
          "Proposal to fund a developer grant program for building on Selendra...",
      },
      {
        index: 41,
        trackId: 14,
        trackName: "General Admin",
        proposer: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        status: "ongoing",
        origin: "GeneralAdmin",
        proposal: {
          section: "system",
          method: "setCode",
          args: {},
          hash: "0x5678...",
          encodedLength: 5120000,
        },
        ayes: parseGovernanceAmount("2500000"),
        nays: parseGovernanceAmount("100000"),
        support: parseGovernanceAmount("2600000"),
        turnout: 18.2,
        approvalThreshold: 50,
        supportThreshold: 5,
        approvalCurrent: 96.2,
        supportCurrent: 5.2,
        submitted: 1234000,
        submittedAt: Date.now() - 86400000 * 7,
        decisionDeposit: parseGovernanceAmount("5000"),
        decisionDepositPlaced: true,
        decidingEnd: 1234000 + 201600,
        title: "Runtime Upgrade v1.2.0",
        description: "Upgrade runtime to version 1.2.0 with new features...",
      },
      {
        index: 40,
        trackId: 30,
        trackName: "Small Tipper",
        proposer: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        status: "approved",
        origin: "SmallTipper",
        proposal: {
          section: "treasury",
          method: "tip",
          args: {},
          hash: "0x9abc...",
          encodedLength: 64,
        },
        ayes: parseGovernanceAmount("500000"),
        nays: parseGovernanceAmount("50000"),
        support: parseGovernanceAmount("550000"),
        turnout: 8.5,
        approvalThreshold: 50,
        supportThreshold: 0.5,
        approvalCurrent: 90.9,
        supportCurrent: 1.1,
        submitted: 1233000,
        submittedAt: Date.now() - 86400000 * 14,
        title: "Tip: Community Documentation Contributor",
        description: "Tip for excellent documentation contributions...",
      },
    ];
  }

  /**
   * Get all governance tracks
   */
  async getTracks(): Promise<Track[]> {
    if (!this.api) {
      return this.getMockTracks();
    }

    try {
      const tracks: Track[] = [];

      // Get track info from constants or storage
      const trackInfo = this.api.consts.referenda?.tracks;

      if (trackInfo) {
        for (const [id, info] of trackInfo) {
          tracks.push({
            id: id.toNumber(),
            name: getTrackDisplayName(id.toNumber()),
            description: info.name?.toString() || "",
            maxDeciding: info.maxDeciding?.toNumber() || 10,
            decisionDeposit: BigInt(info.decisionDeposit?.toString() || "0"),
            preparePeriod: info.preparePeriod?.toNumber() || 1200,
            decisionPeriod: info.decisionPeriod?.toNumber() || 100800,
            confirmPeriod: info.confirmPeriod?.toNumber() || 14400,
            minEnactmentPeriod: info.minEnactmentPeriod?.toNumber() || 14400,
            minApproval: info.minApproval?.toJSON() || {},
            minSupport: info.minSupport?.toJSON() || {},
          });
        }
      }

      return tracks.length > 0 ? tracks : this.getMockTracks();
    } catch (error) {
      console.error("Failed to get tracks:", error);
      return this.getMockTracks();
    }
  }

  private getMockTracks(): Track[] {
    return [
      {
        id: 0,
        name: "Root",
        description: "Root origin for critical operations",
        maxDeciding: 1,
        decisionDeposit: parseGovernanceAmount("100000"),
        preparePeriod: 1200,
        decisionPeriod: 403200,
        confirmPeriod: 14400,
        minEnactmentPeriod: 14400,
        minApproval: {
          linearDecreasing: { length: 403200, floor: 0.5, ceil: 1 },
        },
        minSupport: {
          linearDecreasing: { length: 403200, floor: 0, ceil: 0.5 },
        },
      },
      {
        id: 14,
        name: "General Admin",
        description: "General administrative operations",
        maxDeciding: 10,
        decisionDeposit: parseGovernanceAmount("5000"),
        preparePeriod: 1200,
        decisionPeriod: 201600,
        confirmPeriod: 14400,
        minEnactmentPeriod: 14400,
        minApproval: {
          linearDecreasing: { length: 201600, floor: 0.5, ceil: 0.9 },
        },
        minSupport: {
          linearDecreasing: { length: 201600, floor: 0, ceil: 0.1 },
        },
      },
      {
        id: 33,
        name: "Medium Spender",
        description: "Medium treasury spending",
        maxDeciding: 50,
        decisionDeposit: parseGovernanceAmount("1000"),
        preparePeriod: 1200,
        decisionPeriod: 100800,
        confirmPeriod: 7200,
        minEnactmentPeriod: 14400,
        minApproval: {
          linearDecreasing: { length: 100800, floor: 0.5, ceil: 0.8 },
        },
        minSupport: {
          linearDecreasing: { length: 100800, floor: 0, ceil: 0.05 },
        },
      },
    ];
  }

  /**
   * Get user's voting info for a referendum
   */
  async getUserVote(
    address: string,
    referendumIndex: number
  ): Promise<Vote | null> {
    if (!this.api) return null;

    try {
      const voting = await this.api.query.convictionVoting.votingFor(
        address,
        referendumIndex
      );

      if (voting.isCasting) {
        const casting = voting.asCasting;
        for (const [idx, vote] of casting.votes) {
          if (idx.toNumber() === referendumIndex) {
            if (vote.isStandard) {
              const standard = vote.asStandard;
              return {
                type: standard.vote.isAye ? "aye" : "nay",
                balance: BigInt(standard.balance.toString()),
                conviction:
                  standard.vote.conviction.toNumber() as ConvictionLevel,
                votingPower: calculateVotingPower(
                  BigInt(standard.balance.toString()),
                  standard.vote.conviction.toNumber() as ConvictionLevel
                ),
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get user vote:", error);
      return null;
    }
  }

  /**
   * Get user's delegations
   */
  async getUserDelegations(address: string): Promise<Delegation[]> {
    if (!this.api) return [];

    try {
      const delegations: Delegation[] = [];
      const tracks = await this.getTracks();

      for (const track of tracks) {
        const voting = await this.api.query.convictionVoting.votingFor(
          address,
          track.id
        );

        if (voting.isDelegating) {
          const delegating = voting.asDelegating;
          delegations.push({
            target: delegating.target.toString(),
            conviction: delegating.conviction.toNumber() as ConvictionLevel,
            balance: BigInt(delegating.balance.toString()),
            trackId: track.id,
          });
        }
      }

      return delegations;
    } catch (error) {
      console.error("Failed to get delegations:", error);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Treasury
  // ---------------------------------------------------------------------------

  /**
   * Get treasury info
   */
  async getTreasuryInfo(): Promise<TreasuryInfo> {
    if (!this.api) {
      return this.getMockTreasuryInfo();
    }

    try {
      const [treasuryAccount, proposalCount, approvals, bountyCount] =
        await Promise.all([
          this.api.query.system.account(
            this.api.consts.treasury?.palletId?.toString() ||
              "5EYCAe5ijiYfyeZ2JJCGq56LmPyNRAKzpG4QkoQkkQNB5e6Z"
          ),
          this.api.query.treasury.proposalCount(),
          this.api.query.treasury.approvals(),
          this.api.query.bounties?.bountyCount?.() ||
            Promise.resolve({ toNumber: () => 0 }),
        ]);

      const balance = BigInt(treasuryAccount.data.free.toString());
      const spendPeriod =
        this.api.consts.treasury.spendPeriod?.toNumber() || 100800;
      const burn = this.api.consts.treasury.burn?.toNumber() || 0;

      return {
        balance,
        spendPeriod,
        burn,
        nextBurn: (balance * BigInt(burn)) / BigInt(1000000),
        approved: approvals.length,
        proposals: proposalCount.toNumber(),
        bounties: bountyCount.toNumber(),
        openBounties: 0, // Would need to count from entries
      };
    } catch (error) {
      console.error("Failed to get treasury info:", error);
      return this.getMockTreasuryInfo();
    }
  }

  private getMockTreasuryInfo(): TreasuryInfo {
    return {
      balance: parseGovernanceAmount("15000000"),
      spendPeriod: 100800, // ~7 days at 6s blocks
      burn: 1000, // 0.1%
      nextBurn: parseGovernanceAmount("15000"),
      approved: 3,
      proposals: 12,
      bounties: 5,
      openBounties: 2,
    };
  }

  /**
   * Get treasury proposals
   */
  async getTreasuryProposals(): Promise<TreasuryProposal[]> {
    if (!this.api) {
      return this.getMockTreasuryProposals();
    }

    try {
      const entries = await this.api.query.treasury.proposals.entries();
      const proposals: TreasuryProposal[] = [];

      for (const [key, value] of entries) {
        const id = key.args[0].toNumber();
        const proposal = value.unwrap();

        proposals.push({
          id,
          proposer: proposal.proposer.toString(),
          beneficiary: proposal.beneficiary.toString(),
          value: BigInt(proposal.value.toString()),
          bond: BigInt(proposal.bond.toString()),
          status: "pending",
        });
      }

      return proposals;
    } catch (error) {
      console.error("Failed to get treasury proposals:", error);
      return this.getMockTreasuryProposals();
    }
  }

  private getMockTreasuryProposals(): TreasuryProposal[] {
    return [
      {
        id: 1,
        proposer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        beneficiary: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
        value: parseGovernanceAmount("50000"),
        bond: parseGovernanceAmount("2500"),
        status: "pending",
      },
      {
        id: 2,
        proposer: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        beneficiary: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
        value: parseGovernanceAmount("25000"),
        bond: parseGovernanceAmount("1250"),
        status: "approved",
      },
    ];
  }

  /**
   * Get bounties
   */
  async getBounties(): Promise<Bounty[]> {
    if (!this.api || !this.api.query.bounties) {
      return this.getMockBounties();
    }

    try {
      const entries = await this.api.query.bounties.bounties.entries();
      const bounties: Bounty[] = [];

      for (const [key, value] of entries) {
        const id = key.args[0].toNumber();
        const bounty = value.unwrapOr(null);
        if (!bounty) continue;

        let status: BountyStatus = "proposed";
        if (bounty.status.isApproved) status = "approved";
        else if (bounty.status.isFunded) status = "funded";
        else if (bounty.status.isCuratorProposed) status = "curatorProposed";
        else if (bounty.status.isActive) status = "active";
        else if (bounty.status.isPendingPayout) status = "pendingPayout";

        const description = await this.api.query.bounties.bountyDescriptions(
          id
        );

        bounties.push({
          id,
          proposer: bounty.proposer.toString(),
          value: BigInt(bounty.value.toString()),
          fee: BigInt(bounty.fee.toString()),
          curatorDeposit: BigInt(bounty.curatorDeposit.toString()),
          bond: BigInt(bounty.bond.toString()),
          status,
          description: description.toHuman() as string,
          curator: bounty.status.isActive
            ? bounty.status.asActive.curator.toString()
            : undefined,
        });
      }

      return bounties;
    } catch (error) {
      console.error("Failed to get bounties:", error);
      return this.getMockBounties();
    }
  }

  private getMockBounties(): Bounty[] {
    return [
      {
        id: 1,
        proposer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        value: parseGovernanceAmount("10000"),
        fee: parseGovernanceAmount("500"),
        curatorDeposit: parseGovernanceAmount("250"),
        bond: parseGovernanceAmount("500"),
        status: "active",
        description: "Build cross-chain bridge to Ethereum",
        curator: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      },
      {
        id: 2,
        proposer: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        value: parseGovernanceAmount("5000"),
        fee: parseGovernanceAmount("250"),
        curatorDeposit: parseGovernanceAmount("125"),
        bond: parseGovernanceAmount("250"),
        status: "funded",
        description: "Create comprehensive SDK documentation",
      },
    ];
  }

  /**
   * Get tips
   */
  async getTips(): Promise<Tip[]> {
    if (!this.api || !this.api.query.tips) {
      return this.getMockTips();
    }

    try {
      const entries = await this.api.query.tips.tips.entries();
      const tips: Tip[] = [];

      for (const [key, value] of entries) {
        const hash = key.args[0].toString();
        const tip = value.unwrapOr(null);
        if (!tip) continue;

        tips.push({
          hash,
          reason: tip.reason.toHuman() as string,
          who: tip.who.toString(),
          finder: tip.finder.toString(),
          deposit: BigInt(tip.deposit.toString()),
          tips: tip.tips.map(
            (t: [{ toString: () => string }, { toString: () => string }]) => ({
              tipper: t[0].toString(),
              value: BigInt(t[1].toString()),
            })
          ),
          closes: tip.closes?.toNumber(),
          findersFee: tip.findersFee?.valueOf() || true,
        });
      }

      return tips;
    } catch (error) {
      console.error("Failed to get tips:", error);
      return this.getMockTips();
    }
  }

  private getMockTips(): Tip[] {
    return [
      {
        hash: "0x1234567890abcdef...",
        reason: "Excellent community support and user guides",
        who: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
        finder: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        deposit: parseGovernanceAmount("1"),
        tips: [
          {
            tipper: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
            value: parseGovernanceAmount("100"),
          },
          {
            tipper: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
            value: parseGovernanceAmount("150"),
          },
        ],
        findersFee: true,
      },
    ];
  }

  // ---------------------------------------------------------------------------
  // Governance Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get governance statistics
   */
  async getGovernanceStats(): Promise<GovernanceStats> {
    if (!this.api) {
      return {
        activeReferenda: 2,
        totalReferenda: 42,
        totalVoters: 1250,
        treasuryBalance: parseGovernanceAmount("15000000"),
        totalDelegations: 350,
        averageTurnout: 15.5,
      };
    }

    try {
      const [referenda, treasury] = await Promise.all([
        this.getReferenda(),
        this.getTreasuryInfo(),
      ]);

      const activeReferenda = referenda.filter(
        (r) => r.status === "ongoing"
      ).length;

      return {
        activeReferenda,
        totalReferenda: referenda.length,
        totalVoters: 0, // Would need to aggregate from votes
        treasuryBalance: treasury.balance,
        totalDelegations: 0, // Would need to aggregate
        averageTurnout:
          referenda.reduce((sum, r) => sum + r.turnout, 0) / referenda.length ||
          0,
      };
    } catch (error) {
      console.error("Failed to get governance stats:", error);
      return {
        activeReferenda: 0,
        totalReferenda: 0,
        totalVoters: 0,
        treasuryBalance: BigInt(0),
        totalDelegations: 0,
        averageTurnout: 0,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Write Operations - Return unsigned transactions
  // ---------------------------------------------------------------------------

  /**
   * Create vote transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createVoteTx(
    referendumIndex: number,
    vote: { aye: boolean; conviction: ConvictionLevel },
    balance: bigint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (!this.api) return null;

    const voteValue = {
      Standard: {
        vote: {
          aye: vote.aye,
          conviction: `Locked${vote.conviction}x`,
        },
        balance: balance.toString(),
      },
    };

    return this.api.tx.convictionVoting.vote(referendumIndex, voteValue);
  }

  /**
   * Create remove vote transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createRemoveVoteTx(trackId: number, referendumIndex: number): any {
    if (!this.api) return null;
    return this.api.tx.convictionVoting.removeVote(trackId, referendumIndex);
  }

  /**
   * Create delegate transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createDelegateTx(
    trackId: number,
    target: string,
    conviction: ConvictionLevel,
    balance: bigint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (!this.api) return null;
    return this.api.tx.convictionVoting.delegate(
      trackId,
      target,
      `Locked${conviction}x`,
      balance.toString()
    );
  }

  /**
   * Create undelegate transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUndelegateTx(trackId: number): any {
    if (!this.api) return null;
    return this.api.tx.convictionVoting.undelegate(trackId);
  }

  /**
   * Create unlock transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createUnlockTx(trackId: number, target: string): any {
    if (!this.api) return null;
    return this.api.tx.convictionVoting.unlock(trackId, target);
  }

  /**
   * Create submit proposal transaction (via preimage)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSubmitTx(
    trackId: number,
    proposalHash: string,
    enactmentMoment: { after: number } | { at: number }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (!this.api) return null;

    const enactment =
      "after" in enactmentMoment
        ? { After: enactmentMoment.after }
        : { At: enactmentMoment.at };

    return this.api.tx.referenda.submit(
      { Origins: getTrackDisplayName(trackId) },
      { Lookup: { hash: proposalHash, len: 0 } },
      enactment
    );
  }

  /**
   * Create place decision deposit transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createPlaceDecisionDepositTx(referendumIndex: number): any {
    if (!this.api) return null;
    return this.api.tx.referenda.placeDecisionDeposit(referendumIndex);
  }

  /**
   * Create treasury spend proposal via referendum
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTreasurySpendTx(beneficiary: string, amount: bigint): any {
    if (!this.api) return null;
    return this.api.tx.treasury.spend(amount.toString(), beneficiary);
  }

  /**
   * Create tip transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTipTx(hash: string, tipValue: bigint): any {
    if (!this.api) return null;
    return this.api.tx.tips.tip(hash, tipValue.toString());
  }

  /**
   * Create report awesome (tip proposal) transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createReportAwesomeTx(reason: string, who: string): any {
    if (!this.api) return null;
    return this.api.tx.tips.reportAwesome(reason, who);
  }

  /**
   * Create bounty proposal transaction
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createProposeBountyTx(value: bigint, description: string): any {
    if (!this.api || !this.api.tx.bounties) return null;
    return this.api.tx.bounties.proposeBounty(value.toString(), description);
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
// Factory Function
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createGovernanceClient(api: any): SubstrateGovernanceClient {
  return new SubstrateGovernanceClient(api);
}
