---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active Reference
---

# Data Validation: Real API & Page Inspection Results

Research conducted 2026-03-03 by hitting actual APIs and inspecting real FDA pages.
This validates/corrects assumptions made from API documentation alone.

---

## 1. Federal Register API — Real Data Findings

### Key Findings
- **List endpoint returns stripped-down results.** Only ~8 fields per document. Must fetch each document individually for `cfr_references`, `docket_ids`, `topics`, `effective_on`, `action`, `comments_close_on`.
- **`topics` field is UNRELIABLE.** Empty on 2 of 3 documents tested. Cannot use for classification.
- **Abstracts are excellent.** 50-200 words, consistently populated, loaded with segment-classifiable keywords. Title + abstract is sufficient for LLM classification.
- **CFR references help when present.** 21 CFR Part 730 = cosmetics, Parts 170-189 = food, Parts 300-399 = drugs. Only on Rules/Proposed Rules, not Notices.
- **Pagination capped at 10,000 results / 50 pages.** Need date-range windowing for backfill.
- **Three full-text formats available.** HTML, XML, raw text URLs per document.
- **Page views available** (`page_views.count`) — useful significance signal.
- **Most FDA documents are Notices** (~5,000+), not Rules (3,593) or Proposed Rules (1,384). Need smart filtering.
- **`action` field is detail-only** but very useful: "Final rule.", "Proposed rule; withdrawal.", "Notice of availability"
- **`significant` field:** true/false for Rules/Proposed Rules, null for Notices. `regulation_id_number_info` has `priority_category` for more granularity.

### Pipeline Implication
Ingestion pattern: date-windowed list query → collect document_numbers → individual document fetches for full metadata → LLM enrichment from title + abstract + raw_text.

---

## 2. openFDA API — Real Data Findings

### Food Enforcement (Recalls)
- **Total records:** 28,449 (as of 2026-02-25)
- **`openfda` harmonized fields are ALWAYS EMPTY** on food enforcement. Zero enrichment.
- **`product_type` is always "Food"** — even for supplement recalls. No structured segment field.
- **Supplement classification requires text search** on `product_description`: keywords like "dietary supplement", "capsule", "tablet", "vitamin"
- **No cosmetics enforcement data** in this endpoint at all
- **Date format:** `YYYYMMDD` strings, not ISO

### CAERS Adverse Events (food/event)
- **Total records:** 148,459 (as of 2026-02-11)
- **GOLDEN CLASSIFICATION FIELD:** `products.industry_code` + `products.industry_name`
  - Code `54` = Supplements (53,636 records)
  - Code `53` = Cosmetics (52,210 records)
  - Everything else = Food (with ~30 subcategory codes)
- **Multi-product reports are common.** Single report can reference supplement + cosmetic + food products.
- **Each product has a `role`:** SUSPECT or CONCOMITANT
- **No `openfda` object** on this endpoint
- **No company/manufacturer field** — only `name_brand` in products array
- **Pagination ceiling:** skip maxes at 25,000. Need date-range windowing for full ingestion.

### Drug/Device Enforcement
- **Drug:** 17,416 records. `openfda` inconsistently populated (empty 2 of 3 tested).
- **Device:** 38,292 records. `openfda` empty in all tested. Minimal cosmetics relevance.

### Key Takeaway
CAERS is the richest single data source for our three segments. Enforcement data needs text-based LLM classification for segments.

---

## 3. FDA Pages — Scraping Inspection Results

### Warning Letters — EASY
- **Undocumented AJAX JSON endpoint** discovered:
  ```
  GET /datatables/views/ajax?view_name=warning_letter_solr_index&view_display_id=warning_letter_solr_block&start=0&length=100
  ```
- Returns DataTables JSON, 3,313 total records
- Fields per record: posted_date, issue_date, company_name (with URL to full letter), issuing_office, subject/violation, response_letter, closeout_letter
- **No authentication required**
- Individual letter pages have: recipient, company, address, MARCS-CMS number, date, issuing office, product category, structured HTML body with numbered sections

