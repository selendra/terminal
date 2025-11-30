/**
 * Selendra Logo Component
 * 
 * Official Selendra logo using the PNG image.
 * Can be used with any size.
 */

import React from 'react';
import Image from 'next/image';

interface SelendraLogoProps {
    size?: number;
    variant?: 'branded' | 'mono';
    className?: string;
}

export const SelendraLogo: React.FC<SelendraLogoProps> = ({
    size = 32,
    variant = 'branded',
    className = '',
}) => {
    return (
        <Image
            src="/selendra-logo.png"
            alt="Selendra"
            width={size}
            height={size}
            className={`rounded-full ${className}`}
            style={variant === 'mono' ? { filter: 'grayscale(100%)' } : undefined}
        />
    );
};

// Selendra brand colors
export const SELENDRA_COLORS = {
    primary: '#1DB4A4',      // Teal
    primaryDark: '#17998C',  // Darker teal
    primaryLight: '#2DCBB9', // Lighter teal
    accent: '#6366F1',       // Indigo
    background: '#0F172A',   // Dark blue
};

export default SelendraLogo;
