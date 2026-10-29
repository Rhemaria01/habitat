"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toGoal, toHabit, toSystem } from "@/lib/serialize";
import type { System, SystemWithRelations } from "@/lib/types";
import type { ActionResult } from "@/app/actions/habits";

async function guard() {
  await requireAuth();
}

export type SystemInput = {
  name: string;
  description?: string | null;
  purpose?: string | null;
  cadence?: string | null;
  status?: System["status"];
  working_well?: string;
  causing_friction?: string;
  goal_ids?: string[];
};

export async function listSystems(): Promise<SystemWithRelations[]> {
  await guard();
  const rows = await prisma.system.findMany({
    where: { status: { not: "archived" } },
    orderBy: [{ updated_at: "desc" }],
    include: {
      goal_systems: { include: { goal: true } },
      habits: { where: { status: { not: "archived" } } },
    },
  });
  return rows.map((row) => ({
    ...toSystem(row),
    goals: row.goal_systems.map((gs) => toGoal(gs.goal)),
    habits: row.habits.map(toHabit),
  }));
}

export async function getSystem(id: string): Promise<SystemWithRelations | null> {
  await guard();
  const row = await prisma.system.findUnique({
    where: { id },
    include: {
      goal_systems: { include: { goal: true } },
      habits: { where: { status: { not: "archived" } } },
    },
  });
  if (!row) return null;
  return {
    ...toSystem(row),
    goals: row.goal_systems.map((gs) => toGoal(gs.goal)),
    habits: row.habits.map(toHabit),
  };
}

export async function createSystem(input: SystemInput): Promise<ActionResult<System>> {
  try {
    await guard();
    if (!input.name.trim()) return { ok: false, error: "Name is required." };
    const system = await prisma.$transaction(async (tx) => {
      const created = await tx.system.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || null,
          purpose: input.purpose?.trim() || null,
          cadence: input.cadence?.trim() || null,
          status: input.status ?? "active",
          working_well: input.working_well?.trim() ?? "",
          causing_friction: input.causing_friction?.trim() ?? "",
        },
      });
      if (input.goal_ids?.length) {
        await tx.goalSystem.createMany({
          data: input.goal_ids.map((goal_id) => ({ goal_id, system_id: created.id })),
          skipDuplicates: true,
        });
      }
      return created;
    });
    revalidatePath("/systems");
    return { ok: true, data: toSystem(system) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not create system." };
  }
}

export async function updateSystem(
  id: string,
  input: SystemInput,
): Promise<ActionResult<System>> {
  try {
    await guard();
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.system.update({
        where: { id },
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || null,
          purpose: input.purpose?.trim() || null,
          cadence: input.cadence?.trim() || null,
          status: input.status,
          working_well: input.working_well?.trim(),
          causing_friction: input.causing_friction?.trim(),
        },
      });
      if (input.goal_ids) {
        await tx.goalSystem.deleteMany({ where: { system_id: id } });
        if (input.goal_ids.length) {
          await tx.goalSystem.createMany({
            data: input.goal_ids.map((goal_id) => ({ goal_id, system_id: id })),
          });
        }
      }
      return updated;
    });
    revalidatePath("/systems");
    revalidatePath(`/systems/${id}`);
    return { ok: true, data: toSystem(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update system." };
  }
}

export async function archiveSystem(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.system.update({ where: { id }, data: { status: "archived" } });
    revalidatePath("/systems");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not archive." };
  }
}

export async function linkHabitToSystem(
  systemId: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.habit.update({
      where: { id: habitId },
      data: { system_id: systemId },
    });
    revalidatePath("/systems");
    revalidatePath("/habits");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not link habit." };
  }
}
