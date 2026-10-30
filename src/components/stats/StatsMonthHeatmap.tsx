"use client";

import type { StatsHeatmapCell } from "@/app/actions/stats";
import type { HeatmapTier } from "@/lib/stats-aggregate";

const ROW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function rowIndexFromWeekday(weekday: number) {
  return (weekday + 6) % 7;
}

type StatsMonthHeatmapProps = {
  days: StatsHeatmapCell[];
  daysInMonth: number;
  monthLabel: string;
};

export function StatsMonthHeatmap({
  days,
  daysInMonth,
  monthLabel,
}: StatsMonthHeatmapProps) {
  const byDay = new Map(days.map((d) => [d.day, d]));

  return (
    <section className="glass-panel stats-heatmap-panel">
      <div className="panel-head">
        <h2>Activity heatmap</h2>
        <p className="panel-meta">{monthLabel}</p>
      </div>
      <div
        className="stats-heatmap-month"
        role="img"
        aria-label="Monthly activity heatmap"
        style={{ ["--stats-days" as string]: daysInMonth }}
      >
        <div className="stats-heatmap-month-cols" aria-hidden>
          {Array.from({ length: daysInMonth }, (_, i) => (
            <span key={i + 1} className="stats-heatmap-col-label">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="stats-heatmap-month-grid">
          {ROW_LABELS.map((label, row) => (
            <div key={label} className="stats-heatmap-month-row">
              <span className="stats-heatmap-row-label">{label}</span>
              <div className="stats-heatmap-month-cells">
                {Array.from({ length: daysInMonth }, (_, col) => {
                  const dayNum = col + 1;
                  const cell = byDay.get(dayNum);
                  const tier: HeatmapTier =
                    cell && rowIndexFromWeekday(cell.weekday) === row
                      ? cell.tier
                      : "none";
                  const show = cell && rowIndexFromWeekday(cell.weekday) === row;
                  return (
                    <span
                      key={dayNum}
                      className={`stats-heatmap-cell tier-${tier}${show ? "" : " empty"}`}
                      title={
                        show && cell?.adherence !== null
                          ? `${cell.dateKey}: ${cell.adherence}%`
                          : show
                            ? cell?.dateKey
                            : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="stats-heatmap-legend">
        <span>
          <i className="tier-high" /> High
        </span>
        <span>
          <i className="tier-medium" /> Medium
        </span>
        <span>
          <i className="tier-low" /> Low
        </span>
        <span>
          <i className="tier-missed" /> Missed
        </span>
        <span>
          <i className="tier-none" /> Not scheduled
        </span>
      </div>
    </section>
  );
}
