# Phase 1: Foundation — Project Scaffolding + Database

**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 0
**Purpose:** Set up the Next.js project, Supabase database with all migrations, shared utilities, and project structure.

### Session Brief

```
TASK: Scaffold the Policy Canary project — Next.js app, Supabase database
with all tables, shared utilities, and project configuration.

WHAT TO READ FIRST:
- /memory-bank/core/projectbrief.md — product definition
- /memory-bank/architecture/techStack.md — stack decisions, LLM models, env vars
- /memory-bank/architecture/data-schema.md — full 22-table schema (7 layers)
- /memory-bank/architecture/llm-data-flow.md — system architecture overview

STEP 1: NEXT.JS SCAFFOLDING

Run:
  npx create-next-app@latest . --typescript --tailwind --eslint --app \
    --src-dir --import-alias "@/*" --turbopack

Install dependencies:
  npm install @supabase/supabase-js @supabase/ssr
  npm install ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic
  npm install zod
  npm install stripe
  npm install lucide-react
  npm install @react-email/components resend
  npm install posthog-js

Dev dependencies:
  npm install -D @playwright/test supabase

STEP 2: PROJECT STRUCTURE

Create this directory structure:
  src/
    app/                    # Next.js App Router pages
      (marketing)/          # Marketing site route group
      (app)/                # Authenticated app route group
      api/                  # API routes
    lib/
      supabase/
        client.ts           # Browser Supabase client
        server.ts           # Server Supabase client (cookies)
        admin.ts            # Service role client (pipeline, no RLS)
        middleware.ts        # Supabase auth middleware helper
      ai/
        gemini.ts           # Gemini client (Flash + Pro)
        anthropic.ts        # Claude client (email writing, search)
        openai.ts           # OpenAI client (embeddings only)
        prompts/            # Prompt templates directory
      email/                # Email templates and sending
      stripe/               # Stripe helpers
      utils/                # Shared utilities
    types/
      database.ts           # Generated Supabase types
      enums.ts              # Shared enum types
      api.ts                # API response types
    pipeline/               # Data pipeline scripts
      fetchers/             # Source-specific fetcher modules
      enrichment/           # LLM enrichment logic
      orchestrator.ts       # Main pipeline runner
  supabase/
    migrations/             # SQL migration files
    seed.sql                # Seed data (topics, sources)

STEP 3: ENVIRONMENT CONFIGURATION

Create .env.local.example with ALL required env vars:
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # LLM — Multi-provider via Vercel AI SDK
  GOOGLE_GENERATIVE_AI_API_KEY=
  OPENAI_API_KEY=
  ANTHROPIC_API_KEY=

  # Payments
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

  # Email
  RESEND_API_KEY=

  # Analytics
  NEXT_PUBLIC_POSTHOG_KEY=
  NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

  # App
  NEXT_PUBLIC_APP_URL=http://localhost:3000

Add .env.local to .gitignore (should already be there).

STEP 4: SUPABASE MIGRATION

Create ONE migration file: supabase/migrations/001_initial_schema.sql

This is a fresh project with no existing data — no reason to split the
schema across 14 files. One file, all tables, applied once. Future schema
changes get their own numbered migrations.

The migration should create everything in FK-dependency order:

  1. Extensions: pgvector, moddatetime
  2. ENUMs: item_type, relation_type
  3. Layer 1 — Source data: sources, pipeline_runs, regulatory_items
  4. Layer 2 — Enrichment: item_enrichments, item_citations,
     topics, item_topics
  5. Layer 3 — Search: item_chunks with vector(768) column
     NOTE: Do NOT create HNSW index on empty table. Add a comment:
     -- HNSW index: CREATE INDEX CONCURRENTLY after 1000+ rows loaded
  6. Layer 4 — Intelligence: item_relations, enforcement_details, trend_signals
  7. Layer 5 — Adverse events: adverse_event_reports, adverse_event_products
  8. Layer 6 — State data: chemicals, state_chemical_bans, cosmetic_chemical_reports
  9. Layer 7 — Users & email: users, user_bookmarks, email_subscribers,
     email_campaigns, email_campaign_items, email_sends
  10. Layer 8 — Products (add to this migration — no separate file needed):
      - ENUMs: add `product_type` enum (supplement | food | cosmetic)
      - subscriber_products: id, user_id FK → users, product_name,
        product_type (product_type enum), dsld_id, fdc_id, is_active,
        created_at. UNIQUE on (user_id, product_name).
      - product_ingredients: id, product_id FK → subscriber_products,
        ingredient_name, ingredient_normalized, amount, unit, unii_code.
      - product_item_matches: id, product_id FK → subscriber_products,
        item_id FK → regulatory_items, match_score NUMERIC, match_reasons
        JSONB, created_at. UNIQUE on (product_id, item_id).
      - RLS: subscriber_products and product_ingredients are user-scoped
        (users can only see/modify their own rows via user_id).
        product_item_matches: users can read rows for their products.
  11. RLS policies:
      - Public read (authenticated): regulatory_items, item_enrichments,
        topics, item_topics, trend_signals
      - User-scoped: users (own row), user_bookmarks (own bookmarks)
      - Service role only: pipeline tables, email tables, enforcement_details
      - email_subscribers: users can read own row (via user_id FK)
  11. Triggers: moddatetime on regulatory_items, users, chemicals,
      state_chemical_bans (any table with updated_at)

  All UNIQUE constraints, indexes, and CHECK constraints per
  /memory-bank/architecture/data-schema.md.

STEP 5: SEED DATA

Create supabase/seed.sql with:

  a) Sources (insert 9 rows):
     - federal_register (api, https://www.federalregister.gov/api/v1)
     - openfda_enforcement (api, https://api.fda.gov/food/enforcement.json)
     - openfda_caers (api, https://api.fda.gov/food/event.json)
     - fda_rss (rss, https://www.fda.gov/about-fda/contact-fda/stay-informed)
     - fda_warning_letters (scrape, https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters)
     - prop65 (api, https://oehha.ca.gov)
     - cscp (api, https://data.chhs.ca.gov)
     - dsld (api, https://api.ods.od.nih.gov/dsld/v9) — NIH Dietary Supplement Label Database; used for product ingredient lookup in Phase 4B (NOT a pipeline fetcher — called from API routes)
     - usda_fdc (api, https://api.nal.usda.gov/fdc/v1) — USDA FoodData Central; used for food product ingredient lookup in Phase 4B (NOT a pipeline fetcher — called from API routes)

  b) Topics — seed the controlled vocabulary (category > topic):
     GMP:
       identity-testing, facility-registration, cgmp-violations,
       process-controls, quality-systems, sanitation, supply-chain
     Labeling:
       nutrition-facts, health-claims, allergen-labeling,
       supplement-facts, cosmetic-labeling, ingredient-listing
     Ingredients:
       gras-notifications, ndi-notifications, food-additives,
       color-additives, banned-substances, contaminants, pfas
     Enforcement:
       warning-letters, recalls, import-alerts, injunctions,
       consent-decrees, 483-observations, adverse-events

STEP 6: SHARED UTILITIES

  a) src/lib/supabase/client.ts
     Browser client using createBrowserClient from @supabase/ssr

  b) src/lib/supabase/server.ts
     Server client using createServerClient from @supabase/ssr with cookies

  c) src/lib/supabase/admin.ts
     Service role client for pipeline operations (bypasses RLS)

  d) src/lib/ai/gemini.ts
     Export two clients via Vercel AI SDK:
     - geminiFlash (google model: 'gemini-2.5-flash')
     - geminiPro (google model: 'gemini-2.5-pro')

  e) src/lib/ai/anthropic.ts
     Export claude client (anthropic model: 'claude-sonnet-4-6')

  f) src/lib/ai/openai.ts
     Export embeddings client (openai model: 'text-embedding-3-small')

  g) src/types/enums.ts
     TypeScript enums/types matching the database enums:
     - ItemType, RelationType

  h) src/types/database.ts
     Run: npx supabase gen types typescript --local > src/types/database.ts
     (or create manually matching schema if Supabase isn't running locally)

STEP 7: CONFIGURATION FILES

  a) tsconfig.json — verify path aliases (@/*)
  b) tailwind.config.ts — add custom colors from brand guardian
  c) .eslintrc.json — standard Next.js config
  d) playwright.config.ts — basic Playwright setup

CRITICAL DECISIONS (pre-made, do not change):
- Supabase Pro plan ($25/mo) — 500MB free tier too small
- Vercel AI SDK for ALL LLM calls — unified interface
- DO NOT change model names (see techStack.md)
- vector(768) for embeddings — matches text-embedding-3-small
- Section-based chunking, NOT fixed-size
- moddatetime extension for updated_at triggers
- RLS enabled on ALL tables from day one

ACCEPTANCE CRITERIA:
- [ ] Next.js app runs with `npm run dev`
- [ ] All migrations apply cleanly to a fresh Supabase instance
- [ ] Seed data loads (sources + topics)
- [ ] subscriber_products, product_ingredients, product_item_matches tables created
- [ ] product_type enum created (supplement | food | cosmetic)
- [ ] RLS policies on product tables are user-scoped
- [ ] Supabase clients work (browser, server, admin)
- [ ] AI SDK clients initialize without error
- [ ] TypeScript compiles cleanly (`npm run type-check` or `npx tsc --noEmit`)
- [ ] .env.local.example has all required variables documented
- [ ] Directory structure matches the spec above
- [ ] RLS policies are in place
- [ ] No HNSW index on empty table (just a comment placeholder)

SUBAGENTS:
- After completion: Run code-reviewer for security review (especially
  RLS policies and env var handling)
- If schema questions arise: Consult backend-architect
```

