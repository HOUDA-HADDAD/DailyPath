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
        // Tokens sémantiques (voir globals.css).
        // L'app n'utilise QUE ces tokens : changer de palette se fait en
        // modifiant les variables CSS, sans toucher aux composants.
        // (Les accents d'activité réutilisent les palettes Tailwind natives —
        // violet, blue, teal, green, amber, rose — via lib/theme/accent.ts.)
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
