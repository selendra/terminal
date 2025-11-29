"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

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
  minApproval: ApprovalCurve;
  minSupport: SupportCurve;
}

interface ApprovalCurve {
  type: "Linear" | "Reciprocal";
  params: {
    length?: number;
    floor?: number;
    ceil?: number;
    factor?: number;
  };
}

interface SupportCurve {
  type: "Linear" | "Reciprocal";
  params: {
    length?: number;
    floor?: number;
    ceil?: number;
    factor?: number;
  };
}

interface ReferendumCount {
  trackId: number;
  deciding: number;
  preparing: number;
  confirming: number;
}

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

function blocksToTime(blocks: number, blockTime: number = 6): string {
  const totalSeconds = blocks * blockTime;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

function formatCurve(curve: ApprovalCurve | SupportCurve): string {
  if (curve.type === "Linear") {
    const floor = curve.params.floor ? `${(curve.params.floor * 100).toFixed(1)}%` : "0%";
    const ceil = curve.params.ceil ? `${(curve.params.ceil * 100).toFixed(1)}%` : "100%";
    return `Linear: ${ceil} → ${floor}`;
  } else {
    const factor = curve.params.factor || 1;
    return `Reciprocal (factor: ${factor})`;
  }
}

// TrackCard Component
function TrackCard({
  track,
  referendumCount,
  expanded,
  onToggle,
}: {
  track: Track;
  referendumCount?: ReferendumCount;
  expanded: boolean;
  onToggle: () => void;
}) {
  const getTrackColor = (id: number): string => {
    if (id === 0) return "bg-red-500"; // Root
    if (id === 1) return "bg-orange-500"; // Whitelisted
    if (id >= 10 && id < 20) return "bg-green-500"; // Treasury/Spender
    if (id >= 20 && id < 30) return "bg-blue-500"; // Admin
    if (id >= 30) return "bg-purple-500"; // Referendum management
    return "bg-gray-500";
  };

  const getTotalReferenda = (): number => {
    if (!referendumCount) return 0;
    return referendumCount.deciding + referendumCount.preparing + referendumCount.confirming;
  };

  return (
    <div className="card overflow-hidden hover:border-selendra-500/30 transition-colors">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-2 h-12 rounded-full ${getTrackColor(track.id)}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{track.name}</span>
              <span className="text-xs font-mono bg-background-secondary px-2 py-0.5 rounded text-foreground-secondary">
                #{track.id}
              </span>
            </div>
            <p className="text-sm text-foreground-secondary mt-1">
              {track.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {referendumCount && getTotalReferenda() > 0 && (
            <div className="text-center">
              <div className="text-lg font-bold text-selendra-400">
                {getTotalReferenda()}
              </div>
              <div className="text-xs text-foreground-secondary">Active</div>
            </div>
          )}
          <svg
            className={`w-5 h-5 text-foreground-secondary transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Decision Deposit</span>
              <div className="font-medium text-foreground">
                {formatBalance(track.decisionDeposit)} SEL
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Max Deciding</span>
              <div className="font-medium text-foreground">
                {track.maxDeciding} referenda
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Total Duration</span>
              <div className="font-medium text-foreground">
                {blocksToTime(
                  track.preparePeriod + track.decisionPeriod + track.confirmPeriod
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Min Enactment</span>
              <div className="font-medium text-foreground">
                {blocksToTime(track.minEnactmentPeriod)}
              </div>
            </div>
          </div>

          {/* Period Timeline */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Referendum Lifecycle</h4>
            <div className="flex gap-1">
              <div
                className="h-8 bg-yellow-500/20 rounded-l-lg flex items-center justify-center text-xs font-medium"
                style={{
                  width: `${(track.preparePeriod / (track.preparePeriod + track.decisionPeriod + track.confirmPeriod)) * 100}%`,
                  minWidth: "60px",
                }}
              >
                <span className="text-yellow-400 truncate px-2">
                  Prepare ({blocksToTime(track.preparePeriod)})
                </span>
              </div>
              <div
                className="h-8 bg-blue-500/20 flex items-center justify-center text-xs font-medium"
                style={{
                  width: `${(track.decisionPeriod / (track.preparePeriod + track.decisionPeriod + track.confirmPeriod)) * 100}%`,
                  minWidth: "80px",
                }}
              >
                <span className="text-blue-400 truncate px-2">
                  Decision ({blocksToTime(track.decisionPeriod)})
                </span>
              </div>
              <div
                className="h-8 bg-green-500/20 rounded-r-lg flex items-center justify-center text-xs font-medium"
                style={{
                  width: `${(track.confirmPeriod / (track.preparePeriod + track.decisionPeriod + track.confirmPeriod)) * 100}%`,
                  minWidth: "60px",
                }}
              >
                <span className="text-green-400 truncate px-2">
                  Confirm ({blocksToTime(track.confirmPeriod)})
                </span>
              </div>
            </div>
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Min Approval</span>
              <div className="text-sm text-foreground mt-1">
                {formatCurve(track.minApproval)}
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                Approval = Aye votes / Total votes
              </p>
            </div>
            <div className="p-3 rounded-lg bg-background-secondary">
              <span className="text-xs text-foreground-secondary">Min Support</span>
              <div className="text-sm text-foreground mt-1">
                {formatCurve(track.minSupport)}
              </div>
              <p className="text-xs text-foreground-secondary mt-1">
                Support = Total votes / Total issuance
              </p>
            </div>
          </div>

          {/* Active Referenda Breakdown */}
          {referendumCount && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {referendumCount.preparing}
                </div>
                <div className="text-xs text-foreground-secondary">Preparing</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-lg font-bold text-blue-400">
                  {referendumCount.deciding}
                </div>
                <div className="text-xs text-foreground-secondary">Deciding</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="text-lg font-bold text-green-400">
                  {referendumCount.confirming}
                </div>
                <div className="text-xs text-foreground-secondary">Confirming</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main TrackInfo Component
export function TrackInfo() {
  const { substrateSDK, isConnected } = useBlockchain();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [referendumCounts, setReferendumCounts] = useState<Map<number, ReferendumCount>>(new Map());
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "name" | "deposit">("id");

  // Fetch tracks and referenda
  const fetchData = useCallback(async () => {
    if (!substrateSDK) return;

    try {
      const api = await substrateSDK.getApi();

      // Fetch tracks
      const tracksInfo = await api.consts.referenda?.tracks?.();
      const trackList: Track[] = [];

      if (tracksInfo) {
        const rawTracks = (tracksInfo as { toJSON: () => unknown }).toJSON() as Array<[number, Record<string, unknown>]>;

        if (Array.isArray(rawTracks)) {
          rawTracks.forEach(([id, info]) => {
            trackList.push({
              id: Number(id),
              name: String(info.name || `Track ${id}`).replace(/_/g, " "),
              description: getTrackDescription(Number(id)),
              maxDeciding: Number(info.maxDeciding || 10),
              decisionDeposit: String(info.decisionDeposit || "0"),
              preparePeriod: Number(info.preparePeriod || 0),
              decisionPeriod: Number(info.decisionPeriod || 0),
              confirmPeriod: Number(info.confirmPeriod || 0),
              minEnactmentPeriod: Number(info.minEnactmentPeriod || 0),
              minApproval: parseCurve(info.minApproval),
              minSupport: parseCurve(info.minSupport),
            });
          });
        }
      }

      // If no tracks from chain, use mock data
      if (trackList.length === 0) {
        trackList.push(
          ...getDefaultTracks()
        );
      }

      setTracks(trackList);

      // Fetch referendum counts per track
      const counts = new Map<number, ReferendumCount>();
      try {
        const referendaInfo = await api.query.referenda?.referendumInfoFor?.entries();
        
        if (Array.isArray(referendaInfo)) {
          referendaInfo.forEach(([, value]) => {
            const info = (value as { toJSON: () => unknown }).toJSON();
            if (typeof info === "object" && info) {
              const ongoing = (info as { ongoing?: Record<string, unknown> }).ongoing;
              if (ongoing) {
                const trackId = Number(ongoing.track);
                const current = counts.get(trackId) || {
                  trackId,
                  deciding: 0,
                  preparing: 0,
                  confirming: 0,
                };

                if (ongoing.deciding) {
                  const deciding = ongoing.deciding as { confirming?: unknown };
                  if (deciding.confirming) {
                    current.confirming++;
                  } else {
                    current.deciding++;
                  }
                } else {
                  current.preparing++;
                }

                counts.set(trackId, current);
              }
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch referendum counts:", e);
      }

      setReferendumCounts(counts);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setTracks(getDefaultTracks());
    } finally {
      setLoading(false);
    }
  }, [substrateSDK]);

  // Parse approval/support curve
  function parseCurve(curve: unknown): ApprovalCurve {
    if (!curve || typeof curve !== "object") {
      return { type: "Linear", params: { floor: 0.5, ceil: 1 } };
    }

    const c = curve as { linearDecreasing?: Record<string, unknown>; reciprocal?: Record<string, unknown> };

    if (c.linearDecreasing) {
      return {
        type: "Linear",
        params: {
          length: Number(c.linearDecreasing.length || 0),
          floor: Number(c.linearDecreasing.floor || 0) / 1e9,
          ceil: Number(c.linearDecreasing.ceil || 1e9) / 1e9,
        },
      };
    }

    if (c.reciprocal) {
      return {
        type: "Reciprocal",
        params: {
          factor: Number(c.reciprocal.factor || 1),
        },
      };
    }

    return { type: "Linear", params: { floor: 0.5, ceil: 1 } };
  }

  // Get track description
  function getTrackDescription(id: number): string {
    const descriptions: Record<number, string> = {
      0: "For system-level changes requiring highest authority (runtime upgrades)",
      1: "For pre-approved fast-track proposals via whitelist",
      10: "For treasury spend proposals",
      11: "For small tip proposals (minor rewards)",
      12: "For big tip proposals (significant rewards)",
      13: "For small treasury spends",
      14: "For medium treasury spends",
      15: "For big treasury spends",
      20: "For general administrative changes",
      21: "For referendum management operations",
      30: "For cancelling ongoing referenda",
      31: "For killing referenda with slashing",
    };
    return descriptions[id] || `Governance track ${id}`;
  }

  // Get default tracks
  function getDefaultTracks(): Track[] {
    return [
      {
        id: 0,
        name: "Root",
        description: "For system-level changes requiring highest authority",
        maxDeciding: 1,
        decisionDeposit: "100000000000000000000",
        preparePeriod: 7200,
        decisionPeriod: 201600,
        confirmPeriod: 14400,
        minEnactmentPeriod: 14400,
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 1 } },
        minSupport: { type: "Linear", params: { floor: 0, ceil: 0.5 } },
      },
      {
        id: 1,
        name: "Whitelisted Caller",
        description: "For pre-approved fast-track proposals",
        maxDeciding: 100,
        decisionDeposit: "10000000000000000000",
        preparePeriod: 3600,
        decisionPeriod: 100800,
        confirmPeriod: 600,
        minEnactmentPeriod: 600,
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 1 } },
        minSupport: { type: "Reciprocal", params: { factor: 2 } },
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
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 0.75 } },
        minSupport: { type: "Linear", params: { floor: 0, ceil: 0.1 } },
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
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 0.66 } },
        minSupport: { type: "Linear", params: { floor: 0, ceil: 0.05 } },
      },
      {
        id: 30,
        name: "Referendum Canceller",
        description: "For cancelling ongoing referenda",
        maxDeciding: 20,
        decisionDeposit: "10000000000000000000",
        preparePeriod: 7200,
        decisionPeriod: 50400,
        confirmPeriod: 3600,
        minEnactmentPeriod: 600,
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 0.75 } },
        minSupport: { type: "Linear", params: { floor: 0, ceil: 0.02 } },
      },
      {
        id: 31,
        name: "Referendum Killer",
        description: "For killing referenda with slashing",
        maxDeciding: 20,
        decisionDeposit: "50000000000000000000",
        preparePeriod: 7200,
        decisionPeriod: 50400,
        confirmPeriod: 3600,
        minEnactmentPeriod: 600,
        minApproval: { type: "Linear", params: { floor: 0.5, ceil: 0.9 } },
        minSupport: { type: "Linear", params: { floor: 0, ceil: 0.05 } },
      },
    ];
  }

  useEffect(() => {
    if (isConnected) {
      fetchData();
    }
  }, [isConnected, fetchData]);

  // Filter and sort tracks
  const filteredTracks = tracks
    .filter((track) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        track.name.toLowerCase().includes(query) ||
        track.description.toLowerCase().includes(query) ||
        track.id.toString().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "deposit":
          return BigInt(b.decisionDeposit) > BigInt(a.decisionDeposit) ? 1 : -1;
        default:
          return a.id - b.id;
      }
    });

  // Calculate totals
  const totalActive = Array.from(referendumCounts.values()).reduce(
    (sum, count) => sum + count.deciding + count.preparing + count.confirming,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Governance Tracks</h2>
          <p className="text-sm text-foreground-secondary mt-1">
            OpenGov tracks with their parameters and thresholds
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-selendra-400">{tracks.length}</div>
            <div className="text-xs text-foreground-secondary">Tracks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalActive}</div>
            <div className="text-xs text-foreground-secondary">Active Referenda</div>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-selendra-500"
        >
          <option value="id">Sort by ID</option>
          <option value="name">Sort by Name</option>
          <option value="deposit">Sort by Deposit</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-selendra-500"></div>
        </div>
      )}

      {/* Tracks List */}
      {!loading && (
        <div className="space-y-3">
          {filteredTracks.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-foreground-secondary">
                {searchQuery ? "No tracks match your search" : "No tracks available"}
              </p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                referendumCount={referendumCounts.get(track.id)}
                expanded={expandedTrack === track.id}
                onToggle={() =>
                  setExpandedTrack(expandedTrack === track.id ? null : track.id)
                }
              />
            ))
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          About OpenGov Tracks
        </h4>
        <ul className="space-y-1 text-sm text-foreground-secondary">
          <li>• Each track is designed for a specific type of governance action</li>
          <li>• Higher-impact tracks require larger deposits and longer periods</li>
          <li>• Approval and support thresholds change over time (curves)</li>
          <li>• Multiple referenda can run simultaneously on each track</li>
          <li>• Track parameters are set at the protocol level</li>
        </ul>
      </div>
    </div>
  );
}