### Guidance Documents — HARDEST (but solvable, build last)
- Drupal CMS with DataTables over Solr
- JSON endpoint returns 503 without Drupal session context
- Needs Playwright with session cookie replay
- Rich filter taxonomy: 9 product categories (including Cosmetics, Dietary Supplements, Food & Beverages), 55+ topics, draft/final status, comment periods
- Plan for it, build last

### Import Alerts — EASY
- Static HTML, 157 total alerts
- Segment tagging by alert number prefix: 54-xx = supplements (11 alerts), 53-xx = cosmetics (3 alerts), rest = food (95+)
- Individual alert pages have metadata + Red/Green lists of firms
- Firm data is **unstructured text** (not proper HTML tables) — needs regex parsing

### FDA Data Dashboard — PROPER API (needs credentials)
- **4 POST endpoints:** inspections_classifications, inspections_citations, compliance_actions, import_refusals
- Base URL: `https://api-datadashboard.fda.gov/v1/`
- Well-documented with OpenAPI spec
- **Requires emailing `FDADataDashboard@fda.hhs.gov` for API credentials**
- Has `ProductType` field that includes "Food/Cosmetics" as a category
- **Unauthenticated Excel downloads available:** `InspectionsDataset.xlsx`, `CitationsDataset.xlsx`
- Non-standard HTTP: 400 = success

---

## 4. State Regulatory Data — Research Results

### Tier 1: MVP (easy ingestion, high value)

**Prop 65 Chemical List**
- ~900 chemicals, CSV download, fields: chemical name, CAS number, toxicity type, listing mechanism, date listed, safe harbor levels
- Update: at least annually, additions throughout year via notices
- CSV URL: `https://oehha.ca.gov/sites/default/files/media/2025-01/p65chemicalslist.csv`

**CA Safe Cosmetics Program (CSCP)**
- Daily-updated database of cosmetic products with reported harmful chemicals
- Free CSV download from CA Open Data portal
- Fields: product name, brand, company, product category, CAS numbers, chemical names, reporting dates
- Direct CSV: `https://data.chhs.ca.gov/dataset/596b5eed-31de-4fd8-a645-249f3f9b19c4/resource/57da6c9a-41a7-44b0-ab8d-815ff2cd5913/download/cscpopendata.csv`

**State Food Additive Bans**
- 10+ states have enacted bans on "standard 11" chemicals (Red 3, Red 40, Yellow 5, Yellow 6, BVO, titanium dioxide, etc.)
- Staggered effective dates 2025-2028
- No centralized database exists — manual curation required, major differentiator opportunity
- Key states: CA, WV, AZ, DE, LA, TN, TX, UT, VA (and growing)

**State PFAS Bans (Cosmetics)**
- 15+ states banning PFAS in cosmetics, effective dates 2025-2028
- Key states: CA, CO, MD, MN, WA, CT, VT, IL, ME, OR, NH, RI, NJ, NM
- No centralized database — same manual curation opportunity

### Tier 2: Post-MVP
- Prop 65 60-day notices (AG database scraping)
- Prop 65 settlements (PDF parsing)
- State AG enforcement actions (multiple AG sites)
- FL inspection data

### Key Insight
No centralized state regulatory database exists anywhere. Building one is a defensible competitive advantage.

---

## 5. Schema Impact Summary

These findings require the following schema changes:

1. **Adverse events need their own tables** — report-based with multiple products per report, each with segment classification. Different shape from regulatory_items.
2. **State regulations need a compliance matrix** — chemical × state × product type × effective date. Not a feed of events.
3. **Warning letter metadata** — MARCS-CMS numbers, recipient info, response/closeout status need fields.
4. **Guidance documents** — planned for, product category taxonomy available, build pipeline last.
5. **Chemical reference data** — Prop 65 list, CSCP chemicals, banned substances need their own tables.
6. **Import alerts** — alert-level metadata + per-firm detention lists (Red/Green lists).
