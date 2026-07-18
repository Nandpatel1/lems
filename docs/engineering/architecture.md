# Architecture (Stage 3) — LEMS

> nextjs-architect artifact. Turns the Stage 1 requirements + Stage 2 design into a concrete,
> low-cost, maintainable technical plan. Status: draft (stack confirmed with founder — Supabase).

## 1. Stack (confirmed)
- **Next.js (App Router) + TypeScript + Tailwind** — app + server (Server Actions / Route
  Handlers). Tailwind theme = the Stage 2 design tokens (light + dark).
- **Supabase** — Postgres (data), Auth (login for 3 founders), Row-Level Security (visibility
  rules), Realtime (live shared dashboard). Free tier.
- **Drizzle ORM** — type-safe schema + queries against Supabase Postgres; migrations in-repo.
- **Resend** — transactional email (reminders, digests). Free tier.
- **wa.me links** — one-tap WhatsApp poke to the team group (client-side, free).
- **Vercel** — hosting + **Vercel Cron** for the 24h-before reminder job. Free hobby tier.

Rationale: relational data + built-in auth/realtime/RLS = less to build; everything on free
tiers; all standard and maintainable by a small team. Make.com remains an optional future path
for richer automation but is **not** required for v1.

## 2. Why this shape
- **Server Actions** for mutations (create/assign/progress/complete/comment) — simple, typed, no
  hand-written API layer for the app's own UI.
- **Route Handlers** only for external triggers: the Vercel Cron reminder endpoint (secured) and
  any webhook we add later.
- **RLS** encodes the supportive-visibility rule at the database: everyone can *read* all three
  queues (public dashboard), but "who's behind" emphasis is a UI concern; write access is scoped
  to the actor. Keeps data safe without trusting the client.
- **Realtime** powers the Team dashboard and in-app notifications without polling.

## 3. Folder structure
```
/app
  /(app)               authed shell: sidebar (desktop) / bottom-nav (mobile)
    /today  /library  /team  /readiness  /item/[id]
  /api/cron/reminders  secured route hit by Vercel Cron
  /auth                login / callback
/components            design-system components (TaskRow, RoadToLaunch, FocusCard, ...)
/lib
  /db  (drizzle schema + client)   /auth   /email (resend)   /notifications   /readiness
/db/migrations
/styles (tokens.css: :root light, [data-theme=dark])
```

## 4. Notification architecture
Event-driven, minimal:
- App events (assigned, deadline-approaching, overdue, completed, commented) write a
  **notification row** (in-app) and, where relevant, enqueue an **email** via Resend.
- **24h-before reminder:** Vercel Cron hits `/api/cron/reminders` hourly → query tasks whose
  deadline is ~24h out and not yet reminded → send email + create in-app notification → mark
  reminded (idempotent; no duplicates).
- **Manual poke:** a Server Action sends email + in-app now, and the UI offers a **wa.me** link
  (prefilled message) to the group — one tap, no cost.
- **In-app delivery:** Supabase Realtime pushes new notification rows to the client instantly.

## 5. Launch-readiness computation (critic carry-in #1)
- Milestones are **team-editable** rows (default seed: brand, website, socials, content, sales
  team) — not hardcoded. (Founder deferred; editable chosen as the safe, flexible default.)
- **Readiness %** = weighted blend of Build-milestone completion + count of Learn items *Applied*
  (evidence), shown beside each founder's **self-rated confidence** (sentiment). Consumption
  (items merely marked read) does **not** contribute — the anti-tutorial-hell rule, enforced in
  the query, not just the UI.

## 6. "Your one thing today" (critic carry-in #2)
Transparent + overridable: pick the highest-value actionable task (prefer a Build/ship item due
soonest / unblocking a milestone), **show the reason** ("due Fri · unblocks the site"), and give
a "not this — show another" control. No black box.

## 7. Non-functionals
- Env/secrets via Vercel + `.env.local` (never committed). Migrations forward-only, reviewed.
- Optimistic UI on the daily loop; content-shaped skeletons. Mobile-first; verified 390px/1440px.
- Tests: unit (lifecycle, readiness calc, reminder selection), integration (server actions),
  e2e (capture→assign→complete→apply; reminder→action). Accessibility AA.

## 8. Build order (vertical slices, each QA'd + reviewed)
1. Scaffold + auth + app shell + tokens.
2. Library + capture (resources, folders, tags).
3. Items → assign → Today queue → lifecycle (incl. folder roll-up, parked, applied).
4. Turn-into-action moment + notes/comments.
5. Readiness (road-to-launch, editable milestones, confidence) + Team dashboard (realtime).
6. Notifications (in-app + email + wa.me + 24h cron).
7. Polish (dark theme, empty states, motion) → QA + code review gate.
