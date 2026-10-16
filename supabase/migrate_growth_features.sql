-- Habitat growth features: goals, routine links, reflections, weekly reviews.
-- Run once in Supabase → SQL Editor after supabase/schema.sql.

-- 1. Habits: Atomic Habits fields + library provenance
alter table habits add column if not exists frequency text not null default 'daily'
  check (frequency in ('daily', 'weekly'));
alter table habits add column if not exists stack_after text;
alter table habits add column if not exists two_minute_version text;
alter table habits add column if not exists identity_proof text;
alter table habits add column if not exists source_key text;

-- 2. Goals (identity + direction per Atomic Habits)
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  identity_statement text not null,
  why text,
  color text not null default '#A78BFA',
  target_date date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goal_habits (
  goal_id uuid not null references goals(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, habit_id)
);

-- 3. Routine: per-day ticks on static slots + habit associations
create table if not exists routine_slot_checks (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null,
  slot_date date not null,
  done boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slot_key, slot_date)
);

create table if not exists routine_habit_links (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null,
  habit_id uuid not null references habits(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (slot_key, habit_id)
);

-- 4. Evening three-line review + weekly review
create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  reflect_date date not null unique,
  went_well text not null default '',
  distracted text not null default '',
  improve_tomorrow text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null unique,
  moved_closer boolean not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- 5. updated_at triggers (set_updated_at() comes from schema.sql)
create trigger goals_updated_at
  before update on goals
  for each row execute function set_updated_at();

create trigger reflections_updated_at
  before update on reflections
  for each row execute function set_updated_at();

-- 6. RLS + permissive policies (personal single-user app, gated by ACCESS_KEY)
alter table goals enable row level security;
alter table goal_habits enable row level security;
alter table routine_slot_checks enable row level security;
alter table routine_habit_links enable row level security;
alter table reflections enable row level security;
alter table weekly_reviews enable row level security;

create policy "personal goals all" on goals
  for all using (true) with check (true);

create policy "personal goal_habits all" on goal_habits
  for all using (true) with check (true);

create policy "personal routine_slot_checks all" on routine_slot_checks
  for all using (true) with check (true);

create policy "personal routine_habit_links all" on routine_habit_links
  for all using (true) with check (true);

create policy "personal reflections all" on reflections
  for all using (true) with check (true);

create policy "personal weekly_reviews all" on weekly_reviews
  for all using (true) with check (true);
