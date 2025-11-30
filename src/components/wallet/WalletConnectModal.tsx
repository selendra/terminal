"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    X,
    ChevronLeft,
    ExternalLink,
    Loader2,
    AlertCircle,
    Check,
    Download,
    Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useWallet, SUPPORTED_SUBSTRATE_WALLETS } from "@/components/providers/WalletProvider";

// Web3 Icons - Using official wallet icons from @web3icons/react
import {
    WalletMetamask,
    WalletCoinbase,
    WalletRabby,
    WalletOkx,
    WalletTrust,
    WalletEnkrypt,
} from "@web3icons/react";

// Wallet icon component using web3icons with styled fallbacks for Substrate wallets
function WalletIconComponent({ walletId, size = 48 }: { walletId: string; size?: number }) {
    const iconProps = { size, variant: "branded" as const };

    switch (walletId) {
        // EVM Wallets with official icons
        case "metamask":
            return <WalletMetamask {...iconProps} />;
        case "coinbase":
            return <WalletCoinbase {...iconProps} />;
        case "rabby":
            return <WalletRabby {...iconProps} />;
        case "okx":
            return <WalletOkx {...iconProps} />;
        case "trust":
            return <WalletTrust {...iconProps} />;
        case "enkrypt":
            return <WalletEnkrypt {...iconProps} />;

        // Substrate Wallets with styled fallbacks (using their brand colors)
        case "polkadot-js":
            return (
                <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                        width: size,
                        height: size,
                        background: "linear-gradient(135deg, #e6007a 0%, #e6007a 100%)"
                    }}
                >
                    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="white">
                        <circle cx="12" cy="4" r="3" />
                        <circle cx="4" cy="12" r="3" />
                        <circle cx="20" cy="12" r="3" />
                        <circle cx="12" cy="20" r="3" />
                        <circle cx="12" cy="12" r="2" />
                    </svg>
                </div>
            );
        case "subwallet-js":
            return (
                <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                        width: size,
                        height: size,
                        background: "linear-gradient(135deg, #004BFF 0%, #00FFE1 100%)"
                    }}
                >
                    <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>SW</span>
                </div>
            );
        case "talisman":
            return (
                <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                        width: size,
                        height: size,
                        background: "linear-gradient(135deg, #d5ff5c 0%, #fd4848 100%)"
                    }}
                >
                    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="black">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z" />
                    </svg>
                </div>
            );
        case "nova-wallet":
            return (
                <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                        width: size,
                        height: size,
                        background: "linear-gradient(135deg, #1A0533 0%, #6d17a9 50%, #ff3d71 100%)"
                    }}
                >
                    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
                        <polygon points="12,2 15,9 22,9 16,14 18,22 12,17 6,22 8,14 2,9 9,9" />
                    </svg>
                </div>
            );
        default:
            return (
                <div
                    className="flex items-center justify-center rounded-lg bg-gray-600"
                    style={{ width: size, height: size }}
                >
                    <Wallet className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
                </div>
            );
    }
}

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type WalletCategory = "all" | "evm" | "substrate";
type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

// Wallet configuration
interface WalletConfig {
    id: string;
    name: string;
    description: string;
    type: "evm" | "substrate" | "both";
    downloadUrl: string;
    deepLink?: string;
    isInjected?: () => boolean;
    connect?: () => Promise<void>;
}

// EVM Wallets
const EVM_WALLETS: WalletConfig[] = [
    {
        id: "metamask",
        name: "MetaMask",
        description: "Popular browser extension wallet",
        type: "evm",
        downloadUrl: "https://metamask.io/download/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).ethereum?.isMetaMask,
    },
    {
        id: "coinbase",
        name: "Coinbase Wallet",
        description: "Coinbase's self-custody wallet",
        type: "evm",
        downloadUrl: "https://www.coinbase.com/wallet",
        isInjected: () => typeof window !== "undefined" && !!(window as any).ethereum?.isCoinbaseWallet,
    },
    {
        id: "rabby",
        name: "Rabby Wallet",
        description: "Modern browser extension wallet",
        type: "evm",
        downloadUrl: "https://rabby.io/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).ethereum?.isRabby,
    },
    {
        id: "okx",
        name: "OKX Wallet",
        description: "Multi-chain exchange wallet",
        type: "evm",
        downloadUrl: "https://www.okx.com/web3",
        isInjected: () => typeof window !== "undefined" && !!(window as any).okxwallet,
    },
    {
        id: "trust",
        name: "Trust Wallet",
        description: "Mobile-first multi-chain wallet",
        type: "evm",
        downloadUrl: "https://trustwallet.com/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).ethereum?.isTrust,
    },
];

