-- Additive migration for in-app notifications (manual nudges).
-- Run once in Supabase -> SQL Editor. Does NOT touch existing data.

do $$ begin
  create type notification_type as enum ('poke','assigned');
exception when duplicate_object then null; end $$;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type notification_type not null default 'poke',
  task_id uuid references tasks(id) on delete set null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
drop policy if exists notifications_all_select on notifications;
drop policy if exists notifications_all_write on notifications;
create policy notifications_all_select on notifications
  for select to anon, authenticated using (true);
create policy notifications_all_write on notifications
  for all to anon, authenticated using (true) with check (true);
