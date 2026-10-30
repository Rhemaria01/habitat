import { describe, expect, it } from "vitest";
import {
  adherenceToHeatmapTier,
  buildHabitSparkline,
  periodDeltaPercent,
  previousPeriodBounds,
  rangeBounds,
} from "@/lib/stats-aggregate";
import type { HabitWithLogs } from "@/lib/types";

describe("adherenceToHeatmapTier", () => {
  it("maps adherence bands", () => {
    expect(adherenceToHeatmapTier(85, 3, false)).toBe("high");
    expect(adherenceToHeatmapTier(60, 2, false)).toBe("medium");
    expect(adherenceToHeatmapTier(25, 2, false)).toBe("low");
    expect(adherenceToHeatmapTier(0, 2, false)).toBe("missed");
    expect(adherenceToHeatmapTier(null, 0, false)).toBe("none");
    expect(adherenceToHeatmapTier(null, 1, true)).toBe("future");
  });
});

describe("periodDeltaPercent", () => {
  it("computes percent change", () => {
    expect(periodDeltaPercent(65, 50)).toBe(30);
    expect(periodDeltaPercent(40, 50)).toBe(-20);
    expect(periodDeltaPercent(null, 50)).toBe(null);
    expect(periodDeltaPercent(10, 0)).toBe(100);
  });
});

describe("rangeBounds", () => {
  it("returns 7 day window", () => {
    const { start, end } = rangeBounds("7d", "2026-10-30", "2026-01-01");
    expect(end).toBe("2026-10-30");
    expect(start).toBe("2026-10-24");
  });

  it("uses earliest start for all time", () => {
    const { start } = rangeBounds("all", "2026-10-30", "2026-03-01");
    expect(start).toBe("2026-03-01");
  });
});

describe("previousPeriodBounds", () => {
  it("mirrors range length", () => {
    const bounds = previousPeriodBounds("2026-10-24", "2026-10-30");
    expect(bounds.end).toBe("2026-10-23");
    expect(bounds.start).toBe("2026-10-17");
  });
});

describe("buildHabitSparkline", () => {
  const habit = {
    id: "h1",
    behavior_type: "build",
    start_date: "2026-10-01",
  } as HabitWithLogs;

  it("collects scheduled day scores", () => {
    const spark = buildHabitSparkline(
      habit,
      [
        {
          id: "l1",
          habit_id: "h1",
          log_date: "2026-10-29",
          status: "completed",
          note: null,
          numeric_value: null,
          completion_level: null,
          created_at: "",
          updated_at: "",
        },
        {
          id: "l2",
          habit_id: "h1",
          log_date: "2026-10-28",
          status: "partial",
          note: null,
          numeric_value: null,
          completion_level: null,
          created_at: "",
          updated_at: "",
        },
      ],
      "2026-10-30",
      2,
    );
    expect(spark).toEqual([100, 0]);
  });
});
