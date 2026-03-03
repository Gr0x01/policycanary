---
Title: Data Schema v1
Version: v1
Last-Updated: 2026-03-05
Maintainer: RB
Status: Active
---

# Data Schema: Policy Canary v1

## Design Principles

1. **Source data is sacred.** Raw content is preserved verbatim and never modified after ingest.
2. **Enrich at ingest, not at query.** LLM work happens when data arrives. The feed is a database query, not an LLM call.
3. **Enrichment is rebuildable.** All LLM-generated data can be regenerated from raw source content. Better models or prompts = re-run the corpus.
4. **Per-category impact is the product.** Not "what happened" but "what this means for YOUR business."
5. **Controlled vocabulary enables trends.** Normalized category tags make accumulation detectable. Free-text tags don't aggregate.
6. **Lows accumulate into signals.** Individual low-relevance items are noise; clusters of lows in the same category = emerging trend.
7. **Different data shapes get different tables.** Regulatory actions, adverse event reports, and state chemical bans are structurally different entities. Don't force them into one table.
8. **Analytics data feeds trends, not the feed.** Adverse event reports are intelligence inputs, not individual feed items. Patterns surface as trend signals.
9. **Every AI claim must cite its source.** No assertion without a traceable quote from the raw source text. Citations link claims to exact source spans with verifiable URLs.
10. **Ingredients are the common denominator.** Product-level monitoring works because both subscriber products AND regulatory items can be resolved to canonical substances. Substance matching is the backbone of product relevance.
11. **Classification derives from source data.** openFDA enforcement has no "Dietary Supplement" or "Cosmetic" product_type — both show as "Food". Warning letters have zero structured product metadata. The enrichment layer must handle classification, not the source data.

---

## Architecture Overview

```
LAYER 1: SOURCE DATA
  sources --> pipeline_runs --> regulatory_items
  (ground truth, never modified after ingest)
      |
      v
LAYER 2: CLASSIFICATION
  regulatory_categories  <--junction-->  item_categories
  (segments + topics + product classes, flexible lookup)
      |
      v
LAYER 3: SUBSTANCE REFERENCE
  substances  <-->  substance_names  <-->  substance_codes
  (canonical identifiers, GSRS-bootstrapped, fuzzy search, use-context codes)
      |
      v
LAYER 4: ENRICHMENT
  item_enrichments -----> item_citations
  segment_impacts ------> item_citations
  item_enrichment_tags    (product_type, facility_type, claims, regulation)
  regulatory_item_substances  (extracted substances per item, FK to substances)
      |
      v
LAYER 5: SEARCH & RETRIEVAL
  item_chunks  (sectioned content + vector(1536) embeddings)
      |
      v
LAYER 6: INTELLIGENCE
  item_relations | enforcement_details | trend_signals
      |
      v
LAYER 7: SUBSCRIBER PRODUCTS
  subscriber_products --> product_ingredients (FK to substances)
      |
      v
LAYER 8: PRODUCT MATCHING
  product_matches  (THE money table -- regulatory item x subscriber product)
      |
      v
LAYER 9: USERS & EMAIL
  users | email_subscribers | user_bookmarks
  email_campaigns --> email_campaign_items --> email_sends
```

### Matching Flow (Ingest to Email)

```
1. INGEST: Source API --> regulatory_items (raw content preserved)
2. CLASSIFY: LLM tags item --> item_categories (segments, topics, product classes)
3. EXTRACT SUBSTANCES: LLM + structured fields --> regulatory_item_substances
4. RESOLVE: Match raw substance names --> substances table (UNII, CAS, fuzzy)
4b. USE-CONTEXT LOOKUP: substance_codes --> UseContextCategory mapping (deterministic)
4c. CROSS-REFERENCE: Gemini Pro reasons about cross-segment risk transfer (LLM, ~20-30% of items)
5. ENRICH: LLM generates --> item_enrichments, segment_impacts, item_enrichment_tags, item_citations
   (segment_impacts + item_enrichment_tags include signal_source = 'direct' | 'cross_reference')
6. EMBED: Chunk content --> item_chunks with vector(1536) embeddings
7. MATCH: For each subscriber product:
     a. Primary: substance_id match (product_ingredients <-> regulatory_item_substances)
     b. Fallback: normalized_name string match for unresolved substances
     c. Category: item_enrichment_tags overlap for non-ingredient dimensions
     d. Semantic: embedding similarity for edge cases
   --> product_matches scored with confidence
8. DELIVER: product_matches --> email_campaigns (personalized per subscriber) --> email_sends
```

---

## Layer 1: Source Data

### `sources`

Tracks where data comes from. One row per data pipeline.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| name | TEXT | UNIQUE, NOT NULL | 'federal_register', 'openfda_enforcement', 'openfda_recalls', 'fda_warning_letters', 'fda_rss', 'dsld', 'fdc' |
| source_type | TEXT | NOT NULL, CHECK (source_type IN ('api', 'rss', 'scrape', 'csv', 'manual')) | |
| base_url | TEXT | | |
| last_synced_at | TIMESTAMPTZ | | Last successful sync |
| sync_config | JSONB | | API params, pagination cursors, rate limits |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### `pipeline_runs`

Operational log for every pipeline execution. Know when things break, what was processed, and what failed.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| source_id | UUID | NOT NULL, FK --> sources | |
| started_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| completed_at | TIMESTAMPTZ | | Null while running |
| items_fetched | INT | DEFAULT 0 | Total items pulled from source |
| items_created | INT | DEFAULT 0 | New items inserted |
| items_updated | INT | DEFAULT 0 | Existing items updated |
| items_skipped | INT | DEFAULT 0 | Duplicates or filtered out |
| status | TEXT | NOT NULL, CHECK (status IN ('running', 'success', 'failed', 'partial')) | |
| error_message | TEXT | | Null on success |
| metadata | JSONB | | Extra run context (date range queried, API params used) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_pipeline_runs_source_id` on (source_id)
- `idx_pipeline_runs_status` on (status)
- `idx_pipeline_runs_started_at` on (started_at DESC)

---

### `regulatory_items`

The core entity. Every piece of regulatory data that enters the system. Covers: Federal Register docs, enforcement actions, warning letters, recalls, guidance docs, import alerts, RSS items. Does NOT cover: adverse event reports or state chemical bans (deferred to expansion).

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| source_id | UUID | NOT NULL, FK --> sources | |
| source_ref | TEXT | NOT NULL | External ID (FR doc number, openFDA recall_number, MARCS-CMS number) |
| source_url | TEXT | | Link to original document for user verification |
| title | TEXT | NOT NULL | |
| raw_content | TEXT | | Original text, preserved verbatim. Enrichment runs against this. |
| item_type | TEXT | NOT NULL, CHECK (item_type IN ('rule', 'proposed_rule', 'notice', 'guidance', 'draft_guidance', 'warning_letter', 'recall', 'import_alert', '483_observation', 'safety_alert', 'press_release', 'state_regulation')) | TEXT+CHECK instead of ENUM for safe migration |
| jurisdiction | TEXT | NOT NULL, DEFAULT 'federal', CHECK (jurisdiction IN ('federal', 'state')) | Unified pipeline for federal + state |
| jurisdiction_state | TEXT | | Two-letter state code. NULL for federal items. CHECK (jurisdiction = 'federal' OR jurisdiction_state IS NOT NULL) |
| published_date | DATE | NOT NULL | |
| effective_date | DATE | | Only reliably populated for Rules (Federal Register) |
| comment_deadline | DATE | | `comments_close_on` from FR API |
| docket_number | TEXT | | Format: "FDA-YYYY-X-NNNN" |
| issuing_office | TEXT | | CFSAN, CDER, ORA, etc. |
| fr_citation | TEXT | | Federal Register citation, e.g. "91 FR 7825" |
| cfr_references | JSONB | | Array of {title, part} from FR API. Classification hook. |
| action_text | TEXT | | FR API `action` field: "Final rule.", "Proposed rule; withdrawal." |
| page_views | INT | | FR API page view count -- significance signal |
| significant | BOOLEAN | | FR API `significant` flag. Null for Notices. |
| processing_status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (processing_status IN ('pending', 'ok', 'parse_error', 'incomplete_source')) | Flags bad source data before enrichment |
| processing_error | TEXT | | Error details when processing_status != 'ok' |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | moddatetime trigger |

**Constraints:**
- `uq_regulatory_items_source_ref` UNIQUE(source_id, source_ref) -- no duplicate imports

**Indexes:**
- `idx_regulatory_items_published_date` on (published_date DESC)
- `idx_regulatory_items_item_type` on (item_type)
- `idx_regulatory_items_type_date` on (item_type, published_date DESC)
- `idx_regulatory_items_jurisdiction` on (jurisdiction)
- `idx_regulatory_items_processing_status` on (processing_status) WHERE processing_status != 'ok'

**Design notes:**
- FR API list endpoint is stripped down -- must fetch each doc individually for cfr_references, docket_number, effective_date, comment_deadline, action_text.
- FR API `topics` field is unreliable (empty 2/3 of the time) -- rely on LLM enrichment from title + abstract instead.
- openFDA enforcement `product_type` is always "Food" even for supplements -- classification comes from LLM enrichment.
- openFDA dates are YYYYMMDD strings -- convert on ingest.
- `jurisdiction` + `jurisdiction_state` enables a unified pipeline. State items get the same enrichment flow. No parallel tables needed.

---

## Layer 2: Classification

### `regulatory_categories`

Flexible lookup table for all classification dimensions. Replaces hardcoded segment ENUMs and the separate `topics` table. Segments, topics, product classes, and regulatory programs are all rows here, differentiated by `category_type`.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| slug | TEXT | UNIQUE, NOT NULL | 'supplements', 'cosmetics', 'identity-testing', 'cgmp-violations' |
| label | TEXT | NOT NULL | 'Dietary Supplements', 'Identity Testing' |
| category_type | TEXT | NOT NULL, CHECK (category_type IN ('segment', 'topic', 'product_class', 'regulatory_program')) | What kind of category this is |
| parent_id | UUID | FK --> regulatory_categories | Self-referential for hierarchy: segment > topic |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display ordering within category_type |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | LLM can propose categories; human sets is_active = true to approve |
| description | TEXT | | Optional context for the category |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_regulatory_categories_type` on (category_type)
- `idx_regulatory_categories_parent` on (parent_id)
- `idx_regulatory_categories_slug` on (slug)

