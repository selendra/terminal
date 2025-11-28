'use client';

import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  Users,
  ChevronRight,
  CheckCircle,
  XCircle,
  Timer,
  Coins,
  PiggyBank,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreasuryStats {
  balance: string;
  balanceUSD: string;
  nextSpendPeriod: number;
  spendPeriodProgress: number;
  pendingProposals: number;
  approvedProposals: number;
  totalSpent: string;
  burn: string;
}

interface Proposal {
  id: number;
  beneficiary: string;
  beneficiaryName?: string;
  value: string;
  valueUSD: string;
  bond: string;
  status: 'pending' | 'approved' | 'rejected';
  proposer: string;
  description: string;
  createdAt: string;
  council: { ayes: number; nays: number };
}

interface Spending {
  id: number;
  beneficiary: string;
  beneficiaryName?: string;
  value: string;
  valueUSD: string;
  block: number;
  timestamp: string;
  proposal: number;
}

const mockStats: TreasuryStats = {
  balance: '2,450,000 SEL',
  balanceUSD: '$735,000',
  nextSpendPeriod: 86400, // seconds
  spendPeriodProgress: 65,
  pendingProposals: 5,
  approvedProposals: 23,
  totalSpent: '5,200,000 SEL',
  burn: '520,000 SEL',
};

const mockProposals: Proposal[] = [
  {
    id: 12,
    beneficiary: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    beneficiaryName: 'Selendra Foundation',
    value: '150,000 SEL',
    valueUSD: '$45,000',
    bond: '7,500 SEL',
    status: 'pending',
    proposer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    description: 'Developer grant program for Q1 2025 - supporting open source development on Selendra',
    createdAt: '2025-01-10',
    council: { ayes: 4, nays: 2 },
  },
  {
    id: 11,
    beneficiary: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    beneficiaryName: 'DeFi Team',
    value: '80,000 SEL',
    valueUSD: '$24,000',
    bond: '4,000 SEL',
    status: 'approved',
    proposer: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    description: 'Liquidity incentive program for DEX pools',
    createdAt: '2025-01-08',
    council: { ayes: 6, nays: 1 },
  },
  {
    id: 10,
    beneficiary: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
    value: '25,000 SEL',
    valueUSD: '$7,500',
    bond: '1,250 SEL',
    status: 'rejected',
    proposer: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
    description: 'Marketing campaign for Southeast Asia expansion',
    createdAt: '2025-01-05',
    council: { ayes: 2, nays: 5 },
  },
  {
    id: 9,
    beneficiary: '5Ew3MyB15VprZrjQVkpQFj8okmc9xLDSEdNhqMMS5cXsqxoW',
    beneficiaryName: 'Infrastructure DAO',
    value: '200,000 SEL',
    valueUSD: '$60,000',
    bond: '10,000 SEL',
    status: 'pending',
    proposer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    description: 'RPC node infrastructure upgrade and maintenance',
    createdAt: '2025-01-12',
    council: { ayes: 3, nays: 0 },
  },
];

const mockSpending: Spending[] = [
  {
    id: 1,
    beneficiary: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    beneficiaryName: 'Selendra Foundation',
    value: '100,000 SEL',
    valueUSD: '$30,000',
    block: 1520000,
    timestamp: '2025-01-09 14:30',
    proposal: 8,
  },
  {
    id: 2,
    beneficiary: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    beneficiaryName: 'Ecosystem Fund',
    value: '50,000 SEL',
    valueUSD: '$15,000',
    block: 1515000,
    timestamp: '2025-01-06 10:15',
    proposal: 7,
  },
  {
    id: 3,
    beneficiary: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
    value: '75,000 SEL',
    valueUSD: '$22,500',
    block: 1510000,
    timestamp: '2025-01-03 08:45',
    proposal: 6,
  },
];

