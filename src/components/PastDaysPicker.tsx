"use client";

import { useMemo } from "react";
import {
  LOCALE,
  daysBetween,
  formatLongDate,
  parseDateKey,
  toDateKey,
  todayKey,
} from "@/lib/dates";

export type PastDaysMode = "slip" | "miss";

type PastDaysPickerProps = {
  startDate: string;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  mode: PastDaysMode;
};

type MonthBlock = {
  key: string;
  label: string;
  startPad: number;
  days: string[];
};

function buildMonths(startDate: string, endDate: string): MonthBlock[] {
  const months: MonthBlock[] = [];
  const cursor = parseDateKey(startDate);
  cursor.setDate(1);

  const end = parseDateKey(endDate);

  while (
    cursor.getFullYear() < end.getFullYear() ||
    (cursor.getFullYear() === end.getFullYear() &&
      cursor.getMonth() <= end.getMonth())
  ) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: string[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(new Date(year, month, d));
      if (key >= startDate && key <= endDate) days.push(key);
    }

    if (days.length > 0) {
      const firstSelectable = parseDateKey(days[0]);
      months.push({
        key: `${year}-${month}`,
        label: firstOfMonth.toLocaleString(LOCALE, {
          month: "long",
          year: "numeric",
        }),
        startPad: firstSelectable.getDay(),
        days,
      });
    }

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

const COPY: Record<
  PastDaysMode,
  {
    hint: (start: string) => string;
    marked: string;
    markedPlural: string;
    keptLabel: string;
    activeClass: string;
  }
> = {
  slip: {
    hint: (start) =>
      `Tap the days you slipped. Everything else from ${formatLongDate(start)} stays clean.`,
    marked: "slip",
    markedPlural: "slips",
    keptLabel: "kept",
    activeClass: "marked",
  },
  miss: {
    hint: (start) =>
      `Tap the days you missed. Everything else from ${formatLongDate(start)} counts as kept.`,
    marked: "miss",
    markedPlural: "misses",
    keptLabel: "kept",
    activeClass: "marked",
  },
};

export function PastDaysPicker({
  startDate,
  selected,
  onChange,
  mode,
}: PastDaysPickerProps) {
  const endDate = todayKey();
  const months = useMemo(
    () => buildMonths(startDate, endDate),
    [startDate, endDate],
  );
  const copy = COPY[mode];
  const dayCount = daysBetween(startDate, endDate) + 1;

  function toggle(dateKey: string) {
    const next = new Set(selected);
    if (next.has(dateKey)) next.delete(dateKey);
    else next.add(dateKey);
    onChange(next);
  }

  return (
    <div className={`history-picker mode-${mode}`}>
      <p className="history-picker-hint">{copy.hint(startDate)}</p>

      <div className="history-picker-meta">
        <span>
          {selected.size === 0
            ? `${dayCount} day${dayCount === 1 ? "" : "s"} ${copy.keptLabel}`
            : `${selected.size} ${selected.size === 1 ? copy.marked : copy.markedPlural} · ${Math.max(0, dayCount - selected.size)} ${copy.keptLabel}`}
        </span>
        {selected.size > 0 ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => onChange(new Set())}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="history-months">
        {months.map((month) => (
          <div key={month.key} className="history-month">
            <h3>{month.label}</h3>
            <div className="history-weekdays" aria-hidden="true">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={`${month.key}-wd-${i}`}>{d}</span>
              ))}
            </div>
            <div className="history-grid">
              {Array.from({ length: month.startPad }, (_, i) => (
                <span key={`${month.key}-pad-${i}`} className="history-day empty" />
              ))}
              {month.days.map((key) => {
                const active = selected.has(key);
                const isToday = key === endDate;
                const mark = active
                  ? mode === "slip"
                    ? "Slipped"
                    : "Missed"
                  : "Kept";
                return (
                  <button
                    key={key}
                    type="button"
                    className={[
                      "history-day",
                      active ? copy.activeClass : "kept",
                      isToday ? "today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={active}
                    aria-label={`${formatLongDate(key)} · ${mark}`}
                    title={`${formatLongDate(key)} · ${mark}`}
                    onClick={() => toggle(key)}
                  >
                    {parseDateKey(key).getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected.size > 0 ? (
        <ul className="history-chips">
          {[...selected]
            .sort()
            .map((key) => (
              <li key={key}>
                <button type="button" onClick={() => toggle(key)}>
                  {formatLongDate(key)}
                  <span aria-hidden="true">×</span>
                </button>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
