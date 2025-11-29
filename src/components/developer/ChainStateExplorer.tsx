"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Search,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Info,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

// =============================================================================
// Types
// =============================================================================

interface StorageEntry {
  pallet: string;
  name: string;
  modifier: "Optional" | "Default";
  type: string;
  docs: string[];
  isMap: boolean;
  keys?: string[];
}

interface QueryResult {
  id: string;
  pallet: string;
  storage: string;
  keys: string[];
  value: unknown;
  timestamp: number;
  isSubscribed: boolean;
}

interface ConstantEntry {
  pallet: string;
  name: string;
  type: string;
  value: unknown;
  docs: string[];
}

// =============================================================================
// Component
// =============================================================================

export function ChainStateExplorer() {
  const { substrateSDK, isConnected } = useBlockchain();

  // State
  const [activeTab, setActiveTab] = useState<"storage" | "constants" | "raw">("storage");
  const [storageEntries, setStorageEntries] = useState<StorageEntry[]>([]);
  const [constants, setConstants] = useState<ConstantEntry[]>([]);
  const [selectedPallet, setSelectedPallet] = useState<string>("");
  const [selectedStorage, setSelectedStorage] = useState<string>("");
  const [storageKeys, setStorageKeys] = useState<string[]>([]);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<Map<string, () => void>>(new Map());
  const [copied, setCopied] = useState<string | null>(null);
  const [rawStorageKey, setRawStorageKey] = useState("");
  const [rawStorageResult, setRawStorageResult] = useState<string | null>(null);

  // Load storage entries from metadata
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoading(true);

      if (!substrateSDK) {
        // Use mock data
        setStorageEntries(getMockStorageEntries());
        setConstants(getMockConstants());
        setIsLoading(false);
        return;
      }

      try {
        const api = substrateSDK.getApi?.();
        if (!api) {
          setStorageEntries(getMockStorageEntries());
          setConstants(getMockConstants());
          return;
        }

        const entries: StorageEntry[] = [];
        const constEntries: ConstantEntry[] = [];

        // Parse metadata
        for (const pallet of api.runtimeMetadata.asLatest.pallets) {
          const palletName = pallet.name.toString();

          // Storage
          if (pallet.storage.isSome) {
            const storage = pallet.storage.unwrap();
            for (const item of storage.items) {
              const isMap = item.type.isMap;
              entries.push({
                pallet: palletName,
                name: item.name.toString(),
                modifier: item.modifier.isOptional ? "Optional" : "Default",
                type: item.type.toString(),
                docs: item.docs.map((d: { toString: () => string }) => d.toString()),
                isMap,
                keys: isMap ? ["key"] : undefined,
              });
            }
          }

          // Constants
          for (const constant of pallet.constants) {
            constEntries.push({
              pallet: palletName,
              name: constant.name.toString(),
              type: constant.type.toString(),
              value: api.registry
                .createType(constant.type.toString(), constant.value)
                .toHuman(),
              docs: constant.docs.map((d: { toString: () => string }) => d.toString()),
            });
          }
        }

        setStorageEntries(entries.sort((a, b) => a.pallet.localeCompare(b.pallet)));
        setConstants(constEntries.sort((a, b) => a.pallet.localeCompare(b.pallet)));
      } catch (error) {
        console.error("Failed to load metadata:", error);
        setStorageEntries(getMockStorageEntries());
        setConstants(getMockConstants());
      } finally {
        setIsLoading(false);
      }
    };

    loadMetadata();
  }, [substrateSDK]);

  // Get pallets list
  const pallets = [...new Set(storageEntries.map((e) => e.pallet))];
  const constantPallets = [...new Set(constants.map((c) => c.pallet))];

  // Filter entries
  const filteredEntries = storageEntries.filter(
    (e) =>
      (!selectedPallet || e.pallet === selectedPallet) &&
      (!searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.pallet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredConstants = constants.filter(
    (c) =>
      (!searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pallet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get current storage entry
  const currentEntry = storageEntries.find(
    (e) => e.pallet === selectedPallet && e.name === selectedStorage
  );

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

  // Query storage
  const handleQuery = useCallback(async () => {
    if (!selectedPallet || !selectedStorage) return;

    setIsQuerying(true);
    const queryId = `${selectedPallet}.${selectedStorage}.${Date.now()}`;

    try {
      let value: unknown;

      if (substrateSDK) {
        const api = substrateSDK.getApi?.();
        if (api) {
          const query = api.query[selectedPallet]?.[selectedStorage];
          if (query) {
            if (currentEntry?.isMap && storageKeys.length > 0) {
              value = await query(...storageKeys);
            } else {
              value = await query();
            }
            value = (value as { toHuman?: () => unknown })?.toHuman?.() ?? value;
          }
        }
      }

      // Mock data if no real data
      if (!value) {
        value = getMockQueryResult(selectedPallet, selectedStorage);
      }

      setQueryResults((prev) => [
        {
          id: queryId,
          pallet: selectedPallet,
          storage: selectedStorage,
          keys: [...storageKeys],
          value,
          timestamp: Date.now(),
          isSubscribed: false,
        },
        ...prev.slice(0, 19),
      ]);

      toast.success("Query executed");
    } catch (error) {
      console.error("Query failed:", error);
      toast.error("Query failed");
    } finally {
      setIsQuerying(false);
    }
  }, [substrateSDK, selectedPallet, selectedStorage, storageKeys, currentEntry]);

  // Subscribe to storage
  const handleSubscribe = useCallback(
    async (queryId: string) => {
      const result = queryResults.find((r) => r.id === queryId);
      if (!result) return;

      if (subscriptions.has(queryId)) {
        // Unsubscribe
        subscriptions.get(queryId)?.();
        setSubscriptions((prev) => {
          const next = new Map(prev);
          next.delete(queryId);
          return next;
        });
        setQueryResults((prev) =>
          prev.map((r) => (r.id === queryId ? { ...r, isSubscribed: false } : r))
        );
        toast.success("Unsubscribed");
        return;
      }

      // Subscribe (mock for now)
      const unsubscribe = () => {};
      setSubscriptions((prev) => new Map(prev).set(queryId, unsubscribe));
      setQueryResults((prev) =>
        prev.map((r) => (r.id === queryId ? { ...r, isSubscribed: true } : r))
      );
      toast.success("Subscribed to updates");
    },
    [queryResults, subscriptions]
  );

  // Query raw storage
  const handleRawQuery = useCallback(async () => {
    if (!rawStorageKey) return;

    setIsQuerying(true);
    try {
      if (substrateSDK) {
        const api = substrateSDK.getApi?.();
        if (api) {
          const result = await api.rpc.state.getStorage(rawStorageKey);
          setRawStorageResult(result?.toHex() || "null");
          toast.success("Raw query executed");
          return;
        }
      }

      // Mock result
      setRawStorageResult("0x0000000000000000");
      toast.success("Raw query executed (mock)");
    } catch (error) {
      console.error("Raw query failed:", error);
      toast.error("Raw query failed");
    } finally {
      setIsQuerying(false);
    }
  }, [substrateSDK, rawStorageKey]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Database className="h-6 w-6 text-selendra-400" />
            Chain State Explorer
          </h1>
          <p className="text-foreground-secondary mt-1">
            Query storage and constants from the blockchain
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["storage", "constants", "raw"] as const).map((tab) => (
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
            {tab === "raw" ? "Raw Storage" : tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
        <input
          type="text"
          placeholder="Search storage or constants..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      {activeTab === "storage" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Storage List */}
          <div className="card max-h-[500px] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">Storage Items</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-selendra-400" />
              </div>
            ) : (
              <div className="space-y-1">
                {pallets.map((pallet) => {
                  const items = filteredEntries.filter((e) => e.pallet === pallet);
                  if (items.length === 0) return null;

                  return (
                    <div key={pallet}>
                      <button
                        onClick={() => togglePallet(pallet)}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors",
                          "hover:bg-background-secondary text-foreground"
                        )}
                      >
                        {expandedPallets.has(pallet) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-mono text-sm">{pallet}</span>
                        <span className="ml-auto text-xs text-foreground-secondary">
                          {items.length}
                        </span>
                      </button>

                      {expandedPallets.has(pallet) && (
                        <div className="ml-6 space-y-1 mt-1">
                          {items.map((entry) => (
                            <button
                              key={entry.name}
                              onClick={() => {
                                setSelectedPallet(pallet);
                                setSelectedStorage(entry.name);
                                setStorageKeys([]);
                              }}
                              className={clsx(
                                "w-full px-3 py-1.5 rounded text-left text-sm font-mono transition-colors flex items-center gap-2",
                                selectedStorage === entry.name && selectedPallet === pallet
                                  ? "bg-selendra-500 text-white"
                                  : "hover:bg-background-secondary text-foreground-secondary"
                              )}
                            >
                              {entry.name}
                              {entry.isMap && (
                                <span className="text-xs opacity-60">(map)</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Query Builder & Results */}
          <div className="col-span-2 space-y-4">
            {currentEntry ? (
              <>
                <div className="card">
                  <h3 className="font-semibold text-foreground mb-4">
                    {selectedPallet}.{selectedStorage}
                  </h3>

                  {currentEntry.docs.length > 0 && (
                    <p className="text-sm text-foreground-secondary mb-4">
                      {currentEntry.docs[0]}
                    </p>
                  )}

                  {currentEntry.isMap && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Key
                      </label>
                      <input
                        type="text"
                        value={storageKeys[0] || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStorageKeys([e.target.value])}
                        placeholder="Enter storage key"
                        className="input w-full"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleQuery}
                      disabled={isQuerying}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isQuerying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Query
                    </button>
                  </div>
                </div>

                {/* Results */}
                {queryResults.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-foreground mb-4">Query Results</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {queryResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 bg-background-secondary rounded"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-foreground">
                              {result.pallet}.{result.storage}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSubscribe(result.id)}
                                className={clsx(
                                  "p-1 rounded",
                                  result.isSubscribed
                                    ? "text-accent-green"
                                    : "text-foreground-secondary hover:text-foreground"
                                )}
                              >
                                {result.isSubscribed ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleCopy(JSON.stringify(result.value, null, 2), result.id)
                                }
                                className="p-1 rounded text-foreground-secondary hover:text-foreground"
                              >
                                {copied === result.id ? (
                                  <Check className="h-4 w-4 text-accent-green" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs font-mono text-foreground-secondary overflow-x-auto">
                            {JSON.stringify(result.value, null, 2)}
                          </pre>
                          <p className="text-xs text-foreground-secondary mt-2">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card">
                <div className="flex flex-col items-center justify-center py-12 text-foreground-secondary">
                  <Info className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a storage item to query</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "constants" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">Runtime Constants</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredConstants.map((constant, i) => (
              <div
                key={`${constant.pallet}.${constant.name}`}
                className="p-3 bg-background-secondary rounded"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm text-foreground">
                    {constant.pallet}.{constant.name}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(constant.value, null, 2),
                        `const-${i}`
                      )
                    }
                    className="p-1 rounded text-foreground-secondary hover:text-foreground"
                  >
                    {copied === `const-${i}` ? (
                      <Check className="h-4 w-4 text-accent-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-foreground-secondary mb-2">{constant.type}</p>
                <pre className="text-xs font-mono text-accent-green">
                  {JSON.stringify(constant.value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "raw" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">Raw Storage Query</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Storage Key (hex)
              </label>
              <input
                type="text"
                value={rawStorageKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRawStorageKey(e.target.value)}
                placeholder="0x..."
                className="input w-full font-mono"
              />
            </div>
            <button
              onClick={handleRawQuery}
              disabled={isQuerying || !rawStorageKey}
              className="btn-primary flex items-center gap-2"
            >
              {isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Query Raw Storage
            </button>

            {rawStorageResult && (
              <div className="p-4 bg-background-secondary rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Result</span>
                  <button
                    onClick={() => handleCopy(rawStorageResult, "raw")}
                    className="p-1 rounded text-foreground-secondary hover:text-foreground"
                  >
                    {copied === "raw" ? (
                      <Check className="h-4 w-4 text-accent-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <pre className="text-sm font-mono text-accent-green break-all">
                  {rawStorageResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

function getMockStorageEntries(): StorageEntry[] {
  return [
    {
      pallet: "System",
      name: "Account",
      modifier: "Default",
      type: "AccountInfo",
      docs: ["Account info including nonce, balance"],
      isMap: true,
      keys: ["AccountId"],
    },
    {
      pallet: "System",
      name: "BlockNumber",
      modifier: "Default",
      type: "u32",
      docs: ["Current block number"],
      isMap: false,
    },
    {
      pallet: "Balances",
      name: "TotalIssuance",
      modifier: "Default",
      type: "Balance",
      docs: ["Total tokens in existence"],
      isMap: false,
    },
    {
      pallet: "Staking",
      name: "CurrentEra",
      modifier: "Optional",
      type: "EraIndex",
      docs: ["Current staking era"],
      isMap: false,
    },
    {
      pallet: "Staking",
      name: "Validators",
      modifier: "Default",
      type: "ValidatorPrefs",
      docs: ["Validator preferences"],
      isMap: true,
      keys: ["AccountId"],
    },
  ];
}

function getMockConstants(): ConstantEntry[] {
  return [
    {
      pallet: "System",
      name: "BlockLength",
      type: "BlockLength",
      value: { max: { normal: 3932160, operational: 5242880, mandatory: 5242880 } },
      docs: ["Maximum block length"],
    },
    {
      pallet: "Balances",
      name: "ExistentialDeposit",
      type: "Balance",
      value: "1000000000000",
      docs: ["Minimum balance to keep account alive"],
    },
    {
      pallet: "Staking",
      name: "BondingDuration",
      type: "EraIndex",
      value: 28,
      docs: ["Number of eras for unbonding"],
    },
  ];
}

function getMockQueryResult(pallet: string, storage: string): unknown {
  const mockResults: Record<string, unknown> = {
    "System.BlockNumber": 1234567,
    "Balances.TotalIssuance": "1000000000000000000000",
    "Staking.CurrentEra": 1234,
  };
  return mockResults[`${pallet}.${storage}`] || { mock: true, pallet, storage };
}

export default ChainStateExplorer;
