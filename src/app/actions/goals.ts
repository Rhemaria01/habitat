"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  dbDate,
  toGoal,
  toGoalCheckin,
  toHabitWithLogs,
  toSystem,
} from "@/lib/serialize";
import type {
  Goal,
  GoalCheckin,
  GoalInput,
  GoalWithHabits,
  HabitWithLogs,
  System,
} from "@/lib/types";
import type { ActionResult } from "@/app/actions/settings";

async function guard() {
  await requireAuth();
}

function revalidateGoalViews() {
  revalidatePath("/");
  revalidatePath("/goals");
  revalidatePath("/habits");
  revalidatePath("/systems");
}

async function attachHabits(goals: Goal[]): Promise<GoalWithHabits[]> {
  if (goals.length === 0) return [];

  const links = await prisma.goalHabit.findMany({
    where: { goal_id: { in: goals.map((g) => g.id) } },
    select: { goal_id: true, habit_id: true },
  });

  const systemLinks = await prisma.goalSystem.findMany({
    where: { goal_id: { in: goals.map((g) => g.id) } },
    include: { system: true },
  });

  const habitIds = [...new Set(links.map((l) => l.habit_id))];
  const habitRows =
    habitIds.length === 0
      ? []
      : await prisma.habit.findMany({
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

  const systemsByGoal = new Map<string, System[]>();
  for (const link of systemLinks) {
    const list = systemsByGoal.get(link.goal_id) ?? [];
    list.push(toSystem(link.system));
    systemsByGoal.set(link.goal_id, list);
  }

  return goals.map((goal) => ({
    ...goal,
    habits: habitsByGoal.get(goal.id) ?? [],
    systems: systemsByGoal.get(goal.id) ?? [],
  }));
}

export async function listGoals(): Promise<GoalWithHabits[]> {
  await guard();
  const rows = await prisma.goal.findMany({
    where: { status: { not: "archived" }, archived_at: null },
    orderBy: [{ priority: "desc" }, { created_at: "asc" }],
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

function parseDecimal(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function validateGoalInput(input: GoalInput): string | null {
  if (!input.title.trim()) return "Give your goal a title.";
  if (input.title.trim().length > 120) return "Keep the title under 120 characters.";
  if (input.identity_statement && input.identity_statement.length > 200) {
    return "Keep the identity note under 200 characters.";
  }
  if (input.why && input.why.length > 400) return "Keep the why under 400 characters.";
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.color)) return "Pick a valid color.";
  if (input.target_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.target_date)) {
    return "Pick a valid target date.";
  }
  return null;
}

function goalCreateData(input: GoalInput) {
  return {
    title: input.title.trim(),
    identity_statement: input.identity_statement?.trim() || null,
    why: input.why?.trim() || null,
    description: input.description?.trim() || null,
    outcome_definition: input.outcome_definition?.trim() || null,
    metric_type: input.metric_type || null,
    metric_unit: input.metric_unit?.trim() || null,
    baseline_value: parseDecimal(input.baseline_value),
    target_value: parseDecimal(input.target_value),
    current_value: parseDecimal(input.current_value),
    metric_direction: input.metric_direction ?? "increase",
    status: input.status ?? "active",
    priority: input.priority ?? 0,
    start_date: input.start_date ? dbDate(input.start_date) : null,
    color: input.color,
    target_date: input.target_date ? dbDate(input.target_date) : null,
  };
}

export async function createGoal(input: GoalInput): Promise<ActionResult<Goal>> {
  try {
    await guard();
    const invalid = validateGoalInput(input);
    if (invalid) return { ok: false, error: invalid };
    const row = await prisma.goal.create({ data: goalCreateData(input) });
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
      data: goalCreateData(input),
    });
    revalidateGoalViews();
    revalidatePath(`/goals/${id}`);
    return { ok: true, data: toGoal(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update goal." };
  }
}

export async function archiveGoal(id: string): Promise<ActionResult> {
  try {
    await guard();
    await prisma.goal.update({
      where: { id },
      data: { archived_at: new Date(), status: "archived" },
    });
    revalidateGoalViews();
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unauthorized" };
  }
}

export async function linkHabitToGoal(
  goalId: string,
  habitId: string,
): Promise<ActionResult> {
  try {
    await guard();
    await prisma.goalHabit.create({ data: { goal_id: goalId, habit_id: habitId } });
    revalidateGoalViews();
    revalidatePath(`/goals/${goalId}`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not link." };
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

export async function listGoalCheckins(goalId: string): Promise<GoalCheckin[]> {
  await guard();
  const rows = await prisma.goalCheckin.findMany({
    where: { goal_id: goalId },
    orderBy: { checkin_date: "desc" },
  });
  return rows.map(toGoalCheckin);
}

export async function addGoalCheckin(
  goalId: string,
  checkinDate: string,
  value: number | null,
  note: string,
): Promise<ActionResult<GoalCheckin>> {
  try {
    await guard();
    const row = await prisma.goalCheckin.upsert({
      where: {
        goal_id_checkin_date: {
          goal_id: goalId,
          checkin_date: dbDate(checkinDate),
        },
      },
      update: { value, note: note.trim() },
      create: {
        goal_id: goalId,
        checkin_date: dbDate(checkinDate),
        value,
        note: note.trim(),
      },
    });
    revalidatePath(`/goals/${goalId}`);
    return { ok: true, data: toGoalCheckin(row) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save check-in." };
  }
}
