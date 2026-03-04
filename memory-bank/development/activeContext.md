---
title: Active Development Context
created: 2026-03-03
last-updated: 2026-03-04
maintainer: RB
status: Active — Inngest pipeline wired. Onboarding backend next.
---

# Active Development Context

**Phase:** Session 0 complete. Inngest pipeline wired (Phase 2C minimal). Full enrichment run in progress.
**Live partner:** Clawdbot on Discord (`#clawdbot` for general chat, `#weekly-roundup` for content). VPS: `ssh root@108.61.151.130`.
**Next up:** Full enrichment of all items (backfills + re-enrich), then Session 1 (onboarding backend), Session 2 (onboarding frontend)

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
- [x] **Phase 2A-1 complete** — FR + openFDA enforcement fetchers in `src/pipeline/fetchers/`. Test with `npm run pipeline:fr-backfill` / `npm run pipeline:enforcement-backfill`
- [x] **Phase 2A-2 complete** — Warning Letters + FDA RSS fetchers. `npm run pipeline:wl-incremental` / `npm run pipeline:wl-backfill` / `npm run pipeline:rss-poll`. Uses `fast-xml-parser`.
- [x] **Phase 3 complete + homepage visual pass** — Marketing site: landing page, pricing page, sample report page, email signup API. Design tokens in globals.css, IBM Plex fonts, framer-motion animations. All routes static-rendered. Homepage subsequently improved: hero gradient boosted (10→22-28% opacity), How It Works rebuilt (removed invisible text-8xl watermark layout bug), `ProductShowcase` component added (interactive browser-chrome dashboard mockup with product list + intelligence detail panel).
- [x] **Phase 4A complete** — Magic link auth. `src/proxy.ts` (session refresh + route protection), `/login` (magic link form), `/auth/callback` (PKCE exchange + `public.users` upsert), `/app/layout` (server auth guard), `/app/dashboard` (placeholder + sign out). Dev bypass via `NODE_ENV === 'development'`. Tested end-to-end. `NEXT_PUBLIC_SITE_URL` in `.env.local`. Supabase redirect allowlist configured for localhost + policycanary.io.
- [x] **Homepage visual overhaul** — Stripe-like light theme: Header, Hero, ProductShowcase, Stats, Social Proof all converted to white/surface-muted; CTA remains the single dark contrast section. Hero rebuilt as two-column layout (text left, email mockup right). `HowItWorksSection` extracted to client component with Framer Motion stagger-on-scroll + animated step connectors between cards (desktop). Radar pulse (`animate-ping`) on urgent dot in email mockup.

### What's Done (Phase 6)
- [x] **App shell** — `AppNav` (server) + `NavLinks` (client, usePathname). Dark nav `#07111F`, canary logo dot, Feed·Search·Products links, user email + sign out.
- [x] **Feed page** — `/app/feed` with URL-param filters (type, date range, My Products). 10 mock items, graceful degradation if not enriched. Dashboard → redirect.
- [x] **FeedItemCard, ItemTypeTag, ProductMatchBadge, FeedFilters** — full feed component set
- [x] **Item detail** — `/app/items/[id]` with 8 conditional sections (header, status bar, what happened, action items, your products, substances, enforcement, source footer)
- [x] **Search page** — `/app/search` client component, POSTs to `/api/search`, handles JSON response, citation cards, suggested queries
- [x] **Search API route** — `/api/search` POST: Zod validation, auth, rate limit (10/min/IP), embedding via OpenAI, pgvector RPC with graceful fallback, RAG via claudeSonnet, returns `{ answer, citations }`
- [x] **Products page** — `/app/products` grouped by status (urgent/review/clear), ProductStatusCard, empty state
- [x] **Mock data** — `src/lib/mock/app-data.ts` with USE_MOCK flag pattern per page (one-line flip when real data exists)

