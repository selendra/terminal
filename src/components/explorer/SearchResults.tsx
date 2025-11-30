'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    Box,
    FileText,
    User,
    Coins,
    AlertCircle,
    ArrowRight,
    Loader2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { indexerClient, IndexerAccount, IndexerTransaction, IndexerBlock } from '@/lib/api/graphql';
import { detectSearchType, SearchResultType } from '@/lib/search';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { VMBadge } from '@/components/common/VMBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { cn } from '@/lib/utils';

interface SearchResultItem {
    type: 'block' | 'transaction' | 'account' | 'token';
    title: string;
    subtitle: string;
    href: string;
    icon: React.ReactNode;
    metadata?: Record<string, string | number | boolean>;
}

interface SearchResultsProps {
    query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchedQuery, setSearchedQuery] = useState('');

    useEffect(() => {
        if (!query) {
            setIsLoading(false);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            setError(null);
            setSearchedQuery(query);

            try {
                const searchResults: SearchResultItem[] = [];

                // First, detect the type of search
                const detected = detectSearchType(query);

                // If we can definitively route, do so immediately
                if (detected.type !== 'not-found' && detected.redirectUrl) {
                    // For single matches, redirect directly
                    if (['block', 'transaction', 'substrate-account', 'evm-account'].includes(detected.type)) {
                        router.push(detected.redirectUrl);
                        return;
                    }
                }

                // Otherwise, search across multiple types
                const searches = await Promise.allSettled([
                    // Search for matching block
                    (async () => {
                        if (/^\d+$/.test(query)) {
                            const blockNumber = parseInt(query, 10);
                            const block = await indexerClient.getBlock(blockNumber);
                            if (block) {
                                return {
                                    type: 'block' as const,
                                    title: `Block #${block.number.toLocaleString()}`,
                                    subtitle: truncateHash(block.hash),
                                    href: `/blocks/${block.number}`,
                                    icon: <Box className="w-5 h-5 text-purple-400" />,
                                    metadata: {
                                        extrinsics: block.extrinsicCount,
                                        events: block.eventCount,
                                        finalized: block.isFinalized,
                                    },
                                };
                            }
                        }
                        return null;
                    })(),

                    // Search for transaction by hash
                    (async () => {
                        if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
                            const tx = await indexerClient.getTransaction(query);
                            if (tx) {
                                return {
                                    type: 'transaction' as const,
                                    title: truncateHash(tx.hash),
                                    subtitle: `${tx.type} • ${tx.status}`,
                                    href: `/tx/${tx.hash}`,
                                    icon: <FileText className="w-5 h-5 text-blue-400" />,
                                    metadata: {
                                        block: tx.blockNumber,
                                        status: tx.status,
                                        type: tx.type,
                                    },
                                };
                            }
                        }
                        return null;
                    })(),

                    // Search for accounts
                    (async () => {
                        const accounts = await indexerClient.searchAccounts(query, 5);
                        return accounts.map((account) => ({
                            type: 'account' as const,
                            title: account.identityDisplay || truncateAddress(account.substrateAddress),
                            subtitle: account.evmAddress
                                ? `${truncateAddress(account.substrateAddress)} / ${truncateAddress(account.evmAddress)}`
                                : truncateAddress(account.substrateAddress),
                            href: `/address/${account.substrateAddress}`,
                            icon: <User className="w-5 h-5 text-cyan-400" />,
                            metadata: {
                                balance: formatBalance(account.freeBalance),
                                transactions: account.transactionCount,
                                verified: account.identityVerified,
                            },
                        }));
                    })(),
                ]);

                // Collect successful results
                for (const result of searches) {
                    if (result.status === 'fulfilled' && result.value) {
                        if (Array.isArray(result.value)) {
                            searchResults.push(...result.value);
                        } else {
                            searchResults.push(result.value);
                        }
                    }
                }

                setResults(searchResults);

                // If exactly one result, redirect to it
                if (searchResults.length === 1) {
                    router.push(searchResults[0].href);
                    return;
                }
            } catch (err) {
                console.error('Search error:', err);
                setError(err instanceof Error ? err.message : 'Search failed');
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [query, router]);

    if (!query) {
        return (
            <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Search Selendra</h1>
                <p className="text-foreground-secondary max-w-md mx-auto">
                    Enter a block number, transaction hash, or account address to search.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Search className="w-6 h-6 text-selendra-400" />
                        Searching...
                    </h1>
                    <p className="text-foreground-secondary mt-1">
                        Looking for &quot;{query}&quot;
                    </p>
                </div>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-selendra-500" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Search className="w-6 h-6 text-selendra-400" />
                        Search Results
                    </h1>
                    <p className="text-foreground-secondary mt-1">
                        Results for &quot;{searchedQuery}&quot;
                    </p>
                </div>
                <ErrorState
                    type="server"
                    title="Search failed"
                    message={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Search className="w-6 h-6 text-selendra-400" />
                        Search Results
                    </h1>
                    <p className="text-foreground-secondary mt-1">
                        Results for &quot;{searchedQuery}&quot;
                    </p>
                </div>
                <ErrorState
                    type="not-found"
                    title="No results found"
                    message={`No blocks, transactions, or accounts match "${searchedQuery}". Try a different search term.`}
                    showHome
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <Search className="w-6 h-6 text-selendra-400" />
                    Search Results
                </h1>
                <p className="text-foreground-secondary mt-1">
                    Found {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{searchedQuery}&quot;
                </p>
            </div>

            {/* Group results by type */}
            {['block', 'transaction', 'account', 'token'].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;

                const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
                    block: { label: 'Blocks', icon: <Box className="w-5 h-5" /> },
                    transaction: { label: 'Transactions', icon: <FileText className="w-5 h-5" /> },
                    account: { label: 'Accounts', icon: <User className="w-5 h-5" /> },
                    token: { label: 'Tokens', icon: <Coins className="w-5 h-5" /> },
                };

                return (
                    <div key={type} className="space-y-3">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            {typeLabels[type].icon}
                            {typeLabels[type].label}
                            <span className="text-sm font-normal text-foreground-secondary">
                                ({typeResults.length})
                            </span>
                        </h2>
                        <div className="grid gap-3">
                            {typeResults.map((result, index) => (
                                <Link
                                    key={`${result.type}-${index}`}
                                    href={result.href}
                                    className="bg-background-card border border-border rounded-xl p-4 hover:bg-background-hover hover:border-border-hover transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center">
                                                {result.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-foreground group-hover:text-selendra-400 transition-colors">
                                                    {result.title}
                                                </h3>
                                                <p className="text-sm text-foreground-secondary font-mono">
                                                    {result.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {result.metadata && (
                                                <div className="hidden md:flex items-center gap-3 text-xs text-foreground-secondary">
                                                    {Object.entries(result.metadata).map(([key, value]) => (
                                                        <span key={key} className="flex items-center gap-1">
                                                            {key === 'verified' && value === true && (
                                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                                            )}
                                                            {key === 'status' && value === 'SUCCESS' && (
                                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                                            )}
                                                            {key === 'status' && value === 'FAILED' && (
                                                                <XCircle className="w-3 h-3 text-red-400" />
                                                            )}
                                                            {typeof value !== 'boolean' && (
                                                                <span>
                                                                    <span className="text-foreground-secondary">{key}:</span>{' '}
                                                                    <span className="text-foreground">{value}</span>
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <ArrowRight className="w-5 h-5 text-foreground-secondary group-hover:text-selendra-400 transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper functions
function truncateHash(hash: string): string {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function truncateAddress(address: string): string {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatBalance(value: string): string {
    try {
        const val = BigInt(value);
        const decimals = 18;
        const whole = val / BigInt(10 ** decimals);
        return `${whole.toLocaleString()} SEL`;
    } catch {
        return '0 SEL';
    }
}
