"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  SNSClient,
  SNSProfile,
  normalizeDomain,
  isValidDomain,
  extractLabel,
  calculatePrice,
  namehash,
} from "@/lib/sns";
import { useBlockchain } from "@/components/providers/BlockchainProvider";

// =============================================================================
// Types
// =============================================================================

interface UseSNSProfileResult {
  profile: SNSProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseSNSResolveResult {
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSNSLookupResult {
  domain: string | null;
  profile: SNSProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSNSAvailabilityResult {
  isAvailable: boolean | null;
  isLoading: boolean;
  error: string | null;
  price: {
    base: bigint;
    premium: bigint;
    total: bigint;
    formatted: string;
  } | null;
}

// =============================================================================
// SNS Client Hook
// =============================================================================

let clientInstance: SNSClient | null = null;

/**
 * Hook to get SNS client instance
 */
export function useSNSClient(): SNSClient | null {
  const { evmSDK } = useBlockchain();

  return useMemo(() => {
    if (!evmSDK) return null;

    // Create provider from evmSDK or use existing
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider =
        evmSDK.provider || new ethers.BrowserProvider((window as any).ethereum);

      if (!clientInstance) {
        clientInstance = new SNSClient(provider);
      }

      return clientInstance;
    } catch {
      return null;
    }
  }, [evmSDK]);
}

// =============================================================================
// Profile Hook
// =============================================================================

/**
 * Hook to fetch SNS profile for a domain
 */
export function useSNSProfile(
  domain: string | null | undefined
): UseSNSProfileResult {
  const client = useSNSClient();
  const [profile, setProfile] = useState<SNSProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!domain) {
      setProfile(null);
      setError(null);
      return;
    }

    // Validate domain
    const validation = isValidDomain(domain);
    if (!validation.valid) {
      setError(validation.error || "Invalid domain");
      setProfile(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (client) {
        const result = await client.getProfile(domain);
        setProfile(result);
      } else {
        // Mock profile when client not available
        const normalized = normalizeDomain(domain);
        const label = extractLabel(domain);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(normalized));

        setProfile({
          domain: normalized,
          owner: `0x${hash.slice(2, 42)}`,
          resolver: ethers.ZeroAddress,
          evmAddress: `0x${hash.slice(2, 42)}`,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${label}`,
          description: `Profile for ${normalized}`,
          verification: { level: "none" },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [domain, client]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, error, refetch: fetchProfile };
}

// =============================================================================
// Resolve Hook
// =============================================================================

/**
 * Hook to resolve a .sel domain to an address
 */
export function useSNSResolve(
  domain: string | null | undefined
): UseSNSResolveResult {
  const client = useSNSClient();
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      setAddress(null);
      setError(null);
      return;
    }

    const resolve = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (client) {
          const result = await client.resolveName(domain);
          setAddress(result);
        } else {
          // Mock resolution
          const normalized = normalizeDomain(domain);
          const hash = ethers.keccak256(ethers.toUtf8Bytes(normalized));
          setAddress(`0x${hash.slice(2, 42)}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Resolution failed");
        setAddress(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolve();
  }, [domain, client]);

  return { address, isLoading, error };
}

// =============================================================================
// Reverse Lookup Hook
// =============================================================================

/**
 * Hook to reverse lookup an address to a .sel domain
 */
export function useSNSLookup(
  address: string | null | undefined
): UseSNSLookupResult {
  const client = useSNSClient();
  const [domain, setDomain] = useState<string | null>(null);
  const [profile, setProfile] = useState<SNSProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !ethers.isAddress(address)) {
      setDomain(null);
      setProfile(null);
      setError(null);
      return;
    }

    const lookup = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (client) {
          const name = await client.lookupAddress(address);
          setDomain(name);

          if (name) {
            const prof = await client.getProfile(name);
            setProfile(prof);
          } else {
            setProfile(null);
          }
        } else {
          // No reverse lookup without client
          setDomain(null);
          setProfile(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lookup failed");
        setDomain(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    lookup();
  }, [address, client]);

  return { domain, profile, isLoading, error };
}

// =============================================================================
// Availability Hook
// =============================================================================

/**
 * Hook to check domain availability and price
 */
export function useSNSAvailability(
  domain: string | null | undefined,
  years: number = 1
): UseSNSAvailabilityResult {
  const client = useSNSClient();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [price, setPrice] = useState<UseSNSAvailabilityResult["price"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      setIsAvailable(null);
      setPrice(null);
      setError(null);
      return;
    }

    // Validate domain
    const validation = isValidDomain(domain);
    if (!validation.valid) {
      setError(validation.error || "Invalid domain");
      setIsAvailable(null);
      setPrice(null);
      return;
    }

    const check = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const label = extractLabel(domain);

        if (client) {
          const [available, priceData] = await Promise.all([
            client.isAvailable(domain),
            client.getPrice(domain, years),
          ]);

          setIsAvailable(available);
          setPrice({
            ...priceData,
            formatted: ethers.formatEther(priceData.total) + " SEL",
          });
        } else {
          // Calculate locally without client
          const total = calculatePrice(label, years);
          setIsAvailable(true); // Assume available
          setPrice({
            base: total,
            premium: BigInt(0),
            total,
            formatted: ethers.formatEther(total) + " SEL",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check failed");
        setIsAvailable(null);
        setPrice(null);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [domain, years, client]);

  return { isAvailable, isLoading, error, price };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook for domain validation
 */
export function useSNSValidation(domain: string): {
  isValid: boolean;
  error: string | null;
  normalized: string;
  label: string;
} {
  return useMemo(() => {
    if (!domain) {
      return {
        isValid: false,
        error: "Domain is required",
        normalized: "",
        label: "",
      };
    }

    const validation = isValidDomain(domain);
    const normalized = normalizeDomain(domain);
    const label = extractLabel(domain);

    return {
      isValid: validation.valid,
      error: validation.error || null,
      normalized,
      label,
    };
  }, [domain]);
}

/**
 * Hook for namehash calculation
 */
export function useSNSNamehash(domain: string | null): string | null {
  return useMemo(() => {
    if (!domain) return null;
    try {
      return namehash(normalizeDomain(domain));
    } catch {
      return null;
    }
  }, [domain]);
}

export {
  normalizeDomain,
  isValidDomain,
  extractLabel,
  calculatePrice,
  namehash,
};
