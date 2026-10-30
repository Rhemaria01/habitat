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

export type ScheduleKind =
  | "daily"
  | "weekdays"
  | "days_per_week"
  | "custom"
  | "every_n_days";
export type HabitFrequency = "daily" | "weekly";
export type HabitStatus = "active" | "paused" | "archived";
export type TimeWindow = "morning" | "afternoon" | "evening" | "custom";

export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  behavior_type: HabitBehaviorType;
  description: string | null;
  category: string | null;
  personal_reason: string | null;
  start_date: string;
  color: string;
  icon: string | null;
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
  card_art_key: string | null;
  card_cover_style: string | null;
  card_cover_image_key: string | null;
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
  schedule_interval_days: number | null;
  schedule_end_date: string | null;
  time_window: TimeWindow | null;
  planned_time: string | null;
  tracking_type: string;
  tracking_unit: string | null;
  tracking_target: number | null;
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
  category?: string | null;
  personal_reason?: string | null;
  start_date: string;
  color: string;
  icon?: string | null;
  card_art_key?: string | null;
  card_cover_style?: string | null;
  card_cover_image_key?: string | null;
  frequency?: HabitFrequency;
  schedule_kind?: ScheduleKind;
  schedule_weekdays?: number[];
  schedule_days_per_week?: number | null;
  schedule_custom_days?: number[];
  schedule_interval_days?: number | null;
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
  tracking_target?: number | null;
  is_priority?: boolean;
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

export type TodayHabitItem = {
  habit: HabitWithLogs;
  scheduled: boolean;
  log: HabitLog | null;
};
