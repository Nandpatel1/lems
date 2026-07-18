# Requirements & Scope — LEMS v1 (Stage 1 deliverable)

> Consolidated from founder interviews (Rounds 1–7). Companion docs: `product-vision.md`
> (thesis), `workflows.md` (process), `research.md` (channels/evidence). Status: **draft for
> founder sign-off.**

## 1. Product in one line
An **execution engine that uses learning as fuel** — a private tool for 3 founders to organize
learning, turn it into accountable work, apply it to building their own agency, and see how
close they are to launching. **Not** a learning library; the enemy is tutorial hell.

## 2. Users / personas
- **The Three Founders** — equal peers, symmetric permissions (any can create, assign, comment
  on anything). Busy, self-directed, motivated but at risk of the tutorial-hell trap (consume,
  feel productive, never ship). There are no other roles in v1.

## 3. Scope — MoSCoW

**MUST**
- Shared, **flexible library**: create/rename/reorganize folders freely; each resource has one
  home folder + tags; ordering optional per folder.
- **Two layers** in one system: **Learn** items (consume a resource) and **Build** items
  (execution milestones toward launching the agency).
- **Assign** any item or folder to any founder. A folder assigns as **one item showing its
  action sub-items**, with roll-up progress.
- **Task lifecycle**: Parked → To-do → In progress → Complete, with an optional **Applied**
  step for action items; **Overdue** as a flag.
