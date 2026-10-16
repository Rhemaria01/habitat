import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js loads .env.local at runtime; the Prisma CLI needs it loaded explicitly.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // env() throws when unset; allow `prisma generate` to run without a DB.
    url: process.env.DATABASE_URL ? env("DATABASE_URL") : "",
  },
});
