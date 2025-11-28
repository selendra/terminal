"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowLeft,
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Calendar,
  FileText,
  MessageSquare,
  Share2,
  Copy,
  History,
  Wallet,
  Scale,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ProposalDetailViewProps {
  proposalId: string;
}

type ProposalStatus = "active" | "passed" | "rejected" | "pending" | "executed";
type ProposalType = "treasury" | "runtime" | "council" | "referendum";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  proposerName: string;
  status: ProposalStatus;
  type: ProposalType;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  depositAmount: string;
  executionDelay: string;
  discussionLink?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  voteType?: "for" | "against" | "abstain";
}

interface VoteRecord {
  voter: string;
  voteType: "for" | "against" | "abstain";
  votingPower: string;
  timestamp: Date;
  transactionHash: string;
}

// Mock proposal data
const mockProposal: Proposal = {
  id: "1",
  title: "Increase Validator Set to 100",
  description: `## Summary
Proposal to increase the active validator set from 50 to 100 validators to improve network decentralization and security.

## Motivation
As the Selendra network grows, increasing the validator set will:
- Improve decentralization
- Enhance network security
- Provide more opportunities for community participation
- Distribute block rewards more widely

## Specification
- Increase MAX_VALIDATORS from 50 to 100
- Adjust minimum stake requirements proportionally
- Implement gradual rollout over 3 epochs

## Implementation
The runtime upgrade will be executed in the next epoch after the proposal passes.`,
  proposer: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  proposerName: "Selendra Foundation",
  status: "active" as const,
  type: "runtime" as const,
  votesFor: 450000,
  votesAgainst: 125000,
  votesAbstain: 25000,
  totalVotes: 600000,
  quorum: 500000,
  startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  depositAmount: "10,000 SEL",
  executionDelay: "24 hours",
  discussionLink: "https://forum.selendra.org/proposal-1",
};

const mockComments: Comment[] = [
  {
    id: "1",
    author: "0x1234...5678",
    content: "Strong support for this proposal. More validators means better decentralization.",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    voteType: "for",
  },
  {
    id: "2",
    author: "0xabcd...ef01",
    content: "Concerned about the impact on individual validator rewards. Has this been modeled?",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    voteType: "against",
  },
  {
    id: "3",
    author: "0x9876...5432",
    content: "The gradual rollout approach is sensible. Voting in favor.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    voteType: "for",
  },
];

const mockVoteRecords: VoteRecord[] = [
  {
    voter: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    voteType: "for",
    votingPower: "125,000 SEL",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    transactionHash: "0xabc123...",
  },
  {
    voter: "0x55d398326f99059ff775485246999027b3197955",
    voteType: "for",
    votingPower: "89,500 SEL",
    timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
    transactionHash: "0xdef456...",
  },
  {
    voter: "0x1234567890abcdef1234567890abcdef12345678",
    voteType: "against",
    votingPower: "67,200 SEL",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    transactionHash: "0xghi789...",
  },
  {
    voter: "0xabcdef1234567890abcdef1234567890abcdef12",
    voteType: "for",
    votingPower: "45,000 SEL",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    transactionHash: "0xjkl012...",
  },
  {
    voter: "0xfedcba0987654321fedcba0987654321fedcba09",
    voteType: "abstain",
    votingPower: "25,000 SEL",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    transactionHash: "0xmno345...",
  },
];

