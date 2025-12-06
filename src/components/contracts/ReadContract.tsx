"use client";

import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { VMType } from "@/types/contracts";

interface ReadContractProps {
  address: string;
  abi: any[];
  vmType: VMType;
}

interface FunctionResult {
  value: any;
  type: string;
  error?: string;
}

export const ReadContract: React.FC<ReadContractProps> = ({
  address,
  abi,
  vmType,
}) => {
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(new Set());
  const [functionInputs, setFunctionInputs] = useState<Record<string, Record<string, string>>>({});
  const [functionResults, setFunctionResults] = useState<Record<string, FunctionResult>>({});
  const [loadingFunctions, setLoadingFunctions] = useState<Set<string>>(new Set());

  // Filter for view/pure functions only
  const readFunctions = abi.filter(
    (item) =>
      item.type === "function" &&
      (item.stateMutability === "view" || item.stateMutability === "pure")
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

  const queryFunction = async (func: any) => {
    const funcName = func.name;
    setLoadingFunctions((prev) => new Set(prev).add(funcName));

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock results based on function name
      let mockResult: FunctionResult;
      switch (funcName) {
        case "name":
          mockResult = { value: "Selendra USDT", type: "string" };
          break;
        case "symbol":
          mockResult = { value: "USDT", type: "string" };
          break;
        case "decimals":
          mockResult = { value: "18", type: "uint8" };
          break;
        case "totalSupply":
          mockResult = { value: "1000000000000000000000000000", type: "uint256" };
          break;
        case "balanceOf":
          mockResult = { value: "5000000000000000000000", type: "uint256" };
          break;
        default:
          mockResult = { value: "0", type: func.outputs?.[0]?.type || "unknown" };
      }

      setFunctionResults((prev) => ({
        ...prev,
        [funcName]: mockResult,
      }));
    } catch (error: any) {
      setFunctionResults((prev) => ({
        ...prev,
        [funcName]: { value: null, type: "error", error: error.message },
      }));
      toast.error(`Query failed: ${error.message}`);
    } finally {
      setLoadingFunctions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(funcName);
        return newSet;
      });
    }
  };

  const copyResult = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Result copied!");
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return "null";
    if (type.startsWith("uint") || type.startsWith("int")) {
      // Format large numbers
      const num = BigInt(value);
      if (num > BigInt(10 ** 15)) {
        return `${value} (${(Number(num) / 10 ** 18).toFixed(4)} with 18 decimals)`;
      }
      return value.toString();
    }
    return String(value);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-selendra-400" />
          <h3 className="text-lg font-semibold">Read Contract</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
            {readFunctions.length} functions
          </span>
        </div>
        <p className="text-sm text-foreground-secondary">
          Query contract state without making a transaction. {vmType === "evm" ? "Connect your wallet for functions that require msg.sender." : ""}
        </p>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-400">Read-Only Functions</p>
            <p className="text-foreground-secondary mt-1">
              These functions are read-only and don't modify the blockchain state.
              They can be called without gas fees.
            </p>
          </div>
        </div>
      </div>

      {/* Functions List */}
      <div className="space-y-3">
        {readFunctions.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No read functions found in this contract.</p>
          </div>
        ) : (
          readFunctions.map((func, index) => {
            const isExpanded = expandedFunctions.has(func.name);
            const isLoading = loadingFunctions.has(func.name);
            const result = functionResults[func.name];
            const hasInputs = func.inputs && func.inputs.length > 0;

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
                    <span className="w-6 h-6 bg-selendra-500/20 text-selendra-400 rounded flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-mono font-medium">{func.name}</span>
                    <span className="text-xs text-foreground-secondary">
                      ({func.inputs?.map((i: any) => `${i.type} ${i.name}`).join(", ") || ""})
                    </span>
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

                    {/* Query Button */}
                    <button
                      onClick={() => queryFunction(func)}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Querying...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Query
                        </>
                      )}
                    </button>

                    {/* Result */}
                    {result && (
                      <div className={`p-3 rounded-lg ${result.error ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                        {result.error ? (
                          <div className="flex items-start gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4 mt-0.5" />
                            <span className="text-sm">{result.error}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground-secondary">
                                Returns: <span className="text-cyan-400">{result.type}</span>
                              </span>
                              <button
                                onClick={() => copyResult(String(result.value))}
                                className="p-1 hover:bg-background-hover rounded transition-colors"
                              >
                                <Copy className="w-3 h-3 text-foreground-secondary" />
                              </button>
                            </div>
                            <p className="font-mono text-sm text-green-400 break-all">
                              {formatValue(result.value, result.type)}
                            </p>
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

export default ReadContract;
