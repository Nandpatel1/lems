# Interaction & Motion Spec (Stage 2)

> interaction-designer artifact. Built on the emotional brief + approved visual language.
> Principle: calm and quick everywhere; the biggest, warmest beat is reserved for *shipping*.

## Motion language (tokens)
- **Durations:** instant 100ms · quick 160ms · base 220ms · ship 420ms (the one indulgent beat).
- **Easing:** `ease-out` (cubic-bezier(0.2,0.8,0.2,1)) for entrances; `ease-in-out` for moves.
- **Distance:** small (4–12px) translations; scale changes ≤ 1.03. Nothing bouncy except the
  ship moment (a single gentle overshoot).
- **Reduced motion:** every animation has a cross-fade / instant equivalent; no parallax, no
  large movement. Respect `prefers-reduced-motion`.

## Signature moments
1. **Ship it (Applied/Build complete)** — the emotional peak. On mark-shipped: the card lifts
   slightly and fills with the green reward tint (420ms, one soft overshoot); the **road-to-launch
   fill animates forward** to its new %, and the milestone dot advances. A short, warm line:
   "That's real progress." No confetti, no sound, no points. Weight comes from the road moving.
2. **Turn learning into action** — on completing a Learn item, the completion sheet rises (base,
   ease-out); the "turn it into an action" option is visually primary (violet), "just knowledge"
   is quiet. Choosing action spawns a Build item with a gentle slide into the queue.
3. **Everyday complete (Learn)** — a check draws in (quick), the row settles and de-emphasizes.
   Honest and small — finishing a video is fine, but it doesn't get the ship celebration.

## Component states (every interactive element defines all)
default · hover · focus-visible (2px violet ring, offset) · active (scale 0.98) · loading
(skeleton, never spinner-on-empty) · empty · error · disabled · **overdue** (amber, supportive).

## Key state treatments
- **Empty / first-run:** warm, inviting — "Add your first resource" with one clear action; never
  "Nothing here yet." Sets tone; prevents the cold-app feeling.
- **Overdue:** amber accent + a "pick it back up" affordance that deep-links to the item and its
  smallest next step. Never red, never a shame wall.
- **Loading:** content-shaped skeletons; the daily loop should feel instant (optimistic UI on
  complete/progress — update immediately, reconcile in background).
- **Reminder → action:** a notification (in-app/email) deep-links straight to the item; one tap
  resolves. Manual poke and the one-tap WhatsApp (wa.me prefilled) share the same affordance.

## Micro-interactions
- Progress bars/rings animate to value (base) on change, not on mount-spam.
- Folder roll-up: completing a sub-item ticks the parent count with a quick count-up.
- Buttons: 0.98 active press; primary (violet) only one per view (the next real action).
- Confidence self-rating: a calm slider/segmented control; updating it nudges the readiness view
  but always shows the evidence (milestones) beside it.

## Responsive interaction
- **Desktop/laptop:** hover states active; sidebar persistent; two-column Today; keyboard
  shortcuts (n = new, arrows to move through queue, enter to open). Denser secondary lists.
- **Mobile:** bottom tab nav; single column; larger 44px+ hit targets; swipe on a row for
  quick complete/snooze; the focus card and road-to-launch stack full width. No hover reliance.
