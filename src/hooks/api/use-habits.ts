"use client";

import { useQuery } from "@tanstack/react-query";
import { getHabit, listHabits } from "@/app/actions/habits";
import { queryKeys } from "@/lib/api/query-keys";
import type { HabitWithLogs } from "@/lib/types";

export function useHabitsQuery(options?: {
  includeArchived?: boolean;
  initialData?: HabitWithLogs[];
}) {
  const includeArchived = options?.includeArchived ?? false;
  return useQuery({
    queryKey: queryKeys.habits.list(includeArchived),
    queryFn: () => listHabits(includeArchived),
    initialData: options?.initialData,
  });
}

export function useHabitQuery(
  id: string,
  options?: { initialData?: HabitWithLogs | null },
) {
  return useQuery({
    queryKey: queryKeys.habits.detail(id),
    queryFn: () => getHabit(id),
    initialData: options?.initialData ?? undefined,
  });
}
