export const THEME_COOKIE = "habitat-theme";
export const ACCENT_COOKIE = "habitat-accent";

export type Theme = "dark" | "light";
export type ThemeMode = "dark" | "light" | "system";

export function normalizeTheme(value: string | undefined): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "dark";
}

/** Resolved paint theme for SSR `data-theme` (system → dark default on server). */
export function resolveThemeForHtml(mode: ThemeMode): Theme {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return "dark";
}
