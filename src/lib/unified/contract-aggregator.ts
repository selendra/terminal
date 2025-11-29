/**
 * Contract Aggregator Service
 *
 * Provides a unified interface for interacting with both
 * ink! (WASM) and EVM (Solidity) smart contracts on Selendra.
 */

import { resolveAddress, type UnifiedAddress } from "./address-resolver";

// ============================================
// TYPES
// ============================================

/**
 * Contract VM type
 */
export type ContractVMType = "ink" | "evm";

/**
 * Contract verification status
 */
export type VerificationStatus = "verified" | "unverified" | "partial";

/**
 * Contract type/standard
 */
export type ContractStandard =
  | "erc20"
  | "erc721"
  | "erc1155"
  | "psp22"
  | "psp34"
  | "psp37"
  | "custom"
  | "unknown";

/**
 * Raw ink! contract info from chain
 */
export interface RawInkContract {
  address: string;
  codeHash: string;
  trieId: string;
  storageDeposit: string;
  deployer?: string;
  blockNumber?: number;
  timestamp?: number;
  metadata?: InkMetadata;
}

/**
 * ink! contract metadata (from contract JSON)
 */
export interface InkMetadata {
  source: {
    hash: string;
    language: string;
    compiler: string;
    wasm?: string;
  };
  contract: {
    name: string;
    version: string;
    authors: string[];
    description?: string;
    documentation?: string;
    repository?: string;
    homepage?: string;
    license?: string;
  };
  spec: {
    constructors: InkConstructor[];
    messages: InkMessage[];
    events: InkEvent[];
    docs?: string[];
  };
  storage?: unknown;
  types: unknown[];
  version: string;
}

/**
 * ink! constructor definition
 */
export interface InkConstructor {
  label: string;
  selector: string;
  payable: boolean;
  args: InkArg[];
  docs?: string[];
}

/**
 * ink! message (method) definition
 */
export interface InkMessage {
  label: string;
  selector: string;
  mutates: boolean;
  payable: boolean;
  args: InkArg[];
  returnType?: InkType;
  docs?: string[];
}

/**
 * ink! event definition
 */
export interface InkEvent {
  label: string;
  args: InkArg[];
  docs?: string[];
}

/**
 * ink! argument
 */
export interface InkArg {
  label: string;
  type: InkType;
}

/**
 * ink! type reference
 */
export interface InkType {
  displayName?: string[];
  type: number | { def: unknown };
}

/**
 * Raw EVM contract info
 */
export interface RawEvmContract {
  address: string;
  bytecode: string;
  deployedBytecode: string;
  creator?: string;
  creationTxHash?: string;
  blockNumber?: number;
  timestamp?: number;
  abi?: EvmAbi;
  name?: string;
  compilerVersion?: string;
  optimizationUsed?: boolean;
  runs?: number;
  sourceCode?: string;
}

/**
 * EVM ABI type
 */
export type EvmAbi = EvmAbiItem[];

/**
 * EVM ABI item
 */
export interface EvmAbiItem {
  type: "function" | "event" | "constructor" | "fallback" | "receive" | "error";
  name?: string;
  inputs?: EvmAbiInput[];
  outputs?: EvmAbiInput[];
  stateMutability?: "pure" | "view" | "nonpayable" | "payable";
  anonymous?: boolean;
  constant?: boolean;
  payable?: boolean;
}

/**
 * EVM ABI input/output
 */
export interface EvmAbiInput {
  name: string;
  type: string;
  indexed?: boolean;
  components?: EvmAbiInput[];
  internalType?: string;
}

/**
 * Unified contract representation
 */
export interface UnifiedContract {
  // Identifiers
  id: string;
  address: UnifiedAddress;
  vmType: ContractVMType;

  // Verification
  verificationStatus: VerificationStatus;
  isVerified: boolean;

  // Contract info
  name: string;
  symbol?: string;
  standard: ContractStandard;
  description?: string;

  // Deployment info
  deployer?: UnifiedAddress;
  deploymentBlock?: number;
  deploymentTxHash?: string;
  deploymentTimestamp?: number;

  // Code info
  codeHash?: string;
  sourceCode?: string;
  compilerVersion?: string;

