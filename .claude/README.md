# Claude Code setup — LEMS project

This `.claude/` directory turns the repo into a staged, team-driven build system for the
Learning & Execution Management System. See the root `CLAUDE.md` for the product vision.

## The three stages and their teams

We build in three gated stages. Each stage has a team of specialized subagents (`agents/`)
and a slash command that orchestrates them (`commands/`). Reasoning-heavy roles run on
**Opus**; execution-heavy roles run on **Sonnet**.

### Stage 1 — Discovery & Requirements → `/discover`
Understand the vision, extract the existing workflow, research, and produce agreed specs.
- `product-strategist` (opus) — vision, north star, scope, risks
- `business-analyst` (opus) — requirements, user stories, acceptance criteria
- `systems-analyst` (opus) — data model, task-lifecycle state machine, non-functionals
- `market-researcher` (sonnet) — competitive & behavioral best-practice research
- `requirements-critic` (opus) — red-team gate, go/no-go for Stage 2

### Stage 2 — UI/UX → `/design`  (the most important stage)
Design the experience, the feel, and the visual system before any app code.
- `ux-researcher` (opus) — feelings, personas, motivation model, anti-goals
- `ux-architect` (opus) — information architecture, flows
- `interaction-designer` (opus) — micro-interactions, states, motion, signature moments
- `visual-designer` (sonnet) — visual language, mockups, brand assets — **uses Canva MCP**
- `design-system-engineer` (sonnet) — tokens, component specs, Tailwind theme
- `design-critic` (opus) — UX/UI quality gate, go/no-go for Stage 3

### Stage 3 — Engineering → `/build`
Implement the agreed design in Next.js, including the accountability/automation layer.
- `nextjs-architect` (opus) — stack, schema, API contracts, notification architecture
- `backend-engineer` (sonnet) — schema/migrations, auth, lifecycle logic, event emission
- `frontend-engineer` (sonnet) — the UI, faithful to the design system
- `automation-engineer` (sonnet) — WhatsApp/email/in-app reminders — **uses Make.com MCP**
- `qa-engineer` (sonnet) — tests & verification against acceptance criteria
- `code-reviewer` (opus) — correctness/security/architecture review

`/status` prints where the project stands at any time.

## How to use it

- Type `/discover`, `/design`, or `/build` to launch a stage (optionally with a focus, e.g.
  `/design the daily queue screen`). The command coordinates that stage's agents for you.
- Or invoke any agent directly by name when you want a specific specialist.
- Reviewer/critic agents (`requirements-critic`, `design-critic`, `code-reviewer`) are
  read-only gates — they critique but don't author, and route fixes back to the owners.

## Conventions
- Stage artifacts live in `docs/discovery/`, `docs/design/`, `docs/engineering/`.
- Don't skip stage gates; get founder sign-off before advancing.
- Keep `CLAUDE.md`'s "Current stage" line up to date.

## Connected tools
- **Canva MCP** → design team (mockups, brand kits, exports).
- **Make.com MCP** → automation engineer (reminder/notification scenarios).
- **Web search/fetch** → research across all stages.

## Design prototyping & preview workflow (Stage 2)

The design team prototypes in **real HTML/CSS/JS**, not just static frames — motion and feel
can only be judged when rendered. Prototypes live in `docs/design/prototypes/` and mockups in
`docs/design/visual/`, all self-contained single files (Tailwind via CDN or plain CSS is fine
for prototypes).

**Seeing the work.** Designers must render and look at their output before judging it. Two ways:

**Preferred — Claude in Chrome (live/interactive).** Requires the *Claude in Chrome* extension
to be installed and connected. Open the prototype in a real browser and actually hover, click,
scroll, and watch the motion — the truest test of feel for this product. Use this to review
signature moments, transitions, and interaction states.

**Always-available fallback — headless screenshots.** Works with no extra setup. First run
only, install a headless browser:

```bash
npm i -D playwright && npx playwright install chromium
```

Then screenshot any prototype (example):

```bash
node -e '
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); // mobile-first
  await p.goto("file://" + process.cwd() + "/docs/design/prototypes/daily-queue.html");
  await p.screenshot({ path: "docs/design/prototypes/shots/daily-queue.png" });
  await b.close();
})();'
```

Then `Read` the PNG to view it and iterate. Capture the key frames of a motion and the key
component states so the critic and founder can review without running anything.

Rule of thumb: use **Claude in Chrome** to judge *interaction and motion*, and **screenshots**
to capture reference frames/states for the critic, the founder, and the design handoff.
