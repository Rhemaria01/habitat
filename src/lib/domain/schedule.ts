import { parseDateKey } from "@/lib/dates";
import type { Habit } from "@/lib/types";

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
