# Database

## Fresh database

Run **`setup.sql`** only. It is the authoritative schema — it already contains
everything the migrations below add, plus the seed data and RLS policies.
Don't run the migrations after it; they'd be no-ops at best.

## Existing database

Migrations are additive and must be applied in this order. All of them are
already applied to the current project.

| # | File | What it adds |
|---|------|--------------|
| 1 | `task-folder.sql` | `tasks.folder_id`, so Today can group by folder |
| 2 | `library-details.sql` | `resources.description` |
| 3 | `notes-comments.sql` | `comments` table |
| 4 | `notifications.sql` | `notifications` table |
| 5 | `referential-integrity.sql` | `tasks.resource_id` + the cascades, uniqueness and sync triggers |
| 6 | `tasks-require-resource.sql` | Adopts orphan tasks into the library, then makes `resource_id` `NOT NULL` |

## The invariants the database enforces

These are constraints and triggers, not application logic, so no code path —
present or future — can violate them.

- **Every task is a library item.** `tasks.resource_id` is `NOT NULL`. A task
  that doesn't exist in the Library is not representable, so nothing can end up
  in someone's queue that you can't find, rename, reassign or delete from the
  Library.
- **A task cannot outlive its resource.** `tasks.resource_id` cascades on
  delete. Deleting a resource removes every task assigned from it, along with
  those tasks' comments and notifications, in the same statement. Deleting a
  folder cascades to its resources first, then onward. This is what stopped
  deleted library items from lingering on Today and Team.
- **One task per (person, resource).** A unique constraint, so assigning the
  same thing twice is a no-op rather than a duplicate — and because the app
  upserts instead of read-then-write, two people assigning at once can't race.
- **A task's identity always matches its resource.** `title`, `type`, `source`
  and `folder_id` are synced by trigger in both directions. Renaming in the
  library renames it in everyone's queue.
- **Every resource is in a folder; every task has an owner.** `NOT NULL`, so
  there is no "unfiled" limbo to fall into.

Together these mean the Library is the complete index of the team's work: every
task on Today or Team traces back to exactly one resource in exactly one folder,
and deleting from the Library removes it everywhere.
