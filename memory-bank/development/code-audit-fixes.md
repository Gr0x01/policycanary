---
Last-Updated: 2026-03-18
Maintainer: RB
Status: Active
---

# Code Audit Fixes (2026-03-18)

Full codebase audit across 6 domains: Inngest pipeline, data pipeline, API routes, email system, frontend, and DB/matching. Findings prioritized into 3 waves.

---

## Wave 1 — Silent Failures (highest risk)

These are "house on fire, no smoke detector" issues. The system can break and nobody knows.

| # | Issue | Files | Status |
|---|-------|-------|--------|
| 1.1 | **No failure notifications anywhere** — all pipeline/email errors go to `console.error` only. ~~Add Slack webhook~~ Wired up `Sentry.captureException()` across all catch-and-swallow sites: daily-ingest (7 fetchers), enrich-batch, runner (embeddings/verdicts/alerts/refresh), email sender, send-weekly-core (paid + free), alerts, webhook handler. | `daily-ingest.ts`, `enrich-batch.ts`, `runner.ts`, `sender.ts`, `send-weekly-core.ts`, `alerts.ts`, `webhook/route.ts`, `embeddings.ts` | DONE |
| 1.2 | **Paid briefings don't record `email_sends` rows** — Added `recordEmailSend()` after `sendEmail()` in `sendPaidBriefings`. Webhook tracking now works for paid users. | `src/lib/email/send-weekly-core.ts` | DONE |
| 1.3 | **Failed sends marked as `"queued"` instead of `"failed"`** — Fixed in both `send-weekly-core.ts` and `alerts.ts`. Added `"failed"` to status union in `queries.ts`. | `src/lib/email/send-weekly-core.ts`, `alerts.ts`, `queries.ts` | DONE |
| 1.4 | **Embeddings insert errors silently ignored** — items appear enriched but have zero searchable chunks. Check `{ error }` return from insert. Now throws + reports to Sentry. | `src/pipeline/enrichment/embeddings.ts` ~line 135 | DONE |

---

## Wave 2 — Scale Breakers

These work now but will break as subscribers/data grow.

| # | Issue | Files | Status |
|---|-------|-------|--------|
| 2.1 | **`send-weekly-emails` and `weekly-snapshot` share same cron** — Staggered: snapshot at 1pm UTC, emails at 2pm UTC. | `weekly-snapshot.ts` | DONE |
| 2.2 | **Paid briefings = N sequential LLM calls in one Inngest step** — will timeout at ~15 subscribers. Fan out per-subscriber via `step.run()` or individual events. | `src/lib/inngest/functions/send-weekly-emails.ts`, `src/lib/email/send-weekly-core.ts` | TODO |
| 2.3 | **N+1 dedup in regulations.gov fetcher** — Batched: one `.in()` query per page instead of 250 individual queries. | `regulations-gov.ts` | DONE |
| 2.4 | **N+1 dedup in warning letters fetcher** — Batched slug check per page. MARCS dedup still per-letter (requires page fetch). | `warning-letters.ts` | DONE |
| 2.5 | **Sequential DB writes in enrichItem()** — topics, substances, citations inserted one-at-a-time. Batch into single upserts. 26K-46K unnecessary round-trips per full run. | `src/pipeline/enrichment/processor.ts` ~line 303-331, 319-331, 386-396 | TODO |
| 2.6 | **In-memory match cache ineffective on Vercel** — module-level `Map` not shared across serverless isolates. Replace with React `cache()` for request-level dedup or remove entirely. | `src/lib/products/matches.ts` ~line 30-58 | TODO |
| 2.7 | **Feed `myProducts` filter unbounded** — fetches ALL relevant verdict item_ids with no limit. Will exceed PostgREST URL length. Add date floor or move to joined RPC. | `src/lib/products/queries.ts` ~line 433-441 | TODO |
| 2.8 | **Enrichment always triggers even when 0 items fetched** — Gated on `totalCreated > 0`. | `daily-ingest.ts` | DONE |
| 2.9 | **No timeout on Federal Register / openFDA fetches** — Added 30s `AbortSignal.timeout` to all fetch calls. | `federal-register.ts`, `openfda-enforcement.ts` | DONE |