export function ProposalDetailView({ proposalId }: ProposalDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "votes" | "discussion" | "history">("overview");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteType, setVoteType] = useState<"for" | "against" | "abstain" | null>(null);
  const [isWalletConnected] = useState(false); // Mock wallet state

  const proposal = mockProposal;
  const comments = mockComments;
  const voteRecords = mockVoteRecords;

  const getStatusColor = (status: typeof proposal.status) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "passed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "executed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-foreground-secondary border-gray-500/30";
    }
  };

  const getStatusIcon = (status: typeof proposal.status) => {
    switch (status) {
      case "active":
        return <Vote className="w-4 h-4" />;
      case "passed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "executed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Vote className="w-4 h-4" />;
    }
  };

  const getVoteTypeIcon = (type: "for" | "against" | "abstain") => {
    switch (type) {
      case "for":
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "against":
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case "abstain":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    if (diff < 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const handleVote = () => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet to vote");
      return;
    }
    if (voteType) {
      toast.success(`Vote submitted: ${voteType}`);
      setShowVoteModal(false);
      setVoteType(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/governance")}
        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Proposals
      </button>

      {/* Header */}
      <div className="bg-background-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={clsx(
                  "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border",
                  getStatusColor(proposal.status)
                )}
              >
                {getStatusIcon(proposal.status)}
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium">
                {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
              </span>
              <span className="text-foreground-secondary text-sm">
                Proposal #{proposal.id}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {proposal.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-foreground-secondary">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Proposed by{" "}
                <Link
                  href={`/address/${proposal.proposer}`}
                  className="text-selendra-500 hover:text-selendra-600"
                >
                  {proposal.proposerName}
                </Link>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {proposal.createdAt.toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-foreground-secondary hover:text-foreground rounded-lg hover:bg-background-hover transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            {proposal.discussionLink && (
              <a
                href={proposal.discussionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-foreground-secondary hover:text-foreground rounded-lg hover:bg-background-hover transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Voting Progress */}
        <div className="mt-6 p-4 bg-background-secondary rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-green-500 font-medium">
                For: {((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}%
              </span>
              <span className="text-red-500 font-medium">
                Against: {((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)}%
              </span>
              <span className="text-foreground-secondary">
                Abstain: {((proposal.votesAbstain / proposal.totalVotes) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">
                Quorum: {((proposal.totalVotes / proposal.quorum) * 100).toFixed(1)}%
              </span>
              {proposal.totalVotes >= proposal.quorum && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          </div>
          <div className="h-3 bg-background-tertiary rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 h-full transition-all"
              style={{ width: `${(proposal.votesFor / proposal.totalVotes) * 100}%` }}
            />
            <div
              className="bg-red-500 h-full transition-all"
              style={{ width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%` }}
            />
            <div
              className="bg-gray-400 h-full transition-all"
              style={{ width: `${(proposal.votesAbstain / proposal.totalVotes) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-foreground-secondary">
              {proposal.totalVotes.toLocaleString()} total votes
            </span>
            <span className="flex items-center gap-1 text-orange-500">
              <Clock className="w-4 h-4" />
              {formatTimeRemaining(proposal.endDate)}
            </span>
          </div>
        </div>

        {/* Vote Button */}
        {proposal.status === "active" && (
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setShowVoteModal(true)}
              className="flex-1 py-3 bg-selendra-500 hover:bg-selendra-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Vote className="w-5 h-5" />
              Cast Your Vote
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Deposit</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {proposal.depositAmount}
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-sm">Quorum Required</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {proposal.quorum.toLocaleString()} SEL
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Execution Delay</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {proposal.executionDelay}
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Unique Voters</span>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {voteRecords.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: FileText },
            { id: "votes", label: "Votes", icon: Vote },
            { id: "discussion", label: "Discussion", icon: MessageSquare },
            { id: "history", label: "History", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-selendra-500 text-selendra-500"
                  : "border-transparent text-foreground-secondary hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-background-card rounded-xl border border-border p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground-secondary">
              {proposal.description}
            </div>
          </div>
        </div>
      )}

      {activeTab === "votes" && (
        <div className="bg-background-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Voter
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Vote
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Voting Power
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {voteRecords.map((record, idx) => (
                  <tr key={idx} className="hover:bg-background-hover">
                    <td className="py-3 px-4">
                      <Link
                        href={`/address/${record.voter}`}
                        className="font-mono text-sm text-selendra-500 hover:text-selendra-600"
                      >
                        {record.voter.slice(0, 10)}...{record.voter.slice(-8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getVoteTypeIcon(record.voteType)}
                        <span
                          className={clsx(
                            "text-sm font-medium capitalize",
                            record.voteType === "for" && "text-green-500",
                            record.voteType === "against" && "text-red-500",
                            record.voteType === "abstain" && "text-foreground-secondary"
                          )}
                        >
                          {record.voteType}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {record.votingPower}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground-secondary">
                      {record.timestamp.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/tx/${record.transactionHash}`}
                        className="font-mono text-sm text-selendra-500 hover:text-selendra-600"
                      >
                        {record.transactionHash}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "discussion" && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-background-card rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/address/${comment.author}`}
                    className="font-mono text-sm text-selendra-500 hover:text-selendra-600"
                  >
                    {comment.author}
                  </Link>
                  {comment.voteType && (
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded text-xs flex items-center gap-1",
                        comment.voteType === "for" && "bg-green-500/20 text-green-500",
                        comment.voteType === "against" && "bg-red-500/20 text-red-500",
                        comment.voteType === "abstain" && "bg-gray-500/20 text-foreground-secondary"
                      )}
                    >
                      {getVoteTypeIcon(comment.voteType)}
                      Voted {comment.voteType}
                    </span>
                  )}
                </div>
                <span className="text-xs text-foreground-secondary">
                  {comment.timestamp.toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground-secondary">{comment.content}</p>
            </div>
          ))}

          {/* Add Comment Form */}
          <div className="bg-background-card rounded-xl border border-border p-4">
            <textarea
              placeholder="Share your thoughts on this proposal..."
              className="w-full p-3 bg-background-secondary border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-selendra-500 text-foreground"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button className="px-4 py-2 bg-selendra-500 hover:bg-selendra-600 text-white rounded-lg font-medium transition-colors">
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-background-card rounded-xl border border-border p-6">
          <div className="space-y-4">
            {[
              {
                event: "Proposal Created",
                date: proposal.createdAt,
                description: "Proposal submitted by proposer",
              },
              {
                event: "Voting Started",
                date: proposal.startDate,
                description: "Community voting period began",
              },
              {
                event: "Quorum Reached",
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                description: "Minimum participation threshold met",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-selendra-500 mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      {item.event}
                    </h4>
                    <span className="text-sm text-foreground-secondary">
                      {item.date.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card border border-border rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-selendra-500/20 rounded-lg">
                <Gavel className="w-6 h-6 text-selendra-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Cast Your Vote
                </h3>
                <p className="text-sm text-foreground-secondary">
                  Proposal #{proposal.id}
                </p>
              </div>
            </div>

            <p className="text-foreground-secondary mb-6">{proposal.title}</p>

            <div className="space-y-3 mb-6">
              {(["for", "against", "abstain"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setVoteType(type)}
                  className={clsx(
                    "w-full p-4 rounded-xl border transition-colors flex items-center gap-3",
                    voteType === type
                      ? type === "for"
                        ? "bg-green-500/20 border-green-500 text-green-500"
                        : type === "against"
                        ? "bg-red-500/20 border-red-500 text-red-500"
                        : "bg-gray-500/20 border-gray-500 text-foreground-secondary"
                      : "bg-background-secondary border-border hover:border-selendra-500/50"
                  )}
                >
                  {type === "for" ? (
                    <ThumbsUp className="w-5 h-5" />
                  ) : type === "against" ? (
                    <ThumbsDown className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium capitalize">Vote {type}</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-background-secondary rounded-lg mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground-secondary">Your Voting Power</span>
                <span className="font-medium text-foreground">
                  {isWalletConnected ? "1,250.00 SEL" : "Connect wallet"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowVoteModal(false);
                  setVoteType(null);
                }}
                className="flex-1 py-3 bg-background-secondary hover:bg-background-hover text-foreground-secondary rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={!voteType}
                className="flex-1 py-3 bg-selendra-500 hover:bg-selendra-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
              >
                {isWalletConnected ? "Submit Vote" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