### What's Done (Blog / Content Marketing)
- [x] **Blog section** — `/blog` index with category filter + ISR, `/blog/[slug]` detail with JSON-LD + OG tags, `/blog/feed.xml` RSS 2.0
- [x] **Clawdbot API** — POST `/api/blog` with X-API-Key auth, Zod validation, upsert on slug, `published_at` preservation
- [x] **Migration** — `003_blog_posts` (table, indexes, RLS public read, updated_at trigger)
- [x] **Code-reviewed** — JSON-LD injection fix, timing-safe key comparison, type-safe query projections (`BlogPostSummary`/`BlogPostRSS`), RSS null guard, content max length

### What's Done (Phase 4B: Stripe Subscriptions)
- [x] **Stripe client** — `src/lib/stripe/index.ts`, lazy `getStripe()` singleton (avoids build-time crash when env vars missing)
- [x] **Checkout route** — POST `/api/stripe/checkout`, auth required, get-or-create Stripe customer, 14-day trial, guards against double-subscription and duplicate customers (unique constraint + conflict handling)
- [x] **Webhook handler** — POST `/api/stripe/webhook`, signature verification, 4 events: checkout.session.completed (upgrade + link email_subscribers), subscription.updated (active/trialing/past_due = monitor, else = free), subscription.deleted (reset), invoice.payment_failed (log only). `resolveCustomerId()` type-safe helper. `trial_ends_at` from Stripe's authoritative `subscription.trial_end`. `stripe_subscription_id` stored.
- [x] **Billing portal** — POST `/api/stripe/portal`, auth required, creates Stripe billing portal session
- [x] **PricingTable** — Monitor $99/mo with CheckoutButton ("Start 14-day free trial"), Monitor+Research $399/mo (Coming Soon, disabled), Free links to `/login`
- [x] **AppNav** — free users see amber "Upgrade" button → `/pricing`, paid users see "Manage Billing" link. `hasSubscription` derived from `access_level`, not `stripe_customer_id`.
- [x] **Login next=checkout flow** — `?next` param passed through auth callback (allowlisted), redirects to `/app/feed?checkout=start`, AutoCheckout component auto-fires checkout POST
- [x] **Client components** — `CheckoutButton` (marketing), `BillingButton` (app), `AutoCheckout` (app) — all with error states
- [x] **App layout** — fetches `access_level`, `max_products`, `stripe_customer_id` from `public.users`, passes to AppNav
- [x] **Migration `004`** — `stripe_subscription_id TEXT` column + `UNIQUE` constraint on `stripe_customer_id`
- [x] **Triple code-reviewed** — code-architect, backend-architect, code-reviewer. 4 criticals + 9 warnings fixed.

### What's Done (Clawdbot / Content Automation)
- [x] **Clawdbot VPS** — Vultr `vc2-1c-2gb` ($12/mo), Ubuntu 24.04, Node.js 22, OpenClaw v2026.3.2. IP: `108.61.151.130`. Systemd service `openclaw.service`.
- [x] **Discord bot** — `ClawdBot - Canary` on `Bizniz` server. 5 channels: `#blog-drafts`, `#linkedin-drafts`, `#weekly-roundup`, `#alerts`, `#clawdbot` (general chat). `requireMention: false`.
- [x] **Helper scripts** — `query-supabase.mjs` (query enriched items), `publish-blog.mjs` (POST to `/api/blog`). Deployed to VPS workspace.
- [x] **Weekly roundup skill** — queries enriched items → drafts 800-1200 word blog post → posts to Discord → publishes on approval
- [x] **Cron job** — `weekly-roundup` fires Fridays 9 AM ET → `#weekly-roundup` channel
- [x] **Local repo files** — `scripts/clawdbot/` with cloud-init, scripts, skill, setup automation

### Up Next

