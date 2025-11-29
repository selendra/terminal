/**
 * Transaction Normalizer Service
 *
 * Normalizes transactions from both Substrate and EVM into a unified format.
 * This allows the UI to display transactions from both VMs consistently.
 */

import { formatUnits } from "ethers";
import { resolveAddress, type UnifiedAddress } from "./address-resolver";

// ============================================
// TYPES
// ============================================

/**
 * Transaction type/origin
 */
export type TransactionVMType = "substrate" | "evm" | "evm_wrapped";

/**
 * Transaction status
 */
export type TransactionStatus =
  | "pending"
  | "in_block"
  | "finalized"
  | "success"
  | "failed"
  | "dropped";

/**
 * Transaction category for filtering/display
 */
export type TransactionCategory =
  | "transfer"
  | "contract_call"
  | "contract_deploy"
  | "staking"
  | "governance"
  | "identity"
  | "system"
  | "other";

/**
 * Raw Substrate extrinsic data
 */
export interface RawSubstrateExtrinsic {
  hash: string;
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  timestamp?: number;
  signer?: string;
  signature?: string;
  nonce?: number;
  era?: {
    mortalEra?: { period: number; phase: number };
    immortalEra?: boolean;
  };
  tip?: string;
  section: string;
  method: string;
  args: Record<string, unknown>;
  success: boolean;
  fee?: string;
  events?: Array<{
    section: string;
    method: string;
    data: unknown[];
  }>;
}

/**
 * Raw EVM transaction data
 */
export interface RawEvmTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  timestamp?: number;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed?: string;
  nonce: number;
  data: string;
  v?: number;
  r?: string;
  s?: string;
  status?: number; // 1 = success, 0 = failed
  contractAddress?: string | null;
  logs?: Array<{
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
  }>;
}

/**
 * Unified/normalized transaction format
 */
export interface UnifiedTransaction {
  // Identifiers
  id: string;
  hash: string;
  vmType: TransactionVMType;

  // Block info
  blockNumber: number;
  blockHash: string;
  index: number;
  timestamp: number;

  // Addresses
  from: UnifiedAddress;
  to: UnifiedAddress | null;

  // Value & Fees
  value: string; // In smallest unit (wei/planck)
  valueFormatted: string; // Human readable with decimals
  fee: string;
  feeFormatted: string;

  // Status
  status: TransactionStatus;
  success: boolean;

  // Method/Action
  category: TransactionCategory;
  method: string; // e.g., "balances.transfer" or "0xa9059cbb"
  methodName: string; // Human readable: "Transfer" or "transfer(address,uint256)"

  // Additional data
  data?: string;
  args?: Record<string, unknown>;
  events?: UnifiedEvent[];

  // Contract-specific
  isContractCreation: boolean;
  contractAddress?: string;

  // Gas (EVM specific)
  gasPrice?: string;
  gasLimit?: string;
  gasUsed?: string;

  // Substrate specific
  nonce?: number;
  tip?: string;

  // Raw data for debugging
  raw?: RawSubstrateExtrinsic | RawEvmTransaction;
}

/**
 * Unified event format
 */
export interface UnifiedEvent {
  id: string;
  transactionHash: string;
  logIndex: number;
  vmType: TransactionVMType;

  // For Substrate
  section?: string;
  method?: string;

  // For EVM
  address?: string;
  topics?: string[];

  // Common
  data: unknown;
  decoded?: {
    name: string;
    args: Record<string, unknown>;
  };
}

// ============================================
// CONSTANTS
// ============================================

const TOKEN_DECIMALS = 18;
const TOKEN_SYMBOL = "SEL";

/**
 * Known method signatures for EVM
 */
const EVM_METHOD_SIGNATURES: Record<string, string> = {
  "0xa9059cbb": "transfer(address,uint256)",
  "0x23b872dd": "transferFrom(address,address,uint256)",
  "0x095ea7b3": "approve(address,uint256)",
  "0x70a08231": "balanceOf(address)",
  "0x18160ddd": "totalSupply()",
  "0xdd62ed3e": "allowance(address,address)",
  "0x40c10f19": "mint(address,uint256)",
  "0x42966c68": "burn(uint256)",
  "0x79cc6790": "burnFrom(address,uint256)",
  // ERC-721
  "0x42842e0e": "safeTransferFrom(address,address,uint256)",
  "0xb88d4fde": "safeTransferFrom(address,address,uint256,bytes)",
  "0x6352211e": "ownerOf(uint256)",
  // Staking precompile
  "0x0962ef79": "stake()",
  "0x2e17de78": "unstake(uint256)",
  "0x3ccfd60b": "withdraw()",
  "0xc00007b0": "claimRewards(address)",
};

