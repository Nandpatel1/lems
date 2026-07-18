import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        ink: "var(--text)",
        "ink-2": "var(--text-secondary)",
        "ink-3": "var(--text-muted)",
        hair: "var(--border)",
        "hair-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-tint": "var(--accent-tint)",
        "accent-ink": "var(--accent-ink)",
        warm: "var(--warm)",
        "warm-tint": "var(--warm-tint)",
        "warm-ink": "var(--warm-ink)",
        ship: "var(--ship)",
        "ship-tint": "var(--ship-tint)",
        "ship-ink": "var(--ship-ink)",
      },
      borderRadius: {
        chip: "6px",
        control: "9px",
        card: "14px",
        hero: "18px",
      },
      transitionDuration: {
        instant: "100ms",
        quick: "160ms",
        base: "220ms",
        ship: "420ms",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
