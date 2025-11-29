"use client";

import { useState, useCallback, useEffect } from "react";
import { Copy, Check, ArrowLeftRight, ExternalLink, User } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

import { VMBadge, VMDot, type VMType } from "./VMBadge";
import { usePreferences, type AddressFormat } from "@/lib/stores/preferences";
import { 
  isEvmAddress, 
  isSubstrateAddress, 
  formatAddress,
  detectAddressType 
} from "@/lib/address";
import { 
  resolveAddress, 
  getAlternateAddress,
  type UnifiedAddress 
} from "@/lib/unified/address-resolver";

interface AddressDisplayProps {
  /** The address to display (SS58 or 0x format) */
  address: string;
  /** Override the detected address type */
  type?: VMType;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show the VM badge */
  showVMBadge?: boolean;
  /** Show copy button */
  showCopy?: boolean;
  /** Show format toggle button */
  showToggle?: boolean;
  /** Show external link to explorer */
  showExternalLink?: boolean;
  /** Show as full address (no truncation) */
  full?: boolean;
  /** Custom truncation start characters */
  startChars?: number;
  /** Custom truncation end characters */
  endChars?: number;
  /** Link to account page when clicked */
  linkToAccount?: boolean;
  /** Show identity/label if available */
  showIdentity?: boolean;
  /** Known identity/label for this address */
  identity?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when address format is toggled */
  onFormatChange?: (format: VMType) => void;
}

/**
 * AddressDisplay Component
 * 
 * Unified address display component that handles both Substrate (SS58)
 * and EVM (0x) addresses with:
 * - Format toggle between SS58 and 0x
 * - Copy to clipboard
 * - VM type badge
 * - Truncation with hover tooltip
 * - User preference for default format
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AddressDisplay address="0x7a3cEfC7Ac..." />
 * 
 * // With all features
 * <AddressDisplay 
 *   address="seH5WcHC7dXPjg..." 
 *   showVMBadge 
 *   showCopy 
 *   showToggle 
 *   linkToAccount
 * />
 * ```
 */
