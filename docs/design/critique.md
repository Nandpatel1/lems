# Design Critique & Go/No-Go — Stage 2 (design-critic)

> Independent review of the Stage 2 package (`ux-research.md`, `information-architecture.md`,
> `visual-language.md`, `interaction-spec.md`, `design-system.md`, and the three approved
> mockups) against the emotional brief, usability heuristics, accessibility, and the critic's
> three Stage-1 problems. Read-only; routes fixes back to the design roles.

## Verdict: **GO — design is ready to build**, with the watch-items below tracked into Stage 3.
The design squarely solves the three hard problems and stays true to the anti-tutorial-hell
thesis. The direction is distinctive without being gimmicky, and it's specified enough for
engineering.

## How it does against the Stage-1 top 3
1. **Anti-tutorial-hell mechanic — SOLVED, structurally.** "Consumption doesn't move launch
   readiness," the "turn learning into an action" moment, and the "learned → applied" ratio are
   three independent, non-gamified forces all pointing at *doing*. Strong.
2. **Never-ready trap — ADDRESSED.** Readiness pairs milestones (evidence) with self-rated
   confidence, and the road-to-launch makes "what's actually left" concrete. Confidence can't
   float free of proof.
3. **Supportive-not-shaming transparency — ADDRESSED.** Amber (not red) overdue, collective-win
   framing, symmetric visibility. Watch it in real use (see Major #1).

## Major — carry into Stage 3, don't lose
1. **Public dashboard tone is still a live risk.** The framing is right on paper, but with 3
   people a single "road to launch" and public queues could still sting a lagging founder. Stage
   3 should let momentum be felt *collectively* first; consider whether individual overdue is
   ever surfaced to others vs. only to self. Validate with the real team after a few weeks.
2. **"Your one thing today" needs a smart, humble picker.** If the algorithm picks the wrong
   "one thing," trust erodes fast. Needs: a transparent reason ("due Fri · unblocks the site")
   and an easy "not this — show me another." Don't ship a black box.
3. **The road-to-launch is only as honest as its inputs.** Milestones must be real and
   editable, and % must reflect genuine progress, or the hero metric becomes vanity. Define how
   % is computed (weighting Build milestones + applied actions) in Stage 3, and let the team
   set/edit milestones.

## Minor
4. Dark theme is specified but only mocked in light + first-pass dark tokens — build a dark pass
   and eyeball contrast before shipping.
5. Empty/first-run states are described, not yet mocked — design them explicitly (they set the
   tone).
6. Confidence self-rating cadence unspecified — avoid nagging for ratings; make it ambient/opt-in.
7. Accessibility is stated (AA, focus rings, no color-only, reduced-motion) — verify in
   implementation, especially amber/green tints against warm surfaces.

## Strengths
- The road-to-launch turns an abstract goal into a felt journey — the best idea in the set.
- Reserving the reward color/motion for *shipping* trains exactly the right instinct.
- Responsive plan is coherent (sidebar↔bottom-nav, two-column↔stacked) and specified in tokens.
- Copy carries the philosophy ("learning is the fuel, shipping is the distance") without clutter.

## Top 3 to carry into Stage 3
1. Define how launch-readiness % is computed, with team-editable milestones (Major #3).
2. Make "your one thing" transparent + overridable (Major #2).
3. Pressure-test public-dashboard tone with the real team; keep lag self-facing where possible
   (Major #1).
