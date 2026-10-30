export const queryKeys = {
  habits: {
    all: ["habits"] as const,
    list: (includeArchived = false) =>
      [...queryKeys.habits.all, "list", { includeArchived }] as const,
    detail: (id: string) => [...queryKeys.habits.all, "detail", id] as const,
  },
  calendar: {
    all: ["calendar"] as const,
    month: (year: number, month: number) =>
      [...queryKeys.calendar.all, "month", year, month] as const,
    monthHabit: (habitId: string, year: number, month: number) =>
      [...queryKeys.calendar.all, "month-habit", habitId, year, month] as const,
    day: (dateKey: string) =>
      [...queryKeys.calendar.all, "day", dateKey] as const,
  },
  today: {
    all: ["today"] as const,
    day: (dateKey: string) => [...queryKeys.today.all, dateKey] as const,
    recoveryHint: (dateKey: string) =>
      [...queryKeys.today.all, "recovery", dateKey] as const,
  },
  stats: {
    all: ["stats"] as const,
    dashboard: (year: number, month: number, range: string) =>
      [...queryKeys.stats.all, "dashboard", year, month, range] as const,
  },
  profile: {
    all: ["profile"] as const,
    current: () => [...queryKeys.profile.all, "current"] as const,
  },
  onboarding: {
    all: ["onboarding"] as const,
    state: () => [...queryKeys.onboarding.all, "state"] as const,
  },
} as const;