**Seed data (segments):**
| slug | label | category_type | Notes |
|------|-------|---------------|-------|
| supplements | Dietary Supplements | segment | FDA industry code 54 |
| cosmetics | Cosmetics & Personal Care | segment | FDA industry code 53 |
| food | Conventional Food & Beverage | segment | FDA industry codes 2-9, 12, 15-22, 25, 33-42 |

**Seed data (example topics):**
| slug | label | category_type | parent (segment) | Notes |
|------|-------|---------------|-----------------|-------|
| identity-testing | Identity Testing | topic | supplements | 21 CFR 111.70 |
| facility-registration | Facility Registration | topic | cosmetics | MoCRA requirement |
| cgmp-violations | CGMP Violations | topic | supplements | 21 CFR Part 111 |
| labeling-claims | Labeling & Claims | topic | (multiple) | Cross-cutting |
| food-additives | Food Additives & GRAS | topic | food | 21 CFR Parts 170-189 |
| allergen-documentation | Allergen Documentation | topic | food | FSMA / FALCPA |
| ndi-notifications | NDI Notifications | topic | supplements | New dietary ingredients |
| adverse-events | Adverse Event Reporting | topic | (multiple) | Cross-cutting |
| product-recalls | Product Recalls | topic | (multiple) | Cross-cutting |
| import-safety | Import Safety & Detention | topic | (multiple) | Cross-cutting |

**Seed data (example product classes):**
| slug | label | category_type | Notes |
|------|-------|---------------|-------|
| botanical-supplements | Botanical Supplements | product_class | |
| protein-powders | Protein Powders | product_class | |
| skin-care | Skin Care Products | product_class | |
| color-additives | Color Additives | product_class | Spans food/drug/cosmetic/device |

**FDA industry codes reference for seeding:**
- 53 = Cosmetics
- 54 = Vit/Min/Prot/Unconv Diet (Supplements)
- 2-9, 12, 15-22, 25, 33-42 = Various food categories
- 41 = Dietary Conventional Foods
- These codes appear in openFDA CAERS data and can inform classification

---

### `item_categories`

Many-to-many junction between regulatory items and categories. An item can belong to multiple segments, topics, and product classes simultaneously. This is critical because cross-cutting regulations are the norm (e.g., color additive rules span food/drug/cosmetic/device).

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | Composite PK |
| category_id | UUID | NOT NULL, FK --> regulatory_categories ON DELETE CASCADE | Composite PK |
| confidence | REAL | | 0-1, LLM-assessed confidence for this tag |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- PRIMARY KEY (item_id, category_id)

**Indexes:**
- `idx_item_categories_category` on (category_id)

---

## Layer 3: Substance Reference

### `substances`

Canonical substance reference table. Bootstrapped from FDA GSRS (~169K substances). This is the backbone of product-level matching -- both subscriber product ingredients and regulatory item extractions resolve to rows in this table.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| canonical_name | TEXT | NOT NULL | Preferred name from GSRS |
| unii | CHAR(10) | UNIQUE | FDA Unique Ingredient Identifier. Nullable for non-GSRS substances. |
| cas_number | TEXT | | CAS Registry Number. Not unique (some substances have multiple). |
| inchi_key | TEXT | | IUPAC International Chemical Identifier hash |
| substance_class | TEXT | CHECK (substance_class IN ('chemical', 'protein', 'botanical', 'mixture', 'polymer', 'nucleic_acid')) | GSRS substance class |
| ingredient_group | TEXT | CHECK (ingredient_group IN ('vitamin', 'mineral', 'botanical', 'amino_acid', 'enzyme', 'fatty_acid', 'probiotic', 'other')) | DSLD-style grouping for display/filtering |
| description | TEXT | | Optional context |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | moddatetime trigger |

**Indexes:**
- `idx_substances_unii` on (unii) WHERE unii IS NOT NULL
- `idx_substances_cas` on (cas_number) WHERE cas_number IS NOT NULL
- `idx_substances_canonical_name` on (canonical_name)
- `idx_substances_class` on (substance_class)
- `idx_substances_group` on (ingredient_group)

**Bootstrapping:** Import from FDA GSRS public API (https://gsrs.ncats.nih.gov/). ~169K substances with UNII codes, CAS numbers, names, classifications, and use-context codes. Script: `scripts/bootstrap-gsrs.ts`. One-time bulk import with monthly refresh (Phase 2C).

---

### `substance_names`

Synonym resolution table. A single substance may have dozens of names across different contexts (scientific, common, brand, abbreviated). This table powers fuzzy matching: when a regulatory item mentions "ascorbic acid" or a product label says "Vitamin C", both resolve to the same substance.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| substance_id | UUID | NOT NULL, FK --> substances ON DELETE CASCADE | |
| name | TEXT | NOT NULL | The name/synonym |
| name_type | TEXT | NOT NULL, CHECK (name_type IN ('preferred', 'systematic', 'common', 'brand', 'abbreviation')) | |
| language | CHAR(2) | NOT NULL, DEFAULT 'en' | ISO 639-1 |
| source | TEXT | NOT NULL, CHECK (source IN ('gsrs', 'dsld', 'openfoodfacts', 'user', 'manual')) | Where this synonym came from |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_substance_names` UNIQUE(substance_id, name)

**Indexes:**
- `idx_substance_names_substance` on (substance_id)
- `idx_substance_names_trgm` GIN on (name gin_trgm_ops) -- fuzzy matching (requires pg_trgm extension)
- `idx_substance_names_fts` GIN on (to_tsvector('english', name)) -- full-text search
- `idx_substance_names_source` on (source)

**Notes:**
- pg_trgm extension MUST be enabled: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- The trigram index enables queries like `SELECT * FROM substance_names WHERE name % 'ascrobic acid'` (catches typos)
- Full-text index enables queries like `SELECT * FROM substance_names WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'vitamin c')` (semantic matches)
- Populated during GSRS import (each substance has multiple names) and enriched from DSLD, OpenFoodFacts as products are onboarded

---

### `substance_codes`

Use-context codes per substance from GSRS. Powers cross-reference inference (Step 1b): maps code systems to use-context categories (food additive, supplement ingredient, cosmetic ingredient, pharmaceutical, etc.). This is the data foundation for the cross-segment intelligence feature.

**Status:** Live (migration 002 applied, table empty until GSRS bootstrap re-run)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| substance_id | UUID | NOT NULL, FK --> substances ON DELETE CASCADE | |
| code_system | TEXT | NOT NULL | e.g. 'CFR', 'CODEX ALIMENTARIUS (GSFA)', 'DSLD', 'COSMETIC INGREDIENT REVIEW (CIR)' |
| code_value | TEXT | NOT NULL | The actual code: '21 CFR 172.110', 'DSLD-12345', etc. |
| code_type | TEXT | | 'PRIMARY', 'CLASSIFICATION', etc. |
| is_classification | BOOLEAN | DEFAULT false | Whether this code represents a classification vs a specific registration |
| comments | TEXT | | Functional class, regulatory category (e.g. 'Functional Classification\|Antioxidant') |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_substance_codes` UNIQUE(substance_id, code_system, code_value)

