import type { Habit, HabitLog, TimeWindow, TodayHabitItem } from "@/lib/types";

const WINDOW_ORDER: Record<NonNullable<TimeWindow>, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
  custom: 3,
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDurationLabel(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  if (minutes > 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} hr ${m} min` : `${h} hours`;
  }
  return `${minutes} min`;
}

export function formatHabitSubtitle(habit: Habit): string | null {
  const parts: string[] = [];
  if (habit.time_window) parts.push(capitalize(habit.time_window));
  const fromMinutes = formatDurationLabel(habit.estimated_duration_minutes);
  if (fromMinutes) parts.push(fromMinutes);
  else if (habit.planned_time && !habit.cue_time) {
    parts.push(habit.planned_time);
  }
  return parts.length ? parts.join(" · ") : null;
}

function parseClock(value: string): { h: number; m: number } | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  return { h: Number(match[1]), m: Number(match[2]) };
}

function formatTimeRange(startH: number, startM: number, endH: number, endM: number): string {
  const start = new Date(2000, 0, 1, startH, startM);
  const end = new Date(2000, 0, 1, endH, endM);
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const s = start.toLocaleTimeString("en-US", opts);
  const e = end.toLocaleTimeString("en-US", opts);
  const shortStart = s.replace(/\s?(AM|PM)$/i, "");
  return `${shortStart} – ${e}`;
}

export function formatHabitTimeRail(habit: Habit): string | null {
  const start = habit.cue_time ? parseClock(habit.cue_time) : null;
  if (start && habit.estimated_duration_minutes) {
    const total = start.h * 60 + start.m + habit.estimated_duration_minutes;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return formatTimeRange(start.h, start.m, endH, endM);
  }
  if (start) {
    const d = new Date(2000, 0, 1, start.h, start.m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return null;
}

export function sortTodayHabits<T extends { habit: Habit }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const wa = a.habit.time_window ? WINDOW_ORDER[a.habit.time_window] : 9;
    const wb = b.habit.time_window ? WINDOW_ORDER[b.habit.time_window] : 9;
    if (wa !== wb) return wa - wb;
    const ta = a.habit.cue_time ?? a.habit.planned_time ?? "";
    const tb = b.habit.cue_time ?? b.habit.planned_time ?? "";
    return ta.localeCompare(tb);
  });
}

export function isTodayLogComplete(log: HabitLog | null): boolean {
  return Boolean(
    log &&
      log.status !== "missed" &&
      log.status !== "lapse" &&
      log.status !== "skipped",
  );
}

/** Pending habits first (time order), completed habits last — stable within each group. */
export function orderTodayHabitList(
  items: TodayHabitItem[],
  isComplete: (log: HabitLog | null) => boolean = isTodayLogComplete,
): TodayHabitItem[] {
  const tagged = sortTodayHabits(items).map((item, index) => ({ item, index }));
  tagged.sort((a, b) => {
    const aDone = isComplete(a.item.log);
    const bDone = isComplete(b.item.log);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.index - b.index;
  });
  return tagged.map(({ item }) => item);
}

export function numericProgress(habit: Habit, log: HabitLog | null): {
  current: number;
  target: number;
  label: string;
  percent: number;
} | null {
  if (habit.tracking_type !== "numeric" || !habit.tracking_target) return null;
  const current = log?.numeric_value ?? 0;
  const target = habit.tracking_target;
  const unit = habit.tracking_unit ?? "";
  return {
    current,
    target,
    label: `${current.toLocaleString()} / ${target.toLocaleString()}${unit ? ` ${unit}` : ""}`,
    percent: target > 0 ? Math.min(100, (current / target) * 100) : 0,
  };
}

export function streakValueLabel(days: number): string {
  return days === 1 ? "1 day" : `${days} days`;
}
