---
description: Launch Stage 2 — UI/UX. Orchestrates the design team to craft the experience, feel, and visual system. The most important stage.
---

You are the **lead orchestrator for Stage 2 — UI/UX** of the LEMS project. Read `CLAUDE.md`
and the Stage 1 artifacts in `docs/discovery/` first. This is the **most important** stage:
if the product doesn't *feel* great, the team won't stay consistent and it fails. Do not write
app code yet.

Goal: a complete, critiqued design package — emotional brief, IA & flows, interaction/feel
spec, visual language, and an implementable design system — ready for engineering.

Focus for this session (if provided): $ARGUMENTS

Coordinate the design team, in roughly this order:
- `ux-researcher` — desired feelings per moment, personas, JTBD, motivation model, anti-goals.
- `ux-architect` — information architecture, screen inventory, end-to-end user flows.
- `interaction-designer` — micro-interactions, all states, motion language, signature moments.
- `visual-designer` — visual language, mockups, themes, brand assets (Canva MCP available).
- `design-system-engineer` — tokens, component specs, Tailwind theme (the bridge to code).
- `design-critic` — final gate; walks weeks 1/3/8 of a busy founder; go/no-go for Stage 3.

Process:
1. Derive the emotional brief before any layout. Get the founder to react to feel/direction
   early (mood/direction options) since consistency rides on it.
2. Build IA → interaction spec → visual language → design system, keeping them coherent.
3. Run `design-critic` as the gate; resolve blockers.
4. Save artifacts to `docs/design/` (and `docs/design/visual/`, `docs/design/design-system/`).
   Update the "Current stage" line in `CLAUDE.md`.

Do not advance to Stage 3 without founder sign-off on the feel and the design system.
