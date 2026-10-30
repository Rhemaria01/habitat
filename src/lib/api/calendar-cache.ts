import type { QueryClient } from "@tanstack/react-query";
import type { CalendarDayDetail, CalendarMonth } from "@/app/actions/calendar";
import { queryKeys } from "@/lib/api/query-keys";
import type { CalendarHabitOutcome } from "@/lib/calendar-day";
import {
  buildOptimisticLog,
  outcomeFromLogStatus,
  patchCalendarDayDetailForLog,
  patchCalendarMonthForLog,
} from "@/lib/calendar-optimistic";
import type { HabitBehaviorType, HabitLogStatus } from "@/lib/types";

export type CalendarOptimisticLogInput = {
  habitId: string;
  dateKey: string;
  status: HabitLogStatus | null;
  behavior: HabitBehaviorType;
  habitColor: string;
  prevOutcome?: CalendarHabitOutcome | null;
};

export type CalendarCacheSnapshot = {
  months: Array<{ key: readonly unknown[]; data: CalendarMonth }>;
  monthHabits: Array<{ key: readonly unknown[]; data: CalendarMonth }>;
  days: Array<{ key: readonly unknown[]; data: CalendarDayDetail }>;
};

export function snapshotCalendarCache(
  queryClient: QueryClient,
): CalendarCacheSnapshot {
  const months: CalendarCacheSnapshot["months"] = [];
  const monthHabits: CalendarCacheSnapshot["monthHabits"] = [];
  const days: CalendarCacheSnapshot["days"] = [];

  for (const [key, data] of queryClient.getQueriesData<CalendarMonth>({
    queryKey: queryKeys.calendar.all,
  })) {
    if (!data) continue;
    if (key[1] === "month" && typeof key[2] === "number") {
      months.push({ key: key as readonly unknown[], data });
    }
    if (key[1] === "month-habit" && typeof key[4] === "number") {
      monthHabits.push({ key: key as readonly unknown[], data });
    }
  }

  for (const [key, data] of queryClient.getQueriesData<CalendarDayDetail>({
    queryKey: queryKeys.calendar.all,
  })) {
    if (!data || key[1] !== "day") continue;
    days.push({ key: key as readonly unknown[], data });
  }

  return { months, monthHabits, days };
}

export function restoreCalendarCache(
  queryClient: QueryClient,
  snapshot: CalendarCacheSnapshot,
) {
  for (const { key, data } of snapshot.months) {
    queryClient.setQueryData(key, data);
  }
  for (const { key, data } of snapshot.monthHabits) {
    queryClient.setQueryData(key, data);
  }
  for (const { key, data } of snapshot.days) {
    queryClient.setQueryData(key, data);
  }
}

export function applyOptimisticCalendarLog(
  queryClient: QueryClient,
  input: CalendarOptimisticLogInput,
) {
  const log = buildOptimisticLog(input.habitId, input.dateKey, input.status);
  const nextOutcome = outcomeFromLogStatus(input.behavior, input.status);
  const prevOutcome =
    input.prevOutcome ?? outcomeFromLogStatus(input.behavior, null);

  for (const [key, data] of queryClient.getQueriesData<CalendarMonth>({
    queryKey: queryKeys.calendar.all,
  })) {
    if (!data) continue;
    if (key[1] === "month") {
      queryClient.setQueryData(
        key,
        patchCalendarMonthForLog(data, {
          dateKey: input.dateKey,
          habitColor: input.habitColor,
          prevOutcome,
          nextOutcome,
          log,
        }),
      );
    }
    if (key[1] === "month-habit" && key[2] === input.habitId) {
      queryClient.setQueryData(
        key,
        patchCalendarMonthForLog(data, {
          dateKey: input.dateKey,
          habitColor: input.habitColor,
          prevOutcome,
          nextOutcome,
          log,
          singleHabit: true,
        }),
      );
    }
  }

  for (const [key, data] of queryClient.getQueriesData<CalendarDayDetail>({
    queryKey: queryKeys.calendar.all,
  })) {
    if (!data || key[1] !== "day") continue;
    queryClient.setQueryData(
      key,
      patchCalendarDayDetailForLog(data, {
        habitId: input.habitId,
        behavior: input.behavior,
        dateKey: input.dateKey,
        log,
      }),
    );
  }
}
