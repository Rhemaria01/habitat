/**
 * Daily Do's & Don'ts routine. The arc of "moments" (slots) now lives in the
 * `routine_slots` table and is fully editable in-app. The arrays below are the
 * seed content used to bootstrap the table on first run (see
 * historical SQL seeds / ensureSlots; arcs now live as editable routines).
 * Reference-only lists (weekend rules, five habits, three rules) stay static.
 */

import { PERSONAL_WEEKDAY_SLOTS } from "@/lib/content/personal-data";
import type { DayType, RoutineSlot, RoutineSlotInput } from "@/lib/content/routine-types";

export type { DayType, RoutineSlot, RoutineSlotInput };

export const WEEKDAY_SLOTS: RoutineSlot[] = PERSONAL_WEEKDAY_SLOTS;

export const WEEKEND_SLOTS: RoutineSlot[] = [
  {
    key: "weekend-wake",
    time: "9–10 AM",
    title: "Waking up",
    doText: "Wake around your usual weekend window of 9–10 AM.",
    dontText: "Let one late night turn into sleeping away half the day.",
    dayType: "weekend",
  },
  {
    key: "weekend-meals",
    time: "Breakfast & lunch",
    title: "Meals",
    doText: "Eat at reasonably consistent times.",
    dontText: "Delay both meals until the afternoon without a reason.",
    dayType: "weekend",
  },
  {
    key: "weekend-rest",
    time: "After lunch",
    title: "Rest",
    doText: "Take a short rest if needed.",
    dontText: "Automatically sleep for hours every weekend.",
    dayType: "weekend",
  },
  {
    key: "weekend-project",
    time: "Daytime",
    title: "Personal projects",
    doText: "Give one meaningful goal 30–60 minutes.",
    dontText:
      "Spend the whole day planning several projects without progressing on any.",
    dayType: "weekend",
  },
  {
    key: "weekend-friends",
    time: "Evening",
    title: "Meeting friends",
    doText: "Enjoy your social time fully.",
    dontText:
      "Feel guilty for relaxing or constantly check your phone while with friends.",
    dayType: "weekend",
  },
  {
    key: "weekend-walk",
    time: "Anytime",
    title: "Walking",
    doText: "Fit in a walk, even if you don't reach 10,000 steps.",
    dontText: "Treat a missed target as a failed day.",
    dayType: "weekend",
  },
  {
    key: "weekend-bedtime",
    time: "Night",
    title: "Bedtime",
    doText:
      "Keep bedtime near your weekday rhythm when you can — still aim for enough sleep before Monday gym.",
    dontText:
      "Stay up late simply because there is always another video to watch.",
    dayType: "weekend",
  },
];

/** Which arc a given date falls into (Sat/Sun = weekend). */
export function dayTypeForDate(dateKey: string): DayType {
  const day = new Date(
    Number(dateKey.slice(0, 4)),
    Number(dateKey.slice(5, 7)) - 1,
    Number(dateKey.slice(8, 10)),
  ).getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

/** Seed convenience: the static slots for a date's day type. */
export function slotsForDate(dateKey: string): RoutineSlot[] {
  return dayTypeForDate(dateKey) === "weekend"
    ? WEEKEND_SLOTS
    : WEEKDAY_SLOTS;
}

/** Weekend ground rules, kept as a do/don't table on /routine. */
export const WEEKEND_RULES: { rule: string; doText: string; dontText: string }[] =
  [
    {
      rule: "Sleep",
      doText: "Wake between 9–10 AM — rested, but not a lost half-day.",
      dontText:
        "Let one late night become sleeping through the whole weekend.",
    },
    {
      rule: "Meals",
      doText: "Eat at reasonably consistent times.",
      dontText: "Delay breakfast and lunch until mid-afternoon.",
    },
    {
      rule: "One project",
      doText: "Give one meaningful goal 30–60 focused minutes.",
      dontText: "Plan five new projects and progress on none.",
    },
    {
      rule: "People",
      doText: "Enjoy friend-time fully — be where your feet are.",
      dontText: "Scroll your phone or feel guilty while relaxing.",
    },
    {
      rule: "Movement",
      doText: "Walk, even if 10,000 steps isn't reached.",
      dontText: "Call the day failed because the target was missed.",
    },
    {
      rule: "Night",
      doText: "Keep bedtime near your weekday rhythm.",
      dontText: "Flip day and night before Monday.",
    },
  ];

export const FIVE_KEY_HABITS = [
  {
    key: "five-gym-session",
    title: "Gym session done",
    text: "Show up for the 6:45–8:15 AM session on weekdays.",
  },
  {
    key: "five-steps",
    title: "Steps logged",
    text: "Track daily steps separately from gym attendance.",
  },
  {
    key: "five-bedtime",
    title: "In bed by 11 PM",
    text: "Protect roughly 7h 15m of sleep before a 6:15 AM wake.",
  },
  {
    key: "five-silence",
    title: "Five minutes of silence",
    text: "After chanting or before reading, sit quietly without your phone.",
  },
];

export const THREE_RULES = [
  "Don't change your goal just because you feel bored. Give worthwhile things time to grow.",
  "Don't fill every quiet moment. Your brain is allowed to rest without entertainment.",
  "Don't aim for a perfect day. If you miss a habit, return to it at the next opportunity instead of giving up.",
];
