/**
 * Recover from a failed `20251030120000_simplify_habits_only` run (P3009).
 * Does not delete habit rows or habit_logs — only drops unused feature tables
 * and removes the optional habits.system_id link column.
 *
 * Run: npm run db:repair
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

function migrateUrl(raw) {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const isPooler =
      u.searchParams.get("pgbouncer") === "true" || u.port === "6543";
    if (isPooler) {
      u.port = "5432";
      u.searchParams.delete("pgbouncer");
    }
    return u.toString();
  } catch {
    return raw;
  }
}

const url =
  process.env.DIRECT_URL?.trim() ||
  migrateUrl(process.env.DATABASE_URL) ||
  "";

if (!url) {
  console.error("DATABASE_URL (or DIRECT_URL) is required.");
  process.exit(1);
}

const REPAIR_SQL = `
DROP TABLE IF EXISTS "goal_habits";
DROP TABLE IF EXISTS "goal_systems";
DROP TABLE IF EXISTS "goal_checkins";
DROP TABLE IF EXISTS "goals";
ALTER TABLE "habits" DROP CONSTRAINT IF EXISTS "habits_system_id_fkey";
ALTER TABLE "habits" DROP COLUMN IF EXISTS "system_id";
DROP TABLE IF EXISTS "systems";
DROP TABLE IF EXISTS "habit_audits";
DROP TABLE IF EXISTS "reviews";
DROP TABLE IF EXISTS "weekly_reviews";
DROP TABLE IF EXISTS "reflections";
ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "schedule_interval_days" SMALLINT;
`;

async function main() {
  const pool = new pg.Pool({ connectionString: url });
  try {
    console.log("Applying idempotent schema repair (habits + logs kept)…");
    await pool.query(REPAIR_SQL);

    const resolve = spawnSync(
      "npx",
      [
        "prisma",
        "migrate",
        "resolve",
        "--applied",
        "20251030120000_simplify_habits_only",
      ],
      {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      },
    );
    if (resolve.status !== 0) process.exit(resolve.status ?? 1);

    const interval = spawnSync(
      "npx",
      [
        "prisma",
        "migrate",
        "resolve",
        "--applied",
        "20251030140000_habit_schedule_interval",
      ],
      {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      },
    );
    if (interval.status !== 0) process.exit(interval.status ?? 1);

    const deploy = spawnSync("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    });
    process.exit(deploy.status ?? 1);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
