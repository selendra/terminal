'use client';

import React from 'react';
import Link from 'next/link';
import {
    ArrowUpRight,
    ArrowRight,
    ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddressDisplay } from '@/components/common/AddressDisplay';
import { VMBadge } from '@/components/common/VMBadge';
import { StatusDot } from '@/components/common/StatusBadge';

interface MobileTransactionCardProps {
    hash: string;
    type: 'transfer' | 'contract' | 'token' | 'stake' | 'governance';
    vmType: 'evm' | 'substrate';
    status: 'success' | 'failed' | 'pending';
    blockNumber: number;
    from: string;
    to: string | null;
    value: string;
    fee: string;
    timestamp: string;
    method?: string;
}

const typeColors: Record<string, string> = {
    transfer: 'bg-green-500/20 text-green-400',
    contract: 'bg-blue-500/20 text-blue-400',
    token: 'bg-yellow-500/20 text-yellow-400',
    stake: 'bg-purple-500/20 text-purple-400',
    governance: 'bg-cyan-500/20 text-cyan-400',
};

export function MobileTransactionCard({
    hash,
    type,
    vmType,
    status,
    blockNumber,
    from,
    to,
    value,
    fee,
    timestamp,
    method,
}: MobileTransactionCardProps) {
    return (
        <Link
            href={`/tx/${hash}`}
            className="block bg-background-card border border-border rounded-xl p-4 hover:bg-background-hover hover:border-border-hover transition-all"
        >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <StatusDot status={status} size="sm" />
                    <span className="font-mono text-sm text-selendra-400">
                        {hash.slice(0, 8)}...{hash.slice(-6)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', typeColors[type])}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <VMBadge vm={vmType} size="sm" />
                </div>
            </div>

            {/* From/To */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-secondary w-12">From</span>
                    <AddressDisplay
                        address={from}
                        size="sm"
                        showCopy={false}
                        showToggle={false}
                        linkToAccount={false}
                    />
                </div>
                {to && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-secondary w-12">To</span>
                        <AddressDisplay
                            address={to}
                            size="sm"
                            showCopy={false}
                            showToggle={false}
                            linkToAccount={false}
                        />
                    </div>
                )}
                {!to && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-secondary w-12">To</span>
                        <span className="text-blue-400 text-xs">Contract Creation</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs border-t border-border pt-3">
                <div className="flex items-center gap-3">
                    <span className="text-foreground-secondary">
                        Block{' '}
                        <span className="text-foreground">{blockNumber.toLocaleString()}</span>
                    </span>
                    {method && (
                        <span className="text-foreground-secondary truncate max-w-[100px]">
                            {method}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-foreground">{value}</span>
                    <span className="text-foreground-secondary">{timestamp}</span>
                </div>
            </div>
        </Link>
    );
}

interface MobileAccountCardProps {
    rank: number;
    address: string;
    identityDisplay?: string;
    identityVerified?: boolean;
    balance: string;
    transactionCount: number;
    isContract?: boolean;
    hasEvmAddress?: boolean;
}

// Alias exports for backward compatibility
export const TransactionCard = MobileTransactionCard;

// List wrapper for MobileTransactionCard
interface MobileTransactionListProps {
    transactions: Omit<MobileTransactionCardProps, 'className'>[];
    className?: string;
}

export function MobileTransactionList({ transactions, className }: MobileTransactionListProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {transactions.map((tx) => (
                <MobileTransactionCard key={tx.hash} {...tx} />
            ))}
        </div>
    );
}

export function MobileAccountCard({
    rank,
    address,
    identityDisplay,
    identityVerified,
    balance,
    transactionCount,
    isContract,
    hasEvmAddress,
}: MobileAccountCardProps) {
    return (
        <Link
            href={`/address/${address}`}
            className="block bg-background-card border border-border rounded-xl p-4 hover:bg-background-hover hover:border-border-hover transition-all"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-selendra-500/20 flex items-center justify-center text-sm font-bold text-selendra-400">
                        #{rank}
                    </span>
                    <div>
                        {identityDisplay ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{identityDisplay}</span>
                                {identityVerified && (
                                    <span className="text-green-400 text-xs">✓</span>
                                )}
                            </div>
                        ) : (
                            <AddressDisplay
                                address={address}
                                size="sm"
                                showCopy={false}
                                showToggle={false}
                                linkToAccount={false}
                            />
                        )}
                    </div>
                </div>
                <VMBadge vm={hasEvmAddress ? 'evm' : 'substrate'} size="sm" showLabel />
            </div>

            {/* Identity address if has display name */}
            {identityDisplay && (
                <div className="mb-3">
                    <AddressDisplay
                        address={address}
                        size="sm"
                        showCopy={false}
                        showToggle={false}
                        linkToAccount={false}
                    />
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <div>
                    <span className="text-foreground-secondary text-xs">Balance</span>
                    <p className="font-mono text-foreground">{balance}</p>
                </div>
                <div className="text-right">
                    <span className="text-foreground-secondary text-xs">Transactions</span>
                    <p className="text-foreground">{transactionCount.toLocaleString()}</p>
                </div>
                {isContract && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        Contract
                    </span>
                )}
            </div>
        </Link>
    );
}

// Alias exports for backward compatibility
export const AccountCard = MobileAccountCard;

// List wrapper for MobileAccountCard
interface MobileAccountListProps {
    accounts: Omit<MobileAccountCardProps, 'className'>[];
    className?: string;
}

export function MobileAccountList({ accounts, className }: MobileAccountListProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {accounts.map((account) => (
                <MobileAccountCard key={account.address} {...account} />
            ))}
        </div>
    );
}

interface MobileBlockCardProps {
    number: number;
    hash: string;
    validator?: string;
    extrinsicCount: number;
    eventCount: number;
    timestamp: string;
    isFinalized?: boolean;
}

export function MobileBlockCard({
    number,
    hash,
    validator,
    extrinsicCount,
    eventCount,
    timestamp,
    isFinalized,
}: MobileBlockCardProps) {
    return (
        <Link
            href={`/blocks/${number}`}
            className="block bg-background-card border border-border rounded-xl p-4 hover:bg-background-hover hover:border-border-hover transition-all"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                        #{number.toLocaleString()}
                    </span>
                    {isFinalized && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                            Finalized
                        </span>
                    )}
                </div>
                <span className="text-xs text-foreground-secondary">{timestamp}</span>
            </div>

            {/* Hash */}
            <div className="font-mono text-xs text-foreground-secondary mb-3 truncate">
                {hash}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <div className="flex items-center gap-4">
                    <div>
                        <span className="text-foreground-secondary text-xs">Extrinsics</span>
                        <p className="text-foreground">{extrinsicCount}</p>
                    </div>
                    <div>
                        <span className="text-foreground-secondary text-xs">Events</span>
                        <p className="text-foreground">{eventCount}</p>
                    </div>
                </div>
                {validator && (
                    <div className="text-right">
                        <span className="text-foreground-secondary text-xs">Validator</span>
                        <p className="text-foreground font-mono text-xs truncate max-w-[100px]">
                            {validator.slice(0, 8)}...
                        </p>
                    </div>
                )}
            </div>
        </Link>
    );
}

// Alias exports for backward compatibility
export const BlockCard = MobileBlockCard;

// List wrapper for MobileBlockCard
interface MobileBlockListProps {
    blocks: Omit<MobileBlockCardProps, 'className'>[];
    className?: string;
}

export function MobileBlockList({ blocks, className }: MobileBlockListProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {blocks.map((block) => (
                <MobileBlockCard key={block.number} {...block} />
            ))}
        </div>
    );
}

