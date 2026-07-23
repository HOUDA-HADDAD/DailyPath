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
  text: "#3b3345",
  grid: "#e8e1f0",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e8e1f0",
  barCurrent: "#6b4c9a",
  barPrevious: "#c2acd9",
  line: "#6b4c9a",
  areaStop: "#8565b5",
  breakdown: ["#ddd0ed", "#c2acd9", "#a486c7", "#8565b5", "#6b4c9a"],
};

const DARK: ChartColors = {
  text: "#b8a9c9",
  grid: "#342b3d",
  tooltipBg: "#211b29",
  tooltipBorder: "#453956",
  barCurrent: "#b08ad9",
  barPrevious: "#62447f",
  line: "#b08ad9",
  areaStop: "#b08ad9",
  breakdown: ["#3d3048", "#62447f", "#7d5ca0", "#9874bb", "#c09ae8"],
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
