import type {
  HabitLogModel,
  HabitModel,
  ProfileModel,
} from "@/generated/prisma/models";
import type {
  Habit,
  HabitLog,
  HabitLogStatus,
  HabitWithLogs,
  Profile,
} from "./types";

export function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dbDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

function iso(d: Date): string {
  return d.toISOString();
}

function decimalToNumber(v: { toString(): string } | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function legacyKind(row: HabitModel): Habit["kind"] {
  return row.kind === "quit" ? "quit" : "build";
}

export function toHabit(row: HabitModel): Habit {
  return {
    id: row.id,
    name: row.name,
    kind: legacyKind(row),
    behavior_type: row.behavior_type ?? (row.kind === "quit" ? "reduce" : "build"),
    description: row.description,
    category: row.category,
    personal_reason: row.personal_reason,
    start_date: dateKey(row.start_date),
    color: row.color,
    icon: row.icon ?? null,
    sort_order: row.sort_order,
    archived_at: row.archived_at ? iso(row.archived_at) : null,
    status: (row.status as Habit["status"]) ?? "active",
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
    frequency: row.frequency as Habit["frequency"],
    stack_after: row.stack_after,
    two_minute_version: row.two_minute_version,
    minimum_version: row.minimum_version ?? row.two_minute_version,
    standard_version: row.standard_version,
    stretch_version: row.stretch_version,
    estimated_duration_minutes: row.estimated_duration_minutes,
    identity_proof: row.identity_proof,
    source_key: row.source_key,
    card_art_key: row.card_art_key ?? null,
    card_cover_style: row.card_cover_style ?? null,
    cue_type: row.cue_type,
    cue_time: row.cue_time,
    cue_place: row.cue_place,
    cue_event: row.cue_event,
    anchor_habit_id: row.anchor_habit_id,
    cue_notes: row.cue_notes,
    motivation_meaning: row.motivation_meaning,
    motivation_appeal: row.motivation_appeal,
    motivation_pairing: row.motivation_pairing,
    motivation_social: row.motivation_social,
    friction_obstacle: row.friction_obstacle,
    friction_environment: row.friction_environment,
    friction_increase: row.friction_increase,
    commitment_mechanism: row.commitment_mechanism,
    reward_feedback: row.reward_feedback,
    reward_personal: row.reward_personal,
    recovery_plan: row.recovery_plan,
    recovery_reminder: row.recovery_reminder ?? true,
    schedule_kind: (row.schedule_kind as Habit["schedule_kind"]) ?? "daily",
    schedule_weekdays: row.schedule_weekdays ?? [],
    schedule_days_per_week: row.schedule_days_per_week,
    schedule_custom_days: row.schedule_custom_days ?? [],
    schedule_interval_days: row.schedule_interval_days,
    schedule_end_date: row.schedule_end_date ? dateKey(row.schedule_end_date) : null,
    time_window: row.time_window as Habit["time_window"],
    planned_time: row.planned_time,
    tracking_type: row.tracking_type ?? "binary",
    tracking_unit: row.tracking_unit,
    tracking_target: row.tracking_target,
    is_priority: row.is_priority ?? false,
  };
}

function normalizeLogStatus(status: string): HabitLogStatus {
  if (status === "done") return "completed";
  if (status === "relapse") return "lapse";
  return status as HabitLogStatus;
}

export function toHabitLog(row: HabitLogModel): HabitLog {
  return {
    id: row.id,
    habit_id: row.habit_id,
    log_date: dateKey(row.log_date),
    status: normalizeLogStatus(row.status),
    note: row.note,
    numeric_value: decimalToNumber(row.numeric_value),
    completion_level: row.completion_level as HabitLog["completion_level"],
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at ?? row.created_at),
  };
}

export type HabitWithLogsRow = HabitModel & { logs: HabitLogModel[] };

export function toHabitWithLogs(row: HabitWithLogsRow): HabitWithLogs {
  return { ...toHabit(row), logs: row.logs.map(toHabitLog) };
}

export function toProfile(row: ProfileModel): Profile {
  return {
    id: row.id,
    timezone: row.timezone,
    week_start: row.week_start,
    identity_note: row.identity_note,
    onboarding: (row.onboarding ?? {}) as Record<string, unknown>,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}
