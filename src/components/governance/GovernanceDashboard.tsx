"use client";

import React, { useState, useEffect } from "react";
import {
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  Calendar,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Filter,
  Search,
  FileText,
  Scale,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/components/providers/WalletProvider";
import toast from "react-hot-toast";

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "passed" | "rejected" | "pending" | "executed";
  type: "treasury" | "runtime" | "council" | "referendum";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startDate: Date;
  endDate: Date;
  executionDate?: Date;
}

// TODO: Fetch from chain - pallet_democracy, pallet_treasury, pallet_collective
const mockProposals: Proposal[] = [];

export const GovernanceDashboard: React.FC = () => {
  const { isConnected, connectSubstrateWallet } = useWallet();

  // Create a connect helper
  const connect = () => connectSubstrateWallet();

  const [proposals, setProposals] = useState<Proposal[]>(mockProposals);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Proposal["status"]>(
    "all",
  );
  const [filterType, setFilterType] = useState<"all" | Proposal["type"]>("all");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );
  const [voteType, setVoteType] = useState<
    "for" | "against" | "abstain" | null
  >(null);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || proposal.status === filterStatus;
    const matchesType = filterType === "all" || proposal.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: Proposal["status"]) => {
    switch (status) {
      case "active":
        return "bg-blue-500/20 text-blue-400";
      case "passed":
        return "bg-green-500/20 text-green-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "executed":
        return "bg-purple-500/20 text-purple-400";
    }
  };

  const getStatusIcon = (status: Proposal["status"]) => {
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
    }
  };

  const getTypeColor = (type: Proposal["type"]) => {
    switch (type) {
      case "treasury":
        return "bg-yellow-500/20 text-yellow-400";
      case "runtime":
        return "bg-purple-500/20 text-purple-400";
      case "council":
        return "bg-cyan-500/20 text-cyan-400";
      case "referendum":
        return "bg-pink-500/20 text-pink-400";
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    if (diff < 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  // TODO: Fetch real governance stats from chain
  const stats = {
    activeProposals: proposals.filter((p) => p.status === "active").length,
    passedProposals: proposals.filter((p) => p.status === "passed").length,
    totalVoters: "N/A", // TODO: Query unique voters from pallet_democracy
    votingPower: "N/A", // TODO: Calculate from locked balance in pallet_democracy
  };

  const handleVote = () => {
    if (!isConnected) {
      connect();
      return;
    }
    // Simulate voting
    if (selectedProposal && voteType) {
      alert(`Vote submitted: ${voteType} for proposal ${selectedProposal.id}`);
      setSelectedProposal(null);
      setVoteType(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governance</h1>
          <p className="text-foreground-secondary mt-1">
            Participate in Selendra network governance
          </p>
        </div>
        <button
          onClick={() => toast("Proposal creation coming soon!")}
          className="px-4 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Create Proposal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Vote className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">
                Active Proposals
              </p>
              <p className="text-xl font-bold">{stats.activeProposals}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Passed</p>
              <p className="text-xl font-bold">{stats.passedProposals}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Total Voters</p>
              <p className="text-xl font-bold">{stats.totalVoters}</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Scale className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">
                Your Voting Power
              </p>
              <p className="text-xl font-bold">
                {isConnected ? stats.votingPower : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proposals..."
              className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as typeof filterStatus)
            }
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="treasury">Treasury</option>
            <option value="runtime">Runtime</option>
            <option value="council">Council</option>
            <option value="referendum">Referendum</option>
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="bg-background-card border border-border rounded-xl p-12 text-center">
            <Vote className="w-16 h-16 text-foreground-secondary mx-auto mb-4 opacity-50" />
            <p className="text-foreground-secondary text-lg mb-2">N/A</p>
            <p className="text-foreground-secondary text-sm">
              Governance proposals integration pending
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-background-card border border-border rounded-xl overflow-hidden hover:border-selendra-500/50 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(proposal.status)}`}
                      >
                        {getStatusIcon(proposal.status)}
                        {proposal.status.charAt(0).toUpperCase() +
                          proposal.status.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(proposal.type)}`}
                      >
                        {proposal.type.charAt(0).toUpperCase() +
                          proposal.type.slice(1)}
                      </span>
                      <span className="text-foreground-secondary text-sm">
                        #{proposal.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {proposal.title}
                    </h3>
                    <p className="text-foreground-secondary text-sm line-clamp-2 mb-4">
                      {proposal.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {proposal.totalVotes.toLocaleString()} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeRemaining(proposal.endDate)}
                      </span>
                      <Link
                        href={`/address/${proposal.proposer}`}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Proposer: {proposal.proposer.slice(0, 8)}...
                      </Link>
                    </div>
                  </div>
                  {proposal.status === "active" && (
                    <button
                      onClick={() => setSelectedProposal(proposal)}
                      className="px-6 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors font-medium"
                    >
                      Vote
                    </button>
                  )}
                </div>

                {/* Voting Progress */}
                {proposal.totalVotes > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-4">
                        <span className="text-green-400">
                          For:{" "}
                          {(
                            (proposal.votesFor / proposal.totalVotes) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                        <span className="text-red-400">
                          Against:{" "}
                          {(
                            (proposal.votesAgainst / proposal.totalVotes) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                        <span className="text-foreground-secondary">
                          Abstain:{" "}
                          {(
                            (proposal.votesAbstain / proposal.totalVotes) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <span className="text-foreground-secondary">
                        Quorum:{" "}
                        {(
                          (proposal.totalVotes / proposal.quorum) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-background-secondary rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(proposal.votesFor / proposal.totalVotes) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{
                          width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-gray-500 h-full"
                        style={{
                          width: `${(proposal.votesAbstain / proposal.totalVotes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Vote Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card border border-border rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Cast Your Vote</h3>
            <p className="text-foreground-secondary mb-6">
              {selectedProposal.title}
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setVoteType("for")}
                className={`w-full p-4 rounded-xl border transition-colors flex items-center gap-3 ${
                  voteType === "for"
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-background-secondary border-border hover:border-selendra-500/50"
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-medium">Vote For</span>
              </button>
              <button
                onClick={() => setVoteType("against")}
                className={`w-full p-4 rounded-xl border transition-colors flex items-center gap-3 ${
                  voteType === "against"
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-background-secondary border-border hover:border-selendra-500/50"
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="font-medium">Vote Against</span>
              </button>
              <button
                onClick={() => setVoteType("abstain")}
                className={`w-full p-4 rounded-xl border transition-colors flex items-center gap-3 ${
                  voteType === "abstain"
                    ? "bg-gray-500/20 border-gray-500 text-foreground-secondary"
                    : "bg-background-secondary border-border hover:border-selendra-500/50"
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Abstain</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setVoteType(null);
                }}
                className="flex-1 py-3 bg-background-secondary hover:bg-background-hover rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={!voteType}
                className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl transition-colors font-medium"
              >
                {isConnected ? "Submit Vote" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
