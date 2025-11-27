"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Wallet,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Info,
  AlertCircle,
} from "lucide-react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface StakingStats {
  totalStaked: string;
  stakingRate: number;
  rewardRate: number;
  minStake: string;
  unbondingPeriod: number;
  activeValidators: number;
  waitingValidators: number;
}

interface ValidatorInfo {
  address: string;
  name?: string;
  commission: number;
  totalStake: string;
  ownStake: string;
  nominators: number;
  isActive: boolean;
  apy: number;
}

export function StakingDashboard() {
  const { substrateSDK, isConnected } = useBlockchain();
  const {
    isConnected: walletConnected,
    selectedSubstrateAccount,
    substrateBalance,
    connectSubstrateWallet,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<"stake" | "validators" | "rewards">(
    "stake"
  );
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [stakingStats, setStakingStats] = useState<StakingStats>({
    totalStaked: "245,000,000",
    stakingRate: 72,
    rewardRate: 12.5,
    minStake: "1000",
    unbondingPeriod: 28,
    activeValidators: 4,
    waitingValidators: 20,
  });

  // Mock validator data
  const [validators] = useState<ValidatorInfo[]>([
    {
      address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      name: "Selendra Foundation #1",
      commission: 5,
      totalStake: "15,234,567",
      ownStake: "5,000,000",
      nominators: 245,
      isActive: true,
      apy: 14.2,
    },
    {
      address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      name: "Selendra Foundation #2",
      commission: 3,
      totalStake: "12,345,678",
      ownStake: "4,500,000",
      nominators: 198,
      isActive: true,
      apy: 13.8,
    },
    {
      address: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      name: "Community Validator",
      commission: 10,
      totalStake: "8,765,432",
      ownStake: "2,000,000",
      nominators: 156,
      isActive: true,
      apy: 12.1,
    },
    {
      address: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      name: "DeFi Stakers",
      commission: 8,
      totalStake: "6,543,210",
      ownStake: "1,500,000",
      nominators: 87,
      isActive: true,
      apy: 11.5,
    },
  ]);

  const handleStake = async () => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) < 1000) {
      toast.error("Minimum stake amount is 1000 SEL");
      return;
    }

    if (!selectedValidator) {
      toast.error("Please select a validator");
      return;
    }

    setIsStaking(true);
    try {
      // This would use the SDK's staking functionality
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(`Successfully staked ${stakeAmount} SEL`);
      setStakeAmount("");
      setSelectedValidator(null);
    } catch (err) {
      toast.error("Failed to stake. Please try again.");
    } finally {
      setIsStaking(false);
    }
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Landmark className="h-6 w-6 text-selendra-400" />
            Staking
          </h1>
          <p className="text-gray-500 mt-1">
            Stake SEL and earn rewards while securing the network
          </p>
        </div>

        {!walletConnected && (
          <button onClick={connectSubstrateWallet} className="btn-primary">
            Connect Wallet to Stake
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-selendra-400" />
            <span className="text-sm text-gray-500">Total Staked</span>
          </div>
          <p className="text-xl font-bold text-white">
            {stakingStats.totalStaked} SEL
          </p>
          <p className="text-xs text-accent-green mt-1">
            {stakingStats.stakingRate}% of total supply
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-accent-green" />
            <span className="text-sm text-gray-500">Est. APY</span>
          </div>
          <p className="text-xl font-bold text-accent-green">
            {stakingStats.rewardRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Annual reward rate</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-500">Validators</span>
          </div>
          <p className="text-xl font-bold text-white">
            {stakingStats.activeValidators}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            +{stakingStats.waitingValidators} waiting
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-gray-500">Unbonding Period</span>
          </div>
          <p className="text-xl font-bold text-white">
            {stakingStats.unbondingPeriod} days
          </p>
          <p className="text-xs text-gray-500 mt-1">Min: {stakingStats.minStake} SEL</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-background-card border border-border rounded-lg p-1 w-fit">
        {(["stake", "validators", "rewards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
              activeTab === tab
                ? "bg-selendra-500/20 text-selendra-400"
                : "text-gray-500 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "stake" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Stake Form */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">
              Stake your SEL
            </h2>

            {walletConnected ? (
              <div className="space-y-4">
                {/* Balance */}
                <div className="p-3 rounded-lg bg-background-hover">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available Balance</span>
                    <span className="text-sm font-medium text-white">
                      {substrateBalance?.formatted || "0"} SEL
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Amount to Stake
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="input w-full pr-20"
                      min="1000"
                    />
                    <button
                      onClick={() =>
                        setStakeAmount(substrateBalance?.formatted || "0")
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-selendra-400 hover:text-selendra-300"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: 1,000 SEL
                  </p>
                </div>

                {/* Selected Validator */}
                <div>
                  <label className="block text-sm text-gray-500 mb-2">
                    Selected Validator
                  </label>
                  {selectedValidator ? (
                    <div className="p-3 rounded-lg bg-background-hover flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {validators.find((v) => v.address === selectedValidator)
                            ?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {truncateAddress(selectedValidator)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedValidator(null)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-3 rounded-lg border border-dashed border-border">
                      Select a validator from the list below
                    </p>
                  )}
                </div>

                {/* Estimated Rewards */}
                {stakeAmount && parseFloat(stakeAmount) > 0 && (
                  <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-accent-green" />
                      <span className="text-sm text-accent-green">
                        Estimated Annual Rewards
                      </span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      ~{(parseFloat(stakeAmount) * 0.125).toFixed(2)} SEL
                    </p>
                  </div>
                )}

                {/* Stake Button */}
                <button
                  onClick={handleStake}
                  disabled={
                    isStaking ||
                    !stakeAmount ||
                    parseFloat(stakeAmount) < 1000 ||
                    !selectedValidator
                  }
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStaking ? "Staking..." : "Stake SEL"}
                </button>

                {/* Info */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-400">
                    Staked tokens have a {stakingStats.unbondingPeriod}-day
                    unbonding period. During this time, you won&apos;t earn rewards
                    and cannot transfer your tokens.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Connect your wallet to start staking
                </p>
                <button
                  onClick={connectSubstrateWallet}
                  className="btn-primary"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Your Stakes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Stakes
            </h2>

            {walletConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  You don&apos;t have any active stakes yet.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Start staking to earn rewards
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Connect wallet to view your stakes
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "validators" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Active Validators
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Validator
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Total Stake
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Commission
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Nominators
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    APY
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {validators.map((validator) => (
                  <tr
                    key={validator.address}
                    className={clsx(
                      "border-b border-border last:border-b-0 hover:bg-background-hover transition-colors",
                      selectedValidator === validator.address &&
                        "bg-selendra-500/10"
                    )}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-white">
                          {validator.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {truncateAddress(validator.address)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white">
                      {validator.totalStake} SEL
                    </td>
                    <td className="py-3 px-4 text-white">
                      {validator.commission}%
                    </td>
                    <td className="py-3 px-4 text-white">
                      {validator.nominators}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-accent-green font-medium">
                        {validator.apy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedValidator(validator.address);
                          setActiveTab("stake");
                        }}
                        className="btn-primary text-sm py-1.5"
                      >
                        Stake
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Staking Rewards
          </h2>

          {walletConnected ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No rewards to claim yet</p>
              <p className="text-sm text-gray-600 mt-2">
                Start staking to earn rewards
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Connect wallet to view your rewards
            </div>
          )}
        </div>
      )}
    </div>
  );
}
