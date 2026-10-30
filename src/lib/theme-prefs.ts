import {
  ACCENT_SWATCHES,
  type AccentId,
  type ThemeMode,
} from "@/lib/settings-preferences";
import { ACCENT_COOKIE, THEME_COOKIE } from "@/lib/theme";

export { THEME_COOKIE };

export function resolveThemeMode(stored: ThemeMode | undefined): "light" | "dark" {
  if (stored === "light" || stored === "dark") return stored;
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return "dark";
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

export function readThemeModeFromCookie(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark|system)`),
  );
  const value = match?.[1];
  if (value === "light" || value === "dark" || value === "system") return value;
  return "dark";
}

export function accentColor(id: AccentId): string {
  return ACCENT_SWATCHES.find((s) => s.id === id)?.color ?? "#8FA992";
}

const FALLBACK_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

export function listTimezones(): string[] {
  try {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone").slice().sort();
    }
  } catch {
    /* unsupported */
  }
  return FALLBACK_TIMEZONES;
}

export function formatTimezoneLabel(tz: string, at = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const offset =
      parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return offset ? `${tz} (${offset})` : tz;
  } catch {
    return tz;
  }
}
