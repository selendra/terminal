"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { useBlockchain } from "./BlockchainProvider";

export type WalletType = "substrate" | "evm" | "both";

interface SubstrateAccount {
  address: string;
  name?: string;
  source: string;
}

interface EVMAccount {
  address: string;
  chainId: number;
}

interface Balance {
  free: string;
  reserved?: string;
  locked?: string;
  formatted: string;
}

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;

  // Accounts
  substrateAccounts: SubstrateAccount[];
  evmAccount: EVMAccount | null;
  selectedSubstrateAccount: SubstrateAccount | null;

  // Balances
  substrateBalance: Balance | null;
  evmBalance: Balance | null;

  // Methods
  connectSubstrateWallet: () => Promise<void>;
  connectEvmWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectSubstrateAccount: (account: SubstrateAccount) => void;
  refreshBalances: () => Promise<void>;

  // Signing
  signSubstrateMessage: (message: string) => Promise<string | null>;
  signEvmMessage: (message: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { substrateSDK, evmSDK, isConnected: blockchainConnected } = useBlockchain();

  const [isConnecting, setIsConnecting] = useState(false);
  const [substrateAccounts, setSubstrateAccounts] = useState<SubstrateAccount[]>([]);
  const [evmAccount, setEvmAccount] = useState<EVMAccount | null>(null);
  const [selectedSubstrateAccount, setSelectedSubstrateAccount] =
    useState<SubstrateAccount | null>(null);
  const [substrateBalance, setSubstrateBalance] = useState<Balance | null>(null);
  const [evmBalance, setEvmBalance] = useState<Balance | null>(null);
  const [polkadotExtension, setPolkadotExtension] = useState<any>(null);

  const isConnected = substrateAccounts.length > 0 || evmAccount !== null;

  // Connect to Polkadot.js extension
  const connectSubstrateWallet = useCallback(async () => {
    if (typeof window === "undefined") return;

    setIsConnecting(true);
    try {
      // Dynamically import Polkadot extension
      const { web3Enable, web3Accounts } = await import(
        "@polkadot/extension-dapp"
      );

      // Enable the extension
      const extensions = await web3Enable("Selendra Terminal");

      if (extensions.length === 0) {
        toast.error("Please install a Polkadot wallet extension");
        return;
      }

      setPolkadotExtension(extensions[0]);

      // Get all accounts
      const accounts = await web3Accounts();

      if (accounts.length === 0) {
        toast.error("No accounts found. Please create an account in your wallet.");
        return;
      }

      const formattedAccounts: SubstrateAccount[] = accounts.map((acc) => ({
        address: acc.address,
        name: acc.meta.name || "Unnamed Account",
        source: acc.meta.source,
      }));

      setSubstrateAccounts(formattedAccounts);
      setSelectedSubstrateAccount(formattedAccounts[0]);

      toast.success(`Connected ${formattedAccounts.length} Substrate account(s)`);
    } catch {
      toast.error("Failed to connect Substrate wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect to MetaMask or other EVM wallet
  const connectEvmWallet = useCallback(async () => {
    if (typeof window === "undefined" || !("ethereum" in window)) {
      toast.error("Please install MetaMask or another EVM wallet");
      return;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);

      // Request accounts
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        toast.error("No accounts found");
        return;
      }

      const network = await provider.getNetwork();

      setEvmAccount({
        address: accounts[0],
        chainId: Number(network.chainId),
      });

      toast.success("EVM wallet connected");

      // Listen for account changes
      ethereum.on("accountsChanged", (newAccounts: string[]) => {
        if (newAccounts.length === 0) {
          setEvmAccount(null);
          toast("EVM wallet disconnected");
        } else {
          setEvmAccount((prev) =>
            prev ? { ...prev, address: newAccounts[0] } : null
          );
        }
      });

      // Listen for chain changes
      ethereum.on("chainChanged", (chainId: string) => {
        setEvmAccount((prev) =>
          prev ? { ...prev, chainId: parseInt(chainId, 16) } : null
        );
      });
    } catch {
      toast.error("Failed to connect EVM wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setSubstrateAccounts([]);
    setSelectedSubstrateAccount(null);
    setEvmAccount(null);
    setSubstrateBalance(null);
    setEvmBalance(null);
    setPolkadotExtension(null);
    toast("Wallet disconnected");
  }, []);

  // Select a substrate account
  const selectSubstrateAccount = useCallback((account: SubstrateAccount) => {
    setSelectedSubstrateAccount(account);
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    try {
      // Refresh Substrate balance
      if (selectedSubstrateAccount && substrateSDK && blockchainConnected) {
        const balance = await substrateSDK.getBalance(
          selectedSubstrateAccount.address
        );
        const formatted = await substrateSDK.getFormattedBalance(
          selectedSubstrateAccount.address
        );

        setSubstrateBalance({
          free: balance.toString(),
          formatted: formatted.toFixed(4),
        });
      }

      // Refresh EVM balance
      if (evmAccount && evmSDK && blockchainConnected) {
        const balance = await evmSDK.getBalance(evmAccount.address);
        const formatted = await evmSDK.getFormattedBalance(evmAccount.address);

        setEvmBalance({
          free: balance.toString(),
          formatted: formatted.toFixed(4),
        });
      }
    } catch {
      // Balance refresh failed silently
    }
  }, [
    selectedSubstrateAccount,
    evmAccount,
    substrateSDK,
    evmSDK,
    blockchainConnected,
  ]);

  // Sign a message with Substrate wallet
  const signSubstrateMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!polkadotExtension || !selectedSubstrateAccount) {
        toast.error("No Substrate wallet connected");
        return null;
      }

      try {
        const { web3FromSource } = await import("@polkadot/extension-dapp");
        const injector = await web3FromSource(selectedSubstrateAccount.source);

        if (!injector.signer.signRaw) {
          toast.error("Wallet does not support message signing");
          return null;
        }

        const { signature } = await injector.signer.signRaw({
          address: selectedSubstrateAccount.address,
          data: message,
          type: "bytes",
        });

        return signature;
      } catch {
        toast.error("Failed to sign message");
        return null;
      }
    },
    [polkadotExtension, selectedSubstrateAccount]
  );

  // Sign a message with EVM wallet
  const signEvmMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!evmAccount || typeof window === "undefined") {
        toast.error("No EVM wallet connected");
        return null;
      }

      try {
        const ethereum = (window as any).ethereum;
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();

        const signature = await signer.signMessage(message);
        return signature;
      } catch {
        toast.error("Failed to sign message");
        return null;
      }
    },
    [evmAccount]
  );

  // Auto-refresh balances when account changes
  useEffect(() => {
    if (blockchainConnected && (selectedSubstrateAccount || evmAccount)) {
      refreshBalances();
    }
  }, [
    selectedSubstrateAccount,
    evmAccount,
    blockchainConnected,
    refreshBalances,
  ]);

  // Periodic balance refresh
  useEffect(() => {
    if (!blockchainConnected || !isConnected) return;

    const interval = setInterval(refreshBalances, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [blockchainConnected, isConnected, refreshBalances]);

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    substrateAccounts,
    evmAccount,
    selectedSubstrateAccount,
    substrateBalance,
    evmBalance,
    connectSubstrateWallet,
    connectEvmWallet,
    disconnectWallet,
    selectSubstrateAccount,
    refreshBalances,
    signSubstrateMessage,
    signEvmMessage,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
