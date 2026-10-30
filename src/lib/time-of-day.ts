/** Time-of-day bucket for scenic backgrounds and copy. */

import type { Theme } from "@/lib/theme";

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

/** Single scenic photo for the Today dashboard (main column). */
export const TODAY_SCENIC_IMAGE = "/images/scenery-today.jpg";
export const TODAY_SCENIC_IMAGE_LIGHT = "/images/scenery-today-light.jpg";
export const SIDEBAR_MOTIF_LIGHT = "/images/sidebar-motif-light.jpg";

const SCENIC_BY_PERIOD: Record<DayPeriod, string> = {
  morning: "/images/scenery-morning.jpg",
  afternoon: "/images/scenery-afternoon.jpg",
  evening: "/images/scenery-evening.jpg",
  night: "/images/scenery-night.jpg",
};

const SCENIC_LIGHT_BY_PERIOD: Record<DayPeriod, string> = {
  morning: "/images/scenery-morning-light.jpg",
  afternoon: "/images/scenery-afternoon-light.jpg",
  evening: "/images/scenery-evening-light.jpg",
  night: "/images/scenery-night-light.jpg",
};

/** Solid fill matched to the lower edge of the photo (CSS `--scenic-fade`). */
export const SCENIC_FADE_COLOR = "#202321";
export const SCENIC_FADE_COLOR_LIGHT = "#e8e9df";

/** Local hour → morning / afternoon / evening / night. */
export function getDayPeriod(at: Date = new Date()): DayPeriod {
  const hour = at.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function scenicBackgroundForPeriod(
  period?: DayPeriod,
  theme: Theme = "dark",
): string {
  const bucket = period ?? getDayPeriod();
  return theme === "light"
    ? SCENIC_LIGHT_BY_PERIOD[bucket]
    : SCENIC_BY_PERIOD[bucket];
}

export function scenicBackgroundNow(theme: Theme = "dark"): string {
  return scenicBackgroundForPeriod(getDayPeriod(), theme);
}

export function timeGreeting(at: Date = new Date()): string {
  const hour = at.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}
