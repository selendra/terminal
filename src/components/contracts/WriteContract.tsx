"use client";

import React, { useState } from "react";
import {
  Edit3,
  ChevronDown,
  ChevronRight,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
  Info,
  ExternalLink,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import { VMType } from "./ContractsExplorer";

interface WriteContractProps {
  address: string;
  abi: any[];
  vmType: VMType;
}

interface TransactionResult {
  hash: string;
  status: "pending" | "success" | "failed";
  error?: string;
}

export const WriteContract: React.FC<WriteContractProps> = ({
  address,
  abi,
  vmType,
}) => {
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [functionInputs, setFunctionInputs] = useState<Record<string, Record<string, string>>>({});
  const [functionValues, setFunctionValues] = useState<Record<string, string>>({});
  const [transactionResults, setTransactionResults] = useState<Record<string, TransactionResult>>({});
  const [loadingFunctions, setLoadingFunctions] = useState<Set<string>>(new Set());
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  // Filter for non-view functions only (write functions)
  const writeFunctions = abi.filter(
    (item) =>
      item.type === "function" &&
      item.stateMutability !== "view" &&
      item.stateMutability !== "pure"
  );

  const toggleFunction = (name: string) => {
    const newExpanded = new Set(expandedFunctions);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedFunctions(newExpanded);
  };

  const updateInput = (functionName: string, paramName: string, value: string) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [paramName]: value,
      },
    }));
  };

  const updateValue = (functionName: string, value: string) => {
    setFunctionValues((prev) => ({
      ...prev,
      [functionName]: value,
    }));
  };

  const connectWallet = async () => {
    try {
      // Simulate wallet connection
      toast.loading("Connecting wallet...", { id: "wallet-connect" });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock connected address
      setIsWalletConnected(true);
      setConnectedAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
      toast.success("Wallet connected!", { id: "wallet-connect" });
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`, { id: "wallet-connect" });
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setConnectedAddress(null);
    toast.success("Wallet disconnected");
  };

  const executeFunction = async (func: any) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const funcName = func.name;
    setLoadingFunctions((prev) => new Set(prev).add(funcName));

    try {
      // Simulate transaction
      toast.loading("Preparing transaction...", { id: `tx-${funcName}` });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock transaction hash
      const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      
      setTransactionResults((prev) => ({
        ...prev,
        [funcName]: { hash: mockTxHash, status: "pending" },
      }));

      toast.loading("Transaction pending...", { id: `tx-${funcName}` });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setTransactionResults((prev) => ({
        ...prev,
        [funcName]: { hash: mockTxHash, status: "success" },
      }));

      toast.success("Transaction successful!", { id: `tx-${funcName}` });
    } catch (error: any) {
      setTransactionResults((prev) => ({
        ...prev,
        [funcName]: { hash: "", status: "failed", error: error.message },
      }));
      toast.error(`Transaction failed: ${error.message}`, { id: `tx-${funcName}` });
    } finally {
      setLoadingFunctions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(funcName);
        return newSet;
      });
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Transaction hash copied!");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-5 h-5 text-selendra-400" />
          <h3 className="text-lg font-semibold">Write Contract</h3>
          <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
            {writeFunctions.length} functions
          </span>
        </div>
        <p className="text-sm text-foreground-secondary">
          Execute state-changing functions on the contract. Requires wallet connection and gas fees.
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="mb-6 p-4 bg-background-secondary rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isWalletConnected ? "bg-green-500/20" : "bg-foreground-secondary/20"}`}>
              <Wallet className={`w-5 h-5 ${isWalletConnected ? "text-green-400" : "text-foreground-secondary"}`} />
            </div>
            <div>
              <p className="font-medium">
                {isWalletConnected ? "Wallet Connected" : "Wallet Not Connected"}
              </p>
              {connectedAddress && (
                <p className="text-sm text-foreground-secondary font-mono">
                  {connectedAddress.slice(0, 10)}...{connectedAddress.slice(-8)}
                </p>
              )}
            </div>
          </div>
          {isWalletConnected ? (
            <button
              onClick={disconnectWallet}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {vmType === "evm" ? "Connect MetaMask" : "Connect Polkadot.js"}
            </button>
          )}
        </div>
      </div>

      {/* Warning Box */}
      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400">Caution Required</p>
            <p className="text-foreground-secondary mt-1">
              Write functions modify the blockchain state. They require gas fees and 
              cannot be reversed. Please verify all parameters before executing.
            </p>
          </div>
        </div>
      </div>

      {/* Functions List */}
      <div className="space-y-3">
        {writeFunctions.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary">
            <Edit3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No write functions found in this contract.</p>
          </div>
        ) : (
          writeFunctions.map((func, index) => {
            const isExpanded = expandedFunctions.has(func.name);
            const isLoading = loadingFunctions.has(func.name);
            const result = transactionResults[func.name];
            const hasInputs = func.inputs && func.inputs.length > 0;
            const isPayable = func.stateMutability === "payable";

            return (
              <div
                key={`${func.name}-${index}`}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Function Header */}
                <button
                  onClick={() => toggleFunction(func.name)}
                  className="w-full flex items-center justify-between p-4 bg-background-secondary hover:bg-background-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-mono font-medium">{func.name}</span>
                    <span className="text-xs text-foreground-secondary">
                      ({func.inputs?.map((i: any) => `${i.type} ${i.name}`).join(", ") || ""})
                    </span>
                    {isPayable && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        payable
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-foreground-secondary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-foreground-secondary" />
                  )}
                </button>

                {/* Function Body */}
                {isExpanded && (
                  <div className="p-4 border-t border-border space-y-4">
                    {/* Payable Value */}
                    {isPayable && (
                      <div>
                        <label className="block text-sm text-foreground-secondary mb-1">
                          payableAmount <span className="text-cyan-400">(SEL)</span>
                        </label>
                        <input
                          type="text"
                          value={functionValues[func.name] || ""}
                          onChange={(e) => updateValue(func.name, e.target.value)}
                          placeholder="0.0"
                          className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500 font-mono text-sm"
                        />
                      </div>
                    )}

                    {/* Inputs */}
                    {hasInputs && (
                      <div className="space-y-3">
                        {func.inputs.map((input: any, inputIndex: number) => (
                          <div key={inputIndex}>
                            <label className="block text-sm text-foreground-secondary mb-1">
                              {input.name} <span className="text-cyan-400">({input.type})</span>
                            </label>
                            <input
                              type="text"
                              value={functionInputs[func.name]?.[input.name] || ""}
                              onChange={(e) => updateInput(func.name, input.name, e.target.value)}
                              placeholder={`Enter ${input.type}`}
                              className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500 font-mono text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Execute Button */}
                    <button
                      onClick={() => executeFunction(func)}
                      disabled={isLoading || !isWalletConnected}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Write
                        </>
                      )}
                    </button>

                    {/* Result */}
                    {result && (
                      <div className={`p-3 rounded-lg ${
                        result.status === "failed" 
                          ? "bg-red-500/10 border border-red-500/30" 
                          : result.status === "success"
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-yellow-500/10 border border-yellow-500/30"
                      }`}>
                        {result.error ? (
                          <div className="flex items-start gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4 mt-0.5" />
                            <span className="text-sm">{result.error}</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {result.status === "success" ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                              )}
                              <span className={`text-sm font-medium ${
                                result.status === "success" ? "text-green-400" : "text-yellow-400"
                              }`}>
                                {result.status === "success" ? "Transaction Successful" : "Transaction Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-foreground-secondary">Tx Hash:</span>
                              <code className="font-mono text-xs text-foreground">
                                {result.hash.slice(0, 14)}...{result.hash.slice(-10)}
                              </code>
                              <button
                                onClick={() => copyHash(result.hash)}
                                className="p-1 hover:bg-background-hover rounded transition-colors"
                              >
                                <Copy className="w-3 h-3 text-foreground-secondary" />
                              </button>
                              <a
                                href={`/tx/${result.hash}`}
                                className="p-1 hover:bg-background-hover rounded transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 text-foreground-secondary" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default WriteContract;