/**
 * Responsive wrapper that shows table on desktop and cards on mobile
 */
export function ResponsiveTable<T>({
    data,
    columns,
    renderMobileCard,
    isLoading,
    emptyMessage,
    className,
}: {
    data: T[];
    columns: {
        key: string;
        label: string;
        align?: 'left' | 'center' | 'right';
        render: (item: T) => React.ReactNode;
        hideOnMobile?: boolean;
    }[];
    renderMobileCard: (item: T, index: number) => React.ReactNode;
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
}) {
    return (
        <div className={className}>
            {/* Mobile: Card view */}
            <div className="md:hidden space-y-3">
                {data.map((item, index) => (
                    <React.Fragment key={index}>
                        {renderMobileCard(item, index)}
                    </React.Fragment>
                ))}
                {data.length === 0 && !isLoading && (
                    <div className="text-center py-8 text-foreground-secondary">
                        {emptyMessage || 'No data available'}
                    </div>
                )}
            </div>

            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-background-secondary border-b border-border">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3 text-sm font-medium text-foreground-secondary',
                                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                    )}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr
                                key={index}
                                className="border-b border-border hover:bg-background-hover transition-colors"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cn(
                                            'px-4 py-4',
                                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                                        )}
                                    >
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && !isLoading && (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-foreground-secondary">
                                    {emptyMessage || 'No data available'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Alias for backward compatibility
export const ResponsiveDataView = ResponsiveTable;
