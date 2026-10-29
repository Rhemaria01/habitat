import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js loads .env.local at runtime; the Prisma CLI needs it loaded explicitly.
// Prefer values already on process.env (e.g. DIRECT_URL / session URL for migrate).
const local = config({ path: ".env.local" });
const root = config({ path: ".env" });

function firstDefined(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

const databaseUrl = firstDefined(
  process.env.DIRECT_URL,
  process.env.DATABASE_URL,
  local.parsed?.DIRECT_URL,
  local.parsed?.DATABASE_URL,
  root.parsed?.DIRECT_URL,
  root.parsed?.DATABASE_URL,
);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Empty string allows `prisma generate` without a live database.
    url: databaseUrl,
  },
});
