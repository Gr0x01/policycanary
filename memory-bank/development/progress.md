---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active
---

# Progress: Policy Canary

## Milestones

| Phase | Target | Status |
|-------|--------|--------|
| Product Definition & Vision | 2026-03-03 | Done |
| Market Research | 2026-03-03 | Done |
| ~~Data Schema Design (v3, segment-based)~~ | 2026-03-03 | Superseded by v1 schema |
| Build Phase Planning (segment-based) | 2026-03-03 | Done — needs revision for product pivot |
| **Product-Level Pivot** | **2026-03-03** | **Done — core model, research, pricing draft** |
| Pricing Finalization | 2026-03-03 | Done — Monitor $49/mo, Monitor+Research $249/mo, +$6/product |
| **Data Schema v1** | **2026-03-03** | **Done — 25 tables, 9 layers, substances-based matching** |
| Build Phase Revision | 2026-03-03 | Done — Phase 1 plan executed directly |
| **Project Scaffolding** | **2026-03-03** | **Done — Next.js 16, AI SDK v6, Supabase, Inngest, Tailwind v4** |
| Data Pipeline (Federal Register + openFDA + RSS) | - | Pending |
| Product Onboarding (DSLD + FDC) | - | Pending |
| Product Intelligence Email MVP | - | Pending |
| Web App (search + enforcement DB) | - | Pending |
| Auth & Subscriptions (Stripe) | - | Pending |
| Validation (sample emails, trial signups) | - | Pending |
| Launch | - | Pending |

---

## Data Sources

| Source | Coverage | Status |
|--------|----------|--------|
| Federal Register API | Rules, proposed rules, notices (1994-present) | Researched — no auth, JSON, ready to build |
| openFDA API | Enforcement/recalls, adverse events (2004-present) | Researched — free key, JSON, ready to build |
| FDA RSS Feeds | Recalls, safety alerts, press releases (13+ feeds) | Researched — no auth, ready to build |
| FDA Warning Letters | ~3,300 letters, all centers | Researched — XLSX export + scraping, Phase 2 |
| Regulations.gov | Comment periods, dockets | Researched — free key, Phase 2 |
| FDA Data Dashboard | Inspections, 483s, compliance actions | Researched — requires registration, Phase 3 |
| State regulations | Prop 65, state-level rules | Deferred (expansion) |
| **DSLD (Supplement Products)** | **214K supplement products, structured ingredients** | **Researched — no auth, ready for onboarding** |
| **USDA FoodData Central** | **454K branded food products** | **Researched — free key, ready for onboarding** |

---

## Research Completed

| Research Area | File | Key Finding |
|---------------|------|-------------|
| Competitive landscape | `/research/competitive-landscape.md` | No competitor in our lane. 20+ profiles. |
| Data sources | `/research/data-sources.md` | MVP data sources are free, no auth needed. |
| Market opportunity | `/research/market-opportunity.md` | Strong timing window (MoCRA July 2026, CBD cliff Nov 2026). |
| **Product-level monitoring** | `/research/product-level-monitoring-research.md` | Nobody does product-level FDA monitoring. Genuine white space. Market expands to ~17K+ buyers. |
| **Per-product pricing** | `/research/per-product-pricing-research.md` | Tiered product-count plans are standard. $79-$449 range. Concrete comparables. |
| **Pricing & GTM shifts** | `/research/product-level-pricing-research.md` | Event-driven + weekly cadence. Reverse trial model. Loss aversion marketing. Small brands at $79/mo. |

---

