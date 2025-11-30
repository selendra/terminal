"use client";

/**
 * TokenIcon Component
 * 
 * Displays token icons using the token registry for verified tokens,
 * with fallbacks to web3icons for common tokens and styled initials for unknown tokens.
 */

import React from 'react';
import NextImage from 'next/image';
import { Diamond, Code2, Palette } from 'lucide-react';
import { getTokenBySymbol, getTokenByAddress } from '@/lib/tokens';

// Web3 Icons for common tokens
import {
    TokenUSDT,
    TokenUSDC,
    TokenDAI,
    TokenBTC,
    TokenETH,
    TokenBNB,
} from '@web3icons/react';

interface TokenIconProps {
    symbol?: string;
    address?: string;
    size?: number;
    className?: string;
}

export const TokenIcon: React.FC<TokenIconProps> = ({
    symbol,
    address,
    size = 32,
    className = '',
}) => {
    // Try to get token from registry
    const token = symbol
        ? getTokenBySymbol(symbol)
        : address
            ? getTokenByAddress(address)
            : undefined;

    const tokenSymbol = token?.symbol || symbol || '';
    const upperSymbol = tokenSymbol.toUpperCase();

    // If token has a logo URI in registry, use it
    if (token?.logoURI) {
        return (
            <NextImage
                src={token.logoURI}
                alt={token.name}
                width={size}
                height={size}
                className={`rounded-full ${className}`}
            />
        );
    }

    // Fallback to web3icons for known tokens
    const iconProps = { size, variant: 'branded' as const, className };

    switch (upperSymbol) {
        case 'SEL':
        case 'WSEL':
            return (
                <NextImage
                    src="/tokens/sel.png"
                    alt="Selendra"
                    width={size}
                    height={size}
                    className={`rounded-full ${className}`}
                />
            );
        case 'USDT':
            return <TokenUSDT {...iconProps} />;
        case 'USDC':
            return <TokenUSDC {...iconProps} />;
        case 'DAI':
            return <TokenDAI {...iconProps} />;
        case 'BTC':
        case 'WBTC':
            return <TokenBTC {...iconProps} />;
        case 'ETH':
        case 'WETH':
            return <TokenETH {...iconProps} />;
        case 'BNB':
        case 'WBNB':
            return <TokenBNB {...iconProps} />;

        // Custom styled icons for Selendra ecosystem tokens
        case 'SDEFI':
            return (
                <div
                    className={`flex items-center justify-center rounded-full ${className}`}
                    style={{
                        width: size,
                        height: size,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                    }}
                >
                    <Diamond className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
                </div>
            );
        case 'SNFT':
            return (
                <div
                    className={`flex items-center justify-center rounded-full ${className}`}
                    style={{
                        width: size,
                        height: size,
                        background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
                    }}
                >
                    <Palette className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
                </div>
            );
        case 'SGAME':
        case 'SGI':
            return (
                <div
                    className={`flex items-center justify-center rounded-full ${className}`}
                    style={{
                        width: size,
                        height: size,
                        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'
                    }}
                >
                    <svg
                        width={size * 0.5}
                        height={size * 0.5}
                        viewBox="0 0 24 24"
                        fill="white"
                    >
                        <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                </div>
            );
        case 'KRT':
            return (
                <div
                    className={`flex items-center justify-center rounded-full ${className}`}
                    style={{
                        width: size,
                        height: size,
                        background: 'linear-gradient(135deg, #032ea1 0%, #e2001a 100%)'
                    }}
                >
                    <span className="text-white font-bold" style={{ fontSize: size * 0.35 }}>៛</span>
                </div>
            );
        case 'IPSP':
            return (
                <div
                    className={`flex items-center justify-center rounded-full ${className}`}
                    style={{
                        width: size,
                        height: size,
                        background: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)'
                    }}
                >
                    <Code2 className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
                </div>
            );

        // Default fallback with first letter
        default:
            return (
                <div
                    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-gray-600 to-gray-700 ${className}`}
                    style={{ width: size, height: size }}
                >
                    <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
                        {tokenSymbol.charAt(0).toUpperCase() || '?'}
                    </span>
                </div>
            );
    }
};

export default TokenIcon;
