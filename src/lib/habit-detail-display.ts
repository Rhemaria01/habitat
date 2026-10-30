import { classifyDayHabit, type CalendarHabitOutcome } from "@/lib/calendar-day";
import { adherenceForRange } from "@/lib/domain/adherence";
import {
  addDays,
  eachDayKey,
  LOCALE,
  parseDateKey,
  todayKey,
  weekStartKey,
} from "@/lib/dates";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { computeStreakStats } from "@/lib/streaks";
import type { HabitLog, HabitWithLogs } from "@/lib/types";

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type HabitOverviewStats = {
  monthPercent: number | null;
  monthCompleted: number;
  monthScheduled: number;
  weekPlanned: number;
  currentStreak: number;
};

export type HabitWeekDay = {
  key: string;
  label: string;
  outcome: CalendarHabitOutcome;
  scheduled: boolean;
};

export type HabitActivityRow = {
  dateKey: string;
  dateLabel: string;
  statusLabel: string;
  timeLabel: string | null;
  outcome: CalendarHabitOutcome;
};

export function habitDetailTagline(habit: HabitWithLogs): string {
  if (habit.identity_proof) {
    const t = habit.identity_proof.trim();
    if (t.length <= 72) return t;
    return t.replace(/\.$/, "");
  }
  if (habit.behavior_type === "build") return "Small steps. Steady progress.";
  return "Protect the streak you are building.";
}

function outcomeStatusLabel(outcome: CalendarHabitOutcome): string {
  switch (outcome) {
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "missed":
      return "Missed";
    case "not_scheduled":
      return "Not scheduled";
    default:
      return "Upcoming";
  }
}

function formatLogTime(log: HabitLog | undefined): string | null {
  if (!log?.updated_at) return null;
  const d = new Date(log.updated_at);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
}

export function buildHabitOverview(
  habit: HabitWithLogs,
  asOf: string = todayKey(),
): HabitOverviewStats {
  const monthStart = `${asOf.slice(0, 7)}-01`;
  const month = adherenceForRange(habit, habit.logs, monthStart, asOf);
  const weekStart = weekStartKey(asOf);
  const week = adherenceForRange(habit, habit.logs, weekStart, asOf);
  const streak = computeStreakStats(
    habit.behavior_type,
    habit.start_date,
    habit.logs,
    asOf,
  );

  const monthDone = month.completed + month.partial;

  return {
    monthPercent:
      month.rate !== null ? Math.round(month.rate) : month.scheduled ? 0 : null,
    monthCompleted: monthDone,
    monthScheduled: month.scheduled,
    weekPlanned: week.scheduled,
    currentStreak: streak.currentStreak,
  };
}

export function buildHabitWeekDays(
  habit: HabitWithLogs,
  asOf: string = todayKey(),
): HabitWeekDay[] {
  const start = weekStartKey(asOf);
  const logByDate = new Map(habit.logs.map((l) => [l.log_date, l]));
  const days: HabitWeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const key = addDays(start, i);
    const scheduled =
      key >= habit.start_date && isHabitScheduledOn(habit, key);
    const outcome = scheduled
      ? classifyDayHabit(habit, key, logByDate.get(key), asOf)
      : "not_scheduled";
    days.push({
      key,
      label: WEEKDAY_SHORT[i],
      outcome,
      scheduled,
    });
  }

  return days;
}

export function buildRecentActivity(
  habit: HabitWithLogs,
  limit = 5,
  asOf: string = todayKey(),
): HabitActivityRow[] {
  const logByDate = new Map(habit.logs.map((l) => [l.log_date, l]));
  const rows: HabitActivityRow[] = [];

  for (
    let cursor = asOf, scanned = 0;
    scanned < 120 && rows.length < limit;
    cursor = addDays(cursor, -1), scanned++
  ) {
    if (cursor < habit.start_date) break;
    if (!isHabitScheduledOn(habit, cursor)) continue;

    const log = logByDate.get(cursor);
    const outcome = classifyDayHabit(habit, cursor, log, asOf);
    if (outcome === "future") continue;

    const dateLabel =
      cursor === asOf
        ? "Today"
        : parseDateKey(cursor).toLocaleDateString(LOCALE, {
            weekday: "short",
            day: "numeric",
            month: "short",
          });

    const timeLabel = formatLogTime(log);
    rows.push({
      dateKey: cursor,
      dateLabel,
      statusLabel: outcomeStatusLabel(outcome),
      timeLabel,
      outcome,
    });
  }

  return rows;
}

/** Scheduled days in month up to asOf (for overview denominator). */
export function scheduledDaysInMonth(
  habit: HabitWithLogs,
  asOf: string = todayKey(),
): number {
  const monthStart = `${asOf.slice(0, 7)}-01`;
  return eachDayKey(monthStart, asOf).filter((d) =>
    isHabitScheduledOn(habit, d),
  ).length;
}
