"use client";

import { useEffect, useMemo, useRef, useState, useOptimistic } from "react";
import { animateCalendarCells, pulseCalendarDay } from "@/animations/calendar-animations";
import { useToggleHabitDayMutation } from "@/hooks/api/use-mutations";
import {
  LOCALE,
  parseDateKey,
  toDateKey,
  todayKey,
} from "@/lib/dates";
import type { HabitBehaviorType, HabitLog } from "@/lib/types";

type MonthCalendarProps = {
  habitId: string;
  behavior: HabitBehaviorType;
  startDate: string;
  logs: HabitLog[];
};

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthCells(
  year: number,
  month: number,
  startDate: string,
  activeDates: Set<string>,
) {
  const today = todayKey();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = new Date(year, month, 1).getDay();
  const cells: {
    key: string | null;
    day: number | null;
    future: boolean;
    beforeStart: boolean;
    active: boolean;
  }[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({
      key: null,
      day: null,
      future: false,
      beforeStart: false,
      active: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = toDateKey(new Date(year, month, d));
    cells.push({
      key,
      day: d,
      future: key > today,
      beforeStart: key < startDate,
      active: activeDates.has(key),
    });
  }

  return cells;
}

export function MonthCalendar({
  habitId,
  behavior,
  startDate,
  logs,
}: MonthCalendarProps) {
  const toggleMutation = useToggleHabitDayMutation();
  const [optimisticLogs, setLogs] = useOptimistic(logs);

  const today = todayKey();
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)) - 1,
  }));

  const activeDates = useMemo(() => {
    const status = behavior === "build" ? "completed" : "lapse";
    return new Set(
      optimisticLogs
        .filter((l) => l.status === status)
        .map((l) => l.log_date),
    );
  }, [optimisticLogs, behavior]);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    return animateCalendarCells(
      gridRef.current,
      ".cal-day:not(.empty)",
    );
  }, [cursor.year, cursor.month]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month, startDate, activeDates),
    [cursor, startDate, activeDates],
  );

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    LOCALE,
    { month: "long", year: "numeric" },
  );

  function shift(delta: number) {
    setCursor((c) => {
      const date = new Date(c.year, c.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function toggle(dateKey: string, currentlyActive: boolean) {
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
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
    });

    toggleMutation.mutate({
      habitId,
      behavior,
      dateKey,
      wasActive: currentlyActive,
    });
  }

  return (
    <div>
      <div className="cal-nav">
        <button type="button" className="ghost-btn" onClick={() => shift(-1)}>
          ←
        </button>
        <strong>{label}</strong>
        <button type="button" className="ghost-btn" onClick={() => shift(1)}>
          →
        </button>
      </div>

      <div className="cal-weekdays" aria-hidden>
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div ref={gridRef} className="cal-grid" role="grid" aria-label={`${label} activity`}>
        {cells.map((cell, i) => {
          if (!cell.key) {
            return <span key={`pad-${i}`} className="cal-day empty" />;
          }
          const disabled = cell.future || cell.beforeStart;
          // Quit habits: unmarked in-range days read as "kept" (quiet green).
          const stateClass = disabled
            ? cell.future
              ? "future"
              : "before"
            : behavior !== "build"
              ? cell.active
                ? "relapse"
                : "kept-quiet"
              : cell.active
                ? "done"
                : "";
          const mark =
            behavior !== "build"
              ? cell.active
                ? "Slipped"
                : disabled
                  ? ""
                  : "Kept"
              : cell.active
                ? "Kept"
                : "";
          return (
            <button
              key={cell.key}
              type="button"
              disabled={disabled}
              className={[
                "cal-day",
                stateClass,
                cell.key === today ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={cell.active}
              aria-label={`${cell.key}${mark ? ` · ${mark}` : ""}`}
              title={`${parseDateKey(cell.key).toLocaleDateString(LOCALE, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}${mark ? ` · ${mark}` : ""}`}
              onClick={(e) => {
                if (e.currentTarget instanceof HTMLElement) {
                  pulseCalendarDay(e.currentTarget);
                }
                toggle(cell.key!, cell.active);
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="heatmap-legend">
        {behavior !== "build" ? (
          <>
            <span className="heat-cell legend-swatch relapse" />
            <span>Slipped</span>
            <span className="heat-cell legend-swatch" style={{ background: "color-mix(in srgb, var(--primary) 22%, var(--card))" }} />
            <span>Kept</span>
          </>
        ) : (
          <>
            <span className="heat-cell legend-swatch" />
            <span>Missed</span>
            <span className="heat-cell legend-swatch done" />
            <span>Kept</span>
          </>
        )}
        <span className="legend-note">Tap any day to toggle</span>
      </div>
    </div>
  );
}
