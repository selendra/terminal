"use client";

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import {
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
  Check,
  X,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
  Shield,
  Unplug,
  Link as LinkIcon,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// WalletConnect SignClient type (dynamically imported)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignClientType = any;

// WalletConnect types
interface WalletConnectSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: string;
  };
  namespaces: Record<string, {
    accounts: string[];
    methods: string[];
    events: string[];
  }>;
  requiredNamespaces: Record<string, {
    chains: string[];
    methods: string[];
    events: string[];
  }>;
  expiry: number;
  peer: {
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
}

interface PendingRequest {
  id: number;
  topic: string;
  method: string;
  params: unknown;
  chainId: string;
}

interface WalletConnectContextType {
  isInitialized: boolean;
  isConnecting: boolean;
  uri: string | null;
  sessions: WalletConnectSession[];
  pendingRequests: PendingRequest[];
  connect: () => Promise<void>;
  disconnect: (topic: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
  approveRequest: (id: number, result: unknown) => Promise<void>;
  rejectRequest: (id: number, message?: string) => Promise<void>;
}

const WalletConnectContext = createContext<WalletConnectContextType | null>(null);

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error("useWalletConnect must be used within a WalletConnectProvider");
  }
  return context;
}

// Selendra chain configuration for WalletConnect
const SELENDRA_CHAINS = {
  mainnet: {
    chainId: "eip155:1961",
    chainName: "Selendra Mainnet",
    rpc: "https://rpc.selendra.org",
    explorer: "https://scan.selendra.org",
    nativeCurrency: {
      name: "Selendra",
      symbol: "SEL",
      decimals: 18,
    },
  },
  testnet: {
    chainId: "eip155:1953",
    chainName: "Selendra Testnet",
    rpc: "https://rpc-testnet.selendra.org",
    explorer: "https://testnet.scan.selendra.org",
    nativeCurrency: {
      name: "Selendra",
      symbol: "SEL",
      decimals: 18,
    },
  },
};

interface WalletConnectProviderProps {
  children: ReactNode;
  projectId?: string;
}

