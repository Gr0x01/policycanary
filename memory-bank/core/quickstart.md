---
Last-Updated: 2026-03-05
Maintainer: RB
Status: Active
---

# Quickstart: Policy Canary

## Current State

- **Status**: Clawdbot (OpenClaw) live on Vultr VPS. Product onboarding planned. Stripe, blog, cross-reference, auth all shipped.
- **Goal**: Monitor FDA for YOUR specific products, not just your industry
- **GitHub**: https://github.com/Gr0x01/policycanary
- **Clawdbot VPS**: `ssh root@108.61.151.130` — OpenClaw gateway + Discord bot, weekly roundup cron
- **Next**: Session 0 (migration `005_product_categories` + enrichment pipeline update to controlled vocab), then Session 1 (onboarding backend), Session 2 (onboarding frontend)

---

## What's Happening

**Clawdbot (OpenClaw) deployed to Vultr VPS.** Discord bot live on the `Bizniz` server with 5 channels (blog-drafts, linkedin-drafts, weekly-roundup, alerts, clawdbot). Weekly FDA Roundup cron fires Fridays 9 AM ET → drafts blog post → posts to #weekly-roundup for review → publishes to `/blog` on approval. Uses `query-supabase.mjs` to pull enriched items and `publish-blog.mjs` to POST to the blog API. **Product onboarding phase planned.** `product_categories` table (~79 categories) as sacred controlled vocab. **GSRS bootstrap must be re-run** to capture codes. Then re-enrich all items.

---

## Product Model (Product-Centric)

| Layer | What | Who |
|-------|------|-----|
| **Weekly Update** (free) | Generic FDA digest, same for everyone. Content marketing. | Free signups + paid subscribers |
| **Product Intelligence Email** (paid) | Event-driven alerts + weekly all-clear. Custom per subscriber, organized by THEIR products. | Paid subscribers |
| **Web app** (paid) | Search, enforcement DB, trends, archive — personalized to your products | Paid subscribers |

**Pricing:** Monitor $99/mo (5 products included) · Monitor+Research $399/mo (future — not at launch) · +$6/product beyond 5 · Free: 1 product post-trial · Monthly billing · Self-serve up to 100 products · Launch with Monitor tier only

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run type-check       # TypeScript verification

# Testing
npm run test:e2e         # Playwright tests
npm run test:e2e:ui      # Interactive mode

# Data Pipeline — Fetchers (test window: Jan–Feb 2025 for date-ranged fetchers)
npm run pipeline:fr-backfill            # Federal Register backfill
npm run pipeline:enforcement-backfill   # openFDA enforcement/recalls backfill
npm run pipeline:wl-backfill            # Warning letters full backfill (~3,313 records, ~11 min)
npm run pipeline:wl-incremental         # Warning letters incremental (recent, stops on known page)
npm run pipeline:rss-poll               # Poll all 8 FDA RSS feeds

# Data Pipeline — Enrichment
npm run pipeline:enrich                 # Enrich unenriched items (default: 10)
npm run pipeline:enrich-test            # Enrich 5 items (quick test)
npm run pipeline:golden                 # Validate golden fixtures (no LLM calls)
npm run pipeline:golden-enrich          # Re-enrich + validate golden fixtures (costs tokens)
npm run pipeline:content-fetch-test     # Debug: fetch single FDA URL, print extracted text

# One-time seeds
npx tsx scripts/bootstrap-gsrs.ts      # Seed 169K FDA substances (run once)

