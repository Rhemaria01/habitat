"use client";

import { CALENDAR_SCENIC_DARK } from "@/lib/time-of-day";
import { cn } from "@/lib/utils";

type CalendarScenicBackdropProps = {
  /** Sidebar wash vs edge-to-edge under the month grid. */
  variant?: "panel" | "fill";
};

export function CalendarScenicBackdrop({
  variant = "panel",
}: CalendarScenicBackdropProps) {
  return (
    <div
      className={cn(
        "calendar-scenic-backdrop",
        variant === "fill" && "calendar-scenic-backdrop--fill",
      )}
      aria-hidden
    >
      <div
        className="calendar-scenic-backdrop-photo"
        style={{ backgroundImage: `url(${CALENDAR_SCENIC_DARK})` }}
      />
      <div className="calendar-scenic-backdrop-scrim" />
    </div>
  );
}
