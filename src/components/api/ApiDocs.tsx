"use client";

import React, { useState } from "react";
import {
  Code,
  Key,
  Copy,
  CheckCircle,
  Book,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  ExternalLink,
  Terminal,
  Database,
  Activity,
  FileCode,
} from "lucide-react";

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  example: string;
}

const endpoints: Record<string, Endpoint[]> = {
  Accounts: [
    {
      method: "GET",
      path: "/api/v1/account/{address}",
      description: "Get account information including balance, nonce, and transaction count",
      params: [
        { name: "address", type: "string", required: true, description: "Account address (EVM or Substrate)" },
      ],
      example: `{
  "address": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  "balance": "1250567800000000000000",
  "nonce": 142,
  "transactionCount": 342,
  "type": "unified"
}`,
    },
    {
      method: "GET",
      path: "/api/v1/account/{address}/transactions",
      description: "Get transactions for an account with pagination",
      params: [
        { name: "address", type: "string", required: true, description: "Account address" },
        { name: "page", type: "number", required: false, description: "Page number (default: 1)" },
        { name: "limit", type: "number", required: false, description: "Results per page (default: 20)" },
      ],
      example: `{
  "transactions": [...],
  "total": 342,
  "page": 1,
  "limit": 20
}`,
    },
    {
      method: "GET",
      path: "/api/v1/account/{address}/tokens",
      description: "Get token balances for an account",
      params: [
        { name: "address", type: "string", required: true, description: "Account address" },
      ],
      example: `{
  "tokens": [
    { "symbol": "SEL", "balance": "1250.5678", "value": "$57.02" },
    { "symbol": "USDT", "balance": "5250.00", "value": "$5250.00" }
  ]
}`,
    },
  ],
  Blocks: [
    {
      method: "GET",
      path: "/api/v1/block/{blockNumber}",
      description: "Get block information by block number",
      params: [
        { name: "blockNumber", type: "number", required: true, description: "Block number or 'latest'" },
      ],
      example: `{
  "number": 1234567,
  "hash": "0x8a5d3f2b...",
  "parentHash": "0x7b4c2e1a...",
  "timestamp": 1699876543,
  "transactions": 42,
  "gasUsed": "12345678",
  "validator": "0x742d35cc..."
}`,
    },
    {
      method: "GET",
      path: "/api/v1/blocks",
      description: "Get list of blocks with pagination",
      params: [
        { name: "page", type: "number", required: false, description: "Page number" },
        { name: "limit", type: "number", required: false, description: "Results per page" },
      ],
      example: `{
  "blocks": [...],
  "total": 1234567,
  "page": 1,
  "limit": 20
}`,
    },
  ],
  Transactions: [
    {
      method: "GET",
      path: "/api/v1/tx/{hash}",
      description: "Get transaction details by hash",
      params: [
        { name: "hash", type: "string", required: true, description: "Transaction hash" },
      ],
      example: `{
  "hash": "0x8a5d3f2b...",
  "status": "success",
  "block": 1234567,
  "from": "0x742d35cc...",
  "to": "0x55d39832...",
  "value": "100000000000000000000",
  "fee": "2500000000000000"
}`,
    },
    {
      method: "GET",
      path: "/api/v1/transactions",
      description: "Get list of transactions with filtering",
      params: [
        { name: "address", type: "string", required: false, description: "Filter by address" },
        { name: "block", type: "number", required: false, description: "Filter by block" },
        { name: "type", type: "string", required: false, description: "Filter by type (transfer, contract, etc)" },
      ],
      example: `{
  "transactions": [...],
  "total": 5420000,
  "page": 1
}`,
    },
  ],
  Tokens: [
    {
      method: "GET",
      path: "/api/v1/token/{address}",
      description: "Get token information by contract address",
      params: [
        { name: "address", type: "string", required: true, description: "Token contract address" },
      ],
      example: `{
  "address": "0x55d39832...",
  "name": "Tether USD",
  "symbol": "USDT",
  "decimals": 6,
  "totalSupply": "12000000000000",
  "holders": 32150
}`,
    },
    {
      method: "GET",
      path: "/api/v1/tokens",
      description: "Get list of all tokens",
      params: [
        { name: "type", type: "string", required: false, description: "Filter by type (erc20, erc721)" },
        { name: "verified", type: "boolean", required: false, description: "Filter verified tokens only" },
      ],
      example: `{
  "tokens": [...],
  "total": 150
}`,
    },
  ],
  Stats: [
    {
      method: "GET",
      path: "/api/v1/stats",
      description: "Get network statistics",
      example: `{
  "blockHeight": 1234567,
  "transactions": 5420000,
  "tps": 125.5,
  "validators": 50,
  "totalStaked": "500000000",
  "marketCap": "45600000"
}`,
    },
    {
      method: "GET",
      path: "/api/v1/stats/price",
      description: "Get SEL price information",
      example: `{
  "price": 0.0456,
  "change24h": 5.23,
  "volume24h": 1250000,
  "marketCap": 45600000
}`,
    },
  ],
};

