-- =====================================================================
-- Referential integrity: the Library is the single source of truth.
-- Run once in Supabase -> SQL Editor. Idempotent / safe to re-run.
--
-- The problem this fixes
-- ---------------------
-- Tasks used to be *copies* of a library resource (title + type + folder
-- snapshotted at assign time) with no link back to it. So deleting a
-- resource left every assigned task behind as a ghost — visible forever on
-- Today and on Team > <person>, referring to something that no longer
-- exists. Dedup was done by matching title strings, which both merged
-- unrelated items that shared a name and let duplicates through.
--
-- The fix
-- -------
-- tasks.resource_id is a real foreign key. The database — not app code —
-- now guarantees:
--   * delete a resource  -> its tasks (and their comments/notifications) go
--   * delete a folder    -> its resources go -> their tasks go
--   * one task per (person, resource): duplicates are impossible
--   * a task's title/type/source/folder always match its resource
-- No code path can create an orphan, because none of this lives in code.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Link every task to the library resource it came from.
-- ---------------------------------------------------------------------
alter table tasks add column if not exists resource_id uuid;

-- Backfill by (folder, title) — exactly how the assign paths built tasks.
-- Deliberately NOT matched on title alone: a task with no folder was never
-- created from the library, so linking it by name would be a false match.
update tasks t
set resource_id = r.id
from resources r
where t.resource_id is null
  and t.folder_id is not null
  and r.folder_id = t.folder_id
  and r.title = t.title;

-- ---------------------------------------------------------------------
-- 2. Drop tasks left over from resources that were already deleted.
--    folder_id is only ever set by a library-assign path, so "has a folder
--    but matched no resource" means the resource is gone. Ad-hoc tasks
--    (no folder) are untouched — they aren't library-derived.
-- ---------------------------------------------------------------------
delete from tasks
where resource_id is null
  and folder_id is not null;

-- ---------------------------------------------------------------------
-- 3. Collapse duplicate assignments down to one task per (person,
--    resource). Keeps the most meaningful row (complete > in_progress >
--    todo > parked, then newest) and moves the losers' history onto it so
--    nothing is silently lost.
-- ---------------------------------------------------------------------
create temporary table task_merge on commit drop as
with ranked as (
  select id, note, applied,
         first_value(id) over (
           partition by owner_id, resource_id
           order by case state
                      when 'complete'    then 0
                      when 'in_progress' then 1
                      when 'todo'        then 2
                      else 3
                    end,
                    created_at desc
         ) as keep_id
  from tasks
  where resource_id is not null
)
select id as dup_id, keep_id, note, applied
from ranked
where id <> keep_id;

-- Carry a note and the "applied" flag forward from the rows being removed.
update tasks k
set note    = coalesce(k.note, m.note),
    applied = k.applied or m.applied
from (
  select keep_id,
         (array_remove(array_agg(note order by note), null))[1] as note,
         bool_or(applied)                                       as applied
  from task_merge
  group by keep_id
) m
where k.id = m.keep_id;

-- Re-point history at the survivor, then remove the duplicates.
update comments c      set task_id = m.keep_id from task_merge m where c.task_id = m.dup_id;
update notifications n set task_id = m.keep_id from task_merge m where n.task_id = m.dup_id;
delete from tasks t using task_merge m where t.id = m.dup_id;

-- ---------------------------------------------------------------------
-- 4. Every resource lives in a folder (folders are mandatory), so the
--    "Unfiled" pseudo-group can no longer exist.
-- ---------------------------------------------------------------------
do $$
declare unfiled uuid;
begin
  if exists (select 1 from resources where folder_id is null) then
    select id into unfiled from folders where name = 'Unfiled' limit 1;
    if unfiled is null then
      insert into folders (name) values ('Unfiled') returning id into unfiled;
    end if;
    update resources set folder_id = unfiled where folder_id is null;
  end if;
end $$;

alter table resources alter column folder_id set not null;
alter table tasks     alter column owner_id  set not null;

