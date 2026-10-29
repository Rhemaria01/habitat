/**
 * Idempotent seed for personal goals, habits, and weekday routine.
 * Run: npm run db:seed-personal
 */
import { config } from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  PERSONAL_GOALS,
  PERSONAL_HABITS,
  PERSONAL_WEEKDAY_ROUTINE,
} from "../src/lib/content/personal-data.ts";

config({ path: ".env.local" });
config({ path: ".env" });

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function legacyKind(behavior: string): "build" | "quit" {
  return behavior === "build" ? "build" : "quit";
}

async function main() {
  const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL (or DIRECT_URL) is required.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const startDate = todayKey();
  const habitIds = new Map<string, string>();

  try {
    for (const [index, h] of PERSONAL_HABITS.entries()) {
      const existing = await prisma.habit.findFirst({
        where: { source_key: h.source_key },
      });
      const data = {
        name: h.name,
        kind: legacyKind(h.behavior_type),
        behavior_type: h.behavior_type,
        category: h.category,
        start_date: new Date(`${startDate}T00:00:00.000Z`),
        color: h.color,
        frequency: h.frequency,
        schedule_kind: h.schedule_kind,
        schedule_weekdays: h.schedule_weekdays ?? [],
        planned_time: h.planned_time ?? null,
        time_window: h.time_window ?? null,
        tracking_type: h.tracking_type,
        tracking_unit: h.tracking_unit ?? null,
        stack_after: h.stack_after ?? null,
        two_minute_version: h.two_minute_version ?? null,
        minimum_version: h.two_minute_version ?? null,
        standard_version: h.name,
        identity_proof: h.identity_proof ?? null,
        is_priority: h.is_priority ?? false,
        source_key: h.source_key,
        sort_order: index,
        status: "active",
      };

      const row = existing
        ? await prisma.habit.update({ where: { id: existing.id }, data })
        : await prisma.habit.create({ data });
      habitIds.set(h.source_key, row.id);
    }

    for (const g of PERSONAL_GOALS) {
      let goal = await prisma.goal.findFirst({
        where: { title: g.title },
      });
      if (!goal) {
        goal = await prisma.goal.create({
          data: {
            title: g.title,
            identity_statement: g.identity_statement,
            why: g.why,
            color: g.color,
            status: "active",
          },
        });
      } else {
        goal = await prisma.goal.update({
          where: { id: goal.id },
          data: {
            identity_statement: g.identity_statement,
            why: g.why,
            color: g.color,
          },
        });
      }

      for (const key of g.habit_source_keys) {
        const habitId = habitIds.get(key);
        if (!habitId) continue;
        await prisma.goalHabit.upsert({
          where: {
            goal_id_habit_id: { goal_id: goal.id, habit_id: habitId },
          },
          update: {},
          create: { goal_id: goal.id, habit_id: habitId },
        });
      }
    }

    const routineMeta = PERSONAL_WEEKDAY_ROUTINE;
    let routine = await prisma.routine.findFirst({
      where: { name: routineMeta.name },
    });
    if (!routine) {
      routine = await prisma.routine.create({
        data: {
          name: routineMeta.name,
          description: routineMeta.description,
          schedule_kind: routineMeta.schedule_kind,
          schedule_weekdays: routineMeta.schedule_weekdays,
          status: "active",
          sort_order: 0,
        },
      });
    } else {
      routine = await prisma.routine.update({
        where: { id: routine.id },
        data: {
          description: routineMeta.description,
          schedule_kind: routineMeta.schedule_kind,
          schedule_weekdays: routineMeta.schedule_weekdays,
        },
      });
    }

    const existingSteps = await prisma.routineStep.findMany({
      where: { routine_id: routine.id },
      orderBy: { sort_order: "asc" },
    });

    for (const [index, step] of routineMeta.steps.entries()) {
      const habitId = step.habit_source_key
        ? habitIds.get(step.habit_source_key) ?? null
        : null;
      const existing = existingSteps[index];
      if (existing) {
        await prisma.routineStep.update({
          where: { id: existing.id },
          data: {
            title: step.title,
            habit_id: habitId,
            sort_order: index,
          },
        });
      } else {
        await prisma.routineStep.create({
          data: {
            routine_id: routine.id,
            title: step.title,
            habit_id: habitId,
            sort_order: index,
          },
        });
      }
    }

    console.log(
      `Seeded ${PERSONAL_HABITS.length} habits, ${PERSONAL_GOALS.length} goals, routine "${routineMeta.name}".`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