**Indexes:**
- `idx_substance_codes_substance` on (substance_id)
- `idx_substance_codes_system` on (code_system)

**Relevant code systems (10 total):**

| Code System | Use-Context Signal |
|---|---|
| CFR | Food additive (Part 170-189), food-contact (Part 175-178), color additive (Part 73-82), OTC drug (Part 310-369), cosmetic (Part 700-740) |
| CODEX ALIMENTARIUS (GSFA) | Food additive + functional class (from comments) |
| JECFA EVALUATION | Food additive evaluation |
| DSLD | Supplement ingredient presence |
| COSMETIC INGREDIENT REVIEW (CIR) | Cosmetic safety reviewed |
| RXCUI | Pharmaceutical use |
| DRUGBANK | Pharmaceutical use |
| DAILYMED | Drug/pharmaceutical |
| EPA PESTICIDE CODE | Pesticide registration |
| Food Contact Substance Notif | Food-contact material |

**Estimated volume:** ~500K-850K rows (169K substances × ~3-5 relevant codes each).

**Cross-reference pipeline:** `lookupUseContexts()` in `src/pipeline/enrichment/cross-reference.ts` queries this table for resolved substances and maps codes to `UseContextCategory` types deterministically (no LLM). Step 1c then uses these use contexts to reason about cross-segment risk transfer via Gemini 2.5 Pro.

---

## Layer 4: Enrichment

### `item_enrichments`

Structured LLM output per regulatory item. Separate from source data so enrichment is rebuildable. One row per item per enrichment version.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| summary | TEXT | NOT NULL | Plain-English summary |
| key_regulations | TEXT[] | | ['21 CFR 111', 'MoCRA Section 605'] |
| key_entities | TEXT[] | | Companies, ingredients, agencies mentioned |
| enrichment_model | TEXT | NOT NULL | 'gemini-2.5-flash', 'gemini-2.5-pro' |
| enrichment_version | INT | NOT NULL, DEFAULT 1 | Bump when prompt/schema changes. Enables re-enrichment. |
| confidence | REAL | | 0-1, LLM self-assessed |
| verification_status | TEXT | NOT NULL, DEFAULT 'unverified', CHECK (verification_status IN ('unverified', 'verified', 'rejected')) | Manual spot-check flag |
| raw_response | JSONB | | Full LLM response for debugging |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_item_enrichments_version` UNIQUE(item_id, enrichment_version)

**Indexes:**
- `idx_item_enrichments_item` on (item_id)

**Design notes:**
- Re-enrichment inserts a new row with incremented enrichment_version only when prompt/schema changes.
- Latest enrichment is always MAX(enrichment_version) for a given item_id.
- raw_response preserves the full LLM output for debugging and re-parsing without re-calling the model.

---

### `segment_impacts`

Per-category relevance scoring. Powers the search feed, trend detection, and free digest. "What does this mean for supplements/cosmetics/food?"

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| category_id | UUID | NOT NULL, FK --> regulatory_categories ON DELETE CASCADE | Points to a segment-type category |
| relevance | TEXT | NOT NULL, CHECK (relevance IN ('critical', 'high', 'medium', 'low', 'none')) | |
| impact_summary | TEXT | | Segment-specific "what this means for you" |
| action_items | JSONB | | ["Review SOPs...", "Submit comments by..."] |
| who_affected | TEXT | | "All supplement manufacturers using botanicals" |
| deadline | DATE | | Segment-specific deadline if different from item |
| published_date | DATE | NOT NULL | Denormalized from regulatory_items. Enables single-table feed query without JOIN. |
| signal_source | TEXT | NOT NULL, DEFAULT 'direct', CHECK (signal_source IN ('direct', 'cross_reference')) | Whether this segment was from LLM extraction (direct) or cross-reference inference (cross_reference) |
| verification_status | TEXT | NOT NULL, DEFAULT 'unverified', CHECK (verification_status IN ('unverified', 'verified', 'rejected')) | Manual spot-check flag |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_segment_impacts_item_category` UNIQUE(item_id, category_id)

**Indexes:**
- `idx_segment_impacts_feed` on (category_id, relevance, published_date DESC) -- THE feed index
- `idx_segment_impacts_item` on (item_id)
- `idx_segment_impacts_published` on (published_date DESC)

**Design notes:**
- `category_id` replaces the old segment ENUM. Points to a `regulatory_categories` row where category_type = 'segment'.
- `published_date` is denormalized from `regulatory_items` to enable single-table feed queries without JOIN. The feed query is the hottest path in the system.
- The feed index `(category_id, relevance, published_date DESC)` covers: "Show me all critical+high items for supplements, newest first" as a single index scan.
- `signal_source` distinguishes direct LLM extraction from cross-reference inference. Phase 4C (product matching) can weight inferred signals differently. The UI can show "Inferred: this substance is also used in supplements" with reasoning.

---

### `item_enrichment_tags`

Deep tagging for NON-ingredient dimensions. Captures product types, facility types, claims, and regulation dimensions extracted during enrichment. Ingredient dimensions are handled separately by `regulatory_item_substances`.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| tag_dimension | TEXT | NOT NULL, CHECK (tag_dimension IN ('product_type', 'facility_type', 'claims', 'regulation')) | What aspect this tag describes |
| tag_value | TEXT | NOT NULL | The tag itself: 'protein_powder', 'contract_manufacturer', 'structure_function_claims', '21_cfr_111' |
| confidence | REAL | | 0-1 |
| signal_source | TEXT | NOT NULL, DEFAULT 'direct', CHECK (signal_source IN ('direct', 'cross_reference')) | Whether this tag was from LLM extraction (direct) or cross-reference inference (cross_reference) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_item_tags` UNIQUE(item_id, tag_dimension, tag_value)

**Indexes:**
- `idx_item_enrichment_tags_item` on (item_id)
- `idx_item_enrichment_tags_dimension_value` on (tag_dimension, tag_value)

**Design notes:**
- This table handles the "non-ingredient" dimensions of product matching. When a warning letter is about contract manufacturers who make protein powders, that's captured here as tag_dimension='product_type', tag_value='protein_powder' and tag_dimension='facility_type', tag_value='contract_manufacturer'.
- Ingredients extracted from regulatory items go to `regulatory_item_substances` instead, because they need substance resolution.
- Together, `item_enrichment_tags` + `regulatory_item_substances` provide complete deep tagging of each regulatory item.
- `signal_source` marks tags from cross-reference inference (Step 1c) vs direct LLM extraction. Cross-reference adds `product_type` tags for newly inferred segments.

---

### `regulatory_item_substances`

Substances extracted from regulatory items. When a warning letter mentions "whey protein isolate" or a proposed rule addresses "titanium dioxide", those substances are captured here and resolved to the canonical `substances` table when possible.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| regulatory_item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| substance_id | UUID | FK --> substances | Nullable -- null if substance not yet resolved |
| raw_substance_name | TEXT | NOT NULL | Exactly as extracted from source text |
| unii | CHAR(10) | | If available in source data |
| cas_number | TEXT | | If available in source data |
| match_status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (match_status IN ('resolved', 'pending', 'unresolved')) | |
| extraction_method | TEXT | NOT NULL, CHECK (extraction_method IN ('structured_field', 'llm_extraction', 'manual')) | How we got this substance reference |
| confidence | REAL | | 0-1, confidence in the extraction (not the resolution) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_ris_item` on (regulatory_item_id)
- `idx_ris_substance` on (substance_id) WHERE substance_id IS NOT NULL
- `idx_ris_match_status` on (match_status) WHERE match_status = 'pending'
- `idx_ris_raw_name` on (raw_substance_name)

