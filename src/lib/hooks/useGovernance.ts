/**
 * Governance React Hooks
 *
 * Provides React hooks for governance operations including:
 * - Referenda queries and voting
 * - Treasury data
 * - Delegation management
 * - Bounties and tips
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import {
  createGovernanceClient,
  SubstrateGovernanceClient,
  Referendum,
  ReferendumStatus,
  Track,
  Vote,
  Delegation,
  TreasuryInfo,
  TreasuryProposal,
  Bounty,
  Tip,
  GovernanceStats,
  ConvictionLevel,
  CONVICTION_OPTIONS,
  ConvictionInfo,
  calculateVotingPower,
  formatGovernanceAmount,
  parseGovernanceAmount,
} from "@/lib/governance";

// =============================================================================
// Governance Client Hook
// =============================================================================

/**
 * Get the governance client instance
 */
export function useGovernanceClient(): SubstrateGovernanceClient | null {
  const { substrateSDK } = useBlockchain();

  return useMemo(() => {
    if (!substrateSDK) return null;

    // Get API from SDK - this may vary depending on SDK implementation
    const api = (substrateSDK as { api?: unknown }).api;
    return createGovernanceClient(api);
  }, [substrateSDK]);
}

// =============================================================================
// Referenda Hooks
// =============================================================================

