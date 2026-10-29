/**
 * Reenav's Habitat seed: goals, habits, and weekday routine.
 * Applied idempotently via `npm run db:seed-personal` (source_key on habits).
 */

import type { ImportDocument } from "@/lib/import-export";
import { IMPORT_VERSION } from "@/lib/import-export";
import type { DayType, RoutineSlot } from "@/lib/content/routine-types";

export const PERSONAL_SLEEP = {
  wake: "6:15 AM",
  bedtime: "11:00 PM",
  /** Target sleep duration (6:15 AM → 11:00 PM). */
  durationMinutes: 7 * 60 + 15,
  durationLabel: "7 hours 15 minutes",
} as const;

export type PersonalHabitSeed = {
  source_key: string;
  name: string;
  behavior_type: "build" | "reduce" | "avoid";
  category: string;
  color: string;
  schedule_kind: "daily" | "weekdays" | "custom" | "days_per_week";
  schedule_weekdays?: number[];
  frequency: "daily" | "weekly";
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
    tracking_type: "binary",
    identity_proof: "I protect my lungs and my future self",
    two_minute_version: "Delay the next cigarette by ten minutes",
  },
  {
    source_key: "wake-615",
    name: "Wake up at 6:15 AM",
    behavior_type: "build",
    category: "Morning & fitness",
    color: "#F5B942",
    schedule_kind: "weekdays",
    frequency: "daily",
    planned_time: "6:15 AM",
    time_window: "morning",
    tracking_type: "binary",
    stack_after: "My alarm sounds",
    two_minute_version: "Sit up and drink water",
    identity_proof: "I start my day on purpose",
    is_priority: true,
  },
  {
    source_key: "gym-ready",
    name: "Get ready for the gym",
    behavior_type: "build",
    category: "Morning & fitness",
    color: "#4FD1A5",
    schedule_kind: "weekdays",
    frequency: "daily",
    planned_time: "6:15–6:45 AM",
    time_window: "morning",
    tracking_type: "binary",
    stack_after: "I wake up",
    two_minute_version: "Lay out gym clothes",
    identity_proof: "I show up for training",
  },
  {
    source_key: "gym-session",
    name: "Gym session (6:45–8:15 AM)",
    behavior_type: "build",
    category: "Morning & fitness",
    color: "#4FD1A5",
    schedule_kind: "weekdays",
    frequency: "daily",
    planned_time: "6:45–8:15 AM",
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
  {
    source_key: "meal-routine",
    name: "Follow the planned meal routine",
    behavior_type: "build",
    category: "Daily discipline",
    color: "#F5B942",
    schedule_kind: "daily",
    frequency: "daily",
    tracking_type: "binary",
    identity_proof: "I nourish myself with intention",
  },
  {
    source_key: "bedtime-11",
    name: "Bedtime by 11:00 PM",
    behavior_type: "build",
    category: "Daily discipline",
    color: "#5E6AD2",
    schedule_kind: "daily",
    frequency: "daily",
    planned_time: "11:00 PM",
    time_window: "night",
    tracking_type: "binary",
    identity_proof: "I protect recovery for early training",
    is_priority: true,
  },
  {
    source_key: "sleep-duration",
    name: "Sleep duration (7h 15m target)",
    behavior_type: "build",
    category: "Daily discipline",
    color: "#5E6AD2",
    schedule_kind: "daily",
    frequency: "daily",
    time_window: "night",
    tracking_type: "numeric",
    tracking_unit: "minutes",
    identity_proof: "I recover enough to sustain the gym routine",
  },
  {
    source_key: "wash-clothes-weekly",
    name: "Wash clothes",
    behavior_type: "build",
    category: "Weekly",
    color: "#6FB3E8",
    schedule_kind: "days_per_week",
    frequency: "weekly",
    tracking_type: "binary",
    two_minute_version: "Start one load",
    identity_proof: "I keep my space and wardrobe in order",
  },
];

