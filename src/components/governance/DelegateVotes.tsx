"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  ArrowUpDown,
  ChevronDown,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Lock,
  Info,
  UserPlus,
  UserMinus,
  RefreshCw,
  ExternalLink,
  Copy,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/components/providers/WalletProvider";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { IdentityDisplay } from "@/components/common/IdentityDisplay";
import toast from "react-hot-toast";

// Types
export interface Delegate {
  address: string;
  name?: string;
  identity?: {
    display: string;
    verified: boolean;
  };
  receivedDelegations: number;
  votingPower: string;
  recentVotes: number;
  tracks: number[];
  conviction: number;
}

interface DelegateVotesProps {
  onDelegateSuccess?: (delegate: string, track: number, conviction: number, amount: string) => void;
}

interface DelegateModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegate: Delegate | null;
  onSuccess?: (delegate: string, track: number, conviction: number, amount: string) => void;
}

// Conviction options
const CONVICTION_OPTIONS = [
  { value: 0, label: "0.1x", lockPeriod: "No lock" },
  { value: 1, label: "1x", lockPeriod: "7 days" },
  { value: 2, label: "2x", lockPeriod: "14 days" },
  { value: 3, label: "3x", lockPeriod: "28 days" },
  { value: 4, label: "4x", lockPeriod: "56 days" },
  { value: 5, label: "5x", lockPeriod: "112 days" },
  { value: 6, label: "6x", lockPeriod: "224 days" },
];

// Track options (simplified - real implementation would fetch from chain)
const TRACK_OPTIONS = [
  { id: 0, name: "Root", description: "Origin for highest privilege" },
  { id: 1, name: "Whitelisted Caller", description: "For whitelisted calls" },
  { id: 10, name: "Staking Admin", description: "Staking administration" },
  { id: 11, name: "Treasurer", description: "Treasury proposals" },
  { id: 12, name: "Lease Admin", description: "Parachain slot management" },
  { id: 13, name: "Fellowship Admin", description: "Fellowship management" },
  { id: 14, name: "General Admin", description: "General administration" },
  { id: 15, name: "Auction Admin", description: "Auction management" },
  { id: 20, name: "Referendum Canceller", description: "Cancel referenda" },
  { id: 21, name: "Referendum Killer", description: "Kill referenda" },
  { id: 30, name: "Small Tipper", description: "Small tips" },
  { id: 31, name: "Big Tipper", description: "Larger tips" },
  { id: 32, name: "Small Spender", description: "Small treasury spends" },
  { id: 33, name: "Medium Spender", description: "Medium treasury spends" },
  { id: 34, name: "Big Spender", description: "Large treasury spends" },
];