#### Session 0: Product Categories + Enrichment Update (DONE)
- [x] **Migration `20260304082551_product_categories_and_company_name`** — `product_categories` table with 82 seeded rows, `product_category_id` FK on `subscriber_products`, `company_name` on `users`, RLS policies. Applied via Supabase MCP.
- [x] **Enrichment pipeline updated** — `prompts.ts`: `PRODUCT_CATEGORY_SLUGS` constant, `affected_product_categories` (controlled slugs). `processor.ts`: writes slugs to `item_enrichment_tags`. `cross-reference.ts`: Step 1c uses controlled slugs. Golden tests 10/10, 38/38 assertions.
- [x] **GSRS bootstrap complete** — 949K codes, 96 systems, 166K substances. `--codes-only` mode added for future backfills.
- [ ] **Full enrichment run** — backfill all historical data, reset stale enrichments, enrich all items with current pipeline

#### Session 1: Onboarding Backend
- [ ] **GSRS search utility** (`src/lib/products/gsrs.ts`) — queries local `substances` + `substance_names` tables (pg_trgm), not external API
- [ ] **Ingredient parsing** (`src/lib/products/parse-ingredients.ts`) — Gemini Flash for photo/paste/URL parsing, `matchToGSRS()` for substance linking
- [ ] **Product classification** — Gemini Flash picks `product_type` + `product_category_slug` from controlled vocab
- [ ] **Product API routes** — CRUD at `/api/products`, ingredient parse at `/api/products/[id]/ingredients/parse`, ingredient save at `/api/products/[id]/ingredients`, GSRS autocomplete at `/api/gsrs/search`
- [ ] Plan limit enforcement: DB trigger `check_max_products()` + API-level 403

#### Session 2: Onboarding Frontend
- [ ] **Components**: `ProductCard`, `AddProductForm`, `IngredientIngestion` (4 tabs), `IngredientConfirmation` (✅/⚠️/❌), `GSRSAutocomplete`
- [ ] **Product management page** (`/app/products`) — replace mock data, add "Add Product" flow
- [ ] **Onboarding page** (`/app/onboarding`) — post-signup, skippable, uses same components
- [ ] **Onboarding routing** — post-signup redirect, 0-products banner on feed

### What's Done (Phase 2C: Inngest Pipeline Orchestration)
- [x] **Inngest functions wired** — `daily-ingest` (cron `0 6,18 * * *`, 4 parallel fetchers + enrichment) and `enrich-batch` (event-driven, limit 1-200)
- [x] **Error handling** — catch-everything inside each `step.run()` (Inngest v3 step failure blocks all subsequent steps). Error messages truncated to 500 chars.
- [x] **Concurrency guards** — `{ limit: 1 }` on both functions prevents overlapping runs
- [x] **Code-reviewed** — 2 criticals + 4 warnings fixed (error handling, limit validation, parallel fetchers, concurrency key, RSS param cleanup, error truncation)
- [x] **RSS fetcher cleanup** — removed unused `{ mode: "poll" }` param from `fetchFdaRss()` signature

#### Deferred
- [ ] Batch/CSV import for 50+ products
- [ ] DSLD auto-populate (search DSLD by product name)
- [ ] USDA FDC integration
- [ ] Product matching engine (Phase 4C — runs against product profiles)

### Backfills (Running Now)
Enrichment pipeline is ready (Session 0 complete). Running full backfills, then enriching all items in one pass.

- `npm run pipeline:wl-backfill` — full warning letters backfill. Currently 422 in DB from prior partial run.
- `npm run pipeline:fr-backfill` — Federal Register full history (currently 66 items from Jan 2025 test window only)
- `npm run pipeline:enforcement-backfill` — openFDA full history (currently 109 items from Jan 2025 test window only)
- `npm run pipeline:rss-poll` — fresh RSS poll

---

## Enrichment Design Principle (Established 2026-03-03, Simplified 2026-03-04)

**Two matching signal types. Both are first-class. No segments.**

Not all regulatory changes are ingredient-level. The enrichment pipeline produces
BOTH signal types with equal rigor:

