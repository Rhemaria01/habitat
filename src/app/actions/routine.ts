"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dbDate, toHabitWithLogs, toRoutineSlot } from "@/lib/serialize";
import {
  WEEKDAY_SLOTS,
  WEEKEND_SLOTS,
  type RoutineSlot,
  type RoutineSlotInput,
} from "@/lib/content/routine";
import type { HabitWithLogs, RoutineSlotLink } from "@/lib/types";
import type { ActionResult } from "./habits";

async function guard() {
  await requireAuth();
}

function revalidateRoutineViews() {
  revalidatePath("/");
  revalidatePath("/routine");
}

function seedRow(s: RoutineSlot, sortOrder: number) {
  return {
    slot_key: s.key,
    day_type: s.dayType,
    time: s.time,
    title: s.title,
    do_text: s.doText,
    dont_text: s.dontText,
    sort_order: sortOrder,
  };
}

/**
 * Bootstrap the routine_slots table from the shipped seed content the first
 * time it's read, so the app works even if only the (empty) table was created.
 */
async function ensureSlots() {
  const count = await prisma.routineSlot.count();
  if (count > 0) return;
  const seed = [
    ...WEEKDAY_SLOTS.map((s, i) => seedRow(s, i)),
    ...WEEKEND_SLOTS.map((s, i) => seedRow(s, i)),
  ];
  await prisma.routineSlot.createMany({ data: seed, skipDuplicates: true });
}

async function loadSlots(): Promise<RoutineSlot[]> {
  const rows = await prisma.routineSlot.findMany({
    orderBy: [{ day_type: "asc" }, { sort_order: "asc" }],
  });
  return rows.map(toRoutineSlot);
}

export type RoutineData = {
  /** slot_key -> checked in for the requested date */
  checkedSlots: string[];
  /** habits associated with routine slots on the requested date */
  links: RoutineSlotLink[];
  /** every editable slot (both day types, ordered) */
  slots: RoutineSlot[];
};

export async function getRoutineData(dateKey: string): Promise<RoutineData> {
  await guard();
  await ensureSlots();

  const [checks, linkRows, slots] = await Promise.all([
    prisma.routineSlotCheck.findMany({
      where: { slot_date: dbDate(dateKey), done: true },
      select: { slot_key: true },
    }),
    prisma.routineHabitLink.findMany({
      select: { slot_key: true, habit_id: true },
    }),
    loadSlots(),
  ]);

  const habitIds = [...new Set(linkRows.map((l) => l.habit_id))];
  const links: RoutineSlotLink[] = [];

  if (habitIds.length > 0) {
    const habitRows = await prisma.habit.findMany({
      where: { id: { in: habitIds }, archived_at: null },
      include: { logs: true },
    });

    const byId = new Map<string, HabitWithLogs>(
      habitRows.map((row) => [row.id, toHabitWithLogs(row)]),
    );

    for (const row of linkRows) {
      const habit = byId.get(row.habit_id);
      if (!habit) continue;
      links.push({
        slot_key: row.slot_key,
        habit,
        logged: habit.logs.some((log) => log.log_date === dateKey),
      });
    }
  }

  return {
    checkedSlots: checks.map((c) => c.slot_key),
    links,
    slots,
  };
}