export const ApiDocs: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("Accounts");
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateApiKey = () => {
    const key = "sel_" + Array.from({ length: 32 }, () => 
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 62)]
    ).join("");
    setApiKey(key);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <p className="text-gray-400 mt-1">
            Build applications with Selendra Terminal API
          </p>
        </div>
        <a
          href="https://docs.selendra.org/api"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <Book className="w-4 h-4" />
          Full Documentation
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Base URL</p>
              <p className="font-mono text-sm">api.selendra.org</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Rate Limit</p>
              <p className="font-mono text-sm">100 req/min</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Auth</p>
              <p className="font-mono text-sm">API Key</p>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Format</p>
              <p className="font-mono text-sm">JSON</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-background-card border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-selendra-400" />
          <h2 className="text-lg font-semibold">Your API Key</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          API keys are required for accessing the Selendra Terminal API. Include your key in the Authorization header.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={apiKey}
              readOnly
              placeholder="Click 'Generate' to create your API key"
              className="w-full px-4 py-3 bg-background-secondary border border-gray-700 rounded-xl font-mono text-sm"
            />
            {apiKey && (
              <button
                onClick={() => copyToClipboard(apiKey, "apikey")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {copied === "apikey" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <button
            onClick={generateApiKey}
            className="px-6 py-3 bg-selendra-600 hover:bg-selendra-500 rounded-xl transition-colors font-medium"
          >
            Generate
          </button>
        </div>
        <div className="mt-4 p-3 bg-background-secondary rounded-lg">
          <p className="text-sm text-gray-400 font-mono">
            Authorization: Bearer {apiKey || "<your-api-key>"}
          </p>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background-card border border-gray-800 rounded-xl p-4 sticky top-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Endpoints
            </h3>
            <nav className="space-y-1">
              {Object.keys(endpoints).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === category
                      ? "bg-selendra-600/20 text-selendra-400"
                      : "text-gray-400 hover:bg-background-hover hover:text-white"
                  }`}
                >
                  <span>{category}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Endpoint Details */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-selendra-400" />
            {activeCategory} API
          </h2>

          {endpoints[activeCategory]?.map((endpoint, idx) => (
            <div
              key={idx}
              className="bg-background-card border border-gray-800 rounded-xl overflow-hidden"
            >
              {/* Endpoint Header */}
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    endpoint.method === "GET"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="font-mono text-sm">{endpoint.path}</code>
                <button
                  onClick={() => copyToClipboard(`https://api.selendra.org${endpoint.path}`, `path-${idx}`)}
                  className="ml-auto text-gray-400 hover:text-white"
                >
                  {copied === `path-${idx}` ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Endpoint Body */}
              <div className="p-4 space-y-4">
                <p className="text-gray-400">{endpoint.description}</p>

                {/* Parameters */}
                {endpoint.params && endpoint.params.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Parameters</h4>
                    <div className="bg-background-secondary rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left px-3 py-2 text-gray-400 font-medium">Name</th>
                            <th className="text-left px-3 py-2 text-gray-400 font-medium">Type</th>
                            <th className="text-left px-3 py-2 text-gray-400 font-medium">Required</th>
                            <th className="text-left px-3 py-2 text-gray-400 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.params.map((param, pidx) => (
                            <tr key={pidx} className="border-b border-gray-700 last:border-0">
                              <td className="px-3 py-2 font-mono text-selendra-400">{param.name}</td>
                              <td className="px-3 py-2 font-mono text-gray-300">{param.type}</td>
                              <td className="px-3 py-2">
                                {param.required ? (
                                  <span className="text-red-400">Yes</span>
                                ) : (
                                  <span className="text-gray-500">No</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-400">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Example Response */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Example Response</h4>
                    <button
                      onClick={() => copyToClipboard(endpoint.example, `example-${idx}`)}
                      className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
                    >
                      {copied === `example-${idx}` ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-background-secondary rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-gray-300 font-mono">{endpoint.example}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-background-card border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-selendra-400" />
          Quick Start Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-400">JavaScript / TypeScript</h3>
            <pre className="bg-background-secondary rounded-lg p-4 overflow-x-auto text-sm">
              <code className="text-gray-300 font-mono">{`const response = await fetch(
  'https://api.selendra.org/api/v1/account/0x...',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);
const data = await response.json();`}</code>
            </pre>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-400">cURL</h3>
            <pre className="bg-background-secondary rounded-lg p-4 overflow-x-auto text-sm">
              <code className="text-gray-300 font-mono">{`curl -X GET \\
  'https://api.selendra.org/api/v1/account/0x...' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
