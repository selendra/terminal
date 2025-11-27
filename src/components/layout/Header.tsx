"use client";

import { useState } from "react";
import { Search, Bell, ChevronDown, Wallet, RefreshCw, Copy, ExternalLink, Check } from "lucide-react";
import { useBlockchain, NETWORKS, NetworkType } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { clsx } from "clsx";
import toast from "react-hot-toast";

export function Header() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Detect search type and navigate
    const query = searchQuery.trim();

    // Block number
    if (/^\d+$/.test(query)) {
      window.location.href = `/blocks/${query}`;
      return;
    }

    // Transaction hash (0x...)
    if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
      window.location.href = `/transactions/${query}`;
      return;
    }

    // EVM address
    if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
      window.location.href = `/accounts/${query}`;
      return;
    }

    // Substrate address (starts with 5)
    if (/^5[a-zA-Z0-9]{47}$/.test(query)) {
      window.location.href = `/accounts/${query}`;
      return;
    }

    toast.error("Invalid search query");
  };

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
    <header className="h-16 border-b border-border bg-background-secondary px-6 flex items-center justify-between">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by Address / Txn Hash / Block / Token"
            className="input w-full pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Network status */}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-accent-green animate-pulse" : "bg-accent-red"
            )}
          />
          <span className="text-sm text-gray-400">
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? `Block #${latestSubstrateBlock?.number?.toLocaleString() || "..."}`
              : "Disconnected"}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={refreshData}
          className="btn-ghost p-2 rounded-lg"
          title="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>

        {/* Network selector */}
        <div className="relative">
          <button
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="btn-secondary flex items-center gap-2"
          >
            <span className="text-sm font-medium">
              {NETWORKS[currentNetwork].name}
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
                      : "text-gray-300"
                  )}
                >
                  {NETWORKS[network].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="btn-ghost p-2 rounded-lg relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-accent-red rounded-full" />
        </button>

        {/* Wallet connection */}
        <div className="relative">
          {!walletConnected ? (
            <button
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className="btn-primary flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
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
                  <h4 className="text-sm font-medium text-white mb-3">
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
                      <div className="text-xs text-gray-500">
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
                      <div className="text-xs text-gray-500">EVM wallet</div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {/* Substrate account */}
                  {selectedSubstrateAccount && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          Substrate Account
                        </span>
                        <span className="badge badge-info">
                          {substrateBalance?.formatted || "0"} SEL
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-300">
                          {truncateAddress(selectedSubstrateAccount.address)}
                        </span>
                        <button
                          onClick={() =>
                            copyAddress(selectedSubstrateAccount.address)
                          }
                          className="text-gray-500 hover:text-white"
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <a
                          href={`/accounts/${selectedSubstrateAccount.address}`}
                          className="text-gray-500 hover:text-white"
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
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                          EVM Account
                        </span>
                        <span className="badge badge-info">
                          {evmBalance?.formatted || "0"} SEL
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-300">
                          {truncateAddress(evmAccount.address)}
                        </span>
                        <button
                          onClick={() => copyAddress(evmAccount.address)}
                          className="text-gray-500 hover:text-white"
                        >
                          {copied ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <a
                          href={`/accounts/${evmAccount.address}`}
                          className="text-gray-500 hover:text-white"
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
  );
}
