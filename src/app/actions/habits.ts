"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eachDayKey, todayKey } from "@/lib/dates";
import { isHabitScheduledOn } from "@/lib/domain/schedule";
import { dbDate, toHabit, toHabitLog, toHabitWithLogs } from "@/lib/serialize";
import {
  DEFAULT_HABIT_CARD_ART_KEY,
  isHabitCardArtKey,
} from "@/lib/content/habit-card-art";
import {
  DEFAULT_HABIT_CARD_COVER_STYLE,
  DEFAULT_HABIT_COVER_IMAGE_KEY,
  isHabitCardCoverStyle,
  isHabitCoverImageKey,
} from "@/lib/content/habit-card-cover";
import type { ActionResult } from "@/lib/api/types";
import type {
  Habit,
  HabitBehaviorType,
  HabitInput,
  HabitLog,
  HabitLogStatus,
  HabitWithLogs,
} from "@/lib/types";

export type { ActionResult };

async function guard() {
  await requireAuth();
}

function legacyKind(behavior: HabitBehaviorType): "build" | "quit" {
  return behavior === "build" ? "build" : "quit";
}

function cardArtKeyFromInput(input: HabitInput): string {
  const key = input.card_art_key?.trim();
  if (key && isHabitCardArtKey(key)) return key;
  return DEFAULT_HABIT_CARD_ART_KEY;
}

function cardCoverStyleFromInput(input: HabitInput): string {
  const style = input.card_cover_style?.trim();
  if (style === "object") return DEFAULT_HABIT_CARD_COVER_STYLE;
  if (style && isHabitCardCoverStyle(style)) return style;
  return DEFAULT_HABIT_CARD_COVER_STYLE;
}

function cardCoverImageKeyFromInput(input: HabitInput): string {
  const key = input.card_cover_image_key?.trim();
  if (key && isHabitCoverImageKey(key)) return key;
  return DEFAULT_HABIT_COVER_IMAGE_KEY;
}

function habitData(input: HabitInput) {
  const scheduleKind = input.schedule_kind ?? "daily";
  const base = {
    name: input.name.trim(),
    kind: legacyKind(input.behavior_type),
    behavior_type: input.behavior_type,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    personal_reason: input.personal_reason?.trim() || null,
    start_date: dbDate(input.start_date),
    color: input.color,
    icon: input.icon?.trim() || null,
    card_art_key: cardArtKeyFromInput(input),
    card_cover_style: cardCoverStyleFromInput(input),
    card_cover_image_key: cardCoverImageKeyFromInput(input),
    status: input.status ?? "active",
    frequency: input.frequency ?? "daily",
    schedule_kind: scheduleKind,
    schedule_weekdays: input.schedule_weekdays ?? [],
    schedule_days_per_week: input.schedule_days_per_week ?? null,
    schedule_custom_days: input.schedule_custom_days ?? [],
    schedule_end_date: input.schedule_end_date ? dbDate(input.schedule_end_date) : null,
    time_window: input.time_window ?? null,
    planned_time: input.planned_time?.trim() || null,
    stack_after: input.stack_after?.trim() || null,
    two_minute_version: input.minimum_version?.trim() || null,
    minimum_version: input.minimum_version?.trim() || null,
    standard_version: input.standard_version?.trim() || input.name.trim(),
    stretch_version: input.stretch_version?.trim() || null,
    estimated_duration_minutes: input.estimated_duration_minutes ?? null,
    identity_proof: input.identity_proof?.trim() || null,
    cue_type: input.cue_type || null,
    cue_time: input.cue_time?.trim() || null,
    cue_place: input.cue_place?.trim() || null,
    cue_event: input.cue_event?.trim() || null,
    anchor_habit_id: input.anchor_habit_id || null,
    cue_notes: input.cue_notes?.trim() || null,
    motivation_meaning: input.motivation_meaning?.trim() || null,
    motivation_appeal: input.motivation_appeal?.trim() || null,
    motivation_pairing: input.motivation_pairing?.trim() || null,
    motivation_social: input.motivation_social?.trim() || null,
    friction_obstacle: input.friction_obstacle?.trim() || null,
    friction_environment: input.friction_environment?.trim() || null,
    friction_increase: input.friction_increase?.trim() || null,
    commitment_mechanism: input.commitment_mechanism?.trim() || null,
    reward_feedback: input.reward_feedback?.trim() || null,
    reward_personal: input.reward_personal?.trim() || null,
    recovery_plan: input.recovery_plan?.trim() || null,
    recovery_reminder: input.recovery_reminder ?? true,
    tracking_type: input.tracking_type ?? "binary",
    tracking_unit: input.tracking_unit?.trim() || null,
    tracking_target: input.tracking_target ?? null,
    is_priority: input.is_priority ?? false,
  };

  if (scheduleKind === "every_n_days") {
    return {
      ...base,
      schedule_interval_days: input.schedule_interval_days ?? 2,
    };
  }

  return base;
}

