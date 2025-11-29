"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Calendar,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Link2,
  ChevronDown,
  ChevronUp,
  Copy,
  Share2,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { AddressDisplay } from "@/components/common/AddressDisplay";
import { IdentityDisplay } from "@/components/common/IdentityDisplay";
import toast from "react-hot-toast";

// Types
export interface ReferendumTrack {
  id: number;
  name: string;
  description: string;
  maxDeciding: number;
  decisionDeposit: string;
  preparePeriod: number;
  decisionPeriod: number;
  confirmPeriod: number;
  minEnactmentPeriod: number;
}

export interface ReferendumTimeline {
  created: number;
  deciding: number | null;
  confirming: number | null;
  approved: number | null;
  rejected: number | null;
  cancelled: number | null;
  timedOut: number | null;
  executed: number | null;
}

export interface ReferendumVoteInfo {
  ayes: string;
  nays: string;
  support: string;
  approval: string;
  turnout: string;
  totalIssuance: string;
}

export interface ReferendumCall {
  section: string;
  method: string;
  args: Record<string, unknown>;
  description?: string;
}

export interface ReferendumDetail {
  index: number;
  track: ReferendumTrack;
  status: "Ongoing" | "Approved" | "Rejected" | "Cancelled" | "TimedOut" | "Executed";
  proposer: string;
  submission: {
    deposit: string;
    who: string;
  };
  decisionDeposit: {
    deposit: string;
    who: string;
  } | null;
  enactment: {
    after: number;
    at: number;
  };
  timeline: ReferendumTimeline;
  votes: ReferendumVoteInfo;
  call: ReferendumCall | null;
  title: string;
  description: string;
  comments: number;
  currentBlock: number;
}

interface ReferendumDetailViewProps {
  referendum: ReferendumDetail | null;
  isLoading?: boolean;
  onBack?: () => void;
  onVote?: () => void;
}

// Track colors
const TRACK_COLORS: Record<string, string> = {
  root: "bg-red-500/10 text-red-400",
  whitelisted_caller: "bg-purple-500/10 text-purple-400",
  staking_admin: "bg-blue-500/10 text-blue-400",
  treasurer: "bg-emerald-500/10 text-emerald-400",
  lease_admin: "bg-amber-500/10 text-amber-400",
  fellowship_admin: "bg-pink-500/10 text-pink-400",
  general_admin: "bg-cyan-500/10 text-cyan-400",
  auction_admin: "bg-orange-500/10 text-orange-400",
  referendum_canceller: "bg-rose-500/10 text-rose-400",
  referendum_killer: "bg-red-600/10 text-red-500",
  small_tipper: "bg-green-500/10 text-green-400",
  big_tipper: "bg-green-600/10 text-green-500",
  small_spender: "bg-teal-500/10 text-teal-400",
  medium_spender: "bg-teal-600/10 text-teal-500",
  big_spender: "bg-teal-700/10 text-teal-600",
};

// Status badges
function StatusBadge({ status }: { status: ReferendumDetail["status"] }) {
  const statusConfig: Record<ReferendumDetail["status"], { icon: React.ReactNode; className: string }> = {
    Ongoing: { icon: <Activity className="w-3.5 h-3.5" />, className: "bg-blue-500/10 text-blue-400" },
    Approved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-emerald-500/10 text-emerald-400" },
    Rejected: { icon: <XCircle className="w-3.5 h-3.5" />, className: "bg-red-500/10 text-red-400" },
    Cancelled: { icon: <XCircle className="w-3.5 h-3.5" />, className: "bg-gray-500/10 text-gray-400" },
    TimedOut: { icon: <Clock className="w-3.5 h-3.5" />, className: "bg-amber-500/10 text-amber-400" },
    Executed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-purple-500/10 text-purple-400" },
  };

  const config = statusConfig[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
        config.className
      )}
    >
      {config.icon}
      {status}
    </span>
  );
}

