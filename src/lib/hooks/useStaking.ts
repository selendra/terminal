/**
 * Selendra Staking React Hooks
 *
 * Provides React hooks for staking operations with automatic
 * data fetching, caching, and state management.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  SubstrateStakingClient,
  EvmStakingClient,
  NominationPoolsClient,
  ValidatorInfo,
  StakingInfo,
  StakingStats,
  EraInfo,
  UnbondingInfo,
  RewardInfo,
  NominationPoolInfo,
  PoolMemberInfo,
  RewardDestination,
  EvmPayee,
  formatStakingAmount,
  parseStakingAmount,
  createSubstrateStakingClient,
  createEvmStakingClient,
  createNominationPoolsClient,
} from "@/lib/staking";

// =============================================================================
// Hook: useStakingClient
// =============================================================================

interface StakingClients {
  substrate: SubstrateStakingClient | null;
  evm: EvmStakingClient | null;
  pools: NominationPoolsClient | null;
}

/**
 * Hook to get staking client instances
 */
export function useStakingClient(): StakingClients {
  const { substrateSDK, evmSDK } = useBlockchain();

  return useMemo(() => {
    const clients: StakingClients = {
      substrate: null,
      evm: null,
      pools: null,
    };

    // Create Substrate staking client
    if (substrateSDK) {
      try {
        const api = substrateSDK.getApi?.();
        if (api) {
          clients.substrate = createSubstrateStakingClient(api);
          clients.pools = createNominationPoolsClient(api);
        }
      } catch {
        // SDK not ready
      }
    }

    // Create EVM staking client
    if (evmSDK) {
      try {
        const provider = evmSDK.getEvmProvider?.();
        if (provider) {
          clients.evm = createEvmStakingClient(provider);
        }
      } catch {
        // SDK not ready
      }
    }

    return clients;
  }, [substrateSDK, evmSDK]);
}

// =============================================================================
// Hook: useEraInfo
// =============================================================================

interface UseEraInfoResult {
  eraInfo: EraInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get current era information
 */
export function useEraInfo(): UseEraInfoResult {
  const { substrate } = useStakingClient();
  const [eraInfo, setEraInfo] = useState<EraInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!substrate) {
      // Use mock data when client not available
      setEraInfo({
        currentEra: 1234,
        activeEra: 1234,
        sessionIndex: 12340,
        sessionsPerEra: 6,
        eraProgress: 45,
        eraLength: 3600,
        blocksRemaining: 1980,
        estimatedTimeRemaining: 1980000,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await substrate.getEraInfo();
      setEraInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch era info");
    } finally {
      setIsLoading(false);
    }
  }, [substrate]);

