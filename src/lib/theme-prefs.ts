import type { AccentId, ThemeMode } from "@/lib/settings-preferences";
import { accentSwatchColor } from "@/lib/appearance-tokens";
import { readAppearanceFromCookies } from "@/lib/appearance";

export {
  applyAccent,
  applyAppearance,
  applyThemeMode,
  readAppearanceFromCookies,
  resolveThemeMode,
  resolvedThemeFromMode,
  toggleThemeMode,
} from "@/lib/appearance";
export { THEME_COOKIE } from "@/lib/theme";

export function readThemeModeFromCookie(): ThemeMode {
  return readAppearanceFromCookies().theme_mode;
}

export function accentColor(id: AccentId): string {
  return accentSwatchColor(id);
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
