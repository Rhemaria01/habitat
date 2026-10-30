"use client";

import { useState } from "react";
import type { StatsDashboard } from "@/app/actions/stats";
import {
  QueryErrorBanner,
  QueryLoadingOverlay,
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

  const {
    data = initialData,
    isFetching,
    isLoading,
    isError,
    error,
  } = useStatsDashboardQuery(params, {
    initialData:
      year === initialYear && month === initialMonth && range === initialRange
        ? initialData
        : undefined,
  });

  function onMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  return (
    <div className="stats-v2 relative">
      <QueryLoadingOverlay
        show={isFetching && !isLoading}
        label="Refreshing stats…"
      />
      {isError ? <QueryErrorBanner error={error} className="mb-3" /> : null}

      <StatsToolbar
        year={year}
        month={month}
        range={range}
        onMonthChange={onMonthChange}
        onRangeChange={setRange}
      />

      <StatsKpiRow data={data} />

      <div className="stats-v2-grid">
        <div className="stats-v2-main">
          <StatsMonthHeatmap
            days={data.monthHeatmapDays}
            daysInMonth={data.daysInMonth}
            monthLabel={data.monthLabel}
          />
          <div className="stats-v2-charts">
            <StatsTrendChart points={data.trendSeries} />
            <StatsLogDonut breakdown={data.logBreakdown} />
          </div>
          <StatsHabitTable rows={data.habitRows} />
        </div>
        <StatsInsightsSidebar
          insights={data.insights}
          behaviorCounts={data.behaviorCounts}
          breakdown={data.logBreakdown}
          deltaPercent={data.deltaPercent}
          avgAdherence={data.avgAdherence}
        />
      </div>
    </div>
  );
}
