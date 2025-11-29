'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Code,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { AddressDisplay } from '@/components/common/AddressDisplay';
import { VMBadge } from '@/components/common/VMBadge';
import { useTopAccounts, useAccountsCount } from '@/lib/hooks/useIndexerAccount';
import { useIndexerStatus } from '@/lib/hooks/useIndexerStatus';
import { IndexerAccount } from '@/lib/api/graphql';

type AccountType = 'all' | 'eoa' | 'contract';
type SortBy = 'balance' | 'txCount';

// Format balance from raw value
function formatBalance(value: string): string {
  try {
    const val = BigInt(value);
    const decimals = 18;
    const whole = val / BigInt(10 ** decimals);
    const fraction = val % BigInt(10 ** decimals);
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 2);
    return `${whole.toLocaleString()}.${fractionStr}`;
  } catch {
    return '0.00';
  }
}

// Calculate percentage of total supply
function calculatePercentage(balance: string, totalSupply: bigint): string {
  try {
    const val = BigInt(balance);
    if (totalSupply === BigInt(0)) return '0.00';
    const percentage = (val * BigInt(10000)) / totalSupply;
    return (Number(percentage) / 100).toFixed(2);
  } catch {
    return '0.00';
  }
}

// Determine if an account is a contract (heuristic: has EVM address but no transfers indicates contract)
function isContract(account: IndexerAccount): boolean {
  // Simple heuristic: if it has evmAddress and low nonce, could be a contract
  // In a real implementation, you'd check the code at the address
  return account.evmAddress !== null && account.evmNonce === 0 && account.transactionCount > 100;
}

export function AccountsExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('balance');
  const itemsPerPage = 10;

  // Fetch top accounts from indexer
  const { data: accounts, isLoading, error, refetch } = useTopAccounts({
    first: 100, // Get more for filtering
    orderBy: sortBy,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get total account count
  const { data: totalAccountCount } = useAccountsCount();

  // Get indexer sync status
  const { data: syncStatus } = useIndexerStatus();

  // Calculate total supply from loaded accounts (rough estimate)
  const totalSupply = useMemo(() => {
    if (!accounts || accounts.length === 0) return BigInt(0);
    // For real implementation, fetch total supply from chain
    // For now, estimate from top accounts
    return accounts.reduce((sum, acc) => {
      try {
        return sum + BigInt(acc.freeBalance);
      } catch {
        return sum;
      }
    }, BigInt(0)) * BigInt(3); // Rough multiplier to estimate total
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter((account) => {
      const matchesSearch =
        !searchQuery ||
        account.substrateAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.evmAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.identityDisplay?.toLowerCase().includes(searchQuery.toLowerCase());

      const isContractAccount = isContract(account);
      const matchesType =
        accountType === 'all' ||
        (accountType === 'contract' && isContractAccount) ||
        (accountType === 'eoa' && !isContractAccount);

      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, accountType]);

  // Paginate
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    totalAccounts: totalAccountCount || accounts?.length || 0,
    eoaAccounts: accounts?.filter((a) => !isContract(a)).length || 0,
    contractAccounts: accounts?.filter((a) => isContract(a)).length || 0,
    indexerBlock: syncStatus?.indexerBlock || 0,
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

        <div className="flex items-center gap-3">
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
          
          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && syncStatus.lag > 100 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-yellow-400">
              Indexer is syncing: {syncStatus.indexerBlock.toLocaleString()} / {syncStatus.chainBlock.toLocaleString()} blocks
            </p>
            <p className="text-xs text-yellow-500/70">
              Account data may not be fully updated yet
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Total Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.totalAccounts.toLocaleString()}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">EOA Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.eoaAccounts.toLocaleString()}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Contract Accounts</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.contractAccounts.toLocaleString()}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-foreground-secondary text-sm">Indexed Block</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {stats.indexerBlock.toLocaleString()}
          </p>
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
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-selendra-500" />
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center text-red-400">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>Failed to load accounts</p>
            <p className="text-sm text-foreground-secondary mt-1">{error.message}</p>
          </div>
        ) : paginatedAccounts.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-foreground-secondary">
            <Wallet className="w-12 h-12 mb-4 opacity-50" />
            <p>No accounts found</p>
            <p className="text-sm mt-1">The indexer is still syncing account data</p>
          </div>
        ) : (
          <>
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
                  {paginatedAccounts.map((account, index) => {
                    const isContractAccount = isContract(account);
                    const displayAddress = account.evmAddress || account.substrateAddress;
                    const percentage = calculatePercentage(account.freeBalance, totalSupply);

                    return (
                      <tr
                        key={account.id}
                        className="hover:bg-background-hover transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-foreground font-medium">
                            #{(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <AddressDisplay
                              address={displayAddress}
                              size="sm"
                              showCopy
                              showToggle={false}
                              linkToAccount
                            />
                            {account.identityDisplay && (
                              <span className="px-2 py-0.5 bg-selendra-500/20 text-selendra-400 text-xs rounded-full">
                                {account.identityDisplay}
                              </span>
                            )}
                            {account.identityVerified && (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isContractAccount ? (
                              <>
                                <Code className="h-4 w-4 text-purple-400" />
                                <span className="text-foreground">Contract</span>
                              </>
                            ) : (
                              <>
                                <VMBadge vm={account.evmAddress ? 'evm' : 'substrate'} size="sm" />
                                <span className="text-foreground">EOA</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-foreground font-medium">
                            {formatBalance(account.freeBalance)} SEL
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-foreground-secondary">
                            {percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-foreground-secondary">
                            {account.transactionCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/address/${displayAddress}`}
                            className="inline-flex items-center gap-1 text-selendra-400 hover:text-selendra-300 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-foreground-secondary text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} of{' '}
                {filteredAccounts.length} accounts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-background-secondary border border-border text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        'w-10 h-10 rounded-lg transition-colors',
                        currentPage === pageNum
                          ? 'bg-selendra-500 text-white'
                          : 'bg-background-secondary border border-border text-foreground-secondary hover:text-foreground'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg bg-background-secondary border border-border text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
