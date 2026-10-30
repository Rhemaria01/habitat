"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCalendarDayDetail,
  getCalendarMonth,
  getCalendarMonthForHabit,
  type CalendarDayDetail,
  type CalendarMonth,
} from "@/app/actions/calendar";
import { queryKeys } from "@/lib/api/query-keys";

export function useCalendarMonthQuery(
  year: number,
  month: number,
  options?: { initialData?: CalendarMonth },
) {
  return useQuery({
    queryKey: queryKeys.calendar.month(year, month),
    queryFn: () => getCalendarMonth(year, month),
    initialData:
      options?.initialData &&
      options.initialData.year === year &&
      options.initialData.month === month
        ? options.initialData
        : undefined,
    placeholderData: (previous) => previous,
  });
}

export function useCalendarDayQuery(
  dateKey: string,
  options?: { initialData?: CalendarDayDetail },
) {
  return useQuery({
    queryKey: queryKeys.calendar.day(dateKey),
    queryFn: () => getCalendarDayDetail(dateKey),
    initialData:
      options?.initialData?.dateKey === dateKey
        ? options.initialData
        : undefined,
    enabled: Boolean(dateKey),
  });
}

export function useHabitCalendarMonthQuery(
  habitId: string,
  year: number,
  month: number,
  options?: { initialData?: CalendarMonth },
) {
  return useQuery({
    queryKey: queryKeys.calendar.monthHabit(habitId, year, month),
    queryFn: () => getCalendarMonthForHabit(habitId, year, month),
    initialData:
      options?.initialData &&
      options.initialData.year === year &&
      options.initialData.month === month
        ? options.initialData
        : undefined,
    placeholderData: (previous) => previous,
  });
}
