"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  Trash2,
  ArrowRight,
  Loader2,
  Box,
  FileText,
  User,
  Coins,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import {
  detectSearchType,
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
  SearchHistoryItem,
  SearchResultType,
} from "@/lib/search";

interface SearchSuggestion {
  type: "history" | "suggestion";
  query: string;
  resultType: SearchResultType;
  label: string;
  icon: React.ReactNode;
  url: string;
}

// Get icon component for result type
function getResultIcon(type: SearchResultType): React.ReactNode {
  switch (type) {
    case "block":
      return <Box className="w-4 h-4 text-purple-400" />;
    case "transaction":
    case "evm-transaction":
      return <FileText className="w-4 h-4 text-blue-400" />;
    case "substrate-account":
      return <User className="w-4 h-4 text-cyan-400" />;
    case "evm-account":
      return <User className="w-4 h-4 text-orange-400" />;
    case "token":
    case "contract":
      return <Coins className="w-4 h-4 text-yellow-400" />;
    default:
      return <Search className="w-4 h-4 text-foreground-secondary" />;
  }
}

// Format label for result type
function getResultLabel(type: SearchResultType): string {
  switch (type) {
    case "block":
      return "Block";
    case "transaction":
      return "Transaction";
    case "evm-transaction":
      return "EVM Transaction";
    case "substrate-account":
      return "Substrate Account";
    case "evm-account":
      return "EVM Account";
    case "token":
      return "Token";
    case "contract":
      return "Contract";
    default:
      return "";
  }
}

// Truncate display text
function truncateDisplay(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, 10)}...${text.slice(-8)}`;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: () => void;
}

export function SearchBar({
  className,
  placeholder = "Search by Address / Txn Hash / Block / Token",
  autoFocus = false,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history on mount
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Generate suggestions based on query
  const generateSuggestions = useCallback(
    (searchQuery: string): SearchSuggestion[] => {
      const trimmed = searchQuery.trim();
      const results: SearchSuggestion[] = [];

      // If empty, show history
      if (!trimmed) {
        return history.slice(0, 5).map((item) => ({
          type: "history" as const,
          query: item.query,
          resultType: item.type,
          label: getResultLabel(item.type),
          icon: getResultIcon(item.type),
          url: getUrlForQuery(item.query, item.type),
        }));
      }

      // Detect search type and add as suggestion
      const detected = detectSearchType(trimmed);
      if (detected.type !== "not-found" && detected.redirectUrl) {
        results.push({
          type: "suggestion",
          query: trimmed,
          resultType: detected.type,
          label: getResultLabel(detected.type),
          icon: getResultIcon(detected.type),
          url: detected.redirectUrl,
        });
      }

      // Add matching history items
      const matchingHistory = history
        .filter(
          (item) =>
            item.query.toLowerCase().includes(trimmed.toLowerCase()) &&
            item.query !== trimmed
        )
        .slice(0, 3)
        .map((item) => ({
          type: "history" as const,
          query: item.query,
          resultType: item.type,
          label: getResultLabel(item.type),
          icon: getResultIcon(item.type),
          url: getUrlForQuery(item.query, item.type),
        }));

      return [...results, ...matchingHistory];
    },
    [history]
  );

  // Get URL for a query based on type
  function getUrlForQuery(q: string, type: SearchResultType): string {
    switch (type) {
      case "block":
        return `/blocks/${q}`;
      case "transaction":
      case "evm-transaction":
        return `/tx/${q}`;
      case "substrate-account":
      case "evm-account":
        return `/address/${q}`;
      case "token":
      case "contract":
        return `/tokens/${q}`;
      default:
        return `/search?q=${encodeURIComponent(q)}`;
    }
  }

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [query, generateSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);

    try {
      const result = detectSearchType(trimmed);

      if (result.type === "not-found") {
        toast.error("Invalid search query. Try a block number, tx hash, or address.");
        setIsSearching(false);
        return;
      }

      // Add to history
      addToSearchHistory(trimmed, result.type);
      setHistory(getSearchHistory());

      // Navigate
      if (result.redirectUrl) {
        router.push(result.redirectUrl);
        setQuery("");
        setIsOpen(false);
        onSearch?.();
      }
    } catch (error) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: SearchSuggestion) => {
    addToSearchHistory(suggestion.query, suggestion.resultType);
    setHistory(getSearchHistory());
    router.push(suggestion.url);
    setQuery("");
    setIsOpen(false);
    onSearch?.();
  };

  // Handle clearing history
  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setHistory([]);
    setSuggestions([]);
    toast.success("Search history cleared");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasHistory = history.length > 0;
  const showDropdown = isOpen && (suggestions.length > 0 || (hasHistory && !query.trim()));

  return (
    <div className={clsx("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="input w-full pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground transition-colors"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in"
        >
          {/* History header */}
          {!query.trim() && hasHistory && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-xs text-foreground-secondary uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent Searches
              </span>
              <button
                onClick={handleClearHistory}
                className="text-xs text-foreground-secondary hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          )}

          {/* Suggestions list */}
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.query}-${index}`}>
                <button
                  onClick={() => handleSelect(suggestion)}
                  className={clsx(
                    "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                    selectedIndex === index
                      ? "bg-selendra-500/20 text-foreground"
                      : "hover:bg-background-hover text-foreground-secondary"
                  )}
                >
                  <div className="flex-shrink-0">{suggestion.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">
                      {truncateDisplay(suggestion.query, 40)}
                    </div>
                    <div className="text-xs text-foreground-secondary flex items-center gap-2">
                      {suggestion.type === "history" && (
                        <Clock className="w-3 h-3" />
                      )}
                      {suggestion.label}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>

          {/* Empty state */}
          {suggestions.length === 0 && query.trim() && (
            <div className="px-4 py-6 text-center text-foreground-secondary">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">
                Try a block number, transaction hash, or address
              </p>
            </div>
          )}

          {/* Search tip */}
          <div className="px-4 py-2 border-t border-border bg-background-secondary">
            <p className="text-xs text-foreground-secondary">
              Press <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded text-foreground-secondary">Enter</kbd> to search
              or <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded text-foreground-secondary">↑↓</kbd> to navigate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
