---
Last-Updated: 2026-03-19
Maintainer: RB
Status: Active
---

# Quickstart: Policy Canary

## Current State

- **Status**: Core product built. All 45 intelligence pages published. Email pipeline, enrichment, matching, verdicts, onboarding, analytics (PostHog + Sentry) all live.
- **Goal**: Monitor FDA for YOUR specific products across ALL regulated sectors — not just your industry
- **Sector scope**: ALL FDA sectors (food, supplements, cosmetics, pharma, devices, biologics, tobacco, veterinary). Marketing may focus specific verticals; thinking does not.
- **GTM**: Pilot program (no pricing surfaced, `/pricing` redirects to `/` via proxy). Signup → magic link → onboarding (first_name, last_name, company, role, FEI) → add products (with optional manufacturer/FEI per product) → monitor access (5 products).
- **GitHub**: https://github.com/Gr0x01/policycanary
- **Anton (Pi 5)**: STOPPED. Service disabled 2026-03-12. Content workflows migrated to Claude Cowork (Desktop). Pi available if needed: `ssh gr0x@10.2.0.40 "sudo systemctl enable --now anton.service"`. See `architecture/clawdbot.md`.
- **Cowork workspace**: `~/cowork/policy-canary/` — context files, prompt templates, Supabase schema. Replaces Anton for content generation, lead finding, outreach. Runs on subscription, not API tokens.
- **Next**: Launch prep.

---

## What's Happening

**Code audit complete. Launch prep.** Full codebase audit shipped 26 fixes (9 commits) across pipeline, email, API, frontend, and DB. Sentry now catches all previously-swallowed errors. Fetcher dedup batched. Email tracking works for paid users. Inngest sends fanned out. Schema objects version-controlled. See `development/code-audit-fixes.md` for full tracker.

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

# Data Pipeline — Fetchers (7 sources, test window: Jan–Feb 2025 for date-ranged fetchers)
npm run pipeline:fr-backfill            # Federal Register backfill
npm run pipeline:enforcement-backfill   # openFDA enforcement/recalls backfill
npm run pipeline:wl-backfill            # Warning letters full backfill (~3,313 records, ~11 min)
npm run pipeline:wl-incremental         # Warning letters incremental (recent, stops on known page)
npm run pipeline:rss-poll               # Poll all 8 FDA RSS feeds
npx tsx scripts/pipeline/run-fetcher.ts ia-backfill          # Import alerts (all ~154)
npx tsx scripts/pipeline/run-fetcher.ts ia-incremental       # Import alerts (new only)
npx tsx scripts/pipeline/run-fetcher.ts guidance-backfill    # Guidance documents (all ~2,761)
npx tsx scripts/pipeline/run-fetcher.ts guidance-incremental # Guidance documents (new only)
npx tsx scripts/pipeline/run-fetcher.ts regs-backfill --start 2025-01-01 --end 2026-03-09  # Regulations.gov
npx tsx scripts/pipeline/run-fetcher.ts regs-incremental     # Regulations.gov (last 14 days)

# Data Pipeline — Enrichment
npm run pipeline:enrich                 # Enrich unenriched items (default: 10, concurrency: 15)
npm run pipeline:enrich-test            # Enrich 5 items (quick test)
npx tsx scripts/pipeline/run-enrichment.ts --limit 500 --concurrency 15  # Custom batch
npx tsx scripts/pipeline/run-enrichment.ts --limit 8000 --no-cap         # Full run (removes 2000-item safety cap)
npm run pipeline:classify               # Classify unclassified products into categories
npm run pipeline:golden                 # Validate golden fixtures (no LLM calls)
npm run pipeline:golden-enrich          # Re-enrich + validate golden fixtures (costs tokens)
npm run pipeline:content-fetch-test     # Debug: fetch single source URL, print extracted text

# Inngest (automated pipeline)
npx inngest-cli@latest dev                     # Local Inngest dev server (dashboard: http://localhost:8288)
# daily-ingest: cron 0 6,18 * * * (6 AM + 6 PM UTC) — 7 fetchers parallel + enrichment
# enrich-batch: send event "pipeline/enrich.requested" with { limit?, itemTypeFilter? }
# send-weekly-emails: cron 0 14 * * 5 (Fri 2pm UTC) — newsletter content gen + paid briefings + free newsletters
# weekly-snapshot: cron 0 14 * * 5 (Fri 2pm UTC) — intelligence snapshot

