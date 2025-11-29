/**
 * GraphQL Client for SubQuery Indexer
 *
 * Provides a type-safe interface for querying the Selendra indexer
 * with automatic retry logic and error handling.
 */

// Environment configuration
const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_INDEXER_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
  "http://localhost:3001/graphql";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * GraphQL response types
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Block entity from indexer
 */
export interface IndexerBlock {
  id: string;
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: string;
  extrinsicCount: number;
  evmTransactionCount: number;
  eventCount: number;
  isFinalized: boolean;
  specVersion: number;
  validator?: {
    substrateAddress: string;
    evmAddress: string | null;
  };
}

/**
 * Transaction entity from indexer
 */
export interface IndexerTransaction {
  id: string;
  hash: string;
  type: "SUBSTRATE" | "EVM" | "EVM_WRAPPED";
  status: "SUCCESS" | "FAILED" | "PENDING";
  blockNumber: number;
  timestamp: string;
  from: {
    id: string;
    substrateAddress: string;
    evmAddress: string | null;
  };
  to: {
    id: string;
    substrateAddress: string;
    evmAddress: string | null;
  } | null;
  value: string;
  fee: string;
  method?: string;
  section?: string;
  gasUsed?: string;
  gasPrice?: string;
}

/**
 * Account entity from indexer
 */
export interface IndexerAccount {
  id: string;
  substrateAddress: string;
  evmAddress: string | null;
  isUnified: boolean;
  freeBalance: string;
  reservedBalance: string;
  substrateNonce: number;
  evmNonce: number;
  identityDisplay?: string;
  identityEmail?: string;
  identityWeb?: string;
  identityTwitter?: string;
  identityVerified: boolean;
  firstSeenBlock: number;
  firstSeenAt: string;
  lastActiveBlock: number;
  lastActiveAt: string;
  transactionCount: number;
}

/**
 * Sync status from indexer
 */
export interface IndexerSyncStatus {
  indexerBlock: number;
  chainBlock: number;
  lag: number;
  isSynced: boolean;
}

/**
 * Daily statistics from indexer
 */
export interface IndexerDailyStats {
  id: string;
  date: string;
  blocksProduced: number;
  totalTransactions: number;
  substrateExtrinsics: number;
  evmTransactions: number;
  newAccounts: number;
  valueTransferred: string;
}

/**
 * Error class for GraphQL operations
 */
export class IndexerError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "IndexerError";
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GraphQL Client for SubQuery Indexer
 */
export class IndexerClient {
  private endpoint: string;
  private isAvailable: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 30000; // 30 seconds

  constructor(endpoint?: string) {
    this.endpoint = endpoint || GRAPHQL_ENDPOINT;
  }

