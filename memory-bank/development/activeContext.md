---
title: Active Development Context
created: 2026-03-03
last-updated: 2026-03-06
deploy: Vercel (live), Stripe webhook endpoint registered
maintainer: RB
status: Active — Pilot program signup live. Session 2 onboarding frontend continuing.
---

# Active Development Context

**Phase:** Pilot program signup live. Re-enrichment complete. Verdict system live. Session 2 onboarding frontend continuing.
**Live partner:** Clawdbot on Discord (`#clawdbot` for general chat, `#weekly-roundup` for content). VPS: `ssh root@108.61.151.130`.
**Next up:** Continue Session 2 frontend (manual entry tab, product classification, onboarding routing).

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
- [x] **Data schema v1 complete** — 22 live tables (originally 25, schema cleanup 2026-03-05). Substances-based product matching, flexible classification. See `architecture/data-schema.md`
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

### What's Done (Pilot Program Signup)
- [x] **Pilot signup flow** — `/api/signup` accepts name+company+email+consent, inserts `email_subscribers`, sends magic link via `adminClient.auth.signInWithOtp` with user metadata (name, company_name, pilot_feedback_consent, terms_version)
- [x] **Auth callback updated** — reads pilot metadata from `user.user_metadata`, new users get `access_level='monitor'`, `max_products=5`, pilot fields. Existing users: only email/profile updated (preserves Stripe-managed access). Links `email_subscribers` by email.
- [x] **SignupForm** — name (required), company (required), email, feedback consent checkbox with Terms/Privacy links. "Join the Pilot" button. Success shows "Check your email" with canary-colored email.
- [x] **Homepage rewrite** — Social proof: "PILOT PROGRAM" badge, capability statement (no fabricated quote). Dark CTA: "Don't find out from a recall notice" + pilot onboarding copy. No dollar amounts anywhere.
- [x] **Nav/footer** — Pricing link removed from Header + Footer. CTAs changed to "Join the Pilot".
- [x] **Pricing page** — accessible via direct URL, amber "Pilot program active" banner, bottom CTA rewritten with pilot framing.
- [x] **Login page** — "Not signed up yet? Join the pilot". `shouldCreateUser: false` (login only works for existing users).
- [x] **DB migration** — `pilot_feedback_consent`, `pilot_consented_at`, `terms_version` columns on `users` table.
- [x] **Code-reviewed** — 3 criticals fixed: callback no longer overwrites paid users (C1), source CHECK constraint (C3), login bypass prevention (W3). Plus: email normalization, autoComplete attributes, dark/light success text.

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

### What's Done (Session 1: Onboarding Backend — API Routes)
- [x] **Types + queries module** — `src/lib/products/types.ts` (Zod schemas with DSLD numeric refinement), `src/lib/products/queries.ts` (server-only: DSLD search/detail, product CRUD, substance resolution, ingredient ingestion)
- [x] **DSLD search API** — `GET /api/dsld/search?q=...&limit=...`, ILIKE prefix on `product_name`, `market_status = 'On Market'`, 30/min rate limit, auth required (dev bypass)
- [x] **DSLD detail API** — `GET /api/dsld/[id]`, 3 parallel queries (product + ingredients + other_ingredients), auth required (dev bypass)
- [x] **Products API** — `GET/POST /api/products` (list with ingredient counts + create with plan limit + duplicate check + DSLD ingestion), `GET/PATCH/DELETE /api/products/[id]` (single + update name/brand + soft delete, UUID validation, 10/min rate limit)
- [x] **Shared rate limiter** — `src/lib/rate-limit.ts` extracted from 3 inline copies. Configurable limit + window per caller.
- [x] **Migration** — `add_unique_subscriber_products_external` (unique partial index, race condition guard for duplicates)
- [x] **Type consolidation** — `AddProductRequest` in `api.ts` now re-exports `CreateProductInput` from Zod schema
- [x] **Triple code-reviewed** — 3 criticals (plan limit race error handling, duplicate race unique index, UUID validation) + 6 warnings (redundant updated_at, throw-on-error for count/limit, numeric external_id, ingredient warning, deferred product_category_id, is_active via DELETE only)