**Design notes:**
- `substance_id` is null when we extracted a substance mention but haven't resolved it to a canonical substance yet. The `match_status` tracks this: pending = not yet attempted, unresolved = attempted but no good match found.
- `extraction_method = 'structured_field'` means the substance came from a structured data source (e.g., openFDA enforcement product description, CFR reference to a specific chemical). `'llm_extraction'` means Gemini pulled it from free text.
- This is the ingredient dimension that was previously part of item_enrichment_tags. Splitting it out enables substance_id-based matching instead of string matching.

---

### `item_citations`

Links every AI-generated claim back to an exact source quote. Produced during enrichment. Enables "hover-to-verify" UI and cross-item citation queries.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| enrichment_id | UUID | FK --> item_enrichments ON DELETE CASCADE | Nullable. Set when citation supports a summary claim. |
| segment_impact_id | UUID | FK --> segment_impacts ON DELETE CASCADE | Nullable. Set when citation supports an impact assessment. |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | Denormalized for direct query access. |
| claim_text | TEXT | NOT NULL | The AI assertion from the summary or impact assessment |
| quote_text | TEXT | NOT NULL | Exact source text that supports the claim |
| source_section | TEXT | | Section of the source doc: "Background", "Regulatory Text" |
| source_url | TEXT | | Direct link to verify: FR page, FDA.gov, eCFR.gov |
| source_label | TEXT | | Human-readable: "91 FR 7825, Section: Background" |
| quote_verified | BOOLEAN | NOT NULL, DEFAULT false | True if quote_text was confirmed to exist in raw_content |
| confidence | REAL | | 0-1 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- CHECK (enrichment_id IS NOT NULL OR segment_impact_id IS NOT NULL) -- must reference at least one parent

**Indexes:**
- `idx_item_citations_enrichment` on (enrichment_id)
- `idx_item_citations_segment_impact` on (segment_impact_id)
- `idx_item_citations_item` on (item_id)

**How it works:**
1. Enrichment prompt tells Gemini: "For each claim, cite the exact source text. If you can't find supporting text, don't make the claim."
2. LLM response includes structured citations array alongside summary and impacts.
3. Pipeline parses citations, does a substring check (quote_text IN raw_content), sets quote_verified.
4. Unverified citations (LLM paraphrased or hallucinated the quote) are stored but flagged -- visible in UI as lower confidence.

---

## Layer 5: Search & Retrieval

### `item_chunks`

Sectioned content + vector embeddings for RAG-based AI search. Chunks carry metadata for hybrid retrieval (semantic + structured filtering).

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| segment_impact_id | UUID | FK --> segment_impacts ON DELETE CASCADE | Nullable. NULL = general chunk, set = segment-specific impact chunk. |
| chunk_index | INT | NOT NULL | Ordering within the item |
| section_title | TEXT | | 'Background', 'Proposed Changes', 'Dates', etc. |
| content | TEXT | NOT NULL | The chunk text |
| embedding | vector(1536) | | OpenAI text-embedding-3-small |
| token_count | INT | | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_item_chunks_item` on (item_id)
- `idx_item_chunks_segment_impact` on (segment_impact_id) WHERE segment_impact_id IS NOT NULL
- HNSW index on embedding: **DO NOT CREATE ON EMPTY TABLE.** Create after 1,000+ rows:
  ```sql
  CREATE INDEX CONCURRENTLY idx_item_chunks_embedding
    ON item_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
  ```

**Design notes:**
- Embedding dimension is vector(1536) for OpenAI text-embedding-3-small. Changing embedding models requires re-embedding the entire corpus.
- Segment-specific impact chunks get their own embeddings so "how does this affect cosmetics companies?" retrieves the cosmetics impact assessment, not the generic summary.
- pgvector extension required: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## Layer 6: Intelligence

### `item_relations`

Cross-references between regulatory items. Builds the "full story" view: a proposed rule links to its final rule, which links to related enforcement actions.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| source_item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| target_item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| relation_type | TEXT | NOT NULL, CHECK (relation_type IN ('supersedes', 'amends', 'references', 'responds_to', 'related_enforcement', 'follow_up')) | TEXT+CHECK instead of ENUM |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_item_relations` UNIQUE(source_item_id, target_item_id, relation_type)

**Indexes:**
- `idx_item_relations_source` on (source_item_id)
- `idx_item_relations_target` on (target_item_id)

---

### `enforcement_details`

Structured extension for enforcement-type items (warning letters, 483s, recalls). One-to-one with the parent regulatory_item. Captures the structured fields that only enforcement items have.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| item_id | UUID | NOT NULL, UNIQUE, FK --> regulatory_items ON DELETE CASCADE | One-to-one |
| company_name | TEXT | | |
| company_address | TEXT | | |
| products | JSONB | | ["Product A", "Product B"] |
| violation_types | TEXT[] | | ['cgmp', 'adulteration', 'misbranding'] |
| cited_regulations | TEXT[] | | ['21 CFR 111.70', '21 CFR 101.36'] |
| fei_number | TEXT | | FDA Establishment Identifier |
| marcs_cms_number | TEXT | | Warning letter identifier from FDA |
| recipient_name | TEXT | | Person the letter was addressed to |
| recipient_title | TEXT | | |
| response_received | BOOLEAN | | Whether FDA received a response |
| closeout | BOOLEAN | | Whether the matter has been closed |
| recall_classification | TEXT | CHECK (recall_classification IN ('Class I', 'Class II', 'Class III')) | Recall-specific |
| recall_status | TEXT | CHECK (recall_status IN ('Ongoing', 'Completed', 'Terminated')) | Recall-specific |
| voluntary_mandated | TEXT | | "Voluntary: Firm initiated" or "FDA Mandated" |
| distribution_pattern | TEXT | | Geographic distribution of recalled product |
| product_quantity | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_enforcement_company` on (company_name)
- `idx_enforcement_violation_types` GIN on (violation_types)
- `idx_enforcement_marcs` on (marcs_cms_number) WHERE marcs_cms_number IS NOT NULL
- `idx_enforcement_fei` on (fei_number) WHERE fei_number IS NOT NULL

---

### `trend_signals`

Nightly-computed rolling window aggregations per category. Recomputed, not appended.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| category_id | UUID | NOT NULL, FK --> regulatory_categories ON DELETE CASCADE | Points to a segment or topic |
| period_start | DATE | NOT NULL | |
| period_end | DATE | NOT NULL | |
| item_count | INT | NOT NULL | Items in this window |
| avg_relevance | REAL | | Numeric average of relevance levels (critical=5, high=4, medium=3, low=2, none=1) |
| prev_period_count | INT | | Prior window count for comparison |
| trend_direction | TEXT | NOT NULL, CHECK (trend_direction IN ('rising', 'stable', 'declining')) | |
| trend_summary | TEXT | | LLM-generated, grounded in actual counts |
| computed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- `uq_trend_signals` UNIQUE(category_id, period_start, period_end)

**Indexes:**
- `idx_trend_signals_category` on (category_id)
- `idx_trend_signals_direction` on (trend_direction) WHERE trend_direction = 'rising'

**Design notes:**
- This table is REBUILT, not appended to. Nightly job truncates and recomputes rolling 30/60/90 day windows.
- `category_id` replaces the old segment ENUM. Can now compute trends for segments, topics, or product classes.

---

## Layer 7: Subscriber Products

### `subscriber_products`

Products belonging to a subscriber. Populated from DSLD (supplements), FoodData Central (food), or manual entry (cosmetics). The system knows every ingredient in every product.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | UUID | NOT NULL, FK --> users ON DELETE CASCADE | |
| name | TEXT | NOT NULL | Product name as shown on label |
| brand | TEXT | | Brand name |
| product_type | TEXT | NOT NULL, CHECK (product_type IN ('supplement', 'food', 'cosmetic')) | |
| data_source | TEXT | NOT NULL, CHECK (data_source IN ('dsld', 'fdc', 'manual', 'openfoodfacts')) | Where product data came from |
| external_id | TEXT | | DSLD product ID, FDC fdcId, etc. |
| upc_barcode | TEXT | | UPC/EAN if available |
| label_image_url | TEXT | | Supabase Storage path for uploaded label photo |
| raw_ingredients_text | TEXT | | Full ingredients list as it appears on the label |
| product_metadata | JSONB | | Source-specific extra fields: DSLD dosage form, FDC brand owner, etc. |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete for removed products |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | moddatetime trigger |

**Indexes:**
- `idx_subscriber_products_user` on (user_id)
- `idx_subscriber_products_type` on (product_type)
- `idx_subscriber_products_external` on (data_source, external_id) WHERE external_id IS NOT NULL

**Design notes:**
- DSLD provides structured ingredients with amounts, UNII codes, and categories for 214K+ supplement products. Auto-populate is the primary onboarding path for supplements.
- FoodData Central provides ingredients (text), nutrition, and UPC barcodes for 454K+ branded food products.
- Cosmetics have no public product database. Manual entry (paste ingredients, upload label photo) is the only path.

---

### `product_ingredients`

Structured ingredients for each subscriber product. Each ingredient resolves to a canonical substance when possible. This is one half of the matching equation (the other half is `regulatory_item_substances`).

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | NOT NULL, FK --> subscriber_products ON DELETE CASCADE | |
| name | TEXT | NOT NULL | Ingredient name as shown on label |
| normalized_name | TEXT | | Cleaned/standardized name for fallback string matching |
| substance_id | UUID | FK --> substances | Nullable. Linked when resolved to canonical substance. |
| amount | TEXT | | "500 mg", "2%", etc. As stated on label. |
| unit | TEXT | | Separated unit if structured (from DSLD) |
| sort_order | INT | NOT NULL, DEFAULT 0 | Order as listed on label (first = highest concentration) |
| normalization_status | TEXT | NOT NULL, DEFAULT 'pending', CHECK (normalization_status IN ('matched', 'pending', 'ambiguous', 'unmatched')) | |
| normalization_confidence | REAL | | 0-1, confidence in the substance match |
| normalization_method | TEXT | CHECK (normalization_method IN ('unii_exact', 'cas_exact', 'name_exact', 'fuzzy', 'llm', 'manual')) | How was substance_id determined |
| source_metadata | JSONB | | DSLD-specific fields: ingredient_category, unii from DSLD, etc. |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_product_ingredients_product` on (product_id)
- `idx_product_ingredients_substance` on (substance_id) WHERE substance_id IS NOT NULL
- `idx_product_ingredients_normalized_name` on (normalized_name) WHERE normalized_name IS NOT NULL
- `idx_product_ingredients_status` on (normalization_status) WHERE normalization_status = 'pending'

