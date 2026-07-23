import type { Config } from "tailwindcss";

/**
 * Deux niveaux de couleurs :
 *  1. Palette brute (sage / sand / ink) — pour les accents et les graphiques.
 *  2. Tokens SÉMANTIQUES (bg, surface, content, border, primary…) adossés à des
 *     variables CSS définies dans globals.css. Ce sont eux qui basculent
 *     automatiquement entre thème clair et sombre. Les composants utilisent ces
 *     tokens ; ajouter/ajuster un thème = modifier les variables, rien d'autre.
 */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#f3f6f4",
          100: "#e3ebe5",
          200: "#c7d7cb",
          300: "#a1bca8",
          400: "#749b7f",
          500: "#557d63",
          600: "#41654e",
          700: "#355140",
          800: "#2c4235",
          900: "#25372d",
        },
        sand: {
          50: "#faf8f4",
          100: "#f2ede3",
          200: "#e5d9c6",
          300: "#d3bf9f",
        },
        ink: {
          700: "#3a3a37",
          800: "#2a2a28",
          900: "#1c1c1a",
        },
        // Tokens sémantiques (voir globals.css)
        bg: v("--c-bg"),
        surface: v("--c-surface"),
        "surface-2": v("--c-surface-2"),
        border: v("--c-border"),
        content: v("--c-content"),
        "content-muted": v("--c-content-muted"),
        primary: v("--c-primary"),
        "primary-fg": v("--c-primary-fg"),
        "primary-soft": v("--c-primary-soft"),
        "primary-soft-fg": v("--c-primary-soft-fg"),
        danger: v("--c-danger"),
        "danger-soft": v("--c-danger-soft"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
