/** Habitat — Warm Graphite + Editorial Light (flat accents, no gradients). */

export const habitatPalette = {
  background: "#202321",
  sidebar: "#292E2B",
  surface: "#313834",
  elevated: "#3B443E",
  textPrimary: "#E8E9DF",
  textSecondary: "#AEB7AD",
  border: "rgba(232, 233, 223, 0.12)",
  borderStrong: "rgba(232, 233, 223, 0.2)",
} as const;

/** Six accent swatches — habits, progress, charts, meaningful states only. */
export const habitatAccents = {
  green: "#8FA992",
  blue: "#9BA8C4",
  orange: "#C4A574",
  rose: "#C4908F",
  purple: "#A898C4",
  cyan: "#8EB5B8",
} as const;

export const HABIT_PICKER_COLORS = [
  habitatAccents.green,
  habitatAccents.blue,
  habitatAccents.orange,
  habitatAccents.purple,
  habitatAccents.cyan,
  habitatAccents.rose,
] as const;

export const behaviorAccent = {
  build: habitatAccents.green,
  reduce: habitatAccents.orange,
  avoid: habitatAccents.rose,
} as const;
