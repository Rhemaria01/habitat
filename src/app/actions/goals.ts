"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dbDate, toGoal, toHabitWithLogs } from "@/lib/serialize";
import type {
  Goal,
  GoalInput,
  GoalWithHabits,
  HabitWithLogs,
} from "@/lib/types";
import type { ActionResult } from "./habits";

async function guard() {
  await requireAuth();
}

function revalidateGoalViews() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/habits");
  revalidatePath("/routine");
}

async function attachHabits(goals: Goal[]): Promise<GoalWithHabits[]> {
  if (goals.length === 0) return [];

  const links = await prisma.goalHabit.findMany({
    where: { goal_id: { in: goals.map((g) => g.id) } },
    select: { goal_id: true, habit_id: true },
  });

  const habitIds = [...new Set(links.map((l) => l.habit_id))];
  if (habitIds.length === 0) {
    return goals.map((goal) => ({ ...goal, habits: [] }));
  }

  const habitRows = await prisma.habit.findMany({
    where: { id: { in: habitIds }, archived_at: null },
    orderBy: { sort_order: "asc" },
    include: { logs: { orderBy: { log_date: "asc" } } },
  });

  const byId = new Map<string, HabitWithLogs>(
    habitRows.map((row) => [row.id, toHabitWithLogs(row)]),
  );

  const habitsByGoal = new Map<string, HabitWithLogs[]>();
  for (const link of links) {
    const habit = byId.get(link.habit_id);
    if (!habit) continue;
    const list = habitsByGoal.get(link.goal_id) ?? [];
    list.push(habit);
    habitsByGoal.set(link.goal_id, list);
  }

  return goals.map((goal) => ({
    ...goal,
    habits: habitsByGoal.get(goal.id) ?? [],
  }));
}

export async function listGoals(): Promise<GoalWithHabits[]> {
  await guard();

  const rows = await prisma.goal.findMany({
    where: { archived_at: null },
    orderBy: { created_at: "asc" },
  });

  return attachHabits(rows.map(toGoal));
}

export async function getGoal(id: string): Promise<GoalWithHabits | null> {
  await guard();

  const row = await prisma.goal.findUnique({ where: { id } });
  if (!row) return null;

  const [withHabits] = await attachHabits([toGoal(row)]);
  return withHabits ?? null;
}

function validateGoalInput(input: GoalInput): string | null {
  if (!input.title.trim()) return "Give your goal a title.";
  if (input.title.trim().length > 80) return "Keep the title under 80 characters.";
  if (!input.identity_statement.trim()) {
    return "Add the identity this goal stands for, like “I am a healthy person”.";
  }
  if (input.identity_statement.trim().length > 120) {
    return "Keep the identity statement under 120 characters.";
  }
  if (input.why && input.why.length > 400) return "Keep the why under 400 characters.";
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) return "Pick a valid color.";
  if (input.target_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.target_date)) {
    return "Pick a valid target date.";
  }
  return null;
}

export async function createGoal(
  input: GoalInput,
): Promise<ActionResult<Goal>> {
  try {
    await guard();
    const invalid = validateGoalInput(input);
    if (invalid) return { ok: false, error: invalid };

    const row = await prisma.goal.create({
      data: {
        title: input.title.trim(),
        identity_statement: input.identity_statement.trim(),
        why: input.why?.trim() || null,
        color: input.color,
        target_date: input.target_date ? dbDate(input.target_date) : null,
      },
    });

    revalidateGoalViews();
    return { ok: true, data: toGoal(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function updateGoal(
  id: string,
  input: GoalInput,
): Promise<ActionResult<Goal>> {
  try {
    await guard();
    const invalid = validateGoalInput(input);
    if (invalid) return { ok: false, error: invalid };

    const row = await prisma.goal.update({
      where: { id },
      data: {
        title: input.title.trim(),
        identity_statement: input.identity_statement.trim(),
        why: input.why?.trim() || null,
        color: input.color,
        target_date: input.target_date ? dbDate(input.target_date) : null,
      },
    });

    revalidateGoalViews();
    revalidatePath(`/goals/${id}`);
    return { ok: true, data: toGoal(row) };
  } catch (e) {
    if (e instanceof Error && e.name === "PrismaClientKnownRequestError") {
      return { ok: false, error: "Could not update goal." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function archiveGoal(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.goal.update({
      where: { id },
      data: { archived_at: new Date() },
    });

    revalidateGoalViews();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Error &&
    e.name === "PrismaClientKnownRequestError" &&
    (e as { code?: string }).code === "P2002"
  );
}

export async function linkHabitToGoal(
  goalId: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.goalHabit.create({
      data: { goal_id: goalId, habit_id: habitId },
    });

    revalidateGoalViews();
    revalidatePath(`/goals/${goalId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "This task is already on the goal." };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function unlinkHabitFromGoal(
  goalId: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.goalHabit.deleteMany({
      where: { goal_id: goalId, habit_id: habitId },
    });

    revalidateGoalViews();
    revalidatePath(`/goals/${goalId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}
