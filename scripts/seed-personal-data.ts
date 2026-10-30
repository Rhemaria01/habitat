/**
 * Idempotent seed for personal habits.
 * Run: npm run db:seed-personal
 */
import { config } from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  PERSONAL_HABITS,
  PERSONAL_HABIT_SOURCE_KEYS_RETIRED,
} from "../src/lib/content/personal-data";

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

  try {
    if (PERSONAL_HABIT_SOURCE_KEYS_RETIRED.length > 0) {
      await prisma.habit.updateMany({
        where: { source_key: { in: [...PERSONAL_HABIT_SOURCE_KEYS_RETIRED] } },
        data: { status: "archived", archived_at: new Date() },
      });
    }

    for (const [index, h] of PERSONAL_HABITS.entries()) {
      const habitStart = h.start_date ?? startDate;
      const existing = await prisma.habit.findFirst({
        where: { source_key: h.source_key },
      });
      const data = {
        name: h.name,
        kind: legacyKind(h.behavior_type),
        behavior_type: h.behavior_type,
        category: h.category,
        start_date: new Date(`${habitStart}T00:00:00.000Z`),
        color: h.color,
        icon: h.icon ?? null,
        frequency: h.frequency,
        schedule_kind: h.schedule_kind,
        schedule_weekdays: h.schedule_weekdays ?? [],
        schedule_custom_days: h.schedule_custom_days ?? [],
        schedule_days_per_week: h.schedule_days_per_week ?? null,
        schedule_interval_days: h.schedule_interval_days ?? null,
        planned_time: h.planned_time ?? null,
        cue_time: h.cue_time ?? null,
        estimated_duration_minutes: h.estimated_duration_minutes ?? null,
        time_window: h.time_window ?? null,
        tracking_type: h.tracking_type,
        tracking_unit: h.tracking_unit ?? null,
        tracking_target: h.tracking_target ?? null,
        stack_after: h.stack_after ?? null,
        two_minute_version: h.two_minute_version ?? null,
        minimum_version: h.two_minute_version ?? null,
        standard_version: h.name,
        identity_proof: h.identity_proof ?? null,
        is_priority: h.is_priority ?? false,
        source_key: h.source_key,
        sort_order: index,
        status: "active",
        archived_at: null,
      };

      if (existing) {
        await prisma.habit.update({ where: { id: existing.id }, data });
      } else {
        await prisma.habit.create({ data });
      }
    }

    console.log(`Seeded ${PERSONAL_HABITS.length} habits.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
