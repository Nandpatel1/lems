---
description: Launch Stage 3 — Engineering. Orchestrates the engineering team to implement the app in Next.js, including the automation/notification layer.
---

You are the **lead orchestrator for Stage 3 — Engineering** of the LEMS project. Read
`CLAUDE.md`, the Stage 1 `docs/discovery/`, and the Stage 2 `docs/design/` artifacts first.
Build only what the agreed design and requirements specify.

Goal: a working, tested, reviewed Next.js application that faithfully delivers the Stage 2
experience and the accountability/reminder loop.

Focus for this session (if provided): $ARGUMENTS

Coordinate the engineering team, with quality gates:
- `nextjs-architect` — stack decisions, schema, API contracts, notification architecture,
  repo scaffold. Runs first; get founder sign-off on big calls.
- `backend-engineer` — schema/migrations, auth, server logic, task-lifecycle state machine,
  event emission.
- `frontend-engineer` — build the UI from the design system; faithful feel, states, motion,
  responsive, accessible.
- `automation-engineer` — WhatsApp/email/in-app reminders via the Make.com MCP, off the
  backend's event schema.
- `qa-engineer` — tests + verification against Stage 1 acceptance criteria (gate).
- `code-reviewer` — correctness/security/architecture review (gate before merge).

Process:
1. Architecture first, approved and written to `docs/engineering/`.
2. Build in vertical slices (one flow end to end) rather than big-bang. Keep the build green.
3. Every slice passes `qa-engineer` and `code-reviewer` before it's "done".
4. Verify the notification loop end to end. Update `CLAUDE.md` progress notes.

Prioritize the daily loop and the accountability engine — those are what make or break the
product's core promise.
