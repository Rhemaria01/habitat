"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { eachDayKey, todayKey } from "@/lib/dates";
import { dbDate, toHabit, toHabitLog, toHabitWithLogs } from "@/lib/serialize";
import type {
  Habit,
  HabitInput,
  HabitKind,
  HabitLog,
  HabitWithLogs,
  LogStatus,
} from "@/lib/types";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function guard() {
  await requireAuth();
}

export async function listHabits(): Promise<HabitWithLogs[]> {
  await guard();

  const rows = await prisma.habit.findMany({
    where: { archived_at: null },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
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

function validateInput(input: HabitInput): string | null {
  if (!input.name.trim()) return "Give your habit a name.";
  if (input.name.trim().length > 80) return "Keep the name under 80 characters.";
  if (input.kind !== "build" && input.kind !== "quit") return "Pick a habit type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.start_date)) return "Pick a valid start date.";
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) return "Pick a valid color.";
  if (input.frequency && input.frequency !== "daily" && input.frequency !== "weekly") {
    return "Pick a valid frequency.";
  }
  for (const [label, value] of [
    ["stack cue", input.stack_after],
    ["2-minute version", input.two_minute_version],
    ["identity proof", input.identity_proof],
  ] as const) {
    if (value && value.length > 200) return `Keep the ${label} under 200 characters.`;
  }

  const today = todayKey();

  if (input.relapse_dates?.length) {
    if (input.kind !== "quit") {
      return "Relapse dates are only for quit habits.";
    }
    for (const date of input.relapse_dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return "Pick valid relapse dates.";
      }
      if (date < input.start_date || date > today) {
        return "Relapse dates must fall between quit date and today.";
      }
    }
  }

  if (input.missed_dates) {
    if (input.kind !== "build") {
      return "Missed dates are only for grow habits.";
    }
    for (const date of input.missed_dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return "Pick valid missed dates.";
      }
      if (date < input.start_date || date > today) {
        return "Missed dates must fall between start date and today.";
      }
    }
  }

  return null;
}

function logRowsFor(
  habitId: string,
  input: HabitInput,
): { habit_id: string; log_date: Date; status: LogStatus }[] {
  if (input.kind === "quit") {
    const relapseDates = [...new Set(input.relapse_dates ?? [])];
    return relapseDates.map((log_date) => ({
      habit_id: habitId,
      log_date: dbDate(log_date),
      status: "relapse",
    }));
  }
  if (input.missed_dates) {
    const missed = new Set(input.missed_dates);
    return eachDayKey(input.start_date, todayKey())
      .filter((date) => !missed.has(date))
      .map((log_date) => ({
        habit_id: habitId,
        log_date: dbDate(log_date),
        status: "done",
      }));
  }
  return [];
}

export async function createHabit(
  input: HabitInput,
): Promise<ActionResult<Habit>> {
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
      const nextOrder = (tail?.sort_order ?? -1) + 1;

      const created = await tx.habit.create({
        data: {
          name: input.name.trim(),
          kind: input.kind,
          start_date: dbDate(input.start_date),
          color: input.color,
          sort_order: nextOrder,
          frequency: input.frequency ?? "daily",
          stack_after: input.stack_after?.trim() || null,
          two_minute_version: input.two_minute_version?.trim() || null,
          identity_proof: input.identity_proof?.trim() || null,
        },
      });

      if (input.goal_id) {
        await tx.goalHabit.create({
          data: { goal_id: input.goal_id, habit_id: created.id },
        });
      }

      const logs = logRowsFor(created.id, input);
      if (logs.length > 0) {
        await tx.habitLog.createMany({ data: logs });
      }

      return created;
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/routine");
    return { ok: true, data: toHabit(habit) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
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
      data: {
        name: input.name.trim(),
        kind: input.kind,
        start_date: dbDate(input.start_date),
        color: input.color,
        frequency: input.frequency ?? "daily",
        stack_after: input.stack_after?.trim() || null,
        two_minute_version: input.two_minute_version?.trim() || null,
        identity_proof: input.identity_proof?.trim() || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath(`/habits/${id}`);
    revalidatePath("/routine");
    revalidatePath("/goals");
    return { ok: true, data: toHabit(row) };
  } catch (e) {
    if (e instanceof Error && e.name === "PrismaClientKnownRequestError") {
      return { ok: false, error: "Could not update habit." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habit.deleteMany({ where: { id } });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/routine");
    revalidatePath("/goals");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function reorderHabits(
  orderedIds: string[],
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.habit.update({ where: { id }, data: { sort_order: index } }),
      ),
    );

    revalidatePath("/");
    revalidatePath("/habits");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function toggleHabitDay(
  habitId: string,
  kind: HabitKind,
  logDate: string,
  currentlyLogged: boolean,
): Promise<ActionResult<HabitLog | null>> {
  try {
    await guard();
    const status: LogStatus = kind === "build" ? "done" : "relapse";

    if (currentlyLogged) {
      await prisma.habitLog.deleteMany({
        where: { habit_id: habitId, log_date: dbDate(logDate) },
      });
      revalidatePath("/");
      revalidatePath("/habits");
      revalidatePath(`/habits/${habitId}`);
      revalidatePath("/routine");
      revalidatePath("/goals");
      return { ok: true, data: null };
    }

    const row = await prisma.habitLog.upsert({
      where: {
        habit_id_log_date: { habit_id: habitId, log_date: dbDate(logDate) },
      },
      update: { status },
      create: { habit_id: habitId, log_date: dbDate(logDate), status },
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath(`/habits/${habitId}`);
    revalidatePath("/routine");
    revalidatePath("/goals");
    return { ok: true, data: toHabitLog(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}
