/**
 * Daily Do's & Don'ts routine. The arc of "moments" (slots) now lives in the
 * `routine_slots` table and is fully editable in-app. The arrays below are the
 * seed content used to bootstrap the table on first run (see
 * supabase/migrate_editable_routine.sql and ensureSlots in actions/routine).
 * Reference-only lists (weekend rules, five habits, three rules) stay static.
 */

export type DayType = "weekday" | "weekend";

export type RoutineSlot = {
  /** Database row id — present for DB-loaded slots, absent for static seed. */
  id?: string;
  /** Stable identifier referenced by checks + habit links. */
  key: string;
  time: string;
  title: string;
  doText: string;
  dontText: string;
  dayType: DayType;
};

/** Editable fields for creating/updating a routine slot. */
export type RoutineSlotInput = {
  time: string;
  title: string;
  doText: string;
  dontText: string;
  dayType: DayType;
};

export const WEEKDAY_SLOTS: RoutineSlot[] = [
  {
    key: "weekday-wake",
    time: "8:00 AM",
    title: "When you wake up",
    doText:
      "Get out of bed, drink water, and decide the one most important thing you want to accomplish today.",
    dontText:
      "Start scrolling in bed or immediately fill your mind with messages and other people's activities.",
    dayType: "weekday",
  },
  {
    key: "weekday-commute",
    time: "9:00–9:15 AM",
    title: "Getting ready and leaving",
    doText:
      "Get ready without rushing. Use your commute to think, listen to something useful, or simply relax.",
    dontText:
      "Consume random reels or jump between several videos just because you have spare time.",
    dayType: "weekday",
  },
  {
    key: "weekday-morning-work",
    time: "10:00 AM–1:00 PM",
    title: "Office work",
    doText:
      "Pick one important work task. Focus for 30–45 minutes before switching tasks when practical. Write down distracting ideas to revisit later.",
    dontText:
      "Keep checking notifications, multitask unnecessarily, or abandon difficult work to do something more exciting.",
    dayType: "weekday",
  },
  {
    key: "weekday-lunch",
    time: "1:00–1:30 PM",
    title: "Lunch",
    doText:
      "Eat properly. Give yourself a short break without constantly switching between your phone, messages, and videos.",
    dontText:
      "Turn every break into a long scrolling session that makes returning to work harder.",
    dayType: "weekday",
  },
  {
    key: "weekday-afternoon-work",
    time: "2:00–5:00 PM",
    title: "Afternoon work",
    doText:
      "Finish one meaningful piece of work before starting unnecessary new tasks. Use your communication skills to explain ideas and collaborate.",
    dontText:
      "Confuse being busy with making progress, or start a new project whenever your current task becomes boring.",
    dayType: "weekday",
  },
  {
    key: "weekday-snack",
    time: "5:00 PM",
    title: "Snack or afternoon break",
    doText:
      "Take a proper break, have your planned snack when needed, and move around for a few minutes.",
    dontText:
      "Use sugar, endless scrolling, or constant entertainment as your automatic response to every dip in energy.",
    dayType: "weekday",
  },
  {
    key: "weekday-home",
    time: "8:00 PM",
    title: "Returning home",
    doText:
      "Give yourself a small transition period. Change clothes, relax, and then begin your evening routine.",
    dontText:
      "Lie down with your phone and accidentally lose the whole evening.",
    dayType: "weekday",
  },
  {
    key: "weekday-cooking",
    time: "8:30–9:30 PM",
    title: "Cooking and dinner",
    doText:
      "Cook and eat your usual meal. Treat cooking as a natural break from work and screens.",
    dontText:
      "Keep checking your phone between every small cooking task or postpone dinner because you're distracted.",
    dayType: "weekday",
  },
  {
    key: "weekday-walk",
    time: "After dinner",
    title: "Daily walk",
    doText:
      "Continue your walking habit and work toward your usual 10,000-step target on weekdays. If you are tired, a shorter walk is better than abandoning the habit entirely.",
    dontText:
      "Sit scrolling for an hour and then decide it's too late to walk.",
    dayType: "weekday",
  },
  {
    key: "weekday-before-bed",
    time: "Before bed",
    title: "Make your bed, write, chant and read",
    doText:
      "Keep these existing habits. Write a few lines about your day, chant without rushing, and read a little. Spend five minutes without your phone.",
    dontText:
      "Try to do everything perfectly, turn your routine into a long checklist, or replace reading with reels.",
    dayType: "weekday",
  },
];

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
      "Try to avoid a large weekday–weekend sleep schedule difference.",
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
    key: "five-morning-priority",
    title: "One priority each morning",
    text: "Write down the single most important task for the day.",
  },
  {
    key: "five-focused-session",
    title: "One focused work session",
    text: "Spend 30 minutes on one task without unnecessary interruptions.",
  },
  {
    key: "five-phone-free-walk",
    title: "Phone-free walking",
    text: "Walk without scrolling, even if only for 10 minutes.",
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