# Verdicts (product-item relevance evaluation)
npx tsx scripts/pipeline/run-verdicts.ts                    # Backfill verdicts for dev user's products (concurrent)
npx tsx scripts/pipeline/run-verdicts.ts --user <userId>    # Backfill for specific user

# One-time seeds
npx tsx scripts/bootstrap/bootstrap-gsrs.ts              # Full bootstrap: 169K substances + 950K codes
npx tsx scripts/bootstrap/bootstrap-gsrs.ts --codes-only  # Codes-only backfill (substances already loaded)

# Anton (DORMANT — Pi 5 at 10.2.0.40)
# Service stopped and disabled 2026-03-12. Content workflows → Claude Cowork.
# Restore if needed:
ssh gr0x@10.2.0.40 "sudo systemctl enable --now anton.service"

# Content automation now via Claude Cowork (Desktop app)
# Workspace: ~/cowork/policy-canary/
# Prompt templates: prompts/{weekly-roundup,seo-blog,linkedin,lead-finder}.md
# Context: context/{about,brand-voice,anti-slop,seo-keywords,supabase-schema}.md
# MCP: Supabase (replaces .mjs scripts). Web search built in.

# Intelligence pages (backfill + publish)
npx tsx scripts/backfill/gather-ingredient-data.ts        # Gather data for 25 substances (no LLM)
npx tsx scripts/backfill/gather-enforcement-data.ts       # Gather enforcement data by company
npx tsx scripts/backfill/gather-regulation-data.ts        # Gather regulation data (10 regs)

