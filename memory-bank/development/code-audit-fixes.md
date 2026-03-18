---
Last-Updated: 2026-03-19
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
| 2.2 | **Paid briefings = N sequential LLM calls in one Inngest step** — Fanned out into batches of 5 per Inngest step with independent retry/timeout. | `send-weekly-emails.ts` | DONE |
| 2.3 | **N+1 dedup in regulations.gov fetcher** — Batched: one `.in()` query per page instead of 250 individual queries. | `regulations-gov.ts` | DONE |
| 2.4 | **N+1 dedup in warning letters fetcher** — Batched slug check per page. MARCS dedup still per-letter (requires page fetch). | `warning-letters.ts` | DONE |
| 2.5 | **Sequential DB writes in enrichItem()** — Batched: categories, substances, citations all use single batch upsert/insert. | `processor.ts` | DONE |
| 2.6 | **In-memory match cache ineffective on Vercel** — Removed entirely. RPC calls are fast (~4ms), no cross-request cache needed. | `matches.ts`, `products/route.ts`, `products/[id]/route.ts` | DONE |
| 2.7 | **Feed `myProducts` filter unbounded** — Bounded to 180-day window on `evaluated_at`. | `queries.ts` | DONE |
| 2.8 | **Enrichment always triggers even when 0 items fetched** — Gated on `totalCreated > 0`. | `daily-ingest.ts` | DONE |
| 2.9 | **No timeout on Federal Register / openFDA fetches** — Added 30s `AbortSignal.timeout` to all fetch calls. | `federal-register.ts`, `openfda-enforcement.ts` | DONE |

---

## Wave 3 — Correctness & Defense-in-Depth

Real bugs or fragile patterns that should be hardened.

| # | Issue | Files | Status |
|---|-------|-------|--------|
| 3.1 | **Inconsistent Stripe error format** — All Stripe routes now return `{ error: { message } }`. | `checkout/route.ts`, `portal/route.ts` | DONE |
| 3.2 | **`auth/sync-user` returns `{ ok: true }` on DB failure** — Now returns 500 on insert/update failure. | `sync-user/route.ts` | DONE |
| 3.3 | **Blog/intelligence queries called twice per page** — Wrapped in React `cache()`. | `blog/queries.ts`, `intelligence/queries.ts` | DONE |
| 3.4 | **Schema objects not in migration files** — Captured in `008_capture_dashboard_objects.sql`: 2 tables + 6 RPCs, all idempotent. | `supabase/migrations/008` | DONE |
| 3.5 | **Bounces don't deactivate paid users** — Webhook now sets `email_opted_out = true` on `users` table too. | `webhook/route.ts` | DONE |
| 3.6 | **`GET /api/products/[id]` missing rate limiting** — Added 30 req/window rate limit. | `products/[id]/route.ts` | DONE |
| 3.7 | **`user.email!` non-null assertion** — Replaced with guard returning 400. All `user.email!` removed. | `sync-user/route.ts` | DONE |
| 3.8 | **`getUserProducts` fetches all ingredient rows to count** — Parallel `head:true` count queries per product. | `queries.ts` | DONE |
| 3.9 | **Sequential cleanup deletes on re-enrichment** — FK-ordered (citations→enrichments sequential), then 4 parallel with error checks. | `processor.ts` | DONE |
| 3.10 | **openFDA + warning letters do insert-then-update** — Merged enforcement fields into single insert. Removed wasteful `.select("id").single()`. | `openfda-enforcement.ts`, `warning-letters.ts` | DONE |
| 3.11 | **Content-fetch has no retry on transient failures** — Retries once on 5xx/network errors with 1s backoff. 4xx fails immediately. | `content-fetch.ts` | DONE |
| 3.12 | **One campaign row per paid subscriber** — One campaign created in Inngest/manual route, passed to all batches. | `send-weekly-emails.ts`, `send-weekly-core.ts`, `send-weekly/route.ts` | DONE |
| 3.13 | **Urgent alert dedup uses `html_content` column** — New `reference_item_id` UUID column with FK + partial index. Migration `009`. | `alerts.ts`, `queries.ts`, `supabase/migrations/009` | DONE |

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
