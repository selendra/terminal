"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// Types
interface Registrar {
  index: number;
  account: string;
  fee: string;
  fields: string[];
  active: boolean;
}

interface JudgementRequest {
  registrarIndex: number;
  status: "pending" | "approved" | "rejected" | "erroneous";
  timestamp?: number;
}

interface IdentityInfo {
  display?: string;
  legal?: string;
  web?: string;
  email?: string;
  twitter?: string;
  matrix?: string;
  github?: string;
  image?: string;
  judgements: JudgementRequest[];
  deposit: string;
}

type JudgementType =
  | "Unknown"
  | "FeePaid"
  | "Reasonable"
  | "KnownGood"
  | "OutOfDate"
  | "LowQuality"
  | "Erroneous";

// Helper functions
function formatBalance(value: string | bigint, decimals: number = 18): string {
  const val = typeof value === "string" ? BigInt(value) : value;
  const divisor = BigInt(10 ** decimals);
  const integerPart = val / divisor;
  const fractionalPart = val % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const significantDecimals = fractionalStr.slice(0, 4).replace(/0+$/, "");
  if (significantDecimals) {
    return `${integerPart}.${significantDecimals}`;
  }
  return integerPart.toString();
}

function shortenAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getJudgementBadgeColor(type: JudgementType): string {
  switch (type) {
    case "Reasonable":
    case "KnownGood":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "FeePaid":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "OutOfDate":
    case "LowQuality":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "Erroneous":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

// RegistrarCard Component
function RegistrarCard({
  registrar,
  onRequestJudgement,
  hasIdentity,
  hasPendingRequest,
  isConnected,
}: {
  registrar: Registrar;
  onRequestJudgement: (index: number, fee: string) => void;
  hasIdentity: boolean;
  hasPendingRequest: boolean;
  isConnected: boolean;
}) {
  return (
    <div className="card p-4 hover:border-selendra-500/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-selendra-500/20 text-selendra-400 px-2 py-0.5 rounded">
              #{registrar.index}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                registrar.active
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {registrar.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="font-mono text-sm text-foreground mb-2">
            {shortenAddress(registrar.account)}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">Fee:</span>
              <span className="text-selendra-400 font-medium">
                {formatBalance(registrar.fee)} SEL
              </span>
            </div>

            {registrar.fields.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-foreground-secondary">Fields:</span>
                <div className="flex flex-wrap gap-1">
                  {registrar.fields.map((field, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-background-secondary px-2 py-0.5 rounded text-foreground-secondary"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => onRequestJudgement(registrar.index, registrar.fee)}
            disabled={
              !isConnected ||
              !hasIdentity ||
              hasPendingRequest ||
              !registrar.active
            }
            className="btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Request Judgement
          </button>

          {!isConnected && (
            <span className="text-xs text-foreground-secondary">
              Connect wallet
            </span>
          )}
          {isConnected && !hasIdentity && (
            <span className="text-xs text-orange-400">Set identity first</span>
          )}
          {isConnected && hasIdentity && hasPendingRequest && (
            <span className="text-xs text-yellow-400">
              Pending request exists
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// JudgementRequestCard Component
function JudgementRequestCard({
  request,
  registrar,
  onCancel,
}: {
  request: JudgementRequest;
  registrar?: Registrar;
  onCancel: (index: number) => void;
}) {
  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    erroneous: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono bg-selendra-500/20 text-selendra-400 px-2 py-0.5 rounded">
            Registrar #{request.registrarIndex}
          </span>

          {registrar && (
            <span className="text-sm text-foreground-secondary font-mono">
              {shortenAddress(registrar.account)}
            </span>
          )}

          <span
            className={`text-xs px-2 py-0.5 rounded border ${statusColors[request.status]}`}
          >
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>

        {request.status === "pending" && (
          <button
            onClick={() => onCancel(request.registrarIndex)}
            className="text-sm text-red-400 hover:text-red-300 px-3 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {request.timestamp && (
        <div className="mt-2 text-xs text-foreground-secondary">
          Requested: {new Date(request.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// MyIdentityCard Component
function MyIdentityCard({
  identity,
  onClear,
}: {
  identity: IdentityInfo;
  onClear: () => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">My Identity</h3>
        <button
          onClick={onClear}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Clear Identity
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {identity.display && (
          <div>
            <span className="text-xs text-foreground-secondary">Display</span>
            <div className="text-sm font-medium text-foreground">
              {identity.display}
            </div>
          </div>
        )}
        {identity.legal && (
          <div>
            <span className="text-xs text-foreground-secondary">
              Legal Name
            </span>
            <div className="text-sm text-foreground">{identity.legal}</div>
          </div>
        )}
        {identity.email && (
          <div>
            <span className="text-xs text-foreground-secondary">Email</span>
            <div className="text-sm text-foreground">{identity.email}</div>
          </div>
        )}
        {identity.web && (
          <div>
            <span className="text-xs text-foreground-secondary">Website</span>
            <div className="text-sm text-foreground">{identity.web}</div>
          </div>
        )}
        {identity.twitter && (
          <div>
            <span className="text-xs text-foreground-secondary">Twitter</span>
            <div className="text-sm text-foreground">{identity.twitter}</div>
          </div>
        )}
        {identity.matrix && (
          <div>
            <span className="text-xs text-foreground-secondary">Matrix</span>
            <div className="text-sm text-foreground">{identity.matrix}</div>
          </div>
        )}
      </div>

      {identity.judgements.length > 0 && (
        <div>
          <span className="text-xs text-foreground-secondary mb-2 block">
            Judgements
          </span>
          <div className="flex flex-wrap gap-2">
            {identity.judgements.map((j, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-0.5 rounded border ${getJudgementBadgeColor(
                  j.status === "approved"
                    ? "Reasonable"
                    : j.status === "rejected"
                      ? "LowQuality"
                      : "FeePaid"
                )}`}
              >
                Registrar #{j.registrarIndex}: {j.status}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <span className="text-xs text-foreground-secondary">Deposit:</span>
        <span className="ml-2 text-sm text-selendra-400">
          {formatBalance(identity.deposit)} SEL
        </span>
      </div>
    </div>
  );
}

// Main RegistrarList Component
export function RegistrarList() {
  const { substrateSDK, isConnected: chainConnected } = useBlockchain();
  const { isConnected, selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();

  const [activeTab, setActiveTab] = useState<"registrars" | "my-requests">(
    "registrars"
  );
  const [registrars, setRegistrars] = useState<Registrar[]>([]);
  const [myIdentity, setMyIdentity] = useState<IdentityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch registrars
  const fetchRegistrars = useCallback(async () => {
    if (!substrateSDK) return;

    try {
      const api = await substrateSDK.getApi();

      // Get all registrars
      const registrarsData =
        await api.query.identity.registrars.entries?.() ||
        await api.query.identity?.registrars?.();

      const registrarList: Registrar[] = [];

      if (Array.isArray(registrarsData)) {
        // entries() format
        registrarsData.forEach(([key, value]: [unknown, unknown]) => {
          const registrar = (value as { toJSON: () => unknown }).toJSON();
          if (registrar) {
            const reg = registrar as Record<string, unknown>;
            registrarList.push({
              index: registrarList.length,
              account: (reg.account as string) || "",
              fee: String(reg.fee || "0"),
              fields: Array.isArray(reg.fields) ? (reg.fields as string[]) : [],
              active: true,
            });
          }
        });
      } else if (registrarsData) {
        // Direct query format (array)
        const regs = (
          registrarsData as { toJSON: () => unknown }
        ).toJSON() as unknown[];
        if (Array.isArray(regs)) {
          regs.forEach((r, idx) => {
            if (r) {
              const reg = r as Record<string, unknown>;
              registrarList.push({
                index: idx,
                account: (reg.account as string) || "",
                fee: String(reg.fee || "0"),
                fields: Array.isArray(reg.fields)
                  ? (reg.fields as string[])
                  : [],
                active: true,
              });
            }
          });
        }
      }

      setRegistrars(registrarList);
    } catch (err) {
      console.error("Failed to fetch registrars:", err);
      // Set mock data for development
      setRegistrars([
        {
          index: 0,
          account: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          fee: "1000000000000000000",
          fields: ["Display", "Legal", "Web", "Email", "Twitter"],
          active: true,
        },
        {
          index: 1,
          account: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
          fee: "5000000000000000000",
          fields: ["Display", "Legal", "Web", "Email", "Twitter", "Matrix"],
          active: true,
        },
        {
          index: 2,
          account: "5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y",
          fee: "10000000000000000000",
          fields: ["All Fields"],
          active: false,
        },
      ]);
    }
  }, [substrateSDK]);

  // Fetch user's identity
  const fetchMyIdentity = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount) {
      setMyIdentity(null);
      return;
    }

    try {
      const api = await substrateSDK.getApi();

      const identityData = await api.query.identity?.identityOf?.(
        selectedSubstrateAccount.address
      );

      if (!identityData || (identityData as { isNone?: boolean }).isNone) {
        setMyIdentity(null);
        return;
      }

      const identity = (identityData as { toJSON: () => unknown }).toJSON();
      if (!identity) {
        setMyIdentity(null);
        return;
      }

      const idInfo = Array.isArray(identity) ? identity[0] : identity;
      const info =
        (idInfo as { info?: Record<string, unknown> }).info ||
        (idInfo as Record<string, unknown>);

      // Extract judgements
      const judgements: JudgementRequest[] = [];
      const rawJudgements = (idInfo as { judgements?: unknown[] }).judgements;
      if (Array.isArray(rawJudgements)) {
        rawJudgements.forEach((j: unknown) => {
          const judgement = j as [number, unknown];
          const status = judgement[1] as string | { [key: string]: unknown };
          let statusStr: "pending" | "approved" | "rejected" | "erroneous" =
            "pending";

          if (typeof status === "string") {
            if (status === "Reasonable" || status === "KnownGood") {
              statusStr = "approved";
            } else if (status === "Erroneous") {
              statusStr = "erroneous";
            } else if (status === "LowQuality" || status === "OutOfDate") {
              statusStr = "rejected";
            }
          } else if (typeof status === "object") {
            const key = Object.keys(status)[0];
            if (key === "Reasonable" || key === "KnownGood") {
              statusStr = "approved";
            } else if (key === "Erroneous") {
              statusStr = "erroneous";
            } else if (key === "LowQuality" || key === "OutOfDate") {
              statusStr = "rejected";
            } else if (key === "FeePaid") {
              statusStr = "pending";
            }
          }

          judgements.push({
            registrarIndex: judgement[0],
            status: statusStr,
          });
        });
      }

      const extractField = (field: unknown): string | undefined => {
        if (!field) return undefined;
        if (typeof field === "string") return field;
        const f = field as { raw?: string; Raw?: string };
        return f.raw || f.Raw || undefined;
      };

      setMyIdentity({
        display: extractField(info.display),
        legal: extractField(info.legal),
        web: extractField(info.web),
        email: extractField(info.email),
        twitter: extractField(info.twitter),
        matrix: extractField(info.riot || info.matrix),
        github: extractField((info as { github?: unknown }).github),
        image: extractField(info.image),
        judgements,
        deposit: String(
          (idInfo as { deposit?: string | number }).deposit || "0"
        ),
      });
    } catch (err) {
      console.error("Failed to fetch identity:", err);
      setMyIdentity(null);
    }
  }, [substrateSDK, selectedSubstrateAccount]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRegistrars(), fetchMyIdentity()]);
      setLoading(false);
    };

    if (chainConnected) {
      loadData();
    }
  }, [chainConnected, fetchRegistrars, fetchMyIdentity]);

  // Request judgement
  const handleRequestJudgement = async (
    registrarIndex: number,
    fee: string
  ) => {
    if (!substrateSDK || !selectedSubstrateAccount) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const api = await substrateSDK.getApi();

      // Create requestJudgement extrinsic
      const tx = api.tx.identity?.requestJudgement?.(registrarIndex, fee);

      if (!tx) {
        throw new Error("Identity pallet not available");
      }

      const hash = await signAndSubmitExtrinsic(tx);

      setSuccessMessage(
        `Judgement request submitted! Transaction: ${hash.slice(0, 16)}...`
      );

      // Refresh identity data
      await fetchMyIdentity();
    } catch (err) {
      console.error("Failed to request judgement:", err);
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel judgement request
  const handleCancelRequest = async (registrarIndex: number) => {
    if (!substrateSDK || !selectedSubstrateAccount) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const api = await substrateSDK.getApi();

      // Create cancelRequest extrinsic
      const tx = api.tx.identity?.cancelRequest?.(registrarIndex);

      if (!tx) {
        throw new Error("Identity pallet not available");
      }

      const hash = await signAndSubmitExtrinsic(tx);

      setSuccessMessage(
        `Cancelled request! Transaction: ${hash.slice(0, 16)}...`
      );

      // Refresh identity data
      await fetchMyIdentity();
    } catch (err) {
      console.error("Failed to cancel request:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel request");
    } finally {
      setSubmitting(false);
    }
  };

  // Clear identity
  const handleClearIdentity = async () => {
    if (!substrateSDK || !selectedSubstrateAccount) return;

    if (
      !window.confirm(
        "Are you sure you want to clear your identity? Your deposit will be returned."
      )
    ) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const api = await substrateSDK.getApi();

      const tx = api.tx.identity?.clearIdentity?.();

      if (!tx) {
        throw new Error("Identity pallet not available");
      }

      const hash = await signAndSubmitExtrinsic(tx);

      setSuccessMessage(
        `Identity cleared! Deposit returned. Transaction: ${hash.slice(0, 16)}...`
      );

      setMyIdentity(null);
    } catch (err) {
      console.error("Failed to clear identity:", err);
      setError(
        err instanceof Error ? err.message : "Failed to clear identity"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest =
    myIdentity?.judgements.some((j) => j.status === "pending") || false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Identity Registrars
          </h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Request identity verification from registrars
          </p>
        </div>

        {!isConnected && (
          <div className="text-sm text-orange-400">
            Connect wallet to request judgement
          </div>
        )}
      </div>

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

      {/* My Identity Card */}
      {isConnected && myIdentity && (
        <MyIdentityCard identity={myIdentity} onClear={handleClearIdentity} />
      )}

      {isConnected && !myIdentity && !loading && (
        <div className="card p-6 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-foreground-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
            />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Identity Set
          </h3>
          <p className="text-sm text-foreground-secondary mb-4">
            Set your on-chain identity first before requesting judgement.
          </p>
          <a href="/identity" className="btn-primary inline-block">
            Set Identity
          </a>
        </div>
      )}

      {/* Tabs */}
      {isConnected && myIdentity && (
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("registrars")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "registrars"
                ? "border-selendra-500 text-selendra-400"
                : "border-transparent text-foreground-secondary hover:text-foreground"
            }`}
          >
            Registrars
          </button>
          <button
            onClick={() => setActiveTab("my-requests")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "my-requests"
                ? "border-selendra-500 text-selendra-400"
                : "border-transparent text-foreground-secondary hover:text-foreground"
            }`}
          >
            My Requests
            {myIdentity.judgements.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-selendra-500/20 text-selendra-400">
                {myIdentity.judgements.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-selendra-500"></div>
        </div>
      )}

      {/* Registrars Tab */}
      {!loading &&
        (activeTab === "registrars" || !isConnected || !myIdentity) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Available Registrars
            </h3>

            {registrars.length === 0 ? (
              <div className="card p-6 text-center">
                <p className="text-foreground-secondary">
                  No registrars available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrars.map((registrar) => (
                  <RegistrarCard
                    key={registrar.index}
                    registrar={registrar}
                    onRequestJudgement={handleRequestJudgement}
                    hasIdentity={!!myIdentity}
                    hasPendingRequest={hasPendingRequest}
                    isConnected={isConnected}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* My Requests Tab */}
      {!loading &&
        activeTab === "my-requests" &&
        isConnected &&
        myIdentity && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              My Judgement Requests
            </h3>

            {myIdentity.judgements.length === 0 ? (
              <div className="card p-6 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-foreground-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h4 className="text-lg font-medium text-foreground mb-2">
                  No Requests
                </h4>
                <p className="text-sm text-foreground-secondary">
                  You haven&apos;t requested any judgements yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myIdentity.judgements.map((request, idx) => (
                  <JudgementRequestCard
                    key={idx}
                    request={request}
                    registrar={registrars.find(
                      (r) => r.index === request.registrarIndex
                    )}
                    onCancel={handleCancelRequest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Submitting Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-selendra-500"></div>
            <span className="text-foreground">Processing transaction...</span>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          About Identity Verification
        </h4>
        <ul className="space-y-1 text-sm text-foreground-secondary">
          <li>• Registrars verify your identity information is accurate</li>
          <li>• Each registrar charges a fee for their verification service</li>
          <li>• Verification levels include: Reasonable, KnownGood</li>
          <li>
            • A verified identity adds trust and credibility to your account
          </li>
          <li>• You can request verification from multiple registrars</li>
        </ul>
      </div>
    </div>
  );
}
