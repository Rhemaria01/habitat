# Habitat

A personal **goals → systems → habits → routines** workspace with honest daily tracking. Single-user access via `ACCESS_KEY`; data lives in PostgreSQL via **Prisma ORM**.

## Features

- **Today** — scheduled habits, routine steps, recovery hints, weekly adherence (no auto-miss from unlogged days)
- **Habits** — build / reduce / avoid, Four Laws wizard (`/habits/new`), min/standard/stretch, pause/archive
- **Systems** — repeatable processes linked to goals and habits
- **Goals** — outcomes, optional metrics, check-ins, linked systems
- **Routines** — ordered steps with optional habit links
- **Review** — weekly reflection, habit scorecard, history
- **Settings** — timezone, week start, JSON export
- **Onboarding** — skippable setup at `/onboarding`

Removed: feeling guides, practice library, import flow, and the old weekday slot routine UI.

## Database setup

Schema is managed with **Prisma Migrate** (`prisma/schema.prisma` + `prisma/migrations/`).

```bash
cp .env.example .env.local
# DATABASE_URL, ACCESS_KEY, SESSION_SECRET
npm install
npm run db:generate
npm run db:deploy   # apply migrations (also runs during `npm run build`)
npm run dev
```

For local schema changes:

```bash
# edit prisma/schema.prisma, then:
npm run db:migrate -- --name describe_your_change
```

If you already applied the old hand-written SQL files and are baselining onto Prisma Migrate, mark the init migration as applied without re-running it:

```bash
npx prisma migrate resolve --applied 20251029120000_init
```

`npm run db:deploy` (and production builds) prefer `DIRECT_URL`, or automatically use session-mode (`:5432`) when `DATABASE_URL` is a transaction pooler (`pgbouncer=true` / `:6543`).

Open [http://localhost:3001](http://localhost:3001).

## Database keep-alive (optional)

Some hosted Postgres providers pause or sleep databases after inactivity (for example Supabase’s free tier). When deployed on Vercel, you can enable a scheduled cron that runs a lightweight Prisma read so the database stays warm.

In `.env.local` (and Vercel project env):

```bash
DATABASE_KEEP_ALIVE_ENABLED=true
CRON_SECRET=…          # openssl rand -hex 32 — Vercel sends Authorization: Bearer <CRON_SECRET>
CRON_TIME="0 3 * * *"  # optional; UTC cron, default 3:00 daily (written to vercel.json at build)
```

Leave `DATABASE_KEEP_ALIVE_ENABLED` unset (or not `true`/`1`/`yes`) to keep the route disabled (404). `npm run build` runs `scripts/sync-vercel-cron.mjs` so `CRON_TIME` is applied on deploy. Manual check:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3001/api/cron/keep-alive
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test          # vitest — domain schedule/adherence/progress
npm run db:generate
npm run db:migrate    # create + apply migration in development
npm run db:deploy     # apply pending migrations (CI / production)
npm run db:status
```

## Stack

Next.js App Router · TypeScript · Tailwind · Prisma + PostgreSQL · PWA

UI: shadcn/radix base; optional Skiper UI / Vengeance UI registries in `components.json` (use sparingly on workspace pages).

## Log semantics

| Status | Meaning |
|--------|---------|
| completed / partial | Build habit done (partial = minimum or partial standard) |
| maintained / lapse | Reduce/avoid success vs slip |
| missed | User confirmed miss (build) |
| skipped | Intentionally not done — not counted as miss |
| (no row) | Pending — **not** treated as missed |

Adherence rate = successes ÷ (scheduled days − skipped).
