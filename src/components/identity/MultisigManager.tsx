"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Settings,
  Loader2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Shield,
  UserCheck,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Types
// =============================================================================

interface MultisigAccount {
  address: string;
  threshold: number;
  signatories: string[];
  pendingTxCount: number;
  name?: string;
}

interface PendingMultisigTx {
  hash: string;
  callData: string;
  callHash: string;
  when: {
    height: number;
    index: number;
  };
  approvals: string[];
  deposit: string;
  depositor: string;
  threshold: number;
}

interface MultisigManagerProps {
  onClose?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function MultisigManager({ onClose }: MultisigManagerProps) {
  const { substrateSDK, isConnected } = useBlockchain();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();

  // State
  const [activeTab, setActiveTab] = useState<"accounts" | "create" | "pending">("accounts");
  const [multisigAccounts, setMultisigAccounts] = useState<MultisigAccount[]>([]);
  const [selectedMultisig, setSelectedMultisig] = useState<MultisigAccount | null>(null);
  const [pendingTxs, setPendingTxs] = useState<PendingMultisigTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form state
  const [threshold, setThreshold] = useState(2);
  const [signatories, setSignatories] = useState<string[]>(["", ""]);
  const [multisigName, setMultisigName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Load multisig accounts
  useEffect(() => {
    const loadMultisigs = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would query the chain for multisig accounts
        // related to the current user
        setMultisigAccounts(getMockMultisigs());
      } catch (error) {
        console.error("Failed to load multisig accounts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedSubstrateAccount) {
      loadMultisigs();
    }
  }, [selectedSubstrateAccount]);

  // Load pending transactions for selected multisig
  useEffect(() => {
    if (!selectedMultisig) {
      setPendingTxs([]);
      return;
    }

    const loadPendingTxs = async () => {
      try {
        // Mock pending transactions
        setPendingTxs(getMockPendingTxs(selectedMultisig.address));
      } catch (error) {
        console.error("Failed to load pending txs:", error);
      }
    };

    loadPendingTxs();
  }, [selectedMultisig]);

  // Add signatory field
  const addSignatory = useCallback(() => {
    setSignatories((prev) => [...prev, ""]);
  }, []);

  // Remove signatory field
  const removeSignatory = useCallback((index: number) => {
    if (signatories.length <= 2) return;
    setSignatories((prev) => prev.filter((_, i) => i !== index));
  }, [signatories.length]);

  // Update signatory
  const updateSignatory = useCallback((index: number, value: string) => {
    setSignatories((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  // Create multisig
  const handleCreate = useCallback(async () => {
    const validSignatories = signatories.filter((s) => s.trim());
    if (validSignatories.length < 2) {
      toast.error("At least 2 signatories required");
      return;
    }
    if (threshold < 2 || threshold > validSignatories.length) {
      toast.error("Invalid threshold");
      return;
    }

    setIsCreating(true);
    try {
      // In real implementation, derive multisig address and save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate mock address
      const mockAddress = "5" + Array.from({ length: 47 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789"[
          Math.floor(Math.random() * 58)
        ]
      ).join("");

      const newMultisig: MultisigAccount = {
        address: mockAddress,
        threshold,
        signatories: validSignatories,
        pendingTxCount: 0,
        name: multisigName || undefined,
      };

      setMultisigAccounts((prev) => [newMultisig, ...prev]);
      setActiveTab("accounts");
      setSignatories(["", ""]);
      setThreshold(2);
      setMultisigName("");

      toast.success("Multisig account created");
    } catch (error) {
      console.error("Failed to create multisig:", error);
      toast.error("Failed to create multisig");
    } finally {
      setIsCreating(false);
    }
  }, [signatories, threshold, multisigName]);

  // Approve pending transaction
  const handleApprove = useCallback(async (tx: PendingMultisigTx) => {
    if (!selectedSubstrateAccount) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      // In real implementation, call multisig.approveAsMulti
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Transaction approved");

      // Update local state
      setPendingTxs((prev) =>
        prev.map((t) =>
          t.hash === tx.hash
            ? { ...t, approvals: [...t.approvals, selectedSubstrateAccount.address] }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve transaction");
    }
  }, [selectedSubstrateAccount]);

  // Cancel pending transaction
  const handleCancel = useCallback(async (tx: PendingMultisigTx) => {
    if (!selectedSubstrateAccount) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      // In real implementation, call multisig.cancelAsMulti
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Transaction cancelled");

      // Remove from local state
      setPendingTxs((prev) => prev.filter((t) => t.hash !== tx.hash));
    } catch (error) {
      console.error("Failed to cancel:", error);
      toast.error("Failed to cancel transaction");
    }
  }, [selectedSubstrateAccount]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }, []);

  return (
    <div className="card max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-selendra-400" />
            Multisig Manager
          </h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Create and manage multisig accounts
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2 mb-6">
        {(["accounts", "create", "pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-t-lg font-medium transition-colors capitalize",
              activeTab === tab
                ? "bg-selendra-500 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            )}
          >
            {tab === "pending" ? "Pending Txs" : tab}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-selendra-400" />
            </div>
          ) : multisigAccounts.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No multisig accounts found</p>
              <button
                onClick={() => setActiveTab("create")}
                className="btn-primary mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Multisig
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {multisigAccounts.map((account) => (
                <div
                  key={account.address}
                  className={clsx(
                    "p-4 rounded-lg border transition-colors cursor-pointer",
                    selectedMultisig?.address === account.address
                      ? "border-selendra-400 bg-selendra-400/5"
                      : "border-border hover:border-selendra-400/50"
                  )}
                  onClick={() => setSelectedMultisig(account)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-selendra-400" />
                        <span className="font-medium text-foreground">
                          {account.name || "Multisig Account"}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-selendra-400/20 text-selendra-400 rounded">
                          {account.threshold}/{account.signatories.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-foreground-secondary">
                          {account.address.slice(0, 10)}...{account.address.slice(-8)}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(account.address, account.address);
                          }}
                          className="text-foreground-secondary hover:text-foreground"
                        >
                          {copied === account.address ? (
                            <Check className="h-3 w-3 text-accent-green" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      {account.pendingTxCount > 0 && (
                        <span className="text-xs px-2 py-1 bg-accent-yellow/20 text-accent-yellow rounded">
                          {account.pendingTxCount} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedMultisig?.address === account.address && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Signatories
                      </h4>
                      <div className="space-y-1">
                        {account.signatories.map((sig, i) => (
                          <div
                            key={sig}
                            className="flex items-center gap-2 text-xs"
                          >
                            <UserCheck className="h-3 w-3 text-foreground-secondary" />
                            <code className="font-mono text-foreground-secondary">
                              {sig.slice(0, 12)}...{sig.slice(-8)}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Tab */}
      {activeTab === "create" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Account Name (optional)
            </label>
            <input
              type="text"
              value={multisigName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMultisigName(e.target.value)}
              placeholder="My Multisig"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Threshold
            </label>
            <select
              value={threshold}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setThreshold(Number(e.target.value))}
              className="input w-full"
            >
              {Array.from({ length: Math.max(signatories.length - 1, 1) }, (_, i) => i + 2).map(
                (n) => (
                  <option key={n} value={n}>
                    {n} of {signatories.length} signatories
                  </option>
                )
              )}
            </select>
            <p className="text-xs text-foreground-secondary mt-1">
              Number of approvals required to execute a transaction
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Signatories
              </label>
              <button
                onClick={addSignatory}
                className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {signatories.map((sig, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sig}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSignatory(i, e.target.value)}
                    placeholder={`Signatory ${i + 1} address`}
                    className="input flex-1 font-mono text-sm"
                  />
                  {signatories.length > 2 && (
                    <button
                      onClick={() => removeSignatory(i)}
                      className="p-2 text-foreground-secondary hover:text-accent-red"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-background-secondary rounded-lg">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Make sure all addresses are correct. The multisig address is deterministic
                and cannot be changed after creation.
              </span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Multisig Account
          </button>
        </div>
      )}

      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {!selectedMultisig ? (
            <div className="text-center py-12 text-foreground-secondary">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a multisig account to view pending transactions</p>
            </div>
          ) : pendingTxs.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTxs.map((tx) => (
                <div
                  key={tx.hash}
                  className="p-4 bg-background-secondary rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-sm font-mono text-foreground">
                      {tx.callHash.slice(0, 16)}...
                    </code>
                    <span className="text-xs px-2 py-1 bg-accent-yellow/20 text-accent-yellow rounded">
                      {tx.approvals.length}/{tx.threshold} approved
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: tx.threshold }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "h-2 flex-1 rounded",
                          i < tx.approvals.length
                            ? "bg-accent-green"
                            : "bg-border"
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(tx)}
                      className="btn-primary flex-1 text-sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    {tx.depositor === selectedSubstrateAccount?.address && (
                      <button
                        onClick={() => handleCancel(tx)}
                        className="btn-secondary flex-1 text-sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

function getMockMultisigs(): MultisigAccount[] {
  return [
    {
      address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      threshold: 2,
      signatories: [
        "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
        "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc",
        "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      ],
      pendingTxCount: 1,
      name: "Treasury Multisig",
    },
    {
      address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      threshold: 3,
      signatories: [
        "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
        "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc",
        "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
        "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      ],
      pendingTxCount: 0,
      name: "Team Wallet",
    },
  ];
}

function getMockPendingTxs(multisigAddress: string): PendingMultisigTx[] {
  if (multisigAddress === "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY") {
    return [
      {
        hash: "0x1234567890abcdef",
        callData: "0x...",
        callHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        when: { height: 1234567, index: 2 },
        approvals: ["5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY"],
        deposit: "1000000000000",
        depositor: "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
        threshold: 2,
      },
    ];
  }
  return [];
}

export default MultisigManager;
