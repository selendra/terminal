"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Shield,
  Clock,
  RefreshCw,
  Copy,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Types
// =============================================================================

type ProxyType =
  | "Any"
  | "NonTransfer"
  | "Governance"
  | "Staking"
  | "IdentityJudgement"
  | "CancelProxy"
  | "Auction";

interface ProxyInfo {
  delegate: string;
  proxyType: ProxyType;
  delay: number;
}

interface ProxyRelationship {
  principal: string; // The account being proxied for
  delegate: string; // The proxy account
  proxyType: ProxyType;
  delay: number;
}

interface ProxyManagerProps {
  onClose?: () => void;
}

const PROXY_TYPES: { value: ProxyType; label: string; description: string }[] = [
  { value: "Any", label: "Any", description: "Full access to all calls" },
  { value: "NonTransfer", label: "Non-Transfer", description: "Everything except balance transfers" },
  { value: "Governance", label: "Governance", description: "Governance-related calls only" },
  { value: "Staking", label: "Staking", description: "Staking-related calls only" },
  { value: "IdentityJudgement", label: "Identity", description: "Identity judgement calls" },
  { value: "CancelProxy", label: "Cancel Proxy", description: "Can only cancel other proxies" },
  { value: "Auction", label: "Auction", description: "Auction-related calls" },
];

// =============================================================================
// Component
// =============================================================================

