# Phase 2C: Pipeline Orchestration

**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 2A-1, 2A-2, 2B
**Status:** DONE (Minimal) — Inngest functions wired, twice-daily cron, on-demand enrichment. Trend signals, backfill orchestration, and GSRS monthly sync deferred.

---

## What Was Built (2026-03-04)

**Architecture:** Single Inngest function with `step.run()` per phase. Inngest-native cron (not Vercel Cron). Catch-everything error handling inside each step (in Inngest v3, a failed step blocks ALL subsequent steps).

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/inngest/client.ts` | Modified | Added `Events` type schema for `pipeline/enrich.requested` |
| `src/lib/inngest/functions/daily-ingest.ts` | Created | Daily pipeline: 4 fetcher steps (parallel) + enrichment step |
| `src/lib/inngest/functions/enrich-batch.ts` | Created | On-demand enrichment trigger (event-driven, limit clamped 1-200) |
| `src/lib/inngest/index.ts` | Created | Barrel export |
| `src/app/api/inngest/route.ts` | Modified | Registers both functions |
| `src/pipeline/fetchers/fda-rss.ts` | Modified | Removed unused `{ mode: "poll" }` param |

### Schedule

| Function | Trigger | Schedule |
|----------|---------|----------|
| `daily-ingest` | Inngest cron | `0 6,18 * * *` (6 AM + 6 PM UTC = 2 AM + 2 PM ET) |
| `enrich-batch` | Event `pipeline/enrich.requested` | On-demand |

### Key Design Decisions

- **Parallel fetchers:** All 4 fetchers run via `Promise.all` (independent APIs), enrichment sequential after
- **Catch-everything:** Each `step.run()` catches errors internally and returns result objects. Partial data today beats no data until tomorrow. Next cron run (12h) naturally retries.
- **Concurrency guards:** `concurrency: [{ limit: 1 }]` on both functions prevents overlapping runs
- **Limit validation:** `enrich-batch` clamps `event.data.limit` to `[1, 200]`
- **Error truncation:** `safeError()` helper truncates error messages to 500 chars (prevents credential leaks to Inngest dashboard)

### Environment

- `INNGEST_SIGNING_KEY` — required in Vercel for production
- `INNGEST_EVENT_KEY` — required if sending events from outside the serve handler
- Local dev: `npx inngest-cli@latest dev` (dashboard at http://localhost:8288)

### Code Review (2026-03-04)

- **C1 fixed:** `enrichBatch` missing error handling (infinite retry risk) → added try/catch
- **C2 fixed:** No limit validation on event data → clamped to `[1, 200]`
- **W1 fixed:** Sequential fetchers → `Promise.all` for parallel execution
- **W2 fixed:** Useless `key: "enrichment"` on concurrency → removed
- **W3 fixed:** RSS `{ mode: "poll" }` unused param → removed from function signature
- **W4 fixed:** Error message truncation via `safeError()`

---

## Deferred (Not Built)

- **Trend signal computation** — needs product categories + re-enrichment first
- **GSRS monthly sync** — needs incremental API strategy; full sync takes ~5 hours
- **Backfill orchestration via Inngest** — CLI scripts work fine for now
- **Vercel Cron integration** — Inngest handles scheduling natively
- **HNSW index automation**
- **Discord #alerts on pipeline failure** — nice-to-have, not MVP
- **Per-item fan-out enrichment** — sequential runner is fine at current scale
