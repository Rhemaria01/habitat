export const THEME_COOKIE = "habitat-theme";

export type Theme = "dark" | "light";

export function normalizeTheme(value: string | undefined): Theme {
  return value === "light" ? "light" : "dark";
}
