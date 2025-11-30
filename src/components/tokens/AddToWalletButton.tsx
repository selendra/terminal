"use client";

import React, { useState, useCallback } from "react";
import {
    Wallet,
    Check,
    Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// Web3 Icons - Using official wallet icons from @web3icons/react
import {
    WalletMetamask,
    WalletCoinbase,
    WalletTrust,
} from "@web3icons/react";

// Wallet icon component using web3icons
function WalletIconComponent({ walletId, size = 24 }: { walletId: string; size?: number }) {
    const iconProps = { size, variant: "branded" as const };

    switch (walletId) {
        case "metamask":
            return <WalletMetamask {...iconProps} />;
        case "coinbase":
            return <WalletCoinbase {...iconProps} />;
        case "trust":
            return <WalletTrust {...iconProps} />;
        default:
            return <Wallet className="text-foreground-secondary" style={{ width: size, height: size }} />;
    }
}

interface TokenInfo {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
    logoUrl?: string;
    type: "erc20" | "erc721" | "erc1155" | "native" | "psp22" | "psp34" | "psp37";
}

interface AddToWalletButtonProps {
    token: TokenInfo;
    className?: string;
    variant?: "button" | "icon";
    size?: "sm" | "md" | "lg";
}

type WalletType = "metamask" | "coinbase" | "trust" | "generic";

export function AddToWalletButton({
    token,
    className,
    variant = "button",
    size = "md",
}: AddToWalletButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [added, setAdded] = useState(false);

    // Check if wallet supports adding tokens
    const getAvailableWallets = (): WalletType[] => {
        if (typeof window === "undefined") return [];

        const wallets: WalletType[] = [];
        const ethereum = (window as any).ethereum;

        if (ethereum) {
            if (ethereum.isMetaMask) wallets.push("metamask");
            if (ethereum.isCoinbaseWallet) wallets.push("coinbase");
            if (ethereum.isTrust) wallets.push("trust");
            if (wallets.length === 0) wallets.push("generic");
        }

        return wallets;
    };

    // Add token to EVM wallet (MetaMask, etc.)
    const addToEvmWallet = useCallback(async () => {
        if (typeof window === "undefined") {
            toast.error("Window not available");
            return false;
        }

        const ethereum = (window as any).ethereum;

        if (!ethereum) {
            toast.error("No EVM wallet detected. Please install MetaMask or another wallet.");
            return false;
        }

        // Native tokens don't need to be added
        if (token.type === "native") {
            toast.error("Native tokens are automatically available in your wallet");
            return false;
        }

        // Non-EVM tokens can't be added to MetaMask
        if (token.type.startsWith("psp")) {
            toast.error("PSP tokens can only be added to Substrate wallets");
            return false;
        }

        try {
            setIsAdding(true);

            // First ensure the dApp is authorized with MetaMask
            // Request permissions if not already connected
            try {
                const accounts = await ethereum.request({ method: "eth_accounts" });
                if (!accounts || accounts.length === 0) {
                    // Need to request account access first
                    await ethereum.request({ method: "eth_requestAccounts" });
                }
            } catch (authError: any) {
                if (authError.code === 4001) {
                    toast.error("Please connect your wallet first");
                    return false;
                }
                // Continue anyway for wallet_watchAsset
            }

            // For ERC-20 tokens
            if (token.type === "erc20") {
                const wasAdded = await ethereum.request({
                    method: "wallet_watchAsset",
                    params: {
                        type: "ERC20",
                        options: {
                            address: token.address,
                            symbol: token.symbol.slice(0, 11), // Max 11 characters
                            decimals: token.decimals,
                            image: token.logoUrl || undefined,
                        },
                    },
                });

                if (wasAdded) {
                    setAdded(true);
                    toast.success(`${token.symbol} added to wallet`);
                    setTimeout(() => setAdded(false), 3000);
                    return true;
                } else {
                    toast.error("Token addition was cancelled");
                    return false;
                }
            }

            // For NFTs (ERC-721/1155) - experimental support
            if (token.type === "erc721" || token.type === "erc1155") {
                // Most wallets don't support wallet_watchAsset for NFTs yet
                // We'll try anyway and fall back to copying the address
                try {
                    const wasAdded = await ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                            type: token.type === "erc721" ? "ERC721" : "ERC1155",
                            options: {
                                address: token.address,
                            },
                        },
                    });

                    if (wasAdded) {
                        setAdded(true);
                        toast.success(`${token.name} collection added to wallet`);
                        setTimeout(() => setAdded(false), 3000);
                        return true;
                    }
                } catch {
                    // NFT tracking not supported, show helpful message
                    await navigator.clipboard.writeText(token.address);
                    toast.success("Contract address copied! Import manually in your wallet's NFT section.");
                    return true;
                }
            }

            return false;
        } catch (error: any) {
            if (error.code === 4001) {
                toast.error("User rejected the request");
            } else {
                toast.error("Failed to add token to wallet");
            }
            return false;
        } finally {
            setIsAdding(false);
        }
    }, [token]);

    // Handle button click
    const handleClick = async () => {
        const wallets = getAvailableWallets();

        if (wallets.length === 0) {
            toast.error("No compatible wallet detected. Please install MetaMask.");
            return;
        }

        // If only one wallet or generic, add directly
        await addToEvmWallet();
    };

    // Size classes
    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm gap-1.5",
        md: "px-4 py-2 text-sm gap-2",
        lg: "px-5 py-2.5 text-base gap-2",
    };

    // Don't render for native tokens
    if (token.type === "native") {
        return null;
    }

    // Icon only variant
    if (variant === "icon") {
        return (
            <button
                onClick={handleClick}
                disabled={isAdding || added}
                title="Add to Wallet"
                className={clsx(
                    "p-2 rounded-lg transition-all",
                    added
                        ? "bg-green-500/20 text-green-400"
                        : "bg-background-secondary text-foreground-secondary hover:text-foreground hover:bg-background-hover",
                    isAdding && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : added ? (
                    <Check className="w-5 h-5" />
                ) : (
                    <Wallet className="w-5 h-5" />
                )}
            </button>
        );
    }

    // Button variant
    return (
        <button
            onClick={handleClick}
            disabled={isAdding || added}
            className={clsx(
                "flex items-center rounded-lg font-medium transition-all",
                added
                    ? "bg-green-600 text-white"
                    : "bg-selendra-600 text-white hover:bg-selendra-700",
                isAdding && "opacity-75 cursor-wait",
                sizeClasses[size],
                className
            )}
        >
            {isAdding ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                </>
            ) : added ? (
                <>
                    <Check className="w-4 h-4" />
                    Added
                </>
            ) : (
                <>
                    <Wallet className="w-4 h-4" />
                    Add to Wallet
                </>
            )}
        </button>
    );
}