export const PERSONAL_GOALS = [
  {
    source_key: "goal-quit-smoking",
    title: "Quit smoking",
    identity_statement: "I am smoke-free",
    why: "Clear lungs, clearer mornings before the gym",
    color: "#FF7A8A",
    habit_source_keys: ["quit-smoking"],
  },
  {
    source_key: "goal-daily-rhythm",
    title: "Sustainable daily rhythm",
    identity_statement: "I live by a rhythm that supports training and recovery",
    why: "Early gym, honest evenings, sleep by 11 PM",
    color: "#4FD1A5",
    habit_source_keys: [
      "wake-615",
      "gym-ready",
      "gym-session",
      "daily-steps",
      "daily-writing",
      "daily-reading",
      "daily-chanting",
      "make-bed",
      "meal-routine",
      "bedtime-11",
      "sleep-duration",
      "wash-clothes-weekly",
    ],
  },
] as const;

/** Weekday arc for routine_slots-style reference (also mirrored in routine.ts). */
export const PERSONAL_WEEKDAY_SLOTS: RoutineSlot[] = [
  {
    key: "weekday-wake",
    time: "6:15 AM",
    title: "Wake up",
    doText:
      "Get out of bed on your alarm, drink water, and start getting ready for the gym without scrolling.",
    dontText: "Snooze repeatedly or start the day in bed on your phone.",
    dayType: "weekday",
  },
  {
    key: "weekday-gym-prep",
    time: "6:15–6:45 AM",
    title: "Get ready for the gym",
    doText:
      "Change, pack what you need, and leave enough time to reach the gym calmly.",
    dontText: "Rush because you started late, or skip prep and arrive unprepared.",
    dayType: "weekday",
  },
  {
    key: "weekday-gym",
    time: "6:45–8:15 AM",
    title: "Gym / workout",
    doText:
      "Complete your planned session. Log gym attendance separately from steps or sleep metrics.",
    dontText: "Cut the session short without reason or treat a bad day as permission to quit the habit.",
    dayType: "weekday",
  },
  {
    key: "weekday-morning-prep",
    time: "8:15–9:15 AM",
    title: "Shower, dress, prepare for work",
    doText:
      "Shower, get dressed, and finish what you need before leaving — fuel if that’s part of your plan.",
    dontText: "Lose time to passive scrolling before you need to leave.",
    dayType: "weekday",
  },
  {
    key: "weekday-commute",
    time: "9:15 AM",
    title: "Leave for office",
    doText: "Leave on time so breakfast at the office stays unhurried.",
    dontText: "Leave late and compress breakfast or start work already behind.",
    dayType: "weekday",
  },
  {
    key: "weekday-breakfast",
    time: "10:00–10:30 AM",
    title: "Reach office and breakfast",
    doText: "Eat your planned breakfast and settle into work.",
    dontText: "Skip breakfast or replace it with junk because the morning was rushed.",
    dayType: "weekday",
  },
  {
    key: "weekday-work-morning",
    time: "10:30 AM–1:00 PM",
    title: "Morning work",
    doText:
      "Focus on meaningful work in blocks; note distractions to handle later.",
    dontText: "Multitask constantly or confuse busyness with progress.",
    dayType: "weekday",
  },
  {
    key: "weekday-lunch",
    time: "1:00–1:30 PM",
    title: "Lunch",
    doText: "Eat your planned lunch and take a real break from screens.",
    dontText: "Turn lunch into a long scroll session.",
    dayType: "weekday",
  },
  {
    key: "weekday-afternoon",
    time: "1:30–5:00 PM",
    title: "Afternoon work",
    doText: "Finish something important before the day ends.",
    dontText: "Start fresh rabbit holes whenever work feels boring.",
    dayType: "weekday",
  },
  {
    key: "weekday-snack",
    time: "5:00 PM",
    title: "Evening snack",
    doText: "Have your planned snack if you need it; move briefly afterward.",
    dontText: "Use sugar or scrolling as your default energy fix.",
    dayType: "weekday",
  },
  {
    key: "weekday-home",
    time: "Around 8:00 PM",
    title: "Return home",
    doText: "Transition out of work mode — change, breathe, then start dinner.",
    dontText: "Collapse on the couch with your phone and lose the whole evening.",
    dayType: "weekday",
  },
  {
    key: "weekday-dinner",
    time: "8:00–9:30 PM",
    title: "Prepare dinner and eat",
    doText:
      "Cook and eat on schedule so you still have time to walk, write, chant, and read before 11 PM.",
    dontText: "Start dinner so late that bedtime slips past 11 PM again.",
    dayType: "weekday",
  },
  {
    key: "weekday-evening-habits",
    time: "After dinner",
    title: "Walk, writing, chanting, reading, bed",
    doText:
      "Walk toward your step target, write a few lines, chant, read, and make the bed — keep gym, steps, bedtime, and sleep duration as separate check-ins.",
    dontText: "Try to do everything perfectly or replace reading with reels.",
    dayType: "weekday",
  },
  {
    key: "weekday-sleep",
    time: "11:00 PM",
    title: "Sleep",
    doText:
      `Aim for lights out by ${PERSONAL_SLEEP.bedtime} (${PERSONAL_SLEEP.durationLabel} before ${PERSONAL_SLEEP.wake}). Log bedtime and sleep duration separately.`,
    dontText: "Stay up until midnight out of habit when you have a 6:15 AM wake-up.",
    dayType: "weekday",
  },
];

