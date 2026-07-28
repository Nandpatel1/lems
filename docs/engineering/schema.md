# Data Schema (Stage 3) — LEMS

> Derived from the Stage 1 system model + Stage 2 needs. Postgres via Supabase, modeled in
> Drizzle. Relational, with the roll-ups/ratios/readiness computed by query.
>
> **This document is the target model.** For what is actually in the database today —
> including the referential-integrity guarantees summarized below — see `supabase/README.md`
> and `supabase/setup.sql`, which are the source of truth.

## Referential integrity (as built)

The Library is the single source of truth for assigned work. These are enforced by
constraints and triggers, not by application code, so no code path can produce an
inconsistent state:

- `tasks.resource_id` is **`NOT NULL`** — a task is a resource assigned to someone, so a task
  outside the Library is not representable. The Library is therefore the complete index of the
  team's work.
- `tasks.resource_id` → `resources` **on delete cascade**, and `resources.folder_id` →
  `folders` **on delete cascade**. Deleting a resource removes every task assigned from it
  (and their comments and notifications) atomically; deleting a folder cascades through its
  resources to those tasks. There is no window in which a task outlives its resource.
- `unique (owner_id, resource_id)` — one task per person per resource. Assignment is
  therefore idempotent and race-free (the app upserts rather than read-then-write).
- Trigger-synced identity: a task's `title`, `type`, `source` and `folder_id` always mirror
  its resource; state, deadline, note and applied belong to the task.
- `resources.folder_id` and `tasks.owner_id` are `NOT NULL` — no unfiled or unowned limbo.

## Enums
- `item_type`: `learn` | `build`
- `task_state`: `parked` | `todo` | `in_progress` | `complete`
- `notification_type`: `assigned` | `reminder_24h` | `overdue` | `completed` | `commented` | `poke`
- `channel`: `in_app` | `email`

## Tables

### profiles  (one row per founder; extends Supabase auth.users)
`id (uuid, = auth.uid, pk)` · `name` · `avatar_color` · `email` · `created_at`

### folders  (collections; the flexible library structure)
`id` · `name` · `parent_id (fk folders, nullable)` · `is_ordered (bool)` · `created_by (fk
profiles)` · `created_at`
*Renameable/reorganizable; a resource has exactly one home folder.*

### resources  (raw learning material in the library)
`id` · `title` · `type (item_type)` · `url (nullable — build items may have none)` · `folder_id
(fk folders, nullable)` · `est_effort_min (int, nullable)` · `order_index (int, for ordered
folders)` · `created_by` · `created_at`

### tags  &  resource_tags  (many-to-many, cross-cutting labels)
`tags(id, name)` · `resource_tags(resource_id, tag_id)` — a resource has 0..n tags.

### tasks  (an assigned item in someone's queue)
`id` · `resource_id (fk resources)` · `owner_id (fk profiles)` · `assigned_by (fk profiles)` ·
`state (task_state, default todo)` · `deadline (timestamptz, nullable)` · `parked_reason
(text, nullable)` · `applied (bool, default false)` · `applied_at (nullable)` · `parent_task_id
(fk tasks, nullable — for folder assignment)` · `reminded_24h (bool, default false)` ·
`created_at` · `completed_at (nullable)`
*Folder assignment = one parent task + child tasks (one per resource); progress rolls up over
children. `applied` = the "done for real" step; only `applied`/completed Build + applied Learn
feed readiness.*

### milestones  (team-editable launch checklist → the road to launch)
`id` · `label` · `order_index` · `is_done (bool)` · `linked_resource_id (fk resources,
nullable)` · `weight (int, default 1)` · `created_at`
*Seeded with brand/website/socials/content/sales-team but fully editable.*

### confidence_ratings  (self-rated sentiment for readiness)
`id` · `profile_id` · `topic (text, nullable = overall)` · `score (int 1–5)` · `rated_at`

### notes  (personal, per task/resource)
`id` · `task_id (fk tasks)` · `author_id` · `body` · `updated_at`

### comments  (shared thread, per task/resource)
`id` · `task_id (fk tasks)` · `author_id` · `body` · `created_at`

### notifications  (in-app; email sent in parallel)
`id` · `recipient_id (fk profiles)` · `type (notification_type)` · `task_id (nullable)` ·
`body` · `read (bool)` · `created_at`

## Key relationships
- profiles 1—* tasks (owner) ; profiles 1—* tasks (assigned_by)
- folders 1—* resources ; folders self-ref (nesting)
- resources *—* tags ; resources 1—* tasks
- tasks self-ref (parent/child for folder assignment)
- tasks 1—* notes ; tasks 1—* comments ; tasks 1—* notifications

## Derived (computed by query, not stored)
- **Folder roll-up:** `complete children / total children` for a parent task.
- **Learned → applied (this week):** count tasks completed vs. tasks with `applied = true`.
- **Launch readiness %:** `weighted(milestones.is_done) blended with applied-action count`,
  normalized; **excludes** merely-completed-but-not-applied Learn items. Shown beside avg
  confidence.

## Row-Level Security (policy intent)
- Read: all three founders can read resources, folders, tasks, milestones, comments, readiness
  (public dashboard). Notes are private to author. Notifications readable only by recipient.
- Write: a founder may create resources/folders/tasks and assign to anyone; may edit a task's
  state/notes when they are the owner; comments authored by self; milestones editable by any
  founder (shared launch plan).