### What's Done (Clawdbot / Content Automation)
- [x] **Clawdbot VPS** — Vultr `vc2-1c-2gb` ($12/mo), Ubuntu 24.04, Node.js 22, OpenClaw v2026.3.2. IP: `108.61.151.130`. Systemd service `openclaw.service`.
- [x] **Discord bot** — `ClawdBot - Canary` on `Bizniz` server. 5 channels: `#blog-drafts`, `#linkedin-drafts`, `#weekly-roundup`, `#alerts`, `#clawdbot` (general chat). `requireMention: false`.
- [x] **Helper scripts** — `query-supabase.mjs` (query enriched items), `publish-blog.mjs` (POST to `/api/blog`). Deployed to VPS workspace.
- [x] **Weekly roundup skill** — queries enriched items → drafts 800-1200 word blog post → posts to Discord → publishes on approval
- [x] **Cron job** — `weekly-roundup` fires Fridays 9 AM ET → `#weekly-roundup` channel
- [x] **Local repo files** — `scripts/clawdbot/` with cloud-init, scripts, skill, setup automation
- [x] **SEO keyword research** — DataForSEO API (`scripts/seo-research.ts`). 71 keywords tested, 31 with volume, 40 zero-volume. Key clusters: FDA warning letters (5,400 vol/$11.78 CPC), FDA recalls (7,300 combined), MoCRA (500 combined), supplement regs (570). Nobody searches for "FDA regulatory monitoring" — must target what buyers already search.
- [x] **SEO blog post skill** — `scripts/clawdbot/skills/seo-blog-post/SKILL.md` deployed to VPS. Targets 5 keyword clusters with SEO-optimized structure. References editorial voice doc.
- [x] **SEO blog cron** — `seo-blog-tuesday` (Tue 10AM ET) + `seo-blog-thursday` (Thu 10AM ET) → `#blog-drafts`. Rotates clusters.

### Up Next

#### Session 0: Product Categories + Enrichment Update (DONE)
- [x] **Migration `20260304082551_product_categories_and_company_name`** — `product_categories` table with 82 seeded rows, `product_category_id` FK on `subscriber_products`, `company_name` on `users`, RLS policies. Applied via Supabase MCP.
- [x] **Enrichment pipeline updated** — `prompts.ts`: 119 `PRODUCT_CATEGORY_SLUGS` across 8 sectors, honest classification (no artificial scoping). `processor.ts`: upsert for idempotent re-enrichment, `maxRetries: 2`. `runner.ts`: concurrent via p-limit (default 15). `content-fetch.ts`: no host allowlist (trusts source URLs from our fetchers).
- [x] **GSRS bootstrap complete** — 949K codes, 96 systems, 166K substances. `--codes-only` mode added for future backfills.
- [x] **DSLD database loaded** — 214K products, 2M ingredients, 1.47M statements, 253K companies (4.2M rows, ~900MB). pg_trgm typeahead at 12ms. `scripts/bootstrap-dsld.ts`. Refresh quarterly.
- [x] **Backfills complete** — 7,572 items in DB (3,343 WL, 2,809 recalls, 1,124 notices, 136 rules, 89 safety alerts, 50 proposed rules, 21 press releases).
- [x] **All 7,573 items enriched** — 0 errors. Honest classification across all FDA sectors. Concurrent processing (p-limit @ 15). Content fetched from FDA.gov + federalregister.gov. 119 product categories in DB.

#### Session 1: Onboarding Backend — API Routes (DONE)
- [x] **DSLD typeahead API** (`/api/dsld/search`, `/api/dsld/[id]`) — ILIKE prefix search on local `dsld_products`, product detail + ingredients join. 30/min rate limit, auth required (dev bypass for curl testing).
- [x] **Product API routes** (`/api/products`, `/api/products/[id]`) — GET list + POST create + GET single + PATCH update + DELETE (soft). Wires DSLD selection → `subscriber_products` + `product_ingredients` with substance resolution via `find_substance_by_name` RPC.
- [x] **Plan limit enforcement** — DB trigger `check_max_products()` (23514) + API-level fast-path 403. Both paths return friendly PLAN_LIMIT error code.
- [x] **Duplicate guard** — unique partial index `uq_subscriber_products_external` on `(user_id, data_source, external_id) WHERE external_id IS NOT NULL AND is_active = true`. API detects 23505 + returns DUPLICATE code.
- [x] **Shared rate limiter** — `src/lib/rate-limit.ts` extracted, used by DSLD search (30/min) and product mutations (10/min).
- [x] **Triple code-reviewed** — code-reviewer, backend-architect, code-architect. 3 criticals + 6 warnings fixed. See progress.md for details.