### Files to Create
| File | Description |
|------|-------------|
| `package.json` | Next.js project with all dependencies |
| `src/lib/supabase/{client,server,admin}.ts` | Three Supabase client variants |
| `src/lib/ai/{gemini,anthropic,openai}.ts` | Three LLM provider clients |
| `src/types/{enums,database,api}.ts` | TypeScript type definitions |
| `supabase/migrations/001_initial_schema.sql` | Full schema in one migration |
| `supabase/seed.sql` | Sources + topics seed data |
| `.env.local.example` | Environment variable template |
| `playwright.config.ts` | Test configuration |
| Various config files | tsconfig, tailwind, eslint |

### Gotchas
- **HNSW index:** Do NOT create on empty `item_chunks` table. PostgreSQL will create a useless index. Wait until Phase 2B loads 1000+ rows, then `CREATE INDEX CONCURRENTLY`.
- **Supabase types:** If Supabase isn't running locally, manually create `database.ts` matching the schema. Regenerate from live DB later.
- **vector(768):** This is locked to `text-embedding-3-small`. Changing models = re-embed entire corpus. Document this constraint.
- **RLS policies:** Service role client (`admin.ts`) bypasses RLS — this is intentional for pipeline operations. Never expose service role key to the client.
- **Sectors derived from product categories.** No separate segment ENUM or table — sectors (food/supplement/cosmetic) are derived from the `product_categories` table.