// Dropdown variant for multiple wallet options
interface AddToWalletDropdownProps extends AddToWalletButtonProps {
    onClose?: () => void;
}

export function AddToWalletDropdown({
    token,
    onClose,
}: AddToWalletDropdownProps) {
    const [isAdding, setIsAdding] = useState<WalletType | null>(null);

    const wallets = [
        {
            id: "metamask" as WalletType,
            name: "MetaMask",
            description: "Add to MetaMask",
        },
        {
            id: "coinbase" as WalletType,
            name: "Coinbase Wallet",
            description: "Add to Coinbase",
        },
        {
            id: "trust" as WalletType,
            name: "Trust Wallet",
            description: "Add to Trust",
        },
    ];

    const handleWalletSelect = async (walletId: WalletType) => {
        if (typeof window === "undefined" || !("ethereum" in window)) {
            toast.error("No EVM wallet detected");
            return;
        }

        setIsAdding(walletId);

        try {
            const ethereum = (window as any).ethereum;

            const wasAdded = await ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: token.address,
                        symbol: token.symbol.slice(0, 11),
                        decimals: token.decimals,
                        image: token.logoUrl || undefined,
                    },
                },
            });

            if (wasAdded) {
                toast.success(`${token.symbol} added to wallet`);
                onClose?.();
            }
        } catch (error: any) {
            if (error.code !== 4001) {
                toast.error("Failed to add token");
            }
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <div className="bg-background-card border border-border rounded-xl shadow-lg overflow-hidden w-64">
            <div className="p-3 border-b border-border">
                <h4 className="text-sm font-medium text-foreground">Add to Wallet</h4>
                <p className="text-xs text-foreground-secondary mt-0.5">
                    {token.symbol} ({token.name})
                </p>
            </div>
            <div className="p-2 space-y-1">
                {wallets.map((wallet) => (
                    <button
                        key={wallet.id}
                        onClick={() => handleWalletSelect(wallet.id)}
                        disabled={isAdding !== null}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover transition-colors disabled:opacity-50"
                    >
                        <WalletIconComponent walletId={wallet.id} size={24} />
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                        </div>
                        {isAdding === wallet.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-foreground-secondary" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default AddToWalletButton;
