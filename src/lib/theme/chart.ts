"use client";

import { useTheme } from "./provider";

/**
 * Couleurs des graphiques Recharts, adaptées au thème. Recharts reçoit des
 * couleurs en props (pas de classes CSS), d'où ce hook plutôt que Tailwind.
 */
export interface ChartColors {
  text: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  barCurrent: string;
  barPrevious: string;
  line: string;
  areaStop: string;
  /** Dégradé bas -> haut pour la répartition par catégorie (5 paliers). */
  breakdown: [string, string, string, string, string];
}

const LIGHT: ChartColors = {
  text: "#3a3a37",
  grid: "#e3ebe5",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e3ebe5",
  barCurrent: "#41654e",
  barPrevious: "#a1bca8",
  line: "#41654e",
  areaStop: "#557d63",
  breakdown: ["#c7d7cb", "#a1bca8", "#749b7f", "#557d63", "#41654e"],
};

const DARK: ChartColors = {
  text: "#9caa9e",
  grid: "#2f3a33",
  tooltipBg: "#1e2621",
  tooltipBorder: "#34423a",
  barCurrent: "#85b291",
  barPrevious: "#4a6b56",
  line: "#85b291",
  areaStop: "#85b291",
  breakdown: ["#3a4d40", "#4a6b56", "#5f8a6c", "#7aa787", "#95c2a2"],
};

export function useChartColors(): ChartColors {
  return useTheme().theme === "dark" ? DARK : LIGHT;
}

/** Palier 0..4 selon la valeur (0..100), pour le dégradé de la répartition. */
export function breakdownBucket(value: number): number {
  if (value >= 80) return 4;
  if (value >= 60) return 3;
  if (value >= 40) return 2;
  if (value >= 20) return 1;
  return 0;
}
