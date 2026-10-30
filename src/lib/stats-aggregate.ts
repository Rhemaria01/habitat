import {
  classifyDayHabit,
  summarizeOutcomes,
  type CalendarHabitOutcome,
} from "@/lib/calendar-day";
import { adherenceForRange } from "@/lib/domain/adherence";
import { addDays, eachDayKey } from "@/lib/dates";
import type { HabitLog, HabitWithLogs } from "@/lib/types";

export type StatsRangeKey = "7d" | "30d" | "3m" | "1y" | "all";

export const STATS_RANGE_DAYS: Record<StatsRangeKey, number | null> = {
  "7d": 7,
  "30d": 30,
  "3m": 90,
  "1y": 365,
  all: null,
};

export type DayAggregate = {
  adherence: number | null;
  completed: number;
  partial: number;
  missed: number;
  notScheduled: number;
  scheduled: number;
};

export function aggregateMultiHabitDay(
  habits: HabitWithLogs[],
  dateKey: string,
  logByHabit: Map<string, HabitLog>,
  asOf: string,
): DayAggregate {
  const outcomes: CalendarHabitOutcome[] = [];
  for (const habit of habits) {
    const log = logByHabit.get(habit.id);
    const outcome = classifyDayHabit(habit, dateKey, log, asOf);
    if (
      outcome === "not_scheduled" ||
      outcome === "future" ||
      outcome === "before_start"
    ) {
      continue;
    }
    outcomes.push(outcome);
  }
  const { completed, partial, missed, notScheduled, scheduled } =
    summarizeOutcomes(outcomes);
  if (scheduled === 0) {
    return {
      adherence: null,
      completed,
      partial,
      missed,
      notScheduled,
      scheduled: 0,
    };
  }
  const done = completed + partial * 0.5;
  const adherence = Math.round((done / scheduled) * 100);
  return {
    adherence,
    completed,
    partial,
    missed,
    notScheduled,
    scheduled,
  };
}

export type HeatmapTier = "high" | "medium" | "low" | "missed" | "none" | "future";

export function adherenceToHeatmapTier(
  adherence: number | null,
  scheduled: number,
  isFuture: boolean,
): HeatmapTier {
  if (isFuture) return "future";
  if (scheduled === 0) return "none";
  if (adherence === null) return "none";
  if (adherence >= 80) return "high";
  if (adherence >= 50) return "medium";
  if (adherence > 0) return "low";
  return "missed";
}

