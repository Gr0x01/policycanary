---
title: Intelligence Pages — Programmatic SEO Surfaces
created: 2026-03-11
last-updated: 2026-03-12
status: Active — Ingredients complete (25/25), enforcement backfill next
maintainer: RB
---

# Intelligence Pages

Three programmatic SEO surfaces built on existing pipeline data, cross-linked for topical authority, with Anton drafting ongoing content.

## The Surfaces

| Surface | Route | Role | Volume Target | Data Source |
|---------|-------|------|--------------|-------------|
| **Ingredient Watches** | `/ingredients/[slug]` | Traffic engine | 25-50 curated → expand | `substances` (166K), `item_enrichment_tags`, enriched items |
| **Enforcement Analyses** | `/enforcement/[slug]` | Long-tail machine | ~100 backfill, ~10-20/mo ongoing | `regulatory_items` (WL, enforcement, import alerts) |
| **Regulation Trackers** | `/regulations/[slug]` | Conversion pages | 15-20 curated | `regulatory_items` (FR, guidance, regulations.gov) |

## Why This Wins

Research (2026-03-11, saved in `research/`):
- **Competitive gap**: Nobody fills the space between "FDA.gov raw data" and "law firm analysis published 4 weeks later"
- **Ingredient pages** get 200K-1M+/mo aggregate search volume (MAHA tailwind: food additive bills 4→27→140+ across 38 states)
- **Enforcement pages** have near-zero competition on "[company] FDA warning letter" queries (KD 10-30)
- **Regulation pages** are bottom-of-funnel gold (someone searching "MoCRA compliance deadline 2026" IS our buyer)
- **No SaaS company** currently publishes rapid-response enforcement analysis

Research files:
- `research/competitive-content-landscape-fda-enforcement.md`
- `research/seo-keyword-opportunity-analysis.md`
- `research/high-impact-fda-topics-2025-2026.md`

## Architecture

### Database: Single `intelligence_pages` Table

One table with `page_type` enum, not three tables. Shared API, shared queries, one migration.

```sql
intelligence_pages (
  id UUID PK,
  page_type TEXT CHECK ('ingredient' | 'enforcement' | 'regulation'),
  slug TEXT,
  title TEXT,
  excerpt TEXT,
  content TEXT (markdown),
  structured_data JSONB (type-specific: fda_status, deadlines, violations, etc.),
  status TEXT CHECK ('draft' | 'published' | 'needs_refresh'),
  seo_title TEXT,
  seo_description TEXT,
  cover_image_url TEXT,
  word_count INT,
  published_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  refresh_reason TEXT,
  UNIQUE (page_type, slug)
)

intelligence_page_links (
  source_page_id → intelligence_pages,
  target_page_id → intelligence_pages,
  link_type TEXT CHECK ('ingredient_in_enforcement' | 'enforcement_of_regulation' | 'regulation_affects_ingredient' | 'related'),
  UNIQUE (source_page_id, target_page_id, link_type)
)

intelligence_page_items (
  page_id → intelligence_pages,
  item_id → regulatory_items,
  relevance TEXT CHECK ('primary' | 'supporting' | 'mentioned'),
  PK (page_id, item_id)
)
```

RLS: Public read for published pages (SEO surfaces, no auth needed). Writes via service role key.

### `structured_data` JSONB Shapes

**Ingredient:** `{ substance_id, unii, cas_number, fda_status, state_bans[], affected_categories[], key_deadlines[], last_enforcement_date }`

**Enforcement:** `{ company_name, company_slug, total_actions, action_types{}, affected_categories[], violation_types[], date_range{}, fei_numbers[] }`

**Regulation:** `{ regulation_name, regulation_type, cfr_references[], docket_numbers[], current_status, key_deadlines[], affected_categories[], affected_substances[] }`

### File Structure