  // Interface
  methods: UnifiedMethod[];
  events: UnifiedEvent[];
  constructors?: UnifiedConstructor[];

  // Statistics
  transactionCount?: number;
  holderCount?: number;
  totalSupply?: string;

  // Proxy info
  isProxy?: boolean;
  implementation?: string;
  proxyType?: "transparent" | "uups" | "beacon" | "diamond";

  // Raw data
  raw?: RawInkContract | RawEvmContract;
}

/**
 * Unified method representation
 */
export interface UnifiedMethod {
  name: string;
  selector: string;
  inputs: UnifiedParam[];
  outputs: UnifiedParam[];
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  isReadOnly: boolean;
  isPayable: boolean;
  description?: string;
}

/**
 * Unified event representation
 */
export interface UnifiedEvent {
  name: string;
  signature?: string;
  inputs: UnifiedParam[];
  description?: string;
}

/**
 * Unified constructor representation
 */
export interface UnifiedConstructor {
  name: string;
  inputs: UnifiedParam[];
  isPayable: boolean;
  description?: string;
}

/**
 * Unified parameter
 */
export interface UnifiedParam {
  name: string;
  type: string;
  indexed?: boolean;
  description?: string;
}

// ============================================
// CONTRACT STANDARD DETECTION
// ============================================

/**
 * ERC-20 method signatures
 */
const ERC20_METHODS = [
  "0x70a08231", // balanceOf
  "0x18160ddd", // totalSupply
  "0xa9059cbb", // transfer
  "0x23b872dd", // transferFrom
  "0x095ea7b3", // approve
  "0xdd62ed3e", // allowance
];

/**
 * ERC-721 method signatures (additional to ERC-20)
 */
const ERC721_METHODS = [
  "0x6352211e", // ownerOf
  "0xb88d4fde", // safeTransferFrom(address,address,uint256,bytes)
  "0x42842e0e", // safeTransferFrom(address,address,uint256)
  "0x081812fc", // getApproved
  "0xe985e9c5", // isApprovedForAll
];

/**
 * ERC-1155 method signatures
 */
const ERC1155_METHODS = [
  "0x00fdd58e", // balanceOf(address,uint256)
  "0x4e1273f4", // balanceOfBatch
  "0x2eb2c2d6", // safeBatchTransferFrom
  "0xf242432a", // safeTransferFrom
];

/**
 * PSP-22 selectors (ink!)
 */
const PSP22_SELECTORS = [
  "0x162df8c2", // total_supply
  "0x6568382f", // balance_of
  "0x4d47d921", // allowance
  "0xdb20f9f5", // transfer
  "0x54b3c76e", // transfer_from
  "0xb20f1bbd", // approve
];

/**
 * PSP-34 selectors (ink!)
 */
const PSP34_SELECTORS = [
  "0x628aa0e2", // collection_id
  "0x1168624d", // balance_of
  "0xcd279f15", // owner_of
  "0x7d6e7c92", // total_supply
  "0x3128d61b", // transfer
];

/**
 * PSP-37 selectors (ink!)
 */
const PSP37_SELECTORS = [
  "0x8c9e23d5", // balance_of(owner, id)
  "0xad19f95d", // total_supply
  "0xb0e5e9f1", // transfer(to, id, value)
];

/**
 * Detect contract standard from EVM bytecode/ABI
 */
export function detectEvmContractStandard(
  contract: RawEvmContract
): ContractStandard {
  if (!contract.abi) {
    // Try to detect from bytecode signatures
    const bytecode = contract.deployedBytecode.toLowerCase();

    const hasErc20 = ERC20_METHODS.every((sig) =>
      bytecode.includes(sig.slice(2))
    );
    const hasErc721 = ERC721_METHODS.every((sig) =>
      bytecode.includes(sig.slice(2))
    );
    const hasErc1155 = ERC1155_METHODS.every((sig) =>
      bytecode.includes(sig.slice(2))
    );

    if (hasErc1155) return "erc1155";
    if (hasErc721) return "erc721";
    if (hasErc20) return "erc20";

    return "unknown";
  }

  // Detect from ABI
  const methodSigs = new Set(
    contract.abi
      .filter((item) => item.type === "function")
      .map((item) => item.name)
  );

  // ERC-1155 check
  if (
    methodSigs.has("balanceOfBatch") &&
    methodSigs.has("safeBatchTransferFrom")
  ) {
    return "erc1155";
  }

  // ERC-721 check
  if (methodSigs.has("ownerOf") && methodSigs.has("safeTransferFrom")) {
    return "erc721";
  }

  // ERC-20 check
  if (
    methodSigs.has("transfer") &&
    methodSigs.has("balanceOf") &&
    methodSigs.has("totalSupply")
  ) {
    return "erc20";
  }

  return "custom";
}

