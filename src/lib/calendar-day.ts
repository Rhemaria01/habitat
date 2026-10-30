import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { todayKey } from "@/lib/dates";
import type { HabitBehaviorType, HabitLog, HabitWithLogs } from "@/lib/types";

export type CalendarHabitOutcome =
  | "completed"
  | "partial"
  | "missed"
  | "not_scheduled"
  | "before_start"
  | "future";

export function timeWindowLabel(
  window: string | null | undefined,
  plannedTime: string | null | undefined,
): string {
  if (window === "morning") return "Morning";
  if (window === "afternoon") return "Afternoon";
  if (window === "evening") return "Evening";
  if (plannedTime) return plannedTime;
  return "Anytime";
}

export function classifyDayHabit(
  habit: HabitWithLogs,
  dateKey: string,
  log: HabitLog | undefined,
  asOf: string = todayKey(),
): CalendarHabitOutcome {
  if (dateKey > asOf) return "future";
  if (dateKey < habit.start_date) return "before_start";
  if (!isHabitScheduledOn(habit, dateKey)) return "not_scheduled";

  if (!log) {
    if (habit.behavior_type === "build") return "missed";
    return "completed";
  }

  if (log.status === "partial") return "partial";
  if (log.status === "missed" || log.status === "lapse") return "missed";
  if (log.status === "skipped") return "not_scheduled";
  return "completed";
}

export function outcomeColor(status: CalendarHabitOutcome): string {
  switch (status) {
    case "completed":
      return "var(--chart-1)";
    case "partial":
      return "var(--chart-2)";
    case "missed":
      return "var(--chart-3)";
    case "before_start":
      return "color-mix(in srgb, var(--foreground) 14%, transparent)";
    default:
      return "color-mix(in srgb, var(--foreground) 18%, transparent)";
  }
}

export function canBackfillHabitDay(
  habit: { start_date: string },
  dateKey: string,
  asOf: string = todayKey(),
): boolean {
  return dateKey <= asOf && dateKey >= habit.start_date;
}

export function summarizeOutcomes(outcomes: CalendarHabitOutcome[]) {
  let completed = 0;
  let partial = 0;
  let missed = 0;
  let notScheduled = 0;
  for (const o of outcomes) {
    if (o === "completed") completed++;
    else if (o === "partial") partial++;
    else if (o === "missed") missed++;
    else if (o === "not_scheduled" || o === "future" || o === "before_start") notScheduled++;
  }
  const scheduled = completed + partial + missed;
  return { completed, partial, missed, notScheduled, scheduled };
}