**Design notes:**
- DSLD ingredients come with UNII codes pre-populated -- these resolve directly to substances via unii_exact match.
- FoodData Central ingredients are text-only -- need NLP/fuzzy matching to resolve.
- Cosmetic ingredients (manual entry) need the most processing: parse ingredient list text, normalize names, resolve to substances.
- `normalization_method` records HOW the match was made, enabling quality auditing and confidence calibration.

---

## Layer 8: Product Matching

### `product_matches`

THE money table. Each row represents a match between a regulatory item and a subscriber's product. This is the core of "the FDA just proposed banning BHA -- here are your 3 products that contain it."

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | NOT NULL, FK --> subscriber_products ON DELETE CASCADE | |
| regulatory_item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | |
| match_type | TEXT | NOT NULL, CHECK (match_type IN ('direct_substance', 'category_overlap', 'semantic')) | Primary match mechanism |
| match_method | TEXT | | Specific method within type: 'unii_exact', 'cas_exact', 'name_exact', 'fuzzy', 'llm' |
| confidence | REAL | NOT NULL | 0-1, composite confidence score |
| matched_substances | JSONB | | Array of {substance_id, substance_name, match_detail} for substance matches |
| matched_tags | JSONB | | Array of {dimension, value} for category_overlap matches |
| impact_summary | TEXT | | Product-specific: "Your Marine Collagen Powder is affected because..." |
| action_items | JSONB | | Product-specific action items with deadlines |
| is_dismissed | BOOLEAN | NOT NULL, DEFAULT false | Subscriber can dismiss false positives |
| reviewed_at | TIMESTAMPTZ | | When subscriber viewed this match |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | moddatetime trigger |

**Constraints:**
- `uq_product_matches` UNIQUE(product_id, regulatory_item_id)

**Indexes:**
- `idx_product_matches_product` on (product_id)
- `idx_product_matches_item` on (regulatory_item_id)
- `idx_product_matches_user_recent` on (product_id, created_at DESC) -- "what's new for my products?"
- `idx_product_matches_confidence` on (confidence DESC) WHERE is_dismissed = false

**Match confidence ladder:**

| match_type | match_method | Confidence Range | Description |
|-----------|-------------|-----------------|-------------|
| direct_substance | unii_exact | 0.95 - 1.0 | Same UNII code in item and product |
| direct_substance | cas_exact | 0.90 - 0.95 | Same CAS number |
| direct_substance | name_exact | 0.80 - 0.90 | Exact canonical name match |
| direct_substance | fuzzy | 0.60 - 0.80 | pg_trgm similarity match on names |
| direct_substance | llm | 0.70 - 0.85 | LLM determined substances are equivalent |
| category_overlap | (n/a) | 0.30 - 0.60 | Shared item_enrichment_tags (product_type, facility_type) |
| semantic | (n/a) | 0.20 - 0.50 | Embedding similarity between item and product context |

**Design notes:**
- Matching runs after enrichment completes for a new regulatory item.
- For each item, check all active subscriber products: first by substance overlap, then by tag overlap, then by semantic similarity.
- `matched_substances` JSONB preserves exactly which substances triggered the match for transparency in the email.
- `is_dismissed` lets subscribers suppress false positives without deleting the match record.
- `impact_summary` and `action_items` are generated per-product by Anthropic (claude-sonnet-4-6) -- this is the premium writing that makes the product intelligence email worth paying for.

---

## Layer 9: Users & Email

### `users`

Authenticated accounts managed by Supabase Auth. A user may or may not also be an email subscriber.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | Matches Supabase auth.users.id |
| email | TEXT | UNIQUE, NOT NULL | |
| name | TEXT | | |
| stripe_customer_id | TEXT | UNIQUE | |
| access_level | TEXT | NOT NULL, DEFAULT 'monitor', CHECK (access_level IN ('free', 'monitor', 'monitor_research')) | Determines feature access |
| max_products | INT | NOT NULL, DEFAULT 1 | Product limit for current plan. Free=1, Monitor base=5, scales with billing. |
| trial_ends_at | TIMESTAMPTZ | | Null if no active trial or trial expired |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | moddatetime trigger |