/**
 * Detect contract standard from ink! metadata
 */
export function detectInkContractStandard(
  metadata: InkMetadata
): ContractStandard {
  const selectors = new Set(
    metadata.spec.messages.map((m) => m.selector.toLowerCase())
  );

  // PSP-37 check (multi-token)
  const hasPsp37 = PSP37_SELECTORS.every((sel) =>
    selectors.has(sel.toLowerCase())
  );
  if (hasPsp37) return "psp37";

  // PSP-34 check (NFT)
  const hasPsp34 = PSP34_SELECTORS.every((sel) =>
    selectors.has(sel.toLowerCase())
  );
  if (hasPsp34) return "psp34";

  // PSP-22 check (fungible)
  const hasPsp22 = PSP22_SELECTORS.every((sel) =>
    selectors.has(sel.toLowerCase())
  );
  if (hasPsp22) return "psp22";

  return "custom";
}

// ============================================
// NORMALIZER FUNCTIONS
// ============================================

/**
 * Normalize an ink! contract to unified format
 */
export async function normalizeInkContract(
  contract: RawInkContract
): Promise<UnifiedContract> {
  const resolvedAddress = await resolveAddress(contract.address);
  const resolvedDeployer = contract.deployer
    ? await resolveAddress(contract.deployer)
    : undefined;

  // Create fallback addresses if resolution fails
  const address: UnifiedAddress = resolvedAddress || {
    substrate: contract.address,
    evm: "",
    isVerified: false,
    source: "derived",
  };
  const deployer: UnifiedAddress | undefined = resolvedDeployer || undefined;

  const metadata = contract.metadata;
  const standard = metadata ? detectInkContractStandard(metadata) : "unknown";

  // Extract methods from metadata
  const methods: UnifiedMethod[] = metadata
    ? metadata.spec.messages.map((msg) => ({
        name: msg.label,
        selector: msg.selector,
        inputs: msg.args.map((arg) => ({
          name: arg.label,
          type: formatInkType(arg.type, metadata.types),
        })),
        outputs: msg.returnType
          ? [
              {
                name: "result",
                type: formatInkType(msg.returnType, metadata.types),
              },
            ]
          : [],
        stateMutability: msg.mutates
          ? msg.payable
            ? "payable"
            : "nonpayable"
          : "view",
        isReadOnly: !msg.mutates,
        isPayable: msg.payable,
        description: msg.docs?.join("\n"),
      }))
    : [];

  // Extract events from metadata
  const events: UnifiedEvent[] = metadata
    ? metadata.spec.events.map((evt) => ({
        name: evt.label,
        inputs: evt.args.map((arg) => ({
          name: arg.label,
          type: formatInkType(arg.type, metadata.types),
        })),
        description: evt.docs?.join("\n"),
      }))
    : [];

  // Extract constructors from metadata
  const constructors: UnifiedConstructor[] = metadata
    ? metadata.spec.constructors.map((ctor) => ({
        name: ctor.label,
        inputs: ctor.args.map((arg) => ({
          name: arg.label,
          type: formatInkType(arg.type, metadata.types),
        })),
        isPayable: ctor.payable,
        description: ctor.docs?.join("\n"),
      }))
    : [];

  return {
    id: `ink-${contract.address}`,
    address,
    vmType: "ink",

    verificationStatus: metadata ? "verified" : "unverified",
    isVerified: !!metadata,

    name: metadata?.contract.name || "Unknown Contract",
    description: metadata?.contract.description,
    standard,

    deployer,
    deploymentBlock: contract.blockNumber,
    deploymentTimestamp: contract.timestamp,

    codeHash: contract.codeHash,
    compilerVersion: metadata?.source.compiler,

    methods,
    events,
    constructors,

    raw: contract,
  };
}

