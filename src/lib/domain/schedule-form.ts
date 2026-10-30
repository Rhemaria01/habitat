import { daysBetween } from "@/lib/dates";
import type { Habit, HabitInput } from "@/lib/types";

export type ScheduleMode = "daily" | "weekly" | "custom";
export type WeeklyVariant = "once" | "times";
export type CustomVariant = "weekdays" | "interval";

export type ScheduleFormState = {
  mode: ScheduleMode;
  weeklyVariant: WeeklyVariant;
  weeklyDay: number;
  timesPerWeek: number;
  customVariant: CustomVariant;
  weekdays: number[];
  intervalDays: number;
};

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export function scheduleFormFromHabit(habit?: Habit): ScheduleFormState {
  const defaults: ScheduleFormState = {
    mode: "daily",
    weeklyVariant: "once",
    weeklyDay: 1,
    timesPerWeek: 1,
    customVariant: "weekdays",
    weekdays: [1, 2, 3, 4, 5],
    intervalDays: 2,
  };
  if (!habit) return defaults;

  if (habit.schedule_kind === "every_n_days") {
    return {
      ...defaults,
      mode: "custom",
      customVariant: "interval",
      intervalDays: habit.schedule_interval_days ?? 2,
    };
  }
  if (habit.schedule_kind === "days_per_week") {
    return {
      ...defaults,
      mode: "weekly",
      weeklyVariant: "times",
      timesPerWeek: habit.schedule_days_per_week ?? 1,
    };
  }
  if (
    habit.schedule_kind === "custom" &&
    habit.schedule_custom_days.length === 1 &&
    habit.frequency === "weekly"
  ) {
    return {
      ...defaults,
      mode: "weekly",
      weeklyVariant: "once",
      weeklyDay: habit.schedule_custom_days[0] ?? 1,
    };
  }
  if (habit.schedule_kind === "custom" && habit.schedule_custom_days.length > 0) {
    return {
      ...defaults,
      mode: "custom",
      customVariant: "weekdays",
      weekdays: [...habit.schedule_custom_days],
    };
  }
  if (habit.schedule_kind === "weekdays") {
    return {
      ...defaults,
      mode: "custom",
      customVariant: "weekdays",
      weekdays:
        habit.schedule_weekdays.length > 0
          ? [...habit.schedule_weekdays]
          : [1, 2, 3, 4, 5],
    };
  }
  if (habit.frequency === "weekly") {
    return { ...defaults, mode: "weekly", weeklyVariant: "once", weeklyDay: 1 };
  }
  return defaults;
}

export function habitScheduleInput(
  state: ScheduleFormState,
): Pick<
  HabitInput,
  | "frequency"
  | "schedule_kind"
  | "schedule_weekdays"
  | "schedule_days_per_week"
  | "schedule_custom_days"
  | "schedule_interval_days"
> {
  switch (state.mode) {
    case "daily":
      return {
        frequency: "daily",
        schedule_kind: "daily",
        schedule_weekdays: [],
        schedule_days_per_week: null,
        schedule_custom_days: [],
        schedule_interval_days: null,
      };
    case "weekly":
      if (state.weeklyVariant === "times") {
        return {
          frequency: "weekly",
          schedule_kind: "days_per_week",
          schedule_days_per_week: state.timesPerWeek,
          schedule_weekdays: [],
          schedule_custom_days: [],
          schedule_interval_days: null,
        };
      }
      return {
        frequency: "weekly",
        schedule_kind: "custom",
        schedule_custom_days: [state.weeklyDay],
        schedule_weekdays: [],
        schedule_days_per_week: null,
        schedule_interval_days: null,
      };
    case "custom":
      if (state.customVariant === "interval") {
        return {
          frequency: "daily",
          schedule_kind: "every_n_days",
          schedule_interval_days: state.intervalDays,
          schedule_weekdays: [],
          schedule_days_per_week: null,
          schedule_custom_days: [],
        };
      }
      return {
        frequency: "daily",
        schedule_kind: "custom",
        schedule_custom_days: [...state.weekdays].sort((a, b) => a - b),
        schedule_weekdays: [],
        schedule_days_per_week: null,
        schedule_interval_days: null,
      };
  }
}

export function validateScheduleForm(state: ScheduleFormState): string | null {
  if (state.mode === "weekly" && state.weeklyVariant === "times") {
    if (state.timesPerWeek < 1 || state.timesPerWeek > 7) {
      return "Pick 1–7 times per week.";
    }
  }
  if (state.mode === "custom" && state.customVariant === "weekdays") {
    if (state.weekdays.length === 0) return "Pick at least one day.";
  }
  if (state.mode === "custom" && state.customVariant === "interval") {
    if (state.intervalDays < 2 || state.intervalDays > 365) {
      return "Interval must be between 2 and 365 days.";
    }
  }
  return null;
}
