export type AccentId = "green" | "purple" | "blue" | "orange" | "pink" | "teal";

export type ThemeMode = "light" | "dark" | "system";

export type SettingsPreferences = {
  accent: AccentId;
  theme_mode: ThemeMode;
  daily_reminder: boolean;
  reminder_time: string;
  weekly_summary: boolean;
};

export const ACCENT_SWATCHES: { id: AccentId; color: string; label: string }[] = [
  { id: "green", color: "#8FA992", label: "Green" },
  { id: "purple", color: "#A898C4", label: "Purple" },
  { id: "blue", color: "#9BA8C4", label: "Blue" },
  { id: "orange", color: "#C4A574", label: "Orange" },
  { id: "pink", color: "#C4908F", label: "Pink" },
  { id: "teal", color: "#8EB5B8", label: "Teal" },
];

export const REMINDER_TIME_OPTIONS = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "12:00 PM",
  "6:00 PM",
  "8:00 PM",
  "9:00 PM",
] as const;

export const DEFAULT_SETTINGS_PREFERENCES: SettingsPreferences = {
  accent: "green",
  theme_mode: "dark",
  daily_reminder: true,
  reminder_time: "8:00 PM",
  weekly_summary: true,
};

export function parseSettingsPreferences(
  raw: unknown,
): SettingsPreferences {
  const base = { ...DEFAULT_SETTINGS_PREFERENCES };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;

  const accent = o.accent;
  if (
    accent === "green" ||
    accent === "purple" ||
    accent === "blue" ||
    accent === "orange" ||
    accent === "pink" ||
    accent === "teal"
  ) {
    base.accent = accent;
  }

  const themeMode = o.theme_mode;
  if (themeMode === "light" || themeMode === "dark" || themeMode === "system") {
    base.theme_mode = themeMode;
  }

  if (typeof o.daily_reminder === "boolean") {
    base.daily_reminder = o.daily_reminder;
  }
  if (typeof o.reminder_time === "string" && o.reminder_time.trim()) {
    base.reminder_time = o.reminder_time;
  }
  if (typeof o.weekly_summary === "boolean") {
    base.weekly_summary = o.weekly_summary;
  }

  return base;
}

export function preferencesFromProfile(
  onboarding: Record<string, unknown>,
): SettingsPreferences {
  return parseSettingsPreferences(onboarding.preferences);
}