/**
 * Normalize an EVM contract to unified format
 */
export async function normalizeEvmContract(
  contract: RawEvmContract
): Promise<UnifiedContract> {
  const resolvedAddress = await resolveAddress(contract.address);
  const resolvedDeployer = contract.creator
    ? await resolveAddress(contract.creator)
    : undefined;

  // Create fallback addresses if resolution fails
  const address: UnifiedAddress = resolvedAddress || {
    substrate: "",
    evm: contract.address,
    isVerified: false,
    source: "derived",
  };
  const deployer: UnifiedAddress | undefined = resolvedDeployer || undefined;

  const standard = detectEvmContractStandard(contract);
  const abi = contract.abi || [];

  // Extract methods from ABI
  const methods: UnifiedMethod[] = abi
    .filter((item) => item.type === "function")
    .map((item) => ({
      name: item.name || "unknown",
      selector: computeEvmSelector(item),
      inputs: (item.inputs || []).map((input) => ({
        name: input.name,
        type: input.type,
      })),
      outputs: (item.outputs || []).map((output) => ({
        name: output.name || "result",
        type: output.type,
      })),
      stateMutability:
        (item.stateMutability as "pure" | "view" | "nonpayable" | "payable") ||
        (item.constant ? "view" : "nonpayable"),
      isReadOnly:
        item.stateMutability === "view" || item.stateMutability === "pure",
      isPayable: item.stateMutability === "payable" || item.payable === true,
    }));

  // Extract events from ABI
  const events: UnifiedEvent[] = abi
    .filter((item) => item.type === "event")
    .map((item) => ({
      name: item.name || "unknown",
      signature: computeEventSignature(item),
      inputs: (item.inputs || []).map((input) => ({
        name: input.name,
        type: input.type,
        indexed: input.indexed,
      })),
    }));

  // Extract constructor from ABI
  const ctorAbi = abi.find((item) => item.type === "constructor");
  const constructors: UnifiedConstructor[] = ctorAbi
    ? [
        {
          name: "constructor",
          inputs: (ctorAbi.inputs || []).map((input) => ({
            name: input.name,
            type: input.type,
          })),
          isPayable: ctorAbi.stateMutability === "payable",
        },
      ]
    : [];

  // Detect proxy
  const isProxy = detectProxy(contract);

  return {
    id: `evm-${contract.address}`,
    address,
    vmType: "evm",

    verificationStatus: contract.sourceCode ? "verified" : "unverified",
    isVerified: !!contract.sourceCode,

    name: contract.name || "Unknown Contract",
    standard,

    deployer,
    deploymentBlock: contract.blockNumber,
    deploymentTxHash: contract.creationTxHash,
    deploymentTimestamp: contract.timestamp,

    sourceCode: contract.sourceCode,
    compilerVersion: contract.compilerVersion,

    methods,
    events,
    constructors,

    isProxy: isProxy.isProxy,
    implementation: isProxy.implementation,
    proxyType: isProxy.proxyType,

    raw: contract,
  };
}

/**
 * Normalize any contract (auto-detect type)
 */
