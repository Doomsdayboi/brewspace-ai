import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core BrewSpace — The Modern Coffeehouse / Cozy Futurism palette
        espresso: "#352A24",
        "espresso-hover": "#4B3930",
        "warm-cream": "#F7F3EA",
        porcelain: "#FFFCF7",
        "fresh-milk": "#FFFFFF",
        "oat-milk": "#F1E9DE",
        "quiet-stone": "#62574F",
        "border-subtle": "#D7C7B9",
        "border-strong": "#9A8577",
        "focus-ring": "#3C5A45",

        // Material-compatible tokens used in Blueprint screens
        primary: "#352A24",
        "on-primary": "#F7F3EA",
        "primary-container": "#4B3930",
        secondary: "#56715D",
        "on-secondary": "#FFFFFF",
        tertiary: "#985239",
        "on-tertiary": "#FFFFFF",
        surface: "#FDF9F0",
        "surface-container-low": "#F7F3EA",
        "surface-container": "#F1EEE5",
        "surface-container-high": "#ECE8DF",
        "surface-container-highest": "#E6E2D9",
        "on-surface": "#352A24",
        "on-surface-variant": "#62574F",

        // Module accents (subtle cues, WCAG AA foregrounds)
        "flow-bg": "#E6EDE3",
        "flow-text": "#3C5A45",
        "connect-bg": "#F3DFD5",
        "connect-text": "#7E3F2D",
        "circles-bg": "#F3E6C9",
        "circles-text": "#72531B",
        "accent-sage": "#788A72",
        "accent-terracotta": "#BD7656",
        "accent-honey": "#B78B42",

        // Semantic feedback
        "success-bg": "#E6EDE3",
        "success-text": "#3C5A45",
        "warning-bg": "#F3E6C9",
        "warning-text": "#72531B",
        "error-bg": "#FAE3DF",
        "error-text": "#9C3B33",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ceramic: "0 6px 24px rgba(53, 42, 36, 0.07)",
        subtle: "0 1px 8px rgba(53, 42, 36, 0.04)",
      },
      borderRadius: {
        card: "18px",
        panel: "24px",
        field: "12px",
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