/**
 * Substrate pallet/method to category mapping
 */
const SUBSTRATE_CATEGORY_MAP: Record<string, TransactionCategory> = {
  "balances.transfer": "transfer",
  "balances.transferKeepAlive": "transfer",
  "balances.transferAllowDeath": "transfer",
  "balances.transferAll": "transfer",
  "staking.bond": "staking",
  "staking.bondExtra": "staking",
  "staking.unbond": "staking",
  "staking.withdrawUnbonded": "staking",
  "staking.nominate": "staking",
  "staking.chill": "staking",
  "staking.payoutStakers": "staking",
  "staking.rebond": "staking",
  "democracy.vote": "governance",
  "democracy.propose": "governance",
  "democracy.second": "governance",
  "democracy.delegate": "governance",
  "democracy.undelegate": "governance",
  "council.vote": "governance",
  "council.propose": "governance",
  "technicalCommittee.vote": "governance",
  "treasury.proposeSpend": "governance",
  "treasury.approveProposal": "governance",
  "identity.setIdentity": "identity",
  "identity.clearIdentity": "identity",
  "identity.requestJudgement": "identity",
  "identity.provideJudgement": "identity",
  "contracts.call": "contract_call",
  "contracts.instantiate": "contract_deploy",
  "contracts.instantiateWithCode": "contract_deploy",
  "ethereum.transact": "contract_call",
  "evm.call": "contract_call",
  "evm.create": "contract_deploy",
  "system.remark": "system",
  "timestamp.set": "system",
};

// ============================================
// NORMALIZER FUNCTIONS
// ============================================

/**
 * Normalize a Substrate extrinsic to unified format
 */
export async function normalizeSubstrateExtrinsic(
  extrinsic: RawSubstrateExtrinsic
): Promise<UnifiedTransaction> {
  const fullMethod = `${extrinsic.section}.${extrinsic.method}`;

  // Resolve addresses
  const from = extrinsic.signer ? await resolveAddress(extrinsic.signer) : null;

  // Create a fallback address if resolution fails
  const fromAddress: UnifiedAddress = from || {
    substrate: extrinsic.signer || "",
    evm: "",
    isVerified: false,
    source: "derived",
  };

  // Extract destination from common transfer methods
  let to: UnifiedAddress | null = null;
  if (
    extrinsic.section === "balances" &&
    [
      "transfer",
      "transferKeepAlive",
      "transferAllowDeath",
      "transferAll",
    ].includes(extrinsic.method)
  ) {
    const dest = extrinsic.args.dest as string | { Id: string } | undefined;
    const destAddress = typeof dest === "string" ? dest : dest?.Id;
    if (destAddress) {
      to = await resolveAddress(destAddress);
    }
  }

  // Determine category
  const category = SUBSTRATE_CATEGORY_MAP[fullMethod] || "other";

  // Format values
  const value = extractSubstrateValue(extrinsic);
  const fee = extrinsic.fee || "0";

  // Normalize events
  const events = extrinsic.events?.map((e, i) => ({
    id: `${extrinsic.hash}-${i}`,
    transactionHash: extrinsic.hash,
    logIndex: i,
    vmType: "substrate" as TransactionVMType,
    section: e.section,
    method: e.method,
    data: e.data,
  }));

  // Check for contract creation
  const isContractCreation =
    extrinsic.section === "contracts" &&
    ["instantiate", "instantiateWithCode"].includes(extrinsic.method);

  // Extract contract address from events if created
  let contractAddress: string | undefined;
  if (isContractCreation) {
    const instantiatedEvent = extrinsic.events?.find(
      (e) => e.section === "contracts" && e.method === "Instantiated"
    );
    if (instantiatedEvent) {
      contractAddress = instantiatedEvent.data[1] as string;
    }
  }

  return {
    id: `substrate-${extrinsic.hash}`,
    hash: extrinsic.hash,
    vmType: "substrate",

    blockNumber: extrinsic.blockNumber,
    blockHash: extrinsic.blockHash,
    index: extrinsic.extrinsicIndex,
    timestamp: extrinsic.timestamp || Date.now(),

    from: fromAddress,
    to,

    value,
    valueFormatted: formatTokenAmount(value),
    fee,
    feeFormatted: formatTokenAmount(fee),

    status: extrinsic.success ? "success" : "failed",
    success: extrinsic.success,

    category,
    method: fullMethod,
    methodName: formatMethodName(extrinsic.section, extrinsic.method),

    args: extrinsic.args,
    events,

    isContractCreation,
    contractAddress,

    nonce: extrinsic.nonce,
    tip: extrinsic.tip,

    raw: extrinsic,
  };
}

