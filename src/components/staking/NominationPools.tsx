"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  TrendingUp,
  Coins,
  Shield,
  ShieldCheck,
  Clock,
  Info,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Star,
  StarOff,
  Settings,
  Wallet,
  ArrowRight,
  Droplets,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { AddressDisplay } from "../common";
import { useWallet } from "../providers/WalletProvider";

export interface NominationPool {
  id: number;
  name: string;
  state: "Open" | "Blocked" | "Destroying";
  points: string;
  memberCounter: number;
  depositor: string;
  root: string;
  nominator: string;
  bouncer: string;
  commission?: {
    current: number;
    max?: number;
    changeRate?: number;
  };
  apy: number;
  minJoinBond: string;
  validators: string[];
}

interface PoolMemberInfo {
  poolId: number;
  points: string;
  pendingRewards: string;
  unbondingEras: Array<{ era: number; amount: string }>;
}

interface NominationPoolsProps {
  pools?: NominationPool[];
  memberInfo?: PoolMemberInfo | null;
  onJoinPool?: (poolId: number, amount: string) => Promise<void>;
  onClaimRewards?: () => Promise<void>;
  onUnbond?: (amount: string) => Promise<void>;
  onWithdraw?: () => Promise<void>;
}

export function NominationPools({
  pools: propPools,
  memberInfo,
  onJoinPool,
  onClaimRewards,
  onUnbond,
  onWithdraw,
}: NominationPoolsProps) {
  const { isConnected, selectedSubstrateAccount, substrateBalance, connectSubstrateWallet } =
    useWallet();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "members" | "apy">("points");
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);
  const [selectedPool, setSelectedPool] = useState<NominationPool | null>(null);
  const [joinAmount, setJoinAmount] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock pools if not provided
  const defaultPools: NominationPool[] = [
    {
      id: 1,
      name: "Selendra Foundation Pool",
      state: "Open",
      points: "50000000",
      memberCounter: 245,
      depositor: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      root: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      nominator: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      bouncer: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      commission: { current: 5, max: 10 },
      apy: 12.5,
      minJoinBond: "10",
      validators: [
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      ],
    },
    {
      id: 2,
      name: "Community Pool #1",
      state: "Open",
      points: "25000000",
      memberCounter: 128,
      depositor: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      root: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      nominator: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      bouncer: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      commission: { current: 3 },
      apy: 13.2,
      minJoinBond: "5",
      validators: ["5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy"],
    },
    {
      id: 3,
      name: "DeFi Stakers Pool",
      state: "Open",
      points: "15000000",
      memberCounter: 67,
      depositor: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      root: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      nominator: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      bouncer: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      apy: 11.8,
      minJoinBond: "1",
      validators: ["5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw"],
    },
    {
      id: 4,
      name: "Closed Pool",
      state: "Blocked",
      points: "8000000",
      memberCounter: 35,
      depositor: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      root: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      nominator: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      bouncer: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      apy: 10.5,
      minJoinBond: "100",
      validators: [],
    },
  ];

  const pools = propPools || defaultPools;

  // Filter and sort pools
  const filteredPools = pools
    .filter((pool) => {
      const matchesSearch =
        pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.id.toString().includes(searchQuery);
      const matchesState = !showOnlyOpen || pool.state === "Open";
      return matchesSearch && matchesState;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "points":
          return parseFloat(b.points) - parseFloat(a.points);
        case "members":
          return b.memberCounter - a.memberCounter;
        case "apy":
          return b.apy - a.apy;
        default:
          return 0;
      }
    });

  const formatPoints = (points: string) => {
    const num = parseFloat(points);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const handleJoinPool = async () => {
    if (!selectedPool || !joinAmount) return;

    setIsJoining(true);
    try {
      if (onJoinPool) {
        await onJoinPool(selectedPool.id, joinAmount);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        toast.success(`Joined pool "${selectedPool.name}"`);
      }
      setSelectedPool(null);
      setJoinAmount("");
    } catch (error) {
      toast.error("Failed to join pool");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Member Info Card (if user is in a pool) */}
      {memberInfo && (
        <div className="bg-gradient-to-r from-selendra-600 to-selendra-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Your Pool Membership</h3>
            <span className="px-2 py-1 bg-white/20 rounded-lg text-sm">
              Pool #{memberInfo.poolId}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-selendra-200 text-sm">Your Stake</p>
              <p className="text-xl font-bold">
                {formatPoints(memberInfo.points)} SEL
              </p>
            </div>
            <div>
              <p className="text-selendra-200 text-sm">Pending Rewards</p>
              <p className="text-xl font-bold text-green-300">
                {memberInfo.pendingRewards} SEL
              </p>
            </div>
            <div>
              <p className="text-selendra-200 text-sm">Unbonding</p>
              <p className="text-xl font-bold">
                {memberInfo.unbondingEras.length > 0
                  ? memberInfo.unbondingEras
                      .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                      .toFixed(4)
                  : "0"}{" "}
                SEL
              </p>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={onClaimRewards}
                className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
              >
                Claim Rewards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Droplets className="h-5 w-5 text-selendra-400" />
            Nomination Pools
          </h2>
          <p className="text-foreground-secondary text-sm mt-1">
            Join a pool to stake with lower minimum and automatic nominations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Pool
        </button>
      </div>

      {/* Benefits Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Why Join a Pool?
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Coins className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">Lower Minimums</p>
              <p className="text-foreground-secondary">
                Stake as little as 1 SEL
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">Automatic Nominations</p>
              <p className="text-foreground-secondary">
                Pool operators manage validators
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-foreground font-medium">Earn Rewards</p>
              <p className="text-foreground-secondary">
                Same APY as direct staking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Search by name or pool ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background-card border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnlyOpen(!showOnlyOpen)}
            className={clsx(
              "flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors",
              showOnlyOpen
                ? "border-green-500 bg-green-500/10 text-green-400"
                : "border-border text-foreground-secondary hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4" />
            Open Only
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 bg-background-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-selendra-500"
          >
            <option value="points">Sort by Stake</option>
            <option value="members">Sort by Members</option>
            <option value="apy">Sort by APY</option>
          </select>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Total Pools</p>
          <p className="text-2xl font-bold text-foreground">{pools.length}</p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Open Pools</p>
          <p className="text-2xl font-bold text-green-400">
            {pools.filter((p) => p.state === "Open").length}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Total Members</p>
          <p className="text-2xl font-bold text-foreground">
            {pools.reduce((sum, p) => sum + p.memberCounter, 0)}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Avg. APY</p>
          <p className="text-2xl font-bold text-selendra-400">
            {(pools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Pool List */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-background-tertiary border-b border-border text-sm text-foreground-secondary">
          <div className="col-span-4">Pool</div>
          <div className="col-span-2 text-right">Total Stake</div>
          <div className="col-span-2 text-right">Members</div>
          <div className="col-span-1 text-right">APY</div>
          <div className="col-span-2 text-right">Min. Join</div>
          <div className="col-span-1"></div>
        </div>

        {/* Pools */}
        <div className="divide-y divide-border">
          {filteredPools.map((pool) => (
            <div
              key={pool.id}
              className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-background-hover transition-colors"
            >
              {/* Pool Info */}
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      pool.state === "Open"
                        ? "bg-green-500/20"
                        : pool.state === "Blocked"
                        ? "bg-yellow-500/20"
                        : "bg-red-500/20"
                    )}
                  >
                    <span className="font-bold text-foreground">{pool.id}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{pool.name}</span>
                      {pool.state !== "Open" && (
                        <span
                          className={clsx(
                            "px-2 py-0.5 text-xs rounded",
                            pool.state === "Blocked"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {pool.state}
                        </span>
                      )}
                    </div>
                    {pool.commission && (
                      <p className="text-xs text-foreground-secondary">
                        Commission: {pool.commission.current}%
                        {pool.commission.max && ` (max ${pool.commission.max}%)`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Stake */}
              <div className="col-span-2 text-right">
                <p className="font-medium text-foreground">
                  {formatPoints(pool.points)} SEL
                </p>
              </div>

              {/* Members */}
              <div className="col-span-2 text-right">
                <p className="font-medium text-foreground">{pool.memberCounter}</p>
              </div>

              {/* APY */}
              <div className="col-span-1 text-right">
                <span
                  className={clsx(
                    "font-medium",
                    pool.apy > 12 ? "text-green-400" : "text-foreground"
                  )}
                >
                  {pool.apy}%
                </span>
              </div>

              {/* Min Join */}
              <div className="col-span-2 text-right">
                <p className="font-medium text-foreground">{pool.minJoinBond} SEL</p>
              </div>

              {/* Actions */}
              <div className="col-span-1 text-right">
                <button
                  onClick={() => setSelectedPool(pool)}
                  disabled={pool.state !== "Open"}
                  className="px-3 py-1.5 bg-selendra-600 hover:bg-selendra-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredPools.length === 0 && (
          <div className="p-8 text-center text-foreground-secondary">
            <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pools found</p>
          </div>
        )}
      </div>

      {/* Join Pool Modal */}
      {selectedPool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Join Pool
            </h2>
            <p className="text-foreground-secondary text-sm mb-6">
              {selectedPool.name}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-background rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-foreground-secondary">APY</p>
                    <p className="font-semibold text-green-400">{selectedPool.apy}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-secondary">Members</p>
                    <p className="font-semibold text-foreground">
                      {selectedPool.memberCounter}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-secondary">Commission</p>
                    <p className="font-semibold text-foreground">
                      {selectedPool.commission?.current || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground-secondary">Min. Join</p>
                    <p className="font-semibold text-foreground">
                      {selectedPool.minJoinBond} SEL
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-foreground-secondary">
                    Amount to Stake
                  </label>
                  <span className="text-sm text-foreground-secondary">
                    Available: {substrateBalance?.formatted || "0"} SEL
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={joinAmount}
                    onChange={(e) => setJoinAmount(e.target.value)}
                    placeholder={`Min: ${selectedPool.minJoinBond} SEL`}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-lg font-medium focus:outline-none focus:border-selendra-500"
                    min={selectedPool.minJoinBond}
                  />
                  <button
                    onClick={() =>
                      setJoinAmount(substrateBalance?.formatted || "0")
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-selendra-400 hover:text-selendra-300"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {joinAmount && parseFloat(joinAmount) > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">
                      Est. Annual Rewards:{" "}
                      {((parseFloat(joinAmount) * selectedPool.apy) / 100).toFixed(
                        2
                      )}{" "}
                      SEL
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedPool(null);
                    setJoinAmount("");
                  }}
                  className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-background-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinPool}
                  disabled={
                    isJoining ||
                    !joinAmount ||
                    parseFloat(joinAmount) < parseFloat(selectedPool.minJoinBond)
                  }
                  className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {isJoining ? "Joining..." : "Join Pool"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Pool Modal (placeholder)
interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    name: string;
    initialDeposit: string;
    commission: number;
  }) => Promise<void>;
}

export function CreatePoolModal({ isOpen, onClose, onCreate }: CreatePoolModalProps) {
  const [name, setName] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [commission, setCommission] = useState("0");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name || !initialDeposit) return;

    setIsCreating(true);
    try {
      await onCreate({
        name,
        initialDeposit,
        commission: parseInt(commission),
      });
      onClose();
    } catch (error) {
      toast.error("Failed to create pool");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Create Nomination Pool
        </h2>
        <p className="text-foreground-secondary text-sm mb-6">
          Create a new pool for others to join and stake together
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              Pool Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Pool"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-selendra-500"
            />
          </div>

          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              Initial Deposit (min 100 SEL)
            </label>
            <input
              type="number"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
              placeholder="100"
              min="100"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-selendra-500"
            />
          </div>

          <div>
            <label className="block text-sm text-foreground-secondary mb-2">
              Commission (%)
            </label>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-selendra-500"
            />
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-400">
                As the pool creator, you will be responsible for managing
                nominations and pool settings.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-background-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !name || !initialDeposit}
              className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Pool"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
