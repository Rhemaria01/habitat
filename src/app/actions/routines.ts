"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toRoutine, toRoutineStep } from "@/lib/serialize";
import type { Routine, RoutineStep, RoutineWithSteps } from "@/lib/types";
import type { ActionResult } from "@/app/actions/habits";

async function guard() {
  await requireAuth();
}

export async function listRoutines(): Promise<RoutineWithSteps[]> {
  await guard();
  const rows = await prisma.routine.findMany({
    where: { status: { not: "archived" } },
    orderBy: { sort_order: "asc" },
    include: { steps: { orderBy: { sort_order: "asc" } } },
  });
  return rows.map((r) => ({
    ...toRoutine(r),
    steps: r.steps.map(toRoutineStep),
  }));
}

export async function getRoutine(id: string): Promise<RoutineWithSteps | null> {
  await guard();
  const row = await prisma.routine.findUnique({
    where: { id },
    include: { steps: { orderBy: { sort_order: "asc" } } },
  });
  if (!row) return null;
  return { ...toRoutine(row), steps: row.steps.map(toRoutineStep) };
}

export type RoutineInput = {
  name: string;
  description?: string | null;
  schedule_kind?: string;
  schedule_weekdays?: number[];
  schedule_custom_days?: number[];
  time_window?: string | null;
  planned_time?: string | null;
  status?: Routine["status"];
};

export async function createRoutine(input: RoutineInput): Promise<ActionResult<Routine>> {
  try {
    await guard();
    if (!input.name.trim()) return { ok: false, error: "Name is required." };
    const tail = await prisma.routine.findFirst({
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    });
    const row = await prisma.routine.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        schedule_kind: input.schedule_kind ?? "daily",
        schedule_weekdays: input.schedule_weekdays ?? [],
        schedule_custom_days: input.schedule_custom_days ?? [],
        time_window: input.time_window ?? null,
        planned_time: input.planned_time?.trim() || null,
        status: input.status ?? "active",
        sort_order: (tail?.sort_order ?? -1) + 1,
      },
    });
    revalidatePath("/routines");
    return { ok: true, data: toRoutine(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create routine." };
  }
}

export async function updateRoutine(
  id: string,
  input: RoutineInput,
): Promise<ActionResult<Routine>> {
  try {
    await guard();
    const row = await prisma.routine.update({
      where: { id },
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        schedule_kind: input.schedule_kind,
        schedule_weekdays: input.schedule_weekdays,
        schedule_custom_days: input.schedule_custom_days,
        time_window: input.time_window,
        planned_time: input.planned_time?.trim() || null,
        status: input.status,
      },
    });
    revalidatePath("/routines");
    revalidatePath(`/routines/${id}`);
    return { ok: true, data: toRoutine(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update." };
  }
}

export type RoutineStepInput = {
  title: string;
  habit_id?: string | null;
  duration_minutes?: number | null;
  is_optional?: boolean;
  notes?: string | null;
};

export async function addRoutineStep(
  routineId: string,
  input: RoutineStepInput,
): Promise<ActionResult<RoutineStep>> {
  try {
    await guard();
    const tail = await prisma.routineStep.findFirst({
      where: { routine_id: routineId },
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    });
    const row = await prisma.routineStep.create({
      data: {
        routine_id: routineId,
        title: input.title.trim(),
        habit_id: input.habit_id || null,
        duration_minutes: input.duration_minutes ?? null,
        is_optional: input.is_optional ?? false,
        notes: input.notes?.trim() || null,
        sort_order: (tail?.sort_order ?? -1) + 1,
      },
    });
    revalidatePath(`/routines/${routineId}`);
    revalidatePath("/routines");
    return { ok: true, data: toRoutineStep(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add step." };
  }
}

export async function updateRoutineStep(
  stepId: string,
  input: RoutineStepInput,
): Promise<ActionResult<RoutineStep>> {
  try {
    await guard();
    const row = await prisma.routineStep.update({
      where: { id: stepId },
      data: {
        title: input.title.trim(),
        habit_id: input.habit_id || null,
        duration_minutes: input.duration_minutes ?? null,
        is_optional: input.is_optional ?? false,
        notes: input.notes?.trim() || null,
      },
    });
    revalidatePath("/routines");
    return { ok: true, data: toRoutineStep(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update step." };
  }
}

export async function deleteRoutineStep(stepId: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.routineStep.delete({ where: { id: stepId } });
    revalidatePath("/routines");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not delete step." };
  }
}

export async function reorderRoutineSteps(
  routineId: string,
  orderedStepIds: string[],
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.$transaction(
      orderedStepIds.map((id, index) =>
        prisma.routineStep.update({
          where: { id, routine_id: routineId },
          data: { sort_order: index },
        }),
      ),
    );
    revalidatePath(`/routines/${routineId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reorder." };
  }
}

export async function archiveRoutine(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.routine.update({ where: { id }, data: { status: "archived" } });
    revalidatePath("/routines");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not archive." };
  }
}