**Indexes:**
- `idx_users_email` on (email)
- `idx_users_stripe` on (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL
- `idx_users_access_level` on (access_level)

**Design notes:**
- `id` is the same UUID as Supabase auth.users.id. Do NOT use gen_random_uuid() -- this is set by Supabase Auth on signup.
- `access_level` replaces the old subscription_tier. Maps to pricing: free = post-trial free tier (1 product), monitor = $49/mo base, monitor_research = $249/mo base.
- `max_products` is updated by Stripe webhook when billing changes. The app checks this before allowing product creation.
- No segments column on users. Segments are derived from the subscriber's products (a user with supplement products gets supplement intelligence).

---

### `email_subscribers`

The subscriber list. Independent of `users` -- free subscribers sign up with just an email before creating an account. Lower friction than account creation.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| email | TEXT | UNIQUE, NOT NULL | |
| user_id | UUID | FK --> users | Nullable. Linked when subscriber creates account or upgrades to paid. |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')) | Email provider webhooks update this. |
| unsubscribe_token | TEXT | UNIQUE, NOT NULL | For one-click unsubscribe (CAN-SPAM / GDPR) |
| source | TEXT | CHECK (source IN ('signup_form', 'stripe', 'manual', 'referral')) | Acquisition tracking |
| subscribed_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| unsubscribed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_email_subscribers_email` on (email)
- `idx_email_subscribers_user` on (user_id) WHERE user_id IS NOT NULL
- `idx_email_subscribers_status` on (status)
- `idx_email_subscribers_token` on (unsubscribe_token)

**Design notes:**
- No tier or segments columns on email_subscribers. Tier comes from users.access_level (or 'free' if no linked user). Segments come from the user's products.
- This keeps the subscriber list simple: it's about email delivery, not access control.

---

### `user_bookmarks`

Saved regulatory items for a user.

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | NOT NULL, FK --> users ON DELETE CASCADE | Composite PK |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | Composite PK |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Constraints:**
- PRIMARY KEY (user_id, item_id)

---

### `email_campaigns`

Each digest or alert that gets assembled and sent. Supports both generic campaigns (free weekly update, same for everyone) and per-subscriber personalized campaigns (paid product intelligence email, unique per subscriber).

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| campaign_type | TEXT | NOT NULL, CHECK (campaign_type IN ('weekly_free', 'weekly_paid', 'product_alert', 'urgent_alert')) | |
| subscriber_id | UUID | FK --> email_subscribers | Nullable. NULL for generic campaigns (weekly_free). Set for per-subscriber campaigns. |
| subject_line | TEXT | NOT NULL | Email subject line as sent |
| period_start | DATE | | Start of the period covered (for digests) |
| period_end | DATE | | End of the period covered |
| html_content | TEXT | | Compiled HTML as sent. Stored for debugging/replay. |
| recipient_count | INT | DEFAULT 0 | How many subscribers received this campaign |
| status | TEXT | NOT NULL, DEFAULT 'draft', CHECK (status IN ('draft', 'generating', 'sending', 'sent', 'failed')) | |
| sent_at | TIMESTAMPTZ | | When sending completed |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_email_campaigns_type` on (campaign_type)
- `idx_email_campaigns_subscriber` on (subscriber_id) WHERE subscriber_id IS NOT NULL
- `idx_email_campaigns_sent` on (sent_at DESC)
- `idx_email_campaigns_status` on (status)

**Design notes:**
- `weekly_free` = generic weekly update, same for all free subscribers. One campaign row, many email_sends.
- `weekly_paid` = per-subscriber weekly digest with product intelligence. One campaign row per subscriber per week.
- `product_alert` = event-driven per-subscriber alert when a new match is found. One campaign row per subscriber per triggering event.
- `urgent_alert` = cross-subscriber alert for critical items (recall, emergency rule). One campaign row, many sends.
- `subscriber_id` being nullable allows generic campaigns to exist as a single row rather than duplicating per subscriber.

---

### `email_campaign_items`

Junction table: which regulatory items were included in each campaign. Traceability link for "which intelligence was in this email?"

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| campaign_id | UUID | NOT NULL, FK --> email_campaigns ON DELETE CASCADE | Composite PK |
| item_id | UUID | NOT NULL, FK --> regulatory_items ON DELETE CASCADE | Composite PK |
| position | INT | NOT NULL | Order in the email (top story = 1) |
| content_level | TEXT | NOT NULL, CHECK (content_level IN ('headline', 'summary', 'full_analysis')) | What depth was included |

**Constraints:**
- PRIMARY KEY (campaign_id, item_id)

---

### `email_sends`

Individual dispatch records. One row per subscriber per campaign. The support table for "Why didn't I get that alert?"

**Status:** New

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| campaign_id | UUID | NOT NULL, FK --> email_campaigns ON DELETE CASCADE | |
| subscriber_id | UUID | NOT NULL, FK --> email_subscribers ON DELETE CASCADE | |
| provider_message_id | TEXT | | Resend/Postmark message ID for tracking |
| status | TEXT | NOT NULL, DEFAULT 'queued', CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')) | Updated by provider webhooks |
| sent_at | TIMESTAMPTZ | | |
| delivered_at | TIMESTAMPTZ | | |
| opened_at | TIMESTAMPTZ | | |
| clicked_at | TIMESTAMPTZ | | |
| bounce_type | TEXT | CHECK (bounce_type IN ('hard', 'soft')) | Hard bounces auto-update subscriber status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes:**
- `idx_email_sends_campaign` on (campaign_id)
- `idx_email_sends_subscriber` on (subscriber_id)
- `idx_email_sends_status` on (status)
- `idx_email_sends_subscriber_recent` on (subscriber_id, sent_at DESC)

**Webhook flow:**
1. Compile a campaign --> insert `email_campaigns` + `email_campaign_items`
2. For each active subscriber matching criteria --> insert `email_sends` with status 'queued'
3. Send via Resend/Postmark --> update status to 'sent', store `provider_message_id`
4. Provider webhooks fire --> update `delivered_at`, `opened_at`, `clicked_at`, `status`
5. Hard bounces --> update `email_sends.status` = 'bounced' AND `email_subscribers.status` = 'bounced'

---

## Matching Pipeline: End-to-End

### Step 1: Ingest

Source API (Federal Register, openFDA, etc.) --> `regulatory_items` with raw_content preserved verbatim. `pipeline_runs` logs the execution. Deduplication via UNIQUE(source_id, source_ref).

### Step 2: Classify

LLM reads title + raw_content and assigns categories:
- Segments: supplements, cosmetics, food (via `item_categories` junction to `regulatory_categories`)
- Topics: identity-testing, facility-registration, cgmp-violations, etc.
- Product classes: botanical-supplements, protein-powders, color-additives, etc.

Cross-cutting items get multiple segment assignments. A color additive rule might get tagged supplements + cosmetics + food.

### Step 3: Extract Substances

Two extraction paths run in parallel:
- **Structured extraction:** If source has structured substance data (openFDA product descriptions, CFR chemical references), parse directly. Set `extraction_method = 'structured_field'`.
- **LLM extraction:** Gemini reads raw_content and extracts all mentioned substances. Set `extraction_method = 'llm_extraction'`.

Results go to `regulatory_item_substances` with `match_status = 'pending'`.

### Step 4: Resolve Substances

For each pending `regulatory_item_substances` row:
1. If UNII is present: look up `substances.unii`. Exact match = resolved.
2. If CAS number is present: look up `substances.cas_number`. Exact match = resolved.
3. Exact name match: look up `substance_names.name` for exact match.
4. Fuzzy match: use pg_trgm similarity on `substance_names.name`. Accept if similarity >= 0.6.
5. LLM match: if fuzzy fails, ask Gemini "Is [raw_name] the same substance as [candidate]?"
6. If nothing works: set `match_status = 'unresolved'`. These get queued for manual review.

Update `substance_id` and `match_status` accordingly.

### Step 5: Enrich

LLM generates:
- `item_enrichments`: summary, key_regulations, key_entities
- `segment_impacts`: per-segment relevance + impact assessment + action items
- `item_enrichment_tags`: product_type, facility_type, claims, regulation dimensions
- `item_citations`: every claim linked to a source quote, verified against raw_content

### Step 6: Embed

Chunk the content by section (Background, Proposed Changes, Dates, Regulatory Text, etc.). Generate vector(1536) embeddings via OpenAI text-embedding-3-small. Store in `item_chunks`. Also embed segment-specific impact summaries as their own chunks.

### Step 7: Match Products

For each new regulatory item, check against all active subscriber products:

**7a. Substance matching (highest signal):**
```sql
-- Find products with overlapping substances
SELECT sp.id AS product_id, pi.substance_id, pi.name AS ingredient_name
FROM subscriber_products sp
JOIN product_ingredients pi ON pi.product_id = sp.id
JOIN regulatory_item_substances ris ON ris.substance_id = pi.substance_id
WHERE ris.regulatory_item_id = :new_item_id
  AND ris.match_status = 'resolved'
  AND pi.substance_id IS NOT NULL
  AND sp.is_active = true;
```

**7b. Fallback name matching (for unresolved substances):**
```sql
-- String match on normalized names when substance_id isn't available
SELECT sp.id AS product_id, pi.normalized_name
FROM subscriber_products sp
JOIN product_ingredients pi ON pi.product_id = sp.id
JOIN regulatory_item_substances ris
  ON LOWER(ris.raw_substance_name) = LOWER(pi.normalized_name)
WHERE ris.regulatory_item_id = :new_item_id
  AND ris.match_status = 'unresolved'
  AND sp.is_active = true;
```

**7c. Category overlap (lower signal):**
Compare `item_enrichment_tags` against product attributes (product_type, any relevant dimensions).

**7d. Semantic matching (lowest signal):**
Embed the product's ingredient profile and compare against `item_chunks` embeddings.

### Step 8: Score and Store

Combine signals using the confidence ladder. Insert into `product_matches` with:
- `match_type`: highest-signal match mechanism that fired
- `confidence`: weighted composite score
- `matched_substances`: JSONB with the specific substances that triggered the match
- `matched_tags`: JSONB with any category overlaps

### Step 9: Generate Intelligence

For matches above confidence threshold:
- Anthropic (claude-sonnet-4-6) generates product-specific `impact_summary` and `action_items`
- These are stored on the `product_matches` row

### Step 10: Deliver

- **Product alert (event-driven):** If a new match has confidence >= threshold, create a per-subscriber `email_campaigns` row with type 'product_alert'. Include the matched item + product-specific analysis.
- **Weekly paid digest:** Aggregate the week's matches per subscriber into a `weekly_paid` campaign.
- **Weekly free update:** Generic campaign for all free subscribers with headlines + summaries from the week's most significant items.

---

## Key Design Decisions

### 1. Flexible Categories Over Hardcoded ENUMs

**Decision:** `regulatory_categories` lookup table with `category_type` dimension, connected via `item_categories` junction table. Replaces segment ENUMs and the separate topics table.

**Rationale:** Cross-cutting regulations are the norm at FDA. A color additive rule affects food, cosmetics, drugs, and devices simultaneously. Hardcoded ENUMs require migrations to add new segments. A lookup table lets us add "pet_food" or "hemp_cbd" by inserting a row, not altering columns. Topics and product classes use the same infrastructure, reducing schema complexity.

**Trade-off:** Slightly more complex queries (JOIN through junction table instead of WHERE segment = 'supplements'). Mitigated by the composite feed index on segment_impacts.

### 2. Substances Layer for Ingredient Matching

**Decision:** Canonical `substances` table bootstrapped from FDA GSRS, with `substance_names` for synonym resolution and pg_trgm fuzzy matching. Both regulatory items and subscriber products resolve to the same substance records.

**Rationale:** Ingredients are the common denominator between "what the FDA is doing" and "what a subscriber sells." Without canonical substance resolution, matching devolves to brittle string comparison. GSRS provides 169K substances with UNII codes, CAS numbers, and multiple names per substance. The confidence ladder (UNII > CAS > name_exact > fuzzy > LLM) gives graduated certainty.

**Trade-off:** Upfront investment in GSRS import and substance resolution pipeline. Worth it because substance matching is the core value proposition.

### 3. Separate Substance Extraction from Tag Enrichment

**Decision:** `regulatory_item_substances` handles ingredient extraction from regulatory items. `item_enrichment_tags` handles non-ingredient dimensions (product_type, facility_type, claims, regulation).

**Rationale:** Ingredients need substance resolution (FK to substances table, UNII/CAS matching). Non-ingredient tags are simple key-value pairs. Combining them in one table would either over-complicate tags or under-serve substance resolution.

### 4. Jurisdiction as a Dimension, Not a Separate Pipeline

**Decision:** `jurisdiction` ('federal'/'state') and `jurisdiction_state` columns on `regulatory_items`. State items flow through the same enrichment pipeline.

**Rationale:** States adopt federal CFR by reference. There is no parallel state classification system. A state ban on Red No. 3 references the same CFR parts as the federal rule. Same enrichment, same matching, same delivery -- just tagged with the state of origin. No need for separate tables or pipelines.

### 5. TEXT + CHECK Instead of ENUM Everywhere

**Decision:** All typed columns use TEXT with CHECK constraints, never PostgreSQL ENUM types.

**Rationale:** Altering ENUMs in PostgreSQL requires `ALTER TYPE ... ADD VALUE` which cannot run inside a transaction and is irreversible (you can't remove values). TEXT + CHECK constraints can be modified with a simple `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT`. For a solo developer iterating on an MVP, this flexibility matters more than the marginal storage savings of ENUMs.

### 6. Denormalized published_date on segment_impacts

**Decision:** `segment_impacts.published_date` is copied from `regulatory_items.published_date`.

**Rationale:** The feed query ("show me all critical+high items for supplements, newest first") is the hottest path in the system. With denormalized `published_date`, this is a single-table index scan on `(category_id, relevance, published_date DESC)`. Without it, every feed query requires a JOIN to regulatory_items just to sort. The duplication cost is one DATE column; the query cost savings are on every page load.

### 7. Per-Subscriber Email Campaigns

**Decision:** `email_campaigns.subscriber_id` is nullable. Generic campaigns (weekly free) have NULL subscriber_id. Personalized campaigns (product intelligence) have a specific subscriber_id.

**Rationale:** The product intelligence email is unique per subscriber -- it references THEIR products, THEIR matches, THEIR action items. Storing this as a campaign-per-subscriber (rather than one campaign with per-subscriber templates) means the exact email content is preserved for debugging and support. "What did we send Jane last Tuesday?" is a simple query.

### 8. No Segments on Users or Email Subscribers

**Decision:** Users and email_subscribers have no segments column. Segments are derived from the user's products.

**Rationale:** Subscribers don't think in segments. They think in products. A subscriber with 3 supplement products and 2 cosmetic products is implicitly subscribed to both segments. Deriving segments from products means there's no state to synchronize when products are added or removed.

---

## Expansion Path

### Deferred to State Compliance Phase (Month 3-5)

These tables will be added when the state compliance layer is built. No schema changes to existing tables are needed -- state regulatory items already flow through the existing pipeline via `jurisdiction = 'state'`.

- **`chemicals`** -- reference table for tracked chemicals (Prop 65 list, state ban legislation). Similar to `substances` but focused on regulatory status rather than ingredient identity.
- **`state_chemical_bans`** -- compliance matrix: which chemicals are banned/restricted in which states for which product types. The "is my product legal in California?" query.
- **`cosmetic_chemical_reports`** -- CA Safe Cosmetics Program (CSCP) data. Products with reported harmful chemicals.

### Deferred to Adverse Events Phase (Post-MVP)

- **`adverse_event_reports`** -- one row per CAERS report. Consumer/practitioner reports with outcomes and reactions.
- **`adverse_event_products`** -- products cited in each report. Each has its own segment classification via FDA industry codes.
- These tables feed trend detection but don't appear individually in the feed. Patterns surface as `trend_signals`.

### Future Segment Expansion

Adding new segments (pet food, hemp/CBD) requires:
1. INSERT a new row in `regulatory_categories` with `category_type = 'segment'`.
2. Update enrichment prompts to recognize the new segment.
3. No migrations. No schema changes. The junction table architecture handles it.

---

## Row-Level Security (RLS) Policies

Supabase RLS policies for client-side access. All content tables are public-read. User-specific tables are restricted to the owning user.

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own row
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Subscriber products: user can CRUD their own products
CREATE POLICY products_select ON subscriber_products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY products_insert ON subscriber_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY products_update ON subscriber_products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY products_delete ON subscriber_products
  FOR DELETE USING (auth.uid() = user_id);

-- Product ingredients: access follows product ownership
CREATE POLICY ingredients_select ON product_ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );
CREATE POLICY ingredients_insert ON product_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );
CREATE POLICY ingredients_update ON product_ingredients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );
CREATE POLICY ingredients_delete ON product_ingredients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );

