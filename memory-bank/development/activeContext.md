---
title: Active Development Context
created: 2026-03-03
last-updated: 2026-03-03
maintainer: RB
status: Active
---

# Active Development Context

**Phase:** Phase 1 Complete — Foundation scaffolded, moving to Phase 2A-1 (Federal Register pipeline)
**Goal:** Build data pipeline starting with Federal Register + openFDA

---

## Current State

### What's Done
- [x] Product idea defined and market researched
- [x] Original product vision: segment-based intelligence (Free / $299 Pro / $499 All Access)
- [x] **Product pivot to product-level monitoring** — subscribers add their real products, system matches FDA changes against their ingredients
- [x] LLM architecture mapped (enrichment, onboarding, email composition, search) — see `architecture/llm-data-flow.md`
- [x] Product onboarding data sources researched (DSLD for supplements, USDA FDC for food, manual for cosmetics)
- [x] Product-level competitive research — confirmed genuine white space, no competitor does this
- [x] Product-level pricing research — per-product SaaS models, small brand pricing sensitivity
- [x] Market expansion analysis — addressable market grows from ~6K to ~17K+ with product-level approach
- [x] Two-email model decided: generic weekly update (free) + product intelligence email (paid, event-driven)
- [x] Core memory bank updated to reflect product-centric model
- [x] Pricing finalization — Monitor $49/mo, Monitor+Research $249/mo, +$6/product beyond 5 included
- [x] **Data schema v1 complete** — 25 tables across 9 layers, substances-based product matching, flexible classification. See `architecture/data-schema.md`
- [x] **Phase 1 scaffolded** — Next.js 16, Tailwind v4, Supabase clients, AI SDK v6, Inngest, TypeScript types, Playwright config

### Up Next
- [ ] Data pipeline Phase 2A-1: Federal Register ingestion (Inngest function + API fetch)
- [ ] Data pipeline Phase 2A-2: openFDA enforcement + recalls
- [ ] Data pipeline Phase 2A-3: FDA RSS feeds
- [ ] Enrichment pipeline (Gemini Flash/Pro + embeddings)
- [ ] Product onboarding (DSLD + FDC integration)

---

## Key Decisions Made

### Product Model (Current)
1. **Products are the core unit, not segments.** The email says "Your Marine Collagen Powder" not "This week in supplements." Segments are backend pipeline classification only.
2. **Real product data from public databases.** DSLD for supplements (214K products, structured ingredients), USDA FDC for food (454K products). Cosmetics is manual entry (no public database). Not self-reported guesses — verified ingredient lists.
3. **Two emails, two jobs.** Weekly Update (generic, free, content marketing) + Product Intelligence Email (custom per subscriber, paid, event-driven).
4. **Product intelligence is event-driven.** Something affects your products → email immediately. Nothing happened → weekly "all clear." Don't wait for Friday if something is urgent.
5. **Everything shows up, nothing is hidden.** Product emails show ALL items. Product-matched items get full analysis. Same-segment items get a brief. Everything else gets a one-liner + link.
6. **The buyer expands.** Not just VP Reg Affairs anymore. Founders, quality directors, product managers — anyone who thinks in products.

### Pricing Model (Current)
7. **Two access levels.** Monitor ($49/mo) = emails + alerts + dashboard. Monitor+Research ($249/mo) = adds enforcement DB, AI search, trends. The $200 gap reflects that the research platform is the moat, not a feature toggle.
8. **Base + per-product pricing.** Both levels include 5 products. $6/product/month beyond that. Same per-product rate for both levels.
9. **Monthly billing only at launch.** Product counts fluctuate as subscribers add/remove products. Annual is messy with variable products. Add annual later once retention data exists.
10. **Self-serve caps at 100 products.** Beyond 100 → "contact us." 100+ is a different UX problem (email structure, product management, alert grouping) and a different sales conversation.
11. **No "unlimited."** Unlimited creates cost risk and is a fundamentally different product at scale.
12. **Research pricing validated by comparables.** $249/mo is 5.1x the Monitor price — consistent with Westlaw (5.9x), LexisNexis (2.8x), Gartner (4-5x). Fills the $100-$500/mo gap between free FDA tools and $25K+ enterprise platforms.