function formatAddress(address: string): string {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function TreasuryDashboard() {
  const [activeTab, setActiveTab] = useState<'proposals' | 'spending'>('proposals');
  const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredProposals = mockProposals.filter((proposal) => {
    if (proposalFilter === 'all') return true;
    return proposal.status === proposalFilter;
  });

  const getStatusBadge = (status: Proposal['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
            <Timer className="h-3 w-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treasury</h1>
          <p className="text-foreground-secondary mt-1">Network treasury and spending proposals</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-selendra-primary text-white rounded-lg hover:bg-selendra-primary/90 transition-colors">
          <FileText className="h-4 w-4" />
          Submit Proposal
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">Treasury Balance</span>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <PiggyBank className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{mockStats.balance}</p>
          <p className="text-sm text-foreground-secondary mt-1">≈ {mockStats.balanceUSD}</p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">Total Spent</span>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Coins className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{mockStats.totalSpent}</p>
          <p className="text-sm text-foreground-secondary mt-1">{mockStats.approvedProposals} proposals funded</p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">Pending Proposals</span>
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Receipt className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{mockStats.pendingProposals}</p>
          <p className="text-sm text-foreground-secondary mt-1">Awaiting council vote</p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-foreground-secondary text-sm">Next Spend Period</span>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatTimeRemaining(mockStats.nextSpendPeriod)}</p>
          <div className="mt-2">
            <div className="w-full bg-selendra-dark rounded-full h-2">
              <div
                className="bg-selendra-primary h-2 rounded-full transition-all"
                style={{ width: `${mockStats.spendPeriodProgress}%` }}
              />
            </div>
            <p className="text-xs text-foreground-secondary mt-1">{mockStats.spendPeriodProgress}% of period elapsed</p>
          </div>
        </div>
      </div>

      {/* Treasury Distribution */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Treasury Distribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Development</span>
              <span className="text-foreground font-medium">45%</span>
            </div>
            <div className="w-full bg-selendra-dark rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Marketing</span>
              <span className="text-foreground font-medium">25%</span>
            </div>
            <div className="w-full bg-selendra-dark rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Infrastructure</span>
              <span className="text-foreground font-medium">30%</span>
            </div>
            <div className="w-full bg-selendra-dark rounded-full h-3">
              <div className="bg-purple-500 h-3 rounded-full" style={{ width: '30%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-selendra-border">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('proposals')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'proposals'
                ? 'border-selendra-primary text-foreground'
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            )}
          >
            Proposals
          </button>
          <button
            onClick={() => setActiveTab('spending')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === 'spending'
                ? 'border-selendra-primary text-foreground'
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            )}
          >
            Recent Spending
          </button>
        </nav>
      </div>

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setProposalFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  proposalFilter === filter
                    ? 'bg-selendra-primary text-white'
                    : 'bg-selendra-card text-foreground-secondary hover:text-foreground'
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-selendra-card border border-selendra-border rounded-xl p-5 hover:border-selendra-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-selendra-primary font-mono">#{proposal.id}</span>
                      {getStatusBadge(proposal.status)}
                    </div>
                    <p className="text-foreground font-medium mb-2">{proposal.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground-secondary">Beneficiary:</span>
                        <span className="text-foreground font-mono">
                          {proposal.beneficiaryName || formatAddress(proposal.beneficiary)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground-secondary">Value:</span>
                        <span className="text-green-400 font-medium">{proposal.value}</span>
                        <span className="text-foreground-secondary">({proposal.valueUSD})</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-foreground-secondary flex-shrink-0" />
                </div>

                {/* Council Votes */}
                <div className="mt-4 pt-4 border-t border-selendra-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Council Votes</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {proposal.council.ayes} Aye
                      </span>
                      <span className="text-sm text-red-400 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {proposal.council.nays} Nay
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-selendra-dark rounded-full h-2 flex overflow-hidden">
                    <div
                      className="bg-green-500 h-2"
                      style={{
                        width: `${(proposal.council.ayes / (proposal.council.ayes + proposal.council.nays)) * 100 || 0}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 h-2"
                      style={{
                        width: `${(proposal.council.nays / (proposal.council.ayes + proposal.council.nays)) * 100 || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Tab */}
      {activeTab === 'spending' && (
        <div className="bg-selendra-card border border-selendra-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-selendra-dark/50">
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Proposal</th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Beneficiary</th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Value</th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Block</th>
                  <th className="text-left py-4 px-6 text-foreground-secondary font-medium text-sm">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-selendra-border">
                {mockSpending.map((spending) => (
                  <tr key={spending.id} className="hover:bg-selendra-dark/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-selendra-primary font-mono">#{spending.proposal}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        {spending.beneficiaryName && (
                          <p className="text-foreground font-medium">{spending.beneficiaryName}</p>
                        )}
                        <p className="text-foreground-secondary font-mono text-sm">{formatAddress(spending.beneficiary)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-green-400 font-medium">{spending.value}</p>
                      <p className="text-foreground-secondary text-sm">{spending.valueUSD}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground font-mono">{spending.block.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground-secondary">{spending.timestamp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Burn Notice */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <TrendingDown className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-foreground font-medium mb-1">Treasury Burn</h3>
            <p className="text-foreground-secondary text-sm">
              At the end of each spend period, any unspent treasury funds are burned. Current burn rate is 1% per period.
              Total burned so far: <span className="text-orange-400 font-medium">{mockStats.burn}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
