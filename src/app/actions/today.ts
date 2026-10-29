"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { prisma } from "@/lib/db";
import { addDays, todayKey, weekStartKey } from "@/lib/dates";
import { adherenceForRange } from "@/lib/domain/adherence";
import {
  dbDate,
  toHabitWithLogs,
  toRoutine,
  toRoutineStep,
  toRoutineStepLog,
} from "@/lib/serialize";
import type { HabitLogStatus, RoutineWithSteps, TodayHabitItem } from "@/lib/types";
import type { ActionResult } from "@/app/actions/settings";

async function guard() {
  await requireAuth();
}

function routineRunsOn(routine: { schedule_kind: string; schedule_weekdays: number[]; schedule_custom_days: number[] }, dateKey: string): boolean {
  const dow = new Date(`${dateKey}T12:00:00`).getDay();
  if (routine.schedule_kind === "daily") return true;
  if (routine.schedule_kind === "weekdays") {
    return routine.schedule_weekdays.length
      ? routine.schedule_weekdays.includes(dow)
      : dow >= 1 && dow <= 5;
  }
  if (routine.schedule_kind === "custom") {
    return routine.schedule_custom_days.includes(dow);
  }
  return true;
}

export async function getTodayData(dateKey: string = todayKey()): Promise<{
  items: TodayHabitItem[];
  routines: RoutineWithSteps[];
  weekAdherence: number | null;
}> {
  await guard();

  const habits = await prisma.habit.findMany({
    where: { status: "active", archived_at: null },
    orderBy: [{ is_priority: "desc" }, { sort_order: "asc" }],
    include: { logs: { where: { log_date: dbDate(dateKey) } } },
  });

  const routineRows = await prisma.routine.findMany({
    where: { status: "active" },
    orderBy: { sort_order: "asc" },
    include: { steps: { orderBy: { sort_order: "asc" } } },
  });

  const routines = routineRows
    .filter((r) => routineRunsOn(r, dateKey))
    .map((r) => ({
      ...toRoutine(r),
      steps: r.steps.map(toRoutineStep),
    }));

  const habitRoutineMap = new Map<string, string[]>();
  for (const r of routines) {
    for (const step of r.steps) {
      if (step.habit_id) {
        const list = habitRoutineMap.get(step.habit_id) ?? [];
        list.push(r.name);
        habitRoutineMap.set(step.habit_id, list);
      }
    }
  }

  const items: TodayHabitItem[] = habits.map((row) => {
    const habit = toHabitWithLogs({ ...row, logs: row.logs });
    return {
      habit,
      scheduled: isHabitScheduledOn(habit, dateKey),
      log: habit.logs[0] ?? null,
      routineNames: habitRoutineMap.get(habit.id) ?? [],
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

  return {
    items,
    routines,
    weekAdherence: rateCount ? Math.round((totalRate / rateCount) * 10) / 10 : null,
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
    revalidatePath(`/habits/${habitId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save log." };
  }
}

export async function toggleRoutineStep(
  stepId: string,
  logDate: string,
  done: boolean,
): Promise<ActionResult> {
  try {
    await guard();
    if (!done) {
      await prisma.routineStepLog.deleteMany({
        where: { routine_step_id: stepId, log_date: dbDate(logDate) },
      });
    } else {
      await prisma.routineStepLog.upsert({
        where: {
          routine_step_id_log_date: {
            routine_step_id: stepId,
            log_date: dbDate(logDate),
          },
        },
        update: { done: true },
        create: { routine_step_id: stepId, log_date: dbDate(logDate), done: true },
      });
    }
    revalidatePath("/");
    revalidatePath("/routines");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update step." };
  }
}

export async function getRoutineStepLogsForDate(
  dateKey: string,
): Promise<ReturnType<typeof toRoutineStepLog>[]> {
  await guard();
  const rows = await prisma.routineStepLog.findMany({
    where: { log_date: dbDate(dateKey) },
  });
  return rows.map(toRoutineStepLog);
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
