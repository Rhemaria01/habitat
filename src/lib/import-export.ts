/**
 * JSON import/export templates for habits.
 *
 * The prompts in this file are meant to be copied into ANY gen-AI (ChatGPT,
 * Claude, Gemini, …). The AI replies with a JSON document matching
 * `ImportDocument`, which the /import screen validates and writes to the DB.
 *
 * Pure module — safe to import from both client and server.
 */

import { todayKey } from "@/lib/dates";

/* ------------------------------------------------------------------ */
/* Palette (kept in sync with HabitForm swatches)          */
/* ------------------------------------------------------------------ */

export const HABIT_COLORS = [
  "#4FD1A5",
  "#FF7A8A",
  "#F5B942",
  "#A78BFA",
  "#6FB3E8",
  "#F2789F",
];

/* ------------------------------------------------------------------ */
/* Document shape                                                     */
/* ------------------------------------------------------------------ */

export const IMPORT_VERSION = 1 as const;

export type ImportHabit = {
  name: string;
  /** "build" = a good habit to grow, "quit" = something you're quitting. */
  kind: "build" | "quit";
  frequency: "daily" | "weekly";
  /** YYYY-MM-DD. Defaults to today when omitted. */
  start_date: string;
  color: string;
  /** Habit-stacking cue: "After I <stack_after>, I will <this habit>." */
  stack_after?: string | null;
  /** A 2-minute version to start with when motivation is low. */
  two_minute_version?: string | null;
  /** The identity one check-in proves, e.g. "I am a runner." */
  identity_proof?: string | null;
  /** build habits: YYYY-MM-DD days you already missed (everything else counts done). */
  missed_dates?: string[];
  /** quit habits: YYYY-MM-DD days you relapsed. */
  relapse_dates?: string[];
};

export type ImportDocument = {
  version: typeof IMPORT_VERSION;
  habits: ImportHabit[];
};

/** @deprecated Legacy import files may include goals; they are ignored on import. */
export type ImportGoal = {
  title: string;
  identity_statement: string;
  why?: string | null;
  color: string;
  target_date?: string | null;
  habit_names?: string[];
};

/* ------------------------------------------------------------------ */
/* Example documents (also served as "copy this format" references)   */
/* ------------------------------------------------------------------ */