## Key Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-03 | Email-first product model | Email is where the buyer already is. Zero behavior change. |
| 2026-03-03 | Intelligence lane only | Never build ops tools, formulation, label review, registration services. |
| 2026-03-03 | Consultants as referral partners | They recommend us to clients. May not be direct customers in product-level model. |
| 2026-03-03 | ~~Segment-based pricing ($299/$499)~~ | ~~Superseded by product-level pivot.~~ |
| 2026-03-03 | **Product-level pivot** | Segments never passed the sniff test. "What about supplements?" isn't actionable. Products are what people actually care about. |
| 2026-03-03 | **Product count as pricing lever** | Reflects real cost (more products = more LLM calls) and real value. Small brands pay less, CMOs pay more. |
| 2026-03-03 | **Two-email model** | Weekly Update (generic, free, content marketing) + Product Intelligence Email (custom, paid, event-driven). |
| 2026-03-03 | **Event-driven product alerts** | Don't wait for Friday. Something affects your products → email now. Nothing happened → weekly all-clear. |
| 2026-03-03 | **DSLD + FDC for product onboarding** | Real product databases with verified ingredients. Not self-reported. 214K supplements + 454K food products. |
| 2026-03-03 | **Expanded buyer pool** | Product-level reaches founders, quality directors, product managers — not just VP Reg Affairs. ~6K-17.5K potential buyers. |
| 2026-03-03 | **Base + per-product pricing** | Two access levels (Monitor / Monitor+Research) with per-product scaling. Monthly only. No unlimited. Cap at 100 self-serve. |
| 2026-03-03 | **Monthly billing only at launch** | Product counts fluctuate. Annual is messy. Add annual later with retention data. |
| 2026-03-03 | **100 product self-serve cap** | Beyond 100 is a different UX and cost problem. Custom pricing via sales conversation. |
| 2026-03-03 | **Pricing finalized: $49/$249 + $6/product** | Monitor $49/mo, Monitor+Research $249/mo. Both include 5 products, $6/product beyond. $200 gap reflects research platform as moat. 5.1x multiplier validated by Westlaw/LexisNexis/Gartner comparables. |
| 2026-03-03 | **Research platform = the moat** | Enforcement DB, AI search, trends, regulatory archive. Fills $100-$500/mo gap between free FDA tools and $25K+ enterprise. One Redica 483 doc costs $289 — our full platform is $249/mo. |

---

## Costs (Projected)

| Item | Estimated Cost |
|------|----------------|
| Initial data enrichment (LLM) | ~$15-38 |
| Monthly infrastructure | ~$10-75/mo |
| Domain (policycanary.io) | ~$30/year |
| Consultant validation (3-4 hours) | ~$500-$1,200 |
| **Total to MVP** | **~$555-$1,340** |

**Ongoing:** ~$10-75/month (scales with usage and subscribers)

---

## Completed Work

### 2026-03-03 — Product-Level Pivot
- **Identified fundamental problem with segment-based approach**: "What about supplements?" isn't actionable. Users think in products, not segments. The email needs to say "Your Marine Collagen Powder is affected" not "here's what happened in supplements."
- **LLM architecture mapped**: 6 distinct LLM layers identified (enrichment, deep tagging, onboarding profile, email composition, urgent alerts, semantic search). Three providers for their strengths: Gemini (bulk enrichment), Claude (writing), OpenAI (embeddings).
- **Product onboarding data sources researched**: DSLD has 214K supplement products with structured ingredients (no auth). USDA FDC has 454K food products (free key). Cosmetics is a gap — no public database.
- **Product-level competitive research**: Confirmed nobody does dynamic product-level FDA monitoring. Static compliance checking exists (Signify, FoodChain ID) but not continuous monitoring. Genuine white space.
- **Per-product pricing research**: Tiered product-count plans are standard across per-product SaaS. Draft tiers: Free (1 product) / Starter ~$79 (5 products) / Pro ~$249 (25 products) / Business ~$449 (unlimited).
- **Market expansion analysis**: Buyer pool grows from ~6K (VPs of Reg Affairs) to ~17K+ (adds founders, quality directors, product managers at small brands). Small brands ($500K-$5M) are the biggest new segment.
- **Two-email model decided**: Generic weekly update (free, content marketing) + product intelligence email (paid, event-driven with weekly all-clear).
- **Pricing model decided**: Base + per-product, two access levels (Monitor / Monitor+Research). Monthly billing only at launch. Self-serve caps at 100 products, custom pricing beyond. No "unlimited" tier. Exact prices TBD.
  - **Monitor**: emails + alerts + product dashboard. "We watch for you."
  - **Monitor + Research**: everything above + enforcement DB, AI search, trends. "We watch for you AND you can do your own research."
  - Clean distinction based on buyer need, not artificial feature gates.