### Signal Type 1 — Ingredient-level
*"BHA is banned"* / *"This cucumber was recalled due to Salmonella"*
- Vehicle: `affected_ingredients` (LLM extraction) → `regulatory_item_substances` → `substance_id` FK → matched against `product_ingredients.substance_id`
- Phase 4C match_type: `'direct_substance'`
- Examples: ingredient bans, GRAS revocations, recalls citing specific ingredients, contamination alerts

### Signal Type 2 — Category-level
*"All cosmetic facilities must register by July 2026"* / *"CGMP rules now apply to all supplement manufacturers"*
- Vehicle: `item_enrichment_tags` with 4 tag dimensions → matched against subscriber product profile
  - `product_type` — **CONTROLLED VOCAB from `product_categories` table** (~79 slugs: `skin_care`, `protein_powders`, `infant_formula`, etc.). No free text.
  - `facility_type` — "outsourcing facility", "food manufacturer", "cosmetic contract manufacturer" (free text)
  - `claims` — "structure-function claims", "health claims", "organic" (free text)
  - `regulation` — "21 CFR 111", "MoCRA", "FSVP" (free text)
- Phase 4C match_type: `'category_overlap'`
- Examples: MoCRA registration deadlines, GMP rule changes, labeling format requirements, testing protocol requirements
- Key: `affected_ingredients = []` is CORRECT for these items. Do not hallucinate substances.

### Segments removed (2026-03-04)
- `segment_impacts` table **DROPPED** — the coarse food/supplement/cosmetics layer was never used for matching, no users, no MVP shipped. The 82 product category slugs + substance matching fully replace it.
- Cross-reference inference (Step 1c) now infers new product **categories**, not segments. Gate check uses `slugToSector()` to derive covered sectors from Step 1's product categories.
- `EnrichmentOutputSchema` no longer has a `segments` field. Rule validators only clear `affected_product_categories`.

### Schema additions (Supabase migration applied 2026-03-03)
- `item_enrichments.regulatory_action_type` — what is happening (recall, ban_restriction, compliance_requirement, cgmp_violation, etc.)
- `item_enrichments.deadline` — compliance date if any (ISO date)

Golden fixtures in `tests/golden/fixtures.ts` test ingredient extraction, action type, and product categories.

---

## Cross-Reference Inference Layer (Built 2026-03-04, Refocused 2026-03-04)

**THE SINGLE BIGGEST PRODUCT DIFFERENTIATOR. Built, code-reviewed, and data loaded. Ready to activate.**

### What It Does

Step 1b: Deterministic use-context derivation from GSRS substance codes. Maps 9 code systems (CFR, CODEX, JECFA, DSLD, RXCUI, DRUG BANK, DAILYMED, EPA PESTICIDE CODE, Food Contact Sustance Notif) to 8 `UseContextCategory` types. Pure TypeScript, no LLM. GSRS codes are ground truth.

Step 1c: LLM cross-**category** inference using Gemini 2.5 Pro with thinking (budget: 4096). Only fires when use contexts reveal **sectors** beyond Step 1's product categories (~20-30% of items). Reasons about exposure routes, regulatory precedent, and action mechanism to determine which additional **product categories** are genuinely affected.

### Key Files

- `src/pipeline/enrichment/cross-reference.ts` — Steps 1b (`lookupUseContexts`) + 1c (`inferCrossCategories`)
- `src/pipeline/enrichment/processor.ts` — restructured `enrichItem()` integrating cross-ref
- `scripts/bootstrap-gsrs.ts` — captures ALL 96 GSRS code systems; `--codes-only` flag for fast backfills
- `supabase/migrations/002_substance_codes_and_signal_source.sql` — schema migration (applied)

### Data State

