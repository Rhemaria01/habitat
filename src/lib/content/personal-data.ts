/**
 * Reenav's Habitat seed habits.
 * Applied idempotently via `npm run db:seed-personal` (source_key on habits).
 */

import type { ImportDocument } from "@/lib/import-export";
import { IMPORT_VERSION } from "@/lib/import-export";

/** Habits removed from the seed set are archived on re-seed (by source_key). */
export const PERSONAL_HABIT_SOURCE_KEYS_RETIRED = [
  "wake-615",
  "gym-ready",
  "meal-routine",
  "bedtime-11",
  "sleep-duration",
  "wash-clothes-weekly",
] as const;

export type PersonalHabitSeed = {
  source_key: string;
  name: string;
  behavior_type: "build" | "reduce" | "avoid";
  category: string;
  color: string;
  schedule_kind: "daily" | "weekdays" | "custom" | "days_per_week" | "every_n_days";
  schedule_weekdays?: number[];
  schedule_days_per_week?: number;
  schedule_interval_days?: number;
  frequency: "daily" | "weekly";
  /** YYYY-MM-DD; defaults to today when seeding if omitted. */
  start_date?: string;
  planned_time?: string | null;
  time_window?: string | null;
  tracking_type: "binary" | "numeric";
  tracking_unit?: string | null;
  stack_after?: string | null;
  two_minute_version?: string | null;
  identity_proof?: string | null;
  is_priority?: boolean;
};

export const PERSONAL_HABITS: PersonalHabitSeed[] = [
  {
    source_key: "quit-smoking",
    name: "Quit smoking",
    behavior_type: "avoid",
    category: "Health",
    color: "#FF7A8A",
    schedule_kind: "daily",
    frequency: "daily",
    start_date: "2026-04-26",
    tracking_type: "binary",
    identity_proof: "I protect my lungs and my future self",
    two_minute_version: "Delay the next cigarette by ten minutes",
  },
  {
    source_key: "gym-session",
    name: "1 hour of weight lifting / cardio",
    behavior_type: "build",
    category: "Morning & fitness",
    color: "#4FD1A5",
    schedule_kind: "weekdays",
    schedule_weekdays: [1, 2, 3, 4, 5],
    frequency: "daily",
    planned_time: "1 hour",
    time_window: "morning",
    tracking_type: "binary",
    identity_proof: "I am someone who trains consistently",
    is_priority: true,
  },
  {
    source_key: "daily-steps",
    name: "Daily step target",
    behavior_type: "build",
    category: "Morning & fitness",
    color: "#6FB3E8",
    schedule_kind: "daily",
    frequency: "daily",
    tracking_type: "numeric",
    tracking_unit: "steps",
    identity_proof: "I move every day",
    two_minute_version: "Take a ten-minute walk",
  },
  {
    source_key: "daily-writing",
    name: "Daily writing / journaling",
    behavior_type: "build",
    category: "Personal growth",
    color: "#A78BFA",
    schedule_kind: "daily",
    frequency: "daily",
    time_window: "evening",
    tracking_type: "binary",
    two_minute_version: "Write three sentences about today",
    identity_proof: "I reflect and learn from my days",
  },
  {
    source_key: "daily-reading",
    name: "Daily reading",
    behavior_type: "build",
    category: "Personal growth",
    color: "#A78BFA",
    schedule_kind: "daily",
    frequency: "daily",
    time_window: "evening",
    tracking_type: "binary",
    two_minute_version: "Read one page",
    identity_proof: "I feed my mind deliberately",
  },
  {
    source_key: "daily-chanting",
    name: "Daily chanting",
    behavior_type: "build",
    category: "Personal growth",
    color: "#A78BFA",
    schedule_kind: "daily",
    frequency: "daily",
    time_window: "evening",
    tracking_type: "binary",
    two_minute_version: "One minute of chanting",
    identity_proof: "I practice stillness and devotion",
  },
  {
    source_key: "make-bed",
    name: "Make the bed",
    behavior_type: "build",
    category: "Daily discipline",
    color: "#5E6AD2",
    schedule_kind: "daily",
    frequency: "daily",
    time_window: "evening",
    tracking_type: "binary",
    two_minute_version: "Straighten the duvet",
    identity_proof: "I close the day with order",
  },
];

/** JSON import shape (for export / future import UI). */
export function buildPersonalImportDocument(startDate: string): ImportDocument {
  return {
    version: IMPORT_VERSION,
    habits: PERSONAL_HABITS.map((h) => ({
      name: h.name,
      kind: h.behavior_type === "build" ? "build" : "quit",
      frequency: h.frequency,
      start_date: h.start_date ?? startDate,
      color: h.color,
      stack_after: h.stack_after ?? null,
      two_minute_version: h.two_minute_version ?? null,
      identity_proof: h.identity_proof ?? null,
    })),
  };
}
