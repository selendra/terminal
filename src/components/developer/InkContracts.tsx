"use client";

import { useState, useCallback } from "react";
import {
  FileCode,
  Upload,
  Play,
  Eye,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Types
// =============================================================================

interface ContractInfo {
  address: string;
  name: string;
  abi?: ContractAbi;
  uploadedAt: number;
}

interface ContractAbi {
  constructors: ContractConstructor[];
  messages: ContractMessage[];
  events: ContractEvent[];
}

interface ContractConstructor {
  name: string;
  selector: string;
  args: ContractArg[];
  docs: string[];
  payable: boolean;
}

interface ContractMessage {
  name: string;
  selector: string;
  args: ContractArg[];
  returnType: string;
  docs: string[];
  mutates: boolean;
  payable: boolean;
}

interface ContractEvent {
  name: string;
  args: ContractArg[];
  docs: string[];
}

interface ContractArg {
  name: string;
  type: string;
}

interface QueryResult {
  id: string;
  method: string;
  args: Record<string, string>;
  result: unknown;
  timestamp: number;
  gasUsed?: string;
}

// =============================================================================
// Component
// =============================================================================

export function InkContracts() {
  const { substrateSDK, isConnected } = useBlockchain();
  const { selectedSubstrateAccount, signSubstrateMessage } = useWallet();

  // State
  const [activeTab, setActiveTab] = useState<"deploy" | "interact">("deploy");
  const [contracts, setContracts] = useState<ContractInfo[]>(getMockContracts());
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [messageArgs, setMessageArgs] = useState<Record<string, string>>({});
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Deploy state
  const [contractCode, setContractCode] = useState<File | null>(null);
  const [contractMetadata, setContractMetadata] = useState<File | null>(null);
  const [constructorArgs, setConstructorArgs] = useState<Record<string, string>>({});
  const [selectedConstructor, setSelectedConstructor] = useState<string>("");
  const [endowment, setEndowment] = useState("0");
  const [gasLimit, setGasLimit] = useState("100000000000");
  const [salt, setSalt] = useState("");

  // Get current contract
  const currentContract = contracts.find((c) => c.address === selectedContract);
  const currentMessage = currentContract?.abi?.messages.find(
    (m) => m.name === selectedMessage
  );
  const currentConstructor = currentContract?.abi?.constructors.find(
    (c) => c.name === selectedConstructor
  );

  // Handle file upload
  const handleCodeUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setContractCode(file);
  }, []);

  const handleMetadataUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContractMetadata(file);

    try {
      const text = await file.text();
      JSON.parse(text); // Validate JSON
      toast.success("Contract metadata loaded");
    } catch (error) {
      console.error("Failed to parse metadata:", error);
      toast.error("Invalid metadata file");
    }
  }, []);

  // Deploy contract
  const handleDeploy = useCallback(async () => {
    if (!contractCode || !contractMetadata) {
      toast.error("Please upload contract code and metadata");
      return;
    }

    if (!selectedSubstrateAccount) {
      toast.error("Please connect a wallet");
      return;
    }

    setIsLoading(true);
    try {
      // Mock deployment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockAddress = "5" + Array.from({ length: 47 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789"[
        Math.floor(Math.random() * 58)
        ]
      ).join("");

      const newContract: ContractInfo = {
        address: mockAddress,
        name: contractCode.name.replace(".contract", "").replace(".wasm", ""),
        abi: getMockAbi(),
        uploadedAt: Date.now(),
      };

      setContracts((prev) => [newContract, ...prev]);
      setSelectedContract(mockAddress);
      setActiveTab("interact");

      toast.success("Contract deployed successfully");
    } catch (error) {
      console.error("Deployment failed:", error);
      toast.error("Deployment failed");
    } finally {
      setIsLoading(false);
    }
  }, [contractCode, contractMetadata, selectedSubstrateAccount]);

  // Query contract (read-only)
  const handleQuery = useCallback(async () => {
    if (!currentContract || !currentMessage) return;

    setIsExecuting(true);
    const resultId = `${currentMessage.name}.${Date.now()}`;

    try {
      // Mock query
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = getMockQueryResult(currentMessage.name);

      setQueryResults((prev) => [
        {
          id: resultId,
          method: currentMessage.name,
          args: { ...messageArgs },
          result,
          timestamp: Date.now(),
          gasUsed: "1000000",
        },
        ...prev.slice(0, 19),
      ]);

      toast.success("Query executed");
    } catch (error) {
      console.error("Query failed:", error);
      toast.error("Query failed");
    } finally {
      setIsExecuting(false);
    }
  }, [currentContract, currentMessage, messageArgs]);

  // Execute contract (mutating)
  const handleExecute = useCallback(async () => {
    if (!currentContract || !currentMessage) return;

    if (!selectedSubstrateAccount) {
      toast.error("Please connect a wallet");
      return;
    }

    setIsExecuting(true);
    const resultId = `${currentMessage.name}.${Date.now()}`;

    try {
      // Mock execution
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setQueryResults((prev) => [
        {
          id: resultId,
          method: currentMessage.name,
          args: { ...messageArgs },
          result: { success: true, events: ["Transfer", "Approval"] },
          timestamp: Date.now(),
          gasUsed: "5000000",
        },
        ...prev.slice(0, 19),
      ]);

      toast.success("Transaction submitted");
    } catch (error) {
      console.error("Execution failed:", error);
      toast.error("Execution failed");
    } finally {
      setIsExecuting(false);
    }
  }, [currentContract, currentMessage, messageArgs, selectedSubstrateAccount]);

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }, []);

  // Remove contract
  const handleRemoveContract = useCallback((address: string) => {
    setContracts((prev) => prev.filter((c) => c.address !== address));
    if (selectedContract === address) {
      setSelectedContract(null);
    }
    toast.success("Contract removed");
  }, [selectedContract]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <FileCode className="h-6 w-6 text-selendra-400" />
            ink! Contracts
          </h1>
          <p className="text-foreground-secondary mt-1">
            Deploy and interact with ink! smart contracts
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["deploy", "interact"] as const).map((tab) => (
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
            {tab === "deploy" ? "Deploy Contract" : "Interact"}
          </button>
        ))}
      </div>

      {activeTab === "deploy" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Upload Form */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4">Upload Contract</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Contract Code (.wasm)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".wasm,.contract"
                    onChange={handleCodeUpload}
                    className="hidden"
                    id="code-upload"
                  />
                  <label
                    htmlFor="code-upload"
                    className={clsx(
                      "flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      contractCode
                        ? "border-accent-green bg-accent-green/5"
                        : "border-border hover:border-selendra-400"
                    )}
                  >
                    {contractCode ? (
                      <>
                        <Check className="h-5 w-5 text-accent-green" />
                        <span className="text-accent-green">{contractCode.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-foreground-secondary" />
                        <span className="text-foreground-secondary">
                          Drop or click to upload
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Metadata (.json)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleMetadataUpload}
                    className="hidden"
                    id="metadata-upload"
                  />
                  <label
                    htmlFor="metadata-upload"
                    className={clsx(
                      "flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                      contractMetadata
                        ? "border-accent-green bg-accent-green/5"
                        : "border-border hover:border-selendra-400"
                    )}
                  >
                    {contractMetadata ? (
                      <>
                        <Check className="h-5 w-5 text-accent-green" />
                        <span className="text-accent-green">{contractMetadata.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-foreground-secondary" />
                        <span className="text-foreground-secondary">
                          Drop or click to upload
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Endowment
                </label>
                <input
                  type="text"
                  value={endowment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndowment(e.target.value)}
                  placeholder="0"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Gas Limit
                </label>
                <input
                  type="text"
                  value={gasLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGasLimit(e.target.value)}
                  placeholder="100000000000"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Salt (optional)
                </label>
                <input
                  type="text"
                  value={salt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalt(e.target.value)}
                  placeholder="Random salt for address derivation"
                  className="input w-full"
                />
              </div>

              <button
                onClick={handleDeploy}
                disabled={isLoading || !contractCode || !contractMetadata}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Deploy Contract
              </button>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4">Deployment Guide</h3>
            <div className="space-y-4 text-sm text-foreground-secondary">
              <div className="p-3 bg-background-secondary rounded">
                <h4 className="font-medium text-foreground mb-2">1. Compile Contract</h4>
                <code className="text-xs font-mono bg-background p-2 rounded block">
                  cargo contract build --release
                </code>
              </div>
              <div className="p-3 bg-background-secondary rounded">
                <h4 className="font-medium text-foreground mb-2">2. Upload Files</h4>
                <p>Upload the .wasm and .json files from your target/ink folder</p>
              </div>
              <div className="p-3 bg-background-secondary rounded">
                <h4 className="font-medium text-foreground mb-2">3. Configure</h4>
                <p>Set endowment (initial balance) and gas limit for deployment</p>
              </div>
              <div className="p-3 bg-background-secondary rounded">
                <h4 className="font-medium text-foreground mb-2">4. Deploy</h4>
                <p>Sign the transaction with your wallet to deploy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "interact" && (
        <div className="grid grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="card max-h-[500px] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-4">Contracts</h3>

            {contracts.length === 0 ? (
              <div className="text-center py-8 text-foreground-secondary">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contracts deployed</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((contract) => (
                  <div
                    key={contract.address}
                    className={clsx(
                      "p-3 rounded cursor-pointer transition-colors",
                      selectedContract === contract.address
                        ? "bg-selendra-500 text-white"
                        : "bg-background-secondary hover:bg-background-tertiary"
                    )}
                    onClick={() => {
                      setSelectedContract(contract.address);
                      setSelectedMessage(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{contract.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveContract(contract.address);
                        }}
                        className="p-1 rounded hover:bg-accent-red/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs font-mono mt-1 opacity-70 truncate">
                      {contract.address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Method Selector & Args */}
          <div className="col-span-2 space-y-4">
            {currentContract ? (
              <>
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">
                      {currentContract.name}
                    </h3>
                    <button
                      onClick={() => handleCopy(currentContract.address, "addr")}
                      className="text-xs font-mono text-foreground-secondary hover:text-foreground flex items-center gap-1"
                    >
                      {currentContract.address.slice(0, 8)}...
                      {currentContract.address.slice(-6)}
                      {copied === "addr" ? (
                        <Check className="h-3 w-3 text-accent-green" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentContract.abi?.messages.map((msg) => (
                        <button
                          key={msg.name}
                          onClick={() => {
                            setSelectedMessage(msg.name);
                            setMessageArgs({});
                          }}
                          className={clsx(
                            "p-2 rounded text-left text-sm transition-colors",
                            selectedMessage === msg.name
                              ? "bg-selendra-500 text-white"
                              : "bg-background-secondary hover:bg-background-tertiary text-foreground"
                          )}
                        >
                          <span className="font-mono">{msg.name}</span>
                          {msg.mutates && (
                            <span className="ml-2 text-xs opacity-60">✏️</span>
                          )}
                          {msg.payable && (
                            <span className="ml-1 text-xs opacity-60">💰</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message Args */}
                  {currentMessage && (
                    <div className="space-y-3">
                      {currentMessage.args.map((arg) => (
                        <div key={arg.name}>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {arg.name}
                            <span className="text-xs text-foreground-secondary ml-2">
                              {arg.type}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={messageArgs[arg.name] || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setMessageArgs((prev) => ({
                                ...prev,
                                [arg.name]: e.target.value,
                              }))
                            }
                            placeholder={`Enter ${arg.name}`}
                            className="input w-full"
                          />
                        </div>
                      ))}

                      <div className="flex gap-2 pt-2">
                        {!currentMessage.mutates ? (
                          <button
                            onClick={handleQuery}
                            disabled={isExecuting}
                            className="btn-primary flex items-center gap-2"
                          >
                            {isExecuting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            Query
                          </button>
                        ) : (
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
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results */}
                {queryResults.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-foreground mb-4">Results</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {queryResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-3 bg-background-secondary rounded"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-foreground">
                              {result.method}
                            </span>
                            <div className="flex items-center gap-2">
                              {result.gasUsed && (
                                <span className="text-xs text-foreground-secondary">
                                  Gas: {result.gasUsed}
                                </span>
                              )}
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
                          <pre className="text-xs font-mono text-foreground-secondary overflow-x-auto">
                            {JSON.stringify(result.result, null, 2)}
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
                  <FileCode className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a contract to interact with</p>
                </div>
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

function getMockContracts(): ContractInfo[] {
  return [
    {
      address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      name: "PSP22Token",
      abi: getMockAbi(),
      uploadedAt: Date.now() - 86400000,
    },
  ];
}

function getMockAbi(): ContractAbi {
  return {
    constructors: [
      {
        name: "new",
        selector: "0x9bae9d5e",
        args: [
          { name: "initial_supply", type: "Balance" },
          { name: "name", type: "Option<String>" },
          { name: "symbol", type: "Option<String>" },
        ],
        docs: ["Create a new PSP22 token"],
        payable: false,
      },
    ],
    messages: [
      {
        name: "total_supply",
        selector: "0x162df8c2",
        args: [],
        returnType: "Balance",
        docs: ["Returns total token supply"],
        mutates: false,
        payable: false,
      },
      {
        name: "balance_of",
        selector: "0x6568382f",
        args: [{ name: "owner", type: "AccountId" }],
        returnType: "Balance",
        docs: ["Returns balance of account"],
        mutates: false,
        payable: false,
      },
      {
        name: "transfer",
        selector: "0xdb20f9f5",
        args: [
          { name: "to", type: "AccountId" },
          { name: "value", type: "Balance" },
        ],
        returnType: "Result<(), PSP22Error>",
        docs: ["Transfer tokens"],
        mutates: true,
        payable: false,
      },
      {
        name: "approve",
        selector: "0xb20f1bbd",
        args: [
          { name: "spender", type: "AccountId" },
          { name: "value", type: "Balance" },
        ],
        returnType: "Result<(), PSP22Error>",
        docs: ["Approve spender"],
        mutates: true,
        payable: false,
      },
    ],
    events: [
      {
        name: "Transfer",
        args: [
          { name: "from", type: "Option<AccountId>" },
          { name: "to", type: "Option<AccountId>" },
          { name: "value", type: "Balance" },
        ],
        docs: ["Emitted on token transfer"],
      },
    ],
  };
}

function getMockQueryResult(method: string): unknown {
  const results: Record<string, unknown> = {
    total_supply: "1000000000000000000000000",
    balance_of: "50000000000000000000",
  };
  return results[method] || { ok: true };
}

export default InkContracts;
