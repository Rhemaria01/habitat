import { addDays, daysBetween, todayKey } from "./dates";
import type { HabitKind, HabitLog, HabitWithLogs } from "./types";

export type StreakStats = {
  currentStreak: number;
  daysSinceStart: number;
  bestStreak: number;
};

function logSet(
  logs: HabitLog[],
  status: HabitLog["status"],
): Set<string> {
  return new Set(
    logs.filter((log) => log.status === status).map((log) => log.log_date),
  );
}

function countBuildStreak(doneDates: Set<string>, fromKey: string): number {
  let streak = 0;
  let cursor = fromKey;
  // Allow streak to still count if today isn't done yet but yesterday was
  if (!doneDates.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function countQuitStreak(
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

function bestQuitStreak(
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
  kind: HabitKind,
  startDate: string,
  logs: HabitLog[],
  asOf: string = todayKey(),
): StreakStats {
  const daysSinceStart =
    asOf < startDate ? 0 : daysBetween(startDate, asOf) + 1;

  if (kind === "build") {
    const done = logSet(logs, "done");
    return {
      currentStreak: countBuildStreak(done, asOf),
      daysSinceStart,
      bestStreak: bestBuildStreak(done, startDate, asOf),
    };
  }

  const relapses = logSet(logs, "relapse");
  return {
    currentStreak: countQuitStreak(startDate, relapses, asOf),
    daysSinceStart,
    bestStreak: bestQuitStreak(startDate, relapses, asOf),
  };
}

/**
 * Did this habit "move this week"?
 * build: at least one done log in the last 7 days.
 * quit: started by then and no relapse in the last 7 days.
 */
export function movedThisWeek(
  habit: HabitWithLogs,
  asOf: string = todayKey(),
): boolean {
  const weekAgo = addDays(asOf, -6);
  if (habit.start_date > asOf) return false;

  if (habit.kind === "build") {
    return habit.logs.some(
      (log) => log.status === "done" && log.log_date >= weekAgo,
    );
  }
  return !habit.logs.some(
    (log) => log.status === "relapse" && log.log_date >= weekAgo,
  );
}

export type GoalStats = {
  kept: number;
  total: number;
  percent: number;
  votes: number;
};

/** Weekly consistency for a goal's task list + total identity votes. */
export function computeGoalStats(
  habits: HabitWithLogs[],
  asOf: string = todayKey(),
): GoalStats {
  const total = habits.length;
  const kept = habits.filter((h) => movedThisWeek(h, asOf)).length;
  const votes = habits.reduce(
    (sum, h) =>
      sum +
      (h.kind === "build"
        ? h.logs.filter((l) => l.status === "done").length
        : // quitting: every clean day since the quit date is a vote
          Math.max(
            0,
            daysBetween(h.start_date, asOf) +
              1 -
              h.logs.filter((l) => l.status === "relapse").length,
          )),
    0,
  );
  return {
    kept,
    total,
    percent: total === 0 ? 0 : Math.round((kept / total) * 100),
    votes,
  };
}
