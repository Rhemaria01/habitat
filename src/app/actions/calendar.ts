"use server";

import { requireAuth } from "@/lib/auth";
import {
  classifyDayHabit,
  summarizeOutcomes,
  timeWindowLabel,
  type CalendarHabitOutcome,
} from "@/lib/calendar-day";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { LOCALE, parseDateKey, toDateKey, todayKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { dbDate, toHabitLog, toHabitWithLogs } from "@/lib/serialize";
import type { HabitLog, HabitWithLogs } from "@/lib/types";

export type CalendarDaySegment = {
  outcome: CalendarHabitOutcome;
  color: string;
};

export type CalendarDayState = "none" | "partial" | "complete" | "future" | "before";

export type CalendarDay = {
  dateKey: string | null;
  day: number | null;
  state: CalendarDayState;
  adherence: number | null;
  isToday: boolean;
  segments: CalendarDaySegment[];
  completed: number;
  partial: number;
  missed: number;
  /** Present on single-habit month payloads for backfill UI. */
  log?: HabitLog | null;
};

export type CalendarMonth = {
  year: number;
  month: number;
  label: string;
  days: CalendarDay[];
  completionRate: number | null;
};

export type CalendarDayHabitRow = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  behavior_type: HabitWithLogs["behavior_type"];
  start_date: string;
  timeLabel: string;
  outcome: CalendarHabitOutcome;
  scheduled: boolean;
  log: HabitLog | null;
};

export type CalendarDayDetail = {
  dateKey: string;
  label: string;
  isToday: boolean;
  summary: {
    completed: number;
    partial: number;
    missed: number;
    notScheduled: number;
    scheduled: number;
  };
  habits: CalendarDayHabitRow[];
};

function dayOutcomesForHabits(
  habits: HabitWithLogs[],
  dateKey: string,
  logByHabit: Map<string, HabitLog>,
  asOf: string,
): CalendarDaySegment[] {
  const segments: CalendarDaySegment[] = [];
  for (const habit of habits) {
    const log = logByHabit.get(habit.id);
    const outcome = classifyDayHabit(habit, dateKey, log, asOf);
    if (outcome === "not_scheduled" || outcome === "future" || outcome === "before_start")
      continue;
    segments.push({ outcome, color: habit.color });
  }
  const rank: Record<CalendarHabitOutcome, number> = {
    completed: 0,
    partial: 1,
    missed: 2,
    not_scheduled: 3,
    before_start: 4,
    future: 5,
  };
  segments.sort((a, b) => rank[a.outcome] - rank[b.outcome]);
  return segments.slice(0, 3);
}

function stateFromSegments(segments: CalendarDaySegment[]): {
  state: CalendarDayState;
  adherence: number | null;
} {
  const outcomes = segments.map((s) => s.outcome);
  const { completed, partial, missed, scheduled } = summarizeOutcomes(outcomes);
  if (scheduled === 0) return { state: "none", adherence: null };
  const done = completed + partial * 0.5;
  const adherence = Math.round((done / scheduled) * 100);
  if (completed === scheduled) return { state: "complete", adherence: 100 };
  if (completed > 0 || partial > 0) return { state: "partial", adherence };
  return { state: "none", adherence: 0 };
}

