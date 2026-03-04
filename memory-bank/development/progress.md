---
Last-Updated: 2026-03-06
Maintainer: RB
Status: Active — Session 1 API routes shipped. Enrichment pending. Inngest wired. Stripe, blog, cross-ref, auth shipped. Sectors removed from pipeline.
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
| **Schema Live (Supabase)** | **2026-03-03** | **Done — 25 tables, RLS, seeds applied. GitHub: Gr0x01/policycanary** |
| **Marketing Site** | **2026-03-03** | **Done — landing page, pricing, sample report, signup API. Homepage visual pass: gradient fix, ProductShowcase, How It Works rebuild.** |
| **Data Pipeline: FR + openFDA** | **2026-03-03** | **Done — fetchers built + tested. 175 items, 109 enforcement details in DB** |
| **Data Pipeline: Warning Letters + RSS** | **2026-03-03** | **Done — fetchers built + tested. 422 WL items in DB (partial; full 3,313-record backfill deferred to Phase 2B). 131 RSS items. 364 MARCS numbers extracted.** |
| **Homepage Visual Overhaul** | **2026-03-03** | **Done — light theme, two-column hero, stagger animations** |
| **Auth: Magic Link (Phase 4A)** | **2026-03-03** | **Done — verified end-to-end. Magic link → PKCE exchange → public.users upsert → dashboard.** |
| **Web App MVP (Phase 6)** | **2026-03-03** | **Done — feed, item detail, search API (RAG), products. Mock data layer with USE_MOCK flag.** |
| **Stripe Subscriptions (Phase 4B)** | **2026-03-05** | **Shipped — checkout, webhook, portal, PricingTable, AppNav upgrade/billing. Triple code-reviewed (4 critical + 9 warning fixes). Migration `004`. Stripe Dashboard configured, webhook live. Deployed to Vercel.** |
| **Enrichment Pipeline (Phase 2B)** | **2026-03-04** | **Stabilized — golden tests 10/10. Content-fetch, prompt fixes, truncation removed.** |
| **Cross-Reference Inference Layer** | **2026-03-04** | **Built + data loaded + refocused — Steps 1b + 1c. Segments removed (2026-03-04), sectors removed (2026-03-05). Step 1c fires whenever use contexts exist (no sector gate). Schema migration, bootstrap updated, processor restructured. Code-reviewed. GSRS bootstrap complete: 949K codes, 96 systems, 166K substances.** |
| **Blog Section** | **2026-03-05** | **Shipped — /blog, /blog/[slug], RSS feed, Clawdbot POST API. Migration 003_blog_posts. Code-reviewed (3 critical + 4 warning fixes). react-markdown + remark-gfm added.** |
| **Product Categories Taxonomy** | **2026-03-04** | **Designed — ~111 categories across 8 groups (cosmetics, food, supplements, pharma, devices, biologics, tobacco, veterinary). Sacred controlled vocab (no free text). Migration applied.** |
| **Clawdbot (OpenClaw) Deployed** | **2026-03-05** | **Live — Vultr VPS (108.61.151.130), Discord bot on Bizniz server, weekly-roundup cron (Fridays 9 AM ET), blog publish pipeline. `scripts/clawdbot/` in repo.** |
| **Session 0: Categories Migration + Enrichment** | **2026-03-04** | **Done — migration `20260304082551_product_categories_and_company_name` applied (82 categories seeded). Pipeline updated to controlled slugs. Golden tests 10/10 (38/38 assertions).** |
| **Inngest Pipeline Orchestration (Phase 2C)** | **2026-03-04** | **Shipped (minimal) — daily-ingest cron (twice daily, 4 parallel fetchers + enrichment), enrich-batch (on-demand). Code-reviewed (2C + 4W fixed).** |
| **DSLD Database Loaded** | **2026-03-04** | **214K products, 2M ingredients, 1.47M statements, 253K companies (4.2M rows, ~900MB). pg_trgm typeahead 12ms. Migration `dsld_product_database`. Bootstrap script `scripts/bootstrap-dsld.ts`.** |
| **Backfills Complete** | **2026-03-04** | **Done — 7,572 items (3,343 WL, 2,809 recalls, 1,124 notices, 136 rules, 89 safety alerts, 50 proposed rules, 21 press releases). 2-year range for FR + enforcement. `run-fetcher.ts` supports `--start`/`--end`.** |
| Full Enrichment Run | - | Pending (~7,567 items) |
| **Session 1: Onboarding Backend (API Routes)** | **2026-03-05** | **Shipped — DSLD search/detail, product CRUD, substance resolution, plan limits. Triple code-reviewed (3C + 6W fixed). Migration `add_unique_subscriber_products_external`. Shared rate limiter extracted.** |
| Session 1b: Onboarding Backend (Remaining) | - | Pending — ingredient parsing (Gemini Flash), GSRS search, product classification |
| Session 2: Onboarding Frontend | - | Pending |
| Product Intelligence Email MVP | - | Pending |
| Validation (sample emails, trial signups) | - | Pending |
| Launch | - | Pending |

---

## Data Sources

