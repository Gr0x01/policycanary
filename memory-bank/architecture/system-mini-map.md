# Policy Canary — System Mini Map

```
                         HOW THE SYSTEM WORKS
 ============================================================================

  1. INGEST               2. ENRICH              3. MATCH
  ──────────              ─────────              ─────────
  FDA data in             LLM analysis           Your products
                                                 x FDA items

  Federal Register ─┐                           subscriber_products
  openFDA Recalls  ─┤                                (ingredients,
  Warning Letters  ─┤    ┌──────────────┐              categories)
  FDA RSS Feeds    ─┤    │ Gemini Flash  │                │
  Import Alerts    ─┼──> │              │                │
  Guidance Docs    ─┤    │  summary     │                │
  Regulations.gov  ─┘    │  action type │       ┌──────┴──────┐
        │                │  deadline    │       │  Relevance  │
        v                │  substances  │──────>│  Scoring    │
  regulatory_items       │  categories  │       │             │
   (~11,680 items)       │  action items│       │ substance   │
                         │  categories  │       │             │
                         │  action items│       │ substance   │
                         └──────┬───────┘       │ + category  │
                                │               │ overlap     │
                         Cross-Reference        └──────┬──────┘
                         (GSRS 950K codes)             │
                         Gemini Pro reasons             │
                         about cross-sector             │
                         risk transfer                  │


  4. ONBOARD              5. DELIVER
  ──────────              ──────────
  Add your products       Alerts + intelligence

  Supplements:            FREE (everyone):
    DSLD lookup ──┐         Weekly FDA Roundup email
    (214K products)│        Blog at /blog
                   │
  Food:            ├──> subscriber_products    PAID (subscribers):
    Manual entry ──┤      + ingredients          Product Intelligence Email
                   │      + substances            (event-driven per product)
  Cosmetics:       │                              "Your Marine Collagen Powder
    Label photo ───┘                               is affected because..."
    Vision AI extracts
    ingredients            WEB APP:
                            Feed (lifecycle states)
                            Search (RAG + pgvector)
                            Products dashboard
```

## The Key Insight

```
  Generic alert:    "FDA proposed banning BHA"

  Policy Canary:    "Your Gold Standard Whey contains BHA.
                     The FDA proposed banning it.
                     Deadline: Jan 2027.
                     Here's what to do."

  The gap between "what happened" and "what it means for YOUR products"
  is where the price lives.
```

## Tech at Each Stage

| Stage | Key Tech | Key Data |
|-------|----------|----------|
| **Ingest** | Inngest cron (2x daily), 7 fetchers | ~11,680 items across all FDA sectors |
| **Enrich** | Gemini Flash/Pro, GSRS cross-ref | Substances, categories (119 slugs), action items |
| **Match** | 3 Postgres RPCs, IDF scoring | Substance + category overlap, 15-min cache |
| **Onboard** | DSLD local DB, Vision AI (Gemini Flash) | 214K supplements, 166K substances |
| **Deliver** | Claude Opus (writing), Resend (email) | Per-product intelligence, lifecycle states |
