-- Launchpad (LEMS) — one-paste setup for Supabase.
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: it resets these tables to a clean seeded state.

-- ---------- enums ----------
do $$ begin create type item_type as enum ('learn','build'); exception when duplicate_object then null; end $$;
do $$ begin create type task_state as enum ('parked','todo','in_progress','complete'); exception when duplicate_object then null; end $$;

-- ---------- reset ----------
drop table if exists tasks, resources, folders, milestones, profiles cascade;

-- ---------- tables ----------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial text not null,
  focus text,
  score int not null default 3
);

create table folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ordered boolean not null default false
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references folders(id) on delete set null,
  title text not null,
  type item_type not null default 'learn',
  source text,
  tags text[] not null default '{}',
  est_effort_min int
);

create table milestones (
  id text primary key,
  label text not null,
  idx int not null default 0,
  done boolean not null default false,
  current boolean not null default false
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  title text not null,
  type item_type not null default 'learn',
  state task_state not null default 'todo',
  source text,
  deadline timestamptz,
  applied boolean not null default false,
  parked_reason text,
  is_folder boolean not null default false,
  children_done int,
  children_total int,
  effort_min int,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- seed ----------
insert into profiles (id, name, initial, focus, score) values
  ('00000000-0000-0000-0000-000000000001','Nand','N','Ship our brand logo — v1',3),
  ('00000000-0000-0000-0000-000000000002','Aryan','A','Meta Ads test campaign',4),
  ('00000000-0000-0000-0000-000000000003','Rohan','R','SEO audit of our site',3);

insert into folders (id, name, ordered) values
  ('00000000-0000-0000-0000-0000000000a1','Sales',true),
  ('00000000-0000-0000-0000-0000000000a2','SEO',false),
  ('00000000-0000-0000-0000-0000000000a3','Our agency',false);

insert into resources (folder_id, title, type, source, tags, est_effort_min) values
  ('00000000-0000-0000-0000-0000000000a1','Cold email fundamentals — playlist','learn','YouTube','{email,outreach}',120),
  ('00000000-0000-0000-0000-0000000000a1','Send 10 real cold emails','build',null,'{email,practice}',60),
  ('00000000-0000-0000-0000-0000000000a2','SEO foundations','learn','Course','{seo,organic}',240),
  ('00000000-0000-0000-0000-0000000000a2','Keyword research walkthrough','learn','Blog','{seo}',30),
  ('00000000-0000-0000-0000-0000000000a3','Ship our brand logo — v1','build',null,'{brand,launch}',90),
  ('00000000-0000-0000-0000-0000000000a3','Set up our Instagram page','build',null,'{socials,launch}',null);

insert into milestones (id, label, idx, done, current) values
  ('brand','brand',0,true,false),
  ('site','site',1,false,true),
  ('socials','socials',2,false,false),
  ('content','content',3,false,false),
  ('sales','sales team',4,false,false);

-- Nand's active queue
insert into tasks (owner_id, title, type, state, source, deadline, is_folder, children_done, children_total, effort_min, note, parked_reason) values
  ('00000000-0000-0000-0000-000000000001','Ship our brand logo — v1','build','in_progress',null, now() + interval '3 days', false, null, null, 90, 'The real deliverable behind everything you studied this week.', null),
  ('00000000-0000-0000-0000-000000000001','Cold email fundamentals — playlist','learn','todo','YouTube', now() - interval '1 day', false, null, null, null, null, null),
  ('00000000-0000-0000-0000-000000000001','SEO foundations','learn','in_progress',null, null, true, 3, 7, null, null, null),
  ('00000000-0000-0000-0000-000000000001','Advanced Meta Ads course','learn','parked',null, null, false, null, null, null, null, 'Aryan''s on ads');

-- Nand's completed-this-week (drives learned=6 / applied=4)
insert into tasks (owner_id, title, type, state, applied) values
  ('00000000-0000-0000-0000-000000000001','Positioning basics','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','Offer design','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','Landing page copy','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','Brand color theory','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','Lead magnet ideas','learn','complete',false),
  ('00000000-0000-0000-0000-000000000001','Email deliverability','learn','complete',false);

-- Team activity (drives Team dashboard counts)
insert into tasks (owner_id, title, type, state, applied) values
  ('00000000-0000-0000-0000-000000000002','Meta Ads test campaign','build','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','Audience research','learn','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','Creative hooks','learn','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','First test ad set','build','complete',true),
  ('00000000-0000-0000-0000-000000000003','SEO audit of our site','build','in_progress',false),
  ('00000000-0000-0000-0000-000000000003','On-page checklist','build','complete',true);

-- ---------- RLS policies ----------
-- This project auto-enables RLS on new tables. Without policies the anon
-- (publishable) key the app uses in the browser is blocked from all rows.
-- Internal no-auth MVP: allow anon + authenticated full access. Lock this
-- down once real per-user auth exists.
do $$
declare t text;
begin
  foreach t in array array['profiles','folders','resources','milestones','tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_write', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_all_select', t);
    execute format('create policy %I on public.%I for all to anon, authenticated using (true) with check (true)', t||'_all_write', t);
  end loop;
end $$;
