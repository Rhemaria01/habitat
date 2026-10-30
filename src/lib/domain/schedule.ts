import { daysBetween, parseDateKey } from "@/lib/dates";
import type { Habit } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/domain/schedule-form";

/** JS getDay(): 0=Sun … 6=Sat */
export function weekdayIndex(dateKey: string): number {
  return parseDateKey(dateKey).getDay();
}

export function isHabitScheduledOn(habit: Habit, dateKey: string): boolean {
  if (habit.status === "paused" || habit.status === "archived") return false;
  if (dateKey < habit.start_date) return false;
  if (habit.schedule_end_date && dateKey > habit.schedule_end_date) return false;

  const dow = weekdayIndex(dateKey);

  switch (habit.schedule_kind) {
    case "daily":
      return true;
    case "weekdays":
      return habit.schedule_weekdays.length === 0
        ? dow >= 1 && dow <= 5
        : habit.schedule_weekdays.includes(dow);
    case "custom":
      return habit.schedule_custom_days.includes(dow);
    case "days_per_week":
      // Fair denominator: any day until weekly cap is met is "eligible";
      // for daily Today view, show habit every day (user chooses which days).
      return true;
    case "every_n_days": {
      const n = habit.schedule_interval_days ?? 2;
      if (n < 1) return false;
      const elapsed = daysBetween(habit.start_date, dateKey);
      return elapsed % n === 0;
    }
    default:
      return habit.frequency === "weekly" ? dow === 1 : true;
  }
}

export function scheduledDaysInRange(
  habit: Habit,
  startKey: string,
  endKey: string,
  allDays: string[],
): string[] {
  return allDays.filter((d) => isHabitScheduledOn(habit, d));
}

/** Short label for non-daily schedules (null = every day, no chip). */
export function formatScheduleLabel(habit: Habit): string | null {
  switch (habit.schedule_kind) {
    case "daily":
      return habit.frequency === "weekly" ? `Weekly · ${WEEKDAY_LABELS[1]}` : null;
    case "every_n_days": {
      const n = habit.schedule_interval_days ?? 2;
      return `Every ${n} days`;
    }
    case "days_per_week": {
      const n = habit.schedule_days_per_week ?? 1;
      return `${n}× per week`;
    }
    case "custom": {
      if (habit.schedule_custom_days.length === 0) return "Custom";
      if (habit.schedule_custom_days.length === 1 && habit.frequency === "weekly") {
        const d = habit.schedule_custom_days[0];
        return `Weekly · ${WEEKDAY_LABELS[d] ?? "?"}`;
      }
      return [...habit.schedule_custom_days]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_LABELS[d] ?? "?")
        .join(", ");
    }
    case "weekdays":
      if (habit.schedule_weekdays.length === 0) return "Weekdays";
      return [...habit.schedule_weekdays]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAY_LABELS[d] ?? "?")
        .join(", ");
    default:
      return habit.frequency === "weekly" ? `Weekly · ${WEEKDAY_LABELS[1]}` : null;
  }
}
