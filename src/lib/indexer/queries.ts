import { gql } from 'graphql-request';

export const GET_TOKENS = gql`
  query GetTokens($limit: Int = 10, $offset: Int = 0) {
    tokens(limit: $limit, offset: $offset, orderBy: HOLDERS_DESC) {
      nodes {
        id
        name
        symbol
        decimals
        totalSupply
        holders
        volume24h
        price
        verified
        type
      }
      totalCount
    }
  }
`;

export const GET_CONTRACTS = gql`
  query GetContracts($limit: Int = 10, $offset: Int = 0) {
    contracts(limit: $limit, offset: $offset, orderBy: BLOCK_NUMBER_DESC) {
      nodes {
        address
        name
        type
        vmType
        compiler
        version
        verified
        txCount
        createdAt
      }
      totalCount
    }
  }
`;

export const GET_TOKEN_BY_SYMBOL = gql`
  query GetTokenBySymbol($symbol: String!) {
    tokens(filter: { symbol: { equalTo: $symbol } }) {
      nodes {
        id
        name
        symbol
        decimals
        totalSupply
        holders
        volume24h
        price
        verified
        type
        priceHistory
      }
    }
  }
`;
