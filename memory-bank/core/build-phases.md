---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active
---

# Build Phases: Policy Canary

Each phase has a self-contained session brief in the `phases/` directory.

---

## Dependency & Parallelization Map

```
Phase 0: Agent Setup ──────────────────────────── (standalone, do first)
Phase 1: Foundation ───────────────────────────── (standalone, do after 0)
Phase 2A-1: FR + openFDA Fetchers ─────┐
Phase 2A-2: Warning Letters + CSVs ────┤── all depend on Phase 1
Phase 2B: Enrichment Engine ───────────┤── depends on 2A-1 (needs data)
Phase 2C: Pipeline Orchestration ──────┘── depends on 2A-* + 2B
Phase 3: Marketing Site ──────────────────────── depends on Phase 1 only
Phase 4: Auth & Subscriptions ────────────────── depends on Phase 1 + 3
Phase 4B: Product Onboarding ─────────────────── depends on Phase 4 (Auth)
Phase 4C: Product Matching Engine ────────────── depends on Phase 2B + 4B
Phase 5: Intelligence Email ──────────────────── depends on Phase 2C + 4C
Phase 6: Web App ─────────────────────────────── depends on Phase 2C + 4
```

**Parallelization opportunities:**
- Phase 2A-1 and 2A-2 can run in parallel (independent fetchers)
- Phase 3 can run in parallel with Phase 2A/2B (independent — marketing site vs data pipeline)
- Phase 4B starts immediately after Phase 4 (Auth) — no need to wait for pipeline completion
- Phase 5 and 6 can partially overlap (email system vs web app, share data layer)

**Critical path:** 0 → 1 → 2A-1 → 2B → 2C → [3] → 4 → 4B → 4C → 5 (intelligence email is the product)

---

## Phase Index

## Phase 0: Agent Setup — Brand Guardian
**Complexity:** Low | **Sessions:** 1 | **Dependencies:** None
**Purpose:** Create the Policy Canary brand guardian agent so all subsequent phases have consistent voice, tone, and identity guidance.
→ Session brief: `/memory-bank/core/phases/phase-0-agent-setup.md`

## Phase 1: Foundation — Project Scaffolding + Database
**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 0
**Purpose:** Set up the Next.js project, Supabase database with all migrations, shared utilities, and project structure.
→ Session brief: `/memory-bank/core/phases/phase-1-foundation.md`

## Phase 2A-1: Federal Register + openFDA Fetchers
**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 1
**Purpose:** Build fetcher modules for the three primary data sources — Federal Register API, openFDA enforcement, and openFDA CAERS adverse events.
→ Session brief: `/memory-bank/core/phases/phase-2a1-fr-openfda.md`

## Phase 2A-2: Warning Letters + Chemical CSVs
**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 1
**Purpose:** Build fetchers for FDA warning letters (AJAX scraping), FDA RSS feeds, Prop 65 chemicals (CSV), and CA Safe Cosmetics (CSV).
→ Session brief: `/memory-bank/core/phases/phase-2a2-warning-letters-csvs.md`

## Phase 2B: Enrichment Engine
**Complexity:** High (most critical code) | **Sessions:** 2-3 | **Dependencies:** Phase 2A-1 (needs data in DB)
**Purpose:** Build the LLM enrichment pipeline that transforms raw regulatory data into structured intelligence. This is the core product logic.
→ Session brief: `/memory-bank/core/phases/phase-2b-enrichment.md`

## Phase 2C: Pipeline Orchestration
**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 2A-1, 2A-2, 2B
**Purpose:** Wire all fetchers and enrichment into a single pipeline runner with scheduling, logging, backfill support, and trend signal computation.
→ Session brief: `/memory-bank/core/phases/phase-2c-orchestration.md`

## Phase 3: Marketing Site
**Complexity:** Medium | **Sessions:** 2-3 | **Dependencies:** Phase 1
**Purpose:** Build the public-facing marketing site — landing page, pricing page, and sample report page. Plus email signup API.
→ Session brief: `/memory-bank/core/phases/phase-3-marketing.md`

## Phase 4: Auth & Subscriptions
**Complexity:** Medium-High | **Sessions:** 2 | **Dependencies:** Phase 1, Phase 3
**Purpose:** Add Supabase Auth, Stripe checkout, webhook handling, and route protection. Connect email_subscribers to users on upgrade.
→ Session brief: `/memory-bank/core/phases/phase-4-auth-stripe.md`

## Phase 4B: Product Onboarding
**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 4 (Auth)
**Purpose:** Allow subscribers to add their actual products and hydrate with ingredient data from DSLD and USDA FDC.
→ Session brief: `/memory-bank/core/phases/phase-4b-product-onboarding.md`

## Phase 4C: Product Matching Engine
**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 2B + 4B
**Purpose:** Score newly enriched regulatory items against subscriber product profiles and store matches for the email system.
→ Session brief: `/memory-bank/core/phases/phase-4c-product-matching-engine.md`

## Phase 5: Intelligence Email
**Complexity:** High | **Sessions:** 2-3 | **Dependencies:** Phase 2C, Phase 4C
**Purpose:** Build the email generation and sending system — the core product. Free weekly digest, paid intelligence email, urgent alerts, and delivery tracking.
→ Session brief: `/memory-bank/core/phases/phase-5-email.md`

## Phase 6: Web App
**Complexity:** High | **Sessions:** 3-4 | **Dependencies:** Phase 2C, Phase 4
**Purpose:** Build the authenticated web application — feed, item detail, enforcement database, AI search, trends, and bookmarks.
→ Session brief: `/memory-bank/core/phases/phase-6-web-app.md`

