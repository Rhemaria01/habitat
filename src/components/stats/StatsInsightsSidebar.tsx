"use client";

import type { StatsBehaviorCounts, StatsLogBreakdown } from "@/app/actions/stats";
import { StatsInsightPet } from "@/components/stats/StatsInsightPet";
import { Sparkles } from "lucide-react";

type StatsInsightsSidebarProps = {
  insights: string[];
  behaviorCounts: StatsBehaviorCounts;
  breakdown: StatsLogBreakdown;
  deltaPercent: number | null;
  avgAdherence: number | null;
};

export function StatsInsightsSidebar({
  insights,
  behaviorCounts,
  breakdown,
  deltaPercent,
  avgAdherence,
}: StatsInsightsSidebarProps) {
  const { build, reduce, avoid } = behaviorCounts;
  const typeTotal = build + reduce + avoid;
  const buildPct = typeTotal ? Math.round((build / typeTotal) * 100) : 0;
  const reducePct = typeTotal ? Math.round((reduce / typeTotal) * 100) : 0;

  const typeGradient = `conic-gradient(
    var(--chart-1) 0 ${buildPct}%,
    var(--chart-2) ${buildPct}% ${buildPct + reducePct}%,
    var(--chart-4) ${buildPct + reducePct}% 100%
  )`;

  const headline =
    deltaPercent !== null && deltaPercent > 0 && avgAdherence !== null
      ? `You're doing great! Your adherence is ${Math.abs(deltaPercent)}% higher than the previous period.`
      : avgAdherence !== null
        ? `Keep showing up — ${avgAdherence}% average adherence in this range.`
        : "Log habits to unlock personalized insights.";

  return (
    <aside className="stats-v2-side">
      <div className="glass-panel stats-insight-card">
        <div className="stats-insight-mascot">
          <StatsInsightPet />
        </div>
        <p className="stats-insight-title">You&apos;re doing great!</p>
        <p className="stats-insight-body">{headline}</p>
      </div>

      <div className="glass-panel stats-insights-list-panel">
        <div className="panel-head">
          <h2>Key insights</h2>
        </div>
        <ul className="stats-insights-list">
          {insights.length > 0 ? (
            insights.map((line) => (
              <li key={line}>
                <Sparkles className="size-3.5 shrink-0 text-[var(--chart-2)]" aria-hidden />
                <span>{line}</span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground text-sm">
              Insights appear as you log more habits.
            </li>
          )}
        </ul>
      </div>

      <div className="glass-panel stats-type-donut-panel">
        <div className="panel-head">
          <h2>Habit types</h2>
        </div>
        <div className="stats-type-donut-wrap">
          <div
            className="cal-side-donut stats-type-donut"
            style={{ background: typeGradient }}
          >
            <div className="cal-side-donut-inner">
              <strong>{typeTotal}</strong>
              <span>habits</span>
            </div>
          </div>
          <ul className="cal-side-breakdown">
            <li>
              <i className="dot completed" />
              Build {build}
            </li>
            <li>
              <i className="dot partial" />
              Reduce {reduce}
            </li>
            <li>
              <i className="dot missed" />
              Avoid {avoid}
            </li>
          </ul>
        </div>
        <p className="sr-only">
          Completion breakdown: {breakdown.completed} completed, {breakdown.partial}{" "}
          partial
        </p>
      </div>
    </aside>
  );
}
