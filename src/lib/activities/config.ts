// =============================================================================
// SOURCE UNIQUE DE VÉRITÉ des activités suivies.
// -----------------------------------------------------------------------------
// Le formulaire du jour, le scoring, le dashboard et toutes les analyses
// lisent CETTE configuration. Pour ajouter une habitude plus tard :
//   1. ajouter un objet dans ACTIVITIES (+ une catégorie si besoin) ;
//   2. choisir un "storage" :
//        - colonne(s) dédiée(s)  -> ajouter la colonne via une migration SQL ;
//        - "jsonb_key"           -> AUCUNE migration : stocké dans responses[key].
//   3. ajouter les libellés dans les dictionnaires i18n (en.ts / ar.ts).
// Rien d'autre à modifier : le reste du site s'adapte automatiquement.
// =============================================================================

export type ActivityType = "multi_checkbox" | "scale" | "boolean";

/** Une option d'échelle et le score (0..1) qu'elle vaut pour la complétion. */
export type ScaleOption = { value: string; score: number };

/**
 * Décrit comment une activité est rangée en base.
 * - "columns"        : multi-checkbox mappé sur plusieurs colonnes booléennes
 * - "jsonb_array"    : multi-checkbox stocké comme tableau JSON
 * - "enum_column"    : échelle stockée dans une colonne enum
 * - "boolean_column" : oui/non stocké dans une colonne booléenne
 * - "jsonb_key"      : ÉCHAPPATOIRE sans migration -> responses[key]
 */
export type StorageMap =
  | { kind: "columns"; columns: Record<string, string> }
  | { kind: "jsonb_array"; column: string }
  | { kind: "enum_column"; column: string }
  | { kind: "boolean_column"; column: string }
  | { kind: "jsonb_key"; key: string };

export interface ActivityConfig {
  /** Identifiant stable : sert de clé i18n et de clé de valeur de formulaire. */
  id: string;
  /** Catégorie (voir CATEGORIES) — utilisée pour regrouper form et analyses. */
  category: string;
  type: ActivityType;
  /** Obligatoire dans le formulaire ? */
  required: boolean;
  /** Compte dans le taux de complétion quotidien ? (souvent = required) */
  countsInCompletion: boolean;
  /** Poids relatif dans le calcul de complétion. */
  weight: number;
  /** Options pour un multi_checkbox. */
  options?: string[];
  /** Valeurs + score pour une échelle. */
  scale?: ScaleOption[];
  storage: StorageMap;
}

export interface CategoryConfig {
  id: string;
  order: number;
}

// -----------------------------------------------------------------------------
// Catégories (ordre d'affichage)
// -----------------------------------------------------------------------------
export const CATEGORIES: CategoryConfig[] = [
  { id: "prayers", order: 1 },
  { id: "wird", order: 2 },
  { id: "adhkar", order: 3 },
  { id: "development", order: 4 },
  { id: "wellbeing", order: 5 },
];

// Échelles réutilisables
const SCALE_WIRD: ScaleOption[] = [
  { value: "complete", score: 1 },
  { value: "partial", score: 0.5 },
  { value: "none", score: 0 },
];
const SCALE_PROGRAM: ScaleOption[] = [
  { value: "all", score: 1 },
  { value: "partial", score: 0.5 },
  { value: "none", score: 0 },
];
const SCALE_ADHKAR: ScaleOption[] = [
  { value: "both", score: 1 },
  { value: "one", score: 0.5 },
  { value: "none", score: 0 },
];
const SCALE_REST: ScaleOption[] = [
  { value: "healthy", score: 1 },
  { value: "draining", score: 0.5 }, // score ajustable selon votre lecture
  { value: "none", score: 0 },
];

// -----------------------------------------------------------------------------
// Activités (l'ordre du tableau = ordre d'affichage à l'intérieur d'une catégorie)
// -----------------------------------------------------------------------------
export const ACTIVITIES: ActivityConfig[] = [
  // --- Prières -------------------------------------------------------------
  {
    id: "obligatory_prayers",
    category: "prayers",
    type: "multi_checkbox",
    required: true,
    countsInCompletion: true,
    weight: 1,
    options: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    storage: {
      kind: "columns",
      columns: {
        fajr: "fajr",
        dhuhr: "dhuhr",
        asr: "asr",
        maghrib: "maghrib",
        isha: "isha",
      },
    },
  },
  {
    id: "nafl_prayers",
    category: "prayers",
    type: "multi_checkbox",
    required: false,
    countsInCompletion: false,
    weight: 1,
    options: ["sunnah_fajr", "duha", "witr"],
    storage: { kind: "jsonb_array", column: "nafl_prayers" },
  },

  // --- Wird ----------------------------------------------------------------
  {
    id: "quran_wird",
    category: "wird",
    type: "scale",
    required: true,
    countsInCompletion: true,
    weight: 1,
    scale: SCALE_WIRD,
    storage: { kind: "enum_column", column: "quran_wird" },
  },
  {
    id: "hadith_wird",
    category: "wird",
    type: "scale",
    required: true,
    countsInCompletion: true,
    weight: 1,
    scale: SCALE_WIRD,
    storage: { kind: "enum_column", column: "hadith_wird" },
  },
  {
    id: "program_wird",
    category: "wird",
    type: "scale",
    required: true,
    countsInCompletion: true,
    weight: 1,
    scale: SCALE_PROGRAM,
    storage: { kind: "enum_column", column: "program_wird" },
  },

  // --- Adhkar --------------------------------------------------------------
  {
    id: "adhkar_morning_evening",
    category: "adhkar",
    type: "scale",
    required: true,
    countsInCompletion: true,
    weight: 1,
    scale: SCALE_ADHKAR,
    storage: { kind: "enum_column", column: "adhkar_morning_evening" },
  },
  {
    id: "daily_adhkar",
    category: "adhkar",
    type: "multi_checkbox",
    required: false,
    countsInCompletion: false,
    weight: 1,
    // Exemples à personnaliser librement (les libellés sont dans i18n).
    options: ["after_prayer", "before_sleep", "istighfar", "salawat"],
    storage: { kind: "jsonb_array", column: "daily_adhkar" },
  },

  // --- Développement personnel --------------------------------------------
  {
    id: "personal_reading",
    category: "development",
    type: "boolean",
    required: true,
    countsInCompletion: true,
    weight: 1,
    storage: { kind: "boolean_column", column: "personal_reading" },
  },
  {
    id: "sport",
    category: "development",
    type: "boolean",
    required: true,
    countsInCompletion: true,
    weight: 1,
    storage: { kind: "boolean_column", column: "sport" },
  },

  // --- Bien-être -----------------------------------------------------------
  {
    id: "rest",
    category: "wellbeing",
    type: "scale",
    required: true,
    countsInCompletion: true,
    weight: 1,
    scale: SCALE_REST,
    storage: { kind: "enum_column", column: "rest" },
  },
  {
    id: "silence",
    category: "wellbeing",
    type: "boolean",
    required: true,
    countsInCompletion: true,
    weight: 1,
    storage: { kind: "boolean_column", column: "silence" },
  },
];

// -----------------------------------------------------------------------------
// Note : les helpers de lecture qui opéraient sur cette liste statique ont été
// retirés. La liste affichée est désormais celle de l'utilisateur (table
// user_activities) ; utilisez les fonctions équivalentes de `scoring.ts`
// (`categoriesFrom`) et de `recurrence.ts` (`activitiesForDate`), qui prennent
// la liste en paramètre.
// -----------------------------------------------------------------------------
