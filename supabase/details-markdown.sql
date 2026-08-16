-- Migration: one details field, in markdown. `source` is folded into it and
-- dropped.
--
-- Why: `resources.source` asked for a word ("YouTube", "Blog") that told you
-- almost nothing, while the link people actually wanted to record went into
-- `description` anyway — or nowhere. Details is markdown now, so a pasted link
-- renders as a link, and the app derives the site from that link instead of
-- asking anyone to type it twice (see lib/markdown.ts).
--
-- Idempotent: safe to run twice. The backfill is guarded on the column still
-- existing, so a second run does nothing.
--
-- Run in: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.

-- ---------- 1. fold source into description ----------
-- A URL becomes the first line of the details (GFM auto-links a bare URL, so
-- it is clickable as-is). Anything else was a label, and reads as one.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resources' and column_name = 'source'
  ) then
    execute $sql$
      update resources r
      set description = p.prefix || coalesce(e'\n\n' || r.description, '')
      from (
        select id,
               case when source ~* '^https?://' then btrim(source)
                    else 'Source: ' || btrim(source) end as prefix
        from resources
        where source is not null and btrim(source) <> ''
      ) p
      where r.id = p.id
        -- Don't prepend twice if an earlier run already folded it in.
        and (r.description is null
             or left(r.description, length(p.prefix)) <> p.prefix)
    $sql$;
  end if;
end $$;

-- ---------- 2. drop the triggers that name the column ----------
-- Dropping a column listed in a trigger's `update of` clause would take the
-- trigger with it; dropping them explicitly keeps the order legible.
drop trigger if exists tasks_sync_from_resource on tasks;
drop trigger if exists resources_sync_tasks on resources;

-- ---------- 3. drop the column ----------
alter table resources drop column if exists source;
alter table tasks     drop column if exists source;

-- ---------- 4. rebuild the sync pair without it ----------
-- Resource-owned columns are now: title, type, folder_id.
create or replace function tasks_sync_from_resource() returns trigger
language plpgsql as $$
declare r record;
begin
  if new.resource_id is null then
    raise exception 'a task must reference a library resource'
      using errcode = 'not_null_violation';
  end if;

  select title, type, folder_id into r
  from resources where id = new.resource_id;

  if not found then
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