export async function normalizeContract(
  contract: RawInkContract | RawEvmContract
): Promise<UnifiedContract> {
  // Detect type by checking for ink!-specific fields
  if ("codeHash" in contract && "trieId" in contract) {
    return normalizeInkContract(contract as RawInkContract);
  }
  return normalizeEvmContract(contract as RawEvmContract);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format ink! type to string
 */
function formatInkType(type: InkType, types: unknown[]): string {
  if (type.displayName && type.displayName.length > 0) {
    return type.displayName.join("::");
  }

  if (typeof type.type === "number") {
    // Look up type in types array
    const typeDef = types[type.type] as { type?: { path?: string[] } };
    if (typeDef?.type?.path) {
      return typeDef.type.path.join("::");
    }
  }

  return "unknown";
}

/**
 * Compute EVM function selector from ABI item
 */
function computeEvmSelector(item: EvmAbiItem): string {
  if (!item.name || !item.inputs) return "0x00000000";

  const signature = `${item.name}(${item.inputs.map((i) => i.type).join(",")})`;

  // In a real implementation, we'd use keccak256
  // For now, return a placeholder
  return `0x${signature.slice(0, 8)}`;
}

/**
 * Compute EVM event signature from ABI item
 */
function computeEventSignature(item: EvmAbiItem): string {
  if (!item.name || !item.inputs) return "";

  return `${item.name}(${item.inputs.map((i) => i.type).join(",")})`;
}

/**
 * Detect if contract is a proxy
 */
function detectProxy(contract: RawEvmContract): {
  isProxy: boolean;
  implementation?: string;
  proxyType?: "transparent" | "uups" | "beacon" | "diamond";
} {
  if (!contract.abi) {
    return { isProxy: false };
  }

  const methodNames = new Set(
    contract.abi.filter((i) => i.type === "function").map((i) => i.name)
  );

  // Check for common proxy patterns
  if (
    methodNames.has("implementation") ||
    methodNames.has("getImplementation")
  ) {
    return { isProxy: true, proxyType: "transparent" };
  }

  if (methodNames.has("upgradeTo") || methodNames.has("upgradeToAndCall")) {
    return { isProxy: true, proxyType: "uups" };
  }

  if (methodNames.has("beacon") || methodNames.has("implementation")) {
    return { isProxy: true, proxyType: "beacon" };
  }

  if (
    methodNames.has("facetAddress") ||
    methodNames.has("facetFunctionSelectors")
  ) {
    return { isProxy: true, proxyType: "diamond" };
  }

  return { isProxy: false };
}

/**
 * Map PSP standard to ERC equivalent
 */
export function mapPspToErc(
  pspStandard: "psp22" | "psp34" | "psp37"
): "erc20" | "erc721" | "erc1155" {
  const mapping = {
    psp22: "erc20",
    psp34: "erc721",
    psp37: "erc1155",
  } as const;

  return mapping[pspStandard];
}

/**
 * Map ERC standard to PSP equivalent
 */
export function mapErcToPsp(
  ercStandard: "erc20" | "erc721" | "erc1155"
): "psp22" | "psp34" | "psp37" {
  const mapping = {
    erc20: "psp22",
    erc721: "psp34",
    erc1155: "psp37",
  } as const;

  return mapping[ercStandard];
}

/**
 * Get standard display info
 */
export function getStandardInfo(standard: ContractStandard): {
  name: string;
  description: string;
  vmType: ContractVMType | "both";
  equivalent?: ContractStandard;
} {
  const info: Record<
    ContractStandard,
    {
      name: string;
      description: string;
      vmType: ContractVMType | "both";
      equivalent?: ContractStandard;
    }
  > = {
    erc20: {
      name: "ERC-20",
      description: "Fungible Token Standard (EVM)",
      vmType: "evm",
      equivalent: "psp22",
    },
    erc721: {
      name: "ERC-721",
      description: "Non-Fungible Token Standard (EVM)",
      vmType: "evm",
      equivalent: "psp34",
    },
    erc1155: {
      name: "ERC-1155",
      description: "Multi Token Standard (EVM)",
      vmType: "evm",
      equivalent: "psp37",
    },
    psp22: {
      name: "PSP-22",
      description: "Fungible Token Standard (ink!)",
      vmType: "ink",
      equivalent: "erc20",
    },
    psp34: {
      name: "PSP-34",
      description: "Non-Fungible Token Standard (ink!)",
      vmType: "ink",
      equivalent: "erc721",
    },
    psp37: {
      name: "PSP-37",
      description: "Multi Token Standard (ink!)",
      vmType: "ink",
      equivalent: "erc1155",
    },
    custom: {
      name: "Custom",
      description: "Custom contract implementation",
      vmType: "both",
    },
    unknown: {
      name: "Unknown",
      description: "Unverified contract",
      vmType: "both",
    },
  };

  return info[standard];
}
