"use client";

import { useMemo, useOptimistic, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { toggleHabitDay } from "@/app/actions/habits";
import { LOCALE, formatLongDate, toDateKey, todayKey } from "@/lib/dates";
import type { HabitBehaviorType, HabitLog } from "@/lib/types";

type HeatmapProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  color: string;
  startDate: string;
  logs: HabitLog[];
  year?: number;
};

type Cell = {
  key: string;
  inRange: boolean;
  future: boolean;
  beforeStart: boolean;
  active: boolean;
};

const WEEKDAY_LABELS = ["", "M", "", "W", "", "F", ""];

function buildYearCells(year: number, startDate: string, activeDates: Set<string>): Cell[] {
  const today = todayKey();
  const jan1 = new Date(year, 0, 1);
  const startPad = jan1.getDay(); // Sun=0
  const cells: Cell[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({
      key: `pad-${i}`,
      inRange: false,
      future: false,
      beforeStart: true,
      active: false,
    });
  }

  const cursor = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    cells.push({
      key,
      inRange: true,
      future: key > today,
      beforeStart: key < startDate,
      active: activeDates.has(key),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return cells;
}

function monthLabels(year: number, weeks: number) {
  const labels: { label: string; col: number }[] = [];
  let lastCol = -Infinity;

  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const dayOfYear =
      Math.floor(
        (first.getTime() - new Date(year, 0, 1).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    const col = Math.floor((first.getDay() + dayOfYear - 1) / 7);

    // Skip labels that would collide with the previous month
    if (col - lastCol < 2) continue;
    if (col >= weeks) continue;

    labels.push({
      label: first.toLocaleString(LOCALE, { month: "short" }),
      col,
    });
    lastCol = col;
  }

  return labels;
}

export function Heatmap({
  habitId,
  behavior,
  color,
  startDate,
  logs,
  year = new Date().getFullYear(),
}: HeatmapProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticLogs, setLogs] = useOptimistic(logs);

  const activeDates = useMemo(() => {
    const status = behavior === "build" ? "completed" : "maintained";
    return new Set(
      optimisticLogs
        .filter((l) => l.status === status)
        .map((l) => l.log_date),
    );
  }, [optimisticLogs, behavior]);

  const cells = useMemo(
    () => buildYearCells(year, startDate, activeDates),
    [year, startDate, activeDates],
  );

  function toggle(dateKey: string, currentlyActive: boolean) {
    startTransition(async () => {
      setLogs((current) => {
        if (currentlyActive) {
          return current.filter((l) => l.log_date !== dateKey);
        }
        return [
          ...current.filter((l) => l.log_date !== dateKey),
          {
            id: `optimistic-${dateKey}`,
            habit_id: habitId,
            log_date: dateKey,
            status: behavior === "build" ? "completed" : "lapse",
            note: null,
            numeric_value: null,
            completion_level: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      });

      const result = await toggleHabitDay(
        habitId,
        behavior,
        dateKey,
        currentlyActive,
      );
      if (result.ok) router.refresh();
    });
  }

  const weeks = Math.ceil(cells.length / 7);
  const months = useMemo(() => monthLabels(year, weeks), [year, weeks]);

  return (
    <div
      className="heatmap"
      style={
        {
          ["--habit" as string]: color,
          ["--hm-weeks" as string]: String(weeks),
        } as CSSProperties
      }
    >
      <div className="heatmap-scroll">
        <div className="heatmap-frame">
          <div className="heatmap-weekdays" aria-hidden="true">
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          <div className="heatmap-main">
            <div className="heatmap-months">
              {months.map((m) => (
                <span key={m.label + m.col} style={{ gridColumn: m.col + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>

            <div
              className="heatmap-grid"
              role="grid"
              aria-label={`${year} activity`}
            >
              {cells.map((cell) => {
                if (!cell.inRange) {
                  return <span key={cell.key} className="heat-cell empty" />;
                }

                const disabled = cell.future || cell.beforeStart;
                // Quit: colored = kept (no log), blush = slipped.
                // Build: colored = kept (done log), muted = missed.
                const stateClass =
                  behavior !== "build"
                    ? cell.active
                      ? "relapse"
                      : disabled
                        ? ""
                        : "done"
                    : cell.active
                      ? "done"
                      : "";
                const title = `${formatLongDate(cell.key)}${
                  behavior !== "build"
                    ? cell.active
                      ? " · Slipped"
                      : disabled
                        ? ""
                        : " · Kept"
                    : cell.active
                      ? " · Kept"
                      : ""
                }`;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    title={title}
                    disabled={disabled}
                    aria-label={title}
                    aria-pressed={cell.active}
                    className={[
                      "heat-cell",
                      stateClass,
                      cell.future ? "future" : "",
                      cell.beforeStart ? "before" : "",
                      disabled ? "disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => toggle(cell.key, cell.active)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        {behavior !== "build" ? (
          <>
            <span className="heat-cell legend-swatch done" />
            <span>Kept</span>
            <span className="heat-cell legend-swatch relapse" />
            <span>Slipped</span>
          </>
        ) : (
          <>
            <span className="heat-cell legend-swatch" />
            <span>Missed</span>
            <span className="heat-cell legend-swatch done" />
            <span>Kept</span>
          </>
        )}
        <span className="heat-cell legend-swatch future" />
        <span>Unavailable</span>
        <span className="legend-note">
          {behavior === "build"
            ? "Tap a day you kept it"
            : "Tap a day you slipped"}
        </span>
      </div>
    </div>
  );
}
