# Learning & Execution Management System — Project Memory

> This file is loaded into every Claude Code session in this repo. It is the shared brain
> for the project. Read it before doing anything. Keep it current.

## 1. What we are building

We are 3–4 friends starting a **marketing agency**. Before we take on clients, we want to
develop **deep expertise** across every discipline required to run a world-class agency:
marketing, sales, branding, copywriting, lead generation, paid ads, SEO, content creation,
client acquisition, communication, business operations, automation, and AI tooling.

To do that we consume a huge volume of scattered learning resources (YouTube playlists,
blogs, docs, courses, podcasts, books, X/LinkedIn threads, case studies, templates). Today
these live in different people's heads and DMs, so resources get lost, learning is
inconsistent, and deadlines slip.

The product is a **Next.js web application** that acts as an internal **Learning & Execution
Management System (LEMS)** — an "operating system" for our team's learning journey. It is
**not just a resource library**; every learning item behaves like an accountable task.

### North star
Keep everyone **aligned, accountable, and continuously learning together** — and make the
experience good enough that we stay **consistent**.

## 2. Core product concepts (shared vocabulary)

- **Resource** — the raw material: a playlist, article, course, book, thread. Has a type,
  source URL, topic tags, and an estimated effort.
- **Task / Learning Item** — an *assigned, deadline-bound* unit of consuming a resource.
  Every task has: an **owner**, a **deadline**, a **priority**, **progress tracking**, a
  **completion status**, **notes/learnings**, and an **optional peer review**.
- **Topic** — a subject area (Sales, SEO, Meta Ads, Copywriting, ...).
- **Learning Path** — an ordered/sequenced set of resources within a topic (implies
  dependencies and progression, not just flat tags).
- **Accountability layer** — reminders and notifications (in-app, email, WhatsApp) whose
  purpose is *positive pressure* so work gets done on time, plus visible progress tracking.
  *Currently in-app only — see the WhatsApp note under "Current stage" below.*
- **Team member** — one of the 3–4 founders; can be owner, assignee, or reviewer.

## 3. The three stages (we build in this order — do not skip ahead)

1. **Stage 1 — Discovery & Requirements.** Fully understand the vision, extract Nand's
   already-designed workflow, pressure-test it, research comparable products, and produce a
   crisp, agreed requirements + scope document. **No UI, no code yet.**
2. **Stage 2 — UI/UX.** This is the **most important** stage. If the product doesn't *feel*
   great, the team won't stay consistent and the whole thing fails. Design the experience,
   the emotional/motivational hooks, information architecture, flows, interaction/feel, and
   the visual system — before writing app code.
3. **Stage 3 — Engineering.** Implement the agreed design in Next.js, including the
   automation/notification layer.

Current stage: **Stage 3 — Engineering.** Stages 1 & 2 signed off ✅ (`/docs/discovery/`,
`/docs/design/`). Chosen design: warm light-first "road to launch" concept; responsive
(sidebar↔bottom-nav). Carry-ins: (1) define launch-readiness % with team-editable milestones,
(2) transparent+overridable "your one thing", (3) keep dashboard supportive/self-facing.
Engineering artifacts → `/docs/engineering/` and the app itself.

**Nudges are in-app only (decided 2026-07-28).** WhatsApp was removed from the frontend —
the "Nudge the team" button, the per-member WhatsApp link, `WaNudge`, `NudgeButton` and
`lib/wa.ts` are all gone. Email was never wired up. Don't re-add either without Nand asking;
he'll say if/when it's wanted back. The `pokeTeammate` → bell-notification path is unaffected.

## 4. Specialized agent teams

Each stage has a dedicated team of subagents in `.claude/agents/`. Reasoning-heavy roles run
on **Opus**; execution-heavy roles run on **Sonnet**. Launch a stage with its slash command
(`/discover`, `/design`, `/build`) or invoke an agent by name.

**Stage 1 — Discovery:** `product-strategist`, `business-analyst`, `systems-analyst`,
`market-researcher`, `requirements-critic`.

**Stage 2 — UI/UX:** `ux-researcher`, `ux-architect`, `interaction-designer`,
`visual-designer`, `design-system-engineer`, `design-critic`.

**Stage 3 — Engineering:** `nextjs-architect`, `frontend-engineer`, `backend-engineer`,
`automation-engineer`, `qa-engineer`, `code-reviewer`.

Slash commands live in `.claude/commands/`. `/status` prints where we are.

## 5. Connected tools available to agents

- **Canva MCP** — design generation, brand kits, exports. Used by the Stage 2 design team.
- **HTML/CSS/JS prototyping + headless screenshots** — the Stage 2 team prototypes interactive
  designs in real HTML/CSS and renders/screenshots them to judge feel (see `.claude/README.md`
  for the workflow). Their primary medium for motion and hi-fi mockups.
- **Make.com MCP** — automation scenarios (WhatsApp / email / webhook reminders). Used by
  the Stage 3 `automation-engineer` to build the accountability/notification layer.
- **Web search / fetch** — competitive research, docs, best practices (fonts, icons, refs).

## 6. Tech stack (to be confirmed in Stage 1/3, current default assumptions)

- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS + a design-token system produced in Stage 2.
- **Data/Auth/Notifications:** to be decided with the `nextjs-architect` in Stage 3.
- **Automation:** Make.com scenarios triggered by app webhooks.

## 7. Working principles

- Do not jump to code. Respect the stage gates. Finish and get sign-off on a stage's
  artifacts before starting the next.
- Every substantial task should end with a **verification/critique step** (a critic or
  reviewer agent).
- Keep artifacts in the repo: Stage 1 → `/docs/discovery/`, Stage 2 → `/docs/design/`,
  Stage 3 → the app itself. Create these folders as needed.
- When something important is decided, record it here or in the relevant `/docs` file so the
  next session has context.
