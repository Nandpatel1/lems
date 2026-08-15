-- General discussion: topics the team talks about without filing a task.
-- Run once in Supabase -> SQL Editor. Safe to re-run.
--
-- Everything else in this app is work: a resource somebody has to do by a date.
-- An idea, a doubt, or "here's something you two should know" is none of that,
-- and forcing it through the task pipeline either buries it or puts a fake
-- deadline on a conversation. Topics are the place for it — shared with the
-- whole team by definition, owned by nobody's plate.
--
-- A topic is Active or Inactive, and anyone can flip it. That is an attention
-- signal ("is this live?"), not a lock: an inactive topic still takes replies,
-- because a conversation coming back to life is normal and shouldn't need a
-- state change first.

-- ---------- enum ----------
do $$ begin create type topic_state as enum ('active','inactive'); exception when duplicate_object then null; end $$;

-- ---------- tables ----------
-- author_id nulls out rather than cascading: the topic is the team's, not the
-- writer's, and losing a profile shouldn't take the conversation with it.
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete set null,
  title text not null,
  description text,
  state topic_state not null default 'active',
  created_at timestamptz not null default now(),
  -- Denormalised so the list can sort by liveliness without reading every
  -- reply. Kept true by the trigger below.
  last_activity_at timestamptz not null default now()
);

create table if not exists topic_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists topics_last_activity_idx       on topics (last_activity_at desc);
create index if not exists topic_replies_topic_id_idx     on topic_replies (topic_id, created_at);
-- The list builds each topic's participant stack from its reply authors.
create index if not exists topic_replies_topic_author_idx on topic_replies (topic_id, author_id);

-- ---------- a reply keeps its topic at the top of the list ----------
create or replace function topics_touch_activity() returns trigger
language plpgsql as $$
begin
  update topics set last_activity_at = new.created_at where id = new.topic_id;
  return null;
end $$;

drop trigger if exists topic_replies_touch_topic on topic_replies;
create trigger topic_replies_touch_topic
  after insert on topic_replies
  for each row execute function topics_touch_activity();

-- ---------- notifications reach into topics too ----------
-- A discussion nobody is told about is a page you have to remember to visit.
-- 'topic' = somebody started one; 'topic_reply' = somebody wrote in one.
alter type notification_type add value if not exists 'topic';
alter type notification_type add value if not exists 'topic_reply';

-- Nullable alongside task_id: a notification points at exactly one of the two.
alter table notifications add column if not exists topic_id uuid references topics(id) on delete cascade;
create index if not exists notifications_topic_id_idx on notifications (topic_id);

-- ---------- RLS ----------
-- Same internal no-auth stance as every other table here.
do $$
declare t text;
begin
  foreach t in array array['topics','topic_replies']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_select', t);
    execute format('drop policy if exists %I on public.%I', t||'_all_write', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t||'_all_select', t);
    execute format('create policy %I on public.%I for all to anon, authenticated using (true) with check (true)', t||'_all_write', t);
  end loop;
end $$;
