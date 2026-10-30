"use client";

import type { StatsLogBreakdown } from "@/app/actions/stats";

type StatsLogDonutProps = {
  breakdown: StatsLogBreakdown;
};

export function StatsLogDonut({ breakdown }: StatsLogDonutProps) {
  const {
    completedPct,
    partialPct,
    missedPct,
    notScheduledPct,
    totalLogs,
    completed,
    partial,
    missed,
    notScheduled,
  } = breakdown;

  const c1 = completedPct;
  const c2 = c1 + partialPct;
  const c3 = c2 + missedPct;

  const gradient = `conic-gradient(
    var(--chart-1) 0 ${c1}%,
    var(--chart-2) ${c1}% ${c2}%,
    var(--chart-3) ${c2}% ${c3}%,
    color-mix(in srgb, var(--foreground) 16%, transparent) ${c3}% 100%
  )`;

  return (
    <section className="glass-panel stats-donut-panel">
      <div className="panel-head">
        <h2>Habit completion</h2>
        <p className="panel-meta">Outcome breakdown</p>
      </div>
      <div className="stats-donut-wrap">
        <div className="cal-side-donut stats-log-donut" style={{ background: gradient }}>
          <div className="cal-side-donut-inner">
            <strong>{totalLogs}</strong>
            <span>logs</span>
          </div>
        </div>
        <ul className="cal-side-breakdown stats-donut-legend">
          <li>
            <i className="dot completed" />
            Completed {completed} ({completedPct}%)
          </li>
          <li>
            <i className="dot partial" />
            Partial {partial} ({partialPct}%)
          </li>
          <li>
            <i className="dot missed" />
            Missed {missed} ({missedPct}%)
          </li>
          <li>
            <i className="dot none" />
            Not scheduled {notScheduled} ({notScheduledPct}%)
          </li>
        </ul>
      </div>
    </section>
  );
}