---

## Appendix: File Manifest

Complete list of files created across all phases:

```
.claude/agents/brand-guardian.md                    (Phase 0)

src/
  app/
    (marketing)/
      layout.tsx                                    (Phase 3)
      page.tsx                                      (Phase 3)
      pricing/page.tsx                              (Phase 3)
      sample/page.tsx                               (Phase 3)
    (auth)/
      login/page.tsx                                (Phase 4)
      signup/page.tsx                               (Phase 4)
      callback/route.ts                             (Phase 4)
    (app)/
      layout.tsx                                    (Phase 4)
      feed/page.tsx                                 (Phase 6)
      items/[id]/page.tsx                           (Phase 6)
      enforcement/page.tsx                          (Phase 6)
      search/page.tsx                               (Phase 6)
      trends/page.tsx                               (Phase 6)
      bookmarks/page.tsx                            (Phase 6)
      settings/page.tsx                             (Phase 4)
      products/page.tsx                             (Phase 4B)
      products/[id]/page.tsx                        (Phase 6, stretch)
      onboarding/page.tsx                           (Phase 4B)
    api/
      signup/route.ts                               (Phase 3)
      stripe/
        checkout/route.ts                           (Phase 4)
        portal/route.ts                             (Phase 4)
        webhook/route.ts                            (Phase 4)
      email/webhook/route.ts                        (Phase 5)
      search/route.ts                               (Phase 6)
      bookmarks/route.ts                            (Phase 6)
      products/route.ts                             (Phase 4B)
      cron/
        pipeline/route.ts                           (Phase 2C)
        email-weekly/route.ts                       (Phase 5)
  lib/
    supabase/
      client.ts                                     (Phase 1)
      server.ts                                     (Phase 1)
      admin.ts                                      (Phase 1)
      middleware.ts                                  (Phase 1)
    ai/
      gemini.ts                                     (Phase 1)
      anthropic.ts                                  (Phase 1)
      openai.ts                                     (Phase 1)
      prompts/                                      (Phase 1)
    email/
      queries.ts                                    (Phase 5)
      compiler.ts                                   (Phase 5)
      sender.ts                                     (Phase 5)
      templates/
        FreeDigest.tsx                              (Phase 5)
        PaidIntelligence.tsx                         (Phase 5)
        UrgentAlert.tsx                              (Phase 5)
        Welcome.tsx                                  (Phase 5)
    stripe/helpers.ts                               (Phase 4)
    products/
      dsld.ts                                       (Phase 4B)
      fdc.ts                                        (Phase 4B)
    utils/                                          (Phase 1)
  types/
    database.ts                                     (Phase 1)
    enums.ts                                        (Phase 1)
    api.ts                                          (Phase 1)
  pipeline/
    orchestrator.ts                                 (Phase 2C)
    backfill.ts                                     (Phase 2C)
    trends.ts                                       (Phase 2C)
    fetchers/
      federal-register.ts                           (Phase 2A-1)
      openfda-enforcement.ts                        (Phase 2A-1)
      openfda-caers.ts                              (Phase 2A-1)
      warning-letters.ts                            (Phase 2A-2)
      fda-rss.ts                                    (Phase 2A-2)
      prop65.ts                                     (Phase 2A-2)
      cscp.ts                                       (Phase 2A-2)
      utils.ts                                      (Phase 2A-1)
      schemas/
        federal-register.ts                         (Phase 2A-1)
        openfda-enforcement.ts                      (Phase 2A-1)
        openfda-caers.ts                             (Phase 2A-1)
        warning-letters.ts                          (Phase 2A-2)
        rss.ts                                      (Phase 2A-2)
    enrichment/
      prompts.ts                                    (Phase 2B)
      processor.ts                                  (Phase 2B)
      embeddings.ts                                 (Phase 2B)
      runner.ts                                     (Phase 2B)
    matching/
      matcher.ts                                    (Phase 4C)
      normalizer.ts                                 (Phase 4C)
  components/
    marketing/
      Header.tsx                                    (Phase 3)
      Footer.tsx                                    (Phase 3)
      Hero.tsx                                      (Phase 3)
      PricingTable.tsx                              (Phase 3)
      SignupForm.tsx                                (Phase 3)
      FeatureComparison.tsx                         (Phase 3)
      SegmentCard.tsx                               (Phase 3)
      SampleReport.tsx                              (Phase 3)
    app/
      AppSidebar.tsx                                (Phase 6)
      ItemCard.tsx                                  (Phase 6)
      RelevanceBadge.tsx                            (Phase 6)
      SegmentBadge.tsx                              (Phase 6)
      TopicTag.tsx                                  (Phase 6)
      FilterBar.tsx                                 (Phase 6)
      SearchInput.tsx                               (Phase 6)
      CitationBlock.tsx                             (Phase 6)
      EnforcementTable.tsx                          (Phase 6)
      BookmarkButton.tsx                            (Phase 6)
      ProductCard.tsx                               (Phase 4B)
      AddProductForm.tsx                            (Phase 4B)
  middleware.ts                                     (Phase 4)

supabase/
  migrations/
    001_initial_schema.sql                          (Phase 1)
  seed.sql                                          (Phase 1)

.env.local.example                                  (Phase 1)
vercel.json                                         (Phase 2C)
playwright.config.ts                                (Phase 1)
```