# SEO Keyword Research
npx tsx scripts/outreach/seo-research.ts          # DataForSEO bulk keyword volume + difficulty
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
- [x] **Clawdbot (OpenClaw) deployed** — Vultr VPS, Discord bot, blog publish + LinkedIn draft pipelines. `scripts/clawdbot/` in repo. 4 cron jobs: weekly-roundup (Fri 9AM), seo-blog-tuesday (Tue 10AM), linkedin-monday (Mon 10AM), linkedin-wednesday (Wed 10AM).
- [x] **SEO keyword research + content strategy** — DataForSEO API, 5 target keyword clusters, seo-blog-post skill deployed. Content marketing plan updated with data.
- [x] **Session 0: Product categories migration + enrichment update** — migration applied (82 categories), pipeline uses controlled slugs, golden tests 10/10
- [x] GSRS bootstrap complete — 949K codes, 96 code systems, 166K substances with codes
- [x] **DSLD database loaded** — 214K products, 2M ingredients, 1.47M statements, 253K companies. pg_trgm typeahead (12ms). `scripts/bootstrap-dsld.ts`.
- [x] **Backfills complete** — ~11,680 items across 7 sources (FR, openFDA, WL, RSS, import alerts, guidance docs, regulations.gov). `run-fetcher.ts` supports `--start`/`--end`.
- [x] **All items enriched** — ~11,680 enriched across 7 sources. Phase 2 added 4,093 items (IA 154, GD 2,761, Regs 1,178). 0 errors on guidance, 3 token-limit errors total.
- [x] **Session 1: Onboarding backend (API routes)** — DSLD search/detail, product CRUD, substance resolution, plan limits. Triple code-reviewed.
- [x] **Schema cleanup** — enforcement_details merged into regulatory_items, dropped 5 premature empty tables (trend_signals, item_relations, user_bookmarks, email_campaign_items). 33→28 tables.
- [x] **Session 1b: Onboarding backend** — ingredient parsing (Gemini Flash vision + raw text), label scanning, DSLD search/detail, GSRS substance resolution (`/api/products/resolve-ingredient`). All done.
- [x] **Session 2: Onboarding flow + manufacturer fields** — `/app/onboarding` (first_name, last_name, company, role, FEI). Route groups `(main)` / `(onboarding)`. Manufacturer name + FEI per product. Migrations: `add_onboarding_and_manufacturer_fields`, `split_name_into_first_last`. Brand/UI/arch consulted.
- [x] **Edit product + remove from monitoring** — AddProductPanel reused in edit mode, PATCH API expanded (ingredients, manufacturer, product_type), soft-delete with inline confirmation, brand-guardian reviewed
- [x] **Performance pass: auth caching + feed pagination** — React `cache()` on auth + queries (eliminates duplicate DB calls per page), feed uses server-side DB filtering + `GET /api/feed` pagination (25/page) + IntersectionObserver lazy load
- [x] **Phase 5: Email system** — BriefingEmail (paid, 3-zone BLUF), AlertEmail (urgent), WeeklyNewsletter (free, lead story + THE NUMBER). Compiler (Claude Sonnet editorial), Resend sender, cron endpoint (`/api/email/send-weekly`), webhook (svix HMAC), token-based unsubscribe. `vercel.json` cron configured (Fri 2pm UTC). Preview: `npm run email:dev`.
- [x] **Welcome email template** — `WelcomeEmail.tsx` (post-onboarding confirmation, product list with green dots, what-to-expect, single CTA). Brand-guardian + ui-designer consulted.
- [x] **Email webhook: open/click tracking + PostHog** — Resend webhook extended to track `delivered`, `opened`, `clicked`, `bounced`, `complained`. Populates `opened_at`, `clicked_at`, `delivered_at`, `bounce_type` in `email_sends`. All events forwarded to PostHog via server-side `track()`. Resend webhook configured in dashboard.
- [x] **Pilot cleanup: subscription links removed** — "Manage your subscription" (Stripe portal) removed from BriefingEmail, AlertEmail, WelcomeEmail footers. Re-add when pilot ends.
- [x] **Alert system hardened** — RFC 8058 token-based unsubscribe (email_unsubscribe_token on users). Alerts decoupled via Inngest event (`alerts/urgent.requested`), CLI fallback. `email_opted_out` flag (not access_level) for paid user unsubscribe. Settings page toggle. Orphaned `checkItemForUrgentMatches` deleted. Triple-reviewed (code/arch/backend).
- [x] **User settings page** — `/app/settings` with profile editing (name, company, role, FEI), read-only account info (email, plan, member since), email notification toggle, and account deletion (Stripe cleanup + Supabase auth cascade). Initials avatar in AppNav links to settings.
- [x] **Product classification** — `src/lib/products/classify.ts`. Gemini Flash assigns `product_category_id` from 119-slug controlled vocab. Wired into POST + PATCH routes (non-blocking). Backfill: `npm run pipeline:classify` (`--force` to reclassify). Code-reviewed.
- [x] **Consultant outreach started** — Katherine Giannamore emailed (Mar 7). Review packet v2 rebuilt: embedded live HTML emails, clickable source links, accuracy-only focus. Kristen Klesh + Marc Ullman queued.
- [ ] **Session 2 remaining** — product detail image display
- [x] **Inngest pipeline orchestration (Phase 2C minimal)** — daily-ingest cron (twice daily, 7 parallel fetchers + enrichment), enrich-batch (on-demand). Code-reviewed.
- [x] **Product matching engine (Phase 4C)** — query module with relevance scoring. Substance matches (substance_id JOIN) + category matches (product_type tags). IDF-like specificity weighting. 3 Postgres RPCs, 15-min cache. No new tables.
- [x] **Lifecycle state system** — `src/lib/utils/lifecycle.ts`. Items classified urgent/active/grace/archived via deadline-first decision tree. Feed defaults to live items. Products page splits active vs resolved history. No DB changes.
- [x] **Verdict system** — `src/lib/products/verdicts.ts`. Gemini Flash evaluates item-product relevance. Tightened prompt filters brand-specific recall noise. Three triggers: post-enrichment, post-product-add, CLI backfill (`scripts/run-verdicts.ts`).
- [x] **App pages → real data** — feed, item detail, products wired to real DB. Mocks removed. Search hidden.
- [x] **Full re-enrichment (2026-03-06)** — 7,566/7,574 re-enriched, 979 cross-refs, 669 verdicts. Tightened prompts. `server-only` removed from `admin.ts`.
- [x] **Product intelligence email MVP** — compiler (`src/lib/email/compiler.ts`), BriefingEmail/AlertEmail/WeeklyNewsletter templates, Resend sender, webhook tracking
- [x] **Validation** — product intelligence email confirmed working in production (received in inbox, quality approved)
- [x] **Weekly email → Inngest** — moved from Vercel cron to Inngest function (`send-weekly-emails`). Fixed: FK violation on `createCampaign` (passed `users.id` to `email_subscribers.id` FK), free newsletter never sent (timeout from per-subscriber LLM calls). Newsletter content now generated once (2 LLM calls total). `vercel.json` crons emptied. Manual trigger route kept at `/api/email/send-weekly`.
- [x] **Sentry error monitoring** — `@sentry/nextjs`, org `policy-canary`, project `policy-canary-web`. Client/server/edge configs, tunnel at `/monitoring`, 20% trace sampling, replay on errors. Source maps uploaded + deleted. Code-reviewed.
- [x] **Full codebase audit (2026-03-19)** — 26 fixes across 3 waves. Sentry `captureException` wired into all swallowed errors. Batch dedup in fetchers. Batch DB writes in enrichment. Broken in-memory cache removed. Email tracking for paid briefings. Fan-out paid sends in Inngest. Fetch timeouts. Content-fetch retry. Stripe error format. Auth sync hardened. Alert dedup column (`reference_item_id`). Schema objects captured in migrations (008, 009). See `development/code-audit-fixes.md`.
- [ ] Launch
- [ ] **Full historical backfill** — Federal Register (1994-present), openFDA enforcement (2004-present) + enrich all. Prerequisite for Research tier.
- [ ] **Research tier ($399/mo)** — agentic search with 7 tools, three-model pipeline (Flash bouncer/status → Pro researcher → Sonnet writer). Full planning doc: `memory-bank/projects/research-search.md`
- [x] **Phase 2 federal sources** — Guidance Documents (2,761), Regulations.gov (1,178), Import Alerts (154). All enriched.
- [x] **Intelligence pages (programmatic SEO)** — 45 pages published across 3 surfaces (`/ingredients/`, `/enforcement/`, `/regulations/`). ~100K words, fact-checked. Migration `007` applied. Cross-linking wired into all page templates.
- [ ] **Phase 3 sources** — Adverse Events (FAERS/CAERS), state compliance (Prop 65, state bills). Different data shape — deferred.
- [ ] **Expansion:** State compliance layer (deferred — federal-only until customer demand justifies)
- [ ] **Expansion:** Pet food / animal supplements (deferred)

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