  useEffect(() => {
    refresh();

    // Refresh every minute
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { eraInfo, isLoading, error, refresh };
}

// =============================================================================
// Hook: useStakingStats
// =============================================================================

interface UseStakingStatsResult {
  stats: StakingStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get network staking statistics
 */
export function useStakingStats(): UseStakingStatsResult {
  const { substrate } = useStakingClient();
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!substrate) {
      // Use mock data
      setStats({
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
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const statsData = await substrate.getStakingStats();
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch staking stats"
      );
    } finally {
      setIsLoading(false);
    }
  }, [substrate]);

  useEffect(() => {
    refresh();

    // Refresh every 5 minutes
    const interval = setInterval(refresh, 300000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, isLoading, error, refresh };
}

// =============================================================================
// Hook: useValidators
// =============================================================================

interface UseValidatorsResult {
  validators: ValidatorInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get list of validators
 */
export function useValidators(activeOnly = false): UseValidatorsResult {
  const { substrate } = useStakingClient();
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!substrate) {
      // Use mock data
      setValidators([
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
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const validatorList = await substrate.getValidators(activeOnly);
      setValidators(validatorList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch validators"
      );
    } finally {
      setIsLoading(false);
    }
  }, [substrate, activeOnly]);

  useEffect(() => {
    refresh();

    // Refresh every 2 minutes
    const interval = setInterval(refresh, 120000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { validators, isLoading, error, refresh };
}

// =============================================================================
// Hook: useUserStaking
// =============================================================================

interface UseUserStakingResult {
  stakingInfo: StakingInfo | null;
  unbondingInfo: UnbondingInfo[];
  rewardsHistory: RewardInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get user's staking information
 */
export function useUserStaking(): UseUserStakingResult {
  const { substrate } = useStakingClient();
  const { selectedSubstrateAccount } = useWallet();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [unbondingInfo, setUnbondingInfo] = useState<UnbondingInfo[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<RewardInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = selectedSubstrateAccount?.address;

  const refresh = useCallback(async () => {
    if (!address) {
      setStakingInfo(null);
      setUnbondingInfo([]);
      setRewardsHistory([]);
      return;
    }

    if (!substrate) {
      // Use mock data for connected account
      setStakingInfo({
        bonded: BigInt(0),
        unbonding: BigInt(0),
        redeemable: BigInt(0),
        totalRewards: BigInt(0),
        claimableRewards: BigInt(0),
        nominations: [],
        nominationStatus: "none",
        rewardDestination: { type: "Staked" },
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [info, unbonding, rewards] = await Promise.all([
        substrate.getStakingInfo(address),
        substrate.getUnbondingInfo(address),
        substrate.getRewardsHistory(address, 10),
      ]);

      setStakingInfo(info);
      setUnbondingInfo(unbonding);
      setRewardsHistory(rewards);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch staking info"
      );
    } finally {
      setIsLoading(false);
    }
  }, [substrate, address]);

  useEffect(() => {
    refresh();

    // Refresh every minute when user is staking
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stakingInfo,
    unbondingInfo,
    rewardsHistory,
    isLoading,
    error,
    refresh,
  };
}

// =============================================================================
// Hook: useStakingActions
// =============================================================================

interface StakingActions {
  // Bond/Unbond
  bond: (amount: string, payee?: RewardDestination) => Promise<boolean>;
  bondExtra: (amount: string) => Promise<boolean>;
  unbond: (amount: string) => Promise<boolean>;
  rebond: (amount: string) => Promise<boolean>;
  withdrawUnbonded: () => Promise<boolean>;

  // Nominations
  nominate: (validators: string[]) => Promise<boolean>;
  chill: () => Promise<boolean>;

  // Rewards
  claimRewards: (validator: string, eras: number[]) => Promise<boolean>;
  setPayee: (payee: RewardDestination) => Promise<boolean>;

  // State
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Hook to perform staking actions
 */
export function useStakingActions(): StakingActions {
  const { substrate } = useStakingClient();
  const { selectedSubstrateAccount, signSubstrateMessage } = useWallet();
  const { substrateSDK } = useBlockchain();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to submit and sign transaction
  const submitTx = useCallback(
    async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx: any,
      successMessage: string
    ): Promise<boolean> => {
      if (!selectedSubstrateAccount) {
        toast.error("Please connect your wallet first");
        return false;
      }

      if (!tx) {
        toast.error("Failed to create transaction");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        // Get the signer from the wallet extension
        const { web3FromSource } = await import("@polkadot/extension-dapp");
        const injector = await web3FromSource(selectedSubstrateAccount.source);

        // Sign and send the transaction
        await tx.signAndSend(
          selectedSubstrateAccount.address,
          { signer: injector.signer },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ status, events }: any) => {
            if (status.isInBlock) {
              toast.success(`${successMessage} (in block)`);
            } else if (status.isFinalized) {
              // Check for errors in events
              const hasError = events.some(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ({ event }: any) =>
                  event.section === "system" &&
                  event.method === "ExtrinsicFailed"
              );

              if (hasError) {
                toast.error("Transaction failed");
              } else {
                toast.success(`${successMessage} (finalized)`);
              }
            }
          }
        );

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedSubstrateAccount]
  );

  const bond = useCallback(
    async (
      amount: string,
      payee: RewardDestination = { type: "Staked" }
    ): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = substrate.createBondTx(value, payee);
      return submitTx(tx, `Bonded ${amount} SEL`);
    },
    [substrate, submitTx]
  );

  const bondExtra = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = substrate.createBondExtraTx(value);
      return submitTx(tx, `Bonded extra ${amount} SEL`);
    },
    [substrate, submitTx]
  );

  const unbond = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = substrate.createUnbondTx(value);
      return submitTx(tx, `Unbonding ${amount} SEL`);
    },
    [substrate, submitTx]
  );

  const rebond = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = substrate.createRebondTx(value);
      return submitTx(tx, `Rebonded ${amount} SEL`);
    },
    [substrate, submitTx]
  );

  const withdrawUnbonded = useCallback(async (): Promise<boolean> => {
    if (!substrate) {
      toast.error("Staking client not available");
      return false;
    }

    const tx = substrate.createWithdrawUnbondedTx();
    return submitTx(tx, "Withdrew unbonded tokens");
  }, [substrate, submitTx]);

  const nominate = useCallback(
    async (validators: string[]): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      if (validators.length === 0) {
        toast.error("Please select at least one validator");
        return false;
      }

      if (validators.length > 16) {
        toast.error("Maximum 16 validators can be nominated");
        return false;
      }

      const tx = substrate.createNominateTx(validators);
      return submitTx(tx, `Nominated ${validators.length} validator(s)`);
    },
    [substrate, submitTx]
  );

  const chill = useCallback(async (): Promise<boolean> => {
    if (!substrate) {
      toast.error("Staking client not available");
      return false;
    }

    const tx = substrate.createChillTx();
    return submitTx(tx, "Stopped nominating");
  }, [substrate, submitTx]);

  const claimRewards = useCallback(
    async (validator: string, eras: number[]): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const tx =
        eras.length === 1
          ? substrate.createPayoutStakersTx(validator, eras[0])
          : substrate.createBatchPayoutTx(validator, eras);

      return submitTx(tx, `Claimed rewards for ${eras.length} era(s)`);
    },
    [substrate, submitTx]
  );