# Clawdbot (OpenClaw) — VPS at 108.61.151.130
ssh root@108.61.151.130                           # SSH into VPS
systemctl {status|restart} openclaw.service       # Manage gateway
journalctl -u openclaw.service -f                 # Stream logs
# Cron management (run as openclaw user on VPS):
su - openclaw -c 'openclaw cron list'             # List scheduled jobs
su - openclaw -c 'openclaw cron run <jobId>'      # Manually trigger a job
# Local setup script:
./scripts/clawdbot/setup-clawdbot.sh {provision|deploy|configure|cron|ssh|status}
```

---

## Phase Checklist

- [x] Project idea definition
- [x] Market research (competitive landscape, data sources, market opportunity)
- [x] Product vision & positioning (email-first, intelligence lane)
- [x] ~~Pricing validated (segment-based)~~ → superseded by product-level pivot
- [x] Expansion roadmap defined (state compliance → pet food)
- [x] ~~Data schema design (v3, segment-based)~~ — superseded
- [x] Build phase planning (needs revision for product-level model)
- [x] **Product-level pivot** — product-centric model, new pricing research, new market sizing
- [x] Pricing finalization — Monitor $49/mo, Monitor+Research $249/mo, +$6/product
- [x] **Data schema v1** — 25 tables, 9 layers, substances-based matching, flexible classification
- [x] Build phase revision
- [x] **Project setup** — Next.js 16, Supabase, Tailwind v4, AI SDK v6, Inngest
- [x] **Schema live** — 25 tables applied to Supabase, RLS enabled, seeds run
- [x] **Marketing site** — landing, pricing, sample report, signup API. Static-rendered. Visual overhaul: light Stripe-like theme, two-column hero, staggered How It Works with step connectors, radar pulse on urgent dot.
- [x] **Data pipeline: FR + openFDA** — fetchers built, tested. 175 items + 109 enforcement details in DB.
- [x] Data pipeline: Warning Letters + FDA RSS (Phase 2A-2)
- [x] **Auth: Magic link** — `/login`, `/auth/callback`, `/app/dashboard`, `proxy.ts`. Verified end-to-end.
- [x] **Web app MVP (Phase 6)** — feed, item detail, search, products. AppNav, mock data layer (USE_MOCK flag). `/app/dashboard` redirects to `/app/feed`.
- [x] **Enrichment pipeline (Phase 2B)** — stabilized. Content-fetch, prompt fixes, golden tests 10/10.
- [x] **Cross-reference inference layer** — Steps 1b + 1c built. Schema migration applied. Type-check clean. GSRS bootstrap updated. KEY DIFFERENTIATOR.
- [x] **Blog section** — `/blog`, `/blog/[slug]`, RSS feed, Clawdbot POST API. Migration `003_blog_posts`. Code-reviewed (3 critical + 4 warning fixes applied).
- [x] **Stripe subscriptions (Phase 4B)** — checkout, webhook, portal, PricingTable, AppNav upgrade/billing. Triple code-reviewed. Migration `004`. Stripe Dashboard configured (live mode). Commit `497ec6d`.
- [x] Stripe Dashboard setup — products + prices created (Monitor $99, Extra $6), customer portal configured, webhook endpoint pending deploy
- [x] **Product categories taxonomy designed** — ~79 categories from MoCRA, 21 CFR 170.3, DSLD. Sacred controlled vocab — no free text.
- [x] **Clawdbot (OpenClaw) deployed** — Vultr VPS, Discord bot, weekly-roundup cron (Fridays 9 AM ET), blog publish pipeline. `scripts/clawdbot/` in repo.
- [ ] **Session 0: Product categories migration + enrichment update** — migration `005`, seed categories, update `prompts.ts`/`processor.ts`/`cross-reference.ts` to controlled vocab
- [ ] Re-run GSRS bootstrap (captures codes into `substance_codes`)
- [ ] Re-enrich existing items (cross-reference + controlled product categories, one pass)
- [ ] **Session 1: Onboarding backend** — GSRS search utility, ingredient parsing (Gemini Flash), product API routes, GSRS autocomplete
- [ ] **Session 2: Onboarding frontend** — product management page, ingestion UI (photo/paste/URL/manual), confirmation screen, onboarding page
- [ ] Wire fetchers into Inngest (Phase 2C)
- [ ] Product intelligence email MVP
- [ ] Validation — sample emails, trial signups
- [ ] Launch
- [ ] **Expansion:** State compliance layer (month 3-5)
- [ ] **Expansion:** Pet food / animal supplements (month 5-7)

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # used in magic link emailRedirectTo

# LLM
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Email
RESEND_API_KEY=...  # or POSTMARK_SERVER_TOKEN

# Blog (Clawdbot write path)
BLOG_API_KEY=...    # X-API-Key header for POST /api/blog

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_MONITOR=...         # Stripe Price ID for Monitor tier ($99/mo)
STRIPE_PRICE_EXTRA_PRODUCT=...   # Stripe Price ID for per-product overage ($6/mo, deferred)

# Vultr
VULTR_PAT=...                    # Vultr API key for VPS management

# Discord / Clawdbot
CLAWDBOT_TOKEN=...               # Discord bot token
DISCORD_GUILD_ID=...             # Discord server ID
DISCORD_CHANNEL_WEEKLY_ROUNDUP=...
DISCORD_CHANNEL_BLOG_DRAFTS=...
DISCORD_CHANNEL_ALERTS=...
DISCORD_CHANNEL_CLAWDBOT=...     # General chat channel
CLAWDBOT_VPS_IP=...              # Vultr VPS IP
CLAWDBOT_VPS_ID=...              # Vultr instance ID
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| `core/projectbrief.md` | Full product definition, pricing, target customer |
| `core/build-phases.md` | Master implementation plan (needs revision for product pivot) |
| `development/activeContext.md` | Current focus + next steps |
| `development/progress.md` | Work log & milestones |
| `architecture/techStack.md` | Technology decisions & costs |
| `architecture/llm-data-flow.md` | LLM layers, data flow, email generation, onboarding |
| `architecture/llm-data-flow.html` | Visual diagrams (open in browser) |
| `research/competitive-landscape.md` | 20+ competitor profiles |
| `research/data-sources.md` | Full FDA API documentation |
| `research/market-opportunity.md` | Market sizing, MoCRA timelines, enforcement trends |
| `research/product-level-monitoring-research.md` | Product-level competitive gap, buyer analysis, market expansion |
| `research/per-product-pricing-research.md` | Per-product SaaS pricing models, concrete examples |
| `research/product-level-pricing-research.md` | Alert cadence, small brand pricing, trial models |
