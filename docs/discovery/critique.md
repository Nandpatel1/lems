# Requirements Critique & Go/No-Go — Stage 1 (requirements-critic)

> Independent red-team of the discovery package (`product-vision.md`, `requirements.md`,
> `workflows.md`, `research.md`). Purpose: find what's missing or risky *before* design starts.

## Verdict: **GO to Stage 2, conditional** on the founder acknowledging the items below.
The package is coherent, faithful to the founder's intent, and — importantly — it correctly
recentered the product on **execution over consumption**. It's ready to design against. The
conditions are acknowledgements/decisions, not blockers requiring more research.

## Blockers — none.

## Major — resolve during Stage 2, don't let them slide
1. **The core promise depends on one un-designed mechanic: how the app keeps you out of
   tutorial hell.** Everything hinges on "favor doing over consuming," but the requirements
   don't yet force it — a founder can still park every action and binge Learn items. *Ask in
   Stage 2:* should the app surface a **consume-vs-apply ratio**, or gently gate a topic as
   "done" only when at least one action is Applied? Decide the concrete anti-tutorial-hell hook.
2. **"Launch readiness = confidence" can become a never-ready trap.** Self-rated confidence with
   no anchor can drift down forever. *Mitigation to design:* weight readiness toward **evidence
   (Build milestones shipped)**, and show confidence *next to* proof so the team can't hide
   behind a feeling. (Founder chose "neutral, no active push" — respect that, but still ground
   it.)
3. **Public dashboard + peer pressure, with only 3 people, cuts both ways.** Full transparency
   can motivate or can breed quiet resentment/guilt that makes someone disengage. *Stage 2 UX
   must* make "behind" feel supportive, not shaming (the nudge-vs-nag line), or the whole
   accountability model backfires.

## Minor — note and move on
4. **Reminders are thin.** Only a 24h-before reminder + manual poke are MUST. If someone ignores
   the 24h ping, nothing escalates. Consider (SHOULD/COULD) an overdue follow-up and a weekly
   digest — already listed; just confirm they're enough.
5. **WhatsApp is manual (one tap).** Acceptable and chosen for simplicity, but it means the
   *automatic* pressure lives entirely in email/in-app. If email gets ignored, accountability
   weakens. Watch this in practice; the official-API upgrade path exists.
6. **Build milestones are under-specified.** "brand, site, socials, content, sales team" are
   treated as generic folders/items. That's fine for v1, but Stage 2 should sanity-check that a
   generic item is enough to track a real deliverable like "hire a sales team."
7. **Scope-vs-original drift is logged** (priority removed, review → comments). Good — just make
   sure `CLAUDE.md`/`requirement.md` readers know the interview supersedes them.

## What's genuinely strong
- The reframe from *learning library* → *execution engine* is the difference between a useful
  product and a tutorial-hell enabler. Caught early. This is the spine of the whole thing.
- Scope is honest and small; WON'T list is disciplined (no gamification, no priority bloat).
- Channel decision is pragmatic, costed, and reversible.

## Top 3 to carry into Stage 2
1. Design the **concrete anti-tutorial-hell mechanic** (Major #1).
2. Design **evidence-grounded readiness** so confidence can't drift (Major #2).
3. Design **supportive (not shaming) transparency** for a 3-person public dashboard (Major #3).
