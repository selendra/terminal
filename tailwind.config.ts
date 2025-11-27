import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Selendra Teal brand colors (official)
        selendra: {
          50: "#e6faf8",
          100: "#b3f0ea",
          200: "#80e6dc",
          300: "#4ddcce",
          400: "#26d4c3",
          500: "#0db0a4",
          600: "#0a9389",
          700: "#087670",
          800: "#065a56",
          900: "#043d3b",
        },
        // Background colors
        background: {
          DEFAULT: "#0a0a0b",
          secondary: "#111113",
          tertiary: "#18181b",
          card: "#1a1a1d",
          hover: "#252529",
        },
        // Accent colors
        accent: {
          green: "#10b981",
          red: "#ef4444",
          yellow: "#f59e0b",
          purple: "#8b5cf6",
          blue: "#3b82f6",
          teal: "#0db0a4",
        },
        // Border colors
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
      },
      fontFamily: {
        sans: ["Montserrat", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(13, 176, 164, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(13, 176, 164, 0.8)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "selendra-gradient":
          "linear-gradient(135deg, #0db0a4 0%, #26d4c3 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
