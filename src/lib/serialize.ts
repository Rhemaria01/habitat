import type {
  GoalCheckinModel,
  GoalModel,
  HabitAuditModel,
  HabitLogModel,
  HabitModel,
  ProfileModel,
  ReviewModel,
  RoutineModel,
  RoutineStepLogModel,
  RoutineStepModel,
  SystemModel,
  WeeklyReviewModel,
} from "@/generated/prisma/models";
import type {
  Goal,
  GoalCheckin,
  Habit,
  HabitAudit,
  HabitLog,
  HabitLogStatus,
  HabitWithLogs,
  Profile,
  Review,
  Routine,
  RoutineStep,
  RoutineStepLog,
  System,
  WeeklyReview,
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

function decimalToString(v: { toString(): string } | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v.toString();
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
    system_id: row.system_id,
    category: row.category,
    personal_reason: row.personal_reason,
    start_date: dateKey(row.start_date),
    color: row.color,
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
    schedule_end_date: row.schedule_end_date ? dateKey(row.schedule_end_date) : null,
    time_window: row.time_window as Habit["time_window"],
    planned_time: row.planned_time,
    tracking_type: row.tracking_type ?? "binary",
    tracking_unit: row.tracking_unit,
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

export function toGoal(row: GoalModel): Goal {
  return {
    id: row.id,
    title: row.title,
    identity_statement: row.identity_statement,
    why: row.why,
    description: row.description,
    outcome_definition: row.outcome_definition,
    metric_type: row.metric_type,
    metric_unit: row.metric_unit,
    baseline_value: decimalToString(row.baseline_value),
    target_value: decimalToString(row.target_value),
    current_value: decimalToString(row.current_value),
    metric_direction: (row.metric_direction as Goal["metric_direction"]) ?? "increase",
    status: (row.status as Goal["status"]) ?? "active",
    priority: row.priority ?? 0,
    start_date: row.start_date ? dateKey(row.start_date) : null,
    color: row.color,
    target_date: row.target_date ? dateKey(row.target_date) : null,
    archived_at: row.archived_at ? iso(row.archived_at) : null,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toGoalCheckin(row: GoalCheckinModel): GoalCheckin {
  return {
    id: row.id,
    goal_id: row.goal_id,
    checkin_date: dateKey(row.checkin_date),
    value: decimalToNumber(row.value),
    note: row.note,
    created_at: iso(row.created_at),
  };
}

export function toSystem(row: SystemModel): System {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    purpose: row.purpose,
    cadence: row.cadence,
    status: row.status as System["status"],
    working_well: row.working_well,
    causing_friction: row.causing_friction,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toRoutine(row: RoutineModel): Routine {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    schedule_kind: row.schedule_kind,
    schedule_weekdays: row.schedule_weekdays ?? [],
    schedule_custom_days: row.schedule_custom_days ?? [],
    time_window: row.time_window as Routine["time_window"],
    planned_time: row.planned_time,
    status: row.status as Routine["status"],
    sort_order: row.sort_order,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toRoutineStep(row: RoutineStepModel): RoutineStep {
  return {
    id: row.id,
    routine_id: row.routine_id,
    title: row.title,
    habit_id: row.habit_id,
    sort_order: row.sort_order,
    duration_minutes: row.duration_minutes,
    is_optional: row.is_optional,
    notes: row.notes,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toRoutineStepLog(row: RoutineStepLogModel): RoutineStepLog {
  return {
    id: row.id,
    routine_step_id: row.routine_step_id,
    log_date: dateKey(row.log_date),
    done: row.done,
    note: row.note,
    created_at: iso(row.created_at),
  };
}

export function toHabitAudit(row: HabitAuditModel): HabitAudit {
  return {
    id: row.id,
    behavior: row.behavior,
    classification: row.classification as HabitAudit["classification"],
    notes: row.notes,
    sort_order: row.sort_order,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
}

export function toReview(row: ReviewModel): Review {
  return {
    id: row.id,
    review_type: row.review_type as Review["review_type"],
    period_start: dateKey(row.period_start),
    period_end: dateKey(row.period_end),
    responses: (row.responses ?? {}) as Record<string, unknown>,
    adjustment_note: row.adjustment_note,
    created_at: iso(row.created_at),
    updated_at: iso(row.updated_at),
  };
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

export function toWeeklyReview(row: WeeklyReviewModel): WeeklyReview {
  return {
    id: row.id,
    week_start_date: dateKey(row.week_start_date),
    moved_closer: row.moved_closer,
    notes: row.notes,
  };
}
