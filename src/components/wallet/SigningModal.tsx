"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Fuel,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Hexagon,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "../providers/WalletProvider";
import { AddressDisplay, VMBadge } from "@/components/common";
import toast from "react-hot-toast";

// ============================================
// TYPES
// ============================================

export type TransactionType =
  | "transfer"
  | "stake"
  | "unstake"
  | "nominate"
  | "vote"
  | "contract_call"
  | "contract_deploy"
  | "approve"
  | "swap"
  | "generic";

export type SigningStatus =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "signing"
  | "broadcasting"
  | "success"
  | "error";

export interface TransactionDetails {
  // Basic info
  type: TransactionType;
  title: string;
  description?: string;

  // VM type
  vm: "substrate" | "evm";

  // Addresses
  from: string;
  to?: string;

  // Value
  value?: string;
  valueFormatted?: string;
  symbol?: string;

  // Fees
  estimatedFee?: string;
  estimatedFeeFormatted?: string;
  maxFee?: string;
  gasLimit?: string;
  gasPrice?: string;

  // Method info (for contract calls)
  method?: string;
  methodName?: string;
  args?: Record<string, unknown>;

  // Substrate specific
  pallet?: string;
  call?: string;
  tip?: string;

  // EVM specific
  data?: string;
  nonce?: number;

  // Warnings
  warnings?: string[];

  // Metadata
  metadata?: Record<string, string | number>;
}

export interface SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetails | null;
  onSign: () => Promise<string | null>;
  onSuccess?: (hash: string) => void;
  onError?: (error: Error) => void;
}

// ============================================
// COMPONENT
// ============================================

