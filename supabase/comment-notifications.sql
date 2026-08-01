-- Additive migration: in-app notifications when someone comments on a task.
-- Run once in Supabase -> SQL Editor. Does NOT touch existing data.
--
-- A task is per-person (unique on owner_id, resource_id), so a comment thread
-- belongs to one person's copy of a resource. The app notifies that task's
-- owner plus everyone already in the thread — see notifyComment() in
-- app/actions.ts.

-- 'comment' joins 'poke' and 'assigned'. Adding a value is safe to re-run.
alter type notification_type add value if not exists 'comment';

-- The fan-out collapses a thread's unread notifications down to one row per
-- person before inserting the newest, so a busy thread never floods the bell.
-- That lookup is (recipient, task, unread) — index it.
create index if not exists notifications_thread_unread_idx
  on notifications (recipient_id, task_id)
  where read = false;

-- Working out who is already in a thread reads every comment's author.
create index if not exists comments_task_author_idx
  on comments (task_id, author_id);
