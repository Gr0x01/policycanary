# Changelog

One dated line per shipped change, newest first. Add the line in the same session the work lands (commit/deploy/publish) — detail belongs in the commit message or the relevant topic doc, not here. History before 2026-07-29 lives in the frozen milestone table (`.koda/memory/archive/progress-2026-03.md`) and git log.

## 2026-07-29

- In-app UX fixes from the July review: AI Search unbroken (missing `match_item_chunks` DB function created — migration `010`, applied to prod; threshold tuned; Search added to nav), product status unified to one lifecycle source (sidebar/portfolio/detail/mobile all agree now), Stripe billing portal button wired into Settings, feed defaults to My Products, honest "last scanned" (pipeline ingest time), mobile header overflow + `&nearr;` entity + ⌘K hydration fixed, stale marketing e2e specs updated to current copy. Findings doc: `Documents/ux-review-app-july-2026.md`. (uncommitted)
- Blog backfill: 12 Weekly FDA Roundups (May 2 – Jul 24) drafted via an 11-agent parallel workflow, self-checked against FDA source records + chart data DB-verified, published backdated to each week's Friday. Fills the May–Jul content gap; archive reads as an unbroken weekly series. Review drafts kept in `Documents/blog-backfill/`.
- Doc migration to Koda style: `memory-bank/` deleted — agent knowledge → `.koda/memory/` (local), research/plans → `Documents/`, frozen history → `.koda/memory/archive/`. CLAUDE.md + README repointed. This changelog moved to `Documents/` so it's visible in Koda. (`8d6678f`)
- Weekly briefing spam fix — Zone 1 gated on LLM verdicts (kills category-noise repeats), half-open email window, per-item "Review & resolve" deep link, resolutions survive re-enrichment. (`c0cf854`)
- `query-supabase.mjs` columns aligned with live schema (source_ref, summary, raw_substance_name). (`52e6bef`)
- Backdated blog publishing supported natively + PostHog flush deferred. (`e88e12c`)
- July 2026 catchup doc — project status after the Apr–Jul lapse. (`a473ab3`, `e8afdef`)

## 2026-03-31

- Newsletter signup forms were silently failing — fixed, plus end-of-article CTA. (`70b4937`)

## 2026-03-28

- Blog pages revalidate on publish to bust cached 404s. (`5fd79e3`)

## 2026-03-22

- Pilot program killed; self-serve paid live with Stripe checkout. (`038d803`)
- Login page simplified for checkout flow. (`321ff01`)
