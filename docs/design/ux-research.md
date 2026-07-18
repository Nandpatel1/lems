# UX Research — Emotional Brief, Motivation Model & Experience Direction (Stage 2)

> ux-researcher artifact. Grounded in `/docs/discovery/`. This is the brief every later design
> decision (IA, interaction, visual, system) is designed *against*. Status: draft for review.

## 0. The design problem in one sentence
Make a tool that a busy, motivated-but-distractible founder *wants* to open on a tired evening,
that quietly pushes them from **watching** to **doing**, and that makes three friends feel
they're **building something together** — without ever feeling like homework, a nagging boss,
or a dopamine slot machine.

## 1. Persona (one archetype, three people)
**The Impatient Builder.** High agency, genuinely motivated, wants to run a real agency *soon*.
Consumes a lot of content. Failure mode: mistakes *consuming* for *progress*, over-commits, then
quietly falls off around week 3 when novelty fades and life gets busy. Checks things on their
phone, often at night. Does **not** want to be managed; responds to peers and to visible, real
progress. Is a little afraid of being "the one holding us back."

**What they need emotionally:** clarity (not a wall of tasks), momentum (proof they're moving),
and belonging (we're in this together). **What kills them:** guilt, clutter, and the hollow
feeling of "I watched 5 videos and built nothing."

## 2. The core insight → the anti-tutorial-hell mechanic
Discovery's central reframe: **learning is fuel, not the finish line.** The design must make
that structurally true, not just say it. Concrete mechanics (no gamification):

1. **The headline metric is Launch Readiness, and consumption doesn't move it.** The number the
   whole team stares at is driven by **Build milestones shipped** and **actions Applied** — never
   by hours watched or items marked "read." You can binge content all week and the needle barely
   moves. This one structural choice makes tutorial hell *visibly unproductive* without shaming
   anyone.
2. **"So what will you DO with it?" at the moment of completion.** When a Learn item is marked
   complete, a calm one-tap prompt offers: *Turn into an action* (spawns a Build/action item) or
   *Just knowledge*. Applying is the default-encouraged path; pure knowledge is allowed, not
   forced. This converts watching into doing at exactly the right moment.
3. **Learn and Do sit side by side, and Done-for-real carries the weight.** The satisfying
   visual/motion payoff is reserved for **Applied / shipped** items, not for "watched." The app's
   body language says: finishing a video is fine; shipping the thing is what we celebrate.

> These three are the answer to the critic's Major #1. They are structural, quiet, and
> non-gamified — they change *what the app rewards*, not *how loud it is*.

## 3. Motivation model (no points, no streaks — by founder's choice)
Motivation comes from three honest sources, not from game mechanics:
- **Progress made visible** — the launch-readiness needle and real "we shipped X" evidence.
- **Peer presence** — the shared public dashboard: three people, visibly moving together.
- **Earned satisfaction** — a clean, tactile "done" (and a bigger one for "shipped").
Plus gentle, well-timed reminders (24h-before + manual poke) as a *tap on the shoulder*, never a
buzzer.

## 4. Emotional journey — how each moment must feel
- **Open the app** → *calm clarity.* "Here's today. Three things. You've got this." Never a
  firehose.
- **Start a task** → *frictionless.* One tap in; the resource is right there.
- **Make progress** → *quietly acknowledged.* Small, honest feedback; no fireworks for watching.
- **Complete a Learn item** → *satisfying + a gentle push* to turn it into an action.
- **Apply / ship a Build item** → *the real moment of pride.* This is where the app lets you feel
  it — the weightiest, warmest confirmation in the whole product.
- **Get reminded** → *a friend's nudge,* not a boss's. Helpful, skippable, never guilt-laden.
- **See the team** → *belonging + momentum.* "We're building this together, and it's moving."
- **Fall behind** → *supported, not shamed.* Neutral language, an easy path back in, framed as
  "here's the next small step," never a red wall of failure.

## 5. Supportive-not-shaming transparency (critic Major #3)
The dashboard is fully public (founder's choice) — so the *framing* does all the work:
- **Celebrate collectively, surface individually gently.** Lead with team wins ("4 things shipped
  this week"); show individual lag quietly (soft, neutral, no red/leaderboard ranking).
- **No shame states.** "Overdue" reads as "needs attention," offered with the smallest next step,
  not a scarlet letter.
- **Everyone's queue is equally visible** — symmetry removes the "boss watching worker" dynamic;
  it's peers seeing peers.
- **The never-ready guardrail (critic Major #2):** show self-rated confidence *next to* the
  evidence that backs it (milestones shipped, actions applied), so "I don't feel ready" always
  sits beside "…but look what you've actually built." Grounds feeling in fact without pushing.

## 6. Anti-goals — what this must NEVER feel like
- Homework or a chore list. • A nagging boss / surveillance. • A cluttered, enterprise PM tool.
- A dopamine game (points/streaks/confetti-spam). • A place that makes you feel productive for
  *watching*. • A guilt machine when you're behind.

## 7. Experience direction (proposed — the north for visual/interaction)
Since the founders defer aesthetic taste to the design team, the recommended direction is:

**"Calm focus with earned warmth."** A quiet, premium, uncluttered workspace (in the spirit of
Things / Linear — lots of breathing room, one clear next action) that stays calm under a heavy
load, with deliberate moments of **warmth and pride** reserved for real progress. Dark-mode-first
is a strong fit (evening study sessions). One confident accent color for "forward motion /
shipped," restrained everywhere else so the *content and progress* are the stars.

*Rationale:* the enemy is overwhelm-then-quit; calm and clarity fight that. The reward we want to
amplify is *shipping real work*; reserving warmth for those moments trains the right instinct.

## 8. Handoffs
- → `ux-architect`: design the IA and daily loop so "open → clarity → one tap into the next real
  thing" is the path of least resistance; make Apply/ship reachable and obvious.
- → `interaction-designer`: put the emotional weight on **Applied/shipped**; keep "watched"
  feedback light; design the completion prompt (Mechanic #2) and supportive overdue states.
- → `visual-designer`: express "calm focus with earned warmth," dark-first, one motion/accent for
  progress.
- → `design-critic`: hold the line on the three mechanics and the anti-goals.