export async function toggleSlotCheck(
  slotKey: string,
  slotDate: string,
): Promise<ActionResult> {
  try {
    await guard();
    if (!slotKey || !/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) {
      return { ok: false, error: "Invalid slot or date." };
    }

    const existing = await prisma.routineSlotCheck.findFirst({
      where: { slot_key: slotKey, slot_date: dbDate(slotDate) },
      select: { id: true },
    });

    if (existing) {
      await prisma.routineSlotCheck.delete({ where: { id: existing.id } });
    } else {
      await prisma.routineSlotCheck.create({
        data: { slot_key: slotKey, slot_date: dbDate(slotDate), done: true },
      });
    }

    revalidatePath("/");
    revalidatePath("/routine");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function linkHabitToSlot(
  slotKey: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.routineHabitLink.create({
      data: { slot_key: slotKey, habit_id: habitId },
    });

    revalidatePath("/");
    revalidatePath("/routine");
    return { ok: true, data: undefined };
  } catch (e) {
    if (
      e instanceof Error &&
      e.name === "PrismaClientKnownRequestError" &&
      (e as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "That habit is already part of this routine moment.",
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function unlinkHabitFromSlot(
  slotKey: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.routineHabitLink.deleteMany({
      where: { slot_key: slotKey, habit_id: habitId },
    });

    revalidatePath("/");
    revalidatePath("/routine");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

/** All editable slots (both day types, ordered). */
export async function getRoutineSlots(): Promise<RoutineSlot[]> {
  await guard();
  await ensureSlots();
  return loadSlots();
}

function validateSlot(input: RoutineSlotInput): string | null {
  if (input.dayType !== "weekday" && input.dayType !== "weekend") {
    return "Pick a valid day type.";
  }
  if (!input.title.trim()) return "Give the moment a title.";
  if (input.title.trim().length > 80) return "Keep the title under 80 characters.";
  if (!input.time.trim()) return "Add a time or label.";
  if (input.time.trim().length > 40) return "Keep the time under 40 characters.";
  if (input.doText.length > 400) return "Keep the do note under 400 characters.";
  if (input.dontText.length > 400) return "Keep the don't note under 400 characters.";
  return null;
}

export async function createSlot(
  input: RoutineSlotInput,
): Promise<ActionResult<RoutineSlot>> {
  try {
    await guard();
    const invalid = validateSlot(input);
    if (invalid) return { ok: false, error: invalid };

    const row = await prisma.$transaction(async (tx) => {
      const tail = await tx.routineSlot.findFirst({
        where: { day_type: input.dayType },
        orderBy: { sort_order: "desc" },
        select: { sort_order: true },
      });
      return tx.routineSlot.create({
        data: {
          slot_key: `slot-${crypto.randomUUID()}`,
          day_type: input.dayType,
          time: input.time.trim(),
          title: input.title.trim(),
          do_text: input.doText.trim(),
          dont_text: input.dontText.trim(),
          sort_order: (tail?.sort_order ?? -1) + 1,
        },
      });
    });

    revalidateRoutineViews();
    return { ok: true, data: toRoutineSlot(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function updateSlot(
  id: string,
  input: RoutineSlotInput,
): Promise<ActionResult<RoutineSlot>> {
  try {
    await guard();
    const invalid = validateSlot(input);
    if (invalid) return { ok: false, error: invalid };

    const row = await prisma.routineSlot.update({
      where: { id },
      data: {
        day_type: input.dayType,
        time: input.time.trim(),
        title: input.title.trim(),
        do_text: input.doText.trim(),
        dont_text: input.dontText.trim(),
      },
    });

    revalidateRoutineViews();
    return { ok: true, data: toRoutineSlot(row) };
  } catch (e) {
    if (e instanceof Error && e.name === "PrismaClientKnownRequestError") {
      return { ok: false, error: "Could not update the moment." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function deleteSlot(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction(async (tx) => {
      const slot = await tx.routineSlot.findUnique({
        where: { id },
        select: { slot_key: true },
      });
      if (!slot) return;
      // Clear per-day ticks and habit associations that keyed on this slot.
      await tx.routineSlotCheck.deleteMany({ where: { slot_key: slot.slot_key } });
      await tx.routineHabitLink.deleteMany({ where: { slot_key: slot.slot_key } });
      await tx.routineSlot.delete({ where: { id } });
    });

    revalidateRoutineViews();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

/** Persist a new order (ids in the desired sequence) for the given day type. */
export async function reorderSlots(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.routineSlot.update({ where: { id }, data: { sort_order: index } }),
      ),
    );

    revalidateRoutineViews();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}