- **Memory bank fully updated** to reflect product-centric model and pricing structure.
- Visual data flow diagrams created: `architecture/llm-data-flow.html`

### 2026-03-03 — Data Schema v1
- **Designed v1 schema from scratch** — 25 tables across 9 layers. Replaces the draft v3 segment-based schema (never built).
- **Three research streams synthesized**: backend-architect schema proposal, ingredient matching research (UNII/GSRS/synonym resolution), FDA classification research (CFR structure, openFDA fields, cross-cutting regulations, state regulatory patterns).
- **Key architectural decisions**:
  - **Substances layer**: Canonical `substances` table (bootstrapped from FDA GSRS, 169K substances) + `substance_names` synonym table with pg_trgm fuzzy search. Both product ingredients AND regulatory item extractions resolve to substance_ids. Matching is ID-to-ID, not string-to-string.
  - **Flexible classification**: `regulatory_categories` lookup table + `item_categories` junction replaces hardcoded segment ENUMs. Topics merged into same system. Adding pet food = INSERT, not migration.
  - **Jurisdiction as dimension**: `regulatory_items` has `jurisdiction` (federal/state) + `jurisdiction_state`. State regulations flow through same pipeline as federal.
  - **Two-layer matching**: `segment_impacts` powers search/trends/free digest. `product_matches` (the money table) sits on top for personalized intelligence. Substances bridge the two.
  - **TEXT + CHECK instead of ENUM everywhere** for easy iteration.
  - **Deferred expansion tables**: state compliance (chemicals, state_chemical_bans, cosmetic_chemical_reports) and adverse events deferred to when those features are built.
- **Research findings preserved**: FDA industry codes (53=cosmetics, 54=supplements), openFDA enforcement classification gap (supplements/cosmetics both show as "Food"), warning letters have zero structured metadata, CFR references are the structural hook for Federal Register classification.
- Schema saved to `architecture/data-schema.md`.

### 2026-03-03 — Phase 1: Foundation Scaffolded

- **Next.js 16** with Turbopack, App Router, TypeScript strict, `src/` directory
- **Tailwind v4** CSS-first — `@import "tailwindcss"` in globals.css, no config file
- **Supabase clients**: browser (`client.ts`), server (`server.ts`), admin service role (`admin.ts`)
- **AI SDK v6** clients: `geminiFlash`/`geminiPro` (enrichment), `claudeSonnet` (writing), `generateEmbedding()` (OpenAI, 1536d)
- **Inngest** client + `/api/inngest` route handler ready for pipeline functions
- **Full v1 schema migration**: `supabase/migrations/001_initial_schema.sql` — all 25 tables, 9 layers, vector(1536) embeddings, pg_trgm indexes, moddatetime triggers
- **Seed file**: `supabase/seeds/001_sources.sql` — 9 sources + regulatory_categories (segments, topics, product classes)
- **GSRS bootstrap script**: `scripts/bootstrap-gsrs.ts` — one-time seed of 169K FDA substances
- **TypeScript types**: hand-written types for all 25 tables (`database.ts`), enums (`enums.ts`), API types (`api.ts`)
- **Playwright config**: chromium + firefox + webkit, webServer auto-start
- **Verified**: `npm run type-check` passes, `npm run build` passes cleanly

### 2026-03-03 — Original Planning (Preserved)
- Product idea defined, deep market research (20+ competitor profiles, FDA API docs, market sizing)
- Email-first model, intelligence lane positioning
- Data schema v3 with 7 layers, backend architect reviewed
- Real API validation (Federal Register, openFDA, FDA scraping endpoints)
- Build phases defined (7 phases with session briefs — needs revision)