export async function getCalendarMonth(
  year: number,
  month: number,
): Promise<CalendarMonth> {
  await requireAuth();

  const today = todayKey();
  const monthStart = toDateKey(new Date(year, month, 1));
  const monthEnd = toDateKey(new Date(year, month + 1, 0));

  const [habitRows, logs] = await Promise.all([
    prisma.habit.findMany({
      where: { status: "active", archived_at: null },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    }),
    prisma.habitLog.findMany({
      where: {
        log_date: { gte: dbDate(monthStart), lte: dbDate(monthEnd) },
      },
    }),
  ]);

  const habits = habitRows.map((row) => toHabitWithLogs({ ...row, logs: [] }));
  const logsByDate = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = toDateKey(log.log_date);
    const list = logsByDate.get(key) ?? [];
    list.push(log);
    logsByDate.set(key, list);
  }

  const startPad = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];
  let adherenceSum = 0;
  let adherenceDays = 0;

  for (let i = 0; i < startPad; i++) {
    days.push({
      dateKey: null,
      day: null,
      state: "none",
      adherence: null,
      isToday: false,
      segments: [],
      completed: 0,
      partial: 0,
      missed: 0,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toDateKey(new Date(year, month, d));
    const dayLogs = logsByDate.get(dateKey) ?? [];
    const logByHabit = new Map(dayLogs.map((l) => [l.habit_id, toHabitLog(l)]));

    if (dateKey > today) {
      days.push({
        dateKey,
        day: d,
        state: "future",
        adherence: null,
        isToday: false,
        segments: [],
        completed: 0,
        partial: 0,
        missed: 0,
      });
      continue;
    }

    const segments = dayOutcomesForHabits(habits, dateKey, logByHabit, today);
    const summary = summarizeOutcomes(segments.map((s) => s.outcome));
    const { state, adherence } = stateFromSegments(segments);

    if (adherence !== null && summary.scheduled > 0) {
      adherenceSum += adherence;
      adherenceDays++;
    }

    days.push({
      dateKey,
      day: d,
      state,
      adherence,
      isToday: dateKey === today,
      segments,
      completed: summary.completed,
      partial: summary.partial,
      missed: summary.missed,
    });
  }

  const label = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return {
    year,
    month,
    label,
    days,
    completionRate:
      adherenceDays > 0 ? Math.round(adherenceSum / adherenceDays) : null,
  };
}

export async function getCalendarMonthForHabit(
  habitId: string,
  year: number,
  month: number,
): Promise<CalendarMonth> {
  await requireAuth();

  const today = todayKey();
  const monthStart = toDateKey(new Date(year, month, 1));
  const monthEnd = toDateKey(new Date(year, month + 1, 0));

  const row = await prisma.habit.findFirst({
    where: { id: habitId, archived_at: null },
    include: {
      logs: {
        where: { log_date: { gte: dbDate(monthStart), lte: dbDate(monthEnd) } },
      },
    },
  });

  if (!row) {
    return {
      year,
      month,
      label: new Date(year, month, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      days: [],
      completionRate: null,
    };
  }

  const habit = toHabitWithLogs(row);
  const logsByDate = new Map<string, HabitLog>();
  for (const log of habit.logs) {
    logsByDate.set(log.log_date, log);
  }

  const startPad = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];
  let adherenceSum = 0;
  let adherenceDays = 0;

  for (let i = 0; i < startPad; i++) {
    days.push({
      dateKey: null,
      day: null,
      state: "none",
      adherence: null,
      isToday: false,
      segments: [],
      completed: 0,
      partial: 0,
      missed: 0,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toDateKey(new Date(year, month, d));
    const log = logsByDate.get(dateKey);
    const logByHabit = new Map(log ? [[habit.id, log]] : []);

    if (dateKey > today) {
      days.push({
        dateKey,
        day: d,
        state: "future",
        adherence: null,
        isToday: false,
        segments: [],
        completed: 0,
        partial: 0,
        missed: 0,
      });
      continue;
    }

    if (dateKey < habit.start_date) {
      days.push({
        dateKey,
        day: d,
        state: "before",
        adherence: null,
        isToday: dateKey === today,
        segments: [{ outcome: "before_start", color: habit.color }],
        completed: 0,
        partial: 0,
        missed: 0,
      });
      continue;
    }

    const segments = dayOutcomesForHabits([habit], dateKey, logByHabit, today);
    const summary = summarizeOutcomes(segments.map((s) => s.outcome));
    const { state, adherence } = stateFromSegments(segments);

    if (adherence !== null && summary.scheduled > 0) {
      adherenceSum += adherence;
      adherenceDays++;
    }

    days.push({
      dateKey,
      day: d,
      state,
      adherence,
      isToday: dateKey === today,
      segments,
      completed: summary.completed,
      partial: summary.partial,
      missed: summary.missed,
      log: log ?? null,
    });
  }

  const label = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return {
    year,
    month,
    label,
    days,
    completionRate:
      adherenceDays > 0 ? Math.round(adherenceSum / adherenceDays) : null,
  };
}

export async function getCalendarDayDetail(dateKey: string): Promise<CalendarDayDetail> {
  await requireAuth();
  const today = todayKey();

  const habits = await prisma.habit.findMany({
    where: { status: "active", archived_at: null },
    orderBy: [{ is_priority: "desc" }, { sort_order: "asc" }],
    include: { logs: { where: { log_date: dbDate(dateKey) } } },
  });

  const rows: CalendarDayHabitRow[] = habits.map((row) => {
    const habit = toHabitWithLogs(row);
    const scheduled = isHabitScheduledOn(habit, dateKey) && dateKey >= habit.start_date;
    const log = habit.logs[0];
    const outcome = classifyDayHabit(habit, dateKey, log, today);
    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      behavior_type: habit.behavior_type,
      start_date: habit.start_date,
      timeLabel: timeWindowLabel(habit.time_window, habit.planned_time),
      outcome: scheduled ? outcome : "not_scheduled",
      scheduled,
      log: log ?? null,
    };
  });

  const scheduledOutcomes = rows
    .filter((r) => r.scheduled && r.outcome !== "future")
    .map((r) => r.outcome);
  const summary = summarizeOutcomes(scheduledOutcomes);

  const label = parseDateKey(dateKey).toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    dateKey,
    label,
    isToday: dateKey === today,
    summary,
    habits: rows.filter((r) => r.scheduled),
  };
}

export async function getCalendarRangeMonths(): Promise<{ min: string; max: string }> {
  await requireAuth();
  const today = todayKey();
  const habits = await prisma.habit.findMany({
    where: { status: "active", archived_at: null },
    select: { start_date: true },
    orderBy: { start_date: "asc" },
  });
  const min = habits[0]?.start_date
    ? toDateKey(habits[0].start_date)
    : today.slice(0, 7) + "-01";
  return { min, max: today };
}
