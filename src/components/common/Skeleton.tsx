'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'default' | 'circular' | 'text' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Base Skeleton component for loading states
 */
export function Skeleton({
    className,
    variant = 'default',
    width,
    height,
    animation = 'shimmer',
}: SkeletonProps) {
    const baseClasses = cn(
        'bg-background-tertiary',
        {
            'rounded-md': variant === 'default' || variant === 'rectangular',
            'rounded-full': variant === 'circular',
            'rounded': variant === 'text',
            'animate-pulse': animation === 'pulse',
            'skeleton-shimmer': animation === 'shimmer',
        },
        className
    );

    const style: React.CSSProperties = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    return <div className={baseClasses} style={style} />;
}

/**
 * Skeleton for text content
 */
export function SkeletonText({
    lines = 1,
    className,
    lastLineWidth = '60%',
}: {
    lines?: number;
    className?: string;
    lastLineWidth?: string;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    className="h-4"
                    width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for stat cards
 */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn('bg-background-card border border-border rounded-xl p-4', className)}>
            <div className="flex items-center gap-3">
                <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="h-3 w-24" />
                    <Skeleton variant="text" className="h-6 w-16" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({
    columns = 5,
    className,
}: {
    columns?: number;
    className?: string;
}) {
    return (
        <tr className={cn('border-b border-border', className)}>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <Skeleton
                        variant="text"
                        className="h-4"
                        width={i === 0 ? '80%' : i === columns - 1 ? '60%' : '100%'}
                    />
                </td>
            ))}
        </tr>
    );
}

/**
 * Skeleton for transaction table
 */
export function SkeletonTransactionTable({ rows = 10 }: { rows?: number }) {
    return (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-background-secondary border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Txn Hash
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Type
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Block
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                From
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                To
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Value
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Fee
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Age
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i} className="border-b border-border">
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-32" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-6 w-20 rounded" />
                                        <Skeleton className="h-5 w-12 rounded" />
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-20" />
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-28" />
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-28" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-24 ml-auto" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-20 ml-auto" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Skeleton for accounts table
 */
export function SkeletonAccountsTable({ rows = 10 }: { rows?: number }) {
    return (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-background-secondary border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Rank
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Address
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Type
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Balance
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Transactions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i} className="border-b border-border">
                                <td className="px-4 py-4">
                                    <Skeleton className="h-6 w-8 rounded-full" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton variant="circular" className="h-8 w-8" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-5 w-16 rounded" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-28 ml-auto" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Skeleton for blocks table
 */
export function SkeletonBlocksTable({ rows = 10 }: { rows?: number }) {
    return (
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-background-secondary border-b border-border">
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Block
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Hash
                            </th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Validator
                            </th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Extrinsics
                            </th>
                            <th className="text-center px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Events
                            </th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">
                                Age
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <tr key={i} className="border-b border-border">
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-24" />
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-32" />
                                </td>
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-28" />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-6 w-8 rounded-full mx-auto" />
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-6 w-8 rounded-full mx-auto" />
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-16 ml-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Skeleton for dashboard stats grid
 */
export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/**
 * Skeleton for address/account details page
 */
export function SkeletonAccountDetails() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-background-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="h-16 w-16" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <SkeletonStatsGrid count={4} />

            {/* Tabs placeholder */}
            <div className="bg-background-card border border-border rounded-xl p-4">
                <div className="flex gap-4 mb-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded" />
                    ))}
                </div>
                <SkeletonTransactionTable rows={5} />
            </div>
        </div>
    );
}

/**
 * Skeleton for transaction details page
 */
export function SkeletonTransactionDetails() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-background-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional sections */}
            <SkeletonStatsGrid count={2} />
        </div>
    );
}

/**
 * Skeleton for block details page
 */
export function SkeletonBlockDetails() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-background-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Extrinsics */}
            <div className="bg-background-card border border-border rounded-xl p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <SkeletonTransactionTable rows={5} />
            </div>
        </div>
    );
}