  const setPayee = useCallback(
    async (payee: RewardDestination): Promise<boolean> => {
      if (!substrate) {
        toast.error("Staking client not available");
        return false;
      }

      const tx = substrate.createSetPayeeTx(payee);
      return submitTx(tx, "Updated reward destination");
    },
    [substrate, submitTx]
  );

  return {
    bond,
    bondExtra,
    unbond,
    rebond,
    withdrawUnbonded,
    nominate,
    chill,
    claimRewards,
    setPayee,
    isSubmitting,
    error,
  };
}

// =============================================================================
// Hook: useEvmStaking
// =============================================================================

interface EvmStakingActions {
  bond: (amount: string, payee?: EvmPayee) => Promise<boolean>;
  bondExtra: (amount: string) => Promise<boolean>;
  unbond: (amount: string) => Promise<boolean>;
  rebond: (amount: string) => Promise<boolean>;
  withdrawUnbonded: () => Promise<boolean>;
  nominate: (validators: string[]) => Promise<boolean>;
  chill: () => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Hook for EVM staking via precompile
 */
export function useEvmStaking(): EvmStakingActions {
  const { evm } = useStakingClient();
  const { evmAccount } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up signer when account changes
  useEffect(() => {
    if (evm && evmAccount && typeof window !== "undefined") {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ethereum = (window as any).ethereum;
        if (ethereum) {
          const provider = new ethers.BrowserProvider(ethereum);
          provider
            .getSigner()
            .then((signer) => {
              evm.setSigner(signer);
            })
            .catch(() => {
              // Ignore signer errors
            });
        }
      } catch {
        // Ignore errors
      }
    }
  }, [evm, evmAccount]);

