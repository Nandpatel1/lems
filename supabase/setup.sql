-- Launchpad (LEMS) — one-paste setup for Supabase.
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: it resets these tables to a clean seeded state.
--
-- This file is the authoritative schema for a fresh database. It already
-- includes everything the incremental migrations in this folder add, so a
-- rebuilt database comes up with exactly the guarantees a migrated one has.
-- If you change the schema, change it here too.

-- ---------- enums ----------
do $$ begin create type item_type as enum ('learn','build','both'); exception when duplicate_object then null; end $$;
do $$ begin create type task_state as enum ('parked','todo','in_progress','complete'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('poke','assigned','comment','topic','topic_reply'); exception when duplicate_object then null; end $$;
do $$ begin create type topic_state as enum ('active','inactive'); exception when duplicate_object then null; end $$;
-- A database created before comment or topic notifications existed has a
-- narrower enum. Widen it here so a re-run of this file matches a migrated one.
alter type notification_type add value if not exists 'comment';
alter type notification_type add value if not exists 'topic';
alter type notification_type add value if not exists 'topic_reply';

-- ---------- reset ----------
drop table if exists topic_replies, topics, comments, notifications, tasks, resources, folders, milestones, profiles cascade;

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

-- Folders are mandatory: a resource has no "unfiled" state to fall into.
create table resources (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references folders(id) on delete cascade,
  title text not null,
  type item_type not null default 'learn',
  -- Markdown. The resource's whole body: the link, the context, what to focus
  -- on. There is deliberately no separate `source` column — where a resource
  -- lives is read off the first link in here (lib/markdown.ts), so nobody has
  -- to type "YouTube" into a box to say what the URL already says.
  description text,
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

-- A task IS a library resource assigned to a person. resource_id is NOT NULL,
-- so a task that isn't in the library is not representable: there is no
-- "ad-hoc task" escape hatch. Delete the resource (or its folder) and the task
-- goes with it in the same statement.
--
-- Resource-owned columns (kept in sync by trigger): title, type, folder_id.
-- Task-owned columns: state, deadline, note, applied, effort_min, parked_reason.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  folder_id uuid references folders(id) on delete cascade,
  title text not null,
  type item_type not null default 'learn',
  state task_state not null default 'todo',
  deadline timestamptz,
  applied boolean not null default false,
  parked_reason text,
  is_folder boolean not null default false,
  children_done int,
  children_total int,
  effort_min int,
  note text,
  created_at timestamptz not null default now(),
  -- One task per (person, resource). This makes assigning idempotent — so the
  -- app can upsert instead of read-then-write, and two people assigning the
  -- same thing at once cannot race into a duplicate.
  constraint tasks_owner_resource_uniq unique nulls distinct (owner_id, resource_id)
);

-- The discussion hangs off the work, not off who's holding it. A resource
-- assigned to three people is still one thread that all three see and write
-- to; unassigning someone leaves it intact.
create table comments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- General discussion: the things that aren't work. An idea, a doubt, or
-- something the others should know is not a resource with a deadline, and
-- forcing it through the task pipeline either buries it or puts a fake deadline
-- on a conversation. A topic belongs to the team, not to anyone's plate.
--
-- Active/Inactive is an attention signal, not a lock — an inactive topic still
-- takes replies, because conversations come back to life.
create table topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  state topic_state not null default 'active',
  created_at timestamptz not null default now(),
  -- Denormalised so the list sorts by liveliness without reading every reply.
  last_activity_at timestamptz not null default now()
);

create table topic_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

