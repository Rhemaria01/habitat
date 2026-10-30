"use server";

import { requireAuth } from "@/lib/auth";
import { adherenceForRange } from "@/lib/domain/adherence";
import { addDays, eachDayKey, todayKey, toDateKey, weekStartKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { computeStreakStats } from "@/lib/streaks";
import {
  accumulateLogBreakdown,
  adherenceToHeatmapTier,
  averageAdherenceFromSeries,
  behaviorCounts,
  breakdownWithPercentages,
  buildHabitSparkline,
  buildStatsInsights,
  habitAdherenceInRange,
  previousPeriodBounds,
  rangeBounds,
  trendSeriesForRange,
  type HeatmapTier,
  type StatsRangeKey,
  aggregateMultiHabitDay,
  periodDeltaPercent,
} from "@/lib/stats-aggregate";
import { dbDate, toHabitLog, toHabitWithLogs } from "@/lib/serialize";
import type { HabitBehaviorType } from "@/lib/types";

export type StatsDayPoint = {
  dateKey: string;
  label: string;
  adherence: number | null;
  scheduled: number;
  completed: number;
};

export type StatsHeatmapCell = {
  day: number;
  dateKey: string;
  tier: HeatmapTier;
  adherence: number | null;
  weekday: number;
};

export type StatsBehaviorCounts = {
  build: number;
  reduce: number;
  avoid: number;
};

export type StatsLogBreakdown = {
  completed: number;
  partial: number;
  missed: number;
  notScheduled: number;
  totalLogs: number;
  completedPct: number;
  partialPct: number;
  missedPct: number;
  notScheduledPct: number;
};

export type StatsHabitRow = {
  id: string;
  name: string;
  icon: string | null;
  behavior_type: HabitBehaviorType;
  adherence: number | null;
  currentStreak: number;
  bestStreak: number;
  sparkline: number[];
};

export type StatsDashboardParams = {
  year: number;
  month: number;
  range: StatsRangeKey;
};

export type StatsDashboard = {
  year: number;
  month: number;
  monthLabel: string;
  range: StatsRangeKey;
  activeHabits: number;
  behaviorCounts: StatsBehaviorCounts;
  weekAdherence: number | null;
  monthLogCount: number;
  monthAvgAdherence: number | null;
  avgAdherence: number | null;
  prevPeriodAdherence: number | null;
  deltaPercent: number | null;
  logCountDeltaPercent: number | null;
  bestStreak: number;
  currentStreakBest: number;
  monthHeatmapDays: StatsHeatmapCell[];
  daysInMonth: number;
  trendSeries: StatsDayPoint[];
  logBreakdown: StatsLogBreakdown;
  habitRows: StatsHabitRow[];
  insights: string[];
  last30Days: StatsDayPoint[];
};

export async function getStatsDashboard(
  params?: StatsDashboardParams,
): Promise<StatsDashboard> {
  await requireAuth();

  const today = todayKey();
  const now = new Date(`${today}T12:00:00`);
  const year = params?.year ?? now.getFullYear();
  const month = params?.month ?? now.getMonth();
  const range: StatsRangeKey = params?.range ?? "30d";

  const monthStart = toDateKey(new Date(year, month, 1));
  const monthEnd = toDateKey(new Date(year, month + 1, 0));
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthStart = toDateKey(new Date(year, month - 1, 1));
  const prevMonthEnd = toDateKey(new Date(year, month, 0));

  const [habitDbRows] = await Promise.all([
    prisma.habit.findMany({
      where: { status: "active", archived_at: null },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    }),
  ]);

  const habits = habitDbRows.map((row) => toHabitWithLogs({ ...row, logs: [] }));
  const earliestStart =
    habits.length > 0
      ? habits.reduce((min, h) => (h.start_date < min ? h.start_date : min), habits[0]!.start_date)
      : null;

  const { start: rangeStart, end: rangeEnd } = rangeBounds(
    range,
    today,
    earliestStart,
  );
  const queryStart =
    [rangeStart, monthStart, prevMonthStart].sort()[0] ?? rangeStart;

  const [monthLogs, prevMonthLogs, rangeLogs, allLogsForStreaks] =
    await Promise.all([
      prisma.habitLog.count({
        where: {
          log_date: { gte: dbDate(monthStart), lte: dbDate(monthEnd) },
        },
      }),
      prisma.habitLog.count({
        where: {
          log_date: { gte: dbDate(prevMonthStart), lte: dbDate(prevMonthEnd) },
        },
      }),
      prisma.habitLog.findMany({
        where: {
          log_date: { gte: dbDate(queryStart), lte: dbDate(today) },
        },
      }),
      prisma.habitLog.findMany({
        where: {
          log_date: { lte: dbDate(today) },
        },
      }),
    ]);

  const serializedLogs = rangeLogs.map(toHabitLog);
  const streakLogs = allLogsForStreaks.map(toHabitLog);

  const logsByDate = new Map<string, typeof serializedLogs>();
  for (const log of serializedLogs) {
    const list = logsByDate.get(log.log_date) ?? [];
    list.push(log);
    logsByDate.set(log.log_date, list);
  }

  const weekStart = weekStartKey(today);
  let weekTotal = 0;
  let weekCount = 0;
  for (const habit of habits) {
    const logs = serializedLogs.filter(
      (l) =>
        l.habit_id === habit.id &&
        l.log_date >= weekStart &&
        l.log_date <= today,
    );
    const summary = adherenceForRange(habit, logs, weekStart, today);
    if (summary.rate !== null) {
      weekTotal += summary.rate;
      weekCount++;
    }
  }

  const trendSeries = trendSeriesForRange(
    habits,
    rangeStart,
    rangeEnd,
    logsByDate,
    today,
  );

  const { start: prevStart, end: prevEnd } = previousPeriodBounds(
    rangeStart,
    rangeEnd,
  );
  const prevSeries = trendSeriesForRange(
    habits,
    prevStart,
    prevEnd,
    logsByDate,
    today,
  );

  const avgAdherence = averageAdherenceFromSeries(trendSeries);
  const prevPeriodAdherence = averageAdherenceFromSeries(prevSeries);
  const deltaPercent = periodDeltaPercent(avgAdherence, prevPeriodAdherence);
  const logCountDeltaPercent = periodDeltaPercent(monthLogs, prevMonthLogs);

  let monthAdherenceSum = 0;
  let monthAdherenceDays = 0;
  const monthHeatmapDays: StatsHeatmapCell[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toDateKey(new Date(year, month, d));
    const weekday = new Date(year, month, d).getDay();
    const isFuture = dateKey > today;

    if (isFuture) {
      monthHeatmapDays.push({
        day: d,
        dateKey,
        tier: "future",
        adherence: null,
        weekday,
      });
      continue;
    }

    const dayLogs = logsByDate.get(dateKey) ?? [];
    const logByHabit = new Map(dayLogs.map((l) => [l.habit_id, l]));
    const agg = aggregateMultiHabitDay(habits, dateKey, logByHabit, today);
    const tier = adherenceToHeatmapTier(
      agg.adherence,
      agg.scheduled,
      false,
    );

    if (agg.adherence !== null && agg.scheduled > 0) {
      monthAdherenceSum += agg.adherence;
      monthAdherenceDays += 1;
    }

    monthHeatmapDays.push({
      day: d,
      dateKey,
      tier,
      adherence: agg.adherence,
      weekday,
    });
  }

  const monthAvgAdherence =
    monthAdherenceDays > 0
      ? Math.round((monthAdherenceSum / monthAdherenceDays) * 10) / 10
      : null;

  const rangeDayKeys = eachDayKey(rangeStart, rangeEnd);
  const breakdownCounts = accumulateLogBreakdown(
    habits,
    rangeDayKeys,
    logsByDate,
    today,
  );
  const logBreakdown = breakdownWithPercentages(breakdownCounts);

  const statsHabitRows: StatsHabitRow[] = habits.map((habit) => {
    const habitLogs = serializedLogs.filter((l) => l.habit_id === habit.id);
    const allHabitLogs = streakLogs.filter((l) => l.habit_id === habit.id);
    const streak = computeStreakStats(
      habit.behavior_type,
      habit.start_date,
      allHabitLogs,
      today,
    );
    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      behavior_type: habit.behavior_type,
      adherence: habitAdherenceInRange(habit, habitLogs, rangeStart, rangeEnd),
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      sparkline: buildHabitSparkline(habit, habitLogs, today),
    };
  });

  let bestStreak = 0;
  for (const row of statsHabitRows) {
    bestStreak = Math.max(bestStreak, row.bestStreak);
  }

  const insights = buildStatsInsights({
    habits,
    habitRows: statsHabitRows,
    deltaPercent,
    avgAdherence,
  });

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const last30Days = trendSeriesForRange(
    habits,
    addDays(today, -29),
    today,
    logsByDate,
    today,
  );

  return {
    year,
    month,
    monthLabel,
    range,
    activeHabits: habits.length,
    behaviorCounts: behaviorCounts(habits),
    weekAdherence: weekCount
      ? Math.round((weekTotal / weekCount) * 10) / 10
      : null,
    monthLogCount: monthLogs,
    monthAvgAdherence,
    avgAdherence,
    prevPeriodAdherence,
    deltaPercent,
    logCountDeltaPercent,
    bestStreak,
    currentStreakBest: bestStreak,
    monthHeatmapDays,
    daysInMonth,
    trendSeries,
    logBreakdown,
    habitRows: statsHabitRows,
    insights,
    last30Days,
  };
}