  const handleTx = useCallback(
    async (
      txPromise: Promise<ethers.TransactionResponse>,
      successMessage: string
    ): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const tx = await txPromise;
        toast.success(`${successMessage} - Confirming...`);

        const receipt = await tx.wait();

        if (receipt && receipt.status === 1) {
          toast.success(`${successMessage} - Confirmed!`);
          return true;
        } else {
          toast.error("Transaction failed");
          return false;
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const bond = useCallback(
    async (
      amount: string,
      payee: EvmPayee = EvmPayee.Staked
    ): Promise<boolean> => {
      if (!evm) {
        toast.error("EVM staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      return handleTx(evm.bond(value, payee), `Bonded ${amount} SEL`);
    },
    [evm, handleTx]
  );

  const bondExtra = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!evm) {
        toast.error("EVM staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      return handleTx(evm.bondExtra(value), `Bonded extra ${amount} SEL`);
    },
    [evm, handleTx]
  );

  const unbond = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!evm) {
        toast.error("EVM staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      return handleTx(evm.unbond(value), `Unbonding ${amount} SEL`);
    },
    [evm, handleTx]
  );

  const rebond = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!evm) {
        toast.error("EVM staking client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      return handleTx(evm.rebond(value), `Rebonded ${amount} SEL`);
    },
    [evm, handleTx]
  );

  const withdrawUnbonded = useCallback(async (): Promise<boolean> => {
    if (!evm) {
      toast.error("EVM staking client not available");
      return false;
    }

    return handleTx(evm.withdrawUnbonded(), "Withdrew unbonded tokens");
  }, [evm, handleTx]);

  const nominate = useCallback(
    async (validators: string[]): Promise<boolean> => {
      if (!evm) {
        toast.error("EVM staking client not available");
        return false;
      }

      return handleTx(
        evm.nominate(validators),
        `Nominated ${validators.length} validator(s)`
      );
    },
    [evm, handleTx]
  );

  const chill = useCallback(async (): Promise<boolean> => {
    if (!evm) {
      toast.error("EVM staking client not available");
      return false;
    }

    return handleTx(evm.chill(), "Stopped nominating");
  }, [evm, handleTx]);

  return {
    bond,
    bondExtra,
    unbond,
    rebond,
    withdrawUnbonded,
    nominate,
    chill,
    isSubmitting,
    error,
  };
}

// =============================================================================
// Hook: useNominationPools
// =============================================================================

interface UseNominationPoolsResult {
  pools: NominationPoolInfo[];
  memberInfo: PoolMemberInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  // Actions
  joinPool: (poolId: number, amount: string) => Promise<boolean>;
  bondExtraPool: (amount: string) => Promise<boolean>;
  unbondPool: (amount: string) => Promise<boolean>;
  withdrawPool: () => Promise<boolean>;
  claimPoolRewards: () => Promise<boolean>;
  isSubmitting: boolean;
}

/**
 * Hook for nomination pools
 */
export function useNominationPools(): UseNominationPoolsResult {
  const { pools: poolsClient, substrate } = useStakingClient();
  const { selectedSubstrateAccount } = useWallet();
  const [pools, setPools] = useState<NominationPoolInfo[]>([]);
  const [memberInfo, setMemberInfo] = useState<PoolMemberInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = selectedSubstrateAccount?.address;

  const refresh = useCallback(async () => {
    if (!poolsClient) {
      // Use mock data
      setPools([
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
      ]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [poolList, member] = await Promise.all([
        poolsClient.getPools(),
        address ? poolsClient.getMemberInfo(address) : Promise.resolve(null),
      ]);

      setPools(poolList);
      setMemberInfo(member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pools");
    } finally {
      setIsLoading(false);
    }
  }, [poolsClient, address]);

  useEffect(() => {
    refresh();

    // Refresh every 2 minutes
    const interval = setInterval(refresh, 120000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Helper to submit pool transactions
  const submitPoolTx = useCallback(
    async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx: any,
      successMessage: string
    ): Promise<boolean> => {
      if (!selectedSubstrateAccount) {
        toast.error("Please connect your wallet first");
        return false;
      }

      if (!tx) {
        toast.error("Failed to create transaction");
        return false;
      }

      setIsSubmitting(true);

      try {
        const { web3FromSource } = await import("@polkadot/extension-dapp");
        const injector = await web3FromSource(selectedSubstrateAccount.source);

        await tx.signAndSend(
          selectedSubstrateAccount.address,
          { signer: injector.signer },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ status }: any) => {
            if (status.isFinalized) {
              toast.success(successMessage);
              refresh();
            }
          }
        );

        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";
        toast.error(message);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedSubstrateAccount, refresh]
  );

  const joinPool = useCallback(
    async (poolId: number, amount: string): Promise<boolean> => {
      if (!poolsClient) {
        toast.error("Pools client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = poolsClient.createJoinPoolTx(value, poolId);
      return submitPoolTx(tx, `Joined pool with ${amount} SEL`);
    },
    [poolsClient, submitPoolTx]
  );

  const bondExtraPool = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!poolsClient) {
        toast.error("Pools client not available");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = poolsClient.createBondExtraPoolTx({
        FreeBalance: value.toString(),
      });
      return submitPoolTx(tx, `Bonded extra ${amount} SEL to pool`);
    },
    [poolsClient, submitPoolTx]
  );

  const unbondPool = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!poolsClient || !address) {
        toast.error("Pools client not available or wallet not connected");
        return false;
      }

      const value = parseStakingAmount(amount);
      const tx = poolsClient.createUnbondPoolTx(address, value);
      return submitPoolTx(tx, `Unbonding ${amount} SEL from pool`);
    },
    [poolsClient, address, submitPoolTx]
  );

  const withdrawPool = useCallback(async (): Promise<boolean> => {
    if (!poolsClient || !address) {
      toast.error("Pools client not available or wallet not connected");
      return false;
    }

    const tx = poolsClient.createWithdrawUnbondedPoolTx(address, 0);
    return submitPoolTx(tx, "Withdrew unbonded tokens from pool");
  }, [poolsClient, address, submitPoolTx]);

  const claimPoolRewards = useCallback(async (): Promise<boolean> => {
    if (!poolsClient) {
      toast.error("Pools client not available");
      return false;
    }

    const tx = poolsClient.createClaimPayoutTx();
    return submitPoolTx(tx, "Claimed pool rewards");
  }, [poolsClient, submitPoolTx]);

  return {
    pools,
    memberInfo,
    isLoading,
    error,
    refresh,
    joinPool,
    bondExtraPool,
    unbondPool,
    withdrawPool,
    claimPoolRewards,
    isSubmitting,
  };
}

// =============================================================================
// Export utility functions
// =============================================================================

export { formatStakingAmount, parseStakingAmount };
