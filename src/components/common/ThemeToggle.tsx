"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "icon") {
    return (
      <button
        onClick={toggleTheme}
        className={clsx(
          "p-2 rounded-lg transition-all duration-200",
          "hover:bg-background-hover",
          "text-foreground-secondary hover:text-foreground",
          className
        )}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <div className={clsx("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={clsx(
          "p-2 rounded-lg transition-all duration-200",
          "hover:bg-background-hover",
          "text-foreground-secondary hover:text-foreground"
        )}
        title="Theme settings"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-border bg-background-card shadow-lg z-50 animate-fade-in overflow-hidden">
          <button
            onClick={() => {
              setTheme("light");
              setShowDropdown(false);
            }}
            className={clsx(
              "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
              "hover:bg-background-hover",
              theme === "light"
                ? "text-selendra-500 bg-selendra-500/10"
                : "text-foreground-secondary"
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            onClick={() => {
              setTheme("dark");
              setShowDropdown(false);
            }}
            className={clsx(
              "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
              "hover:bg-background-hover",
              theme === "dark"
                ? "text-selendra-500 bg-selendra-500/10"
                : "text-foreground-secondary"
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            onClick={() => {
              setTheme("system");
              setShowDropdown(false);
            }}
            className={clsx(
              "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors",
              "hover:bg-background-hover",
              theme === "system"
                ? "text-selendra-500 bg-selendra-500/10"
                : "text-foreground-secondary"
            )}
          >
            <Monitor className="h-4 w-4" />
            System
          </button>
        </div>
      )}
    </div>
  );
}
