"use client";

import { scenicBackgroundNow } from "@/lib/time-of-day";
import { cn } from "@/lib/utils";

type CalendarScenicBackdropProps = {
  /** Sidebar wash vs edge-to-edge under the month grid. */
  variant?: "panel" | "fill";
};

export function CalendarScenicBackdrop({
  variant = "panel",
}: CalendarScenicBackdropProps) {
  const photo = scenicBackgroundNow();

  return (
    <div
      className={cn(
        "calendar-scenic-backdrop",
        variant === "fill" && "calendar-scenic-backdrop--fill",
      )}
      aria-hidden
      style={{ backgroundImage: `url(${photo})` }}
    />
  );
}
