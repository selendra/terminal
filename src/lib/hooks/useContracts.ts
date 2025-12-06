import { useState, useEffect, useCallback } from "react";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { Contract, ContractType, VMType } from "@/types/contracts";
import { ethers } from "ethers";

// Known contracts configuration
const KNOWN_CONTRACTS = [
  {
    address: "0x55d398326f99059ff775485246999027b3197955",
    name: "Selendra USDT",
    compiler: "Solidity",
    version: "0.8.19",
    verified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Mock date
    creator: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    type: "erc20" as ContractType,
    vmType: "evm" as VMType,
  },
  // Add more known contracts here
];

export function useContracts() {
  const { evmSDK, isConnected } = useBlockchain();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    if (!isConnected || !evmSDK) {
      // Return basic structure with mock data for now if not connected
      const initialContracts = KNOWN_CONTRACTS.map(c => ({
        ...c,
        txCount: 0,
        balance: "0 SEL",
      }));
      setContracts(initialContracts);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const provider = evmSDK.getEvmProvider();

      if (provider) {
        const updatedContracts = await Promise.all(KNOWN_CONTRACTS.map(async (c) => {
          let balance = "0 SEL";
          let txCount = 0;

          try {
            // Fetch real balance
            const balanceWei = await provider.getBalance(c.address);
            const balanceEth = ethers.formatEther(balanceWei);
            balance = `${parseFloat(balanceEth).toFixed(4)} SEL`;

            // Fetch transaction count (nonce)
            txCount = await provider.getTransactionCount(c.address);
          } catch (e) {
            console.warn(`Failed to fetch data for contract ${c.address}`, e);
          }

          return {
            ...c,
            balance,
            txCount,
          };
        }));
        setContracts(updatedContracts);
      } else {
        setContracts(KNOWN_CONTRACTS.map(c => ({ ...c, txCount: 0, balance: "0 SEL" })));
      }
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
      setError("Failed to fetch contract data");
    } finally {
      setIsLoading(false);
    }
  }, [evmSDK, isConnected]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return { contracts, isLoading, error, refetch: fetchContracts };
}
