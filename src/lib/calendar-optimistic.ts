import type {
  CalendarDay,
  CalendarDayDetail,
  CalendarDayHabitRow,
  CalendarDaySegment,
  CalendarDayState,
  CalendarMonth,
} from "@/app/actions/calendar";
import {
  summarizeOutcomes,
  type CalendarHabitOutcome,
} from "@/lib/calendar-day";
import type { HabitBehaviorType, HabitLog, HabitLogStatus } from "@/lib/types";

export function outcomeFromLogStatus(
  behavior: HabitBehaviorType,
  status: HabitLogStatus | null,
): CalendarHabitOutcome {
  if (!status) {
    return behavior === "build" ? "missed" : "completed";
  }
  if (status === "partial") return "partial";
  if (status === "missed" || status === "lapse") return "missed";
  if (status === "skipped") return "not_scheduled";
  return "completed";
}

export function isCelebrationStatus(
  behavior: HabitBehaviorType,
  status: HabitLogStatus | null,
): boolean {
  if (!status) return false;
  if (behavior === "build") return status === "completed" || status === "partial";
  return status === "maintained";
}

function stateFromSegmentOutcomes(outcomes: CalendarHabitOutcome[]): {
  state: CalendarDayState;
  adherence: number | null;
} {
  const { completed, partial, missed, scheduled } = summarizeOutcomes(outcomes);
  if (scheduled === 0) return { state: "none", adherence: null };
  const done = completed + partial * 0.5;
  const adherence = Math.round((done / scheduled) * 100);
  if (completed === scheduled) return { state: "complete", adherence: 100 };
  if (completed > 0 || partial > 0) return { state: "partial", adherence };
  return { state: "none", adherence: 0 };
}

function adjustCount(
  counts: Pick<CalendarDay, "completed" | "partial" | "missed">,
  outcome: CalendarHabitOutcome,
  delta: number,
) {
  if (outcome === "completed") counts.completed += delta;
  else if (outcome === "partial") counts.partial += delta;
  else if (outcome === "missed") counts.missed += delta;
}

function patchSegmentsForColor(
  segments: CalendarDaySegment[],
  color: string,
  nextOutcome: CalendarHabitOutcome,
): CalendarDaySegment[] {
  if (
    nextOutcome === "not_scheduled" ||
    nextOutcome === "future" ||
    nextOutcome === "before_start"
  ) {
    return segments.filter((s) => s.color !== color);
  }

  const rank: Record<CalendarHabitOutcome, number> = {
    completed: 0,
    partial: 1,
    missed: 2,
    not_scheduled: 3,
    before_start: 4,
    future: 5,
  };

  let found = false;
  const next = segments.map((s) => {
    if (s.color !== color) return s;
    found = true;
    return { ...s, outcome: nextOutcome };
  });
  if (!found) next.push({ color, outcome: nextOutcome });
  next.sort((a, b) => rank[a.outcome] - rank[b.outcome]);
  return next.slice(0, 3);
}

function patchCalendarDayCell(
  day: CalendarDay,
  dateKey: string,
  habitColor: string,
  prevOutcome: CalendarHabitOutcome | null,
  nextOutcome: CalendarHabitOutcome,
): CalendarDay {
  if (day.dateKey !== dateKey) return day;

  const counts = {
    completed: day.completed,
    partial: day.partial,
    missed: day.missed,
  };
  if (prevOutcome && prevOutcome !== "not_scheduled") {
    adjustCount(counts, prevOutcome, -1);
  }
  if (nextOutcome !== "not_scheduled") {
    adjustCount(counts, nextOutcome, 1);
  }

  const segments = patchSegmentsForColor(day.segments, habitColor, nextOutcome);
  const { state, adherence } = stateFromSegmentOutcomes(
    segments.map((s) => s.outcome),
  );

  return {
    ...day,
    segments,
    completed: Math.max(0, counts.completed),
    partial: Math.max(0, counts.partial),
    missed: Math.max(0, counts.missed),
    state,
    adherence,
  };
}

export function patchCalendarMonthForLog(
  month: CalendarMonth,
  input: {
    dateKey: string;
    habitColor: string;
    prevOutcome: CalendarHabitOutcome | null;
    nextOutcome: CalendarHabitOutcome;
    log: HabitLog | null;
    singleHabit?: boolean;
  },
): CalendarMonth {
  const days = month.days.map((day) => {
    const patched = patchCalendarDayCell(
      day,
      input.dateKey,
      input.habitColor,
      input.prevOutcome,
      input.nextOutcome,
    );
    if (input.singleHabit && patched.dateKey === input.dateKey) {
      return { ...patched, log: input.log };
    }
    return patched;
  });

  return { ...month, days };
}

export function patchCalendarDayDetailForLog(
  detail: CalendarDayDetail,
  input: {
    habitId: string;
    behavior: HabitBehaviorType;
    dateKey: string;
    log: HabitLog | null;
  },
): CalendarDayDetail {
  if (detail.dateKey !== input.dateKey) return detail;

  const habits: CalendarDayHabitRow[] = detail.habits.map((h) => {
    if (h.id !== input.habitId) return h;
    const outcome = h.scheduled
      ? outcomeFromLogStatus(h.behavior_type, input.log?.status ?? null)
      : "not_scheduled";
    return {
      ...h,
      log: input.log,
      outcome,
    };
  });

  const scheduledOutcomes = habits
    .filter((r) => r.scheduled && r.outcome !== "future")
    .map((r) => r.outcome);

  return {
    ...detail,
    habits,
    summary: summarizeOutcomes(scheduledOutcomes),
  };
}

export function buildOptimisticLog(
  habitId: string,
  dateKey: string,
  status: HabitLogStatus | null,
): HabitLog | null {
  if (!status) return null;
  const now = new Date().toISOString();
  return {
    id: `optimistic-${dateKey}`,
    habit_id: habitId,
    log_date: dateKey,
    status,
    note: null,
    numeric_value: null,
    completion_level: null,
    created_at: now,
    updated_at: now,
  };
}