### Preserved from Original Vision
8. **Email is the product.** Web app is depth layer.
9. **Stay in the intelligence lane.** Never build compliance management, formulation tools, label review, registration.
10. **Consultants are referral partners.** (They may not be direct customers anymore — they don't have "products" to monitor.)
11. **State compliance is the first expansion.** Month 3-5.
12. **Legal = synthesis, not advice.** Simple disclaimer.
13. **RB owns editorial voice/tone.**

### Superseded Decisions
- ~~Segment-based pricing (Pro = your segments, All Access = all segments)~~ → Monitor $49/mo + Monitor+Research $249/mo, base+per-product
- ~~Fixed tier pricing ($79/$249/$449 with product count caps)~~ → Base + $6/product scaling
- ~~Free tier = headline digest filtered by segment~~ → Free = generic weekly update + 1 product post-trial
- ~~$299 price floor~~ → Monitor at $49/mo for small brands
- ~~2,500-6,000 buyer pool~~ → 6,000-17,500+ with product-level approach
- ~~Segment selection at onboarding~~ → Product addition at onboarding (segments inferred)
- ~~Annual billing as default~~ → Monthly only at launch, annual added later
- ~~Unlimited product tier~~ → Cap at 100 self-serve, custom pricing beyond
- ~~$50 gap between Monitor and Research~~ → $200 gap. Research platform is the moat, not a feature toggle.

---

## Open Questions

1. **Trial model** — reverse trial (14 days full → 1 product free) vs standard trial? Research suggests reverse trial.
2. **Consultants** — are they still customers? They don't have products. Referral partners only? Or do they track client products?
3. **Web app personalization** — default view organized by subscriber's products? Or generic enforcement DB?
4. ~~**Data schema**~~ — DONE. v1 schema complete with substances layer, flexible classification, product matching.
5. **Build phases** — need revision. Product onboarding, DSLD integration, GSRS import become critical path.
6. **Enrichment depth** — how granular does the LLM tagging need to be for accurate product matching? Need to test with real data.
7. **Annual billing** — add at launch or defer? Research suggested $199/mo annual for Monitor+Research as discount lever.
8. **Per-product rate validation** — $6/product needs testing with real buyers.

---

## Key References

- **Project Brief:** `/memory-bank/core/projectbrief.md`
- **LLM Data Flow:** `/memory-bank/architecture/llm-data-flow.md` (and `.html` for visual diagrams)
- **Tech Stack:** `/memory-bank/architecture/techStack.md`
- **Product-Level Research:** `/memory-bank/research/product-level-monitoring-research.md`
- **Pricing Research:** `/memory-bank/research/per-product-pricing-research.md`
- **Pricing/GTM Research:** `/memory-bank/research/product-level-pricing-research.md`
- **Competitive Research:** `/memory-bank/research/competitive-landscape.md`
- **Data Sources:** `/memory-bank/research/data-sources.md`
- **Build Phases:** `/memory-bank/core/build-phases.md` (needs revision)

---

## Next Action

**Phase 2A-1: Build the Federal Register ingestion Inngest function. Fetch docs from FR API, insert into `regulatory_items`, log to `pipeline_runs`.**

## Phase 1 File Map (Scaffolded 2026-03-03)

```
src/
  app/
    layout.tsx            # Root layout, minimal
    page.tsx              # "coming soon" placeholder
    globals.css           # @import "tailwindcss"; only
    api/inngest/route.ts  # Inngest serve handler
  lib/
    supabase/client.ts    # Browser client
    supabase/server.ts    # Server component client
    supabase/admin.ts     # Service role client (pipeline use)
    ai/gemini.ts          # geminiFlash + geminiPro
    ai/anthropic.ts       # claudeSonnet
    ai/openai.ts          # generateEmbedding()
    inngest/client.ts     # Inngest client
  types/
    database.ts           # Hand-written DB types (all 25 tables)
    enums.ts              # Shared string literal types
    api.ts                # API request/response types

supabase/
  migrations/001_initial_schema.sql  # Full v1 schema
  seeds/001_sources.sql              # 9 sources + category rows

scripts/
  bootstrap-gsrs.ts       # One-time GSRS substances seed

e2e/.gitkeep              # Playwright placeholder
playwright.config.ts
.env.local.example
vercel.json               # Cron stub
```