export interface UseReferendaResult {
  referenda: Referendum[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get all referenda with optional status filter
 */
export function useReferenda(status?: ReferendumStatus): UseReferendaResult {
  const client = useGovernanceClient();
  const [referenda, setReferenda] = useState<Referendum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferenda = useCallback(async () => {
    if (!client) {
      setReferenda([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getReferenda(status);
      setReferenda(data);
    } catch (err) {
      console.error("Failed to fetch referenda:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch referenda"
      );
    } finally {
      setLoading(false);
    }
  }, [client, status]);

  useEffect(() => {
    fetchReferenda();
  }, [fetchReferenda]);

  return {
    referenda,
    loading,
    error,
    refresh: fetchReferenda,
  };
}

export interface UseReferendumResult {
  referendum: Referendum | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get a single referendum by index
 */
export function useReferendum(index: number | null): UseReferendumResult {
  const client = useGovernanceClient();
  const [referendum, setReferendum] = useState<Referendum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReferendum = useCallback(async () => {
    if (!client || index === null) {
      setReferendum(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getReferendum(index);
      setReferendum(data);
    } catch (err) {
      console.error(`Failed to fetch referendum ${index}:`, err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch referendum"
      );
    } finally {
      setLoading(false);
    }
  }, [client, index]);

  useEffect(() => {
    fetchReferendum();
  }, [fetchReferendum]);

  return {
    referendum,
    loading,
    error,
    refresh: fetchReferendum,
  };
}

// =============================================================================
// Tracks Hook
// =============================================================================

export interface UseTracksResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  getTrack: (id: number) => Track | undefined;
}

/**
 * Get all governance tracks
 */
export function useTracks(): UseTracksResult {
  const client = useGovernanceClient();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      if (!client) {
        setTracks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await client.getTracks();
        setTracks(data);
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch tracks");
      } finally {
        setLoading(false);
      }
    }

    fetchTracks();
  }, [client]);

  const getTrack = useCallback(
    (id: number) => tracks.find((t) => t.id === id),
    [tracks]
  );

  return {
    tracks,
    loading,
    error,
    getTrack,
  };
}

// =============================================================================
// User Vote Hook
// =============================================================================

export interface UseUserVoteResult {
  vote: Vote | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get user's vote for a specific referendum
 */
export function useUserVote(referendumIndex: number | null): UseUserVoteResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount } = useWallet();
  const [vote, setVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVote = useCallback(async () => {
    if (!client || !selectedSubstrateAccount || referendumIndex === null) {
      setVote(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getUserVote(
        selectedSubstrateAccount.address,
        referendumIndex
      );
      setVote(data);
    } catch (err) {
      console.error("Failed to fetch user vote:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vote");
    } finally {
      setLoading(false);
    }
  }, [client, selectedSubstrateAccount, referendumIndex]);

  useEffect(() => {
    fetchVote();
  }, [fetchVote]);

  return {
    vote,
    loading,
    error,
    refresh: fetchVote,
  };
}

// =============================================================================
// Delegation Hook
// =============================================================================

export interface UseDelegationsResult {
  delegations: Delegation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get user's delegations
 */
export function useDelegations(): UseDelegationsResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount } = useWallet();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelegations = useCallback(async () => {
    if (!client || !selectedSubstrateAccount) {
      setDelegations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getUserDelegations(
        selectedSubstrateAccount.address
      );
      setDelegations(data);
    } catch (err) {
      console.error("Failed to fetch delegations:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch delegations"
      );
    } finally {
      setLoading(false);
    }
  }, [client, selectedSubstrateAccount]);

  useEffect(() => {
    fetchDelegations();
  }, [fetchDelegations]);

  return {
    delegations,
    loading,
    error,
    refresh: fetchDelegations,
  };
}

// =============================================================================
// Treasury Hooks
// =============================================================================

export interface UseTreasuryResult {
  info: TreasuryInfo | null;
  proposals: TreasuryProposal[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get treasury info and proposals
 */
export function useTreasury(): UseTreasuryResult {
  const client = useGovernanceClient();
  const [info, setInfo] = useState<TreasuryInfo | null>(null);
  const [proposals, setProposals] = useState<TreasuryProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasury = useCallback(async () => {
    if (!client) {
      setInfo(null);
      setProposals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [treasuryInfo, treasuryProposals] = await Promise.all([
        client.getTreasuryInfo(),
        client.getTreasuryProposals(),
      ]);
      setInfo(treasuryInfo);
      setProposals(treasuryProposals);
    } catch (err) {
      console.error("Failed to fetch treasury:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch treasury");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTreasury();
  }, [fetchTreasury]);

  return {
    info,
    proposals,
    loading,
    error,
    refresh: fetchTreasury,
  };
}

// =============================================================================
// Bounties Hook
// =============================================================================

export interface UseBountiesResult {
  bounties: Bounty[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get all bounties
 */
export function useBounties(): UseBountiesResult {
  const client = useGovernanceClient();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBounties = useCallback(async () => {
    if (!client) {
      setBounties([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getBounties();
      setBounties(data);
    } catch (err) {
      console.error("Failed to fetch bounties:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bounties");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  return {
    bounties,
    loading,
    error,
    refresh: fetchBounties,
  };
}

// =============================================================================
// Tips Hook
// =============================================================================

export interface UseTipsResult {
  tips: Tip[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get all tips
 */
export function useTips(): UseTipsResult {
  const client = useGovernanceClient();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = useCallback(async () => {
    if (!client) {
      setTips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getTips();
      setTips(data);
    } catch (err) {
      console.error("Failed to fetch tips:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tips");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  return {
    tips,
    loading,
    error,
    refresh: fetchTips,
  };
}

// =============================================================================
// Governance Stats Hook
// =============================================================================

export interface UseGovernanceStatsResult {
  stats: GovernanceStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Get governance statistics
 */
export function useGovernanceStats(): UseGovernanceStatsResult {
  const client = useGovernanceClient();
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!client) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await client.getGovernanceStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch governance stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}

// =============================================================================
// Voting Actions Hook
// =============================================================================

export interface UseVotingActionsResult {
  vote: (
    referendumIndex: number,
    aye: boolean,
    conviction: ConvictionLevel,
    balance: bigint
  ) => Promise<string>;
  removeVote: (trackId: number, referendumIndex: number) => Promise<string>;
  delegate: (
    trackId: number,
    target: string,
    conviction: ConvictionLevel,
    balance: bigint
  ) => Promise<string>;
  undelegate: (trackId: number) => Promise<string>;
  unlock: (trackId: number, target?: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Voting action hooks
 */
export function useVotingActions(): UseVotingActionsResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vote = useCallback(
    async (
      referendumIndex: number,
      aye: boolean,
      conviction: ConvictionLevel,
      balance: bigint
    ): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createVoteTx(
          referendumIndex,
          { aye, conviction },
          balance
        );
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Vote failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const removeVote = useCallback(
    async (trackId: number, referendumIndex: number): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createRemoveVoteTx(trackId, referendumIndex);
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Remove vote failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const delegate = useCallback(
    async (
      trackId: number,
      target: string,
      conviction: ConvictionLevel,
      balance: bigint
    ): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createDelegateTx(
          trackId,
          target,
          conviction,
          balance
        );
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Delegation failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const undelegate = useCallback(
    async (trackId: number): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createUndelegateTx(trackId);
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Undelegation failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const unlock = useCallback(
    async (trackId: number, target?: string): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createUnlockTx(
          trackId,
          target || selectedSubstrateAccount.address
        );
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unlock failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  return {
    vote,
    removeVote,
    delegate,
    undelegate,
    unlock,
    loading,
    error,
  };
}

// =============================================================================
// Proposal Actions Hook
// =============================================================================

export interface UseProposalActionsResult {
  submitProposal: (
    trackId: number,
    proposalHash: string,
    enactmentMoment: { after: number } | { at: number }
  ) => Promise<string>;
  placeDecisionDeposit: (referendumIndex: number) => Promise<string>;
  proposeTreasurySpend: (
    beneficiary: string,
    amount: bigint
  ) => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Proposal action hooks
 */
export function useProposalActions(): UseProposalActionsResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitProposal = useCallback(
    async (
      trackId: number,
      proposalHash: string,
      enactmentMoment: { after: number } | { at: number }
    ): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createSubmitTx(
          trackId,
          proposalHash,
          enactmentMoment
        );
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Proposal submission failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const placeDecisionDeposit = useCallback(
    async (referendumIndex: number): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createPlaceDecisionDepositTx(referendumIndex);
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Decision deposit failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const proposeTreasurySpend = useCallback(
    async (beneficiary: string, amount: bigint): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createTreasurySpendTx(beneficiary, amount);
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Treasury spend proposal failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  return {
    submitProposal,
    placeDecisionDeposit,
    proposeTreasurySpend,
    loading,
    error,
  };
}

// =============================================================================
// Tip Actions Hook
// =============================================================================

export interface UseTipActionsResult {
  tip: (hash: string, value: bigint) => Promise<string>;
  reportAwesome: (reason: string, who: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Tip action hooks
 */
export function useTipActions(): UseTipActionsResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tip = useCallback(
    async (hash: string, value: bigint): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createTipTx(hash, value);
        if (!tx) throw new Error("Failed to create transaction");

        const txHash = await signAndSubmitExtrinsic(tx);
        return txHash;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Tip failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  const reportAwesome = useCallback(
    async (reason: string, who: string): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createReportAwesomeTx(reason, who);
        if (!tx) throw new Error("Failed to create transaction");

        const txHash = await signAndSubmitExtrinsic(tx);
        return txHash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Report awesome failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  return {
    tip,
    reportAwesome,
    loading,
    error,
  };
}

// =============================================================================
// Bounty Actions Hook
// =============================================================================

export interface UseBountyActionsResult {
  proposeBounty: (value: bigint, description: string) => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Bounty action hooks
 */
export function useBountyActions(): UseBountyActionsResult {
  const client = useGovernanceClient();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proposeBounty = useCallback(
    async (value: bigint, description: string): Promise<string> => {
      if (!client || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const tx = client.createProposeBountyTx(value, description);
        if (!tx) throw new Error("Failed to create transaction");

        const hash = await signAndSubmitExtrinsic(tx);
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bounty proposal failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, selectedSubstrateAccount, signAndSubmitExtrinsic]
  );

  return {
    proposeBounty,
    loading,
    error,
  };
}

// =============================================================================
// Conviction Calculator Hook
// =============================================================================

export interface UseConvictionCalculatorResult {
  convictionOptions: ConvictionInfo[];
  calculatePower: (balance: bigint, conviction: ConvictionLevel) => bigint;
  formatAmount: (amount: bigint) => string;
  parseAmount: (amount: string) => bigint;
}

/**
 * Conviction voting calculator utilities
 */
export function useConvictionCalculator(): UseConvictionCalculatorResult {
  return useMemo(
    () => ({
      convictionOptions: CONVICTION_OPTIONS,
      calculatePower: calculateVotingPower,
      formatAmount: formatGovernanceAmount,
      parseAmount: parseGovernanceAmount,
    }),
    []
  );
}

// =============================================================================
// Export All
// =============================================================================

export {
  type Referendum,
  type ReferendumStatus,
  type Track,
  type Vote,
  type Delegation,
  type TreasuryInfo,
  type TreasuryProposal,
  type Bounty,
  type Tip,
  type GovernanceStats,
  type ConvictionLevel,
  type ConvictionInfo,
};
