"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Code,
  Book,
  Terminal,
  Package,
  Zap,
  Globe,
  Copy,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Play,
  FileCode,
  Boxes,
  Radio,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

interface SDKExample {
  language: string;
  label: string;
  code: string;
  icon: string;
}

const sdkExamples: SDKExample[] = [
  {
    language: "typescript",
    label: "TypeScript",
    icon: "TS",
    code: `import { SelendraSDK } from '@selendra/sdk';

// Initialize SDK
const sdk = new SelendraSDK({
  network: 'mainnet',
  apiKey: 'YOUR_API_KEY'
});

// Get account balance
const balance = await sdk.accounts.getBalance(
  '0x742d35cc6634c0532925a3b844bc454e4438f44e'
);

// Transfer tokens
const tx = await sdk.tokens.transfer({
  to: '0x55d398326f99059ff775485246999027b3197955',
  amount: '1000000000000000000',
  token: 'SEL'
});

console.log('Transaction hash:', tx.hash);`,
  },
  {
    language: "rust",
    label: "Rust",
    icon: "RS",
    code: `use selendra_sdk::prelude::*;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize client
    let client = SelendraClient::new(
        "wss://rpc.selendra.org",
        None
    ).await?;

    // Get block
    let block = client
        .blocks()
        .get_latest()
        .await?;

    println!("Latest block: #{}", block.number);

    // Subscribe to new blocks
    let mut sub = client
        .blocks()
        .subscribe_new()
        .await?;

    while let Some(block) = sub.next().await {
        println!("New block: {}", block?.hash);
    }

    Ok(())
}`,
  },
  {
    language: "python",
    label: "Python",
    icon: "PY",
    code: `from selendra import SelendraClient

# Initialize client
client = SelendraClient(
    endpoint="https://api.selendra.org",
    api_key="YOUR_API_KEY"
)

# Get account info
account = client.accounts.get(
    "0x742d35cc6634c0532925a3b844bc454e4438f44e"
)
print(f"Balance: {account.balance} SEL")

# Get transactions
txs = client.transactions.list(
    address=account.address,
    limit=10
)

for tx in txs:
    print(f"TX: {tx.hash} - {tx.value} SEL")`,
  },
];

const wsEndpoints = [
  {
    event: "newBlock",
    description: "Subscribe to new blocks as they are produced",
    example: `{
  "method": "subscribe",
  "params": ["newBlock"],
  "id": 1
}`,
    response: `{
  "event": "newBlock",
  "data": {
    "number": 1234567,
    "hash": "0x8a5d3f2b...",
    "timestamp": 1699876543,
    "transactions": 42
  }
}`,
  },
  {
    event: "pendingTransactions",
    description: "Subscribe to pending transactions in the mempool",
    example: `{
  "method": "subscribe",
  "params": ["pendingTransactions"],
  "id": 2
}`,
    response: `{
  "event": "pendingTransaction",
  "data": {
    "hash": "0xabc123...",
    "from": "0x742d35cc...",
    "to": "0x55d39832...",
    "value": "1000000000000000000"
  }
}`,
  },
  {
    event: "logs",
    description: "Subscribe to contract event logs with optional filters",
    example: `{
  "method": "subscribe",
  "params": ["logs", {
    "address": "0x55d398326f99059ff775485246999027b3197955",
    "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
  }],
  "id": 3
}`,
    response: `{
  "event": "log",
  "data": {
    "address": "0x55d39832...",
    "topics": ["0xddf252ad..."],
    "data": "0x...",
    "blockNumber": 1234567
  }
}`,
  },
];

const packages = [
  {
    name: "@selendra/sdk",
    description: "Official TypeScript/JavaScript SDK for Selendra",
    install: "npm install @selendra/sdk",
    version: "2.0.0",
    docs: "https://docs.selendra.org/sdk/javascript",
  },
  {
    name: "selendra-rs",
    description: "Rust SDK for Selendra blockchain",
    install: "cargo add selendra-rs",
    version: "0.8.0",
    docs: "https://docs.selendra.org/sdk/rust",
  },
  {
    name: "selendra-py",
    description: "Python SDK for Selendra blockchain",
    install: "pip install selendra",
    version: "1.2.0",
    docs: "https://docs.selendra.org/sdk/python",
  },
  {
    name: "@selendra/contracts",
    description: "Smart contract development utilities",
    install: "npm install @selendra/contracts",
    version: "1.5.0",
    docs: "https://docs.selendra.org/contracts",
  },
];

