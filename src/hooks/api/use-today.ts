"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMissedRecoveryHint,
  getTodayData,
} from "@/app/actions/today";
import { queryKeys } from "@/lib/api/query-keys";

export function useTodayQuery(
  dateKey: string,
  options?: {
    initialData?: Awaited<ReturnType<typeof getTodayData>>;
    initialRecoveryHint?: string | null;
  },
) {
  const todayQuery = useQuery({
    queryKey: queryKeys.today.day(dateKey),
    queryFn: () => getTodayData(dateKey),
    initialData: options?.initialData,
  });

  const recoveryQuery = useQuery({
    queryKey: queryKeys.today.recoveryHint(dateKey),
    queryFn: () => getMissedRecoveryHint(dateKey),
    initialData: options?.initialRecoveryHint ?? undefined,
  });

  return {
    ...todayQuery,
    recoveryHint: recoveryQuery.data ?? null,
    isRecoveryLoading: recoveryQuery.isLoading,
  };
}
