import { addDays, eachDayKey } from "@/lib/dates";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import {
  countsAsMiss,
  countsAsSuccess,
} from "@/lib/domain/log-status";
import type { Habit, HabitLog, HabitWithLogs } from "@/lib/types";

export type AdherenceSummary = {
  scheduled: number;
  completed: number;
  partial: number;
  missed: number;
  skipped: number;
  unlogged: number;
  rate: number | null;
};

function logByDate(logs: HabitLog[]): Map<string, HabitLog> {
  return new Map(logs.map((l) => [l.log_date, l]));
}

export function adherenceForRange(
  habit: Habit,
  logs: HabitLog[],
  startKey: string,
  endKey: string,
): AdherenceSummary {
  const days = eachDayKey(startKey, endKey).filter((d) =>
    isHabitScheduledOn(habit, d),
  );
  const byDate = logByDate(logs);
  let completed = 0;
  let partial = 0;
  let missed = 0;
  let skipped = 0;
  let unlogged = 0;

  for (const d of days) {
    const log = byDate.get(d);
    if (!log) {
      unlogged++;
      continue;
    }
    if (log.status === "skipped") skipped++;
    else if (countsAsSuccess(log.status, habit.behavior_type)) {
      if (log.status === "partial") partial++;
      else completed++;
    } else if (countsAsMiss(log.status, habit.behavior_type)) missed++;
  }

  const scheduled = days.length;
  const successes = completed + partial;
  const denominator = scheduled - skipped;
  const rate =
    denominator > 0 ? Math.round((successes / denominator) * 1000) / 10 : null;

  return {
    scheduled,
    completed,
    partial,
    missed,
    skipped,
    unlogged,
    rate,
  };
}

export function rollingConsistency(
  habit: HabitWithLogs,
  endKey: string,
  windowDays = 7,
): AdherenceSummary {
  let cursor = endKey;
  const days: string[] = [];
  for (let i = 0; i < 365 && days.length < windowDays; i++) {
    if (isHabitScheduledOn(habit, cursor)) days.unshift(cursor);
    cursor = addDays(cursor, -1);
  }
  if (days.length === 0) {
    return {
      scheduled: 0,
      completed: 0,
      partial: 0,
      missed: 0,
      skipped: 0,
      unlogged: 0,
      rate: null,
    };
  }
  return adherenceForRange(habit, habit.logs, days[0], days[days.length - 1]);
}
