/**
 * Writes vercel.json cron schedule from CRON_TIME (default 0 3 * * * UTC).
 * Runs during `npm run build` so Vercel picks up the env at deploy time.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CRON = "0 3 * * *";

function parseCronTime(raw) {
  const schedule = (raw ?? DEFAULT_CRON).trim() || DEFAULT_CRON;
  const parts = schedule.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(
      `CRON_TIME must be a 5-field cron expression (got ${parts.length} fields): "${schedule}"`,
    );
  }
  return schedule;
}

const schedule = parseCronTime(process.env.CRON_TIME);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vercelJson = {
  crons: [
    {
      path: "/api/cron/keep-alive",
      schedule,
    },
  ],
};

writeFileSync(
  resolve(root, "vercel.json"),
  `${JSON.stringify(vercelJson, null, 2)}\n`,
);
console.log(`vercel.json cron schedule: ${schedule}`);