  /**
   * Check if the indexer is available
   */
  async checkAvailability(): Promise<boolean> {
    const now = Date.now();

    // Use cached result if recent
    if (
      this.isAvailable !== null &&
      now - this.lastHealthCheck < this.healthCheckInterval
    ) {
      return this.isAvailable;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "{ _metadata { lastProcessedHeight } }",
        }),
        signal: AbortSignal.timeout(5000),
      });

      this.isAvailable = response.ok;
      this.lastHealthCheck = now;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Execute a GraphQL query with retry logic
   */
  async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query, variables }),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new IndexerError(
            `HTTP ${response.status}: ${response.statusText}`,
            "HTTP_ERROR"
          );
        }

        const result: GraphQLResponse<T> = await response.json();

        if (result.errors && result.errors.length > 0) {
          throw new IndexerError(
            result.errors[0].message,
            "GRAPHQL_ERROR",
            result.errors
          );
        }

        if (!result.data) {
          throw new IndexerError("No data returned from query", "NO_DATA");
        }

        // Reset availability flag on success
        this.isAvailable = true;

        return result.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on GraphQL errors (they won't succeed)
        if (error instanceof IndexerError && error.code === "GRAPHQL_ERROR") {
          throw error;
        }

        // Wait before retrying
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Mark as unavailable after all retries failed
    this.isAvailable = false;

    throw new IndexerError(
      `Query failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
      "RETRY_EXHAUSTED",
      lastError
    );
  }

  /**
   * Get recent blocks from the indexer
   */
  async getBlocks(
    first: number = 10,
    offset: number = 0
  ): Promise<IndexerBlock[]> {
    const data = await this.query<{
      blocks: { nodes: IndexerBlock[] };
    }>(
      `
      query GetBlocks($first: Int!, $offset: Int!) {
        blocks(
          first: $first
          offset: $offset
          orderBy: NUMBER_DESC
        ) {
          nodes {
            id
            number
            hash
            parentHash
            stateRoot
            extrinsicsRoot
            timestamp
            extrinsicCount
            evmTransactionCount
            eventCount
            isFinalized
            specVersion
            validator {
              substrateAddress
              evmAddress
            }
          }
        }
      }
    `,
      { first, offset }
    );

    return data.blocks.nodes;
  }

  /**
   * Get a specific block by number
   */
  async getBlock(blockNumber: number): Promise<IndexerBlock | null> {
    const data = await this.query<{
      block: IndexerBlock | null;
    }>(
      `
      query GetBlock($id: String!) {
        block(id: $id) {
          id
          number
          hash
          parentHash
          stateRoot
          extrinsicsRoot
          timestamp
          extrinsicCount
          evmTransactionCount
          eventCount
          isFinalized
          specVersion
          validator {
            substrateAddress
            evmAddress
          }
        }
      }
    `,
      { id: String(blockNumber) }
    );

    return data.block;
  }

  /**
   * Get recent transactions from the indexer
   */
  async getTransactions(
    first: number = 20,
    offset: number = 0,
    options?: {
      type?: "SUBSTRATE" | "EVM" | "EVM_WRAPPED";
      status?: "SUCCESS" | "FAILED";
      fromAddress?: string;
      toAddress?: string;
    }
  ): Promise<IndexerTransaction[]> {
    // Build filter object
    const filters: string[] = [];
    if (options?.type) filters.push(`type: { equalTo: ${options.type} }`);
    if (options?.status) filters.push(`status: { equalTo: ${options.status} }`);
    if (options?.fromAddress)
      filters.push(`fromId: { equalTo: "${options.fromAddress}" }`);
    if (options?.toAddress)
      filters.push(`toId: { equalTo: "${options.toAddress}" }`);

    const filterClause =
      filters.length > 0 ? `filter: { ${filters.join(", ")} }` : "";

    const data = await this.query<{
      transactions: { nodes: IndexerTransaction[] };
    }>(
      `
      query GetTransactions($first: Int!, $offset: Int!) {
        transactions(
          first: $first
          offset: $offset
          orderBy: TIMESTAMP_DESC
          ${filterClause}
        ) {
          nodes {
            id
            hash
            type
            status
            blockNumber
            timestamp
            from {
              id
              substrateAddress
              evmAddress
            }
            to {
              id
              substrateAddress
              evmAddress
            }
            value
            fee
            method
            section
            gasUsed
            gasPrice
          }
        }
      }
    `,
      { first, offset }
    );

    return data.transactions.nodes;
  }

  /**
   * Get a specific transaction by hash
   */
  async getTransaction(hash: string): Promise<IndexerTransaction | null> {
    const data = await this.query<{
      transaction: IndexerTransaction | null;
    }>(
      `
      query GetTransaction($id: String!) {
        transaction(id: $id) {
          id
          hash
          type
          status
          blockNumber
          timestamp
          from {
            id
            substrateAddress
            evmAddress
          }
          to {
            id
            substrateAddress
            evmAddress
          }
          value
          fee
          method
          section
          gasUsed
          gasPrice
        }
      }
    `,
      { id: hash }
    );

    return data.transaction;
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<IndexerAccount | null> {
    const data = await this.query<{
      account: IndexerAccount | null;
    }>(
      `
      query GetAccount($id: String!) {
        account(id: $id) {
          id
          substrateAddress
          evmAddress
          isUnified
          freeBalance
          reservedBalance
          substrateNonce
          evmNonce
          identityDisplay
          identityEmail
          identityWeb
          identityTwitter
          identityVerified
          firstSeenBlock
          firstSeenAt
          lastActiveBlock
          lastActiveAt
          transactionCount
        }
      }
    `,
      { id: address }
    );

    return data.account;
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(
    address: string,
    first: number = 20,
    offset: number = 0
  ): Promise<IndexerTransaction[]> {
    const data = await this.query<{
      transactions: { nodes: IndexerTransaction[] };
    }>(
      `
      query GetAccountTransactions($address: String!, $first: Int!, $offset: Int!) {
        transactions(
          first: $first
          offset: $offset
          orderBy: TIMESTAMP_DESC
          filter: {
            or: [
              { fromId: { equalTo: $address } }
              { toId: { equalTo: $address } }
            ]
          }
        ) {
          nodes {
            id
            hash
            type
            status
            blockNumber
            timestamp
            from {
              id
              substrateAddress
              evmAddress
            }
            to {
              id
              substrateAddress
              evmAddress
            }
            value
            fee
            method
            section
            gasUsed
            gasPrice
          }
        }
      }
    `,
      { address, first, offset }
    );

    return data.transactions.nodes;
  }

  /**
   * Get indexer sync status
   */
  async getSyncStatus(): Promise<IndexerSyncStatus> {
    const data = await this.query<{
      _metadata: {
        lastProcessedHeight: number;
        targetHeight: number;
      };
    }>(
      `
      query GetSyncStatus {
        _metadata {
          lastProcessedHeight
          targetHeight
        }
      }
    `
    );

    const indexerBlock = data._metadata.lastProcessedHeight;
    const chainBlock = data._metadata.targetHeight;
    const lag = chainBlock - indexerBlock;

    return {
      indexerBlock,
      chainBlock,
      lag,
      isSynced: lag < 10, // Consider synced if within 10 blocks
    };
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(days: number = 30): Promise<IndexerDailyStats[]> {
    const data = await this.query<{
      dailyStats: { nodes: IndexerDailyStats[] };
    }>(
      `
      query GetDailyStats($first: Int!) {
        dailyStats(
          first: $first
          orderBy: DATE_DESC
        ) {
          nodes {
            id
            date
            blocksProduced
            totalTransactions
            substrateExtrinsics
            evmTransactions
            newAccounts
            valueTransferred
          }
        }
      }
    `,
      { first: days }
    );

    return data.dailyStats.nodes;
  }

  /**
   * Search for accounts by address or identity
   */
  async searchAccounts(
    query: string,
    first: number = 10
  ): Promise<IndexerAccount[]> {
    const data = await this.query<{
      accounts: { nodes: IndexerAccount[] };
    }>(
      `
      query SearchAccounts($query: String!, $first: Int!) {
        accounts(
          first: $first
          filter: {
            or: [
              { substrateAddress: { startsWith: $query } }
              { evmAddress: { startsWith: $query } }
              { identityDisplay: { includesInsensitive: $query } }
            ]
          }
        ) {
          nodes {
            id
            substrateAddress
            evmAddress
            isUnified
            freeBalance
            identityDisplay
            identityVerified
            transactionCount
          }
        }
      }
    `,
      { query, first }
    );

    return data.accounts.nodes;
  }

  /**
   * Get top accounts by balance
   */
  async getTopAccounts(
    first: number = 100,
    offset: number = 0,
    orderBy: "balance" | "txCount" = "balance"
  ): Promise<IndexerAccount[]> {
    const orderByField =
      orderBy === "balance" ? "FREE_BALANCE_DESC" : "TRANSACTION_COUNT_DESC";

    const data = await this.query<{
      accounts: { nodes: IndexerAccount[] };
    }>(
      `
      query GetTopAccounts($first: Int!, $offset: Int!) {
        accounts(
          first: $first
          offset: $offset
          orderBy: ${orderByField}
        ) {
          nodes {
            id
            substrateAddress
            evmAddress
            isUnified
            freeBalance
            reservedBalance
            substrateNonce
            evmNonce
            identityDisplay
            identityVerified
            firstSeenBlock
            firstSeenAt
            lastActiveBlock
            lastActiveAt
            transactionCount
          }
        }
      }
    `,
      { first, offset }
    );

    return data.accounts.nodes;
  }

  /**
   * Get total account count
   */
  async getAccountsCount(): Promise<number> {
    const data = await this.query<{
      accounts: { totalCount: number };
    }>(
      `
      query GetAccountsCount {
        accounts {
          totalCount
        }
      }
    `
    );

    return data.accounts.totalCount;
  }
}

// Default client instance
export const indexerClient = new IndexerClient();

// Export convenience functions
export const getBlocks = indexerClient.getBlocks.bind(indexerClient);
export const getBlock = indexerClient.getBlock.bind(indexerClient);
export const getTransactions =
  indexerClient.getTransactions.bind(indexerClient);
export const getTransaction = indexerClient.getTransaction.bind(indexerClient);
export const getAccount = indexerClient.getAccount.bind(indexerClient);
export const getSyncStatus = indexerClient.getSyncStatus.bind(indexerClient);
export const getDailyStats = indexerClient.getDailyStats.bind(indexerClient);
