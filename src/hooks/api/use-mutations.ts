"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  pauseHabit,
  reorderHabits,
  seedHistoryFromStart,
  toggleHabitDay,
  updateHabit,
} from "@/app/actions/habits";
import { exportUserData, updateProfile } from "@/app/actions/settings";
import { completeOnboarding } from "@/app/actions/onboarding";
import { setHabitLog } from "@/app/actions/today";
import { queryKeys } from "@/lib/api/query-keys";
import {
  applyOptimisticCalendarLog,
  restoreCalendarCache,
  snapshotCalendarCache,
  type CalendarCacheSnapshot,
} from "@/lib/api/calendar-cache";
import { useActionMutation } from "@/hooks/api/use-action-mutation";
import { outcomeFromLogStatus } from "@/lib/calendar-optimistic";
import type { CalendarHabitOutcome } from "@/lib/calendar-day";
import type { HabitBehaviorType, HabitInput, HabitLogStatus } from "@/lib/types";

export type SetHabitLogMutationInput = {
  habitId: string;
  dateKey: string;
  status: HabitLogStatus | null;
  behavior: HabitBehaviorType;
  habitColor: string;
  prevOutcome?: CalendarHabitOutcome | null;
};

export type ToggleHabitDayMutationInput = {
  habitId: string;
  behavior: HabitBehaviorType;
  dateKey: string;
  wasActive: boolean;
  habitColor?: string;
};

export function useCreateHabitMutation() {
  return useActionMutation(createHabit, { invalidateHabits: true });
}

export function useUpdateHabitMutation(habitId: string) {
  return useActionMutation(
    (input: HabitInput) => updateHabit(habitId, input),
    { invalidateHabits: { habitId } },
  );
}

export function useSeedHistoryMutation() {
  return useActionMutation(
    (input: {
      habitId: string;
      behavior: HabitBehaviorType;
      startDate: string;
      dates: string[];
    }) =>
      seedHistoryFromStart(
        input.habitId,
        input.behavior,
        input.startDate,
        input.dates,
      ),
    { invalidateHabits: true, errorToast: true },
  );
}

export function useExportUserDataMutation() {
  return useActionMutation(async () => exportUserData(), { errorToast: true });
}

export function useDeleteHabitMutation(habitId: string) {
  return useActionMutation(async () => deleteHabit(habitId), {
    invalidateHabits: { habitId },
  });
}

export function usePauseHabitMutation() {
  return useActionMutation(pauseHabit, { invalidateHabits: true });
}

export function useArchiveHabitMutation() {
  return useActionMutation(archiveHabit, { invalidateHabits: true });
}

export function useReorderHabitsMutation() {
  return useActionMutation(reorderHabits, {
    invalidateHabits: true,
    errorToast: true,
  });
}

export function useToggleHabitDayMutation() {
  const queryClient = useQueryClient();
  return useActionMutation(
    (input: ToggleHabitDayMutationInput) =>
      toggleHabitDay(
        input.habitId,
        input.behavior,
        input.dateKey,
        input.wasActive,
      ),
    {
      invalidateHabits: true,
      errorToast: true,
      onMutate: (input) => {
        if (!input.habitColor) return undefined;
        const snapshot = snapshotCalendarCache(queryClient);
        const nextStatus: HabitLogStatus | null = input.wasActive
          ? null
          : input.behavior === "build"
            ? "completed"
            : "maintained";
        const prevOutcome = input.wasActive
          ? outcomeFromLogStatus(
              input.behavior,
              input.behavior === "build" ? "completed" : "maintained",
            )
          : outcomeFromLogStatus(input.behavior, null);
        applyOptimisticCalendarLog(queryClient, {
          habitId: input.habitId,
          dateKey: input.dateKey,
          status: nextStatus,
          behavior: input.behavior,
          habitColor: input.habitColor,
          prevOutcome,
        });
        return { snapshot };
      },
      onSettled: (_data, error, _input, context) => {
        const ctx = context as { snapshot: CalendarCacheSnapshot } | undefined;
        if (error && ctx?.snapshot) {
          restoreCalendarCache(queryClient, ctx.snapshot);
        }
      },
    },
  );
}

export function useSetHabitLogMutation() {
  const queryClient = useQueryClient();
  return useActionMutation(
    (input: SetHabitLogMutationInput) =>
      setHabitLog(input.habitId, input.dateKey, input.status),
    {
      invalidateHabits: true,
      errorToast: true,
      onMutate: (input) => {
        const snapshot = snapshotCalendarCache(queryClient);
        const prevOutcome =
          input.prevOutcome ??
          outcomeFromLogStatus(input.behavior, null);
        applyOptimisticCalendarLog(queryClient, {
          habitId: input.habitId,
          dateKey: input.dateKey,
          status: input.status,
          behavior: input.behavior,
          habitColor: input.habitColor,
          prevOutcome,
        });
        return { snapshot };
      },
      onSettled: (_data, error, _input, context) => {
        const ctx = context as { snapshot: CalendarCacheSnapshot } | undefined;
        if (error && ctx?.snapshot) {
          restoreCalendarCache(queryClient, ctx.snapshot);
        }
      },
    },
  );
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useActionMutation(updateProfile, {
    errorToast: true,
    successToast: "Saved",
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

export function useCompleteOnboardingMutation() {
  return useActionMutation(async () => completeOnboarding(), {
    errorToast: true,
  });
}