export function ProxyManager({ onClose }: ProxyManagerProps) {
  const { substrateSDK, isConnected } = useBlockchain();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();

  // State
  const [activeTab, setActiveTab] = useState<"myProxies" | "proxyFor" | "add">("myProxies");
  const [myProxies, setMyProxies] = useState<ProxyInfo[]>([]);
  const [proxyFor, setProxyFor] = useState<ProxyRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Add proxy form state
  const [delegateAddress, setDelegateAddress] = useState("");
  const [proxyType, setProxyType] = useState<ProxyType>("Any");
  const [delay, setDelay] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load proxy data
  useEffect(() => {
    const loadProxyData = async () => {
      if (!selectedSubstrateAccount || !substrateSDK) return;

      setIsLoading(true);
      try {
        // In real implementation, query chain for proxy data
        // api.query.proxy.proxies(address)
        setMyProxies(getMockProxies());
        setProxyFor(getMockProxyFor());
      } catch (error) {
        console.error("Failed to load proxy data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProxyData();
  }, [selectedSubstrateAccount, substrateSDK]);

  // Add proxy
  const handleAddProxy = useCallback(async () => {
    if (!delegateAddress.trim()) {
      toast.error("Please enter a delegate address");
      return;
    }

    if (!selectedSubstrateAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      const api = (substrateSDK as { getApi?: () => unknown })?.getApi?.() as {
        tx: {
          proxy: {
            addProxy: (delegate: string, proxyType: string, delay: number) => unknown;
          };
        };
      };

      if (api) {
        const tx = api.tx.proxy.addProxy(delegateAddress, proxyType, delay);
        await signAndSubmitExtrinsic(tx);
      } else {
        // Mock for demo
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Add to local state
      setMyProxies((prev) => [
        ...prev,
        { delegate: delegateAddress, proxyType, delay },
      ]);

      setDelegateAddress("");
      setProxyType("Any");
      setDelay(0);
      setActiveTab("myProxies");

      toast.success("Proxy added successfully");
    } catch (error) {
      console.error("Failed to add proxy:", error);
      toast.error("Failed to add proxy");
    } finally {
      setIsSubmitting(false);
    }
  }, [delegateAddress, proxyType, delay, selectedSubstrateAccount, substrateSDK, signAndSubmitExtrinsic]);

  // Remove proxy
  const handleRemoveProxy = useCallback(async (proxy: ProxyInfo) => {
    if (!selectedSubstrateAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const api = (substrateSDK as { getApi?: () => unknown })?.getApi?.() as {
        tx: {
          proxy: {
            removeProxy: (delegate: string, proxyType: string, delay: number) => unknown;
          };
        };
      };

      if (api) {
        const tx = api.tx.proxy.removeProxy(proxy.delegate, proxy.proxyType, proxy.delay);
        await signAndSubmitExtrinsic(tx);
      } else {
        // Mock for demo
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Remove from local state
      setMyProxies((prev) =>
        prev.filter(
          (p) =>
            p.delegate !== proxy.delegate ||
            p.proxyType !== proxy.proxyType
        )
      );

      toast.success("Proxy removed");
    } catch (error) {
      console.error("Failed to remove proxy:", error);
      toast.error("Failed to remove proxy");
    }
  }, [selectedSubstrateAccount, substrateSDK, signAndSubmitExtrinsic]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }, []);

  // Get proxy type color
  const getProxyTypeColor = (type: ProxyType): string => {
    switch (type) {
      case "Any":
        return "bg-accent-red/20 text-accent-red";
      case "NonTransfer":
        return "bg-accent-yellow/20 text-accent-yellow";
      case "Governance":
        return "bg-selendra-400/20 text-selendra-400";
      case "Staking":
        return "bg-accent-green/20 text-accent-green";
      default:
        return "bg-foreground-secondary/20 text-foreground-secondary";
    }
  };

  return (
    <div className="card max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="h-5 w-5 text-selendra-400" />
            Proxy Accounts
          </h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Manage proxy relationships for your accounts
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
        {(["myProxies", "proxyFor", "add"] as const).map((tab) => (
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
            {tab === "myProxies"
              ? "My Proxies"
              : tab === "proxyFor"
                ? "Proxy For"
                : "Add Proxy"}
          </button>
        ))}
      </div>

      {/* My Proxies Tab */}
      {activeTab === "myProxies" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-selendra-400" />
            </div>
          ) : myProxies.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No proxies configured</p>
              <button
                onClick={() => setActiveTab("add")}
                className="btn-primary mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Proxy
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProxies.map((proxy, i) => (
                <div
                  key={`${proxy.delegate}-${i}`}
                  className="p-4 bg-background-secondary rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={clsx(
                            "text-xs px-2 py-0.5 rounded",
                            getProxyTypeColor(proxy.proxyType)
                          )}
                        >
                          {proxy.proxyType}
                        </span>
                        {proxy.delay > 0 && (
                          <span className="text-xs text-foreground-secondary flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {proxy.delay} blocks delay
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-foreground">
                          {proxy.delegate.slice(0, 12)}...{proxy.delegate.slice(-8)}
                        </code>
                        <button
                          onClick={() => handleCopy(proxy.delegate, `proxy-${i}`)}
                          className="text-foreground-secondary hover:text-foreground"
                        >
                          {copied === `proxy-${i}` ? (
                            <Check className="h-3 w-3 text-accent-green" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveProxy(proxy)}
                      className="p-2 text-foreground-secondary hover:text-accent-red hover:bg-accent-red/10 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proxy For Tab */}
      {activeTab === "proxyFor" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-selendra-400" />
            </div>
          ) : proxyFor.length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary">
              <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You are not a proxy for any accounts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proxyFor.map((rel, i) => (
                <div
                  key={`${rel.principal}-${i}`}
                  className="p-4 bg-background-secondary rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded",
                        getProxyTypeColor(rel.proxyType)
                      )}
                    >
                      {rel.proxyType}
                    </span>
                    {rel.delay > 0 && (
                      <span className="text-xs text-foreground-secondary flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {rel.delay} blocks delay
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary mb-1">
                    Acting as proxy for:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">
                      {rel.principal.slice(0, 12)}...{rel.principal.slice(-8)}
                    </code>
                    <button
                      onClick={() => handleCopy(rel.principal, `for-${i}`)}
                      className="text-foreground-secondary hover:text-foreground"
                    >
                      {copied === `for-${i}` ? (
                        <Check className="h-3 w-3 text-accent-green" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Proxy Tab */}
      {activeTab === "add" && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Delegate Address
            </label>
            <input
              type="text"
              value={delegateAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelegateAddress(e.target.value)}
              placeholder="5..."
              className="input w-full font-mono"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              The address that will be able to act on your behalf
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Proxy Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROXY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setProxyType(type.value)}
                  className={clsx(
                    "p-3 rounded-lg text-left transition-colors",
                    proxyType === type.value
                      ? "bg-selendra-500 text-white"
                      : "bg-background-secondary hover:bg-background-tertiary text-foreground"
                  )}
                >
                  <span className="font-medium">{type.label}</span>
                  <p
                    className={clsx(
                      "text-xs mt-1",
                      proxyType === type.value
                        ? "text-white/70"
                        : "text-foreground-secondary"
                    )}
                  >
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Delay (blocks)
            </label>
            <input
              type="number"
              value={delay}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDelay(Number(e.target.value))}
              min={0}
              className="input w-full"
            />
            <p className="text-xs text-foreground-secondary mt-1">
              Number of blocks to wait before proxy calls can be executed (0 = immediate)
            </p>
          </div>

          <div className="p-4 bg-accent-yellow/10 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-accent-yellow">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Important</span>
            </div>
            <p className="text-sm text-foreground-secondary mt-2">
              A proxy with &quot;Any&quot; type has full access to your account.
              Only add proxies for addresses you trust completely.
            </p>
          </div>

          <button
            onClick={handleAddProxy}
            disabled={isSubmitting || !delegateAddress}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Proxy
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

function getMockProxies(): ProxyInfo[] {
  return [
    {
      delegate: "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY",
      proxyType: "Staking",
      delay: 0,
    },
    {
      delegate: "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc",
      proxyType: "Governance",
      delay: 100,
    },
  ];
}

function getMockProxyFor(): ProxyRelationship[] {
  return [
    {
      principal: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      delegate: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      proxyType: "NonTransfer",
      delay: 0,
    },
  ];
}

export default ProxyManager;
