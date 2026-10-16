-- Habitat: make the routine (weekday/weekend arcs) editable and DB-backed.
-- Run once in Supabase → SQL Editor after supabase/migrate_growth_features.sql.
-- The static content in src/lib/content/routine.ts is moved into this table;
-- slot_key stays the stable identifier used by routine_slot_checks and
-- routine_habit_links, so ticks and habit associations are preserved.

create table if not exists routine_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  day_type text not null check (day_type in ('weekday', 'weekend')),
  time text not null,
  title text not null,
  do_text text not null default '',
  dont_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routine_slots_day_order_idx
  on routine_slots (day_type, sort_order);

-- set_updated_at() comes from supabase/schema.sql
drop trigger if exists routine_slots_updated_at on routine_slots;
create trigger routine_slots_updated_at
  before update on routine_slots
  for each row execute function set_updated_at();

alter table routine_slots enable row level security;

create policy "personal routine_slots all" on routine_slots
  for all using (true) with check (true);

-- Seed the current weekday arc (idempotent).
insert into routine_slots (slot_key, day_type, time, title, do_text, dont_text, sort_order) values
  ('weekday-wake', 'weekday', '8:00 AM', 'When you wake up',
   'Get out of bed, drink water, and decide the one most important thing you want to accomplish today.',
   'Start scrolling in bed or immediately fill your mind with messages and other people''s activities.', 0),
  ('weekday-commute', 'weekday', '9:00–9:15 AM', 'Getting ready and leaving',
   'Get ready without rushing. Use your commute to think, listen to something useful, or simply relax.',
   'Consume random reels or jump between several videos just because you have spare time.', 1),
  ('weekday-morning-work', 'weekday', '10:00 AM–1:00 PM', 'Office work',
   'Pick one important work task. Focus for 30–45 minutes before switching tasks when practical. Write down distracting ideas to revisit later.',
   'Keep checking notifications, multitask unnecessarily, or abandon difficult work to do something more exciting.', 2),
  ('weekday-lunch', 'weekday', '1:00–1:30 PM', 'Lunch',
   'Eat properly. Give yourself a short break without constantly switching between your phone, messages, and videos.',
   'Turn every break into a long scrolling session that makes returning to work harder.', 3),
  ('weekday-afternoon-work', 'weekday', '2:00–5:00 PM', 'Afternoon work',
   'Finish one meaningful piece of work before starting unnecessary new tasks. Use your communication skills to explain ideas and collaborate.',
   'Confuse being busy with making progress, or start a new project whenever your current task becomes boring.', 4),
  ('weekday-snack', 'weekday', '5:00 PM', 'Snack or afternoon break',
   'Take a proper break, have your planned snack when needed, and move around for a few minutes.',
   'Use sugar, endless scrolling, or constant entertainment as your automatic response to every dip in energy.', 5),
  ('weekday-home', 'weekday', '8:00 PM', 'Returning home',
   'Give yourself a small transition period. Change clothes, relax, and then begin your evening routine.',
   'Lie down with your phone and accidentally lose the whole evening.', 6),
  ('weekday-cooking', 'weekday', '8:30–9:30 PM', 'Cooking and dinner',
   'Cook and eat your usual meal. Treat cooking as a natural break from work and screens.',
   'Keep checking your phone between every small cooking task or postpone dinner because you''re distracted.', 7),
  ('weekday-walk', 'weekday', 'After dinner', 'Daily walk',
   'Continue your walking habit and work toward your usual 10,000-step target on weekdays. If you are tired, a shorter walk is better than abandoning the habit entirely.',
   'Sit scrolling for an hour and then decide it''s too late to walk.', 8),
  ('weekday-before-bed', 'weekday', 'Before bed', 'Make your bed, write, chant and read',
   'Keep these existing habits. Write a few lines about your day, chant without rushing, and read a little. Spend five minutes without your phone.',
   'Try to do everything perfectly, turn your routine into a long checklist, or replace reading with reels.', 9)
on conflict (slot_key) do nothing;

-- Seed the current weekend arc (idempotent).
insert into routine_slots (slot_key, day_type, time, title, do_text, dont_text, sort_order) values
  ('weekend-wake', 'weekend', '9–10 AM', 'Waking up',
   'Wake around your usual weekend window of 9–10 AM.',
   'Let one late night turn into sleeping away half the day.', 0),
  ('weekend-meals', 'weekend', 'Breakfast & lunch', 'Meals',
   'Eat at reasonably consistent times.',
   'Delay both meals until the afternoon without a reason.', 1),
  ('weekend-rest', 'weekend', 'After lunch', 'Rest',
   'Take a short rest if needed.',
   'Automatically sleep for hours every weekend.', 2),
  ('weekend-project', 'weekend', 'Daytime', 'Personal projects',
   'Give one meaningful goal 30–60 minutes.',
   'Spend the whole day planning several projects without progressing on any.', 3),
  ('weekend-friends', 'weekend', 'Evening', 'Meeting friends',
   'Enjoy your social time fully.',
   'Feel guilty for relaxing or constantly check your phone while with friends.', 4),
  ('weekend-walk', 'weekend', 'Anytime', 'Walking',
   'Fit in a walk, even if you don''t reach 10,000 steps.',
   'Treat a missed target as a failed day.', 5),
  ('weekend-bedtime', 'weekend', 'Night', 'Bedtime',
   'Try to avoid a large weekday–weekend sleep schedule difference.',
   'Stay up late simply because there is always another video to watch.', 6)
on conflict (slot_key) do nothing;