/**
 * Normalize an EVM transaction to unified format
 */
export async function normalizeEvmTransaction(
  tx: RawEvmTransaction
): Promise<UnifiedTransaction> {
  // Resolve addresses
  const resolvedFrom = await resolveAddress(tx.from);
  const to = tx.to ? await resolveAddress(tx.to) : null;

  // Create a fallback address if resolution fails
  const from: UnifiedAddress = resolvedFrom || {
    substrate: "",
    evm: tx.from,
    isVerified: false,
    source: "derived",
  };

  // Determine category and method
  const isContractCreation = !tx.to && tx.data.length > 2;
  const methodSig = tx.data.slice(0, 10);
  const methodName = EVM_METHOD_SIGNATURES[methodSig] || methodSig;

  let category: TransactionCategory = "other";
  if (isContractCreation) {
    category = "contract_deploy";
  } else if (tx.data.length > 2) {
    category = "contract_call";
  } else if (tx.value !== "0") {
    category = "transfer";
  }

  // Calculate fee
  const gasUsed = tx.gasUsed || tx.gasLimit;
  const fee = (BigInt(gasUsed) * BigInt(tx.gasPrice)).toString();

  // Normalize logs to events
  const events = tx.logs?.map((log, i) => ({
    id: `${tx.hash}-${log.logIndex}`,
    transactionHash: tx.hash,
    logIndex: log.logIndex,
    vmType: "evm" as TransactionVMType,
    address: log.address,
    topics: log.topics,
    data: log.data,
  }));

  // Get contract address if created
  const contractAddress = isContractCreation
    ? tx.contractAddress || undefined
    : undefined;

  return {
    id: `evm-${tx.hash}`,
    hash: tx.hash,
    vmType: "evm",

    blockNumber: tx.blockNumber,
    blockHash: tx.blockHash,
    index: tx.transactionIndex,
    timestamp: tx.timestamp || Date.now(),

    from,
    to,

    value: tx.value,
    valueFormatted: formatTokenAmount(tx.value),
    fee,
    feeFormatted: formatTokenAmount(fee),

    status:
      tx.status === 1 ? "success" : tx.status === 0 ? "failed" : "pending",
    success: tx.status === 1,

    category,
    method: methodSig,
    methodName,

    data: tx.data,
    events,

    isContractCreation,
    contractAddress,

    gasPrice: tx.gasPrice,
    gasLimit: tx.gasLimit,
    gasUsed: tx.gasUsed,

    nonce: tx.nonce,

    raw: tx,
  };
}

/**
 * Normalize any transaction (auto-detect type)
 */
export async function normalizeTransaction(
  tx: RawSubstrateExtrinsic | RawEvmTransaction
): Promise<UnifiedTransaction> {
  // Detect type by checking for EVM-specific fields
  if ("gasPrice" in tx && "from" in tx) {
    return normalizeEvmTransaction(tx as RawEvmTransaction);
  }
  return normalizeSubstrateExtrinsic(tx as RawSubstrateExtrinsic);
}

/**
 * Normalize multiple transactions and merge them
 */