// Progress bar component
function VotingProgress({
  votes,
  threshold,
}: {
  votes: ReferendumVoteInfo;
  threshold?: { approval: number; support: number };
}) {
  const approval = parseFloat(votes.approval);
  const support = parseFloat(votes.support);
  const approvalThreshold = threshold?.approval ?? 50;
  const supportThreshold = threshold?.support ?? 0;

  return (
    <div className="space-y-4">
      {/* Approval Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Approval</span>
          <span className="text-sm font-medium text-white">{approval.toFixed(1)}%</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(approval, 100)}%` }}
          />
          {/* Threshold marker */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white/50"
            style={{ left: `${approvalThreshold}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="text-white/50">{approvalThreshold}% threshold</span>
          <span>100%</span>
        </div>
      </div>

      {/* Support Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Support</span>
          <span className="text-sm font-medium text-white">{support.toFixed(2)}%</span>
        </div>
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(support * 10, 100)}%` }}
          />
          {supportThreshold > 0 && (
            <div
              className="absolute inset-y-0 w-0.5 bg-white/50"
              style={{ left: `${supportThreshold * 10}%` }}
            />
          )}
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-sm text-gray-400">Ayes</div>
            <div className="font-medium text-white">{votes.ayes} SEL</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsDown className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-sm text-gray-400">Nays</div>
            <div className="font-medium text-white">{votes.nays} SEL</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline component
function TimelineView({ timeline, currentBlock }: { timeline: ReferendumTimeline; currentBlock: number }) {
  const events = [
    { key: "created", label: "Created", block: timeline.created, icon: FileText },
    { key: "deciding", label: "Deciding", block: timeline.deciding, icon: Activity },
    { key: "confirming", label: "Confirming", block: timeline.confirming, icon: Clock },
    { key: "approved", label: "Approved", block: timeline.approved, icon: CheckCircle2, positive: true },
    { key: "rejected", label: "Rejected", block: timeline.rejected, icon: XCircle, negative: true },
    { key: "cancelled", label: "Cancelled", block: timeline.cancelled, icon: XCircle },
    { key: "timedOut", label: "Timed Out", block: timeline.timedOut, icon: AlertTriangle },
    { key: "executed", label: "Executed", block: timeline.executed, icon: CheckCircle2, positive: true },
  ].filter((e) => e.block !== null);

  return (
    <div className="space-y-4">
      {events.map((event, idx) => {
        const Icon = event.icon;
        const isPast = event.block !== null && event.block <= currentBlock;

        return (
          <div key={event.key} className="relative flex gap-4">
            {/* Connector line */}
            {idx < events.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-700" />
            )}

            {/* Icon */}
            <div
              className={clsx(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                isPast
                  ? event.positive
                    ? "bg-emerald-500/20"
                    : event.negative
                    ? "bg-red-500/20"
                    : "bg-purple-500/20"
                  : "bg-gray-800"
              )}
            >
              <Icon
                className={clsx(
                  "w-4 h-4",
                  isPast
                    ? event.positive
                      ? "text-emerald-400"
                      : event.negative
                      ? "text-red-400"
                      : "text-purple-400"
                    : "text-gray-500"
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span
                  className={clsx(
                    "font-medium",
                    isPast ? "text-white" : "text-gray-500"
                  )}
                >
                  {event.label}
                </span>
                {event.block && (
                  <span className="text-sm text-gray-500">
                    Block #{event.block.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Call details component
function CallDetails({ call }: { call: ReferendumCall }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <div className="font-medium text-white">
              {call.section}.{call.method}
            </div>
            {call.description && (
              <div className="text-sm text-gray-400">{call.description}</div>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-700">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            {JSON.stringify(call.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ReferendumDetailView({
  referendum,
  isLoading = false,
  onBack,
  onVote,
}: ReferendumDetailViewProps) {
  // Copy to clipboard
  const copyLink = useCallback(() => {
    if (!referendum) return;
    const link = `${window.location.origin}/governance/referendum/${referendum.index}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }, [referendum]);

  // Share
  const handleShare = useCallback(async () => {
    if (!referendum) return;
    const link = `${window.location.origin}/governance/referendum/${referendum.index}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Referendum #${referendum.index}`,
          text: referendum.title,
          url: link,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          copyLink();
        }
      }
    } else {
      copyLink();
    }
  }, [referendum, copyLink]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!referendum) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Referendum Not Found
        </h3>
        <p className="text-gray-400 mb-6">
          The referendum you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            Back to Referenda
          </button>
        )}
      </div>
    );
  }

  const trackColorClass = TRACK_COLORS[referendum.track.name.toLowerCase().replace(/ /g, "_")] || "bg-gray-500/10 text-gray-400";
  const blocksRemaining = referendum.status === "Ongoing" 
    ? Math.max(0, referendum.enactment.at - referendum.currentBlock)
    : 0;
  const estimatedTime = blocksRemaining > 0 
    ? `~${Math.ceil(blocksRemaining * 6 / 3600)} hours` 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy link"
          >
            <Link2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Title & Status */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">#{referendum.index}</span>
              <span className={clsx("px-2 py-0.5 rounded text-sm", trackColorClass)}>
                {referendum.track.name}
              </span>
              <StatusBadge status={referendum.status} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {referendum.title}
            </h1>
          </div>

          {referendum.status === "Ongoing" && onVote && (
            <button
              onClick={onVote}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors flex-shrink-0"
            >
              Vote Now
            </button>
          )}
        </div>

        {/* Proposer */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Proposed by</span>
          <IdentityDisplay address={referendum.proposer} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">
                {referendum.description}
              </p>
            </div>
          </div>

          {/* Call Details */}
          {referendum.call && (
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Proposed Call
              </h2>
              <CallDetails call={referendum.call} />
            </div>
          )}

          {/* Voting */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Voting</h2>
            <VotingProgress votes={referendum.votes} />
            
            <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Turnout</span>
                <div className="text-white font-medium">{referendum.votes.turnout}</div>
              </div>
              <div>
                <span className="text-gray-400">Total Issuance</span>
                <div className="text-white font-medium">{referendum.votes.totalIssuance}</div>
              </div>
            </div>
          </div>

          {/* Comments section placeholder */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussion
              </h2>
              <span className="text-sm text-gray-400">
                {referendum.comments} comments
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Discussion for this referendum happens on-chain and through governance forums.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 mt-3 text-purple-400 hover:text-purple-300 text-sm"
            >
              View on Subsquare
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Info */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Details</h3>
            <div className="space-y-4">
              {referendum.status === "Ongoing" && estimatedTime && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-sm text-gray-400">Time Remaining</div>
                    <div className="text-white font-medium">{estimatedTime}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Created at Block</div>
                  <div className="text-white font-medium">
                    #{referendum.timeline.created.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-400">Track</div>
                  <div className="text-white font-medium">{referendum.track.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deposits */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Deposits</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Submission Deposit</div>
                <div className="text-white font-medium">{referendum.submission.deposit} SEL</div>
                <div className="text-xs text-gray-500 mt-1">
                  by <AddressDisplay address={referendum.submission.who} type="substrate" />
                </div>
              </div>

              {referendum.decisionDeposit && (
                <div>
                  <div className="text-sm text-gray-400 mb-1">Decision Deposit</div>
                  <div className="text-white font-medium">{referendum.decisionDeposit.deposit} SEL</div>
                  <div className="text-xs text-gray-500 mt-1">
                    by <AddressDisplay address={referendum.decisionDeposit.who} type="substrate" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Timeline</h3>
            <TimelineView
              timeline={referendum.timeline}
              currentBlock={referendum.currentBlock}
            />
          </div>

          {/* Track Info */}
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Track Parameters</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Decision Period</span>
                <span className="text-white">{referendum.track.decisionPeriod} blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confirm Period</span>
                <span className="text-white">{referendum.track.confirmPeriod} blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Min Enactment</span>
                <span className="text-white">{referendum.track.minEnactmentPeriod} blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Decision Deposit</span>
                <span className="text-white">{referendum.track.decisionDeposit} SEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferendumDetailView;