export const PERSONAL_WEEKDAY_ROUTINE = {
  source_key: "routine-weekday-full-day",
  name: "Weekday full day",
  description:
    "Office day with 6:15 AM wake, gym 6:45–8:15 AM, dinner by 9:30 PM, sleep by 11 PM.",
  schedule_kind: "weekdays" as const,
  schedule_weekdays: [1, 2, 3, 4, 5],
  steps: [
    { title: "Wake up (6:15 AM)", habit_source_key: "wake-615" },
    { title: "Get ready for the gym", habit_source_key: "gym-ready" },
    { title: "Gym session (6:45–8:15 AM)", habit_source_key: "gym-session" },
    { title: "Shower, dress, leave for office (9:15 AM)", habit_source_key: null },
    { title: "Office breakfast (10:00–10:30 AM)", habit_source_key: "meal-routine" },
    { title: "Lunch (1:00–1:30 PM)", habit_source_key: null },
    { title: "Evening snack (5:00 PM, optional)", habit_source_key: null },
    { title: "Dinner (8:00–9:30 PM)", habit_source_key: null },
    { title: "Walk + writing + chanting + reading + make bed", habit_source_key: "daily-writing" },
    { title: "Bedtime by 11:00 PM", habit_source_key: "bedtime-11" },
  ],
};

/** JSON import shape (for export / future import UI). */
export function buildPersonalImportDocument(startDate: string): ImportDocument {
  return {
    version: IMPORT_VERSION,
    habits: PERSONAL_HABITS.map((h) => ({
      name: h.name,
      kind: h.behavior_type === "build" ? "build" : "quit",
      frequency: h.frequency,
      start_date: startDate,
      color: h.color,
      stack_after: h.stack_after ?? null,
      two_minute_version: h.two_minute_version ?? null,
      identity_proof: h.identity_proof ?? null,
    })),
    goals: PERSONAL_GOALS.map((g) => ({
      title: g.title,
      identity_statement: g.identity_statement,
      why: g.why,
      color: g.color,
      target_date: null,
      habit_names: g.habit_source_keys.map(
        (key) => PERSONAL_HABITS.find((h) => h.source_key === key)!.name,
      ),
    })),
  };
}

export function personalDayTypeForDate(dateKey: string): DayType {
  const day = new Date(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
  ).getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}
