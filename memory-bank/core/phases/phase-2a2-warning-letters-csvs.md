# Phase 2A-2: Warning Letters + Chemical CSVs

**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 1
**Purpose:** Build fetchers for FDA warning letters (AJAX scraping), FDA RSS feeds, Prop 65 chemicals (CSV), and CA Safe Cosmetics (CSV).

### Session Brief

```
TASK: Build fetcher modules for FDA warning letters, FDA RSS feeds, Prop 65
chemical list, and CA Safe Cosmetics Program data.

WHAT TO READ FIRST:
- /memory-bank/research/data-validation.md — warning letter AJAX endpoint,
  RSS feed list, Prop 65 CSV URL, CSCP CSV URL
- /memory-bank/architecture/data-schema.md — table schemas

FETCHER 4: FDA WARNING LETTERS (src/pipeline/fetchers/warning-letters.ts)

  Endpoint (undocumented AJAX):
  GET https://www.fda.gov/datatables/views/ajax
    ?view_name=warning_letter_solr_index
    &view_display_id=warning_letter_solr_block
    &start=0&length=100

  Returns DataTables JSON format with 3,313 total records.

  Implementation:
  a) Paginated fetch: start=0,100,200... until all records collected
     Response structure: { data: [...], recordsTotal: N }

  b) Parse each record for metadata:
     - posted_date, issue_date
     - company_name (with URL to full letter page)
     - issuing_office
     - subject (violation description)
     - response_letter (boolean/link)
     - closeout_letter (boolean/link)

  c) For each new warning letter, fetch the individual letter page:
     - Extract: MARCS-CMS number, recipient_name, recipient_title,
       company address, full letter text (HTML body)
     - Full letter text becomes raw_content

  d) Insert into regulatory_items:
     - source_ref = MARCS-CMS number (or URL slug if no MARCS number)
     - item_type = 'warning_letter'
     - title = company_name + " - " + subject
     - issuing_office = from metadata

  e) Insert child into enforcement_details:
     - company_name, company_address
     - marcs_cms_number
     - recipient_name, recipient_title
     - violation_types = [] (populated by LLM enrichment later)
     - response_received = boolean from response_letter link
     - closeout = boolean from closeout_letter link

  f) Backfill: all 3,313 records (paginate 100 at a time)
  g) Incremental: check for new records since last sync

  Rate limiting: 200ms between individual letter page fetches.

FETCHER 5: FDA RSS FEEDS (src/pipeline/fetchers/fda-rss.ts)

  8 relevant feeds (from data-validation.md):
  - https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml
  - https://www.fda.gov/.../safety-alerts/rss.xml
  - https://www.fda.gov/.../press-releases/rss.xml
  - https://www.fda.gov/.../food-safety-recalls/rss.xml
  - https://www.fda.gov/.../cosmetics-recalls/rss.xml
  - https://www.fda.gov/.../dietary-supplement-alerts/rss.xml
  - https://www.fda.gov/.../cfsan-constituent-updates/rss.xml
  - https://www.fda.gov/.../food-and-drug-administration-news-releases/rss.xml

  Implementation:
  a) Fetch each RSS feed, parse XML (use built-in DOMParser or a light
     XML parser — no heavy dependency)
  b) Extract: title, link, pubDate, description/summary
  c) Deduplicate by URL (source_ref = item link URL)
  d) Insert into regulatory_items:
     - item_type = map from feed: recall feeds → 'recall',
       safety alerts → 'safety_alert', press releases → 'press_release'
     - raw_content = description/summary text
  e) Cross-reference with openFDA enforcement records to avoid duplicates
     (same recall can appear in both RSS and enforcement API)
  f) Run on a schedule (every 6 hours for near-real-time)

FETCHER 6: PROP 65 CHEMICAL LIST (src/pipeline/fetchers/prop65.ts)

  CSV URL: https://oehha.ca.gov/sites/default/files/media/2025-01/p65chemicalslist.csv

  Implementation:
  a) Download CSV, parse (use csv-parse or manual split — ~900 rows)
  b) Map fields:
     - Chemical name → chemicals.name
     - CAS Number → chemicals.cas_number
     - Type of Toxicity → chemicals.prop65_toxicity_type
     - Listing Mechanism → (store in alt_names or notes)
     - Date Listed → chemicals.prop65_date_listed
     - NSRL / MADL → chemicals.prop65_nsrl / prop65_madl
  c) Set chemicals.prop65_listed = true for all
  d) Upsert on cas_number (some chemicals may already exist)
  e) Run monthly (list updates annually with additions throughout year)

FETCHER 7: CA SAFE COSMETICS (src/pipeline/fetchers/cscp.ts)

  CSV URL: https://data.chhs.ca.gov/dataset/.../cscpopendata.csv
  (full URL in data-validation.md)

  Implementation:
  a) Download CSV, parse
  b) Map fields to cosmetic_chemical_reports:
     - ProductName → product_name
     - BrandName → brand_name
     - CompanyName → company_name
     - PrimaryCategoryId → product_category
     - ChemicalName → chemical_name
     - CasNumber → cas_number
     - InitialDateReported → date_reported
     - DiscontinuedDate → date_discontinued
     - ChemicalDateRemoved → date_reformulated
  c) Link chemical_id FK to chemicals table if cas_number matches
  d) Upsert on (product_name + brand_name + chemical_name) composite
  e) Run monthly

SHARED:
  - Add csv-parse to dependencies: npm install csv-parse
  - Add a lightweight RSS parser or use native XML parsing

ACCEPTANCE CRITERIA:
- [ ] Warning letter fetcher pulls all records via AJAX endpoint
- [ ] Individual letter pages are fetched for full text + MARCS number
- [ ] Warning letters insert into regulatory_items + enforcement_details
- [ ] RSS fetcher polls 8 feeds and inserts unique items
- [ ] RSS items are cross-referenced to avoid duplicates with enforcement API
- [ ] Prop 65 CSV loads ~900 chemicals into chemicals table
- [ ] CSCP CSV loads into cosmetic_chemical_reports with chemical_id links
- [ ] All fetchers log to pipeline_runs
- [ ] All fetchers handle network errors gracefully

SUBAGENTS:
- After completion: code-reviewer
```

### Files to Create
| File | Description |
|------|-------------|
| `src/pipeline/fetchers/warning-letters.ts` | FDA warning letter AJAX + page scraper |
| `src/pipeline/fetchers/fda-rss.ts` | RSS feed poller for 8 feeds |
| `src/pipeline/fetchers/prop65.ts` | Prop 65 CSV downloader/parser |
| `src/pipeline/fetchers/cscp.ts` | CA Safe Cosmetics CSV parser |
| `src/pipeline/fetchers/schemas/warning-letters.ts` | Zod schemas |
| `src/pipeline/fetchers/schemas/rss.ts` | Zod schemas |

### Gotchas
- **Warning letter AJAX endpoint is undocumented.** It could change. Build with defensive parsing and log structure changes.
- **Warning letter individual pages** are HTML — need to parse DOM for MARCS number, address, and letter body. Use a simple HTML parser, not Playwright.
- **RSS feeds may have stale items.** Always check `pubDate` and skip items older than last sync.
- **Prop 65 CSV URL has a date in the path** (`2025-01`). Check if the URL has been updated.
- **CSCP CSV is large** (thousands of rows). Process in batches for database inserts.
