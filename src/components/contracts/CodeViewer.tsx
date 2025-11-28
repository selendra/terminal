"use client";

import React, { useState } from "react";
import {
  Code,
  Copy,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  FileCode,
  Settings,
  FileText,
  Hash,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface CodeViewerProps {
  sourceCode: string;
  compiler: string;
  version: string;
  optimizationEnabled?: boolean;
  runs?: number;
  evmVersion?: string;
  license?: string;
  abi?: any[];
  bytecode?: string;
  constructorArgs?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  sourceCode,
  compiler,
  version,
  optimizationEnabled,
  runs,
  evmVersion,
  license,
  abi,
  bytecode,
  constructorArgs,
}) => {
  const [activeSection, setActiveSection] = useState<"source" | "abi" | "bytecode">("source");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const downloadSource = () => {
    const blob = new Blob([sourceCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.sol";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Source code downloaded!");
  };

  // Simple syntax highlighting for Solidity
  const highlightSolidity = (code: string) => {
    const lines = code.split("\n");
    return lines.map((line, i) => {
      let highlighted = line
        // Comments
        .replace(/(\/\/.*)$/gm, '<span class="text-foreground-secondary italic">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/gm, '<span class="text-foreground-secondary italic">$1</span>')
        // Strings
        .replace(/(".*?"|'.*?')/g, '<span class="text-green-400">$1</span>')
        // Keywords
        .replace(/\b(pragma|solidity|contract|interface|library|abstract|is|import|from|function|modifier|event|struct|enum|mapping|returns|return|if|else|for|while|do|break|continue|throw|emit|try|catch|revert|require|assert)\b/g, '<span class="text-purple-400">$1</span>')
        // Types
        .replace(/\b(address|string|bytes|bytes\d+|uint\d*|int\d*|bool|public|private|internal|external|view|pure|payable|memory|storage|calldata|indexed|constant|immutable|virtual|override|constructor)\b/g, '<span class="text-blue-400">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-yellow-400">$1</span>')
        // Function names after 'function' keyword
        .replace(/(function\s+)(\w+)/g, '$1<span class="text-cyan-400">$2</span>');

      return (
        <div key={i} className="flex">
          <span className="w-12 text-right pr-4 text-foreground-secondary/50 select-none">{i + 1}</span>
          <span dangerouslySetInnerHTML={{ __html: highlighted }} className="flex-1" />
        </div>
      );
    });
  };

  return (
    <div className="divide-y divide-border">
      {/* Compiler Info */}
      <div className="p-4 bg-background-secondary/50">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-foreground-secondary" />
            <span className="text-foreground-secondary">Compiler:</span>
            <span className="font-medium">{compiler} v{version}</span>
          </div>
          {optimizationEnabled !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">Optimization:</span>
              <span className={`font-medium ${optimizationEnabled ? "text-green-400" : "text-foreground-secondary"}`}>
                {optimizationEnabled ? `Yes (${runs} runs)` : "No"}
              </span>
            </div>
          )}
          {evmVersion && (
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">EVM Version:</span>
              <span className="font-medium">{evmVersion}</span>
            </div>
          )}
          {license && (
            <div className="flex items-center gap-2">
              <span className="text-foreground-secondary">License:</span>
              <span className="font-medium">{license}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-2 bg-background-secondary/30 overflow-x-auto">
        {[
          { id: "source" as const, label: "Source Code", icon: Code },
          { id: "abi" as const, label: "Contract ABI", icon: FileText },
          { id: "bytecode" as const, label: "Bytecode", icon: Hash },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeSection === section.id
                ? "bg-selendra-600 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-hover"
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Source Code Section */}
      {activeSection === "source" && (
        <div>
          <div className="flex items-center justify-between p-3 bg-background-secondary/30 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <FileCode className="w-4 h-4" />
              Contract.sol
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(sourceCode, "Source code")}
                className="p-2 hover:bg-background-hover rounded-lg transition-colors"
                title="Copy source code"
              >
                {copiedText === "Source code" ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-foreground-secondary" />
                )}
              </button>
              <button
                onClick={downloadSource}
                className="p-2 hover:bg-background-hover rounded-lg transition-colors"
                title="Download source code"
              >
                <Download className="w-4 h-4 text-foreground-secondary" />
              </button>
            </div>
          </div>
          <div className="p-4 bg-[#1a1b26] overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed text-foreground">
              {highlightSolidity(sourceCode)}
            </pre>
          </div>
        </div>
      )}

      {/* ABI Section */}
      {activeSection === "abi" && (
        <div>
          <div className="flex items-center justify-between p-3 bg-background-secondary/30 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <FileText className="w-4 h-4" />
              Contract ABI
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(abi, null, 2), "ABI")}
              className="p-2 hover:bg-background-hover rounded-lg transition-colors"
              title="Copy ABI"
            >
              {copiedText === "ABI" ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-foreground-secondary" />
              )}
            </button>
          </div>
          <div className="p-4 bg-[#1a1b26] overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed text-foreground">
              <code className="text-green-400">{JSON.stringify(abi, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Bytecode Section */}
      {activeSection === "bytecode" && (
        <div>
          <div className="flex items-center justify-between p-3 bg-background-secondary/30 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Hash className="w-4 h-4" />
              Contract Creation Code
            </div>
            <button
              onClick={() => copyToClipboard(bytecode || "", "Bytecode")}
              className="p-2 hover:bg-background-hover rounded-lg transition-colors"
              title="Copy bytecode"
            >
              {copiedText === "Bytecode" ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-foreground-secondary" />
              )}
            </button>
          </div>
          <div className="p-4 space-y-4">
            {bytecode && (
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Bytecode</p>
                <div className="p-3 bg-[#1a1b26] rounded-lg overflow-x-auto">
                  <code className="font-mono text-xs text-cyan-400 break-all">{bytecode}</code>
                </div>
              </div>
            )}
            {constructorArgs && (
              <div>
                <p className="text-sm text-foreground-secondary mb-2">Constructor Arguments (ABI-Encoded)</p>
                <div className="p-3 bg-[#1a1b26] rounded-lg overflow-x-auto">
                  <code className="font-mono text-xs text-yellow-400 break-all">{constructorArgs}</code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeViewer;