# Blog + Intelligence pages (Anton write path)
BLOG_API_KEY=...    # X-API-Key header for POST /api/blog and POST /api/intelligence

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_MONITOR=...         # Stripe Price ID for Monitor tier ($99/mo)
STRIPE_PRICE_EXTRA_PRODUCT=...   # Stripe Price ID for per-product overage ($6/mo, deferred)

# Rate Limiting (required for production, optional local dev)
UPSTASH_REDIS_REST_URL=...      # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=...    # Upstash Redis REST token

# Inngest
INNGEST_SIGNING_KEY=...          # Required in Vercel for production (not needed locally)
INNGEST_EVENT_KEY=...            # Required if sending events from outside serve handler

# (Vultr + Discord env vars DEPRECATED — Anton moved to Pi 5 with Slack)

# DataForSEO
DATAFORSEO_LOGIN=...             # DataForSEO API login
DATAFORSEO_PASSWORD=...          # DataForSEO API password
DATAFORSEO_BASE64=...            # Base64-encoded login:password

# Sentry (error monitoring)
NEXT_PUBLIC_SENTRY_DSN=...       # Sentry DSN (client + server)
SENTRY_AUTH_TOKEN=...            # Org auth token for source map uploads

# SEO (IndexNow + Slack GSC reminder)
SLACK_WEBHOOK_SEO=...            # Slack incoming webhook → #notifications (GSC index reminder)
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
| `architecture/clawdbot.md` | Clawdbot VPS, Discord, cron jobs, skills, scripts, content workflows, security |
| `architecture/llm-data-flow.md` | LLM layers, data flow, email generation, onboarding |
| `architecture/llm-data-flow.html` | Visual diagrams (open in browser) |
| `research/competitive-landscape.md` | 20+ competitor profiles |
| `research/data-sources.md` | Full FDA API documentation |
| `research/market-opportunity.md` | Market sizing, MoCRA timelines, enforcement trends |
| `research/product-level-monitoring-research.md` | Product-level competitive gap, buyer analysis, market expansion |
| `research/per-product-pricing-research.md` | Per-product SaaS pricing models, concrete examples |
| `research/product-level-pricing-research.md` | Alert cadence, small brand pricing, trial models |
