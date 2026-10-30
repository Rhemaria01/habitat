import {
  DEFAULT_SETTINGS_PREFERENCES,
  type AccentId,
  type SettingsPreferences,
  type ThemeMode,
} from "@/lib/settings-preferences";
import { ACCENT_COOKIE, THEME_COOKIE } from "@/lib/theme";
import { isAccentId } from "@/lib/appearance-tokens";

export type AppearanceState = Pick<
  SettingsPreferences,
  "theme_mode" | "accent"
>;

export function resolveThemeMode(stored: ThemeMode | undefined): "light" | "dark" {
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return "dark";
}

export function readAppearanceFromCookies(): AppearanceState {
  if (typeof document === "undefined") {
    return {
      theme_mode: DEFAULT_SETTINGS_PREFERENCES.theme_mode,
      accent: DEFAULT_SETTINGS_PREFERENCES.accent,
    };
  }

  const themeMatch = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark|system)`),
  );
  const themeRaw = themeMatch?.[1];
  const theme_mode: ThemeMode =
    themeRaw === "light" || themeRaw === "dark" || themeRaw === "system"
      ? themeRaw
      : DEFAULT_SETTINGS_PREFERENCES.theme_mode;

  const accentMatch = document.cookie.match(
    new RegExp(
      `(?:^|; )${ACCENT_COOKIE}=(green|purple|blue|orange|pink|teal)`,
    ),
  );
  const accentRaw = accentMatch?.[1];
  const accent: AccentId = isAccentId(accentRaw)
    ? accentRaw
    : DEFAULT_SETTINGS_PREFERENCES.accent;

  return { theme_mode, accent };
}

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveThemeMode(mode === "system" ? undefined : mode);
  document.documentElement.dataset.theme = resolved;
  document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

export function applyAccent(accent: AccentId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = accent;
  document.cookie = `${ACCENT_COOKIE}=${accent}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Single entry point: sync theme + accent to the document and cookies. */
export function applyAppearance(state: AppearanceState) {
  applyThemeMode(state.theme_mode);
  applyAccent(state.accent);
}

export function resolvedThemeFromMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return "dark";
}

export function toggleThemeMode(current: ThemeMode): ThemeMode {
  const resolved = resolvedThemeFromMode(current);
  return resolved === "light" ? "dark" : "light";
}
