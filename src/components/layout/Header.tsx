"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown, Wallet, RefreshCw, Copy, ExternalLink, Check, Search, X, Box } from "lucide-react";
import Link from "next/link";
import { useBlockchain, NETWORKS, NetworkType } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { SearchBar } from "@/components/common/SearchBar";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useBlockSubscription } from "@/lib/hooks/useBlockSubscription";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const {
    isConnected,
    isConnecting,
    currentNetwork,
    setNetwork,
    latestSubstrateBlock,
    refreshData,
  } = useBlockchain();

  const {
    isConnected: walletConnected,
    selectedSubstrateAccount,
    evmAccount,
    substrateBalance,
    evmBalance,
    connectSubstrateWallet,
    connectEvmWallet,
    disconnectWallet,
  } = useWallet();

  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  // Real-time block subscription
  const { latestBlock, isSubscribed } = useBlockSubscription({
    maxBlocks: 1,
    filterType: "substrate",
  });

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-background-secondary px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-hover transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile search button - only shown on small screens */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="sm:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-hover transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Search bar with autocomplete - hidden on small screens */}
        <SearchBar className="flex-1 max-w-xl hidden sm:block" />

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Refresh button */}
          <button
            onClick={refreshData}
            className="btn-ghost p-2 rounded-lg"
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Live Block Number - WebSocket subscription */}
          <Link
            href={latestBlock ? `/blocks/${latestBlock.number}` : "/blocks"}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-tertiary hover:bg-background-hover border border-border transition-colors group"
            title={latestBlock ? `View block #${latestBlock.number.toLocaleString()}` : "View blocks"}
          >
            <div className="relative">
              <Box className="h-4 w-4 text-selendra-400" />
              {isSubscribed && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-accent-green rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm font-mono text-foreground-secondary group-hover:text-foreground transition-colors">
              {latestBlock?.number?.toLocaleString() || latestSubstrateBlock?.number?.toLocaleString() || "..."}
            </span>
          </Link>

          {/* Theme toggle */}
          <ThemeToggle variant="dropdown" />

          {/* Network selector */}
          <div className="relative">
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="btn-secondary flex items-center gap-2 px-2 md:px-4"
            >
              <span className="text-sm font-medium hidden sm:inline">
                {NETWORKS[currentNetwork].name}
              </span>
              <span className="text-sm font-medium sm:hidden">
                {currentNetwork === "mainnet" ? "Main" : "Test"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showNetworkDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-background-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                {(Object.keys(NETWORKS) as NetworkType[]).map((network) => (
                  <button
                    key={network}
                    onClick={() => {
                      setNetwork(network);
                      setShowNetworkDropdown(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2 text-left text-sm hover:bg-background-hover transition-colors first:rounded-t-lg last:rounded-b-lg",
                      currentNetwork === network
                        ? "text-selendra-400 bg-selendra-500/10"
                        : "text-foreground-secondary"
                    )}
                  >
                    {NETWORKS[network].name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications - hidden on small screens */}
          <button className="hidden sm:block btn-ghost p-2 rounded-lg relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-accent-red rounded-full" />
          </button>

          {/* Wallet connection */}
          <div className="relative">
            {!walletConnected ? (
              <button
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                className="btn-primary flex items-center gap-2 px-2 md:px-4"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </button>
            ) : (
              <button
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                className="btn-secondary flex items-center gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-accent-green" />
                <span className="text-sm font-medium">
                  {selectedSubstrateAccount
                    ? truncateAddress(selectedSubstrateAccount.address)
                    : evmAccount
                      ? truncateAddress(evmAccount.address)
                      : "Connected"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
            )}

            {showWalletDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-background-card border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                {!walletConnected ? (
                  <div className="p-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                      Connect Wallet
                    </h4>
                    <button
                      onClick={() => {
                        connectSubstrateWallet();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full btn-secondary flex items-center gap-3 justify-start"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-bold">P</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Polkadot.js</div>
                        <div className="text-xs text-foreground-secondary">
                          Substrate wallet
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        connectEvmWallet();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full btn-secondary flex items-center gap-3 justify-start"
                    >
                      <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <span className="text-orange-400 font-bold">M</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">MetaMask</div>
                        <div className="text-xs text-foreground-secondary">EVM wallet</div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Substrate account */}
                    {selectedSubstrateAccount && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-foreground-secondary uppercase tracking-wider">
                            Substrate Account
                          </span>
                          <span className="badge badge-info">
                            {substrateBalance?.formatted || "0"} SEL
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-foreground-secondary">
                            {truncateAddress(selectedSubstrateAccount.address)}
                          </span>
                          <button
                            onClick={() =>
                              copyAddress(selectedSubstrateAccount.address)
                            }
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            {copied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <a
                            href={`/accounts/${selectedSubstrateAccount.address}`}
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* EVM account */}
                    {evmAccount && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-foreground-secondary uppercase tracking-wider">
                            EVM Account
                          </span>
                          <span className="badge badge-info">
                            {evmBalance?.formatted || "0"} SEL
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-foreground-secondary">
                            {truncateAddress(evmAccount.address)}
                          </span>
                          <button
                            onClick={() => copyAddress(evmAccount.address)}
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            {copied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <a
                            href={`/accounts/${evmAccount.address}`}
                            className="text-foreground-secondary hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full btn-ghost text-accent-red hover:bg-accent-red/10"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm sm:hidden animate-fade-in">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <SearchBar
                className="flex-1"
                autoFocus
                onSearch={() => setShowMobileSearch(false)}
              />
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-hover transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <div className="text-foreground-secondary text-sm">
                Search for blocks, transactions, accounts, or tokens...
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