### What's Done (Session 2: Onboarding Frontend — Multi-Image Label Upload)
- [x] **DB migration `create_product_images_drop_label_image_path`** — `product_images` junction table (id, product_id FK CASCADE, storage_path, sort_order, created_at) replaces `label_image_path` column on `subscriber_products`
- [x] **Multi-image vision extraction** — `src/lib/products/vision.ts` sends all images (up to 5) in one vision API call. Fallback chain: Gemini Flash → GPT-4o-mini → Claude Haiku. Principled prompt: extracts individual FDA-matchable substances, flattens parenthetical sub-ingredients recursively.
- [x] **Multi-image upload UI** — `LabelUpload.tsx` supports drag-and-drop + file picker for multiple images, preview grid with per-image remove buttons, "Add photo" tile with drop target, client-side cap at 5
- [x] **Substance hot-check at parse time** — `parse-label/route.ts` resolves ALL extracted ingredients against GSRS (`resolveSubstance`) BEFORE returning to client. Users see match status immediately, not after save.
- [x] **Ingredient preview with match status** — AddProductPanel shows green dot ("Monitoring as [canonical name]"), amber ("Possible: [name]"), gray ("Not in FDA substance database — won't generate alerts"). Header: "X monitored, Y not trackable".
- [x] **Substance typeahead autocomplete** — `SubstanceAutocomplete` component with debounced search against `substance_names` table (166K substances). Users can add specific substances for unmatched items (e.g., add individual ingredients within "Natural & Artificial Flavors").
- [x] **API endpoints** — `GET /api/products/search-substances?q=...` (typeahead, dedup by substance_id), `GET /api/products/resolve-ingredient?name=...` (single resolution)
- [x] **Products API updated** — `image_paths` array replaces `label_image_path`, bulk-insert into `product_images` after product creation
- [x] **Dev auth bypass** — consistent UUID (`70360df8-...`) across products page, parse-label route, and products route (GET/POST)

#### Session 2: Onboarding Frontend (Remaining)
- [ ] **Manual entry tab** — ingredient entry without label scan (text input + substance resolution)
- [ ] **Product classification** — Gemini Flash picks `product_type` + `product_category_slug` from controlled vocab
- [ ] **Onboarding page** (`/app/onboarding`) — post-signup, skippable, uses same components
- [ ] **Onboarding routing** — post-signup redirect, 0-products banner on feed
- [ ] **Product detail image display** — show stored product_images in ProductContextPanel (signed URLs)

### What's Done (Phase 2C: Inngest Pipeline Orchestration)
- [x] **Inngest functions wired** — `daily-ingest` (cron `0 6,18 * * *`, 4 parallel fetchers + enrichment) and `enrich-batch` (event-driven, limit 1-200)
- [x] **Error handling** — catch-everything inside each `step.run()` (Inngest v3 step failure blocks all subsequent steps). Error messages truncated to 500 chars.
- [x] **Concurrency guards** — `{ limit: 1 }` on both functions prevents overlapping runs
- [x] **Code-reviewed** — 2 criticals + 4 warnings fixed (error handling, limit validation, parallel fetchers, concurrency key, RSS param cleanup, error truncation)
- [x] **RSS fetcher cleanup** — removed unused `{ mode: "poll" }` param from `fetchFdaRss()` signature

### What's Done (Phase 4C: Product Matching Engine)
- [x] **Matching query module** — `src/lib/products/matches.ts`. No new tables — matches computed via JOINs on existing data.
- [x] **Two match signals**: substance matches (`regulatory_item_substances` ↔ `product_ingredients` on `substance_id`) + category matches (`item_enrichment_tags` product_type ↔ `subscriber_products` via `product_category_id`)
- [x] **Relevance scoring** — substance specificity (IDF-like: `1/log2(count+1)`) weights down ubiquitous substances (Sugar, Listeria) and boosts specific ones (Gum Acacia, Semaglutide). Category overlap and action type (ban_restriction) boost score.
- [x] **3 Postgres RPC functions** — `get_substance_matches(user_id, since?)`, `get_category_matches(user_id, since?)`, `check_urgent_matches(item_id)`. Optimized CTE scopes frequency counting to user's substances only (~3.8ms).
- [x] **15-minute in-memory cache** — `invalidateUserMatches(userId)` on product add/remove, `invalidateAllMatches()` after enrichment.
- [x] **Urgent alert check** — `checkItemForUrgentMatches(itemId)` for post-enrichment recall/ban/safety_alert detection.
- [x] **Migrations applied**: `add_match_rpc_functions`, `update_match_rpcs_with_specificity_v2`, `optimize_substance_matches_rpc`, `add_get_live_verdict_counts_rpc`