export function WalletConnectProvider({
  children,
  projectId = "YOUR_WALLETCONNECT_PROJECT_ID", // Get from https://cloud.walletconnect.com
}: WalletConnectProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [signClient, setSignClient] = useState<SignClientType>(null);
  const [wcError, setWcError] = useState<string | null>(null);

  // Initialize WalletConnect SignClient
  useEffect(() => {
    const init = async () => {
      try {
        // Dynamic import for WalletConnect - may not be installed
        // @ts-expect-error - Module may not be installed
        const module = await import("@walletconnect/sign-client");
        const SignClient = module.SignClient;

        const client = await SignClient.init({
          projectId,
          metadata: {
            name: "Selendra Terminal",
            description: "Selendra Blockchain Explorer & Wallet",
            url: "https://terminal.selendra.org",
            icons: ["https://selendra.org/logo.png"],
          },
        });

        // Set up event listeners
        client.on("session_proposal", async (proposal: any) => {
          console.log("Session proposal received:", proposal);
          // Auto-approve for now, in production show a UI
          const { id, params } = proposal;
          const { requiredNamespaces } = params;

          // Build namespaces based on connected accounts
          const namespaces: Record<string, { accounts: string[]; methods: string[]; events: string[] }> = {};

          for (const [key, value] of Object.entries(requiredNamespaces)) {
            const ns = value as { chains: string[]; methods: string[]; events: string[] };
            namespaces[key] = {
              accounts: ns.chains.map((chain: string) => `${chain}:0x...`), // Replace with actual account
              methods: ns.methods,
              events: ns.events,
            };
          }

          try {
            await client.approve({ id, namespaces });
          } catch (error) {
            console.error("Failed to approve session:", error);
            await client.reject({ id, reason: { code: 4001, message: "User rejected" } });
          }
        });

        client.on("session_request", (event: any) => {
          console.log("Session request received:", event);
          setPendingRequests((prev) => [...prev, event]);
        });

        client.on("session_delete", (event: any) => {
          console.log("Session deleted:", event);
          setSessions((prev) => prev.filter((s) => s.topic !== event.topic));
        });

        // Load existing sessions
        const existingSessions = client.session.getAll();
        setSessions(existingSessions);

        setSignClient(client);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize WalletConnect:", error);
        // Still mark as initialized to prevent blocking the UI
        setIsInitialized(true);
      }
    };

    init();
  }, [projectId]);

  const connect = useCallback(async () => {
    if (!signClient) {
      toast.error("WalletConnect not initialized");
      return;
    }

    setIsConnecting(true);
    try {
      const { uri: newUri, approval } = await signClient.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              "eth_sendTransaction",
              "eth_signTransaction",
              "eth_sign",
              "personal_sign",
              "eth_signTypedData",
            ],
            chains: ["eip155:1961", "eip155:1953"],
            events: ["chainChanged", "accountsChanged"],
          },
        },
      });

      if (newUri) {
        setUri(newUri);
      }

      const session = await approval();
      setSessions((prev) => [...prev, session]);
      setUri(null);
      toast.success("Connected via WalletConnect");
    } catch (error: any) {
      if (error.message?.includes("User rejected")) {
        toast.error("Connection rejected");
      } else {
        toast.error("Failed to connect");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [signClient]);

  const disconnect = useCallback(
    async (topic: string) => {
      if (!signClient) return;

      try {
        await signClient.disconnect({
          topic,
          reason: { code: 6000, message: "User disconnected" },
        });
        setSessions((prev) => prev.filter((s) => s.topic !== topic));
        toast.success("Disconnected");
      } catch (error) {
        toast.error("Failed to disconnect");
      }
    },
    [signClient]
  );

  const disconnectAll = useCallback(async () => {
    if (!signClient) return;

    try {
      await Promise.all(
        sessions.map((session) =>
          signClient.disconnect({
            topic: session.topic,
            reason: { code: 6000, message: "User disconnected all" },
          })
        )
      );
      setSessions([]);
      toast.success("All sessions disconnected");
    } catch (error) {
      toast.error("Failed to disconnect all");
    }
  }, [signClient, sessions]);

  const approveRequest = useCallback(
    async (id: number, result: unknown) => {
      if (!signClient) return;

      const request = pendingRequests.find((r) => r.id === id);
      if (!request) return;

      try {
        await signClient.respond({
          topic: request.topic,
          response: {
            id,
            result,
            jsonrpc: "2.0",
          },
        });
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Request approved");
      } catch (error) {
        toast.error("Failed to approve request");
      }
    },
    [signClient, pendingRequests]
  );

  const rejectRequest = useCallback(
    async (id: number, message = "User rejected") => {
      if (!signClient) return;

      const request = pendingRequests.find((r) => r.id === id);
      if (!request) return;

      try {
        await signClient.respond({
          topic: request.topic,
          response: {
            id,
            error: { code: 4001, message },
            jsonrpc: "2.0",
          },
        });
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
        toast.success("Request rejected");
      } catch (error) {
        toast.error("Failed to reject request");
      }
    },
    [signClient, pendingRequests]
  );

  const value: WalletConnectContextType = {
    isInitialized,
    isConnecting,
    uri,
    sessions,
    pendingRequests,
    connect,
    disconnect,
    disconnectAll,
    approveRequest,
    rejectRequest,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}

// WalletConnect Connection UI Component
export function WalletConnectConnect() {
  const {
    isInitialized,
    isConnecting,
    uri,
    sessions,
    connect,
    disconnect,
    disconnectAll,
  } = useWalletConnect();

  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyUri = async () => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (!isInitialized) {
    return (
      <div className="bg-background-card border border-border rounded-xl p-6 text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-selendra-400" />
        <p className="text-foreground-secondary">Initializing WalletConnect...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-selendra-400" />
            WalletConnect
          </h2>
          <p className="text-foreground-secondary text-sm mt-1">
            Connect mobile wallets via WalletConnect v2
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={disconnectAll}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Disconnect All
          </button>
        )}
      </div>

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground-secondary">
            Active Sessions ({sessions.length})
          </h3>
          {sessions.map((session) => (
            <div
              key={session.topic}
              className="bg-background-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {session.peer.metadata.icons[0] ? (
                    <img
                      src={session.peer.metadata.icons[0]}
                      alt={session.peer.metadata.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-selendra-500/20 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-selendra-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {session.peer.metadata.name}
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      {session.peer.metadata.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <Wifi className="h-4 w-4" />
                    Connected
                  </div>
                  <button
                    onClick={() => disconnect(session.topic)}
                    className="p-2 text-foreground-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Disconnect"
                  >
                    <Unplug className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-foreground-secondary">
                  Chains:{" "}
                  {Object.values(session.namespaces)
                    .flatMap((ns) => ns.accounts)
                    .map((acc) => acc.split(":")[1])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect New */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        {uri ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Scan QR Code</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-sm text-foreground-secondary hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex flex-col items-center justify-center py-8 bg-white rounded-xl">
              <QrCode className="h-32 w-32 text-gray-800" />
              <p className="mt-4 text-gray-600 text-sm text-center">
                Scan with your mobile wallet
              </p>
            </div>

            {/* Copy URI */}
            <div className="flex gap-2">
              <input
                type="text"
                value={uri}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground text-sm font-mono truncate"
              />
              <button
                onClick={copyUri}
                className="px-4 py-2 bg-background-tertiary hover:bg-background-hover border border-border rounded-lg text-foreground transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <p className="text-xs text-foreground-secondary text-center">
              Or copy the link and paste it in your mobile wallet
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-selendra-500/20 flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-selendra-400" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Connect Mobile Wallet
            </h3>
            <p className="text-foreground-secondary text-sm mb-6 max-w-sm mx-auto">
              Use WalletConnect to connect your mobile wallet like MetaMask Mobile,
              Trust Wallet, Rainbow, and more.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-6 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Supported Wallets */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        <h3 className="font-medium text-foreground mb-4">Supported Wallets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: "MetaMask", icon: "🦊" },
            { name: "Trust Wallet", icon: "🛡️" },
            { name: "Rainbow", icon: "🌈" },
            { name: "Argent", icon: "🔷" },
            { name: "imToken", icon: "💎" },
            { name: "Nova", icon: "⭐" },
            { name: "Zerion", icon: "🟣" },
            { name: "Other", icon: "..." },
          ].map((wallet) => (
            <div
              key={wallet.name}
              className="flex items-center gap-2 p-3 bg-background-tertiary rounded-lg"
            >
              <span className="text-xl">{wallet.icon}</span>
              <span className="text-sm text-foreground">{wallet.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400">Secure Connection</h4>
            <p className="text-sm text-foreground-secondary mt-1">
              WalletConnect creates an encrypted connection between your browser
              and mobile wallet. Your keys never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Approval Modal Component
interface RequestModalProps {
  request: PendingRequest;
  onApprove: (result: unknown) => void;
  onReject: () => void;
}

export function WalletConnectRequestModal({
  request,
  onApprove,
  onReject,
}: RequestModalProps) {
  const getMethodDisplay = (method: string) => {
    const methods: Record<string, { name: string; description: string }> = {
      eth_sendTransaction: {
        name: "Send Transaction",
        description: "This request will send a transaction from your wallet",
      },
      eth_signTransaction: {
        name: "Sign Transaction",
        description: "This request will sign a transaction (not broadcast)",
      },
      eth_sign: {
        name: "Sign Message",
        description: "This request will sign a message with your wallet",
      },
      personal_sign: {
        name: "Personal Sign",
        description: "This request will sign a personal message",
      },
      eth_signTypedData: {
        name: "Sign Typed Data",
        description: "This request will sign structured data",
      },
    };
    return methods[method] || { name: method, description: "Unknown request type" };
  };

  const methodInfo = getMethodDisplay(request.method);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {methodInfo.name}
            </h2>
            <p className="text-sm text-foreground-secondary">{methodInfo.description}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-background rounded-xl">
            <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-2">
              Request Details
            </p>
            <pre className="text-sm text-foreground font-mono overflow-auto max-h-48">
              {JSON.stringify(request.params, null, 2)}
            </pre>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground-secondary">Chain:</span>
            <span className="text-foreground font-medium">{request.chainId}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-background-hover transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove({})}
            className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
