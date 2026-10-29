# Habitat

A personal growth app — PWA-ready habit tracking with heatmaps and streaks, plus goals, a do's & don'ts routine, feeling guides, and a communication practice library. Everything sits behind a single-person lock.

Track habits you’re **growing**, or days since you **quit** something — including backdated start/quit dates. Turn outcomes into **goals with an identity** ("I am a healthy person") whose tasks are the habits that prove it.

## Features

- Single-person login via a private `ACCESS_KEY` (server-checked) — every route except `/login` is locked
- Modern "Dusk" theme (dark-first + light variant, persisted in a cookie), sidebar on desktop / bottom tab bar on mobile
- Build good habits or quit bad ones — daily or weekly frequency, habit-stacking cues, 2-minute versions
- Calendar month view + GitHub-style year heatmap, tap-to-toggle days
- Goals: identity statements, linked habit-tasks, weekly progress rings, identity votes, Atomic Habits Four Laws helper
- Routine timeline (weekday/weekend do's & don'ts) with per-slot ticks and good/bad habit association
- Feeling guides ("what to do with what you feel"), weekly review
- Communication practice library researched from seven books — adopt any practice as a habit, one click
- Import & export: copy a JSON prompt template into any gen-AI (ChatGPT / Claude / Gemini), paste its JSON back to bulk-create habits & goals; export your data as JSON anytime
- Optimistic create / update / delete / check-in
- Installable PWA

## Your setup steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql).  
   If you already created the tables earlier, also run [`supabase/migrate_sort_order.sql`](supabase/migrate_sort_order.sql) and [`supabase/migrate_growth_features.sql`](supabase/migrate_growth_features.sql) once (the latter adds goals, routine links, weekly reviews, and the new habit columns).
3. In **Project Settings → Database**, copy the **URI connection string** (host `xxx.supabase.co`, port `5432`, password auth). Prisma talks to Postgres directly — no anon/publishable key needed.
4. In this repo, create `.env.local`:

```bash
cp .env.example .env.local
```

5. Fill in:

```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@xxx.supabase.co:5432/postgres?sslmode=require
ACCESS_KEY=your-private-passphrase   # never commit this; .env.local only
SESSION_SECRET= # run: openssl rand -hex 32
```

6. Install and run:

```bash
npm install
npm run db:generate   # generate the Prisma client from prisma/schema.prisma
npm run dev
```

7. Open [http://localhost:3001](http://localhost:3001), sign in with your `ACCESS_KEY`, plant a habit (try a past quit date), and tap the heatmap.

### Optional deploy

1. Push to GitHub and import the repo in [Vercel](https://vercel.com).
2. Add the same env vars in the Vercel project **Environment Variables** tab (not Framework Settings): `DATABASE_URL`, `ACCESS_KEY`, and `SESSION_SECRET`. `ACCESS_KEY` must equal the passphrase you use to sign in; `DATABASE_URL` should use the pooled connection string (add `?pgbouncer=true&sslmode=require` if using the transaction-mode pooler).
3. Leave **Framework Settings** at defaults (`npm run build`, etc.) — the repo’s build script runs `prisma generate` before `next build` because the Prisma client is generated into `src/generated/` and is not committed.
4. Deploy, then install from your phone browser (Share → Add to Home Screen / Install app).

## Habit types

| Kind | Daily log meaning | Streak |
|------|-------------------|--------|
| **grow** (`build`) | Mark days you kept the habit | Consecutive `done` days |
| **quit** | Mark relapse days only | Days clean since start (or since last relapse) |

“Days since” always counts from the habit’s start/quit date to today.

## Scripts

```bash
npm run dev          # local development (PWA SW disabled)
npm run build        # production build with webpack (generates service worker)
npm run start        # serve production build
npm run lint
npm run db:generate  # regenerate Prisma client (src/generated/prisma)
npm run db:pull      # introspect the live Supabase schema into prisma/schema.prisma
```

## Stack

Next.js App Router · TypeScript · Tailwind CSS · Prisma (`@prisma/client` + `@prisma/adapter-pg` over Supabase Postgres) · `@ducanh2912/next-pwa`
