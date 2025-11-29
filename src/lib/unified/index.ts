/**
 * Unified Dual-VM Utilities
 *
 * Services and utilities for handling Selendra's dual-VM architecture.
 */

// Address Resolution
export {
  resolveAddress,
  substrateToEvm,
  evmToSubstrate,
  getAlternateAddress,
  isSameAccount,
  clearAddressCache,
  type UnifiedAddress,
} from "./address-resolver";

// Transaction Normalization
export {
  normalizeSubstrateExtrinsic,
  normalizeEvmTransaction,
  normalizeTransaction,
  normalizeAndMergeTransactions,
  formatTokenAmount,
  getCategoryInfo,
  filterTransactions,
  groupTransactionsByDate,
  calculateTransactionStats,
  type TransactionVMType,
  type TransactionStatus,
  type TransactionCategory,
  type UnifiedTransaction,
  type UnifiedEvent,
  type RawSubstrateExtrinsic,
  type RawEvmTransaction,
} from "./transaction-normalizer";

// Contract Aggregation
export {
  normalizeInkContract,
  normalizeEvmContract,
  normalizeContract,
  detectEvmContractStandard,
  detectInkContractStandard,
  mapPspToErc,
  mapErcToPsp,
  getStandardInfo,
  type ContractVMType,
  type VerificationStatus,
  type ContractStandard,
  type UnifiedContract,
  type UnifiedMethod,
  type UnifiedEvent as UnifiedContractEvent,
  type UnifiedConstructor,
  type UnifiedParam,
  type RawInkContract,
  type RawEvmContract,
  type InkMetadata,
  type EvmAbi,
} from "./contract-aggregator";

// Token Standard Mapping
export {
  normalizeErc20Token,
  normalizePsp22Token,
  normalizeErc721Collection,
  normalizePsp34Collection,
  normalizeErc1155Token,
  normalizePsp37Token,
  normalizeFungibleToken,
  formatTokenAmount as formatToken,
  parseTokenAmount,
  isFungibleStandard,
  isNftStandard,
  isMultiStandard,
  getTokenType,
  getEquivalentStandard,
  getTokenStandardInfo,
  convertMethodEvmToInk,
  convertMethodInkToEvm,
  convertTokenData,
  compareTokens,
  TokenMapper,
  type TokenType,
  type TokenStandard,
  type FungibleStandard,
  type NftStandard,
  type MultiStandard,
  type UnifiedFungibleToken,
  type UnifiedNftCollection,
  type UnifiedNftItem,
  type UnifiedMultiToken,
  type UnifiedTokenBalance,
  type RawErc20Token,
  type RawPsp22Token,
  type RawErc721Collection,
  type RawPsp34Collection,
  type RawErc1155Token,
  type RawPsp37Token,
} from "./token-mapper";
