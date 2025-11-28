import React, { useState } from "react";
import { Upload, CheckCircle, AlertCircle, FileCode, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ContractVerificationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContractVerification: React.FC<ContractVerificationProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [contractAddress, setContractAddress] = useState("");
    const [compilerVersion, setCompilerVersion] = useState("v0.8.19+commit.7dd6d404");
    const [licenseType, setLicenseType] = useState("MIT");
    const [files, setFiles] = useState<File[]>([]);

    if (!isOpen) return null;

    const handleVerify = async () => {
        setLoading(true);
        // Simulate verification delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLoading(false);
        setStep(3);
        toast.success("Contract verified successfully!");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(droppedFiles);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Upload className="w-5 h-5 text-selendra-400" />
                            Verify & Publish Contract
                        </h2>
                        <p className="text-sm text-foreground-secondary mt-1">
                            Source code verification for EVM & WASM contracts
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Steps */}
                    <div className="flex items-center justify-between mb-8 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-background-secondary -z-10" />
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s
                                        ? "bg-selendra-600 text-white"
                                        : "bg-background-secondary text-foreground-secondary"
                                    }`}
                            >
                                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    Contract Address
                                </label>
                                <input
                                    type="text"
                                    value={contractAddress}
                                    onChange={(e) => setContractAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                        Compiler Type
                                    </label>
                                    <select className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500">
                                        <option>Solidity (Single file)</option>
                                        <option>Solidity (Multi-part)</option>
                                        <option>Solidity (Standard-Json-Input)</option>
                                        <option>Vyper</option>
                                        <option>Ink! (WASM)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                        Compiler Version
                                    </label>
                                    <select
                                        value={compilerVersion}
                                        onChange={(e) => setCompilerVersion(e.target.value)}
                                        className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500"
                                    >
                                        <option>v0.8.19+commit.7dd6d404</option>
                                        <option>v0.8.18+commit.87f61d96</option>
                                        <option>v0.8.17+commit.8df45f5f</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                                    License
                                </label>
                                <select
                                    value={licenseType}
                                    onChange={(e) => setLicenseType(e.target.value)}
                                    className="w-full px-4 py-2 bg-background-secondary border border-border rounded-lg focus:outline-none focus:border-selendra-500"
                                >
                                    <option>MIT</option>
                                    <option>GNU GPLv3</option>
                                    <option>Unlicense</option>
                                    <option>None</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-selendra-500 transition-colors cursor-pointer"
                            >
                                <FileCode className="w-12 h-12 mx-auto text-foreground-secondary mb-4" />
                                <p className="text-lg font-medium">Drop your source files here</p>
                                <p className="text-sm text-foreground-secondary mt-1">
                                    or click to browse
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground-secondary">
                                        Selected Files:
                                    </p>
                                    {files.map((file, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                                        >
                                            <span className="text-sm font-mono">{file.name}</span>
                                            <button
                                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Verification Successful!</h3>
                            <p className="text-foreground-secondary mb-6">
                                The contract source code has been verified and published.
                            </p>
                            <div className="p-4 bg-background-secondary rounded-lg text-left mb-6">
                                <p className="text-sm text-foreground-secondary mb-1">Contract Name</p>
                                <p className="font-medium">MyContract</p>
                                <div className="h-px bg-border my-3" />
                                <p className="text-sm text-foreground-secondary mb-1">Compiler</p>
                                <p className="font-medium">Solidity {compilerVersion}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-end gap-3">
                    {step < 3 && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-foreground-secondary hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    {step === 1 && (
                        <button
                            onClick={() => setStep(2)}
                            disabled={!contractAddress}
                            className="px-6 py-2 bg-selendra-600 hover:bg-selendra-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                            Next
                        </button>
                    )}
                    {step === 2 && (
                        <button
                            onClick={handleVerify}
                            disabled={files.length === 0 || loading}
                            className="px-6 py-2 bg-selendra-600 hover:bg-selendra-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify & Publish
                        </button>
                    )}
                    {step === 3 && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-selendra-600 hover:bg-selendra-500 rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
