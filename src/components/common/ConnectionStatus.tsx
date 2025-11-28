"use client";

import { useBlockchain, NETWORKS } from "@/components/providers/BlockchainProvider";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  className?: string;
  showNetworkName?: boolean;
}

export function ConnectionStatus({
  className,
  showNetworkName = true,
}: ConnectionStatusProps) {
  const { isConnected, isConnecting, useMockData, currentNetwork } =
    useBlockchain();

  const network = NETWORKS[currentNetwork];

  // Determine connection status
  const getStatus = () => {
    if (isConnecting) {
      return {
        color: "bg-yellow-500",
        pulseColor: "bg-yellow-400",
        label: "Connecting...",
        description: "Establishing connection",
      };
    }

    if (!isConnected) {
      return {
        color: "bg-red-500",
        pulseColor: "bg-red-400",
        label: "Disconnected",
        description: "No connection",
      };
    }

    if (useMockData) {
      return {
        color: "bg-yellow-500",
        pulseColor: "bg-yellow-400",
        label: "Mock Data",
        description: "Using simulated data",
      };
    }

    return {
      color: "bg-green-500",
      pulseColor: "bg-green-400",
      label: "Live",
      description: "Connected to network",
    };
  };

  const status = getStatus();

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm",
        className
      )}
      title={status.description}
    >
      {/* Status indicator dot with pulse animation */}
      <span className="relative flex h-3 w-3">
        {isConnected && !useMockData && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              status.pulseColor
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-3 w-3 rounded-full",
            status.color
          )}
        />
      </span>

      {/* Status label */}
      <span className="text-muted-foreground">{status.label}</span>

      {/* Network name */}
      {showNetworkName && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span className="font-medium">{network.name}</span>
        </>
      )}
    </div>
  );
}

export default ConnectionStatus;