| Source | Coverage | Status |
|--------|----------|--------|
| Federal Register API | Rules, proposed rules, notices (1994-present) | **Backfilled** — 1,310 items (2-year: 2024-03 → 2026-03). `--start`/`--end` CLI flags added. |
| openFDA API | Enforcement/recalls, adverse events (2004-present) | **Backfilled** — 2,809 recalls (2-year: 2024-03 → 2026-03). |
| FDA RSS Feeds | Recalls, safety alerts, press releases (8 feeds) | **Live** — 133 items. Latest poll: 2 new. |
| FDA Warning Letters | ~3,352 letters, all centers | **Backfilled** — 3,343 letters (full). AJAX + per-letter scraping. MARCS-CMS extraction. |
| Regulations.gov | Comment periods, dockets | Researched — free key, Phase 2 |
| FDA Data Dashboard | Inspections, 483s, compliance actions | Researched — requires registration, Phase 3 |
| State regulations | Prop 65, state-level rules | Deferred (expansion) |
| **DSLD (Supplement Products)** | **214K supplement products, structured ingredients** | **Loaded — 4.2M rows in Supabase (products, ingredients, companies, statements). pg_trgm typeahead 12ms. Refresh quarterly.** |
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
| 2026-03-03 | ~~**Pricing finalized: $49/$249 + $6/product**~~ | ~~Monitor $49/mo, Monitor+Research $249/mo.~~ Superseded by March 2026 pricing revision. |
| 2026-03-03 | **Research platform = the moat** | Enforcement DB, AI search, trends, regulatory archive. Fills $100-$500/mo gap between free FDA tools and $25K+ enterprise. One Redica 483 doc costs $289 — our full platform is $399/mo. |
| 2026-03-04 | **Pricing revised: $99/$399 + $6/product** | Market research validated higher pricing. $49 was below FoodDocs ($84/mo), risked credibility. $99 base signals seriousness while staying under 1hr consultant time. $399 Research tier (4x multiplier) added later once features justify it. |
| 2026-03-04 | **Launch with Monitor tier only** | Research tier deferred until enforcement DB, AI search, and trend analysis are built. Ship Monitor first, add Research when features justify $399. |
| 2026-03-04 | **Market validation research completed** | Pain point confirmed: FDA warning letters up 73% (H2 2025), 3,500 staff cut, no product-level monitoring tool exists for SMBs. Pricing validated: small firms spend $46K-$184K/yr on compliance, consultants charge $150-$500/hr. See `research/pain-point-validation-2026-03-04.md` and `research/pricing-validation-market-research.md`. |
| 2026-03-04 | **Sacred product categories vocabulary** | ~111 categories across 8 groups (cosmetics, food, supplements, pharma, devices, biologics, tobacco, veterinary). No free text anywhere — both enrichment tagging AND subscriber product classification reference same slugs. New categories added by manual INSERT only. |
| 2026-03-04 | **Segments removed from enrichment pipeline** | `segment_impacts` table dropped. Coarse food/supplement/cosmetics segments were never used for matching and no MVP shipped. Product category slugs + substance matching fully replace them. Migration `drop_segment_impacts` applied. |
| 2026-03-05 | **Sectors removed from pipeline logic** | `slugToSector()`, `useContextToSector()`, `type Sector`, `SegmentType` all deleted. Step 1c cross-reference fires whenever use contexts exist (no sector gate). Sector field on `product_categories` table kept as display-only metadata (`@deprecated`). `ProductType` enum updated for new groups. `segment` fields removed from API types. All LLM prompts updated: "cross-sector" → "cross-category". |
| 2026-03-03 | **Full backfills deferred until Phase 2B enrichment** | Don't flood DB with thousands of unenriched records. Raw ingestion without segment tags, embeddings, and substance extractions creates noise that's expensive to reprocess. Backfills run once the enrichment pipeline exists and can run alongside. |

---

## Costs (Projected)

| Item | Estimated Cost |
|------|----------------|
| Initial data enrichment (LLM) | ~$15-38 |
| Monthly infrastructure | ~$10-75/mo |
| Domain (policycanary.io) | ~$30/year |
| Consultant validation (3-4 hours) | ~$500-$1,200 |
| Clawdbot VPS (Vultr) | $12/mo |
| **Total to MVP** | **~$555-$1,340** |

**Ongoing:** ~$22-87/month (scales with usage and subscribers; includes $12/mo VPS)

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
  - **Product matching**: `product_matches` (the money table) matches regulatory items to subscriber products via substances + product categories. `item_enrichment_tags` provides the category-level matching layer.
  - **TEXT + CHECK instead of ENUM everywhere** for easy iteration.
  - **Deferred expansion tables**: state compliance (chemicals, state_chemical_bans, cosmetic_chemical_reports) and adverse events deferred to when those features are built.
- **Research findings preserved**: FDA industry codes (53=cosmetics, 54=supplements), openFDA enforcement classification gap (supplements/cosmetics both show as "Food"), warning letters have zero structured metadata, CFR references are the structural hook for Federal Register classification.
- Schema saved to `architecture/data-schema.md`.

### 2026-03-03 — Phase 2A-2: Data Pipeline (Warning Letters + FDA RSS)

