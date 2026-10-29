/**
 * Runs `prisma migrate deploy`, preferring DIRECT_URL.
 * If only a transaction-pooler DATABASE_URL is set (pgbouncer / :6543),
 * rewrites to session mode (:5432) so Migrate can acquire advisory locks.
 */
import { spawnSync } from "node:child_process";
import { config } from "dotenv";

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
  console.error("DATABASE_URL (or DIRECT_URL) is required for migrate deploy");
  process.exit(1);
}

process.env.DIRECT_URL = url;
process.env.DATABASE_URL = url;

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
