/**
 * User Preferences Store
 *
 * Manages user preferences for the Selendra Terminal application.
 * Uses Zustand with localStorage persistence.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Address format preference
 * - substrate: Show SS58 format by default
 * - evm: Show 0x format by default
 * - both: Show both formats
 */
export type AddressFormat = "substrate" | "evm" | "both";

/**
 * Theme preference
 */
export type ThemePreference = "light" | "dark" | "system";

/**
 * Currency preference for displaying values
 */
export type CurrencyPreference = "USD" | "EUR" | "SEL" | "BTC" | "ETH";

/**
 * Explorer display preferences
 */
export interface ExplorerPreferences {
  /** Number of items per page in lists */
  itemsPerPage: 10 | 25 | 50 | 100;
  /** Show technical details by default */
  showTechnicalDetails: boolean;
  /** Auto-refresh interval in seconds (0 = disabled) */
  autoRefreshInterval: number;
  /** Show testnet networks */
  showTestnet: boolean;
}

/**
 * User preferences state
 */
export interface PreferencesState {
  // Address display preferences
  addressFormat: AddressFormat;
  setAddressFormat: (format: AddressFormat) => void;

  // Theme preferences
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;

  // Currency preferences
  currency: CurrencyPreference;
  setCurrency: (currency: CurrencyPreference) => void;

  // Explorer preferences
  explorer: ExplorerPreferences;
  setExplorerPreference: <K extends keyof ExplorerPreferences>(
    key: K,
    value: ExplorerPreferences[K]
  ) => void;

  // Saved addresses (address book)
  savedAddresses: SavedAddress[];
  addSavedAddress: (address: SavedAddress) => void;
  removeSavedAddress: (address: string) => void;
  updateSavedAddress: (address: string, updates: Partial<SavedAddress>) => void;

  // Recent searches
  recentSearches: string[];
  addRecentSearch: (search: string) => void;
  clearRecentSearches: () => void;

  // Reset all preferences
  resetPreferences: () => void;
}

/**
 * Saved address entry
 */
export interface SavedAddress {
  /** The address (SS58 or 0x format) */
  address: string;
  /** User-defined label */
  label: string;
  /** Address type */
  type: "substrate" | "evm";
  /** Optional notes */
  notes?: string;
  /** Tags for categorization */
  tags?: string[];
  /** When the address was saved */
  savedAt: number;
}

/**
 * Default preferences
 */
const defaultPreferences = {
  addressFormat: "substrate" as AddressFormat,
  theme: "system" as ThemePreference,
  currency: "USD" as CurrencyPreference,
  explorer: {
    itemsPerPage: 25 as const,
    showTechnicalDetails: false,
    autoRefreshInterval: 0,
    showTestnet: true,
  },
  savedAddresses: [] as SavedAddress[],
  recentSearches: [] as string[],
};

/**
 * User preferences store with localStorage persistence
 */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Address format
      addressFormat: defaultPreferences.addressFormat,
      setAddressFormat: (format) => set({ addressFormat: format }),

      // Theme
      theme: defaultPreferences.theme,
      setTheme: (theme) => set({ theme }),

      // Currency
      currency: defaultPreferences.currency,
      setCurrency: (currency) => set({ currency }),

      // Explorer preferences
      explorer: defaultPreferences.explorer,
      setExplorerPreference: (key, value) =>
        set((state) => ({
          explorer: { ...state.explorer, [key]: value },
        })),

      // Saved addresses
      savedAddresses: defaultPreferences.savedAddresses,
      addSavedAddress: (address) =>
        set((state) => {
          // Don't add duplicates
          if (state.savedAddresses.some((a) => a.address === address.address)) {
            return state;
          }
          return {
            savedAddresses: [...state.savedAddresses, address],
          };
        }),
      removeSavedAddress: (address) =>
        set((state) => ({
          savedAddresses: state.savedAddresses.filter(
            (a) => a.address !== address
          ),
        })),
      updateSavedAddress: (address, updates) =>
        set((state) => ({
          savedAddresses: state.savedAddresses.map((a) =>
            a.address === address ? { ...a, ...updates } : a
          ),
        })),

      // Recent searches
      recentSearches: defaultPreferences.recentSearches,
      addRecentSearch: (search) =>
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== search);
          return {
            recentSearches: [search, ...filtered].slice(0, 10), // Keep last 10
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Reset
      resetPreferences: () =>
        set({
          addressFormat: defaultPreferences.addressFormat,
          theme: defaultPreferences.theme,
          currency: defaultPreferences.currency,
          explorer: defaultPreferences.explorer,
          savedAddresses: [],
          recentSearches: [],
        }),
    }),
    {
      name: "selendra-terminal-preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        addressFormat: state.addressFormat,
        theme: state.theme,
        currency: state.currency,
        explorer: state.explorer,
        savedAddresses: state.savedAddresses,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

/**
 * Hook to get the preferred address format for a specific address type
 * Returns the format to display based on user preference and address type
 */
export function usePreferredAddressDisplay(addressType: "substrate" | "evm"): {
  showAsPrimary: "substrate" | "evm";
  showToggle: boolean;
} {
  const { addressFormat } = usePreferences();

  if (addressFormat === "both") {
    return {
      showAsPrimary: addressType,
      showToggle: true,
    };
  }

  return {
    showAsPrimary: addressFormat,
    showToggle: true, // Always allow toggle
  };
}