### What's Done (Lifecycle State System)
- [x] **Lifecycle utility** — `src/lib/utils/lifecycle.ts`: pure `getLifecycleState()` + `isLiveState()`. Deadline-first decision tree: has deadline → >90d=active, ≤90d=urgent, passed<30d=grace, passed≥30d=archived. No deadline → active window by item_type (recalls/safety/import=90d, WL/483=60d, else=30d) → archived. UTC date parsing. Injectable `now` for testability.
- [x] **Types updated** — `lifecycle_state: LifecycleState` on `FeedItemEnriched` + `ProductVerdictItem`. No DB changes — pure computation from existing `item_type`, `published_date`, `deadline`.
- [x] **Query functions** — `getFeedItems()`, `getProductVerdicts()` compute lifecycle per item. `getProductVerdictCounts()` uses `get_live_verdict_counts` RPC — lifecycle filtering runs entirely in Postgres.
- [x] **SQL-level filtering** — `get_live_verdict_counts` RPC (migration `add_get_live_verdict_counts_rpc`): same decision tree as `lifecycle.ts` in SQL. Deadline items live if `deadline > now - 30d`, no-deadline items use type-based windows (90/60/30d). `getFeedItems()` adds `published_date >= now - 120d` floor when `includeArchived=false`.
- [x] **Feed page** — defaults to live items only. `showArchived` URL param + "Include Archived" toggle pill in `FeedFilters`. Passes `includeArchived` to `getFeedItems()` for SQL-level filtering.
- [x] **Feed cards** — `FeedItemCard`: red dot for urgent, amber for grace, `opacity-60` for grace/archived. `FeedDetailPanel`: always-visible lifecycle badge (Urgent/Active/Grace Period/Archived) replaces old `urgencyBadge()`.
- [x] **Products page** — `ProductsLayout.toDetailData()` splits verdicts into live vs archived via `isLiveState()`. Status derived from live verdicts only. `resolvedHistory` now populated from archived verdicts (was always empty). `MatchCard` uses lifecycle-to-status mapping.
- [x] **Code-reviewed** — W1 fixed (UTC `Z` suffix on date parsing). W2 (verdict count query growth) fixed with RPC. `urgency_score` left vestigial per plan.

### What's Done (Verdict System + Re-Enrichment)
- [x] **Verdict system live** — `src/lib/products/verdicts.ts`. Gemini Flash evaluates whether regulatory items actually affect subscriber products. Three trigger points: post-enrichment (runner step d), post-product-add (API route), CLI backfill (`scripts/run-verdicts.ts` with p-limit concurrency).
- [x] **Verdict prompt tightened** — brand-specific recalls (with UPC/lot/company) filtered as noise. Only industry-wide rules, systemic contamination, and genuine gray areas flagged. False positives dropped from 7→1 on test product (Bum Itholate Protein).
- [x] **App pages wired to real data** — feed, item detail, products all query real DB. Mock data removed. Search hidden from nav (not available at launch).
- [x] **Full re-enrichment complete (2026-03-06)** — 7,566/7,574 enriched (8 errors), 979 cross-references, 669 verdicts generated inline. ~4.2 hours at concurrency 15. Tightened cross-ref + verdict prompts applied.
- [x] **`server-only` removed from `admin.ts`** — was blocking CLI scripts (enrichment runner, verdict backfill). Next.js tree-shaking already prevents client-side import of service role key.
- [x] **`scripts/run-verdicts.ts`** — one-off verdict backfill script. Concurrent (p-limit@15). Evaluates all products against candidate items by substance + category overlap.

#### Deferred
- [ ] Batch/CSV import for 50+ products
- [ ] USDA FDC integration (food products)
- [ ] Supplier/company detail on products — enables matching facility-specific actions to actual suppliers

### Backfills (Done)
All backfills complete. 7,572 items in DB ready for enrichment.

