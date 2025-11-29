"use client";

import { clsx } from "clsx";
import { Hexagon, Circle } from "lucide-react";

/**
 * VM types supported by Selendra
 */
export type VMType = "substrate" | "evm";

interface VMBadgeProps {
  /** The VM type to display */
  vm: VMType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show label text alongside icon */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Tooltip text (defaults to VM name) */
  tooltip?: string;
}

/**
 * VMBadge Component
 * 
 * Visual indicator showing whether data originates from the Substrate
 * or EVM layer of Selendra's dual-VM architecture.
 * 
 * - Substrate (blue): Native Substrate transactions, extrinsics
 * - EVM (purple): Ethereum-compatible transactions, contracts
 */
export function VMBadge({
  vm,
  size = "md",
  showLabel = false,
  className,
  tooltip,
}: VMBadgeProps) {
  const isSubstrate = vm === "substrate";
  
  const sizeClasses = {
    sm: "h-4 px-1.5 text-xs gap-1",
    md: "h-5 px-2 text-xs gap-1.5",
    lg: "h-6 px-2.5 text-sm gap-2",
  };
  
  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };
  
  const label = isSubstrate ? "Substrate" : "EVM";
  const tooltipText = tooltip || (isSubstrate 
    ? "Substrate Layer - Native blockchain transaction" 
    : "EVM Layer - Ethereum-compatible transaction"
  );
  
  return (
    <span
      title={tooltipText}
      className={clsx(
        "inline-flex items-center rounded-full font-medium transition-colors",
        sizeClasses[size],
        isSubstrate
          ? "bg-blue-500/15 text-blue-500 dark:bg-blue-400/15 dark:text-blue-400"
          : "bg-purple-500/15 text-purple-500 dark:bg-purple-400/15 dark:text-purple-400",
        className
      )}
    >
      {isSubstrate ? (
        <Hexagon className={iconSizes[size]} />
      ) : (
        <Circle className={iconSizes[size]} />
      )}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

/**
 * VMDot Component
 * 
 * Minimal dot indicator for VM type, useful in compact displays
 */
interface VMDotProps {
  vm: VMType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VMDot({ vm, size = "md", className }: VMDotProps) {
  const isSubstrate = vm === "substrate";
  
  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };
  
  return (
    <span
      title={isSubstrate ? "Substrate" : "EVM"}
      className={clsx(
        "inline-block rounded-full",
        sizeClasses[size],
        isSubstrate
          ? "bg-blue-500 dark:bg-blue-400"
          : "bg-purple-500 dark:bg-purple-400",
        className
      )}
    />
  );
}

/**
 * VMLabel Component
 * 
 * Text-only VM indicator
 */
interface VMLabelProps {
  vm: VMType;
  className?: string;
}

export function VMLabel({ vm, className }: VMLabelProps) {
  const isSubstrate = vm === "substrate";
  
  return (
    <span
      className={clsx(
        "text-xs font-medium uppercase tracking-wider",
        isSubstrate
          ? "text-blue-500 dark:text-blue-400"
          : "text-purple-500 dark:text-purple-400",
        className
      )}
    >
      {isSubstrate ? "Substrate" : "EVM"}
    </span>
  );
}
