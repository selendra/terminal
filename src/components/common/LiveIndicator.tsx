'use client';

import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
    isLive?: boolean;
    label?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    variant?: 'default' | 'compact' | 'badge';
}

/**
 * Live indicator component showing real-time connection status
 */
export function LiveIndicator({
    isLive = true,
    label = 'Live',
    className,
    size = 'sm',
    showLabel = true,
    variant = 'default',
}: LiveIndicatorProps) {
    const dotSizes = {
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    if (variant === 'badge') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
                    isLive
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-500/10 text-gray-400',
                    textSizes[size],
                    className
                )}
            >
                <span
                    className={cn(
                        'rounded-full',
                        dotSizes[size],
                        isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    )}
                />
                {showLabel && label}
            </span>
        );
    }

    if (variant === 'compact') {
        return (
            <span
                className={cn(
                    'rounded-full',
                    dotSizes[size],
                    isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500',
                    className
                )}
                title={isLive ? 'Live' : 'Disconnected'}
            />
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5',
                isLive ? 'text-green-400' : 'text-gray-400',
                textSizes[size],
                className
            )}
        >
            <span
                className={cn(
                    'rounded-full',
                    dotSizes[size],
                    isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                )}
            />
            {showLabel && label}
        </span>
    );
}

/**
 * Animated pulse ring for new items
 */
export function NewItemPulse({ className }: { className?: string }) {
    return (
        <span className={cn('relative flex h-2 w-2', className)}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-selendra-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-selendra-500" />
        </span>
    );
}

/**
 * Block height indicator with animation
 */
export function BlockHeightIndicator({
    blockNumber,
    isUpdating,
    className,
}: {
    blockNumber: number;
    isUpdating?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 font-mono text-sm',
                isUpdating && 'text-selendra-400',
                className
            )}
        >
            <span className="text-foreground-secondary">#</span>
            <span
                className={cn(
                    'transition-all duration-300',
                    isUpdating && 'scale-105 text-selendra-400'
                )}
            >
                {blockNumber.toLocaleString()}
            </span>
            {isUpdating && (
                <span className="h-1.5 w-1.5 rounded-full bg-selendra-500 animate-pulse" />
            )}
        </span>
    );
}
