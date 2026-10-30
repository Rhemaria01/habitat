"use server";

import { requireAuth } from "@/lib/auth";
import { adherenceForRange } from "@/lib/domain/adherence";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { addDays, eachDayKey, todayKey, weekStartKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { dbDate, toHabitLog, toHabitWithLogs } from "@/lib/serialize";

export type StatsDayPoint = {
  dateKey: string;
  label: string;
  adherence: number | null;
  scheduled: number;
  completed: number;
};

export type StatsDashboard = {
  activeHabits: number;
  weekAdherence: number | null;
  monthLogCount: number;
  currentStreakBest: number;
  last30Days: StatsDayPoint[];
};

export async function getStatsDashboard(): Promise<StatsDashboard> {
  await requireAuth();

  const today = todayKey();
  const monthStart = `${today.slice(0, 7)}-01`;
  const rangeStart = addDays(today, -29);

  const [habitRows, monthLogs, rangeLogs] = await Promise.all([
      prisma.habit.findMany({
        where: { status: "active", archived_at: null },
        orderBy: [{ sort_order: "asc" }],
      }),
      prisma.habitLog.count({
        where: { log_date: { gte: dbDate(monthStart), lte: dbDate(today) } },
      }),
      prisma.habitLog.findMany({
        where: {
          log_date: { gte: dbDate(rangeStart), lte: dbDate(today) },
        },
      }),
    ]);

  const habits = habitRows.map((row) => toHabitWithLogs({ ...row, logs: [] }));
  const serializedRangeLogs = rangeLogs.map(toHabitLog);

  const weekStart = weekStartKey(today);
  let weekTotal = 0;
  let weekCount = 0;
  for (const habit of habits) {
    const logs = serializedRangeLogs.filter(
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

  const logsByDate = new Map<string, typeof serializedRangeLogs>();
  for (const log of serializedRangeLogs) {
    const list = logsByDate.get(log.log_date) ?? [];
    list.push(log);
    logsByDate.set(log.log_date, list);
  }

  const last30Days: StatsDayPoint[] = eachDayKey(rangeStart, today).map(
    (dateKey) => {
      const dayLogs = logsByDate.get(dateKey) ?? [];
      let scheduled = 0;
      let completed = 0;
      for (const habit of habits) {
        if (!isHabitScheduledOn(habit, dateKey)) continue;
        scheduled++;
        const log = dayLogs.find((l) => l.habit_id === habit.id);
        if (log && log.status !== "missed" && log.status !== "lapse") {
          completed++;
        }
      }
      const adherence =
        scheduled > 0 ? Math.round((completed / scheduled) * 1000) / 10 : null;
      const d = new Date(`${dateKey}T12:00:00`);
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return { dateKey, label, adherence, scheduled, completed };
    },
  );

  let currentStreakBest = 0;
  for (const habit of habits) {
    const habitLogs = serializedRangeLogs.filter((l) => l.habit_id === habit.id);
    let streak = 0;
    let best = 0;
    for (const dateKey of [...eachDayKey(rangeStart, today)].reverse()) {
      if (!isHabitScheduledOn(habit, dateKey)) continue;
      const log = habitLogs.find((l) => l.log_date === dateKey);
      const ok =
        log &&
        log.status !== "missed" &&
        log.status !== "lapse" &&
        log.status !== "skipped";
      if (ok) {
        streak++;
        best = Math.max(best, streak);
      } else if (log) {
        streak = 0;
      }
    }
    currentStreakBest = Math.max(currentStreakBest, best);
  }

  return {
    activeHabits: habits.length,
    weekAdherence: weekCount
      ? Math.round((weekTotal / weekCount) * 10) / 10
      : null,
    monthLogCount: monthLogs,
    currentStreakBest,
    last30Days,
  };
}