-- A nudge about a task that no longer exists is noise, not history.
-- task_id and topic_id are alternatives: a row points at exactly one of them.
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type notification_type not null default 'poke',
  task_id uuid references tasks(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_resource_id_idx       on tasks (resource_id);
create index tasks_folder_id_idx         on tasks (folder_id);
create index tasks_owner_id_idx          on tasks (owner_id);
create index resources_folder_id_idx     on resources (folder_id);
create index comments_resource_id_idx    on comments (resource_id);
create index notifications_task_id_idx   on notifications (task_id);
create index notifications_recipient_idx on notifications (recipient_id, created_at desc);
-- The comment fan-out collapses a thread's unread rows before inserting the
-- newest one, and works out who's in a thread by reading its comment authors.
create index notifications_thread_unread_idx on notifications (recipient_id, task_id) where read = false;
create index comments_resource_author_idx    on comments (resource_id, author_id);
create index notifications_topic_id_idx      on notifications (topic_id);
create index topics_last_activity_idx        on topics (last_activity_at desc);
create index topic_replies_topic_id_idx      on topic_replies (topic_id, created_at);
-- The topic list builds each participant stack from its reply authors.
create index topic_replies_topic_author_idx  on topic_replies (topic_id, author_id);

-- ---------- a reply keeps its topic at the top of the list ----------
-- search_path pinned empty (references schema-qualified) so the function can't
-- be hijacked by a caller's search_path.
create or replace function topics_touch_activity() returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.topics set last_activity_at = new.created_at where id = new.topic_id;
  return null;
end $$;

create trigger topic_replies_touch_topic
  after insert on topic_replies
  for each row execute function topics_touch_activity();

-- ---------- identity stays in sync with the library, in both directions ----------
create or replace function tasks_sync_from_resource() returns trigger
language plpgsql as $$
declare r record;
begin
  -- BEFORE triggers run ahead of the NOT NULL check, so name this case here
  -- or it surfaces as a confusing "resource no longer exists".
  if new.resource_id is null then
    raise exception 'a task must reference a library resource'
      using errcode = 'not_null_violation';
  end if;

  select title, type, folder_id into r
  from resources where id = new.resource_id;

  if not found then
    -- Resource deleted underneath us. Fail with the code the app maps to a
    -- friendly message, rather than writing a task that points at nothing.
    raise exception 'library resource % no longer exists', new.resource_id
      using errcode = 'foreign_key_violation';
  end if;

  new.title     := r.title;
  new.type      := r.type;
  new.folder_id := r.folder_id;
  return new;
end $$;

create trigger tasks_sync_from_resource
  before insert or update of resource_id, title, type, folder_id on tasks
  for each row execute function tasks_sync_from_resource();

create or replace function resources_sync_tasks() returns trigger
language plpgsql as $$
begin
  update tasks
  set title     = new.title,
      type      = new.type,
      folder_id = new.folder_id
  where resource_id = new.id;
  return null;
end $$;

create trigger resources_sync_tasks
  after update of title, type, folder_id on resources
  for each row
  when (old.title     is distinct from new.title
     or old.type      is distinct from new.type
     or old.folder_id is distinct from new.folder_id)
  execute function resources_sync_tasks();

-- ---------- seed ----------
insert into profiles (id, name, initial, focus, score) values
  ('00000000-0000-0000-0000-000000000001','Nand','N','Ship our brand logo — v1',3),
  ('00000000-0000-0000-0000-000000000002','Madhav','M','Meta Ads test campaign',4),
  ('00000000-0000-0000-0000-000000000003','Kedar','K','SEO audit of our site',3);

insert into folders (id, name, ordered) values
  ('00000000-0000-0000-0000-0000000000a1','Sales',true),
  ('00000000-0000-0000-0000-0000000000a2','SEO',false),
  ('00000000-0000-0000-0000-0000000000a3','Our agency',false),
  ('00000000-0000-0000-0000-0000000000a4','Paid ads',false),
  ('00000000-0000-0000-0000-0000000000a5','Brand & copy',false);

-- `description` is markdown: the link and the context live in one field, and
-- the app reads the site off the first link rather than storing it separately.
insert into resources (id, folder_id, title, type, description, tags, est_effort_min) values
  ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a1','Cold email fundamentals — playlist','learn',
   E'[8-part playlist on cold outreach](https://www.youtube.com/playlist?list=PLcold-email)\n\nSkip parts 1–2, they''re intro fluff. **Part 3 (subject lines)** and **part 6 (follow-up cadence)** are the ones we actually need.\n\n- [ ] Watch parts 3–8\n- [ ] Pull the templates into our shared doc',
   '{email,outreach}',120),
  ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a1','Send 10 real cold emails','build',
   E'Ten real sends, not drafts. Use the templates from the playlist, but rewrite the first line per prospect — the whole point is that it doesn''t read like a template.',
   '{email,practice}',60),
  ('00000000-0000-0000-0000-0000000000b3','00000000-0000-0000-0000-0000000000a2','SEO foundations','learn',
   E'Full course: https://www.ahrefs.com/academy/seo-foundations\n\nSeven modules, ~4 hours. Do it in two sittings rather than one — the back half only lands once the first half has had a day to settle.',
   '{seo,organic}',240),
  ('00000000-0000-0000-0000-0000000000b4','00000000-0000-0000-0000-0000000000a2','Keyword research walkthrough','learn',
   E'[The one good walkthrough](https://backlinko.com/keyword-research) — everything else on page one of Google is the same post rewritten.',
   '{seo}',30),
  ('00000000-0000-0000-0000-0000000000b5','00000000-0000-0000-0000-0000000000a3','Ship our brand logo — v1','build',
   E'**v1, not the final word.** Something we can put on a deck and a footer this week.\n\n- [ ] Three directions, black on white\n- [ ] Pick one together on Thursday\n- [ ] Export SVG + PNG to the shared drive',
   '{brand,launch}',90),
  ('00000000-0000-0000-0000-0000000000b6','00000000-0000-0000-0000-0000000000a3','Set up our Instagram page','build',null,'{socials,launch}',null),
  ('00000000-0000-0000-0000-0000000000b7','00000000-0000-0000-0000-0000000000a2','SEO audit of our site','build',
   E'Run it with the free [Ahrefs site audit](https://ahrefs.com/site-audit). We only care about three things right now:\n\n1. Pages that return anything but 200\n2. Missing or duplicate titles\n3. Anything blocking indexing',
   '{seo,audit}',null),
  ('00000000-0000-0000-0000-0000000000b8','00000000-0000-0000-0000-0000000000a2','On-page checklist','build',null,'{seo}',null),
  ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000a4','Advanced Meta Ads course','learn',
   E'Parked until the first test campaign has real numbers — the course assumes you have data to read.',
   '{ads,meta}',null),
  ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000a4','Audience research','learn',null,'{ads,research}',null),
  ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000a4','Creative hooks','learn',null,'{ads,creative}',null),
  ('00000000-0000-0000-0000-0000000000c4','00000000-0000-0000-0000-0000000000a4','Meta Ads test campaign','build',
   E'Small budget, one variable. **₹500/day for five days**, one audience, three creatives — anything wider than that and we learn nothing.',
   '{ads,practice}',null),
  ('00000000-0000-0000-0000-0000000000c5','00000000-0000-0000-0000-0000000000a4','First test ad set','build',null,'{ads,practice}',null),
  ('00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000a5','Positioning basics','learn',null,'{brand,positioning}',null),
  ('00000000-0000-0000-0000-0000000000d2','00000000-0000-0000-0000-0000000000a5','Offer design','learn',null,'{offer}',null),
  ('00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000a5','Landing page copy','learn',null,'{copy}',null),
  ('00000000-0000-0000-0000-0000000000d4','00000000-0000-0000-0000-0000000000a5','Brand color theory','learn',null,'{brand}',null),
  ('00000000-0000-0000-0000-0000000000d5','00000000-0000-0000-0000-0000000000a5','Lead magnet ideas','learn',null,'{leadgen}',null),
  ('00000000-0000-0000-0000-0000000000d6','00000000-0000-0000-0000-0000000000a5','Email deliverability','learn',null,'{email}',null);

