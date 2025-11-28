'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Code,
  ArrowUpDown,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Mock data for top accounts
const mockAccounts = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1E3B2',
    name: 'Selendra Treasury',
    type: 'contract' as const,
    balance: '125,432,567.89',
    txCount: 15234,
    percentage: 12.5,
  },
  {
    address: '0x8Ba1f109551bD432803012645Hac136c22C5aaD',
    name: 'Validator Pool',
    type: 'contract' as const,
    balance: '89,234,123.45',
    txCount: 8921,
    percentage: 8.9,
  },
  {
    address: '0x4E83362442B8d1beC281594ceA3052C8A2E46671',
    name: null,
    type: 'eoa' as const,
    balance: '45,678,901.23',
    txCount: 4521,
    percentage: 4.6,
  },
  {
    address: '0x9A5DE31a8D6F9E2a0B3C4D5E6F7A8B9C0D1E2F3A',
    name: 'Staking Contract',
    type: 'contract' as const,
    balance: '34,567,890.12',
    txCount: 12456,
    percentage: 3.5,
  },
  {
    address: '0xB7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6',
    name: null,
    type: 'eoa' as const,
    balance: '23,456,789.01',
    txCount: 2341,
    percentage: 2.3,
  },
  {
    address: '0xC8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7',
    name: 'Bridge Contract',
    type: 'contract' as const,
    balance: '19,876,543.21',
    txCount: 9876,
    percentage: 2.0,
  },
  {
    address: '0xD9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8',
    name: null,
    type: 'eoa' as const,
    balance: '15,432,109.87',
    txCount: 1543,
    percentage: 1.5,
  },
  {
    address: '0xE0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9',
    name: 'Governance',
    type: 'contract' as const,
    balance: '12,345,678.90',
    txCount: 6789,
    percentage: 1.2,
  },
  {
    address: '0xF1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0',
    name: null,
    type: 'eoa' as const,
    balance: '9,876,543.21',
    txCount: 987,
    percentage: 1.0,
  },
  {
    address: '0xA2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1',
    name: 'DEX Router',
    type: 'contract' as const,
    balance: '8,765,432.10',
    txCount: 23456,
    percentage: 0.9,
  },
];

type AccountType = 'all' | 'eoa' | 'contract';

export function AccountsExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>('all');
  const [sortBy, setSortBy] = useState<'balance' | 'txCount'>('balance');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const itemsPerPage = 10;

  const filteredAccounts = mockAccounts.filter((account) => {
    const matchesSearch =
      account.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (account.name && account.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = accountType === 'all' || account.type === accountType;
    return matchesSearch && matchesType;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (sortBy === 'balance') {
      return parseFloat(b.balance.replace(/,/g, '')) - parseFloat(a.balance.replace(/,/g, ''));
    }
    return b.txCount - a.txCount;
  });

  const totalPages = Math.ceil(sortedAccounts.length / itemsPerPage);
  const paginatedAccounts = sortedAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast.success('Address copied');
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-selendra-500" />
            Top Accounts
          </h1>
          <p className="text-foreground-secondary mt-1">
            Browse top accounts by balance on Selendra network
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Search by address or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full md:w-80 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Total Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">1,234,567</p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">EOA Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">1,189,432</p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Contract Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">45,135</p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Active Today</p>
          <p className="text-2xl font-bold text-foreground mt-1">23,456</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-foreground-secondary text-sm">Type:</span>
          <div className="flex rounded-lg overflow-hidden border border-border">
            {(['all', 'eoa', 'contract'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setAccountType(type)}
                className={cn(
                  'px-4 py-2 text-sm transition-colors',
                  accountType === type
                    ? 'bg-selendra-500 text-white'
                    : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
                )}
              >
                {type === 'all' ? 'All' : type === 'eoa' ? 'EOA' : 'Contract'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground-secondary text-sm">Sort by:</span>
          <button
            onClick={() => setSortBy(sortBy === 'balance' ? 'txCount' : 'balance')}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-border rounded-lg text-foreground hover:bg-background-hover transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortBy === 'balance' ? 'Balance' : 'Transactions'}
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-foreground-secondary font-medium text-sm">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-foreground-secondary font-medium text-sm">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-foreground-secondary font-medium text-sm">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-foreground-secondary font-medium text-sm">
                  Balance
                </th>
                <th className="px-6 py-4 text-right text-foreground-secondary font-medium text-sm">
                  % of Supply
                </th>
                <th className="px-6 py-4 text-right text-foreground-secondary font-medium text-sm">
                  Txn Count
                </th>
                <th className="px-6 py-4 text-center text-foreground-secondary font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedAccounts.map((account, index) => (
                <tr
                  key={account.address}
                  className="hover:bg-background-hover transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-foreground font-medium">
                      #{(currentPage - 1) * itemsPerPage + index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/address/${account.address}`}
                        className="text-selendra-400 hover:text-selendra-300 font-mono"
                      >
                        {truncateAddress(account.address)}
                      </Link>
                      <button
                        onClick={() => copyAddress(account.address)}
                        className="text-foreground-secondary hover:text-foreground transition-colors"
                      >
                        {copiedAddress === account.address ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      {account.name && (
                        <span className="px-2 py-0.5 bg-selendra-500/20 text-selendra-400 text-xs rounded-full">
                          {account.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {account.type === 'contract' ? (
                        <>
                          <Code className="h-4 w-4 text-purple-400" />
                          <span className="text-foreground">Contract</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 text-blue-400" />
                          <span className="text-foreground">EOA</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-foreground font-medium">
                      {account.balance} SEL
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-foreground-secondary">
                      {account.percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-foreground-secondary">
                      {account.txCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/address/${account.address}`}
                      className="inline-flex items-center gap-1 text-selendra-400 hover:text-selendra-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-foreground-secondary text-sm">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedAccounts.length)} of{' '}
            {sortedAccounts.length} accounts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-background-secondary border border-border text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-10 h-10 rounded-lg transition-colors',
                  currentPage === page
                    ? 'bg-selendra-500 text-white'
                    : 'bg-background-secondary border border-border text-foreground-secondary hover:text-foreground'
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-background-secondary border border-border text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
