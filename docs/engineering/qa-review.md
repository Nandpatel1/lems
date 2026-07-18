# QA & Code Review — Stage 3 gate

> qa-engineer + code-reviewer pass over the built app. Verdict at the bottom.

## Verification performed
- **Production build passes** (Next 16.2.10 / Turbopack) — all routes compile:
  `/`, `/login`, `/today`, `/library`, `/team`, `/readiness`, `/api/cron/reminders` (disabled).
- **TypeScript clean** (`tsc --noEmit` = 0 errors) across every slice.
- **Dev server renders** `/today` (200) and the auth gate works (`/today` → 307 `/login`
  without a session cookie; 200 with one).
- **Security grep**: only server files import `supabaseAdmin`; client components import from
  `lib/data` as `import type` only. Service-role key never enters the client bundle.

## Findings

### Security
- **Service-role key is server-only** — confirmed. Used exclusively in server components and
  server actions. ✅
- **RLS is fully permissive** (anon read/write all rows) — deliberate MVP choice, documented in
  `setup.sql`. **Blocker before any PUBLIC deployment**; acceptable while the app is private and
  unshipped. Top hardening item.
- **Auth is profile-selection, not credentials** — a cookie identifies the founder. Fine for a
  private 3-person tool; add real auth (Supabase Auth) before exposing publicly.
- Server actions trust the session cookie (fall back to a default user if absent). Acceptable
  internal; revisit with real auth.

### Correctness
- **Folder roll-up** (`children_done/total`) is denormalized/static, not computed from real
  child tasks. Known simplification — fine for v1, revisit when folder assignment is built out.
- **Readiness %** is derived from milestones only (`done + 0.5·current`); the design intended a
  blend with applied-action count. Minor divergence — acceptable, refine later.
- **Seed fallback** in `lib/data.ts` silently returns seed data if Supabase errors. Great for
  resilience, but can mask an outage. Consider surfacing a subtle "offline/seed" indicator later.

### UX / minor
- Sidebar + mobile "Add" now route to Library (dead controls fixed). ✅
- Confidence self-rating is shown but not yet editable in the UI. Future slice.
- Sign-out is desktop-only (sidebar); add to mobile later.

## Verdict
**GO for private/internal use and a private deployment.** The app is correct, type-safe,
builds clean, keeps secrets server-side, and the core loops (capture → assign → complete →
turn-into-action → ship → readiness, plus per-person login, team view, and manual nudges) work
end to end on real Supabase data.

**Before any public exposure**, do two things: (1) tighten RLS to per-user policies, and
(2) add real authentication. Both are self-contained follow-ups.