insert into milestones (id, label, idx, done, current) values
  ('brand','brand',0,true,false),
  ('site','site',1,false,true),
  ('socials','socials',2,false,false),
  ('content','content',3,false,false),
  ('sales','sales team',4,false,false);

-- Every task is a library resource assigned to someone. title, type and
-- folder_id are filled in from resource_id by the sync trigger, so the values
-- below only need to be plausible — the resource is authoritative.

-- Nand's active queue
insert into tasks (owner_id, resource_id, title, type, state, deadline, is_folder, children_done, children_total, effort_min, note, parked_reason) values
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b5','Ship our brand logo — v1','build','in_progress', now() + interval '3 days', false, null, null, 90, 'The real deliverable behind everything you studied this week.', null),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b1','Cold email fundamentals — playlist','learn','todo', now() - interval '1 day', false, null, null, null, null, null),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000b3','SEO foundations','learn','in_progress', null, true, 3, 7, null, null, null),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c1','Advanced Meta Ads course','learn','parked', null, false, null, null, null, null, 'Madhav''s on ads');

-- Nand's completed-this-week (drives learned=6 / applied=4)
insert into tasks (owner_id, resource_id, title, type, state, applied) values
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d1','Positioning basics','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d2','Offer design','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d3','Landing page copy','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d4','Brand color theory','learn','complete',true),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d5','Lead magnet ideas','learn','complete',false),
  ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000d6','Email deliverability','learn','complete',false);