- **949,770 codes** across **96 code systems**, **166,532 substances** with codes (98% of 169K)
- All code systems captured at ingestion; filtering to 9 relevant systems at query time in `cross-reference.ts`
- Key cross-ref systems: DAILYMED (15K), RXCUI (15K), DRUG BANK (12K), CFR (3.4K), EPA PESTICIDE (3K), JECFA (1.9K), DSLD (1.5K), Food Contact (731), CODEX (326)
- CIR (cosmetic) does not exist in GSRS — cosmetic ingredient data needs a separate source

### Trust Safeguards

1. Substance resolution threshold at 0.95 (stricter than general 0.90) for cross-ref
2. GSRS codes are ground truth — no hallucination vector in Step 1b
3. Confidence floor at 0.7 for Step 1c expansions
4. `signal_source = 'cross_reference'` marks all inferred signals (visible, filterable)
5. Step 1c is additive-only — never modifies Step 1's direct extraction
6. Non-fatal failure — Step 1c errors don't break enrichment

### What's Needed to Activate

1. **Run golden tests** — `npm run pipeline:golden-enrich` to validate BHA cross-reference expansion
2. **Re-enrich 422 WLs** — one pass with cross-reference inference

---

## Key Decisions Made

### Product Model (Current)
1. **Products are the core unit.** The email says "Your Marine Collagen Powder" not "This week in supplements." Sectors (food/supplement/cosmetic) are derived from product categories, not stored separately.
2. **Real product data from public databases.** DSLD for supplements (214K products, structured ingredients), USDA FDC for food (454K products). Cosmetics is manual entry (no public database). Not self-reported guesses — verified ingredient lists.
3. **Two emails, two jobs.** Weekly Update (generic, free, content marketing) + Product Intelligence Email (custom per subscriber, paid, event-driven).
4. **Product intelligence is event-driven.** Something affects your products → email immediately. Nothing happened → weekly "all clear." Don't wait for Friday if something is urgent.
5. **Everything shows up, nothing is hidden.** Product emails show ALL items. Product-matched items get full analysis. Same-industry items get a brief. Everything else gets a one-liner + link.
6. **The buyer expands.** Not just VP Reg Affairs anymore. Founders, quality directors, product managers — anyone who thinks in products.

### Pricing Model (Revised March 2026)
7. **Launch with Monitor only.** Monitor ($99/mo) = emails + alerts + dashboard. Research tier ($399/mo) added later once enforcement DB, AI search, and trends are built to justify the price.
8. **Base + per-product pricing.** Both levels include 5 products. $6/product/month beyond that. Same per-product rate for both levels.
9. **Monthly billing only at launch.** Product counts fluctuate as subscribers add/remove products. Annual is messy with variable products. Add annual later once retention data exists.
10. **Self-serve caps at 100 products.** Beyond 100 → "contact us." 100+ is a different UX problem (email structure, product management, alert grouping) and a different sales conversation.
11. **No "unlimited."** Unlimited creates cost risk and is a fundamentally different product at scale.
12. **Pricing validated by market research (March 2026).** $99/mo is above FoodDocs ($84/mo), below 1 hour of consultant time ($150-$500/hr), and under 3% of small firm compliance budgets ($46K/yr). Research tier at $399/mo is a 4x multiplier — conservative vs. Westlaw (5.9x), room to raise later.

