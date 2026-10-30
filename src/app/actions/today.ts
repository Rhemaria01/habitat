"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { prisma } from "@/lib/db";
import { addDays, todayKey, weekStartKey } from "@/lib/dates";
import { adherenceForRange } from "@/lib/domain/adherence";
import { dbDate, toHabitWithLogs } from "@/lib/serialize";
import { computeStreakStats } from "@/lib/streaks";
import type { HabitLogStatus, TodayHabitItem } from "@/lib/types";
import type { ActionResult } from "@/lib/api/types";
import { timeGreeting } from "@/lib/time-of-day";

async function guard() {
  await requireAuth();
}

export type TodayDashboard = {
  greeting: string;
  todayProgress: number | null;
  currentStreak: number;
  bestStreak: number;
  monthLogCount: number;
};

export async function getTodayData(dateKey: string = todayKey()): Promise<{
  items: TodayHabitItem[];
  weekAdherence: number | null;
  dashboard: TodayDashboard;
}> {
  await guard();

  const habits = await prisma.habit.findMany({
    where: { status: "active", archived_at: null },
    orderBy: [{ is_priority: "desc" }, { sort_order: "asc" }],
    include: { logs: { where: { log_date: dbDate(dateKey) } } },
  });

  const monthStart = `${dateKey.slice(0, 7)}-01`;
  const [streakRows, monthLogCount] = await Promise.all([
    prisma.habit.findMany({
      where: { status: "active", archived_at: null },
      include: { logs: { orderBy: { log_date: "asc" } } },
    }),
    prisma.habitLog.count({
      where: { log_date: { gte: dbDate(monthStart), lte: dbDate(dateKey) } },
    }),
  ]);

  let currentStreak = 0;
  let bestStreak = 0;
  for (const row of streakRows) {
    const habit = toHabitWithLogs(row);
    const stats = computeStreakStats(
      habit.behavior_type,
      habit.start_date,
      habit.logs,
      dateKey,
    );
    currentStreak = Math.max(currentStreak, stats.currentStreak);
    bestStreak = Math.max(bestStreak, stats.bestStreak);
  }

  const items: TodayHabitItem[] = habits.map((row) => {
    const habit = toHabitWithLogs({ ...row, logs: row.logs });
    return {
      habit,
      scheduled: isHabitScheduledOn(habit, dateKey),
      log: habit.logs[0] ?? null,
    };
  });

  const weekStart = weekStartKey(dateKey);
  const weekLogs = await prisma.habitLog.findMany({
    where: {
      log_date: { gte: dbDate(weekStart), lte: dbDate(dateKey) },
      habit_id: { in: habits.map((h) => h.id) },
    },
  });
  const logsByHabit = new Map<string, typeof weekLogs>();
  for (const log of weekLogs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log);
    logsByHabit.set(log.habit_id, list);
  }

  let totalRate = 0;
  let rateCount = 0;
  for (const row of habits) {
    const habit = toHabitWithLogs({
      ...row,
      logs: logsByHabit.get(row.id) ?? [],
    });
    const summary = adherenceForRange(habit, habit.logs, weekStart, dateKey);
    if (summary.rate !== null) {
      totalRate += summary.rate;
      rateCount++;
    }
  }

  const scheduledItems = items.filter((i) => i.scheduled);
  const doneToday = scheduledItems.filter(
    (i) =>
      i.log &&
      i.log.status !== "missed" &&
      i.log.status !== "lapse" &&
      i.log.status !== "skipped",
  ).length;
  const todayProgress =
    scheduledItems.length === 0
      ? null
      : Math.round((doneToday / scheduledItems.length) * 100);

  return {
    items,
    weekAdherence: rateCount ? Math.round((totalRate / rateCount) * 10) / 10 : null,
    dashboard: {
      greeting: timeGreeting(),
      todayProgress,
      currentStreak,
      bestStreak,
      monthLogCount,
    },
  };
}

export async function setHabitLog(
  habitId: string,
  logDate: string,
  status: HabitLogStatus | null,
  options?: {
    note?: string;
    numeric_value?: number;
    completion_level?: "minimum" | "standard" | "stretch";
  },
): Promise<ActionResult> {
  try {
    await guard();
    if (status === null) {
      await prisma.habitLog.deleteMany({
        where: { habit_id: habitId, log_date: dbDate(logDate) },
      });
    } else {
      await prisma.habitLog.upsert({
        where: {
          habit_id_log_date: { habit_id: habitId, log_date: dbDate(logDate) },
        },
        update: {
          status,
          note: options?.note ?? null,
          numeric_value: options?.numeric_value ?? null,
          completion_level: options?.completion_level ?? null,
        },
        create: {
          habit_id: habitId,
          log_date: dbDate(logDate),
          status,
          note: options?.note ?? null,
          numeric_value: options?.numeric_value ?? null,
          completion_level: options?.completion_level ?? null,
        },
      });
    }
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/habits");
    revalidatePath("/calendar");
    revalidatePath("/stats");
    revalidatePath(`/habits/${habitId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save log." };
  }
}

export async function getMissedRecoveryHint(dateKey: string = todayKey()): Promise<string | null> {
  await guard();
  const yesterday = addDays(dateKey, -1);
  const habits = await prisma.habit.findMany({
    where: { status: "active", archived_at: null },
    include: { logs: { where: { log_date: dbDate(yesterday) } } },
  });
  for (const row of habits) {
    const habit = toHabitWithLogs(row);
    if (!isHabitScheduledOn(habit, yesterday)) continue;
    const log = habit.logs[0];
    if (!log) {
      return `You had no log for "${habit.name}" yesterday. Pick the next scheduled time to restart — one miss is normal.`;
    }
    if (log.status === "missed" || log.status === "lapse") {
      return `"${habit.name}" was marked as a miss yesterday. What is one small adjustment before the next attempt?`;
    }
  }
  return null;
}
