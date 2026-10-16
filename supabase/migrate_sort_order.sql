-- Run this once if habits table already exists without sort_order
alter table habits
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select id, row_number() over (order by created_at asc) - 1 as rn
  from habits
)
update habits h
set sort_order = ranked.rn
from ranked
where h.id = ranked.id;
