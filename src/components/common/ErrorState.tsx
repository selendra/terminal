'use client';

import React from 'react';
import {
    AlertCircle,
    RefreshCw,
    WifiOff,
    ServerCrash,
    FileX,
    Ban,
    XCircle,
    Home,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ErrorType =
    | 'network'
    | 'server'
    | 'not-found'
    | 'forbidden'
    | 'generic'
    | 'empty'
    | 'indexer';

interface ErrorStateProps {
    type?: ErrorType;
    title?: string;
    message?: string;
    error?: Error | null;
    onRetry?: () => void;
    retryLabel?: string;
    showHome?: boolean;
    showBack?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const errorConfig: Record<ErrorType, { icon: React.ElementType; title: string; message: string; color: string }> = {
    network: {
        icon: WifiOff,
        title: 'Connection Error',
        message: 'Unable to connect to the network. Please check your internet connection and try again.',
        color: 'text-yellow-400',
    },
    server: {
        icon: ServerCrash,
        title: 'Server Error',
        message: 'Something went wrong on our end. Our team has been notified and is working on a fix.',
        color: 'text-red-400',
    },
    'not-found': {
        icon: FileX,
        title: 'Not Found',
        message: 'The resource you are looking for does not exist or has been removed.',
        color: 'text-foreground-secondary',
    },
    forbidden: {
        icon: Ban,
        title: 'Access Denied',
        message: 'You do not have permission to view this resource.',
        color: 'text-orange-400',
    },
    generic: {
        icon: AlertCircle,
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again later.',
        color: 'text-red-400',
    },
    empty: {
        icon: FileX,
        title: 'No Data Available',
        message: 'There is no data to display at the moment.',
        color: 'text-foreground-secondary',
    },
    indexer: {
        icon: ServerCrash,
        title: 'Indexer Unavailable',
        message: 'The blockchain indexer is currently unavailable. Data may be incomplete or outdated.',
        color: 'text-yellow-400',
    },
};

const sizeConfig = {
    sm: {
        icon: 'w-8 h-8',
        title: 'text-base',
        message: 'text-sm',
        padding: 'p-6',
    },
    md: {
        icon: 'w-12 h-12',
        title: 'text-lg',
        message: 'text-sm',
        padding: 'p-8',
    },
    lg: {
        icon: 'w-16 h-16',
        title: 'text-xl',
        message: 'text-base',
        padding: 'p-12',
    },
};

/**
 * ErrorState component for displaying error messages with appropriate styling
 */
export function ErrorState({
    type = 'generic',
    title,
    message,
    error,
    onRetry,
    retryLabel = 'Try Again',
    showHome = false,
    showBack = false,
    className,
    size = 'md',
}: ErrorStateProps) {
    const config = errorConfig[type];
    const sizeStyles = sizeConfig[size];
    const Icon = config.icon;

    const displayTitle = title || config.title;
    const displayMessage = message || error?.message || config.message;

    return (
        <div className={cn('flex flex-col items-center justify-center text-center', sizeStyles.padding, className)}>
            <div className={cn('mb-4 opacity-60', config.color)}>
                <Icon className={sizeStyles.icon} />
            </div>

            <h3 className={cn('font-semibold text-foreground mb-2', sizeStyles.title)}>
                {displayTitle}
            </h3>

            <p className={cn('text-foreground-secondary max-w-md', sizeStyles.message)}>
                {displayMessage}
            </p>

            {/* Error details in development */}
            {error && process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 p-3 bg-background-tertiary rounded-lg text-xs text-left overflow-auto max-w-full max-h-32 text-red-400">
                    {error.stack || error.message}
                </pre>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6">
                {showBack && (
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                )}

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {retryLabel}
                    </button>
                )}

                {showHome && (
                    <Link
                        href="/"
                        className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                )}
            </div>
        </div>
    );
}

/**
 * Inline error message for form fields and small components
 */
export function InlineError({
    message,
    className,
}: {
    message: string;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-2 text-red-400 text-sm', className)}>
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
}

/**
 * Error banner for top of pages
 */
export function ErrorBanner({
    type = 'generic',
    message,
    onDismiss,
    onRetry,
    className,
}: {
    type?: ErrorType;
    message?: string;
    onDismiss?: () => void;
    onRetry?: () => void;
    className?: string;
}) {
    const config = errorConfig[type];
    const Icon = config.icon;

    const bgColors: Record<ErrorType, string> = {
        network: 'bg-yellow-500/10 border-yellow-500/30',
        server: 'bg-red-500/10 border-red-500/30',
        'not-found': 'bg-gray-500/10 border-gray-500/30',
        forbidden: 'bg-orange-500/10 border-orange-500/30',
        generic: 'bg-red-500/10 border-red-500/30',
        empty: 'bg-gray-500/10 border-gray-500/30',
        indexer: 'bg-yellow-500/10 border-yellow-500/30',
    };

    return (
        <div className={cn('flex items-center gap-3 p-4 border rounded-lg', bgColors[type], className)}>
            <Icon className={cn('w-5 h-5 flex-shrink-0', config.color)} />
            <p className={cn('flex-1 text-sm', config.color)}>
                {message || config.message}
            </p>
            <div className="flex items-center gap-2">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-sm text-foreground-secondary hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                    </button>
                )}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="text-foreground-secondary hover:text-foreground transition-colors"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Empty state component for when there's no data
 */
export function EmptyState({
    icon: CustomIcon,
    title,
    message,
    action,
    actionLabel,
    className,
}: {
    icon?: React.ElementType;
    title: string;
    message?: string;
    action?: () => void;
    actionLabel?: string;
    className?: string;
}) {
    const Icon = CustomIcon || FileX;

    return (
        <div className={cn('flex flex-col items-center justify-center text-center p-8', className)}>
            <div className="mb-4 text-foreground-secondary opacity-50">
                <Icon className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            {message && (
                <p className="text-sm text-foreground-secondary max-w-md">{message}</p>
            )}
            {action && actionLabel && (
                <button
                    onClick={action}
                    className="mt-4 px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors text-sm"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