```
src/lib/intelligence/
  types.ts          — IntelligencePage, IntelligencePageSummary, PageType, structured_data unions
  queries.ts        — getPageBySlug, getPublishedPages, getPagesByType, getLinkedPages (server-only, adminClient)

src/app/(marketing)/
  ingredients/
    page.tsx        — Index (all ingredient watches)
    [slug]/page.tsx — Individual ingredient page
  enforcement/
    page.tsx        — Index (all enforcement analyses)
    [slug]/page.tsx — Individual enforcement page
  regulations/
    page.tsx        — Index (all regulation trackers)
    [slug]/page.tsx — Individual regulation page

src/app/api/intelligence/
  route.ts          — POST endpoint (Anton write path, X-API-Key auth, upsert on page_type+slug)

src/components/intelligence/
  IntelPageCard.tsx       — Card for index pages
  IntelPageSidebar.tsx    — Sticky sidebar: cross-links + deadlines + CTA
  StatusBadge.tsx         — FDA status / regulation status badges
  DeadlineTimeline.tsx    — Visual timeline from structured_data.key_deadlines
  CrossLinkSection.tsx    — "Related Intelligence" from page_links
  EnforcementTimeline.tsx — Chronological enforcement actions for company pages

scripts/
  backfill/
    gather-ingredient-data.ts   — Query Supabase, output JSON context per substance (NO LLM)
    gather-enforcement-data.ts  — Query Supabase, output JSON context per company (NO LLM)
    gather-regulation-data.ts   — Query Supabase, output JSON context per regulation (NO LLM)
  clawdbot/
    publish-intelligence.mjs    — Anton write script (mirrors publish-blog.mjs)
    query-intelligence.mjs      — Query pages needing refresh
```

### API Design

`POST /api/intelligence` — same pattern as `/api/blog`:
- Auth: `X-API-Key` header (reuse `BLOG_API_KEY` or add `INTELLIGENCE_API_KEY`)
- Upsert on `(page_type, slug)` — preserves `published_at` on re-upsert
- Accepts `linked_item_ids[]` and `linked_pages[]` for cross-linking
- Rate limit: 10/min

### Rendering

Reuse from blog: `MarkdownContent`, `ReadingProgress`, `ShareButtons`, signup CTA.
Same two-column layout: main content (max 720px) + sticky sidebar.
ISR at 1 hour, same as blog.

### SEO

- JSON-LD: `Article` + `ChemicalSubstance` (ingredients), `Article` + `Organization` (enforcement), `Article` + `Legislation` (regulations)
- Extend `src/app/sitemap.ts` to include all published intelligence pages
- Meta: `generateMetadata()` per page, same pattern as blog
- Canonical URLs: `https://policycanary.io/{ingredients|enforcement|regulations}/{slug}`

### Cross-Linking

Three mechanisms:
1. **At creation**: Backfill scripts + Anton include `linked_pages[]` in POST
2. **Automatic discovery**: Periodic query on shared `intelligence_page_items` (pages that reference the same regulatory items)
3. **Bidirectional rendering**: `CrossLinkSection` queries both `source_page_id` and `target_page_id`

Internal linking architecture:
```
/ingredients/red-no-3
  → /enforcement/mars-inc (company cited for Red No. 3)
  → /regulations/delaney-clause (governing regulation)
  → /ingredients/red-40 (related substance)
```

## Content Flow

### Backfill (One-Time, Jan 2025 – Present) — SUBAGENT-DRIVEN

**NO LLM API CALLS for content generation.** Claude Code Max gives us unlimited subagents. Use them.

**Flow:**
1. **Data scripts** query Supabase and format context (enriched items, substances, enforcement details, product categories, deadlines). Output: structured JSON context files per page.
2. **Subagents** (5-10 parallel, Claude) receive the data context + web research instructions. Each agent:
   - Gets the formatted data context for one page
   - Does web research (WebSearch/WebFetch) for current status, state-level actions, recent news
   - Writes the analysis markdown + structured_data JSON
   - POSTs to `/api/intelligence` as `status: "draft"`
3. **RB reviews** drafts, approves, publishes.

**Batching:**
- Ingredients: ~25-50 substances, batches of 5-10 parallel subagents
- Enforcement: ~50-100 companies, batches of 5-10 parallel subagents
- Regulations: ~15-20 regulations, batches of 5-10 parallel subagents

**Data scripts needed** (query + format only, no LLM):
- `scripts/backfill/gather-ingredient-data.ts` — for each substance: query related regulatory items, enrichment tags, product categories, enforcement history. Output JSON.
- `scripts/backfill/gather-enforcement-data.ts` — for each company: query all enforcement items, violations, affected categories, date ranges. Output JSON.
- `scripts/backfill/gather-regulation-data.ts` — for each regulation: query related items, deadlines, affected categories, enforcement examples. Output JSON.

**Why subagents, not Gemini Pro:**
- Claude Code Max = unlimited subagent tokens (free)
- Gemini Pro = paid per token (~$7/M input, ~$21/M output for Pro)
- 150+ pages × ~2K tokens each = meaningful cost on Gemini
- Subagents can also do web research for current status (WebSearch/WebFetch), which Gemini can't

### Ongoing (Anton Takes Over — Real-Time, Not Cron)

**The trigger is the enrichment pipeline.** Items are enriched twice daily via Inngest `daily-ingest`. The moment a newly enriched item is relevant, Anton acts.

