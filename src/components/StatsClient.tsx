"use client";

import StatsCounter from "@/components/ui/stats-counter";
import type { StatsDashboard } from "@/app/actions/stats";

type StatsClientProps = {
  data: StatsDashboard;
};

function AdherenceChart({ points }: { points: StatsDashboard["last30Days"] }) {
  const withData = points.filter((p) => p.adherence !== null);
  const max = 100;

  return (
    <div className="stats-chart" role="img" aria-label="30-day adherence chart">
      <div className="stats-chart-bars">
        {points.map((p) => {
          const h =
            p.adherence === null ? 4 : Math.max(6, (p.adherence / max) * 100);
          return (
            <div key={p.dateKey} className="stats-chart-col">
              <div
                className="stats-chart-bar"
                style={{ height: `${h}%` }}
                title={
                  p.adherence === null
                    ? `${p.label}: no scheduled habits`
                    : `${p.label}: ${p.adherence}% (${p.completed}/${p.scheduled})`
                }
              />
            </div>
          );
        })}
      </div>
      <div className="stats-chart-labels">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
      {withData.length === 0 ? (
        <p className="stats-chart-empty text-sm text-muted-foreground">
          Log habits to see trends here.
        </p>
      ) : null}
    </div>
  );
}

export function StatsClient({ data }: StatsClientProps) {
  const counters = [
    {
      label: "Active habits",
      value: data.activeHabits,
      suffix: "",
    },
    {
      label: "Logs this month",
      value: data.monthLogCount,
      suffix: "",
    },
    {
      label: "Best 30-day streak",
      value: data.currentStreakBest,
      suffix: data.currentStreakBest === 1 ? " day" : " days",
    },
  ];

  return (
    <div className="stats-page space-y-6">
      <section className="panel">
        <div className="panel-head">
          <h2>Overview</h2>
          {data.weekAdherence !== null ? (
            <p className="panel-meta">
              This week:{" "}
              <StatsCounter
                value={data.weekAdherence}
                suffix="%"
                decimals={1}
                className="font-semibold text-foreground"
              />{" "}
              avg adherence
            </p>
          ) : (
            <p className="panel-meta">No adherence data yet this week</p>
          )}
        </div>
        <ul className="stats-counter-grid">
          {counters.map((c) => (
            <li key={c.label} className="stats-counter-card">
              <p className="stats-counter-value">
                <StatsCounter
                  value={c.value}
                  suffix={c.suffix}
                  duration={1.8}
                  className="text-2xl font-bold tracking-tight text-foreground"
                />
              </p>
              <p className="stats-counter-label">{c.label}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>30-day adherence</h2>
          <p className="panel-meta">Daily completion across scheduled habits</p>
        </div>
        <AdherenceChart points={data.last30Days} />
      </section>
    </div>
  );
}