- **Warning letters fetcher** (`src/pipeline/fetchers/warning-letters.ts`) — paginates FDA DataTables AJAX endpoint (100/page), fetches each letter page for full text + MARCS-CMS number extraction, 200ms rate limiting on page fetches, `backfill` + `incremental` modes (incremental stops when a full page is all known). Date fields returned as `<time datetime="...">` HTML — parsed via `datetime` attribute.
- **FDA RSS fetcher** (`src/pipeline/fetchers/fda-rss.ts`) — polls 8 feeds (recalls, food-safety-recalls, medwatch, press-releases, tainted-supplements, health-fraud, food-allergies, fda-outbreaks), 300ms between feeds, `fast-xml-parser` for XML parsing, normalises single vs. array `item` fields. One `pipeline_runs` entry per poll covering all feeds.
- **Zod schemas** (`schemas/warning-letters.ts`, `schemas/rss.ts`) — validates AJAX response and RSS items respectively
- **npm scripts** — `pipeline:wl-backfill`, `pipeline:wl-incremental`, `pipeline:rss-poll`
- **Tested live**: 422 WL items created (mid-run partial — full backfill deferred to Phase 2B), 364 MARCS numbers extracted. 131 RSS items on first poll; second poll correctly skipped 149/150 as duplicates.
- **Security fix**: `extractHref` validates path starts with `/` to prevent SSRF from unexpected AJAX response data.
- **DB state after this phase**: 422 warning letters + 131 RSS items + 175 FR items + 109 enforcement items = 837 total regulatory_items. All fetchers tested against live APIs. `npm run type-check` clean.

### 2026-03-03 — Phase 2A-1: Data Pipeline (Federal Register + openFDA Enforcement)

- **Federal Register fetcher** (`src/pipeline/fetchers/federal-register.ts`) — paginated list + per-doc detail fetch, 100ms rate limiting, 6-month backfill windows, deduplication via `(source_id, source_ref)`, maps FR types to `rule/proposed_rule/notice`
- **openFDA enforcement fetcher** (`src/pipeline/fetchers/openfda-enforcement.ts`) — skip-based pagination, 250ms rate limiting, 3-month backfill windows, writes to both `regulatory_items` + `enforcement_details`, deterministic `source_ref` from recall_number → event_id → hash
- **Shared utilities** (`src/pipeline/fetchers/utils.ts`) — `FetcherResult` type, `parseFdaDate`, `dateWindowsFor`, `sleep`, `logPipelineRun`
- **Zod schemas** (`src/pipeline/fetchers/schemas/`) — validates all API responses, parse failures counted + logged without crashing
- **Dev test script** (`scripts/run-fetcher.ts`) — loads `.env.local`, runs narrow Jan–Feb 2025 window
- **npm scripts** — `pipeline:fr-backfill`, `pipeline:enforcement-backfill`
- **Tested against real APIs**: 66 FR docs + 109 recalls inserted, 2 `pipeline_runs` logged as `success`, `enforcement_details` 1:1 with recalls. `npm run type-check` clean.

### 2026-03-03 — Phase 4A: Auth (Magic Link)

- **`src/proxy.ts`** — Next.js 16 middleware (exports `proxy` function). Refreshes Supabase session on every request, redirects unauthenticated users from `/app/*` to `/login`, redirects authenticated users away from `/login` to `/app/dashboard`. Dev bypass: skips all checks when `NODE_ENV === 'development'`.
- **`/login`** (`src/app/login/page.tsx`) — `"use client"`, magic link form using `supabase.auth.signInWithOtp({ shouldCreateUser: true })`. `useSearchParams` in child component wrapped in `<Suspense>` (required for static prerender). Shows "Check your inbox" success state with submitted email in canary yellow. Dev bypass link ("↳ dev bypass") visible only in development.
- **`/auth/callback`** (`src/app/auth/callback/route.ts`) — PKCE code exchange via `exchangeCodeForSession`. On success: upserts into `public.users` via `adminClient` (creates row on first login, no-op on re-login; `access_level` defaults to `'free'` in DB). Redirects to `/app/dashboard`. Error paths redirect to `/login?error=...`.
- **`/app/layout`** (`src/app/app/layout.tsx`) — Server component, belt-and-suspenders auth check (middleware is primary). Wraps app shell in dark surface.
- **`/app/dashboard`** (`src/app/app/dashboard/page.tsx`) — Server component. Shows user email. "Dashboard coming soon" placeholder. Sign-out via `"use server"` form action. Dev mode shows `dev@localhost`.
- **Env**: `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`. Supabase Auth → URL Configuration: redirect allowlist includes both `http://localhost:3000/auth/callback` and `https://policycanary.io/auth/callback`.
- **Verified end-to-end**: magic link email received, PKCE exchange succeeded, `public.users` row created with `access_level = 'free'`, sign-out returns to `/login`.

### 2026-03-03 — Homepage Visual Overhaul

- **Light theme** — flipped Header, Hero, ProductShowcase, Stats, and Social Proof from dark to white/surface-muted. CTA section kept dark as the single contrast moment (Stripe pattern). `Header.tsx`: white bg, amber logo dot, dark text nav. `Hero.tsx`: white bg with barely-perceptible warm gradient. `ProductShowcase.tsx`: light section wrapper, inner dashboard mockup stays dark.
- **Two-column hero** — `Hero.tsx` rebuilt from centered single-column to `grid-cols-1 md:grid-cols-2`: text (headline + subhead + CTAs) on left, stacked email mockup on right. `max-w-6xl` container.
- **HowItWorksSection** (`src/components/marketing/HowItWorksSection.tsx`) — extracted How It Works from `page.tsx` to a client component. Framer Motion `staggerChildren` (0.12s) triggers cards on scroll via `useInView`. Animated amber gradient sweep travels along step connectors between cards on desktop. All animation respects `useReducedMotion`.
- **Radar pulse** — `animate-ping` ripple on the urgent red dot in Hero email mockup. Respects `prefers-reduced-motion` natively via Tailwind.
- Commits: `76e9004` (light theme + HowItWorks), `a944f1e` (hero 2-col).

