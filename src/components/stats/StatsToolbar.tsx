"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { LOCALE } from "@/lib/dates";
import {
  STATS_RANGE_DAYS,
  type StatsRangeKey,
} from "@/lib/stats-aggregate";

type StatsToolbarProps = {
  year: number;
  month: number;
  range: StatsRangeKey;
  onMonthChange: (year: number, month: number) => void;
  onRangeChange: (range: StatsRangeKey) => void;
};

function monthInputValue(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function StatsToolbar({
  year,
  month,
  range,
  onMonthChange,
  onRangeChange,
}: StatsToolbarProps) {
  function shift(delta: number) {
    const date = new Date(year, month + delta, 1);
    onMonthChange(date.getFullYear(), date.getMonth());
  }

  return (
    <div className="stats-v2-toolbar glass-panel stats-v2-toolbar-panel animate-fade-up">
      <div className="stats-range" role="group" aria-label="Time range">
        {(Object.keys(STATS_RANGE_DAYS) as StatsRangeKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={range === key ? "on" : ""}
            onClick={() => onRangeChange(key)}
          >
            {key === "3m"
              ? "3M"
              : key === "1y"
                ? "1Y"
                : key === "all"
                  ? "All time"
                  : key.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="stats-v2-month-nav">
        <button
          type="button"
          className="stats-v2-month-btn"
          onClick={() => shift(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <label className="stats-v2-month-pill">
          <span className="sr-only">Month</span>
          <input
            type="month"
            value={monthInputValue(year, month)}
            onChange={(e) => {
              const [y, m] = e.target.value.split("-").map(Number);
              if (y && m) onMonthChange(y, m - 1);
            }}
          />
          <span aria-hidden>
            {new Date(year, month, 1).toLocaleDateString(LOCALE, {
              month: "long",
              year: "numeric",
            })}
          </span>
        </label>
        <button
          type="button"
          className="stats-v2-month-btn"
          onClick={() => shift(1)}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