export function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState<"sdk" | "websocket" | "packages">("sdk");
  const [activeLanguage, setActiveLanguage] = useState("typescript");
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const currentExample = sdkExamples.find((e) => e.language === activeLanguage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Developer Portal
          </h1>
          <p className="text-foreground-secondary mt-1">
            SDKs, WebSocket API, and developer tools for building on Selendra
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/selendra"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-hover rounded-lg transition-colors text-foreground"
          >
            <Code className="w-4 h-4" />
            GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://docs.selendra.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-selendra-500 hover:bg-selendra-600 text-white rounded-lg transition-colors"
          >
            <Book className="w-4 h-4" />
            Full Documentation
          </a>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">RPC Endpoint</p>
              <p className="font-mono text-sm text-foreground">rpc.selendra.org</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Radio className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">WebSocket</p>
              <p className="font-mono text-sm text-foreground">wss://ws.selendra.org</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Chain ID</p>
              <p className="font-mono text-sm text-foreground">1961 (Mainnet)</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Testnet ID</p>
              <p className="font-mono text-sm text-foreground">1953 (Testnet)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: "sdk", label: "SDK Examples", icon: Terminal },
            { id: "websocket", label: "WebSocket API", icon: Radio },
            { id: "packages", label: "Packages", icon: Package },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-selendra-500 text-selendra-500"
                  : "border-transparent text-foreground-secondary hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* SDK Examples Tab */}
      {activeTab === "sdk" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-background-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-foreground mb-4">Languages</h3>
              <div className="space-y-2">
                {sdkExamples.map((example) => (
                  <button
                    key={example.language}
                    onClick={() => setActiveLanguage(example.language)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      activeLanguage === example.language
                        ? "bg-selendra-500/20 text-selendra-500"
                        : "text-foreground-secondary hover:bg-background-hover"
                    )}
                  >
                    <span className="w-8 h-8 rounded bg-background-secondary flex items-center justify-center text-xs font-bold">
                      {example.icon}
                    </span>
                    <span>{example.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-background-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <FileCode className="w-5 h-5 text-selendra-500" />
                  <span className="font-medium text-foreground">
                    {currentExample?.label} Example
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentExample?.code || "", "sdk-code")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {copiedItem === "sdk-code" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copy
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-selendra-500 text-white rounded-lg hover:bg-selendra-600 transition-colors">
                    <Play className="w-4 h-4" />
                    Run
                  </button>
                </div>
              </div>
              <pre className="p-4 overflow-x-auto bg-background-secondary">
                <code className="text-sm font-mono text-foreground">
                  {currentExample?.code}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* WebSocket Tab */}
      {activeTab === "websocket" && (
        <div className="space-y-6">
          <div className="bg-background-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Radio className="w-5 h-5 text-selendra-500" />
              <h3 className="font-semibold text-foreground">
                WebSocket Connection
              </h3>
            </div>
            <p className="text-foreground-secondary mb-4">
              Connect to our WebSocket endpoint for real-time blockchain data streaming.
            </p>
            <div className="p-4 bg-background-secondary rounded-lg">
              <code className="text-sm font-mono text-foreground">
                wss://ws.selendra.org
              </code>
            </div>
          </div>

          <div className="space-y-4">
            {wsEndpoints.map((endpoint, idx) => (
              <div
                key={idx}
                className="bg-background-card rounded-xl border border-border overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-bold">
                      WS
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {endpoint.event}
                    </span>
                  </div>
                  <p className="text-foreground-secondary text-sm mt-2">
                    {endpoint.description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground-secondary">
                        Request
                      </span>
                      <button
                        onClick={() => handleCopy(endpoint.example, `ws-req-${idx}`)}
                        className="text-foreground-secondary hover:text-foreground"
                      >
                        {copiedItem === `ws-req-${idx}` ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-foreground overflow-x-auto">
                      {endpoint.example}
                    </pre>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground-secondary">
                        Response
                      </span>
                      <button
                        onClick={() => handleCopy(endpoint.response, `ws-res-${idx}`)}
                        className="text-foreground-secondary hover:text-foreground"
                      >
                        {copiedItem === `ws-res-${idx}` ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-foreground overflow-x-auto">
                      {endpoint.response}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="bg-background-card rounded-xl border border-border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-selendra-500/20 rounded-lg">
                    <Boxes className="w-5 h-5 text-selendra-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {pkg.name}
                    </h3>
                    <span className="text-xs text-foreground-secondary">
                      v{pkg.version}
                    </span>
                  </div>
                </div>
                <a
                  href={pkg.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-selendra-500 hover:text-selendra-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-foreground-secondary text-sm mb-4">
                {pkg.description}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-background-secondary rounded-lg">
                  <code className="text-xs font-mono text-foreground">
                    {pkg.install}
                  </code>
                </div>
                <button
                  onClick={() => handleCopy(pkg.install, `pkg-${idx}`)}
                  className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {copiedItem === `pkg-${idx}` ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Start Guide */}
      <div className="bg-gradient-to-br from-selendra-500/10 to-purple-500/10 rounded-xl border border-selendra-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-selendra-500" />
          <h3 className="text-lg font-semibold text-foreground">
            Quick Start Guide
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-selendra-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </span>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Install SDK
              </h4>
              <p className="text-sm text-foreground-secondary">
                Choose your preferred language and install the SDK package
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-selendra-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </span>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Get API Key
              </h4>
              <p className="text-sm text-foreground-secondary">
                Generate an API key from the API Documentation page
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 bg-selendra-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </span>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Start Building
              </h4>
              <p className="text-sm text-foreground-secondary">
                Follow our examples to integrate with Selendra blockchain
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
