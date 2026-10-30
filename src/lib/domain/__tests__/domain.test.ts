import { describe, expect, it } from "vitest";
import { adherenceForRange } from "@/lib/domain/adherence";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import type { Habit, HabitLog } from "@/lib/types";

const baseHabit = (over: Partial<Habit> = {}): Habit => ({
  id: "1",
  name: "Test",
  kind: "build",
  behavior_type: "build",
  description: null,
  category: null,
  personal_reason: null,
  start_date: "2026-01-01",
  color: "#000",
  icon: null,
  sort_order: 0,
  archived_at: null,
  status: "active",
  created_at: "",
  updated_at: "",
  frequency: "daily",
  stack_after: null,
  two_minute_version: null,
  minimum_version: null,
  standard_version: null,
  stretch_version: null,
  estimated_duration_minutes: null,
  identity_proof: null,
  source_key: null,
  card_art_key: null,
  card_cover_style: null,
  cue_type: null,
  cue_time: null,
  cue_place: null,
  cue_event: null,
  anchor_habit_id: null,
  cue_notes: null,
  motivation_meaning: null,
  motivation_appeal: null,
  motivation_pairing: null,
  motivation_social: null,
  friction_obstacle: null,
  friction_environment: null,
  friction_increase: null,
  commitment_mechanism: null,
  reward_feedback: null,
  reward_personal: null,
  recovery_plan: null,
  recovery_reminder: true,
  schedule_kind: "daily",
  schedule_weekdays: [],
  schedule_days_per_week: null,
  schedule_custom_days: [],
  schedule_interval_days: null,
  schedule_end_date: null,
  time_window: null,
  planned_time: null,
  tracking_type: "binary",
  tracking_unit: null,
  tracking_target: null,
  is_priority: false,
  ...over,
});

describe("schedule", () => {
  it("matches daily habits", () => {
    expect(isHabitScheduledOn(baseHabit(), "2026-01-05")).toBe(true);
  });

  it("excludes before start date", () => {
    expect(isHabitScheduledOn(baseHabit(), "2025-12-31")).toBe(false);
  });

  it("matches every N days from start date", () => {
    const habit = baseHabit({
      start_date: "2026-01-01",
      schedule_kind: "every_n_days",
      schedule_interval_days: 3,
    });
    expect(isHabitScheduledOn(habit, "2026-01-01")).toBe(true);
    expect(isHabitScheduledOn(habit, "2026-01-02")).toBe(false);
    expect(isHabitScheduledOn(habit, "2026-01-04")).toBe(true);
  });

  it("matches selected weekdays", () => {
    const habit = baseHabit({
      schedule_kind: "custom",
      schedule_custom_days: [1, 3],
    });
    expect(isHabitScheduledOn(habit, "2026-01-05")).toBe(true); // Mon
    expect(isHabitScheduledOn(habit, "2026-01-06")).toBe(false); // Tue
  });
});

describe("adherence", () => {
  it("excludes skipped from denominator", () => {
    const logs: HabitLog[] = [
      {
        id: "1",
        habit_id: "1",
        log_date: "2026-01-01",
        status: "completed",
        note: null,
        numeric_value: null,
        completion_level: null,
        created_at: "",
        updated_at: "",
      },
      {
        id: "2",
        habit_id: "1",
        log_date: "2026-01-02",
        status: "skipped",
        note: null,
        numeric_value: null,
        completion_level: null,
        created_at: "",
        updated_at: "",
      },
    ];
    const summary = adherenceForRange(baseHabit(), logs, "2026-01-01", "2026-01-02");
    expect(summary.scheduled).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.rate).toBe(100);
  });
});
