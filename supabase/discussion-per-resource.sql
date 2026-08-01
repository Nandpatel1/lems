-- Move the discussion off the assignment and onto the work itself.
-- Run once in Supabase -> SQL Editor.
--
-- Before: comments hung off tasks. A task is one person × one resource, so
-- assigning "Ship our brand logo — v1" to two founders made two task rows and
-- therefore two separate threads — each person talking into their own copy,
-- neither seeing the other. That is not what a discussion is.
--
-- After: comments hang off the resource. One work item, one thread, seen by
-- everyone assigned to it — the same way a video has one comment section no
-- matter how many people are watching.
--
-- Consequence worth knowing: unassigning someone no longer deletes the
-- discussion. It belongs to the work, not to who happened to be holding it.

alter table comments add column if not exists resource_id uuid references resources(id) on delete cascade;

-- Every task has a NOT NULL resource_id, and comments.task_id cascaded on task
-- deletion, so this backfill reaches every existing row.
update comments c
set resource_id = t.resource_id
from tasks t
where t.id = c.task_id and c.resource_id is null;

-- Belt and braces: a row we somehow can't place has nothing to attach to.
delete from comments where resource_id is null;

alter table comments alter column resource_id set not null;
-- Dropping the column takes comments_task_id_idx and comments_task_author_idx
-- with it; the resource-shaped equivalents are created below.
alter table comments drop column if exists task_id;

create index if not exists comments_resource_id_idx     on comments (resource_id);
-- Working out who is already in a thread reads every comment's author.
create index if not exists comments_resource_author_idx on comments (resource_id, author_id);
