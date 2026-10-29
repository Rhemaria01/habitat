export type HabitBehaviorType = "build" | "reduce" | "avoid";
/** @deprecated use behavior_type */
export type HabitKind = "build" | "quit";
export type HabitLogStatus =
  | "completed"
  | "partial"
  | "missed"
  | "skipped"
  | "maintained"
  | "lapse";
/** @deprecated use HabitLogStatus */
export type LogStatus = HabitLogStatus | "done" | "relapse";

export type ScheduleKind = "daily" | "weekdays" | "days_per_week" | "custom";
export type HabitFrequency = "daily" | "weekly";
export type HabitStatus = "active" | "paused" | "archived";
export type TimeWindow = "morning" | "afternoon" | "evening" | "custom";

export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  behavior_type: HabitBehaviorType;
  description: string | null;
  system_id: string | null;
  category: string | null;
  personal_reason: string | null;
  start_date: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
  status: HabitStatus;
  created_at: string;
  updated_at: string;
  frequency: HabitFrequency;
  stack_after: string | null;
  two_minute_version: string | null;
  minimum_version: string | null;
  standard_version: string | null;
  stretch_version: string | null;
  estimated_duration_minutes: number | null;
  identity_proof: string | null;
  source_key: string | null;
  cue_type: string | null;
  cue_time: string | null;
  cue_place: string | null;
  cue_event: string | null;
  anchor_habit_id: string | null;
  cue_notes: string | null;
  motivation_meaning: string | null;
  motivation_appeal: string | null;
  motivation_pairing: string | null;
  motivation_social: string | null;
  friction_obstacle: string | null;
  friction_environment: string | null;
  friction_increase: string | null;
  commitment_mechanism: string | null;
  reward_feedback: string | null;
  reward_personal: string | null;
  recovery_plan: string | null;
  recovery_reminder: boolean;
  schedule_kind: ScheduleKind;
  schedule_weekdays: number[];
  schedule_days_per_week: number | null;
  schedule_custom_days: number[];
  schedule_end_date: string | null;
  time_window: TimeWindow | null;
  planned_time: string | null;
  tracking_type: string;
  tracking_unit: string | null;
  is_priority: boolean;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  log_date: string;
  status: HabitLogStatus;
  note: string | null;
  numeric_value: number | null;
  completion_level: "minimum" | "standard" | "stretch" | null;
  created_at: string;
  updated_at: string;
};

export type HabitWithLogs = Habit & {
  logs: HabitLog[];
};

export type HabitInput = {
  name: string;
  behavior_type: HabitBehaviorType;
  description?: string | null;
  system_id?: string | null;
  category?: string | null;
  personal_reason?: string | null;
  start_date: string;
  color: string;
  frequency?: HabitFrequency;
  schedule_kind?: ScheduleKind;
  schedule_weekdays?: number[];
  schedule_days_per_week?: number | null;
  schedule_custom_days?: number[];
  schedule_end_date?: string | null;
  time_window?: TimeWindow | null;
  planned_time?: string | null;
  status?: HabitStatus;
  stack_after?: string | null;
  minimum_version?: string | null;
  standard_version?: string | null;
  stretch_version?: string | null;
  estimated_duration_minutes?: number | null;
  identity_proof?: string | null;
  cue_type?: string | null;
  cue_time?: string | null;
  cue_place?: string | null;
  cue_event?: string | null;
  anchor_habit_id?: string | null;
  cue_notes?: string | null;
  motivation_meaning?: string | null;
  motivation_appeal?: string | null;
  motivation_pairing?: string | null;
  motivation_social?: string | null;
  friction_obstacle?: string | null;
  friction_environment?: string | null;
  friction_increase?: string | null;
  commitment_mechanism?: string | null;
  reward_feedback?: string | null;
  reward_personal?: string | null;
  recovery_plan?: string | null;
  recovery_reminder?: boolean;
  tracking_type?: string;
  tracking_unit?: string | null;
  is_priority?: boolean;
  goal_id?: string;
};

export type GoalStatus = "active" | "on_hold" | "completed" | "archived";

export type Goal = {
  id: string;
  title: string;
  identity_statement: string | null;
  why: string | null;
  description: string | null;
  outcome_definition: string | null;
  metric_type: string | null;
  metric_unit: string | null;
  baseline_value: string | null;
  target_value: string | null;
  current_value: string | null;
  metric_direction: "increase" | "decrease";
  status: GoalStatus;
  priority: number;
  start_date: string | null;
  color: string;
  target_date: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalCheckin = {
  id: string;
  goal_id: string;
  checkin_date: string;
  value: number | null;
  note: string;
  created_at: string;
};

export type GoalInput = {
  title: string;
  identity_statement?: string | null;
  why?: string | null;
  description?: string | null;
  outcome_definition?: string | null;
  metric_type?: string | null;
  metric_unit?: string | null;
  baseline_value?: string | null;
  target_value?: string | null;
  current_value?: string | null;
  metric_direction?: "increase" | "decrease";
  status?: GoalStatus;
  priority?: number;
  start_date?: string | null;
  color: string;
  target_date?: string | null;
};

export type System = {
  id: string;
  name: string;
  description: string | null;
  purpose: string | null;
  cadence: string | null;
  status: "active" | "paused" | "archived";
  working_well: string;
  causing_friction: string;
  created_at: string;
  updated_at: string;
};

export type SystemWithRelations = System & {
  goals: Goal[];
  habits: Habit[];
};

export type GoalWithHabits = Goal & {
  habits: HabitWithLogs[];
  systems?: System[];
};

export type Routine = {
  id: string;
  name: string;
  description: string | null;
  schedule_kind: string;
  schedule_weekdays: number[];
  schedule_custom_days: number[];
  time_window: TimeWindow | null;
  planned_time: string | null;
  status: "active" | "paused" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type RoutineStep = {
  id: string;
  routine_id: string;
  title: string;
  habit_id: string | null;
  sort_order: number;
  duration_minutes: number | null;
  is_optional: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RoutineWithSteps = Routine & {
  steps: RoutineStep[];
};

export type RoutineStepLog = {
  id: string;
  routine_step_id: string;
  log_date: string;
  done: boolean;
  note: string | null;
  created_at: string;
};

export type HabitAudit = {
  id: string;
  behavior: string;
  classification: "helpful" | "neutral" | "unhelpful";
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  review_type: "weekly" | "monthly";
  period_start: string;
  period_end: string;
  responses: Record<string, unknown>;
  adjustment_note: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  timezone: string;
  week_start: number;
  identity_note: string | null;
  onboarding: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** @deprecated legacy slot model */
export type RoutineSlotCheck = {
  slot_key: string;
  slot_date: string;
  done: boolean;
};

/** @deprecated */
export type RoutineSlotLink = {
  slot_key: string;
  habit: HabitWithLogs;
  logged: boolean;
};

export type WeeklyReview = {
  id: string;
  week_start_date: string;
  moved_closer: boolean;
  notes: string;
};

export type TodayHabitItem = {
  habit: HabitWithLogs;
  scheduled: boolean;
  log: HabitLog | null;
  routineNames: string[];
};
