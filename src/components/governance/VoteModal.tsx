"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  X,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Lock,
  Scale,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";
import { useWallet } from "@/components/providers/WalletProvider";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import toast from "react-hot-toast";

// Vote types
export type VoteType = "Aye" | "Nay" | "Abstain";

export interface ConvictionOption {
  value: number;
  label: string;
  multiplier: string;
  lockPeriod: string;
}

export interface ReferendumSummary {
  id: string;
  index: number;
  title: string;
  track: string;
  status: string;
  ayeVotes: string;
  nayVotes: string;
  turnout: string;
  endBlock: number;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  referendum: ReferendumSummary | null;
  onVoteSuccess?: (vote: { type: VoteType; amount: string; conviction: number }) => void;
}

// Conviction options with lock periods
const CONVICTION_OPTIONS: ConvictionOption[] = [
  { value: 0, label: "0.1x", multiplier: "0.1x", lockPeriod: "No lock" },
  { value: 1, label: "1x", multiplier: "1x", lockPeriod: "7 days" },
  { value: 2, label: "2x", multiplier: "2x", lockPeriod: "14 days" },
  { value: 3, label: "3x", multiplier: "3x", lockPeriod: "28 days" },
  { value: 4, label: "4x", multiplier: "4x", lockPeriod: "56 days" },
  { value: 5, label: "5x", multiplier: "5x", lockPeriod: "112 days" },
  { value: 6, label: "6x", multiplier: "6x", lockPeriod: "224 days" },
];