### Preserved from Original Vision
8. **Email is the product.** Web app is depth layer.
9. **Stay in the intelligence lane.** Never build compliance management, formulation tools, label review, registration.
10. **Consultants are referral partners.** (They may not be direct customers anymore — they don't have "products" to monitor.)
11. **State compliance is the first expansion.** Month 3-5.
12. **Legal = synthesis, not advice.** Simple disclaimer.
13. **RB owns editorial voice/tone.**

### Superseded Decisions
- ~~Segment-based pricing (Pro = your segments, All Access = all segments)~~ → Monitor + Research, base+per-product
- ~~Fixed tier pricing ($79/$249/$449 with product count caps)~~ → Base + $6/product scaling
- ~~Free tier = headline digest filtered by segment~~ → Free = generic weekly update + 1 product post-trial
- ~~$299 price floor~~ → Monitor at $99/mo
- ~~Monitor at $49/mo~~ → $99/mo. Research validated: $49 was below FoodDocs ($84/mo), risked not being taken seriously. $99 signals seriousness, still under 1 hour of consultant time.
- ~~Monitor+Research at $249/mo~~ → $399/mo (future). $300 gap reflects research platform as moat. 4x multiplier, room to raise.
- ~~Launch both tiers simultaneously~~ → Launch Monitor only. Research tier added once enforcement DB, AI search, and trends justify $399.
- ~~2,500-6,000 buyer pool~~ → 6,000-17,500+ with product-level approach
- ~~Segment selection at onboarding~~ → Product addition at onboarding (segments inferred)
- ~~Annual billing as default~~ → Monthly only at launch, annual added later
- ~~Unlimited product tier~~ → Cap at 100 self-serve, custom pricing beyond

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

## Infrastructure Status
- **GitHub**: https://github.com/Gr0x01/policycanary (main branch)
- **Supabase**: Schema live — 25 tables, RLS enabled, seed data applied. 175 regulatory items + 109 enforcement details in DB.
- **Local**: `npm run dev` starts on localhost:3000

## Pipeline File Map

```
src/lib/inngest/
  client.ts                         # Inngest client + Events type schema
  index.ts                          # Barrel export for all functions
  functions/
    daily-ingest.ts                 # Cron 0 6,18 * * * — 4 parallel fetchers + enrichment
    enrich-batch.ts                 # Event-driven enrichment (pipeline/enrich.requested)

src/app/api/inngest/route.ts        # Inngest serve handler — registers dailyIngest + enrichBatch

src/pipeline/fetchers/
  utils.ts                          # FetcherResult, parseFdaDate, dateWindowsFor, sleep, logPipelineRun, stripHtml, extractMainContent
  federal-register.ts               # FR fetcher — accepts SupabaseClient, mode, date range
  openfda-enforcement.ts            # Recall fetcher — accepts SupabaseClient, mode, date range
  warning-letters.ts                # WL fetcher — AJAX list + per-letter page scraping, MARCS extraction
  fda-rss.ts                        # RSS fetcher — polls 8 FDA feeds via fast-xml-parser (no params)
  schemas/
    federal-register.ts             # Zod: FRListResponseSchema, FRDetailDocumentSchema
    openfda-enforcement.ts          # Zod: EnforcementResponseSchema
    warning-letters.ts              # Zod: WLRowSchema, WLAjaxResponseSchema
    rss.ts                          # Zod: RssItemSchema

src/pipeline/enrichment/
  prompts.ts                        # System prompt, Zod output schema, buildEnrichmentPrompt()
  processor.ts                      # enrichItem() — LLM call, rule validators, cross-ref, DB writes
  cross-reference.ts                # Steps 1b (use-context lookup) + 1c (LLM cross-category inference)
  embeddings.ts                     # Chunking + OpenAI embedding generation
  runner.ts                         # Orchestration — content-fetch → enrich → embed per item
  content-fetch.ts                  # Fetch full FDA page content for thin RSS items

scripts/
  run-fetcher.ts                    # Dev CLI: fr-backfill, enforcement-backfill, wl-backfill, wl-incremental, rss-poll
  run-enrichment.ts                 # Dev CLI: enrich unenriched items (--limit, --type)
  run-golden-tests.ts               # Golden fixture validation (--enrich to re-enrich first)
  test-content-fetch.ts             # Debug: fetch single FDA URL and print extracted text
  bootstrap-gsrs.ts                 # Seeds 169K substances + 950K codes. --codes-only for fast backfills.

tests/golden/
  fixtures.ts                       # 10 golden fixtures with expected enrichment output
```
