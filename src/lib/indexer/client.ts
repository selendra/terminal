import { GraphQLClient } from 'graphql-request';

// Default to a placeholder if env var is missing. 
// In production, this should be the actual SubQuery/Squid endpoint.
const INDEXER_ENDPOINT = process.env.NEXT_PUBLIC_INDEXER_URL || 'https://indexer.selendra.org/graphql';

export const indexerClient = new GraphQLClient(INDEXER_ENDPOINT, {
  headers: {
    // Add any necessary headers here, e.g. authorization
  },
});