### 2026-03-03 — Phase 6: Web App MVP

- **App shell** — `AppNav` (server component) + `NavLinks` (client, `usePathname`). Dark sidebar `#07111F`, amber canary dot, Feed / Search / Products links, user email + sign out. `/app/layout.tsx` provides auth guard + shell. `/app/dashboard` redirects to `/app/feed`.
- **Feed** (`/app/feed`) — split-panel layout: feed list left, inline item detail sidebar right. URL-param filters (type, date range, My Products). `FeedItemCard`, `ItemTypeTag`, `ProductMatchBadge`, `FeedFilters` components.
- **Item detail** (`/app/items/[id]`) — 8 conditional sections: header, status bar, what happened, action items, your products, substances, enforcement details, source footer.
- **Search** (`/app/search`) — client component, POSTs to `/api/search`. Search API: Zod validation, auth check, rate limit (10/min/IP), OpenAI embedding, pgvector RPC with graceful fallback, RAG synthesis via `claudeSonnet`, returns `{ answer, citations }`.
- **Products** (`/app/products`) — grouped by status (urgent/review/clear). `ProductStatusCard` component, empty state.
- **Mock data** (`src/lib/mock/app-data.ts`) — `USE_MOCK` flag pattern: one-line swap from mock to real Supabase queries when enrichment pipeline is live.
- Commits: `b9122b6` through `b5543f6`.

### 2026-03-05 — Phase 4B: Stripe Subscriptions

- **Stripe client** (`src/lib/stripe/index.ts`) — lazy `getStripe()` singleton. NOT eager like `adminClient` — Stripe env vars may not exist at build time.
- **Checkout route** (`/api/stripe/checkout`) — POST, auth required. Get-or-create Stripe customer (unique constraint prevents duplicates). `trial_period_days: 14`, `allow_promotion_codes: true`, `metadata: { userId }`. Guards: already-subscribed check, price ID validation before customer create, email non-null assertion, try/catch around Stripe API calls.
- **Webhook handler** (`/api/stripe/webhook`) — POST, signature verification. Handles 4 events:
  - `checkout.session.completed` — sets `access_level='monitor'`, `max_products=5`, stores `stripe_customer_id` + `stripe_subscription_id`, reads `trial_end` from Stripe subscription (not hardcoded), links `email_subscribers` by email match.
  - `customer.subscription.updated` — active/trialing/past_due = keep monitor access (past_due: Stripe handles dunning). `max_products` only set on free→paid transition. Else downgrade to free.
  - `customer.subscription.deleted` — reset to free, clear `stripe_subscription_id`.
  - `invoice.payment_failed` — log with event ID only (Stripe handles dunning emails).
  - `resolveCustomerId()` helper handles `string | Customer | DeletedCustomer` union safely.
  - Always returns 200 after signature verification (even on DB errors).
- **Billing portal** (`/api/stripe/portal`) — POST, auth required, try/catch around Stripe API call.
- **PricingTable** — Monitor $99/mo (CheckoutButton: "Start 14-day free trial"), Monitor+Research $399/mo (Coming Soon badge, disabled CTA), Free links to `/login`.
- **AppNav** — free users see amber "Upgrade" → `/pricing`, paid users see "Manage Billing" button. `hasSubscription` derived from `access_level`, not `stripe_customer_id` (prevents canceled users seeing wrong CTA).
- **Login next=checkout flow** — `?next` param passed through auth callback URL. Callback allowlists valid values (prevents open redirect). `next=checkout` → `/app/feed?checkout=start`. New `AutoCheckout` component on feed page auto-fires checkout POST.
- **Client components** — `CheckoutButton` (marketing), `BillingButton` (app), `AutoCheckout` (app). All with error state UI (not dead spinners).
- **App layout** — fetches `access_level`, `max_products`, `stripe_customer_id` from `public.users` via `adminClient`, passes `accessLevel` + `hasSubscription` to `AppNav`.
- **Migration `004`** (`add_stripe_subscription_id_and_customer_unique`) — `stripe_subscription_id TEXT` column on users + `UNIQUE` constraint on `stripe_customer_id`.
- **Dependencies** — `stripe` npm package added.
- **Triple code-reviewed** — code-architect, backend-architect, code-reviewer. 4 criticals fixed: (1) dead checkout=start flow, (2) hardcoded trial_ends_at, (3) race condition on customer create, (4) no stripe_subscription_id stored. 9 warnings fixed: hasSubscription logic, type guards, past_due handling, error checks, double-sub guard, client error states, non-null assertions, try/catch, max_products overwrite.
- **Build clean.** `npm run type-check` + `npm run build` pass. Commit `497ec6d`.
- **Stripe Dashboard configured (live mode)** — Monitor product ($99/mo), Extra Monitored Products ($6/mo flat rate per unit), customer portal (cancel at end of period, collect cancellation reason, no plan switching/quantity changes). Webhook endpoint pending Vercel deploy.

