"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronRight as ChevronRightSmall,
  Plus,
  X,
} from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  type CalendarDayDetail,
  type CalendarMonth,
} from "@/app/actions/calendar";
import {
  animateCalendarCells,
  pulseCalendarDay,
} from "@/animations/calendar-animations";
import {
  CalendarGridSkeleton,
  CalendarSideSkeleton,
  QueryErrorBanner,
  QueryLoadingOverlay,
} from "@/components/api/QueryLoading";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { CalendarDayBackfill } from "@/components/CalendarDayBackfill";
import { CalendarScenicBackdrop } from "@/components/CalendarScenicBackdrop";
import { CalendarDayDots, CalendarDayRing } from "@/components/CalendarDayRing";
import { HabitIcon } from "@/components/HabitIcon";
import {
  useCalendarDayQuery,
  useCalendarMonthQuery,
} from "@/hooks/api/use-calendar";
import {
  CalendarFlyProvider,
  useCalendarCellRef,
} from "@/components/calendar/CalendarFlyProvider";
import type { CalendarHabitOutcome } from "@/lib/calendar-day";
import { LOCALE, parseDateKey, todayKey, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

type CalendarClientProps = {
  initial: CalendarMonth;
  initialDay: CalendarDayDetail;
};

type ViewMode = "month" | "week" | "list";

function monthInputValue(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

const calSideLayoutTransition = {
  layout: { type: "spring" as const, stiffness: 420, damping: 34 },
};

function OutcomeBadge({ outcome }: { outcome: CalendarHabitOutcome }) {
  const reduceMotion = useReducedMotion();

  let badgeClass = "cal-outcome-badge none";
  let content: ReactNode = null;

  if (outcome === "before_start") {
    badgeClass = "cal-outcome-badge none dash";
    content = "—";
  } else if (outcome === "not_scheduled" || outcome === "future") {
    content = null;
  } else if (outcome === "completed") {
    badgeClass = "cal-outcome-badge completed";
    content = <Check className="size-3.5" strokeWidth={3} />;
  } else if (outcome === "missed") {
    badgeClass = "cal-outcome-badge missed";
    content = <X className="size-3.5" strokeWidth={3} />;
  } else {
    badgeClass = "cal-outcome-badge partial";
  }

  return (
    <span className="cal-outcome-badge-slot">
      <motion.span
        key={outcome}
        className={badgeClass}
        aria-hidden
        initial={reduceMotion ? false : { scale: 0.86, opacity: 0.45 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 32 }}
      >
        {content}
      </motion.span>
    </span>
  );
}

function CalMonthDayButton({
  cell,
  selected,
  dimmed,
  onSelect,
}: {
  cell: CalendarMonth["days"][number];
  selected: boolean;
  dimmed: boolean;
  onSelect: (dateKey: string, el: HTMLElement) => void;
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
      onClick={(e) => onSelect(cell.dateKey!, e.currentTarget)}
      aria-pressed={selected}
      aria-label={cell.dateKey}
      data-calendar-date={cell.dateKey}
    >
      <span className="cal-v2-day-num">{cell.day}</span>
      <div className="cal-v2-day-rings">
        <CalendarDayRing segments={cell.segments} dimmed={dimmed} />
      </div>
      <CalendarDayDots segments={cell.segments} />
    </button>
  );
}

export function CalendarClient({ initial, initialDay }: CalendarClientProps) {
  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.month);
  const [selectedKey, setSelectedKey] = useState(initialDay.dateKey);
  const [view, setView] = useState<ViewMode>("month");
  const [addOpen, setAddOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    data: month = initial,
    isLoading: monthLoading,
    isFetching: monthFetching,
    isError: monthError,
    error: monthErr,
  } = useCalendarMonthQuery(year, monthIndex, { initialData: initial });

  const {
    data: dayDetail,
    isLoading: dayLoading,
    isFetching: dayFetching,
    isError: dayError,
    error: dayErr,
  } = useCalendarDayQuery(selectedKey, { initialData: initialDay });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  const cells = useMemo(() => month.days, [month.days]);

  useEffect(() => {
    if (!gridRef.current || view !== "month") return;
    return animateCalendarCells(
      gridRef.current,
      ".cal-v2-day:not(.empty):not(.pad)",
    );
  }, [month.year, month.month, view]);

  const summary = dayDetail?.summary;
  const scheduled = summary?.scheduled ?? 0;
  const doneCount = summary ? summary.completed + summary.partial : 0;
  const ringPct =
    scheduled === 0 ? 0 : Math.round((doneCount / scheduled) * 100);

  function selectDay(dateKey: string, cellEl?: HTMLElement | null) {
    setSelectedKey(dateKey);
    if (cellEl) pulseCalendarDay(cellEl);
  }

  const listDays = cells.filter((c) => c.dateKey);
  const showMonthSkeleton = monthLoading && !month.days.length;
  const showMonthOverlay = monthFetching && !monthLoading;
  const showDaySkeleton = dayLoading && !dayDetail;
  const showDayOverlay = dayFetching && !dayLoading && Boolean(dayDetail);

  return (
    <CalendarFlyProvider>
    <div className="calendar-v2">
      <header className="calendar-v2-head">
        <div className="calendar-v2-head-copy">
          <h1>Calendar</h1>
          <p className="calendar-v2-sub">
            View and manage your habit progress across days.
          </p>
        </div>
        <div className="calendar-v2-toolbar">
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
      </header>

      <div className="calendar-v2-body">
        <section
          className={cn(
            "calendar-v2-main glass-panel calendar-scenic-panel relative",
            view !== "month" && "calendar-v2-main-padded",
          )}
        >
          {view === "month" ? <CalendarScenicBackdrop variant="fill" /> : null}
          <QueryLoadingOverlay show={showMonthOverlay} label="Updating month…" />
          {monthError ? (
            <QueryErrorBanner error={monthErr} className="p-4" />
          ) : null}
          {view === "month" ? (
            <div className="cal-v2-month-scene">
              <div className="cal-v2-weekdays" aria-hidden>
                {weekdays.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              {showMonthSkeleton ? (
                <CalendarGridSkeleton />
              ) : (
                <div className="cal-v2-grid-wrap">
                  <div
                    ref={gridRef}
                    className="cal-v2-grid cal-v2-grid-fill"
                    role="grid"
                    aria-label={`${month.label} calendar`}
                  >
                    {cells.map((cell, i) => {
                      if (!cell.dateKey) {
                        return <span key={`pad-${i}`} className="cal-v2-day pad empty" />;
                      }
                      const selected = cell.dateKey === selectedKey;
                      const dimmed = cell.state === "future";
                      return (
                        <CalMonthDayButton
                          key={cell.dateKey}
                          cell={cell}
                          selected={selected}
                          dimmed={dimmed}
                          onSelect={selectDay}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
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
          ) : null}

          {view === "week" ? (
            <WeekStrip
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
              year={month.year}
              month={month.month}
              cells={cells}
            />
          ) : null}

          {view === "list" ? (
            <ul className="cal-v2-list">
              {listDays.map((cell) => (
                <li key={cell.dateKey}>
                  <button
                    type="button"
                    className={`cal-v2-list-row ${cell.dateKey === selectedKey ? "selected" : ""}`}
                    onClick={() => cell.dateKey && selectDay(cell.dateKey)}
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

          {view !== "month" ? (
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
          ) : null}

        </section>

        <aside className="calendar-v2-side glass-panel calendar-scenic-panel relative">
          <CalendarScenicBackdrop />
          <QueryLoadingOverlay show={showDayOverlay} label="Updating day…" />
          {dayError ? (
            <QueryErrorBanner error={dayErr} className="p-4" />
          ) : null}
          {showDaySkeleton ? (
            <CalendarSideSkeleton />
          ) : dayDetail ? (
            <>
              <div className="cal-side-head">
                <p className="cal-side-date">{dayDetail.label}</p>
                {dayDetail.isToday ? (
                  <span className="cal-side-today-pill">Today</span>
                ) : null}
              </div>

              <motion.div className="cal-side-summary" layout transition={calSideLayoutTransition}>
                <div
                  className="cal-side-donut"
                  style={{
                    background: `conic-gradient(var(--chart-1) 0 ${ringPct}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${ringPct}% 100%)`,
                  }}
                >
                  <div className="cal-side-donut-inner">
                    <motion.strong layout transition={calSideLayoutTransition}>
                      {summary?.completed ?? 0}/{scheduled || 0}
                    </motion.strong>
                    <span>habits</span>
                  </div>
                </div>
                <ul className="cal-side-breakdown">
                  <motion.li layout transition={calSideLayoutTransition}>
                    <i className="dot completed" />
                    {summary?.completed ?? 0} Completed
                  </motion.li>
                  <motion.li layout transition={calSideLayoutTransition}>
                    <i className="dot partial" />
                    {summary?.partial ?? 0} Partial
                  </motion.li>
                  <motion.li layout transition={calSideLayoutTransition}>
                    <i className="dot missed" />
                    {summary?.missed ?? 0} Missed
                  </motion.li>
                  <motion.li layout transition={calSideLayoutTransition}>
                    <i className="dot none" />
                    {summary?.notScheduled ?? 0} Not scheduled
                  </motion.li>
                </ul>
              </motion.div>

              <div className="cal-side-habits-head">
                <h2>Habits for this day</h2>
                <button
                  type="button"
                  className="cal-v2-icon-btn"
                  aria-label="Add habit"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <LayoutGroup id="cal-side-habits">
                <ul className="cal-side-habit-list">
                  {dayDetail.habits.length === 0 ? (
                    <li className="cal-side-empty">Nothing scheduled this day.</li>
                  ) : (
                    dayDetail.habits.map((h) => (
                      <motion.li
                        key={h.id}
                        layout
                        transition={calSideLayoutTransition}
                        className="cal-side-habit-item"
                      >
                        <Link href={`/habits/${h.id}`} className="cal-side-habit-row">
                          <HabitIcon icon={h.icon} color={h.color} size="sm" />
                          <div className="cal-side-habit-copy">
                            <span className="cal-side-habit-name">{h.name}</span>
                            <span className="cal-side-habit-time">{h.timeLabel}</span>
                          </div>
                          <OutcomeBadge outcome={h.outcome} />
                          <ChevronRightSmall
                            className="size-4 text-muted-foreground"
                            aria-hidden
                          />
                        </Link>
                        <CalendarDayBackfill
                          habitId={h.id}
                          behavior={h.behavior_type}
                          startDate={h.start_date}
                          dateKey={selectedKey}
                          habitColor={h.color}
                          log={h.log}
                          scheduled={h.scheduled}
                        />
                      </motion.li>
                    ))
                  )}
                </ul>
              </LayoutGroup>
            </>
          ) : (
            <p className="cal-side-loading text-sm text-muted-foreground">Select a day</p>
          )}
        </aside>
      </div>

      <AddHabitDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
    </CalendarFlyProvider>
  );
}

function WeekDayButton({
  dateKey,
  selected,
  inMonth,
  cell,
  onSelect,
}: {
  dateKey: string;
  selected: boolean;
  inMonth: boolean;
  cell: CalendarMonth["days"][number] | undefined;
  onSelect: (key: string) => void;
}) {
  const cellRef = useCalendarCellRef(dateKey);
  return (
    <button
      ref={cellRef as React.Ref<HTMLButtonElement>}
      key={dateKey}
      type="button"
      className={`cal-v2-day week ${selected ? "selected" : ""} ${!inMonth ? "outside" : ""}`}
      onClick={() => onSelect(dateKey)}
      data-calendar-date={dateKey}
    >
      <span className="cal-v2-day-num">
        {parseDateKey(dateKey).toLocaleDateString(LOCALE, { weekday: "short" })}
      </span>
      <span className="cal-v2-week-date">{parseDateKey(dateKey).getDate()}</span>
      <CalendarDayRing segments={cell?.segments ?? []} dimmed={dateKey > todayKey()} />
    </button>
  );
}

function WeekStrip({
  selectedKey,
  onSelect,
  year,
  month,
  cells,
}: {
  selectedKey: string;
  onSelect: (key: string) => void;
  year: number;
  month: number;
  cells: CalendarMonth["days"];
}) {
  const anchor = parseDateKey(selectedKey);
  const start = new Date(anchor);
  start.setDate(start.getDate() - start.getDay());
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(toDateKey(d));
  }

  const byKey = new Map(cells.filter((c) => c.dateKey).map((c) => [c.dateKey!, c]));

  return (
    <div className="cal-v2-week">
      {days.map((key) => {
        const cell = byKey.get(key);
        const inMonth = Number(key.slice(5, 7)) - 1 === month && Number(key.slice(0, 4)) === year;
        return (
          <WeekDayButton
            key={key}
            dateKey={key}
            selected={key === selectedKey}
            inMonth={inMonth}
            cell={cell}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
