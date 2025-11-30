"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Blockscout API Transaction format
 * https://explorer.selendra.org/api/v2/transactions
 */
export interface BlockscoutTransaction {
    hash: string;
    block_number: number;
    timestamp: string;
    from: {
        hash: string;
        name?: string | null;
    };
    to: {
        hash: string;
        name?: string | null;
        is_contract?: boolean;
    } | null;
    value: string;
    gas_used: string;
    gas_price: string;
    status: "ok" | "error";
    method?: string | null;
    type: number; // 0 = legacy, 2 = EIP-1559
    transaction_types: string[]; // e.g., ["contract_call", "token_transfer"]
    fee: {
        type: string;
        value: string;
    };
    result: string;
}

interface BlockscoutResponse {
    items: BlockscoutTransaction[];
    next_page_params?: {
        block_number: number;
        index: number;
        items_count: number;
    };
}

const BLOCKSCOUT_API = "https://explorer.selendra.org/api/v2";

const fetchTransactions = async (): Promise<BlockscoutTransaction[]> => {
    const response = await fetch(`${BLOCKSCOUT_API}/transactions`);
    if (!response.ok) {
        throw new Error(`Blockscout API error: ${response.status}`);
    }
    const data: BlockscoutResponse = await response.json();
    return data.items || [];
};

export interface UseBlockscoutTransactionsOptions {
    limit?: number;
    refetchInterval?: number;
    enabled?: boolean;
}

export interface TransformedTransaction {
    hash: string;
    type: "evm";
    blockNumber: number;
    timestamp: number;
    from: string;
    to: string | null;
    value: string;
    fee: string;
    status: "success" | "failed";
    method: string | undefined;
    isContract: boolean;
    gasUsed: string;
}

/**
 * Fetch recent transactions from Blockscout API
 * This provides historical EVM transaction data
 */
export function useBlockscoutTransactions(
    options: UseBlockscoutTransactionsOptions = {}
) {
    const { limit = 50, refetchInterval = 30000, enabled = true } = options;

    const { data, error, isLoading, refetch } = useQuery<BlockscoutTransaction[]>({
        queryKey: ["blockscout-transactions"],
        queryFn: fetchTransactions,
        enabled,
        refetchInterval,
        staleTime: 10000,
    });

    // Transform to a common format
    const transactions: TransformedTransaction[] = (data || [])
        .slice(0, limit)
        .map((tx: BlockscoutTransaction) => ({
            hash: tx.hash,
            type: "evm" as const,
            blockNumber: tx.block_number,
            timestamp: new Date(tx.timestamp).getTime(),
            from: tx.from.hash,
            to: tx.to?.hash || null,
            value: tx.value,
            fee: tx.fee?.value || "0",
            status: tx.status === "ok" ? ("success" as const) : ("failed" as const),
            method: tx.to?.name || tx.method || getMethodName(tx.transaction_types),
            isContract: tx.to?.is_contract || false,
            gasUsed: tx.gas_used,
        }));

    return {
        transactions,
        rawData: data,
        isLoading,
        error: error instanceof Error ? error.message : error ? String(error) : undefined,
        refetch,
    };
}

function getMethodName(types: string[]): string | undefined {
    if (!types?.length) return undefined;

    // Map transaction types to readable names
    if (types.includes("token_transfer")) return "Token Transfer";
    if (types.includes("coin_transfer")) return "Transfer";
    if (types.includes("contract_call")) return "Contract Call";
    if (types.includes("contract_creation")) return "Contract Creation";

    return types[0]?.replace(/_/g, " ");
}