### 2026-03-05 — Blog Section + Clawdbot Write Path

- **Blog pages** — `/blog` index (server component, category filter via URL params, `Suspense`-wrapped `CategoryFilter` client component), `/blog/[slug]` detail (ISR with `revalidate = 3600`, `generateStaticParams`, JSON-LD Article structured data, OG tags via `generateMetadata`). Both inside `(marketing)` route group (gets Header + Footer).
- **Components** — `PostCard` (server, `BlogPostSummary` type), `CategoryFilter` (`"use client"`, `useSearchParams` + `URLSearchParams`), `MarkdownContent` (`"use client"`, `react-markdown` + `remark-gfm`, Tailwind arbitrary variant styling).
- **API route** (`/api/blog`) — POST endpoint for Clawdbot. `X-API-Key` auth with `timingSafeEqual`. Zod validation (slug regex, content max 500K, category derived from `BLOG_CATEGORIES`). Upsert on slug. `published_at` preserved on re-publish. `{ data, error }` envelope matching signup route pattern.
- **RSS feed** (`/blog/feed.xml`) — RSS 2.0 with `atom:link` self-reference, `lastBuildDate`, XML escaping. Outside `(marketing)` route group (raw XML response). `revalidate = 3600`.
- **Migration** — `003_blog_posts` applied via Supabase MCP. Table with slug (unique), title, excerpt, content (markdown), category (CHECK), status (draft/published), published_at, seo_title, seo_description. RLS enabled: public read for published posts only. Service role bypasses for writes.
- **Types** — `BlogPost` (full row), `BlogPostSummary` (index queries), `BlogPostRSS` (feed queries). Eliminates unsafe `as BlogPost` casts on partial selects.
- **Nav** — Blog link added to Header (via `NavLink` component with active indicator) and Footer.
- **Dependencies** — `react-markdown`, `remark-gfm` installed.
- **Env** — `BLOG_API_KEY` required in `.env.local`.
- **Code review fixes** — (1) JSON-LD `</script>` injection: escape `<` as `\u003c`. (2) `BLOG_API_KEY` runtime guard: 500 if unset. (3) Timing-safe API key comparison via `crypto.timingSafeEqual`. (4) Type-safe query projections. (5) RSS null `published_at` filter. (6) `CategoryFilter` preserves existing URL params. (7) Content max length 500K. (8) `<time>` semantic elements. (9) Richer JSON-LD (`dateModified`, `url`). (10) RSS `lastBuildDate`. (11) Zod category enum derived from `BLOG_CATEGORIES`.
- **Build clean.** `npm run build` passes.

### 2026-03-05 — Clawdbot (OpenClaw) Deployment

- **VPS provisioned** — Vultr `vc2-1c-2gb` (1 vCPU, 2GB RAM, $12/mo), region `ewr` (US East), Ubuntu 24.04. IP: `108.61.151.130`. Instance ID: `7f95a4c4-9e90-4438-b30c-2be85fa40fa3`.
- **OpenClaw v2026.3.2** — installed globally, `gateway.mode=local`, `agents.defaults.model=sonnet` (resolves to `anthropic/claude-sonnet-4-6`). System-level systemd service (`openclaw.service`). ANTHROPIC_API_KEY in service `Environment=` directive.
- **Discord bot** — `ClawdBot - Canary` (app ID: `1478649439420813335`). Connected to `Bizniz` server (`1464751221112963355`). 5 channels configured: `#blog-drafts`, `#linkedin-drafts`, `#weekly-roundup`, `#alerts`, `#clawdbot` (general chat). `requireMention: false` on all channels. `groupPolicy: allowlist`.
- **Helper scripts** — `query-supabase.mjs` (queries enriched items from Supabase, flags: `--days`, `--type`, `--limit`, `--enriched-only`, `--summary`) + `publish-blog.mjs` (POSTs to `/api/blog` with `X-API-Key`, flags: `--title`, `--slug`, `--content`/`--content-file`, `--category`, `--excerpt`, `--status`). Both in `/home/openclaw/.openclaw/workspace/scripts/`. Env vars in `workspace/.env`.
- **Weekly roundup skill** — `SKILL.md` in `workspace/skills/weekly-roundup/`. Instructs LLM to: (1) query enriched items via `query-supabase.mjs`, (2) analyze/prioritize by urgency/breadth/novelty, (3) draft 800-1200 word blog post with lead story + key developments + quick hits, (4) post draft to Discord with metadata block, (5) publish via `publish-blog.mjs` on user approval.
- **Cron job** — `weekly-roundup` fires `0 9 * * 5` (Fridays 9 AM ET), isolated session, announces to `#weekly-roundup` channel. Job ID: `8c9ab46d-42c9-42e9-8a2d-004ef56a1fb4`.
- **Local repo files** — `scripts/clawdbot/` directory with: `cloud-init.yaml`, `query-supabase.mjs`, `publish-blog.mjs`, `setup-clawdbot.sh` (provisioning automation), `skills/weekly-roundup/SKILL.md`, `.vultr-instance-id`.
- **BLOG_API_KEY generated** — added to `.env.local` (was missing).
- **Config notes** — `gateway.mode` must be `"local"` for headless VPS. `agents.defaults.provider` is NOT a valid config key. `openclaw onboard --install-daemon` is interactive — manual systemd service needed on VPS.

