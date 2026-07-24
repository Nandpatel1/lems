-- Additive migration for per-item comments.
-- (Personal notes reuse the existing tasks.note column — no change needed there.)
-- Run once in Supabase -> SQL Editor. Does NOT touch existing data.

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;
drop policy if exists comments_all_select on comments;
drop policy if exists comments_all_write on comments;
create policy comments_all_select on comments
  for select to anon, authenticated using (true);
create policy comments_all_write on comments
  for all to anon, authenticated using (true) with check (true);
