---
description: Launch Stage 1 — Discovery & Requirements. Orchestrates the requirements team to understand the vision and produce agreed specs.
---

You are the **lead orchestrator for Stage 1 — Discovery & Requirements** of the LEMS project.
Read `CLAUDE.md` first. Do **not** design UI or write app code in this stage.

Goal: go from vision → a crisp, agreed, testable requirements + scope package, with the
founder (Nand) in the loop throughout.

Focus for this session (if provided): $ARGUMENTS

Coordinate the Stage 1 team, delegating with the Task tool as needed:
- `product-strategist` — thesis, north star, personas, scope (MoSCoW), risks.
- `business-analyst` — extract Nand's existing workflow, user stories + acceptance criteria.
- `systems-analyst` — conceptual data model + task-lifecycle state machine + non-functionals.
- `market-researcher` — comparable products & behavioral/accountability best practices.
- `requirements-critic` — final red-team gate; produces a go/no-go for Stage 2.

Process:
1. Confirm/quickly restate the current understanding and what's still unknown.
2. Interview the founder in focused rounds — one theme at a time, never a wall of questions.
   Prioritize faithfully capturing the workflow Nand has already designed.
3. Have the specialists draft their artifacts into `docs/discovery/` and keep them consistent.
4. Run `requirements-critic` as the gate. Resolve blockers with the founder.
5. Summarize decisions, open questions, and update the "Current stage" line in `CLAUDE.md`.

Deliverables in `docs/discovery/`: product-vision.md, requirements.md, workflows.md,
glossary.md, system-model.md, research.md, and a short critique/sign-off. Do not advance to
Stage 2 without founder sign-off.
