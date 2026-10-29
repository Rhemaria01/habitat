import { addDays, daysBetween, todayKey } from "./dates";
import type { HabitBehaviorType, HabitLog, HabitWithLogs } from "./types";

export type StreakStats = {
  currentStreak: number;
  daysSinceStart: number;
  bestStreak: number;
};

function successDates(logs: HabitLog[], behavior: HabitBehaviorType): Set<string> {
  const ok =
    behavior === "build"
      ? new Set(["completed", "partial"])
      : new Set(["maintained"]);
  return new Set(
    logs.filter((log) => ok.has(log.status)).map((log) => log.log_date),
  );
}

function lapseDates(logs: HabitLog[]): Set<string> {
  return new Set(
    logs.filter((log) => log.status === "lapse").map((log) => log.log_date),
  );
}

function countBuildStreak(doneDates: Set<string>, fromKey: string): number {
  let streak = 0;
  let cursor = fromKey;
  if (!doneDates.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function countReduceStreak(
  startDate: string,
  relapseDates: Set<string>,
  asOf: string,
): number {
  if (asOf < startDate) return 0;
  let lastRelapse: string | null = null;
  for (const date of relapseDates) {
    if (date >= startDate && date <= asOf) {
      if (!lastRelapse || date > lastRelapse) lastRelapse = date;
    }
  }
  const streakStart = lastRelapse ? addDays(lastRelapse, 1) : startDate;
  if (streakStart > asOf) return 0;
  return daysBetween(streakStart, asOf) + 1;
}

function bestBuildStreak(doneDates: Set<string>, startDate: string, asOf: string): number {
  let best = 0;
  let run = 0;
  for (let cursor = startDate; cursor <= asOf; cursor = addDays(cursor, 1)) {
    if (doneDates.has(cursor)) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

function bestReduceStreak(
  startDate: string,
  relapseDates: Set<string>,
  asOf: string,
): number {
  if (asOf < startDate) return 0;
  let best = 0;
  let run = 0;
  for (let cursor = startDate; cursor <= asOf; cursor = addDays(cursor, 1)) {
    if (relapseDates.has(cursor)) {
      best = Math.max(best, run);
      run = 0;
    } else {
      run += 1;
      best = Math.max(best, run);
    }
  }
  return best;
}

export function computeStreakStats(
  behavior: HabitBehaviorType,
  startDate: string,
  logs: HabitLog[],
  asOf: string = todayKey(),
): StreakStats {
  const daysSinceStart =
    asOf < startDate ? 0 : daysBetween(startDate, asOf) + 1;

  if (behavior === "build") {
    const done = successDates(logs, "build");
    return {
      currentStreak: countBuildStreak(done, asOf),
      daysSinceStart,
      bestStreak: bestBuildStreak(done, startDate, asOf),
    };
  }

  const relapses = lapseDates(logs);
  return {
    currentStreak: countReduceStreak(startDate, relapses, asOf),
    daysSinceStart,
    bestStreak: bestReduceStreak(startDate, relapses, asOf),
  };
}

export function movedThisWeek(
  habit: HabitWithLogs,
  asOf: string = todayKey(),
): boolean {
  const weekAgo = addDays(asOf, -6);
  if (habit.start_date > asOf) return false;

  if (habit.behavior_type === "build") {
    return habit.logs.some(
      (log) =>
        (log.status === "completed" || log.status === "partial") &&
        log.log_date >= weekAgo,
    );
  }
  return !habit.logs.some(
    (log) => log.status === "lapse" && log.log_date >= weekAgo,
  );
}

export type GoalStats = {
  kept: number;
  total: number;
  percent: number;
  votes: number;
};

export function computeGoalStats(
  habits: HabitWithLogs[],
  asOf: string = todayKey(),
): GoalStats {
  const total = habits.length;
  const kept = habits.filter((h) => movedThisWeek(h, asOf)).length;
  const votes = habits.reduce((sum, h) => {
    if (h.behavior_type === "build") {
      return (
        sum +
        h.logs.filter((l) => l.status === "completed" || l.status === "partial")
          .length
      );
    }
    return (
      sum +
      Math.max(
        0,
        daysBetween(h.start_date, asOf) +
          1 -
          h.logs.filter((l) => l.status === "lapse").length,
      )
    );
  }, 0);
  return {
    kept,
    total,
    percent: total === 0 ? 0 : Math.round((kept / total) * 100),
    votes,
  };
}