- **Optional deadlines**; **auto-reminder 24h before** a deadline; **manual poke** action.
- **Notifications**: **email + in-app automatic**; **WhatsApp one-tap** (wa.me link to the
  team's group).
- **Notes + comments** per item (any founder can comment).
- **Shared, fully public dashboard** + **launch-readiness view** (milestones + self-rated
  confidence).

**SHOULD**
- Self-rated confidence per topic feeding readiness.
- Explicit **Applied/done-for-real** capture for action items.
- Search/filter the library by tag/folder/type/owner/status.
- **New-assignment** and **overdue** notifications (beyond the 24h-before reminder).

**COULD**
- Weekly digest (email/in-app).
- "Why parked" reason note.
- Official WhatsApp Cloud API upgrade for fully-automatic WhatsApp reminders (~₹75/mo).

**WON'T (v1)**
- Priority levels. Formal review/approval workflow. Gamification (streaks/points). Active
  "start now" pushing. Channels beyond email/in-app/WhatsApp. Non-founder roles / external
  users / client management.

## 4. Functional requirements (user stories + acceptance criteria)

### 4.1 Library & resources
- **US-1 Add a resource.** As a founder, I can add a resource (type, source URL, title, est.
  effort) to the shared library so it isn't lost.
  - *AC:* required = title + type; URL optional; on save it appears in the library to all three.
- **US-2 Organize flexibly.** I can create/rename/delete folders and move resources between
  them, so structure can evolve.
  - *AC:* a resource has exactly one home folder; folders renamable/reorderable; no data lost on
    reorganize.
- **US-3 Tag & find.** I can add multiple tags to a resource and later filter/search by tag,
  folder, type, owner, or status. *(search/filter = SHOULD)*
  - *AC:* a resource may carry 0..n tags; filtering returns all matches.
- **US-4 Ordered vs. unordered collections.** A folder/collection can be marked ordered
  (sequence) or unordered.
  - *AC:* ordering is a per-collection property; ordered collections preserve item order.

### 4.2 Two layers (Learn + Build)
- **US-5 Item type.** Every item is a **Learn** item or a **Build** item (execution milestone),
  so the app tracks both knowledge and real progress.
  - *AC:* type is set on creation and filterable; Build items can exist without a source URL.
- **US-6 Action requirement (optional).** A Learn item may have an attached real-world **action**
  ("do it for real"); some items are pure knowledge with none.
  - *AC:* action attachment is optional per item; if present, completion can require the Applied
    step (see US-9).

### 4.3 Assignment & tasks
- **US-7 Assign.** I can assign any item or folder to any founder (including myself), optionally
  with a deadline.
  - *AC:* assignment creates a task in the assignee's queue; deadline optional; assigner recorded.
- **US-8 Folder as one task.** Assigning a folder creates one queue item showing its resources as
  sub-items with roll-up progress ("3 of 7 done").
  - *AC:* completing sub-items advances the parent's progress; parent completes when its items do.

### 4.4 Lifecycle, progress & collaboration
- **US-9 Lifecycle.** A task moves through Parked → To-do → In progress → Complete, with an
  optional Applied step for action items; anything past deadline shows Overdue.
  - *AC:* state transitions are explicit and logged; "Parked" is distinct from a deadline-less
    To-do; an optional reason can be noted when parking *(reason = COULD)*.
- **US-10 Notes & comments.** Each item has a personal **notes** area and a **comments** thread
  any founder can post to.
  - *AC:* notes/comments persist, are timestamped and attributed; visible per the sharing model.

### 4.5 Notifications & reminders
- **US-11 Auto reminder.** For a task with a deadline, the system sends an automatic reminder
  **24h before**, via email + in-app.
  - *AC:* fires once ~24h prior; no duplicates; skipped if already Complete.
- **US-12 Manual poke.** I can manually send a reminder/nudge for any task on demand.
  - *AC:* triggers email + in-app to the assignee, and offers a **one-tap WhatsApp** (wa.me
    prefilled message to the group).
- **US-13 Event notifications *(SHOULD)*.** New assignment and overdue transitions notify the
  relevant founder(s) via email + in-app.

### 4.6 Dashboard & launch readiness
- **US-14 Shared dashboard.** All three see a fully public dashboard of everyone's tasks,
  progress, and overdue items.
  - *AC:* every founder sees identical visibility into all three queues; overdue clearly marked.
- **US-15 Launch readiness.** A readiness view combines **completed Build milestones** with each
  founder's **self-rated confidence** to show how close the team is to launching.
  - *AC:* confidence is self-rated per topic/overall; readiness reflects both evidence
    (milestones done) and sentiment (confidence).

## 5. Non-functional requirements
- **Private & low-scale:** 3 known users; simple auth; no public sign-up.
- **Fast daily loop:** opening the app and seeing "what's due" must be near-instant.
- **Reliable reminders:** an automatic reminder must not silently fail (email + in-app both).
- **Mobile-friendly:** usable on phones (daily checking happens there).
- **Low/near-zero running cost:** email via a free tier; WhatsApp via free wa.me links.
- **Flexible data model:** folders/tags/types must be user-editable without migrations.
- **Accessible:** legible, keyboard-navigable, sufficient contrast (detailed in Stage 2).

## 6. Glossary
- **Resource** — raw learning material (video, article, course, book, thread) in the library.
- **Item** — a resource or a Build milestone; the unit that can be assigned. Typed **Learn** or
  **Build**.
- **Task** — an assigned item in someone's queue (owner, optional deadline, state, progress).
- **Folder / Collection** — a named group of items; one home per resource; optionally ordered;
  assignable as a unit.
- **Tag** — a free-form cross-cutting label; many per resource.
- **Applied** — optional lifecycle step meaning the learning was done *for real*, not just
  consumed.
- **Parked** — situationally deferred ("not mandatory yet"), distinct from a committed to-do.
- **Launch readiness** — combined view of Build milestones done + self-rated confidence.
- **Poke** — an on-demand manual reminder.

## 7. Open items for later stages
- Exact self-rated-confidence mechanic (scale, cadence) — refine in Stage 2 UX.
- Data/auth/hosting specifics — Stage 3 architecture.

## 8. Sign-off
- **Build milestones (resolved):** kept **simple and blended into the core** — Build items are
  ordinary items typed "Build" in the same library/queue; no separate launch-checklist
  structure in v1. Don't over-complicate now.
- **Founder sign-off:** ✅ Stage 1 approved. Proceed to Stage 2 (UI/UX).