// Substrate Wallets
const SUBSTRATE_WALLETS: WalletConfig[] = [
    {
        id: "polkadot-js",
        name: "Polkadot.js",
        description: "Official Polkadot browser extension",
        type: "substrate",
        downloadUrl: "https://polkadot.js.org/extension/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).injectedWeb3?.["polkadot-js"],
    },
    {
        id: "subwallet-js",
        name: "SubWallet",
        description: "Multi-chain Substrate & EVM wallet",
        type: "both",
        downloadUrl: "https://subwallet.app/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).injectedWeb3?.["subwallet-js"],
    },
    {
        id: "talisman",
        name: "Talisman",
        description: "Multi-chain Polkadot ecosystem wallet",
        type: "both",
        downloadUrl: "https://talisman.xyz/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).injectedWeb3?.talisman,
    },
    {
        id: "enkrypt",
        name: "Enkrypt",
        description: "Multi-chain wallet by MEW",
        type: "both",
        downloadUrl: "https://www.enkrypt.com/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).enkrypt,
    },
    {
        id: "nova-wallet",
        name: "Nova Wallet",
        description: "Mobile Polkadot wallet with staking",
        type: "substrate",
        downloadUrl: "https://novawallet.io/",
        isInjected: () => typeof window !== "undefined" && !!(window as any).injectedWeb3?.["nova-wallet"],
    },
];