function validateInput(input: HabitInput): string | null {
  if (!input.name.trim()) return "Give your habit a name.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start_date)) return "Pick a valid start date.";
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) return "Pick a valid color.";

  const kind = input.schedule_kind ?? "daily";
  if (kind === "every_n_days") {
    const n = input.schedule_interval_days ?? 0;
    if (n < 2 || n > 365) return "Pick an interval between 2 and 365 days.";
  }
  if (kind === "custom") {
    const days = input.schedule_custom_days ?? [];
    if (days.length === 0) return "Pick at least one day for this schedule.";
  }
  if (kind === "days_per_week") {
    const n = input.schedule_days_per_week ?? 0;
    if (n < 1 || n > 7) return "Pick 1–7 times per week.";
  }
  return null;
}

export async function listHabits(includeArchived = false): Promise<HabitWithLogs[]> {
  await guard();
  const rows = await prisma.habit.findMany({
    where: includeArchived ? {} : { status: { not: "archived" }, archived_at: null },
    orderBy: [{ is_priority: "desc" }, { sort_order: "asc" }, { created_at: "asc" }],
    include: { logs: { orderBy: { log_date: "asc" } } },
  });
  return rows.map(toHabitWithLogs);
}

export async function getHabit(id: string): Promise<HabitWithLogs | null> {
  await guard();
  const row = await prisma.habit.findUnique({
    where: { id },
    include: { logs: { orderBy: { log_date: "asc" } } },
  });
  return row ? toHabitWithLogs(row) : null;
}

export async function createHabit(input: HabitInput): Promise<ActionResult<Habit>> {
  try {
    await guard();
    const invalid = validateInput(input);
    if (invalid) return { ok: false, error: invalid };

    const habit = await prisma.$transaction(async (tx) => {
      const tail = await tx.habit.findFirst({
        where: { archived_at: null },
        orderBy: { sort_order: "desc" },
        select: { sort_order: true },
      });
      const created = await tx.habit.create({
        data: { ...habitData(input), sort_order: (tail?.sort_order ?? -1) + 1 },
      });
      return created;
    });

    revalidatePath("/");
    revalidatePath("/habits");
    return { ok: true, data: toHabit(habit) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create habit." };
  }
}

export async function updateHabit(
  id: string,
  input: HabitInput,
): Promise<ActionResult<Habit>> {
  try {
    await guard();
    const invalid = validateInput(input);
    if (invalid) return { ok: false, error: invalid };
    const row = await prisma.habit.update({
      where: { id },
      data: habitData(input),
    });
    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath(`/habits/${id}`);
    return { ok: true, data: toHabit(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update habit." };
  }
}

export async function pauseHabit(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habit.update({ where: { id }, data: { status: "paused" } });
    revalidatePath("/habits");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not pause." };
  }
}

export async function archiveHabit(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habit.update({
      where: { id },
      data: { status: "archived", archived_at: new Date() },
    });
    revalidatePath("/habits");
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not archive." };
  }
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habit.deleteMany({ where: { id } });
    revalidatePath("/");
    revalidatePath("/habits");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function reorderHabits(orderedIds: string[]): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.habit.update({ where: { id }, data: { sort_order: index } }),
      ),
    );
    revalidatePath("/habits");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reorder." };
  }
}

/** @deprecated use setHabitLog from today.ts */
export async function toggleHabitDay(
  habitId: string,
  behavior: HabitBehaviorType,
  logDate: string,
  currentlyLogged: boolean,
): Promise<ActionResult<HabitLog | null>> {
  const status: HabitLogStatus =
    behavior === "build" ? "completed" : "maintained";
  if (currentlyLogged) {
    const { setHabitLog } = await import("@/app/actions/today");
    const r = await setHabitLog(habitId, logDate, null);
    return r.ok ? { ok: true, data: null } : r;
  }
  const row = await prisma.habitLog.upsert({
    where: { habit_id_log_date: { habit_id: habitId, log_date: dbDate(logDate) } },
    update: { status },
    create: { habit_id: habitId, log_date: dbDate(logDate), status },
  });
  revalidatePath("/");
  return { ok: true, data: toHabitLog(row) };
}

export async function seedHistoryFromStart(
  habitId: string,
  behavior: HabitBehaviorType,
  startDate: string,
  missedDates: string[],
): Promise<ActionResult> {
  try {
    await guard();
    const missed = new Set(missedDates);
    const row = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!row) return { ok: false, error: "Habit not found." };
    const habit = toHabit(row);
    const logs = eachDayKey(startDate, todayKey())
      .filter((d) => !missed.has(d) && isHabitScheduledOn(habit, d))
      .map((log_date) => ({
        habit_id: habitId,
        log_date: dbDate(log_date),
        status: (behavior === "build" ? "completed" : "maintained") as HabitLogStatus,
      }));
    if (logs.length) {
      await prisma.habitLog.createMany({ data: logs, skipDuplicates: true });
    }
    revalidatePath(`/habits/${habitId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not seed history." };
  }
}
