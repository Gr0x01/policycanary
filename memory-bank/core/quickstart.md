---
Last-Updated: 2026-03-06
Maintainer: RB
Status: Active
---

# Quickstart: Policy Canary

## Current State

- **Status**: Edit product + delete (remove from monitoring) shipped. Onboarding flow + manufacturer fields shipped. Route group architecture. Pilot program signup live.
- **Goal**: Monitor FDA for YOUR specific products across ALL regulated sectors — not just your industry
- **Sector scope**: ALL FDA sectors (food, supplements, cosmetics, pharma, devices, biologics, tobacco, veterinary). Marketing may focus specific verticals; thinking does not.
- **GTM**: Pilot program (no pricing surfaced). Signup → magic link → onboarding (first_name, last_name, company, role, FEI) → add products (with optional manufacturer/FEI per product) → monitor access (5 products).
- **GitHub**: https://github.com/Gr0x01/policycanary
- **Clawdbot VPS**: `ssh root@108.61.151.130` — OpenClaw gateway + Discord bot. 3 cron jobs: weekly-roundup (Fri 9AM), seo-blog-post (Tue+Thu 10AM)
- **Next**: Session 2 remaining (manual entry tab, product classification). Welcome email, vercel.json cron config, DNS/domain setup.

---

## What's Happening

**Edit product + remove from monitoring shipped.** Users can edit any product field (name, brand, ingredients, manufacturer, type) by reusing the AddProductPanel in edit mode. Delete is a soft-delete ("Remove from Monitoring") with inline confirmation showing active match count. PATCH API expanded to handle full product updates including ingredient replacement + verdict re-evaluation. Both PATCH and DELETE routes now support dev mode (isDev/DEV_USER_ID). Brand-guardian consulted: "Remove from Monitoring" language (not "Delete"), calm confirmation tone, no alarmism.

---

## Product Model (Product-Centric)

| Layer | What | Who |
|-------|------|-----|
| **Weekly Update** (free) | Generic FDA digest, same for everyone. Content marketing. | Free signups + paid subscribers |
| **Product Intelligence Email** (paid) | Event-driven alerts + weekly all-clear. Custom per subscriber, organized by THEIR products. | Paid subscribers |
| **Web app** (paid) | Search, enforcement DB, trends, archive — personalized to your products | Paid subscribers |

**Pricing:** Monitor $99/mo (5 products included) · Monitor+Research $399/mo (future — not at launch) · +$10/product beyond 5 (roadmap to $15-20) · **No free tier** — 14-day reverse trial, then hard cutoff · Monthly billing · Self-serve up to 100 products · Launch with Monitor tier only · All FDA sectors accepted at same price
**Product naming:** Product Intelligence Briefing (paid weekly), Regulatory Alert (urgent), All-Clear Report (weekly no-news), Policy Canary Weekly (free newsletter, content marketing). Never say "email" in product context.
**Pilot program (current GTM):** No pricing shown. Signup → magic link → full Monitor access (5 products). Pricing page hidden from nav, accessible via direct URL with "pilot program active" banner. No Stripe checkout surfaced. Key copy shift: recalls + regulatory deadlines (not warning letters).

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
npm run pipeline:enrich                 # Enrich unenriched items (default: 10, concurrency: 15)
npm run pipeline:enrich-test            # Enrich 5 items (quick test)
npx tsx scripts/run-enrichment.ts --limit 500 --concurrency 15  # Custom batch
npx tsx scripts/run-enrichment.ts --limit 8000 --no-cap         # Full run (removes 2000-item safety cap)
npm run pipeline:golden                 # Validate golden fixtures (no LLM calls)
npm run pipeline:golden-enrich          # Re-enrich + validate golden fixtures (costs tokens)
npm run pipeline:content-fetch-test     # Debug: fetch single source URL, print extracted text

# Inngest (automated pipeline)
npx inngest-cli@latest dev                     # Local Inngest dev server (dashboard: http://localhost:8288)
# daily-ingest: cron 0 6,18 * * * (6 AM + 6 PM UTC) — 4 fetchers parallel + enrichment
# enrich-batch: send event "pipeline/enrich.requested" with { limit?, itemTypeFilter? }