export const EXAMPLE_HABITS: ImportDocument = {
  version: IMPORT_VERSION,
  habits: [
    {
      name: "Walk 10,000 steps",
      kind: "build",
      frequency: "daily",
      start_date: todayKey(),
      color: "#4FD1A5",
      stack_after: "Pour my morning coffee",
      two_minute_version: "Put on my shoes and step outside",
      identity_proof: "I am someone who moves every day",
    },
    {
      name: "No phone in bed",
      kind: "quit",
      frequency: "daily",
      start_date: todayKey(),
      color: "#FF7A8A",
      two_minute_version: "Charge the phone across the room",
      identity_proof: "I protect my sleep",
    },
    {
      name: "Weekly review",
      kind: "build",
      frequency: "weekly",
      start_date: todayKey(),
      color: "#6FB3E8",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Prompt templates to hand to a gen-AI                               */
/* ------------------------------------------------------------------ */

const FIELD_RULES = `Field rules (STRICT):
- "name": string, 1-80 chars, unique within the document.
- "kind": "build" (a good habit to grow) OR "quit" (something you are quitting).
- "frequency": "daily" OR "weekly" (legacy; prefer "schedule" below).
- "schedule" (optional object):
  - "kind": "daily" | "weekdays" | "custom" | "days_per_week" | "every_n_days"
  - "weekdays": array of 0–6 (Sun–Sat) when kind is "custom" or "weekdays"
  - "days_per_week": 1–7 when kind is "days_per_week"
  - "every_n_days": 2–365 when kind is "every_n_days"
- "start_date": "YYYY-MM-DD", never in the future. Omit to default to today.
- "color": one of: ${HABIT_COLORS.join(", ")} (pick a fitting one).
- "stack_after" (optional): the existing habit this one follows, phrased
  "After I <stack_after>, I will <name>". Plain cue only, no "After I".
- "two_minute_version" (optional): a tiny ≤2-minute version to start with.
- "identity_proof" (optional): the self-image one check-in votes for.
- "missed_dates" (optional, build only): array of "YYYY-MM-DD" days already missed.
- "relapse_dates" (optional, quit only): array of "YYYY-MM-DD" days relapsed.`;

const OUTPUT_RULES = `Output rules:
- Reply with ONLY one JSON code block. No prose before or after it.
- It MUST parse with JSON.parse — double quotes, no trailing commas, no comments.
- Use the exact keys above. Omit optional fields you cannot fill — never invent dates.
- Do not include ids, timestamps, or any extra keys.`;

export const HABITS_PROMPT = `You are helping me plan habits for "Habitat", a personal
growth app. I will describe the habits I want (or the theme of my life focus).
You will design them using Atomic Habits principles and return a JSON document
to import.

Design guidance:
- Keep habits small and specific enough to actually do.
- Prefer habit-stacking cues and a 2-minute version for hard new habits.
- For each habit, choose "build" or "quit" and a schedule (daily, weekly, or custom days / every N days).
- Give each an "identity_proof" line unless the habit is purely mechanical.
${FIELD_RULES}
${OUTPUT_RULES}

Return the document shaped exactly like this (replace the sample contents):
${JSON.stringify({ version: IMPORT_VERSION, habits: [EXAMPLE_HABITS.habits[0]] }, null, 2)}

My habits / focus are:
<DESCRIBE YOUR HABITS HERE>`;

/* ------------------------------------------------------------------ */
/* Parse + normalize (shared by client preview and server import)     */
/* ------------------------------------------------------------------ */

export type ParseResult =
  | { ok: true; doc: ImportDocument; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(asTrimmedString).filter(Boolean)
    : [];
}

function pickColor(value: unknown, palette: string[], fallback: string): string {
  const color = asTrimmedString(value);
  if (HEX_RE.test(color)) return color;
  // Snap a requested palette color (case-insensitive) or fall back.
  return palette.includes(color.toUpperCase()) ? color : fallback;
}

/** A valid date no later than today, else "" (caller decides default). */
function normalizeDate(value: unknown): string {
  const date = asTrimmedString(value);
  if (!DATE_RE.test(date)) return "";
  if (date > todayKey()) return "";
  return date;
}

function cap(value: unknown, max: number): string | null {
  const text = asTrimmedString(value);
  if (!text) return null;
  return text.length > max ? text.slice(0, max) : text;
}

function dateSetWithin(
  value: unknown,
  start: string,
  label: string,
  errors: string[],
): string[] {
  const dates = asStringArray(value);
  const today = todayKey();
  const valid: string[] = [];
  for (const date of dates) {
    if (!DATE_RE.test(date)) {
      errors.push(`${label}: "${date}" is not a valid YYYY-MM-DD date.`);
      continue;
    }
    if (date < start || date > today) {
      errors.push(
        `${label}: "${date}" must fall between start date and today.`,
      );
      continue;
    }
    valid.push(date);
  }
  return [...new Set(valid)];
}

function parseHabit(
  raw: unknown,
  index: number,
  warnings: string[],
  errors: string[],
): ImportHabit | null {
  if (!isRecord(raw)) {
    errors.push(`habits[${index}]: expected an object.`);
    return null;
  }
  const label = `habits[${index}]`;

  const name = cap(raw.name, 80);
  if (!name) {
    errors.push(`${label}: a habit needs a name.`);
    return null;
  }

  let kind = asTrimmedString(raw.kind).toLowerCase();
  if (kind !== "build" && kind !== "quit") {
    warnings.push(`${label} "${name}": defaulting kind to "build".`);
    kind = "build";
  }

  let frequency = asTrimmedString(raw.frequency).toLowerCase();
  if (frequency !== "daily" && frequency !== "weekly") {
    frequency = "daily";
  }

  let start_date = normalizeDate(raw.start_date);
  if (!start_date) {
    if (asTrimmedString(raw.start_date)) {
      warnings.push(`${label} "${name}": start_date was invalid/future — using today.`);
    }
    start_date = todayKey();
  }

  const habit: ImportHabit = {
    name,
    kind: kind as ImportHabit["kind"],
    frequency: frequency as ImportHabit["frequency"],
    start_date,
    color: pickColor(raw.color, HABIT_COLORS, HABIT_COLORS[0]),
    stack_after: cap(asTrimmedString(raw.stack_after), 200),
    two_minute_version: cap(asTrimmedString(raw.two_minute_version), 200),
    identity_proof: cap(asTrimmedString(raw.identity_proof), 200),
  };

  if (habit.kind === "quit") {
    habit.relapse_dates = dateSetWithin(
      raw.relapse_dates,
      start_date,
      `${label} "${name}"`,
      errors,
    );
  } else if (raw.missed_dates !== undefined) {
    habit.missed_dates = dateSetWithin(
      raw.missed_dates,
      start_date,
      `${label} "${name}"`,
      errors,
    );
  }

  return habit;
}

/**
 * Parse free text (the AI's reply) into a validated, normalized document.
 * Tolerates ```json fences and surrounding prose. Returns fatal `errors`
 * (block import) and soft `warnings` (import proceeds).
 */
export function parseImportJson(rawText: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const text = stripCodeFence(rawText);
  if (!text) {
    return { ok: false, errors: ["Paste the JSON the AI generated."], warnings };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: ["That isn't valid JSON. Ask the AI to fix it, or check for stray text."],
      warnings,
    };
  }

  const root = isRecord(parsed) ? parsed : {};
  const rawHabits = Array.isArray(root.habits)
    ? root.habits
    : parsed && !isRecord(parsed) && Array.isArray(parsed)
      ? (parsed as unknown[])
      : [];
  const rawGoals = Array.isArray(root.goals) ? root.goals : [];
  if (rawGoals.length > 0) {
    warnings.push(
      `"goals" in the document are ignored — Habitat only imports habits now.`,
    );
  }

  if (!Array.isArray(root.habits) && rawHabits.length === 0) {
    warnings.push('No "habits" array found.');
  }

  const habits: ImportHabit[] = [];
  const seenHabitNames = new Map<string, number>();
  rawHabits.forEach((item, index) => {
    const habit = parseHabit(item, index, warnings, errors);
    if (!habit) return;
    const key = habit.name.toLowerCase();
    const dupeIndex = seenHabitNames.get(key);
    if (dupeIndex !== undefined) {
      errors.push(
        `Duplicate habit name "${habit.name}" (habits[${index}] and habits[${dupeIndex}]).`,
      );
      return;
    }
    seenHabitNames.set(key, habits.length);
    habits.push(habit);
  });

  if (habits.length === 0) {
    errors.push("Nothing to import — the document has no valid habits.");
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  return {
    ok: true,
    warnings,
    doc: { version: IMPORT_VERSION, habits },
  };
}

function stripCodeFence(input: string): string {
  let text = input.trim();
  if (!text) return "";
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the outermost { } or [ ] slice if prose leaked in.
  if (!text.startsWith("{") && !text.startsWith("[")) {
    const start = text.search(/[{[]/);
    const endObj = text.lastIndexOf("}");
    const endArr = text.lastIndexOf("]");
    const end = Math.max(endObj, endArr);
    if (start >= 0 && end > start) text = text.slice(start, end + 1);
  }
  return text;
}

/* ------------------------------------------------------------------ */
/* Export current data into a re-importable document                   */
/* ------------------------------------------------------------------ */

type ExportHabitSource = {
  name: string;
  kind: "build" | "quit";
  frequency: "daily" | "weekly";
  start_date: string;
  color: string;
  stack_after: string | null;
  two_minute_version: string | null;
  identity_proof: string | null;
  logs: { log_date: string; status: "done" | "relapse" }[];
};

export function buildExportDocument(habits: ExportHabitSource[]): ImportDocument {
  const exportedHabits: ImportHabit[] = habits.map((habit) => {
    const base: ImportHabit = {
      name: habit.name,
      kind: habit.kind,
      frequency: habit.frequency,
      start_date: habit.start_date,
      color: habit.color,
      stack_after: habit.stack_after,
      two_minute_version: habit.two_minute_version,
      identity_proof: habit.identity_proof,
    };
    if (habit.kind === "quit") {
      base.relapse_dates = habit.logs
        .filter((l) => l.status === "relapse")
        .map((l) => l.log_date);
    } else {
      const done = new Set(
        habit.logs.filter((l) => l.status === "done").map((l) => l.log_date),
      );
      const today = todayKey();
      const missed: string[] = [];
      for (
        let cursor = habit.start_date;
        cursor <= today;
        cursor = nextDay(cursor)
      ) {
        if (!done.has(cursor)) missed.push(cursor);
      }
      base.missed_dates = missed;
    }
    return base;
  });

  return { version: IMPORT_VERSION, habits: exportedHabits };
}

function nextDay(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