export function SigningModal({
  isOpen,
  onClose,
  transaction,
  onSign,
  onSuccess,
  onError,
}: SigningModalProps) {
  const { selectedSubstrateAccount, evmAccount } = useWallet();

  const [status, setStatus] = useState<SigningStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setTxHash(null);
      setError(null);
      setShowDetails(false);
    }
  }, [isOpen]);

  const handleSign = useCallback(async () => {
    if (!transaction) return;

    try {
      setStatus("preparing");
      setError(null);

      // Simulate preparation delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStatus("awaiting_signature");

      // Wait for user to sign
      const hash = await onSign();

      if (hash) {
        setStatus("broadcasting");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setTxHash(hash);
        setStatus("success");
        onSuccess?.(hash);
        toast.success("Transaction submitted!");
      } else {
        throw new Error("Transaction was rejected");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      setStatus("error");
      onError?.(err instanceof Error ? err : new Error(errorMessage));
      toast.error(errorMessage);
    }
  }, [transaction, onSign, onSuccess, onError]);

  const handleClose = () => {
    if (status === "signing" || status === "broadcasting") {
      toast.error("Please wait for the transaction to complete");
      return;
    }
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!isOpen || !transaction) return null;

  const account =
    transaction.vm === "substrate" ? selectedSubstrateAccount : evmAccount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <TransactionIcon type={transaction.type} vm={transaction.vm} />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {transaction.title}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <VMBadge vm={transaction.vm} size="sm" />
                <span className="text-sm text-foreground-secondary">
                  {getTransactionTypeLabel(transaction.type)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={status === "signing" || status === "broadcasting"}
            className="p-2 hover:bg-background-hover rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status Banner */}
          {status !== "idle" && (
            <StatusBanner status={status} error={error} txHash={txHash} />
          )}

          {/* Warnings */}
          {transaction.warnings && transaction.warnings.length > 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {transaction.warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-yellow-500">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transaction Summary */}
          <div className="space-y-3">
            {/* From/To */}
            <div className="p-4 bg-background rounded-xl space-y-3">
              {/* From */}
              <div>
                <label className="text-xs text-foreground-secondary uppercase tracking-wide">
                  From
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <AddressDisplay
                    address={transaction.from}
                    type={transaction.vm === "substrate" ? "substrate" : "evm"}
                    size="sm"
                    showToggle={false}
                    className="font-medium"
                  />
                  {account && "name" in account && account.name && (
                    <span className="text-sm text-foreground-secondary">
                      ({account.name})
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {transaction.to && (
                <>
                  <div className="flex justify-center">
                    <div className="p-2 bg-background-hover rounded-full">
                      <ArrowRight className="w-4 h-4 text-foreground-secondary" />
                    </div>
                  </div>

                  {/* To */}
                  <div>
                    <label className="text-xs text-foreground-secondary uppercase tracking-wide">
                      To
                    </label>
                    <div className="mt-1">
                      <AddressDisplay
                        address={transaction.to}
                        type={
                          transaction.vm === "substrate" ? "substrate" : "evm"
                        }
                        size="sm"
                        showToggle={false}
                        className="font-medium"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Value */}
            {transaction.value && transaction.value !== "0" && (
              <div className="p-4 bg-background rounded-xl">
                <label className="text-xs text-foreground-secondary uppercase tracking-wide">
                  Amount
                </label>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-foreground">
                    {transaction.valueFormatted || transaction.value}
                  </span>
                  <span className="ml-2 text-foreground-secondary">
                    {transaction.symbol || "SEL"}
                  </span>
                </div>
              </div>
            )}

            {/* Method (for contract calls) */}
            {transaction.method && (
              <div className="p-4 bg-background rounded-xl">
                <label className="text-xs text-foreground-secondary uppercase tracking-wide">
                  Method
                </label>
                <div className="mt-1 font-mono text-sm text-foreground">
                  {transaction.methodName || transaction.method}
                </div>
              </div>
            )}

            {/* Fee Estimation */}
            <div className="p-4 bg-background rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-foreground-secondary" />
                  <span className="text-sm text-foreground-secondary">
                    Estimated Fee
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {transaction.estimatedFeeFormatted ||
                    transaction.estimatedFee ||
                    "~0.001 SEL"}
                </span>
              </div>
              {transaction.gasLimit && (
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-foreground-secondary">Gas Limit</span>
                  <span className="text-foreground">{transaction.gasLimit}</span>
                </div>
              )}
            </div>

            {/* Expandable Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 bg-background rounded-lg hover:bg-background-hover transition-colors"
            >
              <span className="text-sm text-foreground-secondary">
                Transaction Details
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-foreground-secondary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-foreground-secondary" />
              )}
            </button>

            {showDetails && (
              <div className="p-4 bg-background rounded-xl space-y-2 text-sm">
                {transaction.pallet && (
                  <DetailRow label="Pallet" value={transaction.pallet} />
                )}
                {transaction.call && (
                  <DetailRow label="Call" value={transaction.call} />
                )}
                {transaction.nonce !== undefined && (
                  <DetailRow label="Nonce" value={String(transaction.nonce)} />
                )}
                {transaction.data && (
                  <DetailRow
                    label="Data"
                    value={`${transaction.data.slice(0, 20)}...`}
                    copyable
                    fullValue={transaction.data}
                    onCopy={copyToClipboard}
                  />
                )}
                {transaction.args && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-foreground-secondary">Arguments</span>
                    <pre className="mt-1 p-2 bg-background-card rounded text-xs overflow-x-auto">
                      {JSON.stringify(transaction.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {status === "success" ? (
            <button
              onClick={handleClose}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Done
            </button>
          ) : status === "error" ? (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-background-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={status === "signing" || status === "broadcasting"}
                className="flex-1 py-3 border border-border rounded-xl font-medium hover:bg-background-hover transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={
                  status !== "idle" ||
                  !account
                }
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "idle" ? (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign & Submit
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {getStatusLabel(status)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TransactionIcon({
  type,
  vm,
}: {
  type: TransactionType;
  vm: "substrate" | "evm";
}) {
  const iconClass = cn(
    "w-5 h-5",
    vm === "substrate" ? "text-blue-500" : "text-purple-500"
  );

  const bgClass = cn(
    "p-2 rounded-lg",
    vm === "substrate" ? "bg-blue-500/10" : "bg-purple-500/10"
  );

  return (
    <div className={bgClass}>
      {vm === "substrate" ? (
        <Hexagon className={iconClass} />
      ) : (
        <Circle className={iconClass} />
      )}
    </div>
  );
}

function StatusBanner({
  status,
  error,
  txHash,
}: {
  status: SigningStatus;
  error: string | null;
  txHash: string | null;
}) {
  if (status === "success") {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-medium text-green-500">Transaction Submitted</p>
            {txHash && (
              <p className="text-sm text-green-500/70 font-mono mt-1">
                {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-500">Transaction Failed</p>
            {error && <p className="text-sm text-red-500/70 mt-1">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <div>
          <p className="font-medium text-primary">{getStatusLabel(status)}</p>
          <p className="text-sm text-primary/70 mt-1">
            {getStatusDescription(status)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  copyable,
  fullValue,
  onCopy,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  fullValue?: string;
  onCopy?: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-foreground">{value}</span>
        {copyable && onCopy && (
          <button
            onClick={() => onCopy(fullValue || value)}
            className="p-1 hover:bg-background-hover rounded transition-colors"
          >
            <Copy className="w-3 h-3 text-foreground-secondary" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    transfer: "Transfer",
    stake: "Stake",
    unstake: "Unstake",
    nominate: "Nominate",
    vote: "Vote",
    contract_call: "Contract Call",
    contract_deploy: "Deploy Contract",
    approve: "Approve",
    swap: "Swap",
    generic: "Transaction",
  };
  return labels[type];
}

function getStatusLabel(status: SigningStatus): string {
  const labels: Record<SigningStatus, string> = {
    idle: "Ready",
    preparing: "Preparing...",
    awaiting_signature: "Waiting for signature...",
    signing: "Signing...",
    broadcasting: "Broadcasting...",
    success: "Success!",
    error: "Failed",
  };
  return labels[status];
}

function getStatusDescription(status: SigningStatus): string {
  const descriptions: Record<SigningStatus, string> = {
    idle: "",
    preparing: "Preparing transaction...",
    awaiting_signature: "Please approve in your wallet",
    signing: "Signing transaction...",
    broadcasting: "Submitting to network...",
    success: "Transaction submitted successfully",
    error: "Transaction failed",
  };
  return descriptions[status];
}

export default SigningModal;
