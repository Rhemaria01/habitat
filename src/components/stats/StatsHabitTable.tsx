"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { StatsHabitRow } from "@/app/actions/stats";
import { HabitIcon } from "@/components/HabitIcon";
import { cn } from "@/lib/utils";

type SortKey = "adherence" | "name" | "currentStreak" | "bestStreak";

type StatsHabitTableProps = {
  rows: StatsHabitRow[];
};

function behaviorLabel(type: StatsHabitRow["behavior_type"]) {
  if (type === "build") return "Build";
  if (type === "reduce") return "Reduce";
  return "Avoid";
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="stats-sparkline-empty">—</span>;
  }
  const w = 64;
  const h = 20;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / 100) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="stats-sparkline"
      aria-hidden
    >
      <polyline points={points} fill="none" />
    </svg>
  );
}

export function StatsHabitTable({ rows }: StatsHabitTableProps) {
  const [sort, setSort] = useState<SortKey>("adherence");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "currentStreak") return b.currentStreak - a.currentStreak;
      if (sort === "bestStreak") return b.bestStreak - a.bestStreak;
      return (b.adherence ?? -1) - (a.adherence ?? -1);
    });
    return copy;
  }, [rows, sort]);

  return (
    <section className="glass-panel stats-habit-table-panel">
      <div className="panel-head stats-table-head">
        <h2>Habit performance</h2>
        <label className="stats-table-sort">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="adherence">Adherence</option>
            <option value="name">Name</option>
            <option value="currentStreak">Current streak</option>
            <option value="bestStreak">Best streak</option>
          </select>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </label>
      </div>
      <div className="stats-table-scroll">
        <table className="stats-habit-table">
          <thead>
            <tr>
              <th scope="col">Habit</th>
              <th scope="col">Type</th>
              <th scope="col">Adherence</th>
              <th scope="col">Current</th>
              <th scope="col">Best</th>
              <th scope="col">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/habits/${row.id}`} className="stats-table-habit-link">
                    <HabitIcon icon={row.icon} size="sm" />
                    <span>{row.name}</span>
                  </Link>
                </td>
                <td>
                  <span
                    className={cn(
                      "stats-behavior-tag",
                      `behavior-${row.behavior_type}`,
                    )}
                  >
                    {behaviorLabel(row.behavior_type)}
                  </span>
                </td>
                <td>
                  <div className="stats-table-adherence">
                    <span>{row.adherence !== null ? `${row.adherence}%` : "—"}</span>
                    <div className="stats-table-bar">
                      <span
                        style={{
                          width: `${row.adherence ?? 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td>{row.currentStreak}d</td>
                <td>{row.bestStreak}d</td>
                <td>
                  <Sparkline values={row.sparkline} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 ? (
          <p className="stats-table-empty text-sm text-muted-foreground">
            Add habits to see performance here.
          </p>
        ) : null}
      </div>
    </section>
  );
}