-- ---------------------------------------------------------------------
-- 5. Cascades. Previously these were "on delete set null", which is what
--    turned deletions into orphans instead of propagating them.
-- ---------------------------------------------------------------------
alter table resources drop constraint if exists resources_folder_id_fkey;
alter table resources add  constraint resources_folder_id_fkey
  foreign key (folder_id) references folders(id) on delete cascade;

alter table tasks drop constraint if exists tasks_folder_id_fkey;
alter table tasks add  constraint tasks_folder_id_fkey
  foreign key (folder_id) references folders(id) on delete cascade;

alter table tasks drop constraint if exists tasks_resource_id_fkey;
alter table tasks add  constraint tasks_resource_id_fkey
  foreign key (resource_id) references resources(id) on delete cascade;

-- A nudge about a task that no longer exists is noise, not history.
alter table notifications drop constraint if exists notifications_task_id_fkey;
alter table notifications add  constraint notifications_task_id_fkey
  foreign key (task_id) references tasks(id) on delete cascade;

-- ---------------------------------------------------------------------
-- 6. One task per (person, resource). NULLS DISTINCT (the default) leaves
--    ad-hoc tasks — resource_id is null — completely unconstrained.
--    This is also what makes assigning idempotent: the app can upsert with
--    ON CONFLICT DO NOTHING instead of read-then-write, so two people
--    assigning the same thing at once can't race into a duplicate.
-- ---------------------------------------------------------------------
alter table tasks drop constraint if exists tasks_owner_resource_uniq;
alter table tasks add  constraint tasks_owner_resource_uniq
  unique nulls distinct (owner_id, resource_id);

-- ---------------------------------------------------------------------
-- 7. Identity fields always mirror the resource, in both directions.
--    Owned by the resource: title, type, source, folder_id.
--    Owned by the task:     state, deadline, note, applied, effort_min.
-- ---------------------------------------------------------------------
create or replace function tasks_sync_from_resource() returns trigger
language plpgsql as $$
declare r record;
begin
  if new.resource_id is null then
    return new;
  end if;

  select title, type, source, folder_id into r
  from resources where id = new.resource_id;

  if not found then
    -- Resource deleted underneath us. Fail loudly with the code the app
    -- already maps to a friendly message, rather than writing a ghost.
    raise exception 'library resource % no longer exists', new.resource_id
      using errcode = 'foreign_key_violation';
  end if;

  new.title     := r.title;
  new.type      := r.type;
  new.source    := r.source;
  new.folder_id := r.folder_id;
  return new;
end $$;

drop trigger if exists tasks_sync_from_resource on tasks;
create trigger tasks_sync_from_resource
  before insert or update of resource_id, title, type, source, folder_id on tasks
  for each row execute function tasks_sync_from_resource();

create or replace function resources_sync_tasks() returns trigger
language plpgsql as $$
begin
  update tasks
  set title     = new.title,
      type      = new.type,
      source    = new.source,
      folder_id = new.folder_id
  where resource_id = new.id;
  return null;
end $$;

drop trigger if exists resources_sync_tasks on resources;
create trigger resources_sync_tasks
  after update of title, type, source, folder_id on resources
  for each row
  when (old.title     is distinct from new.title
     or old.type      is distinct from new.type
     or old.source    is distinct from new.source
     or old.folder_id is distinct from new.folder_id)
  execute function resources_sync_tasks();

-- ---------------------------------------------------------------------
-- 8. Indexes for the FK lookups the cascades and dashboards rely on.
-- ---------------------------------------------------------------------
create index if not exists tasks_resource_id_idx        on tasks (resource_id);
create index if not exists tasks_folder_id_idx          on tasks (folder_id);
create index if not exists tasks_owner_id_idx           on tasks (owner_id);
create index if not exists resources_folder_id_idx      on resources (folder_id);
create index if not exists comments_task_id_idx         on comments (task_id);
create index if not exists notifications_task_id_idx    on notifications (task_id);
create index if not exists notifications_recipient_idx  on notifications (recipient_id, created_at desc);

commit;