-- Product matches: access follows product ownership
CREATE POLICY matches_select ON product_matches
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );
CREATE POLICY matches_update ON product_matches
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM subscriber_products sp WHERE sp.id = product_id AND sp.user_id = auth.uid())
  );

-- User bookmarks: user can CRUD their own bookmarks
CREATE POLICY bookmarks_select ON user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bookmarks_insert ON user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bookmarks_delete ON user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Email subscribers: user can read their own subscription
CREATE POLICY subscribers_select ON email_subscribers
  FOR SELECT USING (auth.uid() = user_id);

-- Public-read content tables (no RLS needed for reads, but pipeline writes use service role key)
-- These tables don't need RLS enabled because they're read by everyone:
--   regulatory_items, item_enrichments, segment_impacts, item_citations,
--   item_enrichment_tags, regulatory_item_substances, item_chunks,
--   item_relations, enforcement_details, trend_signals,
--   regulatory_categories, item_categories, sources, pipeline_runs,
--   substances, substance_names
-- The service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS for pipeline writes.
```

**Important:** Public-read tables should NOT have RLS enabled (it adds unnecessary query overhead). The service role key is used for all pipeline writes and bypasses RLS entirely.

---

## Supabase-Specific Notes

### Required Extensions

```sql
-- Vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Fuzzy text matching for substance name resolution
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Auto-update updated_at columns
CREATE EXTENSION IF NOT EXISTS moddatetime;
```

### moddatetime Triggers

Apply to all tables with `updated_at` columns:

```sql
CREATE TRIGGER set_updated_at_regulatory_items
  BEFORE UPDATE ON regulatory_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_substances
  BEFORE UPDATE ON substances
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_subscriber_products
  BEFORE UPDATE ON subscriber_products
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_product_matches
  BEFORE UPDATE ON product_matches
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### pgvector Notes

- Embedding dimension: vector(1536) for OpenAI text-embedding-3-small.
- **HNSW index timing:** Do NOT create on an empty table. It will have poor quality. Create the index after inserting 1,000+ rows using `CREATE INDEX CONCURRENTLY`.
- HNSW parameters: `m = 16, ef_construction = 64` is a good starting point. Increase ef_construction for better recall at the cost of index build time.
- Query with: `ORDER BY embedding <=> :query_embedding LIMIT 10` for cosine distance.

