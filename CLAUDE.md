# Launchpad (LEMS)

Internal Learning & Execution Management System for a 3-founder marketing agency team.
Turns learning resources into assignable, trackable tasks with deadlines and accountability.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 3 · Supabase (Postgres + auth) · Vercel

## Commands

```bash
npm run dev     # start dev server on :3000
npm run build   # production build (catches type errors)
```

## Architecture

```
app/
  (app)/         # authenticated shell — Today, Library, Team, Readiness screens
  login/         # cookie-based founder picker (pre-auth, no passwords yet)
  actions.ts     # ALL Server Actions live here — single file, "use server"
  api/cron/      # Vercel cron endpoints
components/      # client components — one file per component, no barrel exports
lib/
  data.ts        # read-only data layer (server components call this)
  types.ts       # shared TypeScript types
  seed.ts        # in-memory fallback when Supabase env vars are missing
  supabase/      # server-only Supabase client (service-role key)
  session.ts     # cookie-based session helper (lems_uid)
  constants.ts   # CURRENT_USER fallback UUID
supabase/        # SQL migrations — run manually against Supabase dashboard
docs/            # discovery, design, and engineering artifacts
```

## Key Conventions

- **Server Actions in one file.** All mutations go in `app/actions.ts`. Every action returns `ActionResult { ok, error? }` and calls `revalidatePath` after writes.
- **Data reads in `lib/data.ts`.** Server components fetch data here. Every function gracefully falls back to `lib/seed.ts` when Supabase is not configured.
- **Design tokens, not raw colors.** Use the semantic CSS variables defined in `globals.css` (e.g., `--canvas`, `--accent`, `--ship`). These map to Tailwind via `tailwind.config.ts` (e.g., `bg-canvas`, `text-ink`, `border-hair`). Never use raw hex values in components.
- **Dark mode via `[data-theme="dark"]`.** The `ThemeToggle` component flips this attribute. Always test both themes.
- **Path alias `@/*`** maps to project root. Use `@/lib/...`, `@/components/...`.
- **No barrel exports.** Import directly from the component file.
- **Icon library: `lucide-react`.** Don't add other icon packages.
- **Resource details are markdown.** `resources.description` is the only free-text field on a resource — there is no separate `source` column. Render it with `components/Markdown.tsx` (react-markdown + remark-gfm, no `rehype-raw`, so raw HTML stays inert), edit it with `components/MarkdownEditor.tsx`, and derive previews or the site chip with `lib/markdown.ts`.
- **Session:** A `lems_uid` cookie identifies the current founder. No real auth yet.

## Database

- Supabase Postgres. Schema lives in `supabase/setup.sql` with incremental migrations alongside it.
- The app works without Supabase — it falls back to `lib/seed.ts` in-memory data. This is intentional for local dev without env vars.
- SQL files in `supabase/` are run manually via the Supabase SQL editor, not through a migration tool.

## Current Status

Stage 3, slice 1. The app shell, Today screen, Library, Team board, and task lifecycle are built. Coming next: full Supabase auth, realtime subscriptions, notifications (email + WhatsApp + in-app), and the Readiness tracker.

## Gotchas

- `revalidateAll()` in `actions.ts` revalidates all four surfaces. Use it after any deletion since items span multiple views.
- `friendlyError()` in `actions.ts` translates Postgres error codes (23503, 23505, 22P02) into human-readable messages. Extend it when adding new constraint types.
- `supabaseAdmin()` returns `null` when env vars are missing. Always null-check before using.
- The `(app)` route group requires a `lems_uid` cookie — without it, you get redirected to `/login`.
