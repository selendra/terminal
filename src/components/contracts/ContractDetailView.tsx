"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode,
  CheckCircle,
  Copy,
  Code,
  Eye,
  Edit3,
  FileText,
  Zap,
  Terminal,
  ExternalLink,
  ArrowLeft,
  Activity,
  Clock,
  Users,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Play,
  Wallet,
  Link2,
  Hash,
  Box,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Contract, ContractType, VMType } from "@/types/contracts";
import { CodeViewer } from "./CodeViewer";
import { ReadContract } from "./ReadContract";
import { WriteContract } from "./WriteContract";
import { EventLogs } from "./EventLogs";

// Tab type for contract detail view
type ContractTab = "overview" | "code" | "read" | "write" | "events" | "transactions";

interface ContractDetailViewProps {
  address: string;
  initialTab?: ContractTab;
}

// Mock ABI for demonstration
const mockABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "type": "string", "name": "" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "type": "string", "name": "" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "type": "uint8", "name": "" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "type": "uint256", "name": "" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "type": "address", "name": "account" }],
    "name": "balanceOf",
    "outputs": [{ "type": "uint256", "name": "" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "type": "address", "name": "to" }, { "type": "uint256", "name": "amount" }],
    "name": "transfer",
    "outputs": [{ "type": "bool", "name": "" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "type": "address", "name": "spender" }, { "type": "uint256", "name": "amount" }],
    "name": "approve",
    "outputs": [{ "type": "bool", "name": "" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

// Mock source code for demonstration
const mockSourceCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Selendra USDT
 * @dev Implementation of a standard ERC20 token with additional features
 */
contract SelendraUSDT is ERC20, Ownable {
    uint8 private _decimals;
    
    mapping(address => bool) private _blacklisted;
    
    event Blacklisted(address indexed account);
    event UnBlacklisted(address indexed account);
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply_ * 10 ** decimals_);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    function blacklist(address account) public onlyOwner {
        _blacklisted[account] = true;
        emit Blacklisted(account);
    }
    
    function unBlacklist(address account) public onlyOwner {
        _blacklisted[account] = false;
        emit UnBlacklisted(account);
    }
    
    function isBlacklisted(address account) public view returns (bool) {
        return _blacklisted[account];
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        require(!_blacklisted[from], "SelendraUSDT: sender is blacklisted");
        require(!_blacklisted[to], "SelendraUSDT: recipient is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }
}`;

// Mock contract data
const mockContractDetail: Contract & {
  sourceCode?: string;
  abi?: any[];
  bytecode?: string;
  constructorArgs?: string;
  optimizationEnabled?: boolean;
  runs?: number;
  evmVersion?: string;
  license?: string;
} = {
  address: "0x55d398326f99059ff775485246999027b3197955",
  name: "Selendra USDT",
  compiler: "Solidity",
  version: "0.8.19",
  verified: true,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  creator: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  txCount: 125420,
  balance: "0 SEL",
  type: "erc20",
  vmType: "evm",
  sourceCode: mockSourceCode,
  abi: mockABI,
  bytecode: "0x608060405234801561001057600080fd5b50...",
  constructorArgs: "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000f4240",
  optimizationEnabled: true,
  runs: 200,
  evmVersion: "paris",
  license: "MIT",
};

export const ContractDetailView: React.FC<ContractDetailViewProps> = ({
  address,
  initialTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState<ContractTab>(initialTab);
  const [contract, setContract] = useState<typeof mockContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading contract data
    const loadContract = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setContract({ ...mockContractDetail, address });
      setLoading(false);
    };
    loadContract();
  }, [address]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    toast.success("Address copied!");
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getTypeColor = (type: ContractType) => {
    switch (type) {
      case "erc20":
        return "bg-green-500/20 text-green-400";
      case "erc721":
        return "bg-purple-500/20 text-purple-400";
      case "erc1155":
        return "bg-pink-500/20 text-pink-400";
      case "defi":
        return "bg-blue-500/20 text-blue-400";
      case "proxy":
        return "bg-orange-500/20 text-orange-400";
      case "ink":
        return "bg-cyan-500/20 text-cyan-400";
      default:
        return "bg-foreground-secondary/20 text-foreground-secondary";
    }
  };

  const getTypeLabel = (type: ContractType) => {
    switch (type) {
      case "erc20":
        return "ERC-20";
      case "erc721":
        return "ERC-721";
      case "erc1155":
        return "ERC-1155";
      case "defi":
        return "DeFi";
      case "proxy":
        return "Proxy";
      case "ink":
        return "Ink!";
      default:
        return "Other";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-selendra-500 mx-auto mb-4" />
          <p className="text-foreground-secondary">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Contract Not Found</h2>
          <p className="text-foreground-secondary mb-4">
            The contract at address <code className="font-mono text-sm">{address}</code> could not be found.
          </p>
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contracts
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Eye },
    { id: "code" as const, label: "Code", icon: Code, requiresVerified: true },
    { id: "read" as const, label: "Read Contract", icon: FileText, requiresVerified: true },
    { id: "write" as const, label: "Write Contract", icon: Edit3, requiresVerified: true },
    { id: "events" as const, label: "Events", icon: Activity },
    { id: "transactions" as const, label: "Transactions", icon: ArrowUpRight },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Back Navigation */}
      <Link
        href="/contracts"
        className="inline-flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Contracts
      </Link>

      {/* Contract Header */}
      <div className="bg-background-card border border-border rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-selendra-500/20 rounded-xl flex items-center justify-center">
              <FileCode className="w-7 h-7 text-selendra-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{contract.name}</h1>
                {contract.verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-sm font-medium ${getTypeColor(contract.type)}`}>
                  {getTypeLabel(contract.type)}
                </span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${contract.vmType === "evm"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                  {contract.vmType === "evm" ? "EVM" : "WASM"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => copyAddress(contract.address)}
                  className="flex items-center gap-2 text-foreground-secondary hover:text-foreground font-mono text-sm transition-colors"
                >
                  {contract.address}
                  {copiedAddress === contract.address ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {contract.verified && (
              <a
                href={`https://github.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-sm text-foreground-secondary">Balance</p>
            <p className="text-lg font-semibold">{contract.balance}</p>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-sm text-foreground-secondary">Transactions</p>
            <p className="text-lg font-semibold">{contract.txCount.toLocaleString()}</p>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-sm text-foreground-secondary">Compiler</p>
            <p className="text-lg font-semibold">{contract.compiler} v{contract.version}</p>
          </div>
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-sm text-foreground-secondary">Created</p>
            <p className="text-lg font-semibold">
              {Math.floor((Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days ago
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const isDisabled = tab.requiresVerified && !contract.verified;
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? "bg-selendra-600 text-white"
                  : isDisabled
                    ? "text-foreground-secondary/50 cursor-not-allowed"
                    : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
                }`}
              title={isDisabled ? "Contract must be verified to access this tab" : undefined}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {isDisabled && <AlertCircle className="w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        {activeTab === "overview" && (
          <OverviewTab contract={contract} copyAddress={copyAddress} copiedAddress={copiedAddress} />
        )}
        {activeTab === "code" && contract.verified && (
          <CodeViewer
            sourceCode={contract.sourceCode || ""}
            compiler={contract.compiler}
            version={contract.version}
            optimizationEnabled={contract.optimizationEnabled}
            runs={contract.runs}
            evmVersion={contract.evmVersion}
            license={contract.license}
            abi={contract.abi}
            bytecode={contract.bytecode}
            constructorArgs={contract.constructorArgs}
          />
        )}
        {activeTab === "read" && contract.verified && (
          <ReadContract address={contract.address} abi={contract.abi || []} vmType={contract.vmType} />
        )}
        {activeTab === "write" && contract.verified && (
          <WriteContract address={contract.address} abi={contract.abi || []} vmType={contract.vmType} />
        )}
        {activeTab === "events" && (
          <EventLogs address={contract.address} />
        )}
        {activeTab === "transactions" && (
          <TransactionsTab address={contract.address} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  contract: typeof mockContractDetail;
  copyAddress: (addr: string) => void;
  copiedAddress: string | null;
}> = ({ contract, copyAddress, copiedAddress }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Contract Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-selendra-400" />
          Contract Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
              <Hash className="w-5 h-5 text-foreground-secondary mt-0.5" />
              <div>
                <p className="text-sm text-foreground-secondary">Contract Address</p>
                <button
                  onClick={() => copyAddress(contract.address)}
                  className="font-mono text-sm hover:text-selendra-400 transition-colors flex items-center gap-1"
                >
                  {contract.address}
                  {copiedAddress === contract.address ? (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
              <Users className="w-5 h-5 text-foreground-secondary mt-0.5" />
              <div>
                <p className="text-sm text-foreground-secondary">Creator</p>
                <Link
                  href={`/address/${contract.creator}`}
                  className="font-mono text-sm hover:text-selendra-400 transition-colors"
                >
                  {contract.creator.slice(0, 16)}...{contract.creator.slice(-8)}
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
              <Clock className="w-5 h-5 text-foreground-secondary mt-0.5" />
              <div>
                <p className="text-sm text-foreground-secondary">Created</p>
                <p className="text-sm">{contract.createdAt.toLocaleDateString()} ({Math.floor((Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days ago)</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
              <Terminal className="w-5 h-5 text-foreground-secondary mt-0.5" />
              <div>
                <p className="text-sm text-foreground-secondary">Compiler</p>
                <p className="text-sm">{contract.compiler} v{contract.version}</p>
              </div>
            </div>
            {contract.optimizationEnabled !== undefined && (
              <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
                <Zap className="w-5 h-5 text-foreground-secondary mt-0.5" />
                <div>
                  <p className="text-sm text-foreground-secondary">Optimization</p>
                  <p className="text-sm">
                    {contract.optimizationEnabled ? `Enabled (${contract.runs} runs)` : "Disabled"}
                  </p>
                </div>
              </div>
            )}
            {contract.license && (
              <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg">
                <Shield className="w-5 h-5 text-foreground-secondary mt-0.5" />
                <div>
                  <p className="text-sm text-foreground-secondary">License</p>
                  <p className="text-sm">{contract.license}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Information (if ERC20) */}
      {contract.type === "erc20" && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-selendra-400" />
            Token Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background-secondary rounded-lg text-center">
              <p className="text-sm text-foreground-secondary">Token Name</p>
              <p className="text-xl font-bold mt-1">Selendra USDT</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg text-center">
              <p className="text-sm text-foreground-secondary">Symbol</p>
              <p className="text-xl font-bold mt-1">USDT</p>
            </div>
            <div className="p-4 bg-background-secondary rounded-lg text-center">
              <p className="text-sm text-foreground-secondary">Decimals</p>
              <p className="text-xl font-bold mt-1">18</p>
            </div>
          </div>
        </div>
      )}

      {/* More Information */}
      {!contract.verified && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Contract Not Verified</p>
              <p className="text-sm text-foreground-secondary mt-1">
                This contract has not been verified. Verify your contract to enable source code viewing and interaction features.
              </p>
              <Link
                href="/contracts?verify=true"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Contract
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Transactions Tab Component (placeholder)
const TransactionsTab: React.FC<{ address: string }> = ({ address }) => {
  const mockTransactions = [
    {
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      method: "transfer",
      from: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      to: address,
      value: "0 SEL",
      fee: "0.001 SEL",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: "success" as const,
    },
    {
      hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      method: "approve",
      from: "0x123abc456def789ghi012jkl345mno678pqr",
      to: address,
      value: "0 SEL",
      fee: "0.0008 SEL",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: "success" as const,
    },
  ];

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">Txn Hash</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">Method</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">From</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-foreground-secondary">To</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Value</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Fee</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-foreground-secondary">Age</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr key={tx.hash} className="border-b border-border hover:bg-background-hover transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/tx/${tx.hash}`}
                    className="font-mono text-sm text-selendra-400 hover:text-selendra-300"
                  >
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-background-secondary rounded text-xs font-medium">
                    {tx.method}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/address/${tx.from}`}
                    className="font-mono text-sm hover:text-selendra-400 transition-colors"
                  >
                    {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/address/${tx.to}`}
                    className="font-mono text-sm hover:text-selendra-400 transition-colors"
                  >
                    {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">{tx.value}</td>
                <td className="px-4 py-3 text-right text-foreground-secondary">{tx.fee}</td>
                <td className="px-4 py-3 text-right text-foreground-secondary text-sm">
                  {Math.floor((Date.now() - tx.timestamp.getTime()) / (1000 * 60))} mins ago
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractDetailView;