export function AddressDisplay({
  address,
  type,
  size = "md",
  showVMBadge = false,
  showCopy = true,
  showToggle = true,
  showExternalLink = false,
  full = false,
  startChars,
  endChars,
  linkToAccount = false,
  showIdentity = true,
  identity,
  className,
  onFormatChange,
}: AddressDisplayProps) {
  const { addressFormat } = usePreferences();
  
  // Detect the original address type
  const detectedType = type || (detectAddressType(address) as VMType);
  
  // State for the currently displayed format
  const [displayFormat, setDisplayFormat] = useState<VMType>(
    addressFormat === "evm" ? "evm" : 
    addressFormat === "substrate" ? "substrate" : 
    detectedType
  );
  
  // State for the alternate address
  const [alternateAddress, setAlternateAddress] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Determine truncation based on size
  const truncationConfig = {
    sm: { start: startChars || 4, end: endChars || 4 },
    md: { start: startChars || 6, end: endChars || 4 },
    lg: { start: startChars || 10, end: endChars || 6 },
  };
  
  const { start, end } = truncationConfig[size];
  
  // Resolve alternate address when needed
  useEffect(() => {
    if (!showToggle) return;
    
    const resolve = async () => {
      setIsResolving(true);
      try {
        const alternate = await getAlternateAddress(address);
        setAlternateAddress(alternate);
      } catch (error) {
        console.error("Failed to resolve alternate address:", error);
      } finally {
        setIsResolving(false);
      }
    };
    
    resolve();
  }, [address, showToggle]);
  
  // Get the address to display based on current format
  const getDisplayAddress = useCallback((): string => {
    if (displayFormat === detectedType) {
      return address;
    }
    return alternateAddress || address;
  }, [displayFormat, detectedType, address, alternateAddress]);
  
  const displayedAddress = getDisplayAddress();
  const currentVMType = isEvmAddress(displayedAddress) ? "evm" : "substrate";
  
  // Format the address for display
  const formattedAddress = full 
    ? displayedAddress 
    : formatAddress(displayedAddress, start, end);
  
  // Toggle between formats
  const handleToggle = useCallback(() => {
    if (!alternateAddress) return;
    
    const newFormat = displayFormat === "substrate" ? "evm" : "substrate";
    setDisplayFormat(newFormat);
    onFormatChange?.(newFormat);
  }, [displayFormat, alternateAddress, onFormatChange]);
  
  // Copy address to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayedAddress);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  }, [displayedAddress]);
  
  // Size-based classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  const buttonSizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  };
  
  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };
  
  // Render the address text
  const AddressText = () => (
    <span
      className={clsx(
        "font-mono transition-colors",
        sizeClasses[size],
        linkToAccount && "hover:text-selendra-400 cursor-pointer"
      )}
      title={displayedAddress}
    >
      {formattedAddress}
    </span>
  );
  
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5",
        className
      )}
    >
      {/* VM Badge */}
      {showVMBadge && (
        <VMDot vm={currentVMType} size={size} />
      )}
      
      {/* Identity/Label */}
      {showIdentity && identity && (
        <span className={clsx(
          "flex items-center gap-1 text-foreground font-medium",
          sizeClasses[size]
        )}>
          <User className={iconSizeClasses[size]} />
          {identity}
          <span className="text-foreground-muted">·</span>
        </span>
      )}
      
      {/* Address */}
      {linkToAccount ? (
        <a 
          href={`/accounts/${displayedAddress}`}
          className="hover:underline underline-offset-2"
        >
          <AddressText />
        </a>
      ) : (
        <AddressText />
      )}
      
      {/* Action buttons */}
      <span className="inline-flex items-center gap-0.5">
        {/* Copy button */}
        {showCopy && (
          <button
            onClick={handleCopy}
            className={clsx(
              "inline-flex items-center justify-center rounded transition-colors",
              "text-foreground-muted hover:text-foreground hover:bg-background-hover",
              buttonSizeClasses[size]
            )}
            title="Copy address"
          >
            {copied ? (
              <Check className={clsx(iconSizeClasses[size], "text-accent-green")} />
            ) : (
              <Copy className={iconSizeClasses[size]} />
            )}
          </button>
        )}
        
        {/* Toggle format button */}
        {showToggle && alternateAddress && (
          <button
            onClick={handleToggle}
            disabled={isResolving}
            className={clsx(
              "inline-flex items-center justify-center rounded transition-colors",
              "text-foreground-muted hover:text-foreground hover:bg-background-hover",
              buttonSizeClasses[size],
              isResolving && "opacity-50 cursor-not-allowed"
            )}
            title={`Switch to ${displayFormat === "substrate" ? "EVM (0x)" : "Substrate (SS58)"} format`}
          >
            <ArrowLeftRight className={iconSizeClasses[size]} />
          </button>
        )}
        
        {/* External link */}
        {showExternalLink && (
          <a
            href={`/accounts/${displayedAddress}`}
            className={clsx(
              "inline-flex items-center justify-center rounded transition-colors",
              "text-foreground-muted hover:text-foreground hover:bg-background-hover",
              buttonSizeClasses[size]
            )}
            title="View account details"
          >
            <ExternalLink className={iconSizeClasses[size]} />
          </a>
        )}
      </span>
    </span>
  );
}

/**
 * AddressDisplayCompact
 * 
 * Minimal address display without action buttons
 */
interface AddressDisplayCompactProps {
  address: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AddressDisplayCompact({
  address,
  size = "md",
  className,
}: AddressDisplayCompactProps) {
  return (
    <AddressDisplay
      address={address}
      size={size}
      showCopy={false}
      showToggle={false}
      showVMBadge={false}
      className={className}
    />
  );
}

/**
 * AddressDisplayFull
 * 
 * Full address display with all features enabled
 */
interface AddressDisplayFullProps {
  address: string;
  size?: "sm" | "md" | "lg";
  identity?: string;
  className?: string;
}

export function AddressDisplayFull({
  address,
  size = "md",
  identity,
  className,
}: AddressDisplayFullProps) {
  return (
    <AddressDisplay
      address={address}
      size={size}
      showCopy
      showToggle
      showVMBadge
      showExternalLink
      linkToAccount
      identity={identity}
      className={className}
    />
  );
}

/**
 * DualAddressDisplay
 * 
 * Shows both Substrate and EVM addresses side by side
 */
interface DualAddressDisplayProps {
  substrateAddress?: string;
  evmAddress?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DualAddressDisplay({
  substrateAddress,
  evmAddress,
  size = "md",
  className,
}: DualAddressDisplayProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {substrateAddress && (
        <div className="flex items-center gap-2">
          <VMBadge vm="substrate" size={size} showLabel />
          <AddressDisplay
            address={substrateAddress}
            type="substrate"
            size={size}
            showToggle={false}
          />
        </div>
      )}
      {evmAddress && (
        <div className="flex items-center gap-2">
          <VMBadge vm="evm" size={size} showLabel />
          <AddressDisplay
            address={evmAddress}
            type="evm"
            size={size}
            showToggle={false}
          />
        </div>
      )}
    </div>
  );
}
