"use client";

import { useIndexerStatus } from "@/lib/hooks/useIndexerStatus";
import { motion, AnimatePresence } from "framer-motion";

interface SyncIndicatorProps {
  className?: string;
  showWhenSynced?: boolean;
}

/**
 * Sync indicator component that shows indexer sync status
 * Displays a subtle badge when the indexer is behind the chain
 */
export function SyncIndicator({
  className = "",
  showWhenSynced = false,
}: SyncIndicatorProps) {
  const { data: status, isLoading, error } = useIndexerStatus({
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Don't render anything while loading or if there's an error
  if (isLoading || error) {
    return null;
  }

  // Don't render if indexer is not available
  if (!status?.isAvailable) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-medium ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
        <span>Indexer offline</span>
      </motion.div>
    );
  }

  // If synced and we don't want to show when synced, don't render
  if (status.isSynced && !showWhenSynced) {
    return null;
  }

  // If synced and we want to show it
  if (status.isSynced) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-medium ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span>Synced</span>
      </motion.div>
    );
  }

  // Show syncing status with lag
  const lagText = status.lag > 1000
    ? `${Math.round(status.lag / 1000)}k blocks behind`
    : `${status.lag} blocks behind`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="syncing"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-medium ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <span>Syncing... {lagText}</span>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Inline sync status for use in headers or small spaces
 */
export function SyncStatusBadge({ className = "" }: { className?: string }) {
  const { data: status, isLoading } = useIndexerStatus({
    refetchInterval: 15000,
  });

  if (isLoading || !status) {
    return null;
  }

  if (!status.isAvailable) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-yellow-500 ${className}`}
        title="Indexer is not available"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      </span>
    );
  }

  if (status.isSynced) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-green-500 ${className}`}
        title="Indexer is synced"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-blue-500 ${className}`}
      title={`Syncing: ${status.lag} blocks behind`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
    </span>
  );
}

/**
 * Detailed sync status for settings or debug pages
 */
export function SyncStatusDetail({ className = "" }: { className?: string }) {
  const { data: status, isLoading, error } = useIndexerStatus();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 w-32 bg-foreground-secondary/30 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Failed to check indexer status
      </div>
    );
  }

  if (!status?.isAvailable) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-yellow-500 font-medium">Indexer Unavailable</span>
        </div>
        <p className="text-sm text-foreground-secondary">
          Historical data may be limited. Real-time data from RPC is still available.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${status.isSynced ? "bg-green-500" : "bg-blue-500 animate-pulse"
            }`}
        />
        <span
          className={`font-medium ${status.isSynced ? "text-green-500" : "text-blue-500"
            }`}
        >
          {status.isSynced ? "Fully Synced" : "Syncing"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-foreground-secondary">Indexer Block:</span>
          <span className="ml-2 text-foreground font-mono">
            {status.indexerBlock.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-foreground-secondary">Chain Block:</span>
          <span className="ml-2 text-foreground font-mono">
            {status.chainBlock.toLocaleString()}
          </span>
        </div>
      </div>

      {!status.isSynced && (
        <div className="text-sm text-foreground-secondary">
          <span className="text-blue-400">{status.lag.toLocaleString()}</span> blocks
          behind
        </div>
      )}
    </div>
  );
}
