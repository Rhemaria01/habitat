import type {
  GoalModel,
  HabitLogModel,
  HabitModel,
  RoutineSlotModel,
  WeeklyReviewModel,
} from "@/generated/prisma/models";
import type { RoutineSlot, DayType } from "@/lib/content/routine";
import type {
  Goal,
  Habit,
  HabitLog,
  HabitWithLogs,
  WeeklyReview,
} from "./types";

/**
 * Boundary between Prisma rows (Date objects) and app types (strings),
 * so pages/components keep receiving exactly what supabase-js returned.
 */

/** Format a Postgres `date` column as YYYY-MM-DD using UTC getters. */
export function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD app key into a Date for `date` columns (UTC midnight). */
export function dbDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

function iso(d: Date): string {
  return d.toISOString();
}

export function toHabit(row: HabitModel): Habit {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    start_date: dateKey(row.start_date),
    color: row.color,
    sort_order: row.sort_order,
    archived_at: row.archived_at ? iso(row.archived_at) : null,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
    frequency: row.frequency as Habit["frequency"],
    stack_after: row.stack_after,
    two_minute_version: row.two_minute_version,
    identity_proof: row.identity_proof,
    source_key: row.source_key,
  };
}

export function toHabitLog(row: HabitLogModel): HabitLog {
  return {
    id: row.id,
    habit_id: row.habit_id,
    log_date: dateKey(row.log_date),
    status: row.status as HabitLog["status"],
    created_at: iso(row.created_at),
  };
}

export type HabitWithLogsRow = HabitModel & { logs: HabitLogModel[] };

export function toHabitWithLogs(row: HabitWithLogsRow): HabitWithLogs {
  return { ...toHabit(row), logs: row.logs.map(toHabitLog) };
}

export function toGoal(row: GoalModel): Goal {
  return {
    id: row.id,
    title: row.title,
    identity_statement: row.identity_statement,
    why: row.why,
    color: row.color,
    target_date: row.target_date ? dateKey(row.target_date) : null,
    archived_at: row.archived_at ? iso(row.archived_at) : null,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toWeeklyReview(row: WeeklyReviewModel): WeeklyReview {
  return {
    id: row.id,
    week_start_date: dateKey(row.week_start_date),
    moved_closer: row.moved_closer,
    notes: row.notes,
  };
}

export function toRoutineSlot(row: RoutineSlotModel): RoutineSlot {
  return {
    id: row.id,
    key: row.slot_key,
    dayType: row.day_type as DayType,
    time: row.time,
    title: row.title,
    doText: row.do_text,
    dontText: row.dont_text,
  };
}
