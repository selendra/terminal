/**
 * Selendra Token Registry
 * 
 * This module provides token metadata and logo management for the Selendra ecosystem.
 * Token data is loaded from token-list.json which can be a git submodule for easy updates.
 * 
 * To add a new verified token:
 * 1. Add the token to token-list.json with all required fields
 * 2. Add the token logo SVG to /public/tokens/{symbol}.svg
 * 3. The token will automatically appear in the explorer
 */

import tokenListData from './token-list.json';

// Token interface matching the JSON schema
export interface TokenMetadata {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    tags?: string[];
    extensions?: {
        website?: string;
        twitter?: string;
        telegram?: string;
        discord?: string;
        github?: string;
        description?: string;
        coingeckoId?: string;
        coinmarketcapId?: string;
    };
}

export interface TokenList {
    name: string;
    version: {
        major: number;
        minor: number;
        patch: number;
    };
    timestamp?: string;
    tokens: TokenMetadata[];
}

// Selendra chain IDs
export const SELENDRA_MAINNET_CHAIN_ID = 1961;
export const SELENDRA_TESTNET_CHAIN_ID = 1953;

// Load token list
export const tokenList: TokenList = tokenListData as TokenList;

// Create lookup maps for fast access
const tokensBySymbol = new Map<string, TokenMetadata>();
const tokensByAddress = new Map<string, TokenMetadata>();

// Initialize lookup maps
tokenList.tokens.forEach((token) => {
    tokensBySymbol.set(token.symbol.toUpperCase(), token);
    tokensByAddress.set(token.address.toLowerCase(), token);
});

/**
 * Get token metadata by symbol
 */
export function getTokenBySymbol(symbol: string): TokenMetadata | undefined {
    return tokensBySymbol.get(symbol.toUpperCase());
}

/**
 * Get token metadata by contract address
 */
export function getTokenByAddress(address: string): TokenMetadata | undefined {
    return tokensByAddress.get(address.toLowerCase());
}

/**
 * Get token logo URI by symbol
 */
export function getTokenLogoBySymbol(symbol: string): string | undefined {
    const token = getTokenBySymbol(symbol);
    return token?.logoURI;
}

/**
 * Get token logo URI by address
 */
export function getTokenLogoByAddress(address: string): string | undefined {
    const token = getTokenByAddress(address);
    return token?.logoURI;
}

/**
 * Check if a token is verified
 */
export function isTokenVerified(symbolOrAddress: string): boolean {
    const token = getTokenBySymbol(symbolOrAddress) || getTokenByAddress(symbolOrAddress);
    return token?.tags?.includes('verified') ?? false;
}

/**
 * Get all tokens with a specific tag
 */
export function getTokensByTag(tag: string): TokenMetadata[] {
    return tokenList.tokens.filter((token) => token.tags?.includes(tag));
}

/**
 * Get all verified tokens
 */
export function getVerifiedTokens(): TokenMetadata[] {
    return getTokensByTag('verified');
}

/**
 * Get all native tokens
 */
export function getNativeTokens(): TokenMetadata[] {
    return tokenList.tokens.filter((token) => token.address === 'native');
}

/**
 * Get Selendra native token
 */
export function getSelendraToken(): TokenMetadata | undefined {
    return getTokenBySymbol('SEL');
}

// Export default token list
export default tokenList;