-- Team activity (drives Team dashboard counts)
insert into tasks (owner_id, resource_id, title, type, state, applied) values
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000c4','Meta Ads test campaign','build','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000c2','Audience research','learn','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000c3','Creative hooks','learn','in_progress',false),
  ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000c5','First test ad set','build','complete',true),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000b7','SEO audit of our site','build','in_progress',false),
  ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000b8','On-page checklist','build','complete',true);

-- Discussion topics. last_activity_at is left to the trigger: inserting the
-- replies below is what floats each topic to its right place in the list.
insert into topics (id, author_id, title, description, state) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-000000000003',
   'Should we niche down to one industry?',
   'We keep pitching everyone and our case studies look scattered. Wondering if picking one vertical for the next 6 months would make the outreach write itself. Not proposing it yet — want to hear where you two land.',
   'active'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-000000000002',
   'Doubt: how are we pricing retainers?',
   'A lead asked for monthly and I froze. Do we have a number, or are we quoting per project every time?',
   'active'),
  ('00000000-0000-0000-0000-0000000000e3','00000000-0000-0000-0000-000000000001',
   'Note: moved all brand files to the shared drive',
   'Logos, fonts and the colour sheet now live under Brand/ on the shared drive. Stop using the ones in your downloads folder.',
   'inactive');

insert into topic_replies (topic_id, author_id, body, created_at) values
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-000000000001',
   'I''m for it. Our two best results are both D2C — leading with that costs us nothing and the deck gets easier to write.',
   now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000e1','00000000-0000-0000-0000-000000000002',
   'Agreed on the positioning, but let''s not turn away work outside it while we''re this early. Niche the marketing, not the invoice.',
   now() - interval '1 day'),
  ('00000000-0000-0000-0000-0000000000e2','00000000-0000-0000-0000-000000000001',
   'No number yet. Let''s set a floor this week so nobody has to freeze again.',
   now() - interval '4 hours');

-- ---------- RLS policies ----------
-- This project auto-enables RLS on new tables. Without policies the anon
-- (publishable) key the app uses in the browser is blocked from all rows.
-- Internal no-auth MVP: allow anon + authenticated full access. Lock this
-- down once real per-user auth exists.
do $$
declare t text;
begin
  foreach t in array array['profiles','folders','resources','milestones','tasks','comments','notifications','topics','topic_replies']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_write', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_all_select', t);
    execute format('create policy %I on public.%I for all to anon, authenticated using (true) with check (true)', t||'_all_write', t);
  end loop;
end $$;
