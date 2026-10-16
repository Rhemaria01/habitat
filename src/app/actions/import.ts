"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { eachDayKey, todayKey } from "@/lib/dates";
import { parseImportJson, type ImportDocument } from "@/lib/import-export";
import { dbDate } from "@/lib/serialize";
import type { ActionResult } from "./habits";

export type ImportSummary = {
  habitsCreated: number;
  goalsCreated: number;
  habitsSkipped: number;
  goalsSkipped: number;
  tasksLinked: number;
  warnings: string[];
};

type Tx = Pick<Prisma.TransactionClient, "habit" | "goal" | "goalHabit" | "habitLog">;

async function seedLogs(
  tx: Tx,
  habitId: string,
  doc: ImportDocument,
  name: string,
): Promise<void> {
  const habit = doc.habits.find((h) => h.name === name);
  if (!habit) return;

  const rows: { habit_id: string; log_date: Date; status: "done" | "relapse" }[] =
    [];

  if (habit.kind === "quit") {
    for (const log_date of habit.relapse_dates ?? []) {
      rows.push({ habit_id: habitId, log_date: dbDate(log_date), status: "relapse" });
    }
  } else if (habit.missed_dates) {
    const missed = new Set(habit.missed_dates);
    for (const date of eachDayKey(habit.start_date, todayKey())) {
      if (!missed.has(date)) {
        rows.push({ habit_id: habitId, log_date: dbDate(date), status: "done" });
      }
    }
  }

  if (rows.length > 0) {
    await tx.habitLog.createMany({ data: rows });
  }
}

/**
 * Import a JSON document (the raw text an AI produced) into habits & goals.
 * Idempotent-ish: entries whose name/title already exists are skipped.
 */
export async function importHabitsGoals(
  raw: string,
): Promise<ActionResult<ImportSummary>> {
  try {
    await requireAuth();

    const parsed = parseImportJson(raw);
    if (!parsed.ok) {
      return { ok: false, error: parsed.errors.join(" ") };
    }
    const doc = parsed.doc;

    const summary = await prisma.$transaction(async (tx) => {
      // Existing rows (for de-dup + goal→habit linking by name).
      const existingHabits = await tx.habit.findMany({
        where: { archived_at: null },
        select: { id: true, name: true },
      });
      const existingGoals = await tx.goal.findMany({
        where: { archived_at: null },
        select: { id: true, title: true },
      });

      const habitIdByName = new Map<string, string>(
        existingHabits.map((h) => [h.name.trim().toLowerCase(), h.id]),
      );
      const goalIdByTitle = new Map<string, string>(
        existingGoals.map((g) => [g.title.trim().toLowerCase(), g.id]),
      );

      const maxRow = await tx.habit.findFirst({
        where: { archived_at: null },
        orderBy: { sort_order: "desc" },
        select: { sort_order: true },
      });
      let sortOrder = (maxRow?.sort_order ?? -1) + 1;

      const result: ImportSummary = {
        habitsCreated: 0,
        goalsCreated: 0,
        habitsSkipped: 0,
        goalsSkipped: 0,
        tasksLinked: 0,
        warnings: parsed.warnings,
      };

      // 1. Goals first (habits reference them by title when linking tasks).
      for (const goal of doc.goals) {
        if (goalIdByTitle.has(goal.title.toLowerCase())) {
          result.goalsSkipped += 1;
          continue;
        }
        const created = await tx.goal.create({
          data: {
            title: goal.title,
            identity_statement: goal.identity_statement,
            why: goal.why ?? null,
            color: goal.color,
            target_date: goal.target_date ? dbDate(goal.target_date) : null,
          },
          select: { id: true },
        });
        goalIdByTitle.set(goal.title.toLowerCase(), created.id);
        result.goalsCreated += 1;
      }

      // 2. Habits, remembering which goals each belongs to.
      const goalNamesByHabit = new Map<string, string[]>();
      for (const goal of doc.goals) {
        const goalId = goalIdByTitle.get(goal.title.toLowerCase());
        if (!goalId) continue;
        for (const habitName of goal.habit_names ?? []) {
          const key = habitName.toLowerCase();
          const list = goalNamesByHabit.get(key) ?? [];
          if (!list.includes(goalId)) list.push(goalId);
          goalNamesByHabit.set(key, list);
        }
      }

      for (const habit of doc.habits) {
        const key = habit.name.toLowerCase();
        let habitId = habitIdByName.get(key);
        if (habitId) {
          result.habitsSkipped += 1;
        } else {
          const created = await tx.habit.create({
            data: {
              name: habit.name,
              kind: habit.kind,
              start_date: dbDate(habit.start_date),
              color: habit.color,
              sort_order: sortOrder++,
              frequency: habit.frequency,
              stack_after: habit.stack_after ?? null,
              two_minute_version: habit.two_minute_version ?? null,
              identity_proof: habit.identity_proof ?? null,
            },
            select: { id: true },
          });
          habitId = created.id;
          habitIdByName.set(key, habitId);
          await seedLogs(tx, habitId, doc, habit.name);
          result.habitsCreated += 1;
        }

        // 3. Link this habit as a task under any goals that referenced it.
        const linkedHabits = new Set<string>();
        for (const goalId of goalNamesByHabit.get(key) ?? []) {
          if (linkedHabits.has(goalId)) continue;
          linkedHabits.add(goalId);
          try {
            await tx.goalHabit.create({
              data: { goal_id: goalId, habit_id: habitId },
            });
            result.tasksLinked += 1;
          } catch {
            // Unique violation = already linked — not a failure for import purposes.
          }
        }
      }

      return result;
    });

    revalidatePath("/");
    revalidatePath("/habits");
    revalidatePath("/goals");
    revalidatePath("/routine");

    return { ok: true, data: summary };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unauthorized",
    };
  }
}
