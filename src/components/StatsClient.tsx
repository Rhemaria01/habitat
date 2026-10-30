"use client";

import { useState } from "react";
import type { StatsDashboard } from "@/app/actions/stats";
import {
  QueryErrorBanner,
  StatsPageSkeleton,
} from "@/components/api/QueryLoading";
import { StatsHabitTable } from "@/components/stats/StatsHabitTable";
import { StatsInsightsSidebar } from "@/components/stats/StatsInsightsSidebar";
import { StatsKpiRow } from "@/components/stats/StatsKpiRow";
import { StatsLogDonut } from "@/components/stats/StatsLogDonut";
import { StatsMonthHeatmap } from "@/components/stats/StatsMonthHeatmap";
import { StatsToolbar } from "@/components/stats/StatsToolbar";
import { StatsTrendChart } from "@/components/stats/StatsTrendChart";
import {
  useStatsDashboardQuery,
  type StatsQueryParams,
} from "@/hooks/api/use-stats";
import type { StatsRangeKey } from "@/lib/stats-aggregate";

type StatsClientProps = {
  initialData: StatsDashboard;
  initialYear: number;
  initialMonth: number;
  initialRange: StatsRangeKey;
};

export function StatsClient({
  initialData,
  initialYear,
  initialMonth,
  initialRange,
}: StatsClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [range, setRange] = useState<StatsRangeKey>(initialRange);

  const params: StatsQueryParams = { year, month, range };

  const { data, isFetching, isLoading, isError, error } =
    useStatsDashboardQuery(params, {
      initialData:
        year === initialYear && month === initialMonth && range === initialRange
          ? initialData
          : undefined,
    });

  const dataMatches =
    Boolean(data) &&
    data!.year === year &&
    data!.month === month &&
    data!.range === range;
  const showStatsSkeleton = isLoading || (isFetching && !dataMatches);
  const dashboard = dataMatches ? data! : initialData;

  function onMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  return (
    <div className="stats-v2">
      {isError ? <QueryErrorBanner error={error} className="mb-3" /> : null}

      <StatsToolbar
        year={year}
        month={month}
        range={range}
        onMonthChange={onMonthChange}
        onRangeChange={setRange}
      />

      {showStatsSkeleton ? (
        <StatsPageSkeleton />
      ) : (
        <>
          <StatsKpiRow data={dashboard} />

          <div className="stats-v2-grid">
            <div className="stats-v2-main">
              <StatsMonthHeatmap
                days={dashboard.monthHeatmapDays}
                daysInMonth={dashboard.daysInMonth}
                monthLabel={dashboard.monthLabel}
              />
              <div className="stats-v2-charts">
                <StatsTrendChart points={dashboard.trendSeries} />
                <StatsLogDonut breakdown={dashboard.logBreakdown} />
              </div>
              <StatsHabitTable rows={dashboard.habitRows} />
            </div>
            <StatsInsightsSidebar
              insights={dashboard.insights}
              behaviorCounts={dashboard.behaviorCounts}
              breakdown={dashboard.logBreakdown}
              deltaPercent={dashboard.deltaPercent}
              avgAdherence={dashboard.avgAdherence}
            />
          </div>
        </>
      )}
    </div>
  );
}
