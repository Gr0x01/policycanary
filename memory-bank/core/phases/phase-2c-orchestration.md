# Phase 2C: Pipeline Orchestration

**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 2A-1, 2A-2, 2B
**Purpose:** Wire all fetchers and enrichment into a single pipeline runner with scheduling, logging, backfill support, and trend signal computation.

### Session Brief

```
TASK: Build the main pipeline orchestrator that runs all fetchers, triggers
enrichment, and computes trend signals. This is the daily/weekly automation.

WHAT TO READ FIRST:
- /memory-bank/architecture/data-schema.md — pipeline_runs, trend_signals tables
- Source code from Phase 2A and 2B (fetchers + enrichment)

COMPONENT 1: MAIN ORCHESTRATOR (src/pipeline/orchestrator.ts)

  async function runPipeline(options: PipelineOptions): Promise<PipelineResult>

  Options:
  - mode: 'incremental' | 'backfill'
  - sources: string[] (which sources to run, default all)
  - dateRange?: { start: Date, end: Date } (for backfill)
  - skipEnrichment?: boolean (fetch only, enrich separately)

  Flow:
  1. Create pipeline_run record with status 'running'
  2. Run fetchers in sequence (FR → openFDA → CAERS → warning letters →
     RSS → prop65 → cscp)
     - Each fetcher returns {fetched, created, updated, skipped, errors}
  3. Run enrichment on all new items (if !skipEnrichment)
  4. Run trend signal computation (if incremental mode)
  5. Update pipeline_run with final stats and status
  6. Return summary

COMPONENT 2: BACKFILL STRATEGY (src/pipeline/backfill.ts)

  Backfill date ranges per source:
  - Federal Register: 2020-01-01 to today, 6-month windows
  - openFDA Enforcement: 2020-01-01 to today, 1-year windows
  - openFDA CAERS: 2020-01-01 to today, 3-month windows
  - Warning Letters: all records (pagination, not date-windowed)
  - Prop 65: full CSV (one-shot)
  - CSCP: full CSV (one-shot)
  - RSS: current items only (no historical)

  Backfill orchestration:
  - Run fetchers first for ALL sources (populate raw data)
  - Then run enrichment in batches (newest first — prioritize recent items)
  - Generate embeddings after enrichment
  - Create HNSW index after 1000+ chunks loaded
  - Compute initial trend signals

COMPONENT 3: TREND SIGNAL COMPUTATION (src/pipeline/trends.ts)

  Recompute rolling window aggregations. This table is REBUILT, not appended.

  async function computeTrendSignals(): Promise<void>

  For each (segment, topic) pair:
  a) Count items in 30/60/90 day windows:
     SELECT COUNT(*) FROM segment_impacts si
     JOIN item_topics it ON si.item_id = it.item_id
     WHERE si.segment = $1 AND it.topic_id = $2
     AND si.published_date >= NOW() - INTERVAL '30 days'

  b) Compare current 30-day count to previous 30-day count:
     trend_direction = current > prev * 1.3 ? 'rising'
                     : current < prev * 0.7 ? 'declining'
                     : 'stable'

  c) Compute avg_relevance:
     Map relevance enum to numeric: critical=4, high=3, medium=2, low=1, none=0
     Average across items in the window

  d) Generate trend_summary (Gemini Flash):
     "Identity testing enforcement is rising in supplements: 8 items in
     the last 30 days vs. 3 in the prior period. Recent warning letters
     cite 21 CFR 111.70 specifically."

  e) UPSERT into trend_signals on (segment, topic_id, period_start, period_end)

  Run: nightly for incremental, after backfill for initial load.

COMPONENT 4: NPM SCRIPTS (package.json)

  Add scripts:
  "pipeline:incremental": "npx tsx src/pipeline/orchestrator.ts --mode=incremental"
  "pipeline:backfill": "npx tsx src/pipeline/orchestrator.ts --mode=backfill"
  "pipeline:fetch-only": "npx tsx src/pipeline/orchestrator.ts --mode=incremental --skip-enrichment"
  "pipeline:enrich": "npx tsx src/pipeline/enrichment/runner.ts"
  "pipeline:trends": "npx tsx src/pipeline/trends.ts"

COMPONENT 5: GSRS MONTHLY SYNC (src/pipeline/gsrs-sync.ts)

  The substances table (169K FDA substances) + substance_codes table (~500K-850K
  use-context codes) needs monthly refresh to pick up new registrations and codes.
  New botanical ingredients, novel NDIs, and new food additives are registered
  periodically. Monthly sync keeps substance matching AND cross-reference inference
  current, and retroactively resolves items with match_status='unresolved'.

  WHY MONTHLY (not weekly): GSRS has no incremental API — every sync fetches all
  169K substances (~5 hours). Weekly = 20 hrs/month of compute for marginal gain.
  New substance registrations relevant to food/supplements/cosmetics trickle in
  slowly; monthly cadence easily captures them.

  async function syncGsrs(): Promise<{ upserted: number; durationMs: number }>

  - Same logic as scripts/bootstrap-gsrs.ts but wrapped as an async function
  - Captures substances, substance_names, AND substance_codes (10 relevant code systems)
  - Uses upsert on canonical_name conflict — always safe to re-run
  - Takes ~5 hours; must run as background Inngest job (not HTTP handler)
  - Schedule: monthly, 1st of month at 2 AM UTC

  Inngest function:
  - inngest.createFunction(
      { id: "gsrs-monthly-sync", name: "GSRS Monthly Substance Sync" },
      { cron: "0 2 1 * *" },   // 1st of month, 2 AM UTC
      async ({ step }) => { ... }
    )

  After sync completes: re-attempt resolution of 'unresolved' substance rows
  - UPDATE regulatory_item_substances SET match_status='pending'
    WHERE match_status='unresolved'
  - Then re-run substance matching pass against updated substances table

COMPONENT 6: CRON CONFIGURATION

  For Vercel Cron (vercel.json):
  {
    "crons": [{
      "path": "/api/cron/pipeline",
      "schedule": "0 6 * * *"    // Daily at 6 AM UTC
    }]
  }

  Create API route: src/app/api/cron/pipeline/route.ts
  - Verify cron secret header
  - Call runPipeline({ mode: 'incremental' })
  - Return status

ACCEPTANCE CRITERIA:
- [ ] Orchestrator runs all fetchers in sequence
- [ ] Enrichment runs automatically on new items
- [ ] Backfill works for all sources with correct date ranges
- [ ] Trend signals compute correctly for 30/60/90 day windows
- [ ] HNSW index creation is triggered after sufficient data
- [ ] NPM scripts work for manual runs
- [ ] Cron endpoint works for scheduled runs
- [ ] Pipeline can be interrupted and resumed
- [ ] Full pipeline status is logged in pipeline_runs

SUBAGENTS:
- After completion: code-reviewer
- For trend computation logic: optionally consult backend-architect
```

### Files to Create
| File | Description |
|------|-------------|
| `src/pipeline/orchestrator.ts` | Main pipeline runner |
| `src/pipeline/backfill.ts` | Backfill date range configuration + runner |
| `src/pipeline/trends.ts` | Trend signal computation |
| `src/app/api/cron/pipeline/route.ts` | Cron endpoint for daily pipeline |
| `vercel.json` | Cron schedule configuration |
