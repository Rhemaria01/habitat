"use client";

import { Check, X } from "lucide-react";
import type { CalendarDaySegment } from "@/app/actions/calendar";
import type { CalendarHabitOutcome } from "@/lib/calendar-day";
import { CalendarDayDots, CalendarDayRing } from "@/components/CalendarDayRing";

type CalendarDayCellVisualProps = {
  segments: CalendarDaySegment[];
  mode: "multi" | "single";
  cellState?: "none" | "partial" | "complete" | "future" | "before";
  dimmed?: boolean;
};

function primaryOutcome(segments: CalendarDaySegment[]): CalendarHabitOutcome | null {
  return segments[0]?.outcome ?? null;
}

export function CalendarDayCellVisual({
  segments,
  mode,
  cellState,
  dimmed,
}: CalendarDayCellVisualProps) {
  const outcome = primaryOutcome(segments);

  if (mode === "single") {
    if (cellState === "before" || outcome === "before_start") {
      return <span className="cal-day-mark dash">—</span>;
    }
    if (cellState === "future" || outcome === "future") {
      return <span className="cal-day-mark empty" aria-hidden />;
    }
    if (outcome === "not_scheduled") {
      return <span className="cal-day-mark dash muted">—</span>;
    }
    if (outcome === "completed") {
      return (
        <span className="cal-day-mark tick" aria-hidden>
          <Check className="size-5" strokeWidth={3} />
        </span>
      );
    }
    if (outcome === "missed") {
      return (
        <span className="cal-day-mark cross" aria-hidden>
          <X className="size-5" strokeWidth={3} />
        </span>
      );
    }
    if (outcome === "partial") {
      return (
        <span className="cal-day-mark partial" aria-hidden>
          <Check className="size-4" strokeWidth={2.5} />
        </span>
      );
    }
    return <span className="cal-day-mark dash muted">—</span>;
  }

  if (segments.length === 0) {
    if (cellState === "future") return <span className="cal-day-mark empty" aria-hidden />;
    return <span className="cal-day-mark dash muted">—</span>;
  }

  return (
    <>
      <CalendarDayRing segments={segments} dimmed={dimmed} />
      <CalendarDayDots segments={segments} />
    </>
  );
}