**Detection (in enrichment pipeline):** After `enrichItem()` in `processor.ts`, call `flagPagesForRefresh()`:
- If item has substances matching an existing ingredient page → set page `status = 'needs_refresh'`, `refresh_reason = 'new_item:{item.id}'`
- If item has company matching an existing enforcement page → same
- If item has regulation tags matching an existing regulation page → same
- If item matches criteria for a NEW page (e.g., enforcement action for a company with no page yet) → fire event to Anton

**Anton response (immediate, not cron):** The `flagPagesForRefresh` step fires an Inngest event or Slack notification. Anton picks it up immediately:
- **Existing page refresh**: Gathers updated data, drafts new content, POSTs to API, posts to Slack `#pc-content` for review
- **New page creation**: Gathers data for the new company/substance/regulation, drafts page, POSTs as draft, posts to Slack for review

**New page thresholds:**
- Enforcement: ANY warning letter, recall, or import alert for a company → create page (these are high-intent landing pages, even one action is worth it)
- Ingredients: Substance appears in 3+ regulatory items OR is flagged as banned/under_review → create page
- Regulations: Manual curation only (15-20 regulations, adding new ones is a deliberate decision)

**Result:** Within hours of a new FDA enforcement action hitting the pipeline, there's a draft analysis page in Slack for review. Publish same day = 24-hour turnaround on content. This is the speed advantage over law firms (1-4 weeks).

## Build Phases

### Phase A: Foundation (3-4 days)
- Migration `007_intelligence_pages.sql`
- `src/lib/intelligence/types.ts` + `queries.ts`
- `POST /api/intelligence`
- Extend sitemap

### Phase B: Ingredient Pages (3-4 days)
- Index + detail pages under `/ingredients/`
- Shared components (IntelPageCard, StatusBadge, DeadlineTimeline, IntelPageSidebar, CrossLinkSection)
- Backfill script + run for ~25-50 substances
- Anton scripts (publish-intelligence.mjs, query-intelligence.mjs)

### Phase C: Enforcement Pages (2-3 days)
- Index + detail pages under `/enforcement/`
- EnforcementTimeline component
- Backfill script + run for ~50-100 companies

### Phase D: Regulation Pages (2-3 days)
- Index + detail pages under `/regulations/`
- Backfill script + run for ~15-20 regulations

### Phase E: Real-Time Pipeline Integration (2-3 days)
- `flagPagesForRefresh()` hook in enrichment pipeline (`processor.ts`)
- New page detection logic (enforcement: any action → new page; ingredients: 3+ items or banned/under_review)
- Inngest event or Slack notification to Anton on flag
- Anton scripts for refresh + new page drafting
- Cross-link generation (automatic discovery via shared `intelligence_page_items`)

**Total: ~14-17 days**

## First Targets by Surface

### Ingredients — COMPLETE (25/25 published, ~51,750 words)
Red No. 3, Red 40, BHA, titanium dioxide, PFAS, Yellow 5, Yellow 6, Blue 1, Blue 2, Green 3, potassium bromate, propylparaben, brominated vegetable oil, azodicarbonamide, NMN, formaldehyde, talc, lead, kratom, CBD/cannabidiol, sucralose, aspartame, carrageenan, sodium nitrite, parabens

### Enforcement (Week 2-3)
Prioritize companies from 2025-2026 with high search volume:
- ByHeart (infant formula botulism)
- FreshRealm (listeria, 7 deaths)
- GLP-1 compounders (50+ warning letters)
- Dollar Tree (lead-tainted applesauce)
- Major retailers (recall execution failures)
- Kratom/tianeptine vendors

### Regulations (Week 3-4)
MoCRA, FSMA 204, Red No. 3 ban (Delaney Clause), food dye phase-out (MAHA), GRAS reform, Section 781 hemp/CBD, front-of-pack labeling, dietary supplement GMP (21 CFR 111), PFAS food contact restrictions, ultra-processed food definition, dietary supplement listing act, formaldehyde in cosmetics, lead in baby food (Closer to Zero), FSMA agricultural water

## Key Patterns to Follow

- Blog API: `src/app/api/blog/route.ts` (auth, Zod, upsert, timingSafeEqual)
- Blog detail page: `src/app/(marketing)/blog/[slug]/page.tsx` (metadata, JSON-LD, two-column, ISR)
- Blog queries: `src/lib/blog/queries.ts` (server-only, adminClient, projections)
- Enrichment hook: `src/pipeline/enrichment/processor.ts` (where to add flagPagesForRefresh)
- Sitemap: `src/app/sitemap.ts` (extend for intelligence pages)
