-- Additive migration: remember which library folder a task came from, so the
-- Today page can offer a "group by folder" view. Run once in Supabase.

alter table tasks add column if not exists folder_id uuid references folders(id) on delete set null;

-- Backfill existing tasks: match to a library resource by title to infer folder.
update tasks t
set folder_id = r.folder_id
from resources r
where t.folder_id is null
  and t.title = r.title
  and r.folder_id is not null;
