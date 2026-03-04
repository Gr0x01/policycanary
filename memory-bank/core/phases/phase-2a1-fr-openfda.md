# Phase 2A-1: Federal Register + openFDA Fetchers

**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 1
**Purpose:** Build fetcher modules for the three primary data sources — Federal Register API, openFDA enforcement, and openFDA CAERS adverse events.

### Session Brief

```
TASK: Build data fetcher modules for Federal Register API, openFDA enforcement
(recalls), and openFDA CAERS (adverse events). These fetch raw data from
external APIs and insert it into the database. No LLM enrichment yet.

WHAT TO READ FIRST:
- /memory-bank/research/data-validation.md — CRITICAL real API findings
- /memory-bank/architecture/data-schema.md — table schemas
- /memory-bank/research/data-sources.md — full API documentation

ARCHITECTURE:
Each fetcher follows the same pattern:
  1. Query external API with date window or pagination
  2. Parse and normalize response
  3. Deduplicate against existing records (UNIQUE source_id + source_ref)
  4. Insert new records into appropriate tables
  5. Log results to pipeline_runs table
  6. Support both backfill (historical) and incremental (daily) modes

All fetchers live in: src/pipeline/fetchers/
All fetchers use: src/lib/supabase/admin.ts (service role, bypasses RLS)

FETCHER 1: FEDERAL REGISTER (src/pipeline/fetchers/federal-register.ts)

  API base: https://www.federalregister.gov/api/v1

  CRITICAL GOTCHAS (from real data validation):
  - List endpoint returns stripped-down results (~8 fields per doc)
  - MUST fetch each document individually for: cfr_references, docket_ids,
    effective_on, comments_close_on, action, topics
  - `topics` field is UNRELIABLE (empty 2/3 of the time) — do NOT use
    for classification, rely on LLM enrichment
  - Pagination capped at 10,000 results / 50 pages
  - Need date-range windowing for backfill

  Implementation:
  a) List query:
     GET /documents.json?conditions[agencies][]=food-and-drug-administration
       &conditions[publication_date][gte]=YYYY-MM-DD
       &conditions[publication_date][lte]=YYYY-MM-DD
       &per_page=100&page=N
       &fields[]=document_number,title,type,publication_date,abstract,
                 html_url,page_views_count,significant

  b) Per-document detail fetch:
     GET /documents/{document_number}.json
       &fields[]=cfr_references,docket_ids,effective_on,
                 comments_close_on,action,raw_text_url,
                 regulation_id_number_info,topics

  c) Rate limiting: Be polite — 100ms delay between individual doc fetches.
     FR API has no published rate limit but don't hammer it.

  d) Insert into regulatory_items:
     - source_ref = document_number
     - item_type = map FR type: "Rule" → rule, "Proposed Rule" → proposed_rule,
       "Notice" → notice
     - raw_content = abstract (list endpoint has it; full text via raw_text_url
       is fetched during enrichment if needed)
     - cfr_references = JSONB array of {title, part}
     - fr_citation = construct from volume + start page
     - action_text = action field from detail
     - page_views = page_views_count
     - significant = significant flag (null for Notices)
     - processing_status = 'ok' (set 'parse_error' if abstract is missing)

  e) Backfill mode:
     - Date range windowing: 6-month windows to stay under 10K cap
     - Start from 2020-01-01 (6 years of relevant data)
     - Log each window as a separate pipeline_run

  f) Incremental mode:
     - Fetch last 7 days (overlap to catch late publications)
     - Deduplicate on (source_id, source_ref)

  Zod schema for API response validation:
     - Define FederalRegisterListResponse, FederalRegisterDocument schemas
     - Validate before processing — flag parse errors

FETCHER 2: OPENFDA ENFORCEMENT (src/pipeline/fetchers/openfda-enforcement.ts)

  API: https://api.fda.gov/food/enforcement.json

  CRITICAL GOTCHAS:
  - product_type is ALWAYS "Food" even for supplements — cannot use for
    sector classification
  - openfda harmonized fields are ALWAYS EMPTY on food enforcement
  - Dates are YYYYMMDD strings, not ISO — convert on ingest
  - No cosmetics enforcement data in this endpoint

  Implementation:
  a) Query with date window:
     ?search=report_date:[YYYYMMDD+TO+YYYYMMDD]&limit=100&skip=N
     (limit 100 per page, skip for pagination)

  b) Insert into regulatory_items:
     - source_ref = recall_number (or event_id)
     - item_type = 'recall'
     - raw_content = reason_for_recall + product_description
     - published_date = parse report_date from YYYYMMDD
     - processing_status = 'ok'

  c) Insert child record into enforcement_details:
     - company_name = recalling_firm
     - products = [product_description] as JSONB
     - recall_classification = classification ("Class I", "Class II", "Class III")
     - recall_status = status
     - voluntary_mandated = voluntary_mandated
     - distribution_pattern = distribution_pattern
     - product_quantity = product_quantity

  d) Backfill: all records from 2020-01-01
     Total: ~28K records, 100/page = 280 pages

  e) Incremental: last 14 days (recalls can be backdated)

FETCHER 3: OPENFDA CAERS (src/pipeline/fetchers/openfda-caers.ts)

  API: https://api.fda.gov/food/event.json

  CRITICAL GOTCHAS:
  - Skip maxes at 25,000 — MUST use date-range windowing
  - industry_code is the GOLDEN classification field:
    54 = supplements, 53 = cosmetics, everything else = food
  - Multi-product reports are common — one report can span sectors
  - No company/manufacturer field — only name_brand
  - 148K+ total records

  Implementation:
  a) Query with date window:
     ?search=date_created:[YYYYMMDD+TO+YYYYMMDD]&limit=100&skip=N

  b) Insert into adverse_event_reports:
     - report_number = report_number
     - date_created = parse from YYYYMMDD
     - date_started = parse from YYYYMMDD
     - outcomes = array from outcomes[]
     - reactions = array from reactions[].reaction
     - consumer fields from consumer (age, gender)

  c) Insert into adverse_event_products (one per product):
     - role = products[].role
     - name_brand = products[].name_brand
     - industry_code = products[].industry_code
     - industry_name = products[].industry_name
     - sector = derived: code 54 → supplements, 53 → cosmetics, else → food

  d) Backfill strategy (date windowing to avoid 25K skip limit):
     - Use 3-month windows: 2020-Q1, 2020-Q2, etc.
     - Each window should have <25K results
     - Verify count first: ?search=date_created:[range]&count=date_created.exact

  e) Incremental: last 30 days (reports can be delayed)

SHARED UTILITIES:

  a) src/pipeline/fetchers/utils.ts
     - parseFdaDate(yyyymmdd: string): Date — convert YYYYMMDD to Date
     - sleep(ms: number): Promise<void> — rate limit helper
     - logPipelineRun(params): Promise<void> — insert into pipeline_runs
     - createFetcherResult type — standardized return from all fetchers

  b) Error handling pattern:
     - Never throw on individual record failures — log and continue
     - Set processing_status = 'parse_error' for bad records
     - Track items_fetched, items_created, items_skipped in pipeline_runs
     - Return summary stats from each fetcher

  c) Zod schemas for each API:
     src/pipeline/fetchers/schemas/
       federal-register.ts
       openfda-enforcement.ts
       openfda-caers.ts

ACCEPTANCE CRITERIA:
- [ ] Federal Register fetcher pulls documents and inserts into regulatory_items
- [ ] FR fetcher handles date-windowed backfill correctly
- [ ] FR fetcher does individual doc detail fetches for full metadata
- [ ] openFDA enforcement fetcher inserts items + enforcement_details
- [ ] openFDA enforcement converts YYYYMMDD dates correctly
- [ ] CAERS fetcher inserts reports + products with correct sector mapping
- [ ] CAERS fetcher uses date windowing to stay under 25K skip limit
- [ ] All fetchers log to pipeline_runs
- [ ] All fetchers deduplicate on (source_id, source_ref)
- [ ] Zod schemas validate all API responses
- [ ] Error handling logs bad records without crashing
- [ ] Each fetcher works in both backfill and incremental mode

SUBAGENTS:
- After completion: code-reviewer (check error handling, SQL injection safety)
```

