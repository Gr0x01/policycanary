---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active
---

# Quickstart: Policy Canary

## Current State

- **Status**: Phase 2A-2 complete — All 4 data fetchers built and tested. Marketing site live. Supabase has real data.
- **Goal**: Monitor FDA for YOUR specific products, not just your industry
- **GitHub**: https://github.com/Gr0x01/policycanary
- **Next**: Phase 4 (Auth + Stripe) or Phase 2C (Inngest wiring)

---

## What's Happening

Product-level model is locked in. Data schema v1 live in Supabase. Marketing site up. All 4 data fetchers built and tested (FR, openFDA, Warning Letters, FDA RSS). Full backfills are deferred until LLM enrichment is wired — ingesting raw data without enrichment creates unprocessed noise. Next conversion surface is Auth + Stripe.

---

## Product Model (Product-Centric)

| Layer | What | Who |
|-------|------|-----|
| **Weekly Update** (free) | Generic FDA digest, same for everyone. Content marketing. | Free signups + paid subscribers |
| **Product Intelligence Email** (paid) | Event-driven alerts + weekly all-clear. Custom per subscriber, organized by THEIR products. | Paid subscribers |
| **Web app** (paid) | Search, enforcement DB, trends, archive — personalized to your products | Paid subscribers |

**Pricing:** Monitor $49/mo (5 products included) · Monitor+Research $249/mo (5 products included) · +$6/product beyond 5 · Free: 1 product post-trial · Monthly billing · Self-serve up to 100 products

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

# Data Pipeline (test window: Jan–Feb 2025 for date-ranged fetchers)
npm run pipeline:fr-backfill            # Federal Register backfill
npm run pipeline:enforcement-backfill   # openFDA enforcement/recalls backfill
npm run pipeline:wl-backfill            # Warning letters full backfill (~3,313 records, ~11 min) — run AFTER LLM enrichment is wired
npm run pipeline:wl-incremental         # Warning letters incremental (recent, stops on known page)
npm run pipeline:rss-poll               # Poll all 8 FDA RSS feeds

# One-time seeds
npx tsx scripts/bootstrap-gsrs.ts      # Seed 169K FDA substances (run once)
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
- [x] **Marketing site** — landing, pricing, sample report, signup API. Static-rendered. Build passes.
- [x] **Data pipeline: FR + openFDA** — fetchers built, tested. 175 items + 109 enforcement details in DB.
- [x] Data pipeline: Warning Letters + FDA RSS (Phase 2A-2)
- [ ] Wire fetchers into Inngest (Phase 2C)
- [ ] Enrichment pipeline (Gemini Flash + embeddings)
- [ ] Product onboarding (DSLD + FDC integration)
- [ ] Product intelligence email MVP
- [ ] Web app — search + enforcement DB
- [ ] Auth & subscription (Stripe)
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

# LLM
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Email
RESEND_API_KEY=...  # or POSTMARK_SERVER_TOKEN

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
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
