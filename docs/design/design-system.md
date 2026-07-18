# Design System (Stage 2 → Stage 3 handoff)

> design-system-engineer artifact. The single source of truth for engineering. Encodes the
> approved visual language + interaction spec as tokens, components, responsive rules, and a
> Tailwind theme. Light is primary; dark ships alongside.

## 1. Design tokens

### Color — light (primary)
| Token | Value | Role |
|---|---|---|
| `--canvas` | `#FBF9F5` | page background (warm off-white) |
| `--surface` | `#FFFFFF` | cards |
| `--surface-soft` | `#F3EFE8` | sidebar, chips, wells |
| `--text` | `#221F1A` | primary text |
| `--text-secondary` | `#6E6860` | supporting text |
| `--text-muted` | `#A39C90` | meta, hints |
| `--border` | `#EBE6DC` | hairline |
| `--border-strong` | `#DED8CC` | emphasized |
| `--accent` | `#5A43C9` | forward / primary (violet) — **one per view** |
| `--accent-tint` | `#ECE9FB` | accent fill |
| `--accent-ink` | `#45329B` | text on accent tint |
| `--warm` | `#B9791A` | attention / deadlines (amber) |
| `--warm-tint` | `#F7EBD4` | warm fill |
| `--warm-ink` | `#8A5A12` | text on warm tint |
| `--ship` | `#2E7D46` | applied / shipped reward (green) |
| `--ship-tint` | `#E4F0E5` | ship fill |
| `--ship-ink` | `#245E36` | text on ship tint |

### Color — dark (companion)
| Token | Value |
|---|---|
| `--canvas` | `#1A1712` (warm near-black, not pure) |
| `--surface` | `#242019` |
| `--surface-soft` | `#2E2A22` |
| `--text` | `#F3EEE4` |
| `--text-secondary` | `#B7AF9F` |
| `--text-muted` | `#847C6E` |
| `--border` | `#332E26` |
| `--border-strong` | `#443E33` |
| `--accent` | `#9385EC` · `--accent-tint` `#2C2647` · `--accent-ink` `#C6BDF6` |
| `--warm` | `#E0A64A` · `--warm-tint` `#3A2E1A` · `--warm-ink` `#E8C583` |
| `--ship` | `#6FBF8A` · `--ship-tint` `#1E3326` · `--ship-ink` `#9BD7AF` |

### Type
- Family: Inter / system sans (ship: `font-sans`). Weights **400, 500 only**.
- Scale (px): title 21 · screen 19 · card 16 · body 14 · small 13 · meta 12 · micro 11.
- Line-height 1.5–1.7; sentence case everywhere.

### Space / shape / motion
- Space scale (px): 4, 8, 12, 16, 20, 24, 32.
- Radius: pill 999 · card 14 (hero 18) · control 9 · chip 6.
- Borders: 0.5px hairline. No shadows/gradients; depth via spacing + surface tints.
- Motion: `--dur-instant 100 · quick 160 · base 220 · ship 420`; ease-out entrances. Reduced-
  motion equivalents required.

## 2. Responsive rules
- **Breakpoints:** mobile `<640` · tablet `640–1024` · desktop `>1024`.
- **Navigation:** desktop/tablet = **persistent left sidebar**; mobile = **bottom tab bar**.
- **Today layout:** desktop = road-to-launch full width + two columns (focus card | queue);
  mobile = single column, stacked (readiness → one thing → list).
- **Library:** desktop = folder tree + grid; mobile = folders as a top scroller + single-column
  cards.
- **Hit targets:** ≥ 44px on mobile; hover states desktop-only (never hover-dependent).
- **Content max-width** on large screens ~1100px so lines don't over-stretch.
- Mobile-first CSS; enhance up. Every screen verified at 390px and 1440px.

## 3. Component library (contract for engineering)
Each component lists variants · states (all from interaction-spec) · notes.
- **AppShell** — Sidebar (desktop) / BottomNav (mobile) + content region.
- **TaskRow** — variants: Learn · Build · Parked; shows chip, title, meta, trailing status;
  states incl. overdue (amber), complete. Swipe actions on mobile.
- **FocusCard** ("your one thing") — violet-tinted; primary Start button; effort estimate.
- **RoadToLaunch** — segmented progress track + milestone dots + marker + "next" label; animates
  on ship. The hero motif.
- **ReadinessMeter** — milestones + self-rated confidence side by side (evidence beside feeling).
- **RatioChip** — "learned → applied" this-week signal.
- **TypeChip** — Learn (accent) · Build (accent) · Parked (neutral) · Applied (ship).
- **FolderItem** — roll-up progress bar + "n / m".
- **CompletionSheet** — the "turn into an action" moment; primary=action, secondary=knowledge.
- **Reminder/Toast** — deep-links to item; poke + one-tap WhatsApp (wa.me) share affordance.
- **Comment/Note** — per-item thread + personal notes.
- **EmptyState** — warm, inviting, one action.
- **Button** — primary (violet, one per view) · secondary (hairline) · ghost; 0.98 active.
- **Confidence control** — calm slider/segmented; updates readiness.

## 4. Tailwind theme (starter for Stage 3)
```js
// tailwind.config.js — theme.extend
colors: {
  canvas: 'var(--canvas)', surface: 'var(--surface)', 'surface-soft': 'var(--surface-soft)',
  ink: 'var(--text)', 'ink-2': 'var(--text-secondary)', 'ink-3': 'var(--text-muted)',
  hair: 'var(--border)', 'hair-strong': 'var(--border-strong)',
  accent: 'var(--accent)', 'accent-tint': 'var(--accent-tint)', 'accent-ink': 'var(--accent-ink)',
  warm: 'var(--warm)', 'warm-tint': 'var(--warm-tint)', 'warm-ink': 'var(--warm-ink)',
  ship: 'var(--ship)', 'ship-tint': 'var(--ship-tint)', 'ship-ink': 'var(--ship-ink)',
},
borderRadius: { chip: '6px', control: '9px', card: '14px', hero: '18px' },
transitionDuration: { instant: '100ms', quick: '160ms', base: '220ms', ship: '420ms' },
fontWeight: { normal: '400', medium: '500' },
```
Tokens live as CSS variables in `:root` (light) and `[data-theme="dark"]` (dark), so the theme
above auto-adapts. Accessibility: contrast ≥ WCAG AA, focus-visible rings on all controls,
never color-only signaling (pair with icon/label), reduced-motion honored.
