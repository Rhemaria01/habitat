export type HabitKind = "build" | "quit";
export type LogStatus = "done" | "relapse";
export type HabitFrequency = "daily" | "weekly";

export type Habit = {
  id: string;
  name: string;
  kind: HabitKind;
  start_date: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  frequency: HabitFrequency;
  /** Habit-stacking cue: "After I <stack_after>, I will <habit>." */
  stack_after: string | null;
  /** Atomic Habits 2-minute-rule version of the habit. */
  two_minute_version: string | null;
  /** One check-in = one vote for the identity this habit serves. */
  identity_proof: string | null;
  /** Set when the habit was adopted from the practice library. */
  source_key: string | null;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  log_date: string;
  status: LogStatus;
  created_at: string;
};

export type HabitWithLogs = Habit & {
  logs: HabitLog[];
};

export type HabitInput = {
  name: string;
  kind: HabitKind;
  start_date: string;
  color: string;
  frequency?: HabitFrequency;
  stack_after?: string | null;
  two_minute_version?: string | null;
  identity_proof?: string | null;
  /** Quit habits only: dates the user relapsed (defaults to none = all kept). */
  relapse_dates?: string[];
  /**
   * Grow habits only. When present (including []), seed done logs for every
   * day from start→today except these missed dates.
   */
  missed_dates?: string[];
  /** When created from the goal detail page, link to this goal. */
  goal_id?: string;
};

export type Goal = {
  id: string;
  title: string;
  /** e.g. "I am a healthy person" — shown as the goal's hero line. */
  identity_statement: string;
  why: string | null;
  color: string;
  target_date: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalInput = {
  title: string;
  identity_statement: string;
  why?: string | null;
  color: string;
  target_date?: string | null;
};

export type GoalWithHabits = Goal & {
  habits: HabitWithLogs[];
};

export type RoutineSlotCheck = {
  slot_key: string;
  slot_date: string;
  done: boolean;
};

export type RoutineSlotLink = {
  slot_key: string;
  habit: HabitWithLogs;
  /** Whether the linked habit already has a log row for the requested date. */
  logged: boolean;
};

export type Reflection = {
  id: string;
  reflect_date: string;
  went_well: string;
  distracted: string;
  improve_tomorrow: string;
};

export type WeeklyReview = {
  id: string;
  week_start_date: string;
  moved_closer: boolean;
  notes: string;
};