- WL: 3,343 warning letters (full backfill, all records)
- FR: 1,310 items (2-year range: 2024-03 → 2026-03). `run-fetcher.ts` now supports `--start`/`--end` CLI flags.
- Enforcement: 2,809 recalls (2-year range: 2024-03 → 2026-03, 1 transient 502 error on Supabase)
- RSS: 2 new items from latest poll (148 skipped as known)
- Stale enrichments: 23 enriched + 2 error items reset to `ok` via SQL

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
  - `product_type` — **CONTROLLED VOCAB from `product_categories` table** (119 slugs across 8 sectors: `skin_care`, `protein_powders`, `prescription_drugs`, `class_ii_devices`, etc.). No free text.
  - `facility_type` — "outsourcing facility", "food manufacturer", "cosmetic contract manufacturer" (free text)
  - `claims` — "structure-function claims", "health claims", "organic" (free text)
  - `regulation` — "21 CFR 111", "MoCRA", "FSVP" (free text)
- Phase 4C match_type: `'category_overlap'`
- Examples: MoCRA registration deadlines, GMP rule changes, labeling format requirements, testing protocol requirements
- Key: `affected_ingredients = []` is CORRECT for these items. Do not hallucinate substances.

### Segments removed (2026-03-04), Sectors removed (2026-03-05), Sector scope removed (2026-03-05)
- `segment_impacts` table **DROPPED** — the coarse food/supplement/cosmetics layer was never used for matching, no users, no MVP shipped. The product category slugs + substance matching fully replace it.
- Cross-reference inference (Step 1c) infers new product **categories** directly. No sector-based gate — fires whenever use contexts exist for resolved substances.
- `EnrichmentOutputSchema` no longer has a `segments` field. `slugToSector()`, `useContextToSector()`, and `type Sector` deleted from `cross-reference.ts`.
- **ALL FDA sectors in scope for thinking.** The system already monitors pharma, devices, biologics, tobacco, veterinary — not just food/supplements/cosmetics. 119 product categories across 8 sectors. Marketing may focus specific verticals for GTM, but strategic analysis must consider the full FDA landscape.

### Schema additions (Supabase migration applied 2026-03-03)
- `item_enrichments.regulatory_action_type` — what is happening (recall, ban_restriction, compliance_requirement, cgmp_violation, etc.)
- `item_enrichments.deadline` — compliance date if any (ISO date)

Golden fixtures in `tests/golden/fixtures.ts` test ingredient extraction, action type, and product categories.

---

## Cross-Reference Inference Layer (Built 2026-03-04, Refocused 2026-03-04)

**THE SINGLE BIGGEST PRODUCT DIFFERENTIATOR. Built, code-reviewed, and data loaded. Ready to activate.**

### What It Does

Step 1b: Deterministic use-context derivation from GSRS substance codes. Maps 9 code systems (CFR, CODEX, JECFA, DSLD, RXCUI, DRUG BANK, DAILYMED, EPA PESTICIDE CODE, Food Contact Sustance Notif) to 8 `UseContextCategory` types. Pure TypeScript, no LLM. GSRS codes are ground truth.

Step 1c: LLM cross-**category** inference using Gemini 2.5 Pro with thinking (budget: 4096). Fires whenever use contexts exist for resolved substances. Reasons about exposure routes, regulatory precedent, and action mechanism to determine which additional **product categories** are genuinely affected. No sector-based gating — product categories are the decision layer.

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
2. ~~**Re-enrich 422 WLs**~~ — DONE. All 7,573 items enriched with cross-reference inference active.

---

## Key Decisions Made

### Product Model (Current)
1. **Products are the core unit.** The email says "Your Marine Collagen Powder" not "This week in supplements." Product categories are the classification layer — sectors exist only as display metadata.
2. **Real product data from public databases.** DSLD for supplements (214K products, structured ingredients), USDA FDC for food (454K products). Cosmetics is manual entry (no public database). Not self-reported guesses — verified ingredient lists.
3. **Two emails, two jobs.** Weekly Update (generic, free, content marketing) + Product Intelligence Email (custom per subscriber, paid, event-driven).
4. **Product intelligence is event-driven.** Something affects your products → email immediately. Nothing happened → weekly "all clear." Don't wait for Friday if something is urgent.
5. **Everything shows up, nothing is hidden.** Product emails show ALL items. Product-matched items get full analysis. Same-industry items get a brief. Everything else gets a one-liner + link.
6. **The buyer expands.** Not just VP Reg Affairs anymore. Founders, quality directors, product managers — anyone who thinks in products.