### Files to Create
| File | Description |
|------|-------------|
| `src/pipeline/fetchers/federal-register.ts` | FR API fetcher with date windowing |
| `src/pipeline/fetchers/openfda-enforcement.ts` | Recall/enforcement fetcher |
| `src/pipeline/fetchers/openfda-caers.ts` | CAERS adverse event fetcher |
| `src/pipeline/fetchers/utils.ts` | Shared fetcher utilities |
| `src/pipeline/fetchers/schemas/federal-register.ts` | Zod schemas for FR API |
| `src/pipeline/fetchers/schemas/openfda-enforcement.ts` | Zod schemas for openFDA enforcement |
| `src/pipeline/fetchers/schemas/openfda-caers.ts` | Zod schemas for CAERS API |

### Gotchas
- **FR API 10K cap:** Date windows must be small enough. 6-month windows for FDA-filtered queries should stay under 10K.
- **FR per-doc fetches:** Each doc needs an individual API call for full metadata. For a 6-month window with ~500 docs, that's 500 calls. At 100ms delay = ~50 seconds per window. Budget for this.
- **CAERS 25K skip limit:** If a 3-month window has >25K results (unlikely but possible for food), narrow to 1-month windows.
- **Enforcement dates:** YYYYMMDD format — e.g., "20260215" not "2026-02-15". The parser MUST handle this.
- **No cosmetics enforcement:** openFDA enforcement has no cosmetics data. Cosmetics enforcement comes from warning letters (Phase 2A-2).
