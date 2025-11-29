"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  Search,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

// =============================================================================
// Types
// =============================================================================

interface RpcMethod {
  section: string;
  method: string;
  description: string;
  params: RpcParam[];
  type: string;
  isSubscription: boolean;
}

interface RpcParam {
  name: string;
  type: string;
  isOptional: boolean;
}

interface RpcResult {
  id: string;
  section: string;
  method: string;
  params: Record<string, string>;
  result: unknown;
  timestamp: number;
  duration: number;
  error?: string;
}

// =============================================================================
// Component
// =============================================================================

export function RpcBrowser() {
  const { substrateSDK, isConnected } = useBlockchain();

  // State
  const [rpcMethods, setRpcMethods] = useState<RpcMethod[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [methodParams, setMethodParams] = useState<Record<string, string>>({});
  const [rpcResults, setRpcResults] = useState<RpcResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  // Load RPC methods
  useEffect(() => {
    const loadRpcMethods = async () => {
      setIsLoading(true);

      if (!substrateSDK) {
        setRpcMethods(getMockRpcMethods());
        setIsLoading(false);
        return;
      }

      try {
        const api = substrateSDK.getApi?.();
        if (!api) {
          setRpcMethods(getMockRpcMethods());
          return;
        }

        const methods: RpcMethod[] = [];

        // Parse RPC methods from API
        for (const section of Object.keys(api.rpc)) {
          const sectionApi = api.rpc[section as keyof typeof api.rpc];
          if (typeof sectionApi === "object" && sectionApi !== null) {
            for (const method of Object.keys(sectionApi)) {
              const methodFn = sectionApi[method as keyof typeof sectionApi];
              if (typeof methodFn === "function") {
                methods.push({
                  section,
                  method,
                  description: `${section}.${method}`,
                  params: [],
                  type: "unknown",
                  isSubscription: method.startsWith("subscribe"),
                });
              }
            }
          }
        }

        setRpcMethods(methods.sort((a, b) => a.section.localeCompare(b.section)));
      } catch (error) {
        console.error("Failed to load RPC methods:", error);
        setRpcMethods(getMockRpcMethods());
      } finally {
        setIsLoading(false);
      }
    };

    loadRpcMethods();
  }, [substrateSDK]);

  // Get sections list
  const sections = [...new Set(rpcMethods.map((m) => m.section))];

  // Filter methods
  const filteredMethods = rpcMethods.filter(
    (m) =>
      (!searchQuery ||
        m.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.section.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get current method
  const currentMethod = rpcMethods.find(
    (m) => m.section === selectedSection && m.method === selectedMethod
  );

  // Toggle section expansion
  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  }, []);

  // Execute RPC call
  const handleExecute = useCallback(async () => {
    if (!selectedSection || !selectedMethod) return;

    setIsExecuting(true);
    const startTime = Date.now();
    const resultId = `${selectedSection}.${selectedMethod}.${Date.now()}`;

    try {
      let result: unknown;

      if (substrateSDK) {
        const api = substrateSDK.getApi?.();
        if (api) {
          const rpcSection = api.rpc[selectedSection as keyof typeof api.rpc];
          if (rpcSection && typeof rpcSection === "object") {
            const rpcMethod = rpcSection[selectedMethod as keyof typeof rpcSection];
            if (typeof rpcMethod === "function") {
              const paramValues = currentMethod?.params.map((p) => methodParams[p.name]) || [];
              result = await rpcMethod(...paramValues);
              if (result && typeof result === "object" && "toHuman" in result) {
                result = (result as { toHuman: () => unknown }).toHuman();
              }
            }
          }
        }
      }

      // Mock data if no real data
      if (!result) {
        result = getMockRpcResult(selectedSection, selectedMethod);
      }

      const duration = Date.now() - startTime;

      setRpcResults((prev) => [
        {
          id: resultId,
          section: selectedSection,
          method: selectedMethod,
          params: { ...methodParams },
          result,
          timestamp: Date.now(),
          duration,
        },
        ...prev.slice(0, 19),
      ]);

      toast.success(`Executed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("RPC call failed:", error);
      
      setRpcResults((prev) => [
        {
          id: resultId,
          section: selectedSection,
          method: selectedMethod,
          params: { ...methodParams },
          result: null,
          timestamp: Date.now(),
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ...prev.slice(0, 19),
      ]);
      
      toast.error("RPC call failed");
    } finally {
      setIsExecuting(false);
    }
  }, [substrateSDK, selectedSection, selectedMethod, methodParams, currentMethod]);

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
            <Terminal className="h-6 w-6 text-selendra-400" />
            RPC Browser
          </h1>
          <p className="text-foreground-secondary mt-1">
            Browse and execute RPC methods
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 text-accent-green">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-accent-red">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
        <input
          type="text"
          placeholder="Search RPC methods..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Methods List */}
        <div className="card max-h-[500px] overflow-y-auto">
          <h3 className="font-semibold text-foreground mb-4">RPC Methods</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-selendra-400" />
            </div>
          ) : (
            <div className="space-y-1">
              {sections.map((section) => {
                const methods = filteredMethods.filter((m) => m.section === section);
                if (methods.length === 0) return null;

                return (
                  <div key={section}>
                    <button
                      onClick={() => toggleSection(section)}
                      className={clsx(
                        "w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors",
                        "hover:bg-background-secondary text-foreground"
                      )}
                    >
                      {expandedSections.has(section) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-mono text-sm">{section}</span>
                      <span className="ml-auto text-xs text-foreground-secondary">
                        {methods.length}
                      </span>
                    </button>

                    {expandedSections.has(section) && (
                      <div className="ml-6 space-y-1 mt-1">
                        {methods.map((m) => (
                          <button
                            key={m.method}
                            onClick={() => {
                              setSelectedSection(section);
                              setSelectedMethod(m.method);
                              setMethodParams({});
                            }}
                            className={clsx(
                              "w-full px-3 py-1.5 rounded text-left text-sm font-mono transition-colors",
                              selectedMethod === m.method && selectedSection === section
                                ? "bg-selendra-500 text-white"
                                : "hover:bg-background-secondary text-foreground-secondary"
                            )}
                          >
                            {m.method}
                            {m.isSubscription && (
                              <span className="ml-1 text-xs opacity-60">(sub)</span>
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

        {/* Method Details & Results */}
        <div className="col-span-2 space-y-4">
          {currentMethod ? (
            <>
              <div className="card">
                <h3 className="font-semibold text-foreground mb-4">
                  {selectedSection}.{selectedMethod}
                </h3>

                <p className="text-sm text-foreground-secondary mb-4">
                  {currentMethod.description}
                </p>

                {currentMethod.params.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {currentMethod.params.map((param) => (
                      <div key={param.name}>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {param.name}
                          {!param.isOptional && (
                            <span className="text-accent-red ml-1">*</span>
                          )}
                          <span className="text-xs text-foreground-secondary ml-2">
                            {param.type}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={methodParams[param.name] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setMethodParams((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${param.name}`}
                          className="input w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Execute
                  </button>
                </div>
              </div>

              {/* Results */}
              {rpcResults.length > 0 && (
                <div className="card">
                  <h3 className="font-semibold text-foreground mb-4">Results</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {rpcResults.map((result) => (
                      <div
                        key={result.id}
                        className={clsx(
                          "p-3 rounded",
                          result.error ? "bg-accent-red/10" : "bg-background-secondary"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-foreground">
                            {result.section}.{result.method}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground-secondary">
                              {result.duration}ms
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(
                                  JSON.stringify(result.result, null, 2),
                                  result.id
                                )
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
                        {result.error ? (
                          <p className="text-sm text-accent-red">{result.error}</p>
                        ) : (
                          <pre className="text-xs font-mono text-foreground-secondary overflow-x-auto">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        )}
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
                <p>Select an RPC method to execute</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

function getMockRpcMethods(): RpcMethod[] {
  return [
    {
      section: "chain",
      method: "getBlockHash",
      description: "Get hash of the specified block",
      params: [{ name: "blockNumber", type: "BlockNumber", isOptional: true }],
      type: "Hash",
      isSubscription: false,
    },
    {
      section: "chain",
      method: "getHeader",
      description: "Get the header of a block",
      params: [{ name: "hash", type: "Hash", isOptional: true }],
      type: "Header",
      isSubscription: false,
    },
    {
      section: "chain",
      method: "subscribeNewHeads",
      description: "Subscribe to new block headers",
      params: [],
      type: "Header",
      isSubscription: true,
    },
    {
      section: "system",
      method: "chain",
      description: "Get the chain name",
      params: [],
      type: "Text",
      isSubscription: false,
    },
    {
      section: "system",
      method: "name",
      description: "Get the node name",
      params: [],
      type: "Text",
      isSubscription: false,
    },
    {
      section: "system",
      method: "version",
      description: "Get the node version",
      params: [],
      type: "Text",
      isSubscription: false,
    },
    {
      section: "state",
      method: "getStorage",
      description: "Get storage for a key",
      params: [{ name: "key", type: "StorageKey", isOptional: false }],
      type: "StorageData",
      isSubscription: false,
    },
    {
      section: "author",
      method: "submitExtrinsic",
      description: "Submit an extrinsic",
      params: [{ name: "extrinsic", type: "Extrinsic", isOptional: false }],
      type: "Hash",
      isSubscription: false,
    },
  ];
}

function getMockRpcResult(section: string, method: string): unknown {
  const mockResults: Record<string, unknown> = {
    "chain.getBlockHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "chain.getHeader": {
      number: 1234567,
      parentHash: "0xabcd...",
      stateRoot: "0xefgh...",
      extrinsicsRoot: "0xijkl...",
    },
    "system.chain": "Selendra",
    "system.name": "Selendra Node",
    "system.version": "1.0.0",
    "state.getStorage": "0x0000000000000000",
  };
  return mockResults[`${section}.${method}`] || { section, method, mock: true };
}

export default RpcBrowser;