### Supabase Storage

- Used for subscriber-uploaded label images (`subscriber_products.label_image_url`).
- Create a `label-images` bucket with public read access.
- Path convention: `label-images/{user_id}/{product_id}/{filename}`

### Supabase Free Tier Constraints

- 500MB database. Estimated MVP data load is 250-350MB before GSRS import.
- GSRS import (169K substances + names) will likely push past 500MB. Budget for Supabase Pro ($25/mo) from day one.
- Connection limit: 60 direct connections on free tier. Use connection pooling (Supavisor) via the pooler URL for pipeline scripts.

---

## Bootstrapping Notes

### 1. GSRS Import (Substances + Names + Codes)

Source: https://gsrs.ncats.nih.gov/ (public API, paginated)

Import script: `scripts/bootstrap-gsrs.ts` (run via `npx tsx scripts/bootstrap-gsrs.ts`)

Import process:
1. Paginate GSRS API (500/page, ~169K substances)
2. For each substance: extract canonical_name, UNII, CAS, substance_class → upsert into `substances`
3. Extract all names/synonyms → upsert into `substance_names` with name_type and source='gsrs'
4. Extract relevant codes (10 code systems) → upsert into `substance_codes` with code_system, code_value, code_type, is_classification, comments
5. Checkpoint file (`.gsrs-checkpoint`) enables resume on interruption
6. Estimated row counts: ~169K substances, ~500K-1M substance_names, ~500K-850K substance_codes

This is a one-time bulk import with monthly refresh (Phase 2C). Run before any product onboarding so DSLD ingredients can resolve immediately and cross-reference inference has data.

### 2. Regulatory Categories Seed Data

Insert the segment, topic, and product_class seed rows listed in the `regulatory_categories` table definition above. This is configuration data, not bulk import -- a small migration script.

### 3. Sources Seed Data

```sql
INSERT INTO sources (name, source_type, base_url) VALUES
  ('federal_register', 'api', 'https://www.federalregister.gov/api/v1'),
  ('openfda_enforcement', 'api', 'https://api.fda.gov/food/enforcement.json'),
  ('openfda_drug_enforcement', 'api', 'https://api.fda.gov/drug/enforcement.json'),
  ('fda_warning_letters', 'scrape', 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters'),
  ('fda_rss_recalls', 'rss', 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml'),
  ('fda_rss_press', 'rss', 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml'),
  ('dsld', 'api', 'https://api.ods.od.nih.gov/dsld/v9'),
  ('fdc', 'api', 'https://api.nal.usda.gov/fdc/v1');
```

---

## Query Patterns

| Use Case | How It Works |
|----------|-------------|
| **Feed (free)** | `segment_impacts` WHERE category_id = :segment AND relevance IN ('critical','high','medium') ORDER BY published_date DESC. Single-table index scan. |
| **Item detail** | `regulatory_items` + `item_enrichments` + `segment_impacts` (user's segments) + `item_citations` + `item_relations` for full context. |
| **My products affected** | `product_matches` WHERE product_id IN (user's products) AND is_dismissed = false ORDER BY created_at DESC. The personalized feed. |
| **Match detail** | `product_matches` + `regulatory_items` + matched_substances JSONB + `item_citations`. "Why was my product flagged?" |
| **Trend detection** | `trend_signals` WHERE category_id = :segment AND trend_direction = 'rising'. |
| **Enforcement patterns** | `enforcement_details` JOIN `item_categories` GROUP BY violation_types. |
| **AI search** | Embed query --> pgvector cosine similarity on `item_chunks` + filter by category/date --> pass chunks to LLM with citation-required prompt. |
| **Substance search** | `substance_names` WHERE name % :query (trigram) or to_tsvector @@ plainto_tsquery (full-text) --> substances --> regulatory_item_substances --> regulatory_items. "Show me everything about titanium dioxide." |
| **Pipeline health** | `pipeline_runs` WHERE source_id = :source ORDER BY started_at DESC. |
| **Email debug** | `email_sends` WHERE subscriber_id = :sub ORDER BY sent_at DESC --> delivery status, bounce info. |
| **Campaign contents** | `email_campaign_items` JOIN `regulatory_items` WHERE campaign_id = :id ORDER BY position. |
| **Citation verification** | `item_citations` WHERE enrichment_id = :id --> quote_text, source_url, quote_verified. Hover-to-verify in UI. |
| **Cross-citation search** | `item_citations` JOIN `regulatory_items` WHERE quote_text ILIKE '%identity testing%'. "Where has FDA mentioned this?" |

---

## Open Questions

1. **GSRS import format:** JSON dump vs SDF vs API pagination? Need to evaluate which format is easiest to parse and most complete for our needs (names, UNII, CAS, classification).
2. **Substance resolution batch vs real-time:** Should substance resolution run as a batch job after ingest, or inline during enrichment? Batch is simpler but adds latency to matching.
3. **Match confidence thresholds:** What minimum confidence triggers a product_alert email? Too low = noise. Too high = missed matches. Needs tuning with real data.
4. **Product intelligence generation cost:** claude-sonnet-4-6 generating per-product impact summaries and action items for every match could get expensive at scale. Need to monitor costs and consider batching or caching strategies.
5. **GSRS refresh cadence:** How often to re-import GSRS for new substances? Monthly? Quarterly? FDA adds ~500-1000 new substances per year.
6. **Email provider:** Resend vs Postmark. Both support webhooks. Resend is simpler (React Email templates). Postmark has better deliverability reputation. Decide before building email pipeline.
7. **Chunk sizing strategy:** Section-based chunking for regulatory docs. FR API provides HTML, XML, and raw text. Which format to chunk? What maximum chunk size?
8. **FR API backfill strategy:** 10K result cap means date-range windowing. What window size? How far back?
9. **Enrichment model routing:** Which items get gemini-2.5-flash vs gemini-2.5-pro? Simple heuristic (by item_type) or complexity scoring?

---

## Table Summary

| # | Table | Layer | Purpose |
|---|-------|-------|---------|
| 1 | sources | Source Data | Data pipeline registry |
| 2 | pipeline_runs | Source Data | Pipeline execution log |
| 3 | regulatory_items | Source Data | Core regulatory data entity |
| 4 | regulatory_categories | Classification | Segments, topics, product classes (flexible lookup) |
| 5 | item_categories | Classification | Many-to-many item-to-category junction |
| 6 | substances | Substance Reference | Canonical substances (GSRS-bootstrapped) |
| 7 | substance_names | Substance Reference | Synonym resolution with fuzzy search |
| 7b | substance_codes | Substance Reference | GSRS use-context codes for cross-reference inference |
| 8 | item_enrichments | Enrichment | LLM summaries, key entities, key regulations |
| 9 | segment_impacts | Enrichment | Per-category relevance scoring (feed + trends) |
| 10 | item_enrichment_tags | Enrichment | Deep tagging: product_type, facility_type, claims, regulation |
| 11 | regulatory_item_substances | Enrichment | Extracted substances per regulatory item |
| 12 | item_citations | Enrichment | Source quotes for every AI claim |
| 13 | item_chunks | Search & Retrieval | Sectioned content + vector(1536) embeddings |
| 14 | item_relations | Intelligence | Cross-references between regulatory items |
| 15 | enforcement_details | Intelligence | Structured extension for enforcement items |
| 16 | trend_signals | Intelligence | Nightly-computed rolling window aggregations |
| 17 | subscriber_products | Subscriber Products | Products from DSLD/FDC/manual entry |
| 18 | product_ingredients | Subscriber Products | Structured ingredients with substance resolution |
| 19 | product_matches | Product Matching | THE money table: regulatory item x product |
| 20 | users | Users & Email | Authenticated accounts (Supabase Auth) |
| 21 | email_subscribers | Users & Email | Email subscriber list (independent of users) |
| 22 | user_bookmarks | Users & Email | Saved regulatory items |
| 23 | email_campaigns | Users & Email | Digest/alert assembly (generic + per-subscriber) |
| 24 | email_campaign_items | Users & Email | Items included in each campaign |
| 25 | email_sends | Users & Email | Individual dispatch records with delivery tracking |
| 26 | blog_posts | Blog (standalone) | Clawdbot-authored posts, public read for published, upsert on slug |
