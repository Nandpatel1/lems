# Launchpad — Learning & Execution Management System

An execution engine that turns learning into real work on the road to launching our agency.
Built for 3 founders. Not a resource library — the enemy is tutorial hell.

See `/docs` for the full discovery, design, and engineering artifacts, and `CLAUDE.md` for
project context.

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to the **Today** screen.

Toggle light/dark with the sun/moon button (bottom of the sidebar, or the top bar on mobile).
Resize the window to see the responsive layout (sidebar + two columns on desktop, single column
+ bottom nav on mobile).

## Status (Stage 3, slice 1)

- ✅ Next.js + TypeScript + Tailwind scaffold
- ✅ Design tokens (light + dark) wired into Tailwind
- ✅ Responsive app shell (sidebar ↔ bottom nav)
- ✅ Today screen on seed data (road to launch, your one thing, queue)
- ⏳ Next: Supabase (data + auth + realtime), Library + capture, task lifecycle, readiness,
  notifications (email + in-app + wa.me + 24h reminder)

Currently runs on in-memory seed data (`lib/seed.ts`) — no accounts or database needed yet.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (next) · Resend (next) · Vercel (deploy).
