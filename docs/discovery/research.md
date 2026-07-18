# Discovery — Research Findings (living draft)

> Stage 1 · market-researcher artifact. Evidence to inform requirements.

## Notification channels — the "free WhatsApp" question (resolved)

**Question:** can we send proactive reminders (e.g. "deadline in 24h") via WhatsApp for free,
for a 3-person team?

**Finding (2026):** No reliable, terms-compliant free path exists for *proactive* messages.
- WhatsApp Cloud **API access is free**, but Meta bills **messaging** separately.
- Messages are free only when the **user initiates** (a 24-hour "service window") or via
  click-to-WhatsApp ad entry points. Our reminders are **business-initiated**, so they don't
  qualify.
- Since **July 2025**, business-initiated messages are billed **per template** (utility
  category). Cost for our volume is tiny (pennies/month), but it is **not free**.
- The only fully-free route is an **unofficial** library (e.g. WhatsApp Web automation),
  which **violates WhatsApp's Terms** and risks number bans — unsafe for a tool we rely on.

**Cost update (founder approved ~₹100/month budget):** WhatsApp is now IN for v1.
- India **utility** template = **₹0.145/msg + 18% GST ≈ ₹0.17**, and **free** within 24h of the
  user messaging the bot. (Meta shifted to per-delivered-message billing on 1 Jul 2025; India
  billed in INR, rates updated 1 Jan 2026.)
- **Volume math:** low — a 24h-before reminder + occasional manual poke. ~15 msgs/day across 3
  users (~450/mo) ≈ **~₹75/mo**; realistic usage is well under. **₹100/mo budget is ample.**

**Recommendation (v1 channels):**
- **WhatsApp (primary) + Email + in-app.** All three first-class.
- **Send via the official WhatsApp Cloud API, orchestrated through Make.com** (already
  connected) — avoids a paid BSP's monthly platform fee (₹999+/mo); cost = Meta per-message only.

### Free-to-a-group options (researched, with trade-offs)
"Free + group" is only possible by **automating WhatsApp Web with a personal number**:
- **CallMeBot (free, simple)** — does **NOT** support groups (1:1 personal only). Out.
- **PyWhatKit (free, group-capable)** — needs an always-on computer with a browser logged into
  WhatsApp Web; physically drives mouse/keyboard; can't run headless/server. Fragile.
- **whatsapp-web.js / Baileys / Green-API (free, group-capable, server-runnable)** — **violate
  WhatsApp ToS**; the sender number can be **banned**; break on WhatsApp updates. Use a spare #.

**No option is simultaneously free + group + reliable + safe + simple.** Three honest paths:
1. **Official Cloud API — 1:1 DMs, ~₹75/mo** — reliable, safe, easy-ish; not a group.
2. **Unofficial free — real group, ₹0** — ToS/ban risk, fragile, needs a spare number + running
   session.
3. **Assisted manual — ₹0, safe** — app generates a **wa.me prefilled-message link/button** to
   your existing free WhatsApp group; a human taps send. Auto-reminders still go via email +
   in-app; WhatsApp becomes a one-tap manual poke.
**DECISION (founder): Option 3 — Assisted free (wa.me).** Simplest/easiest/fastest: zero setup,
zero cost, zero ban risk. Automatic reminders fire via **email + in-app**; WhatsApp is a
**one-tap "send to group" button** (wa.me prefilled message) to the team's existing free group.
Official Cloud API remains a clean future upgrade for full WhatsApp automation.

**Key constraints to design around (official API path):**
- **No group messaging.** The Cloud API sends **1:1 DMs** from the agency's business number, not
  into a WhatsApp group. Each member gets a personal reminder; shared visibility is handled by
  the in-app dashboard.
- **Setup (one-time):** Meta Business account + a **dedicated sender phone number** (not already
  on normal WhatsApp) + Meta-approved **utility templates**.
- **18% GST** applies on top of Meta charges.

## Behavioral / product patterns (to expand as needed)
- The core risk for this team is **tutorial hell** — see product-vision.md. Design guidance:
  favor *doing/applying* over *consuming*; ground "readiness" in tangible evidence.
- Gamification (streaks/points) deliberately **excluded** — founder wants an efficient personal
  tool, and streaks could reward consumption (worsening tutorial hell).

## Sources
- [WhatsApp Business Platform pricing — Meta for Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [WhatsApp Business API Pricing 2026 — respond.io](https://respond.io/blog/whatsapp-business-api-pricing)
- [WhatsApp Business API Pricing in 2026 — Blueticks](https://blueticks.co/blog/whatsapp-business-api-pricing-2026)