### Pricing Model (Revised March 2026)
7. **Launch with Monitor only.** Monitor ($99/mo) = emails + alerts + dashboard. Research tier ($399/mo) added later once enforcement DB, AI search, and trends are built to justify the price.
8. **Base + per-product pricing.** Both levels include 5 products. $10/product/month beyond that (raised from $6 — market research validated $10 as floor for intelligence-layer monitoring tools). Same per-product rate for both levels. Roadmap to $15-20/product as intelligence deepens.
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
- ~~$6/product/mo~~ → $10/product/mo. Market research confirmed $6 was below every intelligence-layer monitoring comparable (BrandMentions $5-8, Ahrefs $10-17, Brand24 $16-50). $10 is the floor. Roadmap to $15-20.
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
- **Supabase**: Pro plan (Small compute, 2GB RAM, 2-core ARM). Schema live — 22 tables, RLS enabled. **7,573 regulatory items ALL ENRICHED** (3,343 WL, 2,809 recalls, 1,124 notices, 136 rules, 89 safety alerts, 50 proposed rules, 21 press releases). 169K substances, 950K codes, 119 product categories. Enforcement fields on `regulatory_items` directly.
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
  processor.ts                      # enrichItem() — LLM call, cross-ref, DB writes
  cross-reference.ts                # Steps 1b (use-context lookup) + 1c (LLM cross-category inference)
  embeddings.ts                     # Chunking + OpenAI embedding generation
  runner.ts                         # Orchestration — content-fetch → enrich → embed per item
  content-fetch.ts                  # Fetch full page content for thin RSS items (any source URL, no host allowlist)

scripts/
  run-fetcher.ts                    # Dev CLI: fr-backfill, enforcement-backfill, wl-backfill, wl-incremental, rss-poll
  run-enrichment.ts                 # Dev CLI: enrich unenriched items (--limit, --type, --concurrency, --no-cap)
  run-golden-tests.ts               # Golden fixture validation (--enrich to re-enrich first)
  test-content-fetch.ts             # Debug: fetch single FDA URL and print extracted text
  bootstrap-gsrs.ts                 # Seeds 169K substances + 950K codes. --codes-only for fast backfills.
  seo-research.ts                   # DataForSEO keyword research (bulk volume + difficulty)

scripts/clawdbot/skills/
  weekly-roundup/SKILL.md           # Weekly FDA roundup skill (Fri 9AM cron)
  seo-blog-post/SKILL.md            # SEO-targeted blog post skill (Tue+Thu 10AM cron)

tests/golden/
  fixtures.ts                       # 10 golden fixtures with expected enrichment output

src/lib/products/
  types.ts                          # Zod schemas (CreateProduct, UpdateProduct, DSLDSearch, ParsedLabel, ParsedIngredient) + response types
  queries.ts                        # Server-only: DSLD search/detail, product CRUD, substance resolution, ingredient ingestion, product_images fetch
  vision.ts                         # Multi-image vision extraction (Gemini Flash → GPT-4o-mini → Claude Haiku fallback chain)

src/lib/utils/lifecycle.ts            # Lifecycle state: getLifecycleState() + isLiveState(). Pure, isomorphic.
src/lib/rate-limit.ts               # Shared in-memory rate limiter (configurable limit + window)

src/app/api/dsld/
  search/route.ts                   # GET typeahead — ILIKE prefix, 30/min, auth (dev bypass)
  [id]/route.ts                     # GET product detail + ingredients (3 parallel queries)

src/app/api/products/
  route.ts                          # GET list (with ingredient counts) + POST create (plan limit, duplicate check, DSLD ingestion, product_images bulk insert)
  [id]/route.ts                     # GET single + PATCH update + DELETE soft delete (UUID validation, ownership, 10/min)
  parse-label/route.ts              # POST multi-image upload — vision extraction + substance hot-check + storage upload
  search-substances/route.ts        # GET typeahead against substance_names (for manual ingredient entry)
  resolve-ingredient/route.ts       # GET single ingredient resolution against GSRS

src/components/app/products/
  LabelUpload.tsx                   # Multi-image upload UI (drag-and-drop, previews, cap at 5)
  AddProductPanel.tsx               # Product creation panel — DSLD search, label scan, ingredient preview with match status, substance autocomplete
```
