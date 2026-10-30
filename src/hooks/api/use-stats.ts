"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStatsDashboard,
  type StatsDashboard,
  type StatsDashboardParams,
} from "@/app/actions/stats";
import { queryKeys } from "@/lib/api/query-keys";
import type { StatsRangeKey } from "@/lib/stats-aggregate";

export type StatsQueryParams = {
  year: number;
  month: number;
  range: StatsRangeKey;
};

export function useStatsDashboardQuery(
  params: StatsQueryParams,
  options?: { initialData?: StatsDashboard },
) {
  const { year, month, range } = params;
  return useQuery({
    queryKey: queryKeys.stats.dashboard(year, month, range),
    queryFn: () =>
      getStatsDashboard({ year, month, range } satisfies StatsDashboardParams),
    initialData: options?.initialData,
  });
}