// Combined list for multi-chain wallets
const ALL_WALLETS = [...EVM_WALLETS, ...SUBSTRATE_WALLETS];

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
    const {
        connectSubstrateWallet,
        connectEvmWallet,
        isConnecting,
        isConnected,
        substrateAccounts,
        evmAccount,
    } = useWallet();

    const [category, setCategory] = useState<WalletCategory>("all");
    const [selectedWallet, setSelectedWallet] = useState<WalletConfig | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [detectedWallets, setDetectedWallets] = useState<Set<string>>(new Set());

    // Detect installed wallets
    useEffect(() => {
        if (typeof window === "undefined") return;

        const detected = new Set<string>();

        // Check EVM wallets
        EVM_WALLETS.forEach((wallet) => {
            if (wallet.isInjected?.()) {
                detected.add(wallet.id);
            }
        });

        // Check Substrate wallets
        SUBSTRATE_WALLETS.forEach((wallet) => {
            if (wallet.isInjected?.()) {
                detected.add(wallet.id);
            }
        });

        // Generic ethereum check
        if ((window as any).ethereum) {
            detected.add("metamask"); // Default to metamask if ethereum is present
        }

        setDetectedWallets(detected);
    }, [isOpen]);

    // Filter wallets by category
    const filteredWallets = ALL_WALLETS.filter((wallet) => {
        if (category === "all") return true;
        if (category === "evm") return wallet.type === "evm" || wallet.type === "both";
        if (category === "substrate") return wallet.type === "substrate" || wallet.type === "both";
        return true;
    });

    // Sort: installed wallets first
    const sortedWallets = [...filteredWallets].sort((a, b) => {
        const aInstalled = detectedWallets.has(a.id) ? 1 : 0;
        const bInstalled = detectedWallets.has(b.id) ? 1 : 0;
        return bInstalled - aInstalled;
    });

    const handleWalletConnect = useCallback(async (wallet: WalletConfig) => {
        setSelectedWallet(wallet);
        setConnectionStatus("connecting");
        setConnectionError(null);

        try {
            if (wallet.type === "evm" || (wallet.type === "both" && category === "evm")) {
                // Check if wallet is installed
                if (!detectedWallets.has(wallet.id) && !detectedWallets.has("metamask")) {
                    setConnectionStatus("error");
                    setConnectionError(`${wallet.name} is not installed. Please install it first.`);
                    return;
                }

                // Connect EVM wallet
                await connectEvmWallet();
                setConnectionStatus("connected");
                toast.success(`Connected to ${wallet.name}`);

                // Close modal after short delay
                setTimeout(() => {
                    onClose();
                    resetState();
                }, 1000);
            } else {
                // Connect Substrate wallet
                const walletId = wallet.id;

                // Check if wallet is installed
                if (!detectedWallets.has(walletId)) {
                    setConnectionStatus("error");
                    setConnectionError(`${wallet.name} is not installed. Please install it first.`);
                    return;
                }

                await connectSubstrateWallet(walletId);
                setConnectionStatus("connected");
                toast.success(`Connected to ${wallet.name}`);

                // Close modal after short delay
                setTimeout(() => {
                    onClose();
                    resetState();
                }, 1000);
            }
        } catch (error: any) {
            setConnectionStatus("error");
            setConnectionError(error.message || "Failed to connect wallet");
        }
    }, [category, detectedWallets, connectEvmWallet, connectSubstrateWallet, onClose]);

    const resetState = () => {
        setSelectedWallet(null);
        setConnectionStatus("idle");
        setConnectionError(null);
    };

    const handleBack = () => {
        resetState();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                    onClose();
                    resetState();
                }}
            />

            {/* Modal */}
            <div className="relative bg-background-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        {selectedWallet ? (
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-background-hover rounded-lg transition-colors -ml-2"
                            >
                                <ChevronLeft className="w-5 h-5 text-foreground-secondary" />
                            </button>
                        ) : (
                            <div className="p-2 bg-selendra-500/10 rounded-lg">
                                <Wallet className="w-5 h-5 text-selendra-400" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                {selectedWallet ? selectedWallet.name : "Connect Wallet"}
                            </h2>
                            <p className="text-sm text-foreground-secondary">
                                {selectedWallet
                                    ? "Connecting to your wallet..."
                                    : "Choose a wallet to connect"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            onClose();
                            resetState();
                        }}
                        className="p-2 hover:bg-background-hover rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-foreground-secondary" />
                    </button>
                </div>

                {/* Content */}
                {selectedWallet ? (
                    // Connection state view
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                        <div className="mb-4">
                            <WalletIconComponent walletId={selectedWallet.id} size={64} />
                        </div>

                        {connectionStatus === "connecting" && (
                            <>
                                <Loader2 className="w-8 h-8 text-selendra-400 animate-spin mb-4" />
                                <h3 className="font-semibold text-foreground mb-2">
                                    Connecting to {selectedWallet.name}
                                </h3>
                                <p className="text-sm text-foreground-secondary max-w-xs">
                                    Please approve the connection request in your wallet
                                </p>
                            </>
                        )}

                        {connectionStatus === "connected" && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <Check className="w-6 h-6 text-green-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">Connected!</h3>
                                <p className="text-sm text-foreground-secondary">
                                    Successfully connected to {selectedWallet.name}
                                </p>
                            </>
                        )}

                        {connectionStatus === "error" && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">
                                    Connection Failed
                                </h3>
                                <p className="text-sm text-red-400 max-w-xs mb-4">
                                    {connectionError}
                                </p>

                                {!detectedWallets.has(selectedWallet.id) && (
                                    <a
                                        href={selectedWallet.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Install {selectedWallet.name}
                                    </a>
                                )}

                                <button
                                    onClick={() => handleWalletConnect(selectedWallet)}
                                    className="mt-3 text-sm text-selendra-400 hover:underline"
                                >
                                    Try again
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    // Wallet selection view
                    <>
                        {/* Category Tabs */}
                        <div className="flex border-b border-border">
                            {[
                                { id: "all" as const, label: "All Wallets" },
                                { id: "evm" as const, label: "EVM" },
                                { id: "substrate" as const, label: "Substrate" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setCategory(tab.id)}
                                    className={clsx(
                                        "flex-1 py-3 px-4 text-sm font-medium transition-colors relative",
                                        category === tab.id
                                            ? "text-selendra-400"
                                            : "text-foreground-secondary hover:text-foreground"
                                    )}
                                >
                                    {tab.label}
                                    {category === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-selendra-500" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Wallet List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {sortedWallets.map((wallet) => {
                                const isInstalled = detectedWallets.has(wallet.id);
                                const isMultiChain = wallet.type === "both";

                                return (
                                    <button
                                        key={wallet.id}
                                        onClick={() => handleWalletConnect(wallet)}
                                        className="w-full flex items-center gap-4 p-4 bg-background-secondary hover:bg-background-hover border border-border rounded-xl transition-all hover:border-selendra-500/50"
                                    >
                                        <div className="flex-shrink-0">
                                            <WalletIconComponent walletId={wallet.id} size={40} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    {wallet.name}
                                                </span>
                                                {isInstalled && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                        Installed
                                                    </span>
                                                )}
                                                {isMultiChain && (
                                                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                                                        Multi-chain
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground-secondary mt-0.5">
                                                {wallet.description}
                                            </p>
                                        </div>
                                        {!isInstalled && (
                                            <ExternalLink className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border">
                            <p className="text-xs text-foreground-secondary text-center">
                                By connecting a wallet, you agree to our{" "}
                                <a href="/terms" className="text-selendra-400 hover:underline">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="/privacy" className="text-selendra-400 hover:underline">
                                    Privacy Policy
                                </a>
                            </p>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
        </div>
    );
}

export default WalletConnectModal;