// Delegate Modal
function DelegateModal({
  isOpen,
  onClose,
  delegate,
  onSuccess,
}: DelegateModalProps) {
  const { selectedSubstrateAccount } = useWallet();
  const { substrateSDK } = useBlockchain();

  const [amount, setAmount] = useState("");
  const [conviction, setConviction] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState<number | "all">("all");
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [showConvictionDropdown, setShowConvictionDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState("0");

  // Fetch balance
  useEffect(() => {
    async function fetchBalance() {
      if (!substrateSDK || !selectedSubstrateAccount) return;
      try {
        // Mock balance for now
        setBalance("1000000000000000000000"); // 1000 SEL
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    }
    if (isOpen) {
      fetchBalance();
    }
  }, [substrateSDK, selectedSubstrateAccount, isOpen]);

  const formattedBalance = useMemo(() => {
    const balanceSEL = parseInt(balance) / 1e18;
    return balanceSEL.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [balance]);

  const handleMaxAmount = useCallback(() => {
    const maxSEL = parseInt(balance) / 1e18;
    setAmount(maxSEL.toString());
  }, [balance]);

  // Calculate effective vote power
  const effectiveVotePower = useMemo(() => {
    if (!amount) return "0";
    const multiplier = conviction === 0 ? 0.1 : conviction;
    return (parseFloat(amount) * multiplier).toFixed(2);
  }, [amount, conviction]);

  const handleDelegate = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount || !delegate) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate delegation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Delegation successful!");
      onSuccess?.(
        delegate.address,
        selectedTrack === "all" ? -1 : selectedTrack,
        conviction,
        amount
      );
      onClose();
    } catch (error) {
      console.error("Delegation failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delegate");
    } finally {
      setIsSubmitting(false);
    }
  }, [substrateSDK, selectedSubstrateAccount, delegate, amount, conviction, selectedTrack, onSuccess, onClose]);

  if (!isOpen || !delegate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Delegate Votes</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Delegate Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white">
                {delegate.identity?.display || delegate.name || "Delegate"}
              </div>
              <AddressDisplay address={delegate.address} type="substrate" />
            </div>
            {delegate.identity?.verified && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          {/* Track Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Governance Track
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTrackDropdown(!showTrackDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
              >
                <span>
                  {selectedTrack === "all"
                    ? "All Tracks"
                    : TRACK_OPTIONS.find((t) => t.id === selectedTrack)?.name}
                </span>
                <ChevronDown className={clsx("w-5 h-5 text-gray-400 transition-transform", showTrackDropdown && "rotate-180")} />
              </button>

              {showTrackDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedTrack("all");
                      setShowTrackDropdown(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors",
                      selectedTrack === "all" && "bg-purple-500/10"
                    )}
                  >
                    <div className="font-medium text-white">All Tracks</div>
                    <div className="text-xs text-gray-400">Delegate to all governance tracks</div>
                  </button>
                  {TRACK_OPTIONS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => {
                        setSelectedTrack(track.id);
                        setShowTrackDropdown(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors",
                        selectedTrack === track.id && "bg-purple-500/10"
                      )}
                    >
                      <div className="font-medium text-white">{track.name}</div>
                      <div className="text-xs text-gray-400">{track.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Amount</label>
              <span className="text-sm text-gray-400">Balance: {formattedBalance} SEL</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-20 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={handleMaxAmount}
                  className="px-2 py-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 rounded transition-colors"
                >
                  MAX
                </button>
                <span className="text-gray-400 text-sm">SEL</span>
              </div>
            </div>
          </div>

          {/* Conviction */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-300">Conviction</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  Higher conviction multiplies your voting power but locks tokens longer.
                </div>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowConvictionDropdown(!showConvictionDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-purple-400" />
                  <div className="text-left">
                    <div className="font-medium">{CONVICTION_OPTIONS.find((c) => c.value === conviction)?.label} Voting Power</div>
                    <div className="text-sm text-gray-400">
                      <Lock className="w-3 h-3 inline mr-1" />
                      {CONVICTION_OPTIONS.find((c) => c.value === conviction)?.lockPeriod}
                    </div>
                  </div>
                </div>
                <ChevronDown className={clsx("w-5 h-5 text-gray-400 transition-transform", showConvictionDropdown && "rotate-180")} />
              </button>

              {showConvictionDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  {CONVICTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setConviction(option.value);
                        setShowConvictionDropdown(false);
                      }}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700 transition-colors",
                        conviction === option.value && "bg-purple-500/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{option.label}</span>
                        <span className="text-sm text-gray-400">{option.lockPeriod}</span>
                      </div>
                      {conviction === option.value && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 bg-gray-800/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Effective Voting Power:</span>
              <span className="text-purple-400 font-medium">{effectiveVotePower} SEL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lock Period:</span>
              <span className="text-white">{CONVICTION_OPTIONS.find((c) => c.value === conviction)?.lockPeriod}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Delegated votes will be used according to the delegate&apos;s voting decisions.
              You can undelegate at any time.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelegate}
            disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
              "bg-purple-600 hover:bg-purple-500 text-white",
              (isSubmitting || !amount || parseFloat(amount) <= 0) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Delegating...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Delegate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function DelegateVotes({ onDelegateSuccess }: DelegateVotesProps) {
  const { selectedSubstrateAccount } = useWallet();
  const { substrateSDK } = useBlockchain();

  // State
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [myDelegations, setMyDelegations] = useState<{
    target: string;
    track: number;
    conviction: number;
    amount: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"votingPower" | "delegations" | "activity">("votingPower");
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null);

  // Load delegates (mock data - real implementation would query indexer/chain)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock delegate data
      const mockDelegates: Delegate[] = [
        {
          address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          name: "Alice Staker",
          identity: { display: "Alice Staker", verified: true },
          receivedDelegations: 45,
          votingPower: "1,250,000",
          recentVotes: 23,
          tracks: [0, 1, 10, 11],
          conviction: 4,
        },
        {
          address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
          name: "Bob Validator",
          identity: { display: "Bob Validator", verified: true },
          receivedDelegations: 32,
          votingPower: "890,000",
          recentVotes: 18,
          tracks: [0, 10, 14],
          conviction: 3,
        },
        {
          address: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
          name: "Council Member",
          identity: { display: "Council Member", verified: false },
          receivedDelegations: 28,
          votingPower: "650,000",
          recentVotes: 15,
          tracks: [11, 30, 31, 32],
          conviction: 2,
        },
        {
          address: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
          name: "Dave Governor",
          receivedDelegations: 19,
          votingPower: "420,000",
          recentVotes: 12,
          tracks: [0, 1, 10, 11, 14],
          conviction: 4,
        },
        {
          address: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
          name: "Eve Delegate",
          identity: { display: "Eve Delegate", verified: true },
          receivedDelegations: 15,
          votingPower: "280,000",
          recentVotes: 8,
          tracks: [30, 31, 32, 33, 34],
          conviction: 1,
        },
      ];

      setDelegates(mockDelegates);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Filtered and sorted delegates
  const filteredDelegates = useMemo(() => {
    let result = [...delegates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(query) ||
          d.identity?.display.toLowerCase().includes(query) ||
          d.address.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "votingPower":
          return parseInt(b.votingPower.replace(/,/g, "")) - parseInt(a.votingPower.replace(/,/g, ""));
        case "delegations":
          return b.receivedDelegations - a.receivedDelegations;
        case "activity":
          return b.recentVotes - a.recentVotes;
        default:
          return 0;
      }
    });

    return result;
  }, [delegates, searchQuery, sortBy]);

  // Handle undelegate
  const handleUndelegate = useCallback(
    async (track: number) => {
      if (!substrateSDK || !selectedSubstrateAccount) {
        toast.error("Please connect your wallet");
        return;
      }

      try {
        // Simulate undelegation
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success("Undelegated successfully!");
        setMyDelegations((prev) => prev.filter((d) => d.track !== track));
      } catch (error) {
        console.error("Undelegate failed:", error);
        toast.error(error instanceof Error ? error.message : "Failed to undelegate");
      }
    },
    [substrateSDK, selectedSubstrateAccount]
  );

  // Open delegate modal
  const openDelegateModal = useCallback((delegate: Delegate) => {
    setSelectedDelegate(delegate);
    setShowDelegateModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Delegate Votes</h2>
          <p className="text-gray-400 text-sm">
            Delegate your voting power to trusted community members
          </p>
        </div>
      </div>

      {/* My Delegations */}
      {myDelegations.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            Your Active Delegations
          </h3>
          <div className="space-y-2">
            {myDelegations.map((delegation, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AddressDisplay address={delegation.target} type="substrate" />
                  <span className="text-sm text-gray-400">
                    Track {delegation.track} · {delegation.amount} SEL ·{" "}
                    {CONVICTION_OPTIONS.find((c) => c.value === delegation.conviction)?.label}
                  </span>
                </div>
                <button
                  onClick={() => handleUndelegate(delegation.track)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <UserMinus className="w-4 h-4" />
                  Undelegate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search delegates..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="votingPower">Voting Power</option>
            <option value="delegations">Delegations</option>
            <option value="activity">Recent Activity</option>
          </select>
        </div>
      </div>

      {/* Delegates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : filteredDelegates.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Delegates Found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? "Try a different search term"
              : "No delegates available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDelegates.map((delegate) => (
            <div
              key={delegate.address}
              className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              {/* Delegate Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {delegate.identity?.display || delegate.name || "Anonymous"}
                      </span>
                      {delegate.identity?.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <AddressDisplay address={delegate.address} type="substrate" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {delegate.votingPower}
                  </div>
                  <div className="text-xs text-gray-400">Voting Power</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {delegate.receivedDelegations}
                  </div>
                  <div className="text-xs text-gray-400">Delegators</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">
                    {delegate.recentVotes}
                  </div>
                  <div className="text-xs text-gray-400">Recent Votes</div>
                </div>
              </div>

              {/* Tracks */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {delegate.tracks.slice(0, 4).map((trackId) => {
                  const track = TRACK_OPTIONS.find((t) => t.id === trackId);
                  return (
                    <span
                      key={trackId}
                      className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                    >
                      {track?.name || `Track ${trackId}`}
                    </span>
                  );
                })}
                {delegate.tracks.length > 4 && (
                  <span className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded">
                    +{delegate.tracks.length - 4} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openDelegateModal(delegate)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Delegate
                </button>
                <button
                  className="px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="View profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delegate Modal */}
      <DelegateModal
        isOpen={showDelegateModal}
        onClose={() => {
          setShowDelegateModal(false);
          setSelectedDelegate(null);
        }}
        delegate={selectedDelegate}
        onSuccess={(delegate, track, conviction, amount) => {
          setMyDelegations((prev) => [
            ...prev.filter((d) => d.track !== track),
            { target: delegate, track, conviction, amount },
          ]);
          onDelegateSuccess?.(delegate, track, conviction, amount);
        }}
      />
    </div>
  );
}

export default DelegateVotes;
