"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// Types
interface Track {
  id: number;
  name: string;
  description: string;
  maxDeciding: number;
  decisionDeposit: string;
  preparePeriod: number;
  decisionPeriod: number;
  confirmPeriod: number;
  minEnactmentPeriod: number;
  minApproval: string;
  minSupport: string;
}

interface PreimageInfo {
  hash: string;
  length: number;
  deposit?: string;
  depositor?: string;
}

type ProposalOrigin = "root" | "whitelisted_caller" | "general_admin" | "referendum_canceller" | "referendum_killer" | "small_tipper" | "big_tipper" | "small_spender" | "medium_spender" | "big_spender" | "treasurer";

// Helper functions
function formatBalance(value: string | bigint, decimals: number = 18): string {
  const val = typeof value === "string" ? BigInt(value) : value;
  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = val / divisor;
  const fractionalPart = val % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const significantDecimals = fractionalStr.slice(0, 4).replace(/0+$/, "");
  if (significantDecimals) {
    return `${integerPart}.${significantDecimals}`;
  }
  return integerPart.toString();
}

function shortenHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

// TrackSelector Component
function TrackSelector({
  tracks,
  selectedTrack,
  onSelect,
}: {
  tracks: Track[];
  selectedTrack: Track | null;
  onSelect: (track: Track) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">Select Track</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              selectedTrack?.id === track.id
                ? "border-selendra-500 bg-selendra-500/10"
                : "border-border hover:border-selendra-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{track.name}</span>
              <span className="text-xs font-mono bg-background-secondary px-2 py-0.5 rounded">
                #{track.id}
              </span>
            </div>
            <p className="text-sm text-foreground-secondary mb-2">
              {track.description}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-foreground-secondary">
              <span>
                Deposit: {formatBalance(track.decisionDeposit)} SEL
              </span>
              <span>•</span>
              <span>Decision: {track.decisionPeriod} blocks</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// PreimageSection Component
function PreimageSection({
  preimageHash,
  setPreimageHash,
  preimageInfo,
  onLookup,
  onSubmitPreimage,
  proposalCall,
  setProposalCall,
  isSubmitting,
}: {
  preimageHash: string;
  setPreimageHash: (hash: string) => void;
  preimageInfo: PreimageInfo | null;
  onLookup: () => void;
  onSubmitPreimage: () => void;
  proposalCall: string;
  setProposalCall: (call: string) => void;
  isSubmitting: boolean;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("existing")}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            mode === "existing"
              ? "bg-selendra-500/20 text-selendra-400"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          Use Existing Preimage
        </button>
        <button
          onClick={() => setMode("new")}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            mode === "new"
              ? "bg-selendra-500/20 text-selendra-400"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          Submit New Preimage
        </button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Preimage Hash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={preimageHash}
                onChange={(e) => setPreimageHash(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground font-mono placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
              />
              <button
                onClick={onLookup}
                disabled={!preimageHash}
                className="btn-ghost text-sm px-4 py-2 disabled:opacity-50"
              >
                Lookup
              </button>
            </div>
          </div>

          {preimageInfo && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-400">
                  Preimage Found
                </span>
              </div>
              <div className="space-y-1 text-sm text-foreground-secondary">
                <div>Length: {preimageInfo.length} bytes</div>
                {preimageInfo.deposit && (
                  <div>Deposit: {formatBalance(preimageInfo.deposit)} SEL</div>
                )}
                {preimageInfo.depositor && (
                  <div>Depositor: {shortenHash(preimageInfo.depositor)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Proposal Call Data (hex encoded)
            </label>
            <textarea
              value={proposalCall}
              onChange={(e) => setProposalCall(e.target.value)}
              placeholder="0x... (the encoded call to be executed)"
              rows={4}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground font-mono placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500 resize-none"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Paste the encoded call data. You can generate this using the Extrinsic Builder.
            </p>
          </div>

          <button
            onClick={onSubmitPreimage}
            disabled={!proposalCall || isSubmitting}
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Preimage"}
          </button>
        </div>
      )}
    </div>
  );
}

// ProposalTemplates Component
function ProposalTemplates({
  onSelectTemplate,
}: {
  onSelectTemplate: (callData: string, description: string) => void;
}) {
  const templates = [
    {
      name: "Treasury Spend",
      description: "Request funds from the treasury",
      category: "Treasury",
      callData: "", // Would be generated
    },
    {
      name: "Set Code",
      description: "Propose a runtime upgrade",
      category: "System",
      callData: "",
    },
    {
      name: "Cancel Referendum",
      description: "Cancel an ongoing referendum",
      category: "Governance",
      callData: "",
    },
    {
      name: "Force Transfer",
      description: "Force transfer tokens (requires root)",
      category: "Balances",
      callData: "",
    },
    {
      name: "Add Validator",
      description: "Add a new validator to the set",
      category: "Staking",
      callData: "",
    },
    {
      name: "Whitelist Call",
      description: "Whitelist a call for fast-track execution",
      category: "Governance",
      callData: "",
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">Proposal Templates</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((template, idx) => (
          <button
            key={idx}
            onClick={() => onSelectTemplate(template.callData, template.description)}
            className="p-4 rounded-lg border border-border hover:border-selendra-500/50 text-left transition-colors"
          >
            <span className="text-xs bg-background-secondary px-2 py-0.5 rounded text-foreground-secondary">
              {template.category}
            </span>
            <div className="mt-2 font-medium text-foreground">{template.name}</div>
            <p className="text-sm text-foreground-secondary mt-1">
              {template.description}
            </p>
          </button>
        ))}
      </div>
      <p className="text-xs text-foreground-secondary">
        Templates provide a starting point. Use the Extrinsic Builder for full customization.
      </p>
    </div>
  );
}

// Main ProposalSubmission Component
export function ProposalSubmission() {
  const { substrateSDK, isConnected: chainConnected } = useBlockchain();
  const { isConnected, selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();

  const [step, setStep] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [preimageHash, setPreimageHash] = useState("");
  const [preimageInfo, setPreimageInfo] = useState<PreimageInfo | null>(null);
  const [proposalCall, setProposalCall] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch tracks
  const fetchTracks = useCallback(async () => {
    if (!substrateSDK) return;

    try {
      const api = await substrateSDK.getApi();

      // Try to get referendum tracks
      const tracksInfo = await api.consts.referenda?.tracks?.();

      if (tracksInfo) {
        const trackList: Track[] = [];
        const tracks = (tracksInfo as { toJSON: () => unknown }).toJSON() as Array<[number, Record<string, unknown>]>;

        if (Array.isArray(tracks)) {
          tracks.forEach(([id, info]) => {
            trackList.push({
              id: Number(id),
              name: String(info.name || `Track ${id}`),
              description: getTrackDescription(Number(id)),
              maxDeciding: Number(info.maxDeciding || 10),
              decisionDeposit: String(info.decisionDeposit || "0"),
              preparePeriod: Number(info.preparePeriod || 0),
              decisionPeriod: Number(info.decisionPeriod || 0),
              confirmPeriod: Number(info.confirmPeriod || 0),
              minEnactmentPeriod: Number(info.minEnactmentPeriod || 0),
              minApproval: String(info.minApproval || "50%"),
              minSupport: String(info.minSupport || "1%"),
            });
          });
        }

        setTracks(trackList);
      }
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      // Set mock tracks for development
      setTracks([
        {
          id: 0,
          name: "Root",
          description: "For system-level changes requiring highest authority",
          maxDeciding: 1,
          decisionDeposit: "100000000000000000000",
          preparePeriod: 7200,
          decisionPeriod: 100800,
          confirmPeriod: 14400,
          minEnactmentPeriod: 14400,
          minApproval: "100%",
          minSupport: "50%",
        },
        {
          id: 1,
          name: "Whitelisted Caller",
          description: "For pre-approved fast-track proposals",
          maxDeciding: 10,
          decisionDeposit: "10000000000000000000",
          preparePeriod: 3600,
          decisionPeriod: 50400,
          confirmPeriod: 7200,
          minEnactmentPeriod: 600,
          minApproval: "75%",
          minSupport: "25%",
        },
        {
          id: 10,
          name: "Treasurer",
          description: "For treasury spend proposals",
          maxDeciding: 10,
          decisionDeposit: "1000000000000000000",
          preparePeriod: 7200,
          decisionPeriod: 100800,
          confirmPeriod: 7200,
          minEnactmentPeriod: 14400,
          minApproval: "66%",
          minSupport: "10%",
        },
        {
          id: 20,
          name: "General Admin",
          description: "For general administrative changes",
          maxDeciding: 10,
          decisionDeposit: "5000000000000000000",
          preparePeriod: 7200,
          decisionPeriod: 100800,
          confirmPeriod: 7200,
          minEnactmentPeriod: 14400,
          minApproval: "60%",
          minSupport: "5%",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [substrateSDK]);

  // Get track description
  function getTrackDescription(id: number): string {
    const descriptions: Record<number, string> = {
      0: "For system-level changes requiring highest authority",
      1: "For pre-approved fast-track proposals",
      10: "For treasury spend proposals",
      11: "For small tipper proposals",
      12: "For big tipper proposals",
      13: "For small spender proposals",
      14: "For medium spender proposals",
      15: "For big spender proposals",
      20: "For general administrative changes",
      30: "For referendum cancellation",
      31: "For killing referenda",
    };
    return descriptions[id] || `Governance track ${id}`;
  }

  useEffect(() => {
    if (chainConnected) {
      fetchTracks();
    }
  }, [chainConnected, fetchTracks]);

  // Lookup preimage
  const lookupPreimage = async () => {
    if (!substrateSDK || !preimageHash) return;

    setError(null);

    try {
      const api = await substrateSDK.getApi();

      // Query preimage status
      const preimage = await api.query.preimage?.statusFor?.(preimageHash);

      if (!preimage || (preimage as { isNone?: boolean }).isNone) {
        setError("Preimage not found");
        setPreimageInfo(null);
        return;
      }

      const status = (preimage as { toJSON: () => unknown }).toJSON();
      let info: PreimageInfo = { hash: preimageHash, length: 0 };

      if (typeof status === "object" && status) {
        const s = status as Record<string, unknown>;
        if (s.unrequested) {
          const unreq = s.unrequested as Record<string, unknown>;
          info = {
            hash: preimageHash,
            length: Number(unreq.len || 0),
            deposit: String(unreq.deposit || "0"),
            depositor: String((unreq.deposit as [string, unknown])?.[0] || ""),
          };
        } else if (s.requested) {
          const req = s.requested as Record<string, unknown>;
          info = {
            hash: preimageHash,
            length: Number(req.len || 0),
            deposit: req.deposit ? String((req.deposit as [unknown, unknown])[1]) : undefined,
            depositor: req.deposit ? String((req.deposit as [string, unknown])[0]) : undefined,
          };
        }
      }

      setPreimageInfo(info);
    } catch (err) {
      console.error("Failed to lookup preimage:", err);
      setError("Failed to lookup preimage");
      setPreimageInfo(null);
    }
  };

  // Submit preimage
  const submitPreimage = async () => {
    if (!substrateSDK || !selectedSubstrateAccount || !proposalCall) return;

    setError(null);
    setSubmitting(true);

    try {
      const api = await substrateSDK.getApi();

      // Convert call data to bytes
      const callBytes = proposalCall.startsWith("0x")
        ? proposalCall
        : `0x${proposalCall}`;

      // Create notePreimage extrinsic
      const tx = api.tx.preimage?.notePreimage?.(callBytes);

      if (!tx) {
        throw new Error("Preimage pallet not available");
      }

      const hash = await signAndSubmitExtrinsic(tx);

      // Calculate the preimage hash (Blake2b-256 of the call data)
      const { blake2AsHex } = await import("@polkadot/util-crypto");
      const calculatedHash = blake2AsHex(callBytes, 256);

      setPreimageHash(calculatedHash);
      setPreimageInfo({
        hash: calculatedHash,
        length: Math.floor((callBytes.length - 2) / 2), // hex to bytes
        depositor: selectedSubstrateAccount.address,
      });

      setSuccessMessage(`Preimage submitted! Hash: ${shortenHash(calculatedHash)}`);
    } catch (err) {
      console.error("Failed to submit preimage:", err);
      setError(err instanceof Error ? err.message : "Failed to submit preimage");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit proposal
  const submitProposal = async () => {
    if (!substrateSDK || !selectedSubstrateAccount || !selectedTrack || !preimageHash) return;

    setError(null);
    setSubmitting(true);

    try {
      const api = await substrateSDK.getApi();

      // Get preimage length
      const length = preimageInfo?.length || 0;

      // Create submit extrinsic for OpenGov (referenda pallet)
      const tx = api.tx.referenda?.submit?.(
        { Origins: selectedTrack.name.replace(/\s+/g, "") }, // Origin based on track
        { Lookup: { hash: preimageHash, len: length } }, // Preimage lookup
        { After: 0 } // Enact at earliest possible block
      );

      if (!tx) {
        throw new Error("Referenda pallet not available");
      }

      const hash = await signAndSubmitExtrinsic(tx);

      setSuccessMessage(`Proposal submitted! Transaction: ${shortenHash(hash)}`);
      
      // Reset form
      setStep(1);
      setSelectedTrack(null);
      setPreimageHash("");
      setPreimageInfo(null);
      setProposalCall("");
      setProposalDescription("");
    } catch (err) {
      console.error("Failed to submit proposal:", err);
      setError(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTemplate = (callData: string, description: string) => {
    setProposalCall(callData);
    setProposalDescription(description);
  };

  const canProceedToStep2 = selectedTrack !== null;
  const canProceedToStep3 = preimageHash && preimageInfo;
  const canSubmit = selectedTrack && preimageHash && preimageInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Submit Proposal</h2>
        <p className="text-sm text-foreground-secondary mt-1">
          Create a new governance proposal for the community to vote on
        </p>
      </div>

      {/* Connection Warning */}
      {!isConnected && (
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-orange-400">
            Connect your wallet to submit a proposal
          </p>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-sm text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => {
                if (s === 1) setStep(1);
                else if (s === 2 && canProceedToStep2) setStep(2);
                else if (s === 3 && canProceedToStep3) setStep(3);
              }}
              disabled={
                (s === 2 && !canProceedToStep2) ||
                (s === 3 && !canProceedToStep3)
              }
              className={`flex items-center gap-2 ${
                step === s
                  ? "text-selendra-400"
                  : step > s
                    ? "text-green-400"
                    : "text-foreground-secondary"
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  step === s
                    ? "border-selendra-500 bg-selendra-500/20"
                    : step > s
                      ? "border-green-500 bg-green-500/20"
                      : "border-border"
                }`}
              >
                {step > s ? "✓" : s}
              </span>
              <span className="text-sm font-medium hidden md:inline">
                {s === 1 ? "Select Track" : s === 2 ? "Preimage" : "Submit"}
              </span>
            </button>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 ${
                  step > s ? "bg-green-500" : "bg-border"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-selendra-500"></div>
        </div>
      )}

      {/* Step 1: Select Track */}
      {!loading && step === 1 && (
        <div className="card p-6 space-y-6">
          <TrackSelector
            tracks={tracks}
            selectedTrack={selectedTrack}
            onSelect={setSelectedTrack}
          />

          {selectedTrack && (
            <div className="p-4 rounded-lg bg-selendra-500/10 border border-selendra-500/30">
              <h4 className="text-sm font-medium text-selendra-400 mb-2">
                Selected: {selectedTrack.name}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-foreground-secondary">Decision Deposit</span>
                  <div className="font-medium text-foreground">
                    {formatBalance(selectedTrack.decisionDeposit)} SEL
                  </div>
                </div>
                <div>
                  <span className="text-foreground-secondary">Prepare Period</span>
                  <div className="font-medium text-foreground">
                    {selectedTrack.preparePeriod} blocks
                  </div>
                </div>
                <div>
                  <span className="text-foreground-secondary">Decision Period</span>
                  <div className="font-medium text-foreground">
                    {selectedTrack.decisionPeriod} blocks
                  </div>
                </div>
                <div>
                  <span className="text-foreground-secondary">Confirm Period</span>
                  <div className="font-medium text-foreground">
                    {selectedTrack.confirmPeriod} blocks
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              Next: Preimage
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preimage */}
      {!loading && step === 2 && (
        <div className="card p-6 space-y-6">
          <PreimageSection
            preimageHash={preimageHash}
            setPreimageHash={setPreimageHash}
            preimageInfo={preimageInfo}
            onLookup={lookupPreimage}
            onSubmitPreimage={submitPreimage}
            proposalCall={proposalCall}
            setProposalCall={setProposalCall}
            isSubmitting={submitting}
          />

          <div className="border-t border-border pt-6">
            <ProposalTemplates onSelectTemplate={handleSelectTemplate} />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="btn-ghost px-6 py-2"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              Next: Review & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {!loading && step === 3 && (
        <div className="card p-6 space-y-6">
          <h4 className="text-lg font-medium text-foreground">Review Proposal</h4>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background-secondary">
              <span className="text-sm text-foreground-secondary">Track</span>
              <div className="font-medium text-foreground">
                {selectedTrack?.name} (#{selectedTrack?.id})
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background-secondary">
              <span className="text-sm text-foreground-secondary">Preimage Hash</span>
              <div className="font-mono text-foreground break-all">
                {preimageHash}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background-secondary">
              <span className="text-sm text-foreground-secondary">Preimage Length</span>
              <div className="font-medium text-foreground">
                {preimageInfo?.length} bytes
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background-secondary">
              <span className="text-sm text-foreground-secondary">Decision Deposit Required</span>
              <div className="font-medium text-foreground">
                {selectedTrack && formatBalance(selectedTrack.decisionDeposit)} SEL
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                This deposit will be returned after the referendum concludes
              </p>
            </div>

            {proposalDescription && (
              <div className="p-4 rounded-lg bg-background-secondary">
                <span className="text-sm text-foreground-secondary">Description</span>
                <div className="text-foreground">{proposalDescription}</div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-yellow-400">
              <strong>Important:</strong> Submitting a proposal requires a decision deposit.
              This deposit will be slashed if the proposal is deemed malicious.
            </p>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="btn-ghost px-6 py-2"
            >
              Back
            </button>
            <button
              onClick={submitProposal}
              disabled={!canSubmit || !isConnected || submitting}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Proposal"}
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          About OpenGov Proposals
        </h4>
        <ul className="space-y-1 text-sm text-foreground-secondary">
          <li>• Proposals go through prepare, decision, and confirmation periods</li>
          <li>• Each track has different thresholds and time periods</li>
          <li>• Preimages store the actual proposal call data on-chain</li>
          <li>• Decision deposits are required to move proposals forward</li>
          <li>• Community members vote with their tokens during the decision period</li>
        </ul>
      </div>
    </div>
  );
}
