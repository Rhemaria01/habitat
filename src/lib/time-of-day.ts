/** Time-of-day bucket for scenic backgrounds and copy. */

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

/** Single scenic photo for the Today dashboard (main column). */
export const TODAY_SCENIC_IMAGE = "/images/scenery-today.jpg";

const SCENIC_BY_PERIOD: Record<DayPeriod, string> = {
  morning: "/images/scenery-morning.jpg",
  afternoon: "/images/scenery-afternoon.jpg",
  evening: "/images/scenery-evening.jpg",
  night: "/images/scenery-night.jpg",
};

/** Solid fill matched to the lower edge of the photo (CSS `--scenic-fade`). */
export const SCENIC_FADE_COLOR = "#202321";

/** Local hour → morning / afternoon / evening / night. */
export function getDayPeriod(at: Date = new Date()): DayPeriod {
  const hour = at.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function scenicBackgroundForPeriod(period?: DayPeriod): string {
  return SCENIC_BY_PERIOD[period ?? getDayPeriod()];
}

export function scenicBackgroundNow(): string {
  return scenicBackgroundForPeriod(getDayPeriod());
}

export function timeGreeting(at: Date = new Date()): string {
  const hour = at.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}