### 2026-03-05 — Session 1: Onboarding Backend (API Routes)

- **Types + queries module** (`src/lib/products/types.ts`, `src/lib/products/queries.ts`) — Zod schemas (`CreateProductSchema` with DSLD numeric refinement, `UpdateProductSchema`, `DSLDSearchSchema`), response types (`DSLDSearchResult`, `DSLDProductDetail`, `ProductSummary`, `ProductDetail`), server-only query functions (DSLD search/detail, user products with ingredient counts, product CRUD helpers, substance resolution, DSLD ingredient ingestion).
- **DSLD search** (`/api/dsld/search`) — GET, ILIKE prefix on `product_name`, `market_status = 'On Market'`, auth required (dev bypass), 30/min rate limit.
- **DSLD detail** (`/api/dsld/[id]`) — GET, 3 parallel queries (product + ingredients + other_ingredients), auth required (dev bypass).
- **Products list + create** (`/api/products`) — GET (user's active products with ingredient counts), POST (Zod validation, plan limit check with try/catch, duplicate check, insert, DSLD ingredient ingestion with substance resolution via `find_substance_by_name` RPC in `Promise.all`).
- **Product single + update + delete** (`/api/products/[id]`) — GET (ownership check), PATCH (name/brand only, 10/min rate limit), DELETE (soft delete `is_active=false`, 10/min rate limit). UUID validation on all handlers.
- **Shared rate limiter** (`src/lib/rate-limit.ts`) — extracted from 3 duplicated inline implementations. Single module-level Map, configurable limit + window per caller.
- **Type consolidation** — `AddProductRequest` in `src/types/api.ts` now re-exports `CreateProductInput` derived from Zod schema via `z.infer`.
- **Migration** (`add_unique_subscriber_products_external`) — unique partial index on `(user_id, data_source, external_id)` WHERE `external_id IS NOT NULL AND is_active = true`. Guards against duplicate race condition.
- **Triple code-reviewed** — code-reviewer, backend-architect, code-architect. Fixes applied:
  - **C1**: Plan limit race — detect DB trigger `23514` error, return 403 with `PLAN_LIMIT` code (not generic 500)
  - **C2**: Duplicate race — unique partial index + detect `23505` error, return 409 with `DUPLICATE` code
  - **C3**: UUID validation — regex check on all `[id]` route params before DB queries
  - **W1**: Removed redundant `updated_at` manual assignment (DB trigger handles it)
  - **W2**: `countActiveProducts`/`getMaxProducts` now throw on error (not misleading defaults)
  - **W3**: DSLD `external_id` must be numeric (Zod `.refine()`)
  - **W4**: Ingredient ingestion failure returns `warning` field in 201 response
  - **W5**: Removed `product_category_id` from `UpdateProductSchema` (column migration pending)
  - **W6**: Removed `is_active` from `UpdateProductSchema` (soft deletes via DELETE only)
- **Substance resolution thresholds** — `>= 0.8` matched, `>= 0.5` ambiguous, `< 0.5` unmatched. More permissive than enrichment pipeline (0.90/0.95) — intentional for user-facing ingredient matching where showing "ambiguous" is useful.
- **Files created**: `src/lib/products/types.ts`, `src/lib/products/queries.ts`, `src/lib/rate-limit.ts`, `src/app/api/dsld/search/route.ts`, `src/app/api/dsld/[id]/route.ts`, `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts`
- **Build clean.** `npm run type-check` + `npm run build` pass.

### 2026-03-04 — Phase 2C: Inngest Pipeline Orchestration (Minimal)

- **Two Inngest functions** — `daily-ingest` (cron `0 6,18 * * *` = 6 AM + 6 PM UTC) and `enrich-batch` (event `pipeline/enrich.requested`, on-demand).
- **daily-ingest** — 4 fetcher steps run in parallel via `Promise.all` (Federal Register, openFDA enforcement, warning letters, FDA RSS), followed by sequential enrichment step (limit: 100). Each step catches errors internally (Inngest v3: failed step blocks all subsequent steps). Returns summary with per-source created/error counts.
- **enrich-batch** — single enrichment step with configurable `limit` (clamped 1-200) and optional `itemTypeFilter`. Triggered via `inngest.send("pipeline/enrich.requested", { data: { limit: 50 } })`.
- **Concurrency guards** — `{ limit: 1 }` on both functions prevents overlapping runs.
- **Error safety** — `safeError()` helper truncates error messages to 500 chars (prevents credential leaks to Inngest dashboard). All step errors caught and encoded in return values.
- **RSS fetcher cleanup** — removed unused `{ mode: "poll" }` param from `fetchFdaRss()` signature. Updated 2 call sites (Inngest function + CLI script).
- **Code-reviewed** — 2 criticals fixed (missing error handling on enrichBatch, no limit validation), 4 warnings fixed (sequential→parallel fetchers, useless concurrency key, RSS param cleanup, error truncation).
- **Files**: `src/lib/inngest/{client.ts, index.ts, functions/daily-ingest.ts, functions/enrich-batch.ts}`, `src/app/api/inngest/route.ts`, `src/pipeline/fetchers/fda-rss.ts`, `scripts/run-fetcher.ts`.
- **Env vars**: `INNGEST_SIGNING_KEY` (Vercel prod), `INNGEST_EVENT_KEY` (external event sending). Local dev: `npx inngest-cli@latest dev`.
- **Build clean.** `npm run type-check` + `npm run build` pass.

### 2026-03-04 — Cross-Reference Inference Layer (Steps 1b + 1c)

**THE SINGLE BIGGEST PRODUCT DIFFERENTIATOR.** Without this, we're a summarizer. With it, we provide intelligence worth $99/mo.

- **Schema migration** (`002_substance_codes_and_signal_source.sql`) — new `substance_codes` table (id, substance_id, code_system, code_value, code_type, is_classification, comments). `signal_source` column added to `item_enrichment_tags` (values: `'direct'` | `'cross_reference'`). Applied to Supabase. (Note: `segment_impacts` table and its `signal_source` column were subsequently dropped in `drop_segment_impacts` migration.)
- **Bootstrap updated** (`scripts/bootstrap-gsrs.ts`) — captures ALL code systems from GSRS (no ingestion filter). Filtering to relevant systems happens at query time in `cross-reference.ts`. Supports `--codes-only` flag for fast backfills when substances are already loaded. ID lookup batched in chunks of 50 (avoids Supabase URL length limit). Batch upserts into `substance_codes` (500/batch).
- **Step 1b: Use-context derivation** (`src/pipeline/enrichment/cross-reference.ts`) — `lookupUseContexts()`: pure TypeScript, no LLM. Queries `substance_codes` for resolved substance_ids, maps to 8 `UseContextCategory` types. CFR Part mapping: 175-178 → food_contact (checked first), 170-189 → food_additive, 73-82 → color_additive, 310-369 → otc_drug, 700-740 → cosmetic_ingredient. CODEX/JECFA functional class parsing from pipe-delimited comments.
- **Step 1c: LLM cross-category inference** (`cross-reference.ts`) — `inferCrossCategories()`: Gemini 2.5 Pro with thinking (budget: 4096). Fires whenever use contexts exist for resolved substances (no sector gate — removed 2026-03-05). Detailed system prompt with exposure route reasoning, regulatory precedent. Additive-only — never modifies Step 1's direct extraction.
- **Processor restructured** (`processor.ts`) — new flow: Steps 1-6 unchanged → step 7 (substance resolution via `Promise.all`) → step 8 (use-context lookup, 0.95 threshold) → step 9 (cross-category inference, non-fatal) → steps 10-16 (DB writes with signal_source). N+1 UNII lookup replaced with batch `.in()` query. Tag deduplication via `existingTagKeys` Set.
- **Types updated** (`database.ts`) — `SubstanceCode` interface, `signal_source` on `ItemEnrichmentTag`, `crossReferenced` on runner result types. (`SegmentImpact` type subsequently removed when segments were dropped.)
- **Golden fixtures updated** — BHA expects `supplements` (min_relevance: "medium") and `cosmetics` (min_relevance: "low") via cross-reference.
- **Code review completed** — 3 critical bugs fixed: (1) CFR food_contact range unreachable (overlap), (2) CFR regex matched title number instead of part number, (3) duplicate tag insertion on unique constraint. 2 performance fixes: N+1 UNII queries → batch, sequential substance resolution → Promise.all.
- **GSRS code system name fixes** — discovered via API inspection that GSRS uses `DRUG BANK` (with space, not `DRUGBANK`), `Food Contact Sustance Notif, (FCN No.)` (GSRS has typo "Sustance" + suffix), and `COSMETIC INGREDIENT REVIEW (CIR)` does not exist in GSRS at all. Updated both `bootstrap-gsrs.ts` and `cross-reference.ts`.
- **GSRS bootstrap complete** — 949,770 codes across 96 code systems, 166,532 substances with codes (98% of 169K). Key cross-ref systems: DAILYMED (15,493), RXCUI (14,622), DRUG BANK (11,878), CFR (3,430), EPA PESTICIDE CODE (2,957), JECFA EVALUATION (1,912), DSLD (1,527), Food Contact (731), CODEX (326).
- **Type-check clean.** Committed.

### 2026-03-04 — Phase 2B Enrichment Stabilization

- **Content-fetch for thin RSS items** — RSS descriptions are 112-225 chars (useless for classification). New `src/pipeline/enrichment/content-fetch.ts` fetches full FDA page content before enrichment. BHA press release: 155 → 4,678 chars. BIG GUYS alert: 225 → 2,237 chars. Fresenius Kabi: 112 → 7,008 chars.
- **Shared HTML helpers** — `stripHtml()` and `extractMainContent()` moved from `warning-letters.ts` to `src/pipeline/fetchers/utils.ts` as shared exports. Both content-fetch and WL fetcher use them.
- **URL scheme fix** — RSS `source_url` values use `http://` (from RSS feeds), not `https://`. Guards updated to accept both schemes. FDA 301-redirects http→https, `fetch()` follows automatically.
- **Prompt truncation removed** — was head+tail at 8K chars, throwing away 80% of long warning letters. Median WL is 8.8K, P95 is 25K, max is 47K (~12K tokens). Gemini's 1M token context handles all of it. Full content passed through now.
- **Prompt fixes** — (1) `affected_product_types` now asks for BOTH broad categories AND specific types ("fresh produce" + "cucumber", not just "cucumber select 6 ct"). (2) Action type definitions clarified: `import_violation` for FSVP/import issues even if letter also mentions GMP; `guidance_update` for RFIs and draft guidance. (3) `deadline` field now explicitly includes WL response deadlines, not just compliance dates.
- **Golden fixture corrections** — BHA narrowed to food-only (FDA page doesn't discuss supplement/cosmetic use — that's the inference layer's job). Whole foods (cucumber, yogurt) removed from `affected_ingredients` (they're products, not substances). CDER WL confidence thresholds lowered (pharma is outside our domain). `has_deadline=true` for WLs with response deadlines and FR rules with effective dates. "outsourcing facility" moved from product_type to facility_type. Animal food ≠ human food.
- **Golden tests: 76/76 assertions pass, 10/10 fixtures pass.**
- **Cross-reference inference layer identified** — the BHA test failure revealed the key product insight: extraction alone makes us a summarizer; inference (substance graph + LLM reasoning about cross-segment implications) is what makes us intelligent. Documented in `activeContext.md`. Designing in separate session.
- **Pending re-enrichment** — 422 WLs in DB were enriched with old 8K-truncated prompt. Deferring re-enrichment until after inference layer so we only pay once.

### 2026-03-04 — Homepage Visual Pass

- **Hero gradient** — boosted from 10-12% to 22-28% opacity across 3 radial layers so canary/amber warmth is actually visible on the dark background.
- **How It Works** — removed broken `text-8xl text-slate-100` watermark numbers (invisible on `bg-white` but ~100px tall each, creating a massive white gap). Replaced with clean step-badge cards (`01/02/03` in amber) on `bg-surface-muted`, with source tag pills and stat chips.
- **ProductShowcase** (`src/components/marketing/ProductShowcase.tsx`) — new client component. Browser-chrome + dashboard layout: left sidebar lists 5 monitored products with colored status dots (urgent/review/clear); right panel shows the selected product's full intelligence detail (analysis, action items, deadline, citation). Framer Motion `AnimatePresence` transition on selection. Inserted after FeatureComparison.
- Committed: `0dcf512`. `npm run type-check` clean.

### 2026-03-03 — Phase 3: Marketing Site

- **Landing page** (`/`) — Hero with animated gradient, problem stats, how-it-works, FeatureComparison, BuyerRoleCard, SignupForm. All sections server-rendered; RevealSection client wrapper for scroll animations.
- **Pricing page** (`/pricing`) — PricingTable with 3 tiers (Free / Monitor $49 / Monitor+Research $249), FAQ, signup CTA.
- **Sample page** (`/sample`) — Hardcoded SampleReport for Marine Collagen Powder (WL-2025-CFSAN-0847), dark CTA with SignupForm.
- **Signup API** (`/api/signup`) — POST endpoint using adminClient (bypasses RLS). Rate-limited (5/min/IP). Zod validation, duplicate-check, reactivation, `unsubscribe_token` via `crypto.randomUUID()`.
- **Design tokens** — `globals.css` with `@theme` block (all color + font tokens), `--gradient-dark-surface`, `hero-gradient` CSS class with 12s keyframe animation.
- **Fonts** — IBM Plex Sans/Serif/Mono via `next/font/google` as CSS variables. No Google Fonts `@import` URL.
- **framer-motion** installed — RevealSection and SignupForm use scroll-triggered reveals and AnimatePresence with `useReducedMotion` fallback.
- **e2e tests** — 4 Playwright tests in `e2e/marketing.spec.ts`.
- **Build** — `npm run build` passes clean. All 3 marketing routes statically rendered.

### 2026-03-03 — Phase 1: Foundation Scaffolded

- **Next.js 16** with Turbopack, App Router, TypeScript strict, `src/` directory
- **Tailwind v4** CSS-first — `@import "tailwindcss"` in globals.css, no config file
- **Supabase clients**: browser (`client.ts`), server (`server.ts`), admin service role (`admin.ts`)
- **AI SDK v6** clients: `geminiFlash`/`geminiPro` (enrichment), `claudeSonnet` (writing), `generateEmbedding()` (OpenAI, 1536d)
- **Inngest** client + `/api/inngest` route handler ready for pipeline functions
- **Full v1 schema migration**: `supabase/migrations/001_initial_schema.sql` — all 25 tables, 9 layers, vector(1536) embeddings, pg_trgm indexes, moddatetime triggers
- **Seed file**: `supabase/seeds/001_sources.sql` — 9 sources + regulatory_categories (segments, topics, product classes)
- **GSRS bootstrap script**: `scripts/bootstrap-gsrs.ts` — seeds 169K FDA substances + 950K codes. Supports `--codes-only` flag for fast code backfills.
- **TypeScript types**: hand-written types for all 25 tables (`database.ts`), enums (`enums.ts`), API types (`api.ts`)
- **Playwright config**: chromium + firefox + webkit, webServer auto-start
- **Verified**: `npm run type-check` passes, `npm run build` passes cleanly

### 2026-03-03 — Original Planning (Preserved)
- Product idea defined, deep market research (20+ competitor profiles, FDA API docs, market sizing)
- Email-first model, intelligence lane positioning
- Data schema v3 with 7 layers, backend architect reviewed
- Real API validation (Federal Register, openFDA, FDA scraping endpoints)
- Build phases defined (7 phases with session briefs — needs revision)
