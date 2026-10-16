-- Habitat habit tracker schema (personal single-user app)

create type habit_kind as enum ('build', 'quit');

create table habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind habit_kind not null,
  start_date date not null,
  color text not null default '#7C9A82',
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  -- build: day completed; quit: day relapsed (breaks streak)
  status text not null check (status in ('done', 'relapse')),
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index habit_logs_habit_date_idx on habit_logs (habit_id, log_date);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger habits_updated_at
  before update on habits
  for each row execute function set_updated_at();

alter table habits enable row level security;
alter table habit_logs enable row level security;

-- Permissive policies for personal single-user app (gated by app ACCESS_KEY)
create policy "personal habits all" on habits
  for all using (true) with check (true);

create policy "personal habit_logs all" on habit_logs
  for all using (true) with check (true);