export function periodDeltaPercent(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function averageAdherenceFromSeries(
  points: { adherence: number | null }[],
): number | null {
  const vals = points
    .map((p) => p.adherence)
    .filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function rangeBounds(
  range: StatsRangeKey,
  today: string,
  earliestStart: string | null,
): { start: string; end: string } {
  const end = today;
  if (range === "all") {
    const start = earliestStart ?? addDays(today, -29);
    return { start, end };
  }
  const days = STATS_RANGE_DAYS[range]!;
  return { start: addDays(today, -(days - 1)), end };
}

export function previousPeriodBounds(
  start: string,
  end: string,
): { start: string; end: string } {
  const len = eachDayKey(start, end).length;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(len - 1));
  return { start: prevStart, end: prevEnd };
}

function habitDayScore(
  habit: HabitWithLogs,
  dateKey: string,
  log: HabitLog | undefined,
  asOf: string,
): number | null {
  const outcome = classifyDayHabit(habit, dateKey, log, asOf);
  if (
    outcome === "not_scheduled" ||
    outcome === "future" ||
    outcome === "before_start"
  ) {
    return null;
  }
  if (outcome === "completed") return 100;
  if (outcome === "partial") return 50;
  return 0;
}

export function buildHabitSparkline(
  habit: HabitWithLogs,
  logs: HabitLog[],
  asOf: string,
  pointCount = 14,
): number[] {
  const logByDate = new Map(logs.map((l) => [l.log_date, l]));
  const points: number[] = [];
  let cursor = asOf;
  let guard = 0;
  while (points.length < pointCount && guard < 400) {
    guard += 1;
    const score = habitDayScore(habit, cursor, logByDate.get(cursor), asOf);
    if (score !== null) points.unshift(score);
    cursor = addDays(cursor, -1);
    if (cursor < habit.start_date) break;
  }
  return points;
}

export type LogBreakdownCounts = {
  completed: number;
  partial: number;
  missed: number;
  notScheduled: number;
  totalLogs: number;
};

export function accumulateLogBreakdown(
  habits: HabitWithLogs[],
  dateKeys: string[],
  logsByDate: Map<string, HabitLog[]>,
  asOf: string,
): LogBreakdownCounts {
  let completed = 0;
  let partial = 0;
  let missed = 0;
  let notScheduled = 0;
  let totalLogs = 0;

  for (const dateKey of dateKeys) {
    const dayLogs = logsByDate.get(dateKey) ?? [];
    const logByHabit = new Map(dayLogs.map((l) => [l.habit_id, l]));
    for (const habit of habits) {
      const log = logByHabit.get(habit.id);
      const outcome = classifyDayHabit(habit, dateKey, log, asOf);
      if (outcome === "completed") {
        completed++;
        if (log) totalLogs++;
      } else if (outcome === "partial") {
        partial++;
        if (log) totalLogs++;
      } else if (outcome === "missed") {
        missed++;
        if (log) totalLogs++;
      } else if (outcome === "not_scheduled") {
        notScheduled++;
      }
    }
  }

  return { completed, partial, missed, notScheduled, totalLogs };
}

export function breakdownWithPercentages(counts: LogBreakdownCounts) {
  const denom =
    counts.completed +
    counts.partial +
    counts.missed +
    counts.notScheduled;
  const pct = (n: number) =>
    denom > 0 ? Math.round((n / denom) * 1000) / 10 : 0;
  return {
    ...counts,
    completedPct: pct(counts.completed),
    partialPct: pct(counts.partial),
    missedPct: pct(counts.missed),
    notScheduledPct: pct(counts.notScheduled),
  };
}

export function buildStatsInsights(input: {
  habits: HabitWithLogs[];
  habitRows: { name: string; adherence: number | null; bestStreak: number; currentStreak: number }[];
  deltaPercent: number | null;
  avgAdherence: number | null;
}): string[] {
  const insights: string[] = [];
  const { habitRows, deltaPercent, avgAdherence } = input;

  if (deltaPercent !== null && deltaPercent > 0) {
    insights.push(
      `Your adherence is ${Math.abs(deltaPercent)}% higher than the previous period.`,
    );
  } else if (deltaPercent !== null && deltaPercent < 0) {
    insights.push(
      `Adherence dipped ${Math.abs(deltaPercent)}% vs the previous period — a small reset can help.`,
    );
  }

  const byStreak = [...habitRows].sort((a, b) => b.bestStreak - a.bestStreak)[0];
  if (byStreak && byStreak.bestStreak > 0) {
    insights.push(
      `${byStreak.name} has your longest best streak (${byStreak.bestStreak} days).`,
    );
  }

  const weakest = [...habitRows]
    .filter((r) => r.adherence !== null)
    .sort((a, b) => (a.adherence ?? 0) - (b.adherence ?? 0))[0];
  if (weakest && weakest.adherence !== null && weakest.adherence < 70) {
    insights.push(
      `${weakest.name} could use attention (${weakest.adherence}% adherence in this range).`,
    );
  }

  const strongest = [...habitRows]
    .filter((r) => r.adherence !== null)
    .sort((a, b) => (b.adherence ?? 0) - (a.adherence ?? 0))[0];
  if (strongest && strongest.adherence !== null && strongest.adherence >= 80) {
    insights.push(`${strongest.name} is leading at ${strongest.adherence}% adherence.`);
  }

  if (avgAdherence !== null && insights.length < 3) {
    insights.push(`Average adherence across the selected range is ${avgAdherence}%.`);
  }

  return insights.slice(0, 4);
}

export function behaviorCounts(habits: HabitWithLogs[]) {
  let build = 0;
  let reduce = 0;
  let avoid = 0;
  for (const h of habits) {
    if (h.behavior_type === "build") build++;
    else if (h.behavior_type === "reduce") reduce++;
    else avoid++;
  }
  return { build, reduce, avoid };
}

export function trendSeriesForRange(
  habits: HabitWithLogs[],
  start: string,
  end: string,
  logsByDate: Map<string, HabitLog[]>,
  asOf: string,
): { dateKey: string; label: string; adherence: number | null; scheduled: number; completed: number }[] {
  return eachDayKey(start, end).map((dateKey) => {
    const dayLogs = logsByDate.get(dateKey) ?? [];
    const logByHabit = new Map(dayLogs.map((l) => [l.habit_id, l]));
    const agg = aggregateMultiHabitDay(habits, dateKey, logByHabit, asOf);
    const d = new Date(`${dateKey}T12:00:00`);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return {
      dateKey,
      label,
      adherence: agg.adherence,
      scheduled: agg.scheduled,
      completed: agg.completed,
    };
  });
}

export function habitAdherenceInRange(
  habit: HabitWithLogs,
  logs: HabitLog[],
  start: string,
  end: string,
): number | null {
  return adherenceForRange(habit, logs, start, end).rate;
}