---

## Wave 3 — Correctness & Defense-in-Depth

Real bugs or fragile patterns that should be hardened.

| # | Issue | Files | Status |
|---|-------|-------|--------|
| 3.1 | **Inconsistent Stripe error format** — checkout/portal return `{ error: "string" }`, everything else returns `{ error: { message } }`. Frontend will crash on TypeError. | `src/app/api/stripe/checkout/route.ts`, `portal/route.ts` | TODO |
| 3.2 | **`auth/sync-user` returns `{ ok: true }` on DB failure** — silent failure, downstream features break. Return 500 on insert/update error. | `src/app/api/auth/sync-user/route.ts` ~line 40-78 | TODO |
| 3.3 | **Blog/intelligence queries called twice per page** — `generateMetadata` + page component both call `getPostBySlug`. Wrap in React `cache()`. | `src/lib/blog/queries.ts`, `src/lib/intelligence/queries.ts` | TODO |
| 3.4 | **Schema objects not in migration files** — RPCs, `product_match_verdicts`, `weekly_intelligence_snapshots` only in Dashboard. `pg_dump --schema-only` and commit. | `supabase/migrations/` | TODO |
| 3.5 | **Bounces don't deactivate paid users** — webhook only deactivates `email_subscribers` (free). Also set `email_opted_out = true` on `users` for bounces. | `src/app/api/email/webhook/route.ts` ~line 125-147 | TODO |
| 3.6 | **`GET /api/products/[id]` missing rate limiting** — 3 DB queries per request, no throttle. Add rate limit. | `src/app/api/products/[id]/route.ts` ~line 18-63 | TODO |
| 3.7 | **`user.email!` non-null assertion in sync-user** — breaks if social auth ever added. Guard with check. | `src/app/api/auth/sync-user/route.ts` ~line 38, 49, 69 | TODO |
| 3.8 | **`getUserProducts` fetches all ingredient rows to count** — should use grouped COUNT. | `src/lib/products/queries.ts` ~line 96-115 | TODO |
| 3.9 | **Sequential cleanup deletes on re-enrichment** — 5 deletes with no error checking, partial state possible. Check errors, parallelize where FK allows. | `src/pipeline/enrichment/processor.ts` ~line 145-153 | TODO |
| 3.10 | **openFDA + warning letters do insert-then-update** — merge enforcement fields into single insert. | `src/pipeline/fetchers/openfda-enforcement.ts` ~line 203-252, `warning-letters.ts` ~line 356-408 | TODO |
| 3.11 | **Content-fetch has no retry on transient failures** — single failed fetch = thin enrichment, item marked done. Add 1 retry with backoff. | `src/pipeline/enrichment/content-fetch.ts` | TODO |
| 3.12 | **One campaign row per paid subscriber** — should be one campaign per weekly send. | `src/lib/email/send-weekly-core.ts` ~line 75-79 | TODO |
| 3.13 | **Urgent alert dedup uses `html_content` column** — fragile, will break if column gets real HTML. Needs dedicated `reference_id` column (schema change). | `src/lib/email/alerts.ts` ~line 37-46, 94 | TODO |

---

## Not Fixing (Acceptable for MVP)

- IndexNow key hardcoded — it's publicly verifiable by design, low risk
- `framer-motion` bundle size — monitor, not urgent
- `productNudge` missing concurrency limit — low volume
- Resend webhook secret at module-level — works fine on Vercel in practice
- RFC 8058 POST body validation — functionally correct, minor spec gap
- `classify.ts` env var at module load — only matters if we add tests
- Fetcher boilerplate dedup — nice but cosmetic
- `lastScannedAt` fake timestamp — UI detail