export function VoteModal({
  isOpen,
  onClose,
  referendum,
  onVoteSuccess,
}: VoteModalProps) {
  const { selectedSubstrateAccount, signSubstrateMessage } = useWallet();
  const { substrateSDK } = useBlockchain();

  // State
  const [voteType, setVoteType] = useState<VoteType>("Aye");
  const [amount, setAmount] = useState("");
  const [conviction, setConviction] = useState<number>(1);
  const [showConvictionDropdown, setShowConvictionDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState("0");

  // Fetch balance
  React.useEffect(() => {
    async function fetchBalance() {
      if (!substrateSDK || !selectedSubstrateAccount) return;
      
      try {
        // For now, use mock balance - real implementation would query chain
        setBalance("1000000000000000000000"); // 1000 SEL
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    }

    if (isOpen) {
      fetchBalance();
    }
  }, [substrateSDK, selectedSubstrateAccount, isOpen]);

  // Calculate effective vote power
  const effectiveVotePower = useMemo(() => {
    if (!amount) return "0";
    const selectedConviction = CONVICTION_OPTIONS.find(c => c.value === conviction);
    if (!selectedConviction) return amount;
    
    const multiplier = conviction === 0 ? 0.1 : conviction;
    const power = parseFloat(amount) * multiplier;
    return power.toFixed(2);
  }, [amount, conviction]);

  // Format balance for display
  const formattedBalance = useMemo(() => {
    const balanceSEL = parseInt(balance) / 1e18;
    return balanceSEL.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [balance]);

  // Handle max amount
  const handleMaxAmount = useCallback(() => {
    const maxSEL = parseInt(balance) / 1e18;
    setAmount(maxSEL.toString());
  }, [balance]);

  // Handle vote submission
  const handleSubmitVote = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount || !referendum) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      // Construct vote - in real implementation, this would use the SDK
      const voteValue = BigInt(Math.floor(parseFloat(amount) * 1e18));
      
      // Simulate vote submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Vote submitted successfully!`);
      onVoteSuccess?.({
        type: voteType,
        amount: amount,
        conviction: conviction,
      });
      onClose();
    } catch (error) {
      console.error("Vote failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  }, [substrateSDK, selectedSubstrateAccount, referendum, amount, voteType, conviction, onVoteSuccess, onClose]);

  if (!isOpen || !referendum) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-white">Cast Your Vote</h2>
            <p className="text-sm text-gray-400">
              Referendum #{referendum.index}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Referendum Info */}
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <h3 className="font-medium text-white mb-1 line-clamp-2">
              {referendum.title}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                {referendum.track}
              </span>
              <span>Turnout: {referendum.turnout}</span>
            </div>
          </div>

          {/* Vote Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Your Vote
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setVoteType("Aye")}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  voteType === "Aye"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                )}
              >
                <ThumbsUp
                  className={clsx(
                    "w-6 h-6",
                    voteType === "Aye" ? "text-emerald-400" : "text-gray-400"
                  )}
                />
                <span
                  className={clsx(
                    "font-medium",
                    voteType === "Aye" ? "text-emerald-400" : "text-gray-400"
                  )}
                >
                  Aye
                </span>
              </button>

              <button
                onClick={() => setVoteType("Nay")}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  voteType === "Nay"
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                )}
              >
                <ThumbsDown
                  className={clsx(
                    "w-6 h-6",
                    voteType === "Nay" ? "text-red-400" : "text-gray-400"
                  )}
                />
                <span
                  className={clsx(
                    "font-medium",
                    voteType === "Nay" ? "text-red-400" : "text-gray-400"
                  )}
                >
                  Nay
                </span>
              </button>

              <button
                onClick={() => setVoteType("Abstain")}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  voteType === "Abstain"
                    ? "border-gray-500 bg-gray-500/10"
                    : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                )}
              >
                <Minus
                  className={clsx(
                    "w-6 h-6",
                    voteType === "Abstain" ? "text-gray-300" : "text-gray-400"
                  )}
                />
                <span
                  className={clsx(
                    "font-medium",
                    voteType === "Abstain" ? "text-gray-300" : "text-gray-400"
                  )}
                >
                  Abstain
                </span>
              </button>
            </div>
          </div>

          {/* Vote Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Vote Amount
              </label>
              <span className="text-sm text-gray-400">
                Balance: {formattedBalance} SEL
              </span>
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
          {voteType !== "Abstain" && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Conviction
                </label>
                <div className="group relative">
                  <Info className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 rounded-lg text-xs text-gray-300 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    Higher conviction means more voting power but longer lock period.
                    Your tokens will be locked for the specified duration.
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
                      <div className="font-medium">
                        {CONVICTION_OPTIONS.find(c => c.value === conviction)?.multiplier} Voting Power
                      </div>
                      <div className="text-sm text-gray-400">
                        <Lock className="w-3 h-3 inline mr-1" />
                        {CONVICTION_OPTIONS.find(c => c.value === conviction)?.lockPeriod}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={clsx(
                      "w-5 h-5 text-gray-400 transition-transform",
                      showConvictionDropdown && "rotate-180"
                    )}
                  />
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
                          <span className="font-medium text-white">
                            {option.multiplier}
                          </span>
                          <span className="text-sm text-gray-400">
                            {option.lockPeriod}
                          </span>
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
          )}

          {/* Vote Summary */}
          <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Vote Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Vote Type:</span>
                <span
                  className={clsx(
                    "font-medium",
                    voteType === "Aye" && "text-emerald-400",
                    voteType === "Nay" && "text-red-400",
                    voteType === "Abstain" && "text-gray-300"
                  )}
                >
                  {voteType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">{amount || "0"} SEL</span>
              </div>
              {voteType !== "Abstain" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conviction:</span>
                    <span className="text-white">
                      {CONVICTION_OPTIONS.find(c => c.value === conviction)?.multiplier}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Effective Power:</span>
                    <span className="text-purple-400 font-medium">
                      {effectiveVotePower} SEL
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {voteType !== "Abstain" && conviction > 0 && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-amber-500/10 rounded text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Your tokens will be locked for{" "}
                  {CONVICTION_OPTIONS.find(c => c.value === conviction)?.lockPeriod}.
                  You won&apos;t be able to transfer them during this period.
                </span>
              </div>
            )}
          </div>

          {/* Account Info */}
          {selectedSubstrateAccount && (
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <span className="text-sm text-gray-400">Voting from:</span>
              <AddressDisplay
                address={selectedSubstrateAccount.address}
                type="substrate"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitVote}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
                voteType === "Aye" &&
                  "bg-emerald-600 hover:bg-emerald-500 text-white",
                voteType === "Nay" &&
                  "bg-red-600 hover:bg-red-500 text-white",
                voteType === "Abstain" &&
                  "bg-gray-600 hover:bg-gray-500 text-white",
                (isSubmitting || !amount || parseFloat(amount) <= 0) &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {voteType === "Aye" && <ThumbsUp className="w-5 h-5" />}
                  {voteType === "Nay" && <ThumbsDown className="w-5 h-5" />}
                  {voteType === "Abstain" && <Minus className="w-5 h-5" />}
                  Vote {voteType}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simplified voting hook
export function useVote() {
  const { selectedSubstrateAccount } = useWallet();
  const { substrateSDK } = useBlockchain();

  const vote = useCallback(
    async (
      referendumIndex: number,
      voteType: VoteType,
      amount: string,
      conviction: number
    ): Promise<string> => {
      if (!substrateSDK || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      // Simulate vote transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0x${Math.random().toString(16).slice(2)}`;
    },
    [substrateSDK, selectedSubstrateAccount]
  );

  const removeVote = useCallback(
    async (referendumIndex: number): Promise<string> => {
      if (!substrateSDK || !selectedSubstrateAccount) {
        throw new Error("Wallet not connected");
      }

      // Simulate remove vote transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0x${Math.random().toString(16).slice(2)}`;
    },
    [substrateSDK, selectedSubstrateAccount]
  );

  return {
    vote,
    removeVote,
    isConnected: !!selectedSubstrateAccount,
  };
}

export default VoteModal;
