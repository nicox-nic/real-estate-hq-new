import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette per PRD
        // ivory background, soft charcoal typography, champagne gold accents,
        // sage green success, deep navy authority, muted terracotta warmth.
        canvas: {
          DEFAULT: "#FBF8F3", // premium ivory
          raised: "#FFFFFF",
          sunken: "#F4F0E8",
        },
        ink: {
          DEFAULT: "#2B2A28", // soft charcoal
          muted: "#6B6864",
          subtle: "#9A968F",
          inverse: "#FBF8F3",
        },
        gold: {
          DEFAULT: "#C9A961", // champagne gold
          soft: "#E8D9B8",
          deep: "#A88B4A",
        },
        sage: {
          DEFAULT: "#5B7A5A", // success / sage green
          soft: "#D6E2D4",
          deep: "#3F5A3E",
        },
        navy: {
          DEFAULT: "#1F2A44", // deep navy authority
          soft: "#D5DAE4",
          deep: "#141C30",
        },
        terracotta: {
          DEFAULT: "#B8694F", // muted terracotta warmth
          soft: "#EBD3C8",
          deep: "#8E4F38",
        },
        // Functional aliases
        line: "#E8E3D8",
        "line-soft": "#F0EBE0",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(43, 42, 40, 0.04), 0 1px 3px 0 rgba(43, 42, 40, 0.06)",
        card: "0 2px 8px -2px rgba(43, 42, 40, 0.06), 0 4px 16px -4px rgba(43, 42, 40, 0.04)",
        lift: "0 8px 24px -8px rgba(43, 42, 40, 0.12), 0 4px 12px -4px rgba(43, 42, 40, 0.06)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
