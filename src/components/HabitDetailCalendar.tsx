"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { type CalendarMonth } from "@/app/actions/calendar";
import { animateCalendarCells } from "@/animations/calendar-animations";
import {
  CalendarGridSkeleton,
  QueryErrorBanner,
  calendarMonthViewPending,
} from "@/components/api/QueryLoading";
import { CalendarDayBackfill } from "@/components/CalendarDayBackfill";
import { CalendarScenicBackdrop } from "@/components/CalendarScenicBackdrop";
import { CalendarDayRing } from "@/components/CalendarDayRing";
import { useHabitCalendarMonthQuery } from "@/hooks/api/use-calendar";
import { useCalendarCellRef } from "@/components/calendar/CalendarFlyProvider";
import { LOCALE, parseDateKey, todayKey } from "@/lib/dates";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import type { HabitWithLogs } from "@/lib/types";
import { cn } from "@/lib/utils";

type HabitDetailCalendarProps = {
  habitId: string;
  habit: HabitWithLogs;
  initial: CalendarMonth;
};

type ViewMode = "month" | "week" | "list";

function monthInputValue(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function HabitCalDayButton({
  cell,
  selected,
  dimmed,
  onSelect,
}: {
  cell: CalendarMonth["days"][number];
  selected: boolean;
  dimmed: boolean;
  onSelect: (dateKey: string) => void;
}) {
  const cellRef = useCalendarCellRef(cell.dateKey);
  if (!cell.dateKey) return null;

  return (
    <button
      ref={cellRef as React.Ref<HTMLButtonElement>}
      type="button"
      role="gridcell"
      className={[
        "cal-v2-day",
        selected ? "selected" : "",
        cell.isToday ? "is-today" : "",
        dimmed ? "future" : "",
        cell.state,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => cell.dateKey && onSelect(cell.dateKey)}
      aria-pressed={selected}
      aria-label={cell.dateKey}
      data-calendar-date={cell.dateKey}
    >
      <span className="cal-v2-day-num">{cell.day}</span>
      <div className="cal-v2-day-rings">
        <CalendarDayRing segments={cell.segments} dimmed={dimmed} />
      </div>
    </button>
  );
}

export function HabitDetailCalendar({ habitId, habit, initial }: HabitDetailCalendarProps) {
  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.month);
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [view, setView] = useState<ViewMode>("month");
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    data: month = initial,
    isLoading,
    isFetching,
    isError,
    error,
  } = useHabitCalendarMonthQuery(habitId, year, monthIndex, {
    initialData: initial,
  });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = useMemo(() => month.days, [month.days]);
  const selectedCell = cells.find((c) => c.dateKey === selectedKey);

  useEffect(() => {
    if (!gridRef.current || view !== "month") return;
    return animateCalendarCells(
      gridRef.current,
      ".cal-v2-day:not(.empty):not(.pad)",
    );
  }, [month.year, month.month, view]);

  function shift(delta: number) {
    const date = new Date(year, monthIndex + delta, 1);
    setYear(date.getFullYear());
    setMonthIndex(date.getMonth());
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonthIndex(now.getMonth());
    setSelectedKey(todayKey());
  }

  function onMonthPick(value: string) {
    const [y, mo] = value.split("-").map(Number);
    if (!y || !mo) return;
    setYear(y);
    setMonthIndex(mo - 1);
  }

  const listDays = cells.filter((c) => c.dateKey);
  const showSkeleton =
    (isLoading && !cells.length) ||
    calendarMonthViewPending(month, year, monthIndex, isFetching);

  return (
    <section className="habit-detail-calendar glass-panel calendar-scenic-panel relative">
      {view === "month" ? <CalendarScenicBackdrop variant="fill" /> : null}
      {isError ? <QueryErrorBanner error={error} className="px-4 pt-4" /> : null}

      <div className="habit-detail-cal-toolbar">
        <button type="button" className="cal-v2-today-btn" onClick={goToday}>
          Today
        </button>
        <div className="calendar-v2-nav">
          <button
            type="button"
            className="cal-v2-icon-btn"
            onClick={() => shift(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="cal-v2-icon-btn"
            onClick={() => shift(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <label className="calendar-v2-month-pill">
          <span className="sr-only">Month</span>
          <input
            type="month"
            value={monthInputValue(month.year, month.month)}
            onChange={(e) => onMonthPick(e.target.value)}
          />
          <span>{month.label}</span>
          <ChevronDown className="size-4 opacity-60" aria-hidden />
        </label>
        <div className="calendar-v2-segments" role="tablist" aria-label="Calendar view">
          {(
            [
              ["month", "Month"],
              ["week", "Week"],
              ["list", "List"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={cn(view === id && "on")}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "month" ? (
        <div className="cal-v2-month-scene cal-v2-month-scene--habit">
          <div className="cal-v2-weekdays" aria-hidden>
            {weekdays.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          {showSkeleton ? (
            <CalendarGridSkeleton />
          ) : (
            <div className="cal-v2-grid-wrap">
              <div
                ref={gridRef}
                className="cal-v2-grid cal-v2-grid-fill habit-detail-cal-grid"
                role="grid"
                aria-label={`${month.label} habit calendar`}
              >
                {cells.map((cell, i) => {
                  if (!cell.dateKey) {
                    return <span key={`pad-${i}`} className="cal-v2-day pad empty" />;
                  }
                  const selected = cell.dateKey === selectedKey;
                  const dimmed = cell.state === "future";
                  return (
                    <HabitCalDayButton
                      key={cell.dateKey}
                      cell={cell}
                      selected={selected}
                      dimmed={dimmed}
                      onSelect={setSelectedKey}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {view === "list" ? (
        <ul className="cal-v2-list cal-v2-list-inset">
          {listDays.map((cell) => (
            <li key={cell.dateKey}>
              <button
                type="button"
                className={`cal-v2-list-row ${cell.dateKey === selectedKey ? "selected" : ""}`}
                onClick={() => cell.dateKey && setSelectedKey(cell.dateKey)}
              >
                <span className="cal-v2-list-date">
                  {cell.dateKey &&
                    parseDateKey(cell.dateKey).toLocaleDateString(LOCALE, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                </span>
                <CalendarDayRing segments={cell.segments} />
                <span className="cal-v2-list-meta">
                  {cell.adherence !== null ? `${cell.adherence}%` : "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {view === "week" ? (
        <p className="habit-detail-cal-week-hint text-sm text-muted-foreground">
          Week view uses the month data — switch to Month for the full grid.
        </p>
      ) : null}

      <div className="cal-v2-detail-foot">
        {selectedKey ? (
          <CalendarDayBackfill
            habitId={habitId}
            behavior={habit.behavior_type}
            startDate={habit.start_date}
            dateKey={selectedKey}
            habitColor={habit.color}
            log={
              selectedCell?.log ??
              habit.logs.find((l) => l.log_date === selectedKey) ??
              null
            }
            scheduled={isHabitScheduledOn(habit, selectedKey)}
          />
        ) : null}

        <footer className="cal-v2-footer">
          <div className="cal-v2-legend">
            <span className="cal-v2-legend-item">
              <i className="dot completed" /> Completed
            </span>
            <span className="cal-v2-legend-item">
              <i className="dot partial" /> Partial
            </span>
            <span className="cal-v2-legend-item">
              <i className="dot missed" /> Missed
            </span>
            <span className="cal-v2-legend-item">
              <i className="dot none" /> Not scheduled
            </span>
          </div>
          <div className="cal-v2-rate">
            <span>Completion rate</span>
            <strong>{month.completionRate ?? 0}%</strong>
            <div className="cal-v2-rate-bar">
              <span style={{ width: `${month.completionRate ?? 0}%` }} />
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}
