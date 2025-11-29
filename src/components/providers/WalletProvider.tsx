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

// Selendra network configuration - unified RPC for both Substrate and EVM
export const SELENDRA_MAINNET = {
  chainId: "0x7A9", // 1961 in hex
  chainIdNumber: 1961,
  chainName: "Selendra Mainnet",
  nativeCurrency: {
    name: "Selendra",
    symbol: "SEL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.selendra.org"],
  blockExplorerUrls: ["https://scan.selendra.org"],
};

export const SELENDRA_TESTNET = {
  chainId: "0x7A1", // 1953 in hex
  chainIdNumber: 1953,
  chainName: "Selendra Testnet",
  nativeCurrency: {
    name: "Selendra",
    symbol: "SEL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-testnet.selendra.org"],
  blockExplorerUrls: ["https://testnet.scan.selendra.org"],
};

// Supported Substrate wallets
export const SUPPORTED_SUBSTRATE_WALLETS = [
  { id: "polkadot-js", name: "Polkadot.js", icon: "🔷" },
  { id: "talisman", name: "Talisman", icon: "🌙" },
  { id: "subwallet-js", name: "SubWallet", icon: "💳" },
] as const;

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

  // Network info
  isOnSelendraNetwork: boolean;

  // Methods
  connectSubstrateWallet: (walletId?: string) => Promise<void>;
  connectEvmWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectSubstrateAccount: (account: SubstrateAccount) => void;
  refreshBalances: () => Promise<void>;
  switchToSelendraNetwork: (testnet?: boolean) => Promise<boolean>;
  addSelendraNetwork: (testnet?: boolean) => Promise<boolean>;

  // Signing
  signSubstrateMessage: (message: string) => Promise<string | null>;
  signEvmMessage: (message: string) => Promise<string | null>;
  signAndSubmitExtrinsic: (extrinsic: unknown) => Promise<string>;
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

  // Check if connected to Selendra network
  const isOnSelendraNetwork = evmAccount 
    ? evmAccount.chainId === SELENDRA_MAINNET.chainIdNumber || 
      evmAccount.chainId === SELENDRA_TESTNET.chainIdNumber
    : false;

  // Add Selendra network to MetaMask
  const addSelendraNetwork = useCallback(async (testnet = false): Promise<boolean> => {
    if (typeof window === "undefined" || !("ethereum" in window)) {
      toast.error("MetaMask not detected");
      return false;
    }

    const network = testnet ? SELENDRA_TESTNET : SELENDRA_MAINNET;
    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: network.chainId,
          chainName: network.chainName,
          nativeCurrency: network.nativeCurrency,
          rpcUrls: network.rpcUrls,
          blockExplorerUrls: network.blockExplorerUrls,
        }],
      });
      toast.success(`${network.chainName} added to wallet`);
      return true;
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("User rejected network addition");
      } else {
        toast.error("Failed to add network");
      }
      return false;
    }
  }, []);

  // Switch to Selendra network
  const switchToSelendraNetwork = useCallback(async (testnet = false): Promise<boolean> => {
    if (typeof window === "undefined" || !("ethereum" in window)) {
      toast.error("MetaMask not detected");
      return false;
    }

    const network = testnet ? SELENDRA_TESTNET : SELENDRA_MAINNET;
    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      toast.success(`Switched to ${network.chainName}`);
      return true;
    } catch (error: any) {
      // Error 4902 means the chain hasn't been added yet
      if (error.code === 4902) {
        return await addSelendraNetwork(testnet);
      }
      if (error.code === 4001) {
        toast.error("User rejected network switch");
      } else {
        toast.error("Failed to switch network");
      }
      return false;
    }
  }, [addSelendraNetwork]);

  // Connect to Polkadot.js extension or specific wallet
  const connectSubstrateWallet = useCallback(async (walletId?: string) => {
    if (typeof window === "undefined") return;

    setIsConnecting(true);
    try {
      // Dynamically import Polkadot extension
      const { web3Enable, web3Accounts, web3AccountsSubscribe } = await import(
        "@polkadot/extension-dapp"
      );

      // Enable the extension
      const extensions = await web3Enable("Selendra Terminal");

      if (extensions.length === 0) {
        toast.error("Please install a Polkadot wallet extension");
        return;
      }

      // If specific wallet requested, find it
      let targetExtension = extensions[0];
      if (walletId) {
        const found = extensions.find((ext) => ext.name === walletId);
        if (!found) {
          toast.error(`${walletId} wallet not found. Please install it.`);
          return;
        }
        targetExtension = found;
      }

      setPolkadotExtension(targetExtension);

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

      // Subscribe to account changes
      web3AccountsSubscribe((newAccounts) => {
        const formatted: SubstrateAccount[] = newAccounts.map((acc) => ({
          address: acc.address,
          name: acc.meta.name || "Unnamed Account",
          source: acc.meta.source,
        }));
        setSubstrateAccounts(formatted);
        // If selected account was removed, select first available
        if (formatted.length > 0 && !formatted.find(a => a.address === selectedSubstrateAccount?.address)) {
          setSelectedSubstrateAccount(formatted[0]);
        }
      });

      toast.success(`Connected ${formattedAccounts.length} Substrate account(s)`);
    } catch {
      toast.error("Failed to connect Substrate wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [selectedSubstrateAccount]);

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
      const chainIdNumber = Number(network.chainId);

      setEvmAccount({
        address: accounts[0],
        chainId: chainIdNumber,
      });

      // Check if on Selendra network, if not offer to switch
      if (chainIdNumber !== SELENDRA_MAINNET.chainIdNumber && 
          chainIdNumber !== SELENDRA_TESTNET.chainIdNumber) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span>Not connected to Selendra network</span>
            <button 
              onClick={() => {
                switchToSelendraNetwork();
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-selendra-600 hover:bg-selendra-700 rounded text-sm"
            >
              Switch to Selendra
            </button>
          </div>
        ), { duration: 5000 });
      } else {
        toast.success("EVM wallet connected");
      }

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
        const newChainId = parseInt(chainId, 16);
        setEvmAccount((prev) =>
          prev ? { ...prev, chainId: newChainId } : null
        );

        // Notify if switched away from Selendra
        if (newChainId !== SELENDRA_MAINNET.chainIdNumber && 
            newChainId !== SELENDRA_TESTNET.chainIdNumber) {
          toast.error("Switched to non-Selendra network");
        }
      });
    } catch {
      toast.error("Failed to connect EVM wallet");
    } finally {
      setIsConnecting(false);
    }
  }, [switchToSelendraNetwork]);

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

  // Sign and submit a substrate extrinsic
  const signAndSubmitExtrinsic = useCallback(
    async (extrinsic: unknown): Promise<string> => {
      if (!polkadotExtension || !selectedSubstrateAccount) {
        throw new Error("No Substrate wallet connected");
      }

      try {
        const { web3FromSource } = await import("@polkadot/extension-dapp");
        const injector = await web3FromSource(selectedSubstrateAccount.source);

        return new Promise((resolve, reject) => {
          const tx = extrinsic as {
            signAndSend: (
              address: string,
              options: { signer: unknown },
              callback: (result: {
                status: { isInBlock: boolean; isFinalized: boolean };
                txHash: { toHex: () => string };
                dispatchError?: unknown;
              }) => void
            ) => Promise<() => void>;
          };

          tx.signAndSend(
            selectedSubstrateAccount.address,
            { signer: injector.signer },
            (result) => {
              if (result.status.isInBlock) {
                const hash = result.txHash.toHex();
                toast.success("Transaction in block");
                resolve(hash);
              } else if (result.dispatchError) {
                reject(new Error("Transaction failed"));
              }
            }
          ).catch(reject);
        });
      } catch (error) {
        toast.error("Failed to submit transaction");
        throw error;
      }
    },
    [polkadotExtension, selectedSubstrateAccount]
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
    isOnSelendraNetwork,
    connectSubstrateWallet,
    connectEvmWallet,
    disconnectWallet,
    selectSubstrateAccount,
    refreshBalances,
    switchToSelendraNetwork,
    addSelendraNetwork,
    signSubstrateMessage,
    signEvmMessage,
    signAndSubmitExtrinsic,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
