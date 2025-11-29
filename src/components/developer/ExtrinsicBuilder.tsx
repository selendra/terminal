"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Code2,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  Loader2,
  Send,
  FileCode,
  Hash,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Types
// =============================================================================

interface PalletInfo {
  name: string;
  calls: CallInfo[];
  constants: ConstantInfo[];
  storage: StorageInfo[];
}

interface CallInfo {
  name: string;
  docs: string[];
  args: ArgInfo[];
}

interface ArgInfo {
  name: string;
  type: string;
  typeName?: string;
}

interface ConstantInfo {
  name: string;
  type: string;
  value: string;
  docs: string[];
}

interface StorageInfo {
  name: string;
  modifier: string;
  type: string;
  docs: string[];
}

interface ExtrinsicHistory {
  id: string;
  pallet: string;
  call: string;
  args: Record<string, string>;
  timestamp: number;
  status: "pending" | "success" | "failed";
  hash?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ExtrinsicBuilder() {
  const { substrateSDK, isConnected } = useBlockchain();
  const { selectedSubstrateAccount, isConnected: walletConnected } = useWallet();
  
  // State
  const [pallets, setPallets] = useState<PalletInfo[]>([]);
  const [selectedPallet, setSelectedPallet] = useState<string>("");
  const [selectedCall, setSelectedCall] = useState<string>("");
  const [callArgs, setCallArgs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [encodedCall, setEncodedCall] = useState<string | null>(null);
  const [history, setHistory] = useState<ExtrinsicHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"builder" | "batch" | "history">("builder");
  const [batchCalls, setBatchCalls] = useState<Array<{ pallet: string; call: string; args: Record<string, string> }>>([]);

  // Load pallets from metadata
  useEffect(() => {
    const loadPallets = async () => {
      if (!substrateSDK) {
        // Use mock data
        setPallets(getMockPallets());
        return;
      }

      setIsLoading(true);
      try {
        const api = substrateSDK.getApi?.();
        if (!api) {
          setPallets(getMockPallets());
          return;
        }

        const metadata = api.runtimeMetadata;
        const palletList: PalletInfo[] = [];

        // Parse metadata to extract pallets
        for (const pallet of metadata.asLatest.pallets) {
          const palletName = pallet.name.toString();
          const calls: CallInfo[] = [];
          const constants: ConstantInfo[] = [];
          const storage: StorageInfo[] = [];

          // Get calls
          if (pallet.calls.isSome) {
            const callsType = api.registry.lookup.getTypeDef(pallet.calls.unwrap().type);
            if (callsType.sub && Array.isArray(callsType.sub)) {
              for (const call of callsType.sub) {
                calls.push({
                  name: call.name || "",
                  docs: [],
                  args: (call.sub as ArgInfo[] || []).map((arg: { name?: string; type?: string }) => ({
                    name: arg.name || "",
                    type: arg.type || "unknown",
                  })),
                });
              }
            }
          }

          // Get constants
          for (const constant of pallet.constants) {
            constants.push({
              name: constant.name.toString(),
              type: constant.type.toString(),
              value: api.registry.createType(constant.type.toString(), constant.value).toHuman()?.toString() || "",
              docs: constant.docs.map((d: { toString: () => string }) => d.toString()),
            });
          }

          palletList.push({
            name: palletName,
            calls,
            constants,
            storage,
          });
        }

        setPallets(palletList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Failed to load pallets:", error);
        setPallets(getMockPallets());
      } finally {
        setIsLoading(false);
      }
    };

    loadPallets();
  }, [substrateSDK]);

  // Get current call info
  const currentPallet = pallets.find((p) => p.name === selectedPallet);
  const currentCall = currentPallet?.calls.find((c) => c.name === selectedCall);

  // Estimate fee when call changes
  useEffect(() => {
    const estimateFee = async () => {
      if (!substrateSDK || !selectedPallet || !selectedCall || !selectedSubstrateAccount) {
        setEstimatedFee(null);
        setEncodedCall(null);
        return;
      }

      try {
        const api = substrateSDK.getApi?.();
        if (!api) return;

        // Build the call
        const callFn = api.tx[selectedPallet]?.[selectedCall];
        if (!callFn) return;

        const args = currentCall?.args.map((arg) => callArgs[arg.name] || "") || [];
        const tx = callFn(...args);

        // Get encoded call
        setEncodedCall(tx.method.toHex());

        // Estimate fee
        const info = await tx.paymentInfo(selectedSubstrateAccount.address);
        const fee = info.partialFee.toHuman();
        setEstimatedFee(fee);
      } catch (error) {
        console.error("Failed to estimate fee:", error);
        setEstimatedFee(null);
      }
    };

    const debounce = setTimeout(estimateFee, 500);
    return () => clearTimeout(debounce);
  }, [substrateSDK, selectedPallet, selectedCall, callArgs, selectedSubstrateAccount, currentCall]);

  // Submit extrinsic
  const handleSubmit = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    const historyId = Date.now().toString();

    try {
      const api = substrateSDK.getApi?.();
      if (!api) throw new Error("API not available");

      const callFn = api.tx[selectedPallet]?.[selectedCall];
      if (!callFn) throw new Error("Call not found");

      const args = currentCall?.args.map((arg) => callArgs[arg.name] || "") || [];
      const tx = callFn(...args);

      // Add to history
      setHistory((prev) => [
        {
          id: historyId,
          pallet: selectedPallet,
          call: selectedCall,
          args: { ...callArgs },
          timestamp: Date.now(),
          status: "pending",
        },
        ...prev.slice(0, 19),
      ]);

      // Sign and send
      const { web3FromSource } = await import("@polkadot/extension-dapp");
      const injector = await web3FromSource(selectedSubstrateAccount.source);

      await tx.signAndSend(
        selectedSubstrateAccount.address,
        { signer: injector.signer },
        ({ status, txHash }: { status: { isInBlock: boolean; isFinalized: boolean }; txHash: { toHex: () => string } }) => {
          if (status.isInBlock) {
            toast.success("Transaction in block");
            setHistory((prev) =>
              prev.map((h) =>
                h.id === historyId
                  ? { ...h, status: "success", hash: txHash.toHex() }
                  : h
              )
            );
          } else if (status.isFinalized) {
            toast.success("Transaction finalized!");
          }
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      toast.error(message);
      setHistory((prev) =>
        prev.map((h) => (h.id === historyId ? { ...h, status: "failed" } : h))
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [substrateSDK, selectedSubstrateAccount, selectedPallet, selectedCall, callArgs, currentCall]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }, []);

  // Toggle pallet expansion
  const togglePallet = useCallback((palletName: string) => {
    setExpandedPallets((prev) => {
      const next = new Set(prev);
      if (next.has(palletName)) {
        next.delete(palletName);
      } else {
        next.add(palletName);
      }
      return next;
    });
  }, []);

  // Add to batch
  const addToBatch = useCallback(() => {
    if (!selectedPallet || !selectedCall) return;
    setBatchCalls((prev) => [
      ...prev,
      { pallet: selectedPallet, call: selectedCall, args: { ...callArgs } },
    ]);
    toast.success("Added to batch");
  }, [selectedPallet, selectedCall, callArgs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Code2 className="h-6 w-6 text-selendra-400" />
            Extrinsic Builder
          </h1>
          <p className="text-foreground-secondary mt-1">
            Build and submit substrate extrinsics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["builder", "batch", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-t-lg font-medium transition-colors",
              activeTab === tab
                ? "bg-selendra-500 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "batch" && batchCalls.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent-yellow text-black rounded-full">
                {batchCalls.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "builder" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Pallet List */}
          <div className="card max-h-[600px] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Pallets
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-selendra-400" />
              </div>
            ) : (
              <div className="space-y-1">
                {pallets.map((pallet) => (
                  <div key={pallet.name}>
                    <button
                      onClick={() => {
                        togglePallet(pallet.name);
                        setSelectedPallet(pallet.name);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors",
                        selectedPallet === pallet.name
                          ? "bg-selendra-500/20 text-selendra-400"
                          : "hover:bg-background-secondary text-foreground-secondary"
                      )}
                    >
                      {expandedPallets.has(pallet.name) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-mono text-sm">{pallet.name}</span>
                      <span className="ml-auto text-xs text-foreground-secondary">
                        {pallet.calls.length}
                      </span>
                    </button>

                    {expandedPallets.has(pallet.name) && (
                      <div className="ml-6 space-y-1 mt-1">
                        {pallet.calls.map((call) => (
                          <button
                            key={call.name}
                            onClick={() => {
                              setSelectedPallet(pallet.name);
                              setSelectedCall(call.name);
                              setCallArgs({});
                            }}
                            className={clsx(
                              "w-full px-3 py-1.5 rounded text-left text-sm font-mono transition-colors",
                              selectedCall === call.name && selectedPallet === pallet.name
                                ? "bg-selendra-500 text-white"
                                : "hover:bg-background-secondary text-foreground-secondary"
                            )}
                          >
                            {call.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call Builder */}
          <div className="col-span-2 space-y-4">
            {currentCall ? (
              <>
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      {selectedPallet}.{selectedCall}
                    </h3>
                    <button
                      onClick={addToBatch}
                      className="btn-secondary text-sm"
                    >
                      Add to Batch
                    </button>
                  </div>

                  {/* Arguments */}
                  {currentCall.args.length > 0 ? (
                    <div className="space-y-4">
                      {currentCall.args.map((arg) => (
                        <div key={arg.name}>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {arg.name}
                            <span className="ml-2 text-xs text-foreground-secondary font-mono">
                              ({arg.type})
                            </span>
                          </label>
                          <input
                            type="text"
                            value={callArgs[arg.name] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setCallArgs((prev) => ({
                                ...prev,
                                [arg.name]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${arg.name}`}
                            className="input w-full"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground-secondary text-sm">
                      This call has no arguments
                    </p>
                  )}
                </div>

                {/* Fee & Encoded Call */}
                <div className="card">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground-secondary mb-1">
                        Estimated Fee
                      </label>
                      <p className="text-lg font-mono text-foreground">
                        {estimatedFee || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground-secondary mb-1">
                        Encoded Call
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-foreground truncate flex-1">
                          {encodedCall ? `${encodedCall.slice(0, 30)}...` : "—"}
                        </code>
                        {encodedCall && (
                          <button
                            onClick={() => handleCopy(encodedCall)}
                            className="p-1 hover:bg-background-secondary rounded"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-accent-green" />
                            ) : (
                              <Copy className="h-4 w-4 text-foreground-secondary" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!walletConnected || isSubmitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Submitting..." : "Submit Extrinsic"}
                  </button>

                  {!walletConnected && (
                    <p className="text-sm text-foreground-secondary flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Connect wallet to submit
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="card">
                <div className="flex flex-col items-center justify-center py-12 text-foreground-secondary">
                  <Info className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a pallet and call to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "batch" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">Batch Calls</h3>
          {batchCalls.length === 0 ? (
            <p className="text-foreground-secondary text-center py-8">
              No calls in batch. Add calls from the Builder tab.
            </p>
          ) : (
            <div className="space-y-2">
              {batchCalls.map((call, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded"
                >
                  <span className="font-mono text-sm">
                    {call.pallet}.{call.call}
                  </span>
                  <button
                    onClick={() =>
                      setBatchCalls((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="text-accent-red hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  toast.success("Batch submitted (mock)");
                  setBatchCalls([]);
                }}
                className="btn-primary w-full mt-4"
              >
                Submit Batch ({batchCalls.length} calls)
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">Recent Extrinsics</h3>
          {history.length === 0 ? (
            <p className="text-foreground-secondary text-center py-8">
              No recent extrinsics
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-background-secondary rounded"
                >
                  <div>
                    <span className="font-mono text-sm">
                      {item.pallet}.{item.call}
                    </span>
                    <p className="text-xs text-foreground-secondary">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "px-2 py-1 rounded text-xs font-medium",
                      item.status === "success" && "bg-accent-green/20 text-accent-green",
                      item.status === "failed" && "bg-accent-red/20 text-accent-red",
                      item.status === "pending" && "bg-accent-yellow/20 text-accent-yellow"
                    )}
                  >
                    {item.status}
                  </span>
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

function getMockPallets(): PalletInfo[] {
  return [
    {
      name: "Balances",
      calls: [
        {
          name: "transfer",
          docs: ["Transfer some balance to another account"],
          args: [
            { name: "dest", type: "AccountId" },
            { name: "value", type: "Balance" },
          ],
        },
        {
          name: "transferKeepAlive",
          docs: ["Transfer while keeping account alive"],
          args: [
            { name: "dest", type: "AccountId" },
            { name: "value", type: "Balance" },
          ],
        },
        {
          name: "transferAll",
          docs: ["Transfer entire balance"],
          args: [
            { name: "dest", type: "AccountId" },
            { name: "keepAlive", type: "bool" },
          ],
        },
      ],
      constants: [],
      storage: [],
    },
    {
      name: "Staking",
      calls: [
        {
          name: "bond",
          docs: ["Bond tokens for staking"],
          args: [
            { name: "value", type: "Balance" },
            { name: "payee", type: "RewardDestination" },
          ],
        },
        {
          name: "nominate",
          docs: ["Nominate validators"],
          args: [{ name: "targets", type: "Vec<AccountId>" }],
        },
        {
          name: "unbond",
          docs: ["Unbond tokens"],
          args: [{ name: "value", type: "Balance" }],
        },
        {
          name: "chill",
          docs: ["Stop nominating"],
          args: [],
        },
      ],
      constants: [],
      storage: [],
    },
    {
      name: "System",
      calls: [
        {
          name: "remark",
          docs: ["Make a remark on-chain"],
          args: [{ name: "remark", type: "Bytes" }],
        },
        {
          name: "remarkWithEvent",
          docs: ["Make a remark and emit an event"],
          args: [{ name: "remark", type: "Bytes" }],
        },
      ],
      constants: [],
      storage: [],
    },
    {
      name: "Utility",
      calls: [
        {
          name: "batch",
          docs: ["Execute multiple calls in a batch"],
          args: [{ name: "calls", type: "Vec<Call>" }],
        },
        {
          name: "batchAll",
          docs: ["Execute batch, revert all on failure"],
          args: [{ name: "calls", type: "Vec<Call>" }],
        },
      ],
      constants: [],
      storage: [],
    },
  ];
}

export default ExtrinsicBuilder;
