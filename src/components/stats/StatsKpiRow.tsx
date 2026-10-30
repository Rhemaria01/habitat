"use client";

import type { StatsDashboard } from "@/app/actions/stats";
import StatsCounter from "@/components/ui/stats-counter";

type StatsKpiRowProps = {
  data: StatsDashboard;
};

function DeltaChip({ value }: { value: number | null }) {
  if (value === null) return null;
  const sign = value > 0 ? "+" : "";
  return (
    <span
      className={`stats-kpi-delta ${value >= 0 ? "up" : "down"}`}
    >
      {sign}
      {value}% from last period
    </span>
  );
}

export function StatsKpiRow({ data }: StatsKpiRowProps) {
  const ringPct = data.avgAdherence ?? 0;
  const { build, reduce, avoid } = data.behaviorCounts;

  return (
    <ul className="stats-v2-kpi-grid">
      <li className="stats-v2-kpi-card glass-panel">
        <div
          className="stats-kpi-ring"
          style={{
            background: `conic-gradient(var(--chart-1) 0 ${ringPct}%, color-mix(in srgb, var(--foreground) 12%, transparent) ${ringPct}% 100%)`,
          }}
        >
          <div className="stats-kpi-ring-inner">
            <StatsCounter
              value={data.avgAdherence ?? data.weekAdherence ?? 0}
              suffix="%"
              decimals={0}
              className="stats-kpi-ring-value"
            />
          </div>
        </div>
        <div className="stats-kpi-copy">
          <p className="stats-kpi-label">Average adherence</p>
          <DeltaChip value={data.deltaPercent} />
        </div>
      </li>

      <li className="stats-v2-kpi-card glass-panel">
        <p className="stats-kpi-value">
          <StatsCounter value={data.activeHabits} decimals={0} />
        </p>
        <p className="stats-kpi-label">Active habits</p>
        <p className="stats-kpi-meta">
          {build} build · {reduce} reduce · {avoid} avoid
        </p>
      </li>

      <li className="stats-v2-kpi-card glass-panel">
        <p className="stats-kpi-value">
          <StatsCounter value={data.monthLogCount} decimals={0} />
        </p>
        <p className="stats-kpi-label">Logs this month</p>
        {data.logCountDeltaPercent !== null ? (
          <span
            className={`stats-kpi-delta ${data.logCountDeltaPercent >= 0 ? "up" : "down"}`}
          >
            {data.logCountDeltaPercent >= 0 ? "+" : ""}
            {data.logCountDeltaPercent}% from last month
          </span>
        ) : null}
      </li>

      <li className="stats-v2-kpi-card glass-panel">
        <p className="stats-kpi-value">
          <StatsCounter value={data.bestStreak} decimals={0} />
          <span className="text-base font-semibold text-muted-foreground">
            {data.bestStreak === 1 ? " day" : " days"}
          </span>
        </p>
        <p className="stats-kpi-label">Best streak</p>
        <p className="stats-kpi-meta">Across all habits</p>
      </li>
    </ul>
  );
}
