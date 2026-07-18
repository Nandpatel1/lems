# Discovery — Current State & Target Workflow (living draft)

> Stage 1 · captured live during founder interviews. Rough and evolving; specialists will
> refine into formal requirements. Do not treat as final.

## Team model
- **3 founders**, fully peer-to-peer. No lead.
- Anyone can create, assign, and (later) review work for anyone. Symmetric permissions.

## Target workflow (v0 — from Round 1)
1. **Capture** — a founder finds a resource (e.g. a YouTube video) and adds it to the platform.
2. **Organize** — resource filed into the shared **library**. Structure TBD (topics/sub-topics,
   folders/collections, tags). Goal: a genuinely well-organized library, *not* a link dump.
3. **Assign** — assign to anyone (self or others). Wants to assign a **bundle/group of resources
   at once**, not only one at a time.
4. **Deadline** — optional deadline per item.
5. **Notify** — notify the assignee immediately + ongoing reminders. Preferred channel:
   **WhatsApp** (a shared group of the 3). **HARD CONSTRAINT: must be free.** If WhatsApp can't
   be free, use a free alternative.
6. **Do & track** — assignee works through it; can mark **complete**, or mark **"not mandatory
   as of now"** (keep in queue / backlog to revisit later).
7. **Notes** — per-item notes section for thoughts and learnings.
8. **Peer review** — (from the original vision) optional review by a teammate. To confirm.

## Open questions / to resolve
- Library structure model — topics vs. sub-topics vs. folders/collections vs. tags vs. ordered
  paths. (Round 2)
- WhatsApp "must be free" feasibility, else free alternative (Telegram / email / in-app).
  (Research item)
- Exact task states — complete, "not mandatory yet"/backlog, in progress, overdue, etc.
  (Round 4)
- Peer review flow — when/if required, who reviews. (Round 4)

## Library structure (Round 2)
- **Flexibility is a first principle** — no fixed taxonomy. Founders must be able to create,
  rename, and reorganize topics/folders over time. Structure will evolve.
- **Folder = primary home, tags = secondary.** Each resource lives in one folder/collection but
  can carry multiple tags for cross-cutting categorization later.
- **Ordering is an optional property per collection** — some are sequential (X before Y), some
  are an unordered bag of related resources. Decided per collection, not globally.
- **Folders/collections are assignable as a unit** (hand someone a whole folder).
- *Working assumption (confirm in Round 4):* assigning a folder = one parent task in the queue
  with its resources as sub-items; progress rolls up (e.g. "3 of 7 done").

## Task & accountability model (Round 5)
- **States:** Parked/"not mandatory yet" (situational — e.g. a teammate covers it, or you
  already know enough; allow an optional reason note) → To-do (assigned, optional deadline) →
  In progress → Complete. Optional **Applied / done-for-real** step for items with an action.
  **Overdue** = a flag on anything past deadline, not a separate stage.
- **Folder assignment:** a folder is assigned as **one item that shows its action sub-items**;
  progress rolls up across them (e.g. "3 of 7 done"). Keeps the queue uncluttered.
- **No priority levels** — deadlines are signal enough.
- **No formal/required review.** Collaboration is via **per-item notes + comments** (any
  teammate can comment). Nothing is gated on approval.

## ⚠ Overrides of original requirement.md (for critic to reconcile)
- **Priority: removed** (requirement.md listed it).
- **Peer review: downgraded** from an optional review step to notes/comments only.

## Reminders & accountability pressure (Round 6)
- **Channels (v1):** **Email + in-app = automatic** reminders (no cost, no tap). **WhatsApp =
  one-tap assisted** — the app builds a **wa.me prefilled-message link/button** to the team's
  existing free WhatsApp group; a human taps to send. Chosen for simplest/easiest/fastest +
  free + safe. (Official Cloud API — ~₹75/mo, full automation, 1:1 DMs — is a documented future
  upgrade.)
- **Triggers:** automatic reminder **24 hours before a deadline**, plus a **manual "send
  notification"** button to poke a teammate on demand. (New-assignment / overdue triggers are
  likely-yes candidates — confirm in scope.)
- **Visibility:** a **shared, fully public dashboard** — all three see everyone's progress and
  overdue items. Full transparency is the accountability mechanism (peer-to-peer, no boss).

## Research items
- ~~Confirm a free WhatsApp path~~ **RESOLVED** — no compliant free path for proactive msgs, but
  cost is trivial (~₹0.17/util msg). Founder approved ~₹100/mo. **WhatsApp is IN for v1** via
  Cloud API + Make.com. See research.md.

## Decisions locked
- Team: 3 equal peers, symmetric permissions (create / assign / comment on any).
- Library structure must be user-editable and flexible; folders (single home) + tags (many).
- Task states incl. situational "parked"; folder = parent item w/ sub-items + roll-up progress.
- No priority. No required review; notes + comments instead.
