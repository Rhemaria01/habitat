import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

/** Refetch lists that depend on habit logs or habit definitions. */
export function invalidateHabitDomain(
  queryClient: QueryClient,
  options?: { habitId?: string },
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.today.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  if (options?.habitId) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.habits.detail(options.habitId),
    });
  }
}