# Verdicts (product-item relevance evaluation)
npx tsx scripts/run-verdicts.ts                    # Backfill verdicts for dev user's products (concurrent)
npx tsx scripts/run-verdicts.ts --user <userId>    # Backfill for specific user

# One-time seeds
npx tsx scripts/bootstrap-gsrs.ts              # Full bootstrap: 169K substances + 950K codes
npx tsx scripts/bootstrap-gsrs.ts --codes-only  # Codes-only backfill (substances already loaded)

# Clawdbot (OpenClaw) — VPS at 108.61.151.130
ssh root@108.61.151.130                           # SSH into VPS
systemctl {status|restart} openclaw.service       # Manage gateway
journalctl -u openclaw.service -f                 # Stream logs
# Cron management (run as openclaw user on VPS):
su - openclaw -c 'openclaw cron list'             # List scheduled jobs
su - openclaw -c 'openclaw cron run <jobId>'      # Manually trigger a job
# Local setup script:
./scripts/clawdbot/setup-clawdbot.sh {provision|deploy|configure|cron|ssh|status}
# Skills on VPS: weekly-roundup, seo-blog-post
# Cron: weekly-roundup (Fri 9AM), seo-blog-tuesday (Tue 10AM), seo-blog-thursday (Thu 10AM)

# SEO Keyword Research
npx tsx scripts/seo-research.ts                  # DataForSEO bulk keyword volume + difficulty
```

---

## Phase Checklist

- [x] Project idea definition
- [x] Market research (competitive landscape, data sources, market opportunity)
- [x] Product vision & positioning (email-first, intelligence lane)
- [x] ~~Pricing validated (segment-based)~~ → superseded by product-level pivot (segments removed from pipeline 2026-03-06)
- [x] Expansion roadmap defined (state compliance → pet food)
- [x] ~~Data schema design (v3, segment-based)~~ — superseded (segment_impacts table dropped)
- [x] Build phase planning (needs revision for product-level model)
- [x] **Product-level pivot** — product-centric model, new pricing research, new market sizing
- [x] Pricing finalization — Monitor $49/mo, Monitor+Research $249/mo, +$6/product
- [x] **Data schema v1** — 22 live tables (originally 25, schema cleanup merged enforcement_details + dropped 5 premature). Substances-based matching, flexible classification
- [x] Build phase revision
- [x] **Project setup** — Next.js 16, Supabase, Tailwind v4, AI SDK v6, Inngest
- [x] **Schema live** — 22 tables in Supabase, RLS enabled, seeds run
- [x] **Marketing site** — landing, pricing, sample report, signup API. Static-rendered. Visual overhaul: light Stripe-like theme, two-column hero, staggered How It Works with step connectors, radar pulse on urgent dot.
- [x] **Data pipeline: FR + openFDA** — fetchers built, tested. 175 items + 109 enforcement details in DB.
- [x] Data pipeline: Warning Letters + FDA RSS (Phase 2A-2)
- [x] **Auth: Magic link** — `/login`, `/auth/callback`, `/app/dashboard`, `proxy.ts`. Verified end-to-end.
- [x] **Web app MVP (Phase 6)** — feed, item detail, search, products. AppNav, mock data layer (USE_MOCK flag). `/app/dashboard` redirects to `/app/feed`.
- [x] **Enrichment pipeline (Phase 2B)** — stabilized. Content-fetch, prompt fixes, golden tests 10/10.
- [x] **Cross-reference inference layer** — Steps 1b + 1c built. Schema migration applied. GSRS bootstrap complete (949K codes, 96 systems). KEY DIFFERENTIATOR.
- [x] **Blog section** — `/blog`, `/blog/[slug]`, RSS feed, Clawdbot POST API. Migration `003_blog_posts`. Code-reviewed (3 critical + 4 warning fixes applied).
- [x] **Stripe subscriptions (Phase 4B)** — checkout, webhook, portal, PricingTable, AppNav upgrade/billing. Triple code-reviewed. Migration `004`. Stripe Dashboard configured (live mode). Commit `497ec6d`.
- [x] Stripe Dashboard setup — products + prices created (Monitor $99, Extra $6), customer portal configured, webhook endpoint live
- [x] **Product categories taxonomy designed** — 119 categories across 8 sectors. Sacred controlled vocab — no free text. Sectors are display-only metadata.
- [x] **Clawdbot (OpenClaw) deployed** — Vultr VPS, Discord bot, blog publish pipeline. `scripts/clawdbot/` in repo. 3 cron jobs: weekly-roundup (Fri 9AM), seo-blog-tuesday (Tue 10AM), seo-blog-thursday (Thu 10AM).
- [x] **SEO keyword research + content strategy** — DataForSEO API, 5 target keyword clusters, seo-blog-post skill deployed. Content marketing plan updated with data.
- [x] **Session 0: Product categories migration + enrichment update** — migration applied (82 categories), pipeline uses controlled slugs, golden tests 10/10
- [x] GSRS bootstrap complete — 949K codes, 96 code systems, 166K substances with codes
- [x] **DSLD database loaded** — 214K products, 2M ingredients, 1.47M statements, 253K companies. pg_trgm typeahead (12ms). `scripts/bootstrap-dsld.ts`.
- [x] **Backfills complete** — 7,572 items (2-year FR + enforcement, full WL, RSS). `run-fetcher.ts` supports `--start`/`--end`.
- [x] **Enrich all items** — 7,573/7,573 enriched, 0 errors. Honest classification (all FDA sectors), concurrent (p-limit @ 15), content-fetch expanded to all source URLs.
- [x] **Session 1: Onboarding backend (API routes)** — DSLD search/detail, product CRUD, substance resolution, plan limits. Triple code-reviewed.
- [x] **Schema cleanup** — enforcement_details merged into regulatory_items, dropped 5 premature empty tables (trend_signals, item_relations, user_bookmarks, email_campaign_items). 33→28 tables.
- [ ] **Session 1b: Onboarding backend (remaining)** — ingredient parsing (Gemini Flash), GSRS search utility, product classification
- [x] **Session 2: Onboarding flow + manufacturer fields** — `/app/onboarding` (first_name, last_name, company, role, FEI). Route groups `(main)` / `(onboarding)`. Manufacturer name + FEI per product. Migrations: `add_onboarding_and_manufacturer_fields`, `split_name_into_first_last`. Brand/UI/arch consulted.
- [x] **Edit product + remove from monitoring** — AddProductPanel reused in edit mode, PATCH API expanded (ingredients, manufacturer, product_type), soft-delete with inline confirmation, brand-guardian reviewed
- [ ] **Session 2 remaining** — manual entry tab, product classification, product detail image display
- [x] **Inngest pipeline orchestration (Phase 2C minimal)** — daily-ingest cron (twice daily, 4 parallel fetchers + enrichment), enrich-batch (on-demand). Code-reviewed.
- [x] **Product matching engine (Phase 4C)** — query module with relevance scoring. Substance matches (substance_id JOIN) + category matches (product_type tags). IDF-like specificity weighting. 3 Postgres RPCs, 15-min cache. No new tables.
- [x] **Lifecycle state system** — `src/lib/utils/lifecycle.ts`. Items classified urgent/active/grace/archived via deadline-first decision tree. Feed defaults to live items. Products page splits active vs resolved history. No DB changes.
- [x] **Verdict system** — `src/lib/products/verdicts.ts`. Gemini Flash evaluates item-product relevance. Tightened prompt filters brand-specific recall noise. Three triggers: post-enrichment, post-product-add, CLI backfill (`scripts/run-verdicts.ts`).
- [x] **App pages → real data** — feed, item detail, products wired to real DB. Mocks removed. Search hidden.
- [x] **Full re-enrichment (2026-03-06)** — 7,566/7,574 re-enriched, 979 cross-refs, 669 verdicts. Tightened prompts. `server-only` removed from `admin.ts`.
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

# Inngest
INNGEST_SIGNING_KEY=...          # Required in Vercel for production (not needed locally)
INNGEST_EVENT_KEY=...            # Required if sending events from outside serve handler

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

# DataForSEO
DATAFORSEO_LOGIN=...             # DataForSEO API login
DATAFORSEO_PASSWORD=...          # DataForSEO API password
DATAFORSEO_BASE64=...            # Base64-encoded login:password
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
