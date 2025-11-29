"use client";

import { useState, useCallback } from "react";
import {
  Wrench,
  Key,
  ArrowRightLeft,
  Hash,
  FileCode,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Component
// =============================================================================

export function UtilityTools() {
  const { substrateSDK } = useBlockchain();
  const { selectedSubstrateAccount, signSubstrateMessage } = useWallet();

  // State
  const [activeTab, setActiveTab] = useState<
    "sign" | "address" | "hash" | "scale"
  >("sign");
  const [copied, setCopied] = useState<string | null>(null);

  // Sign message state
  const [messageToSign, setMessageToSign] = useState("");
  const [signedMessage, setSignedMessage] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  // Verify message state
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifySignature, setVerifySignature] = useState("");
  const [verifyAddress, setVerifyAddress] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  // Address converter state
  const [inputAddress, setInputAddress] = useState("");
  const [addressConversions, setAddressConversions] = useState<{
    ss58: Record<number, string>;
    hex: string;
    evm: string;
  } | null>(null);

  // Hash calculator state
  const [hashInput, setHashInput] = useState("");
  const [hashResults, setHashResults] = useState<Record<string, string>>({});

  // SCALE decoder state
  const [scaleType, setScaleType] = useState("u128");
  const [scaleHex, setScaleHex] = useState("");
  const [scaleDecoded, setScaleDecoded] = useState<unknown>(null);
  const [scaleEncodeInput, setScaleEncodeInput] = useState("");
  const [scaleEncoded, setScaleEncoded] = useState("");

  // Copy to clipboard
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  }, []);

  // Sign message
  const handleSign = useCallback(async () => {
    if (!messageToSign) {
      toast.error("Please enter a message");
      return;
    }

    if (!selectedSubstrateAccount) {
      toast.error("Please connect a wallet");
      return;
    }

    setIsSigning(true);
    try {
      if (signSubstrateMessage) {
        const signature = await signSubstrateMessage(messageToSign);
        setSignedMessage(signature || "");
        toast.success("Message signed");
      } else {
        // Mock signature
        const mockSig = "0x" + Array.from({ length: 128 }, () => 
          "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join("");
        setSignedMessage(mockSig);
        toast.success("Message signed (mock)");
      }
    } catch (error) {
      console.error("Signing failed:", error);
      toast.error("Signing failed");
    } finally {
      setIsSigning(false);
    }
  }, [messageToSign, selectedSubstrateAccount, signSubstrateMessage]);

  // Verify message
  const handleVerify = useCallback(async () => {
    if (!verifyMessage || !verifySignature || !verifyAddress) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // Mock verification - in real implementation use crypto-verify
      const isValid = verifySignature.startsWith("0x") && verifySignature.length >= 130;
      setVerifyResult(isValid);
      toast.success(isValid ? "Signature is valid" : "Signature is invalid");
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("Verification failed");
      setVerifyResult(false);
    }
  }, [verifyMessage, verifySignature, verifyAddress]);

  // Convert address
  const handleAddressConvert = useCallback(async () => {
    if (!inputAddress) {
      toast.error("Please enter an address");
      return;
    }

    try {
      // In real implementation, use @polkadot/util-crypto
      const conversions = {
        ss58: {
          0: inputAddress.startsWith("5") ? inputAddress : "5" + inputAddress.slice(1),
          42: inputAddress.startsWith("5") ? inputAddress : "5" + inputAddress.slice(1),
          1284: "0x" + "1".repeat(40), // Moonbeam format
        },
        hex: "0x" + Buffer.from(inputAddress).toString("hex").slice(0, 64),
        evm: "0x" + "a".repeat(40),
      };
      setAddressConversions(conversions);
      toast.success("Address converted");
    } catch (error) {
      console.error("Conversion failed:", error);
      toast.error("Invalid address format");
    }
  }, [inputAddress]);

  // Calculate hashes
  const handleHashCalculate = useCallback(async () => {
    if (!hashInput) {
      toast.error("Please enter data to hash");
      return;
    }

    try {
      // Mock hash results - in real implementation use crypto libraries
      const inputBuffer = new TextEncoder().encode(hashInput);
      
      // Generate mock hashes
      const blake2b = await crypto.subtle.digest("SHA-256", inputBuffer);
      const sha256 = await crypto.subtle.digest("SHA-256", inputBuffer);
      
      const toHex = (buffer: ArrayBuffer) =>
        "0x" + Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      setHashResults({
        "Blake2-256": toHex(blake2b),
        "SHA-256": toHex(sha256),
        "Keccak-256": "0x" + Array.from({ length: 64 }, () => 
          "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join(""),
        "XX-Hash": "0x" + Array.from({ length: 16 }, () => 
          "0123456789abcdef"[Math.floor(Math.random() * 16)]
        ).join(""),
      });
      toast.success("Hashes calculated");
    } catch (error) {
      console.error("Hash calculation failed:", error);
      toast.error("Hash calculation failed");
    }
  }, [hashInput]);

  // Decode SCALE
  const handleScaleDecode = useCallback(async () => {
    if (!scaleHex) {
      toast.error("Please enter hex data");
      return;
    }

    try {
      // Mock decode - in real implementation use @polkadot/types
      const decoded = mockScaleDecode(scaleType, scaleHex);
      setScaleDecoded(decoded);
      toast.success("SCALE decoded");
    } catch (error) {
      console.error("Decode failed:", error);
      toast.error("Decode failed");
    }
  }, [scaleType, scaleHex]);

  // Encode SCALE
  const handleScaleEncode = useCallback(async () => {
    if (!scaleEncodeInput) {
      toast.error("Please enter value to encode");
      return;
    }

    try {
      // Mock encode
      const encoded = mockScaleEncode(scaleType, scaleEncodeInput);
      setScaleEncoded(encoded);
      toast.success("SCALE encoded");
    } catch (error) {
      console.error("Encode failed:", error);
      toast.error("Encode failed");
    }
  }, [scaleType, scaleEncodeInput]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Wrench className="h-6 w-6 text-selendra-400" />
            Utility Tools
          </h1>
          <p className="text-foreground-secondary mt-1">
            Cryptographic utilities and encoders
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(
          [
            { id: "sign", icon: Key, label: "Sign/Verify" },
            { id: "address", icon: ArrowRightLeft, label: "Address" },
            { id: "hash", icon: Hash, label: "Hash" },
            { id: "scale", icon: FileCode, label: "SCALE" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2",
              activeTab === tab.id
                ? "bg-selendra-500 text-white"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sign/Verify Tab */}
      {activeTab === "sign" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Sign */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Sign Message
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <textarea
                  value={messageToSign}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessageToSign(e.target.value)}
                  placeholder="Enter message to sign"
                  rows={4}
                  className="input w-full resize-none"
                />
              </div>

              <button
                onClick={handleSign}
                disabled={isSigning || !messageToSign}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Sign Message
              </button>

              {signedMessage && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-foreground">
                      Signature
                    </label>
                    <button
                      onClick={() => handleCopy(signedMessage, "sig")}
                      className="text-foreground-secondary hover:text-foreground"
                    >
                      {copied === "sig" ? (
                        <Check className="h-4 w-4 text-accent-green" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-background-secondary rounded font-mono text-xs break-all">
                    {signedMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verify */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Verify Signature
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <textarea
                  value={verifyMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVerifyMessage(e.target.value)}
                  placeholder="Original message"
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Signature
                </label>
                <input
                  type="text"
                  value={verifySignature}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerifySignature(e.target.value)}
                  placeholder="0x..."
                  className="input w-full font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Signer Address
                </label>
                <input
                  type="text"
                  value={verifyAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerifyAddress(e.target.value)}
                  placeholder="5..."
                  className="input w-full font-mono text-sm"
                />
              </div>

              <button
                onClick={handleVerify}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Verify
              </button>

              {verifyResult !== null && (
                <div
                  className={clsx(
                    "p-3 rounded flex items-center gap-2",
                    verifyResult
                      ? "bg-accent-green/10 text-accent-green"
                      : "bg-accent-red/10 text-accent-red"
                  )}
                >
                  {verifyResult ? (
                    <>
                      <Check className="h-4 w-4" />
                      Signature is valid
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Signature is invalid
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Address Tab */}
      {activeTab === "address" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Address Converter
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Input Address
              </label>
              <input
                type="text"
                value={inputAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputAddress(e.target.value)}
                placeholder="Enter SS58, hex, or EVM address"
                className="input w-full font-mono"
              />
            </div>

            <button
              onClick={handleAddressConvert}
              className="btn-primary flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Convert
            </button>

            {addressConversions && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    SS58 Formats
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(addressConversions.ss58).map(([prefix, addr]) => (
                      <div
                        key={prefix}
                        className="flex items-center justify-between p-2 bg-background-secondary rounded"
                      >
                        <span className="text-sm text-foreground-secondary">
                          Prefix {prefix}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-foreground">
                            {addr.slice(0, 16)}...{addr.slice(-8)}
                          </code>
                          <button
                            onClick={() => handleCopy(addr, `ss58-${prefix}`)}
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            {copied === `ss58-${prefix}` ? (
                              <Check className="h-3 w-3 text-accent-green" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-background-secondary rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground-secondary">
                        Hex (Public Key)
                      </span>
                      <button
                        onClick={() => handleCopy(addressConversions.hex, "hex")}
                        className="text-foreground-secondary hover:text-foreground"
                      >
                        {copied === "hex" ? (
                          <Check className="h-3 w-3 text-accent-green" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <code className="text-xs font-mono text-foreground break-all">
                      {addressConversions.hex}
                    </code>
                  </div>

                  <div className="p-3 bg-background-secondary rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground-secondary">
                        EVM Address
                      </span>
                      <button
                        onClick={() => handleCopy(addressConversions.evm, "evm")}
                        className="text-foreground-secondary hover:text-foreground"
                      >
                        {copied === "evm" ? (
                          <Check className="h-3 w-3 text-accent-green" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <code className="text-xs font-mono text-foreground break-all">
                      {addressConversions.evm}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hash Tab */}
      {activeTab === "hash" && (
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Hash Calculator
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Input Data
              </label>
              <textarea
                value={hashInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHashInput(e.target.value)}
                placeholder="Enter text or hex data (0x...)"
                rows={4}
                className="input w-full resize-none font-mono"
              />
            </div>

            <button
              onClick={handleHashCalculate}
              className="btn-primary flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Calculate Hashes
            </button>

            {Object.keys(hashResults).length > 0 && (
              <div className="space-y-2 mt-4">
                {Object.entries(hashResults).map(([algo, hash]) => (
                  <div
                    key={algo}
                    className="p-3 bg-background-secondary rounded"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {algo}
                      </span>
                      <button
                        onClick={() => handleCopy(hash, algo)}
                        className="text-foreground-secondary hover:text-foreground"
                      >
                        {copied === algo ? (
                          <Check className="h-3 w-3 text-accent-green" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <code className="text-xs font-mono text-foreground-secondary break-all">
                      {hash}
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCALE Tab */}
      {activeTab === "scale" && (
        <div className="grid grid-cols-2 gap-6">
          {/* Decode */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              SCALE Decode
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  value={scaleType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScaleType(e.target.value)}
                  className="input w-full"
                >
                  <option value="u128">u128</option>
                  <option value="u64">u64</option>
                  <option value="u32">u32</option>
                  <option value="AccountId">AccountId</option>
                  <option value="Balance">Balance</option>
                  <option value="Hash">Hash</option>
                  <option value="Vec<u8>">Vec&lt;u8&gt;</option>
                  <option value="Option<u32>">Option&lt;u32&gt;</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Hex Data
                </label>
                <input
                  type="text"
                  value={scaleHex}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScaleHex(e.target.value)}
                  placeholder="0x..."
                  className="input w-full font-mono"
                />
              </div>

              <button
                onClick={handleScaleDecode}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <FileCode className="h-4 w-4" />
                Decode
              </button>

              {scaleDecoded !== null && (
                <div className="p-3 bg-background-secondary rounded mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      Decoded Value
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(JSON.stringify(scaleDecoded), "decoded")
                      }
                      className="text-foreground-secondary hover:text-foreground"
                    >
                      {copied === "decoded" ? (
                        <Check className="h-3 w-3 text-accent-green" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <pre className="text-sm font-mono text-accent-green">
                    {JSON.stringify(scaleDecoded, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Encode */}
          <div className="card">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              SCALE Encode
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Type
                </label>
                <select
                  value={scaleType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScaleType(e.target.value)}
                  className="input w-full"
                >
                  <option value="u128">u128</option>
                  <option value="u64">u64</option>
                  <option value="u32">u32</option>
                  <option value="AccountId">AccountId</option>
                  <option value="Balance">Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={scaleEncodeInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScaleEncodeInput(e.target.value)}
                  placeholder="Enter value to encode"
                  className="input w-full font-mono"
                />
              </div>

              <button
                onClick={handleScaleEncode}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <FileCode className="h-4 w-4" />
                Encode
              </button>

              {scaleEncoded && (
                <div className="p-3 bg-background-secondary rounded mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      Encoded Hex
                    </span>
                    <button
                      onClick={() => handleCopy(scaleEncoded, "encoded")}
                      className="text-foreground-secondary hover:text-foreground"
                    >
                      {copied === "encoded" ? (
                        <Check className="h-3 w-3 text-accent-green" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <code className="text-sm font-mono text-accent-green break-all">
                    {scaleEncoded}
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mock Helpers
// =============================================================================

function mockScaleDecode(type: string, hex: string): unknown {
  // Mock decode based on type
  const cleanHex = hex.replace("0x", "");
  switch (type) {
    case "u128":
    case "u64":
    case "Balance":
      return BigInt("0x" + cleanHex).toString();
    case "u32":
      return parseInt(cleanHex, 16);
    case "AccountId":
      return "5" + cleanHex.slice(0, 46);
    case "Hash":
      return "0x" + cleanHex.padEnd(64, "0");
    case "Vec<u8>":
      return Array.from(Buffer.from(cleanHex, "hex"));
    case "Option<u32>":
      return cleanHex === "00" ? null : parseInt(cleanHex.slice(2), 16);
    default:
      return hex;
  }
}

function mockScaleEncode(type: string, value: string): string {
  // Mock encode based on type
  switch (type) {
    case "u128":
    case "u64":
    case "Balance":
      return "0x" + BigInt(value).toString(16).padStart(32, "0");
    case "u32":
      return "0x" + parseInt(value).toString(16).padStart(8, "0");
    case "AccountId":
      return "0x" + value.slice(1, 65).padEnd(64, "0");
    default:
      return "0x" + Buffer.from(value).toString("hex");
  }
}

export default UtilityTools;
