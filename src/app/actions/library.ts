"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { todayKey } from "@/lib/dates";
import {
  COMMUNICATOR_TEMPLATE,
  findPractice,
} from "@/lib/content/communication-books";
import { dbDate, toGoal, toHabit } from "@/lib/serialize";
import type { Goal, Habit } from "@/lib/types";
import type { ActionResult } from "./habits";

async function guard() {
  await requireAuth();
}

const LIBRARY_COLOR = "#A78BFA";

async function nextSortOrder(
  tx: Pick<Prisma.TransactionClient, "habit">,
): Promise<number> {
  const tail = await tx.habit.findFirst({
    where: { archived_at: null },
    orderBy: { sort_order: "desc" },
    select: { sort_order: true },
  });
  return (tail?.sort_order ?? -1) + 1;
}

/** Adopt one book practice as a growing habit (idempotent per active habit). */
export async function adoptPractice(
  practiceKey: string,
): Promise<ActionResult<Habit>> {
  try {
    await guard();
    const practice = findPractice(practiceKey);
    if (!practice) return { ok: false, error: "Unknown practice." };

    const existing = await prisma.habit.findFirst({
      where: { source_key: practice.key, archived_at: null },
      select: { id: true },
    });

    if (existing) {
      return { ok: false, error: "This practice is already one of your habits." };
    }

    const row = await prisma.$transaction(async (tx) => {
      const sort_order = await nextSortOrder(tx);
      return tx.habit.create({
        data: {
          name: practice.text.slice(0, 80),
          kind: "build",
          start_date: dbDate(todayKey()),
          color: LIBRARY_COLOR,
          sort_order,
          frequency: practice.frequency,
          identity_proof: practice.suggestion.slice(0, 200),
          source_key: practice.key,
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/library");
    return { ok: true, data: toHabit(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

/** One click: create the “Better Communicator” goal + its starter practices. */
export async function createCommunicatorGoal(): Promise<ActionResult<Goal>> {
  try {
    await guard();

    const goal = await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          title: COMMUNICATOR_TEMPLATE.title,
          identity_statement: COMMUNICATOR_TEMPLATE.identityStatement,
          why: COMMUNICATOR_TEMPLATE.why,
          color: LIBRARY_COLOR,
        },
      });

      const habitIds: string[] = [];
      for (const key of COMMUNICATOR_TEMPLATE.practiceKeys) {
        const practice = findPractice(key);
        if (!practice) continue;

        const sort_order = await nextSortOrder(tx);
        const habit = await tx.habit.create({
          data: {
            name: practice.text.slice(0, 80),
            kind: "build",
            start_date: dbDate(todayKey()),
            color: LIBRARY_COLOR,
            sort_order,
            frequency: practice.frequency,
            identity_proof: practice.suggestion.slice(0, 200),
            source_key: practice.key,
          },
          select: { id: true },
        });
        habitIds.push(habit.id);
      }

      if (habitIds.length > 0) {
        await tx.goalHabit.createMany({
          data: habitIds.map((habit_id) => ({
            goal_id: goal.id,
            habit_id,
          })),
        });
      }

      return goal;
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/goals");
    revalidatePath("/library");
    return { ok: true, data: toGoal(goal) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

/** Form action wrapper for the one-click template on /library. */
export async function createCommunicatorGoalAction(): Promise<void> {
  const result = await createCommunicatorGoal();
  if (result.ok) redirect(`/goals/${result.data.id}`);
  redirect("/library");
}
