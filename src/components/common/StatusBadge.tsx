"use client";

import { clsx } from "clsx";
import { 
  Check, 
  X, 
  Clock, 
  Loader2, 
  AlertTriangle,
  MinusCircle,
  Timer
} from "lucide-react";

/**
 * Transaction/Operation status types
 */
export type Status = 
  | "success" 
  | "failed" 
  | "pending" 
  | "processing" 
  | "warning"
  | "cancelled"
  | "finalized"
  | "in-block";

interface StatusBadgeProps {
  /** The status to display */
  status: Status;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show label text */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusBadge Component
 * 
 * Visual indicator for transaction or operation status.
 * Consistent styling across the application.
 */
export function StatusBadge({
  status,
  size = "md",
  showLabel = true,
  label,
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const displayLabel = label || config.label;
  
  const sizeClasses = {
    sm: "h-5 px-1.5 text-xs gap-1",
    md: "h-6 px-2 text-xs gap-1.5",
    lg: "h-7 px-2.5 text-sm gap-2",
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };
  
  const Icon = config.icon;
  
  return (
    <span
      title={config.tooltip}
      className={clsx(
        "inline-flex items-center rounded-full font-medium transition-colors",
        sizeClasses[size],
        config.colorClasses,
        className
      )}
    >
      <Icon className={clsx(
        iconSizes[size],
        config.iconAnimation
      )} />
      {showLabel && <span>{displayLabel}</span>}
    </span>
  );
}

/**
 * StatusDot Component
 * 
 * Minimal dot indicator for status
 */
interface StatusDotProps {
  status: Status;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusDot({ status, size = "md", className }: StatusDotProps) {
  const config = getStatusConfig(status);
  
  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };
  
  return (
    <span
      title={config.tooltip}
      className={clsx(
        "inline-block rounded-full",
        sizeClasses[size],
        config.dotColorClasses,
        status === "processing" && "animate-pulse",
        className
      )}
    />
  );
}

/**
 * Get configuration for a status
 */
function getStatusConfig(status: Status) {
  const configs: Record<Status, {
    label: string;
    tooltip: string;
    icon: typeof Check;
    colorClasses: string;
    dotColorClasses: string;
    iconAnimation?: string;
  }> = {
    success: {
      label: "Success",
      tooltip: "Transaction completed successfully",
      icon: Check,
      colorClasses: "bg-green-500/15 text-green-600 dark:text-green-400",
      dotColorClasses: "bg-green-500 dark:bg-green-400",
    },
    finalized: {
      label: "Finalized",
      tooltip: "Transaction finalized on chain",
      icon: Check,
      colorClasses: "bg-green-500/15 text-green-600 dark:text-green-400",
      dotColorClasses: "bg-green-500 dark:bg-green-400",
    },
    "in-block": {
      label: "In Block",
      tooltip: "Transaction included in block, awaiting finalization",
      icon: Timer,
      colorClasses: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      dotColorClasses: "bg-blue-500 dark:bg-blue-400",
    },
    failed: {
      label: "Failed",
      tooltip: "Transaction failed",
      icon: X,
      colorClasses: "bg-red-500/15 text-red-600 dark:text-red-400",
      dotColorClasses: "bg-red-500 dark:bg-red-400",
    },
    pending: {
      label: "Pending",
      tooltip: "Transaction pending",
      icon: Clock,
      colorClasses: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
      dotColorClasses: "bg-yellow-500 dark:bg-yellow-400",
    },
    processing: {
      label: "Processing",
      tooltip: "Transaction being processed",
      icon: Loader2,
      colorClasses: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      dotColorClasses: "bg-blue-500 dark:bg-blue-400",
      iconAnimation: "animate-spin",
    },
    warning: {
      label: "Warning",
      tooltip: "Transaction completed with warnings",
      icon: AlertTriangle,
      colorClasses: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      dotColorClasses: "bg-orange-500 dark:bg-orange-400",
    },
    cancelled: {
      label: "Cancelled",
      tooltip: "Transaction was cancelled",
      icon: MinusCircle,
      colorClasses: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
      dotColorClasses: "bg-gray-500 dark:bg-gray-400",
    },
  };
  
  return configs[status] || configs.pending;
}

/**
 * TransactionStatusBadge
 * 
 * Specialized badge for blockchain transaction status
 * with additional context
 */
interface TransactionStatusBadgeProps {
  status: Status;
  blockNumber?: number;
  confirmations?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TransactionStatusBadge({
  status,
  blockNumber,
  confirmations,
  size = "md",
  className,
}: TransactionStatusBadgeProps) {
  let label = undefined;
  
  if (status === "finalized" && confirmations) {
    label = `${confirmations} confirmations`;
  } else if (status === "in-block" && blockNumber) {
    label = `Block #${blockNumber.toLocaleString()}`;
  }
  
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <StatusBadge status={status} size={size} />
      {label && (
        <span className="text-xs text-foreground-secondary">
          {label}
        </span>
      )}
    </div>
  );
}