export async function normalizeAndMergeTransactions(
  substrateTxs: RawSubstrateExtrinsic[],
  evmTxs: RawEvmTransaction[]
): Promise<UnifiedTransaction[]> {
  const [normalizedSubstrate, normalizedEvm] = await Promise.all([
    Promise.all(substrateTxs.map(normalizeSubstrateExtrinsic)),
    Promise.all(evmTxs.map(normalizeEvmTransaction)),
  ]);

  // Merge and sort by timestamp (newest first)
  const merged = [...normalizedSubstrate, ...normalizedEvm];
  merged.sort((a, b) => b.timestamp - a.timestamp);

  return merged;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract value from Substrate extrinsic args
 */
function extractSubstrateValue(extrinsic: RawSubstrateExtrinsic): string {
  // Check common value field names
  const valueFields = ["value", "amount", "balance", "keep_alive"];

  for (const field of valueFields) {
    if (field in extrinsic.args) {
      const val = extrinsic.args[field];
      if (
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "bigint"
      ) {
        return val.toString();
      }
    }
  }

  return "0";
}

/**
 * Format method name for display
 */
function formatMethodName(section: string, method: string): string {
  // Convert camelCase to Title Case with spaces
  const formatted = method.replace(/([A-Z])/g, " $1").trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number = TOKEN_DECIMALS,
  symbol: string = TOKEN_SYMBOL
): string {
  try {
    const formatted = formatUnits(amount.toString(), decimals);
    const num = parseFloat(formatted);

    if (num === 0) return `0 ${symbol}`;
    if (num < 0.0001) return `<0.0001 ${symbol}`;
    if (num < 1) return `${num.toFixed(4)} ${symbol}`;
    if (num < 1000) return `${num.toFixed(2)} ${symbol}`;
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K ${symbol}`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M ${symbol}`;
    return `${(num / 1000000000).toFixed(2)}B ${symbol}`;
  } catch {
    return `0 ${symbol}`;
  }
}

/**
 * Get category display info
 */
export function getCategoryInfo(category: TransactionCategory): {
  label: string;
  color: string;
  icon: string;
} {
  const categoryMap: Record<
    TransactionCategory,
    { label: string; color: string; icon: string }
  > = {
    transfer: { label: "Transfer", color: "blue", icon: "arrow-right" },
    contract_call: { label: "Contract Call", color: "purple", icon: "code" },
    contract_deploy: { label: "Deploy", color: "green", icon: "plus-circle" },
    staking: { label: "Staking", color: "orange", icon: "layers" },
    governance: { label: "Governance", color: "indigo", icon: "vote" },
    identity: { label: "Identity", color: "pink", icon: "user" },
    system: { label: "System", color: "gray", icon: "settings" },
    other: { label: "Other", color: "gray", icon: "circle" },
  };

  return categoryMap[category] || categoryMap.other;
}

/**
 * Filter transactions by criteria
 */
export function filterTransactions(
  transactions: UnifiedTransaction[],
  filters: {
    vmType?: TransactionVMType | "all";
    category?: TransactionCategory | "all";
    status?: TransactionStatus | "all";
    address?: string;
    minValue?: string;
    maxValue?: string;
    startTime?: number;
    endTime?: number;
  }
): UnifiedTransaction[] {
  return transactions.filter((tx) => {
    if (
      filters.vmType &&
      filters.vmType !== "all" &&
      tx.vmType !== filters.vmType
    ) {
      return false;
    }

    if (
      filters.category &&
      filters.category !== "all" &&
      tx.category !== filters.category
    ) {
      return false;
    }

    if (
      filters.status &&
      filters.status !== "all" &&
      tx.status !== filters.status
    ) {
      return false;
    }

    if (filters.address) {
      const addr = filters.address.toLowerCase();
      const fromMatch =
        tx.from.substrate?.toLowerCase() === addr ||
        tx.from.evm?.toLowerCase() === addr;
      const toMatch =
        tx.to?.substrate?.toLowerCase() === addr ||
        tx.to?.evm?.toLowerCase() === addr;
      if (!fromMatch && !toMatch) {
        return false;
      }
    }

    if (filters.minValue && BigInt(tx.value) < BigInt(filters.minValue)) {
      return false;
    }

    if (filters.maxValue && BigInt(tx.value) > BigInt(filters.maxValue)) {
      return false;
    }

    if (filters.startTime && tx.timestamp < filters.startTime) {
      return false;
    }

    if (filters.endTime && tx.timestamp > filters.endTime) {
      return false;
    }

    return true;
  });
}

/**
 * Group transactions by date
 */
export function groupTransactionsByDate(
  transactions: UnifiedTransaction[]
): Map<string, UnifiedTransaction[]> {
  const groups = new Map<string, UnifiedTransaction[]>();

  for (const tx of transactions) {
    const date = new Date(tx.timestamp).toDateString();
    const existing = groups.get(date) || [];
    existing.push(tx);
    groups.set(date, existing);
  }

  return groups;
}

/**
 * Calculate transaction statistics
 */
export function calculateTransactionStats(transactions: UnifiedTransaction[]): {
  total: number;
  substrate: number;
  evm: number;
  successful: number;
  failed: number;
  totalValue: bigint;
  totalFees: bigint;
  byCategory: Record<TransactionCategory, number>;
} {
  const stats = {
    total: transactions.length,
    substrate: 0,
    evm: 0,
    successful: 0,
    failed: 0,
    totalValue: BigInt(0),
    totalFees: BigInt(0),
    byCategory: {
      transfer: 0,
      contract_call: 0,
      contract_deploy: 0,
      staking: 0,
      governance: 0,
      identity: 0,
      system: 0,
      other: 0,
    } as Record<TransactionCategory, number>,
  };

  for (const tx of transactions) {
    if (tx.vmType === "substrate") stats.substrate++;
    else stats.evm++;

    if (tx.success) stats.successful++;
    else stats.failed++;

    stats.totalValue += BigInt(tx.value);
    stats.totalFees += BigInt(tx.fee);

    stats.byCategory[tx.category]++;
  }

  return stats;
}
