# Changelog

One dated line per shipped change, newest first. Add the line in the same session the work lands (commit/deploy/publish) — detail belongs in the commit message or the relevant topic doc, not here. History before 2026-07-29 lives in the frozen milestone table (`.koda/memory/archive/progress-2026-03.md`) and git log.

## 2026-07-30

- Deep-dive blog backfill complete: the evergreen/SEO track had been empty since Apr 28 (13 open Tuesdays). **Five articles written and published backdated** to Jun 9 / Jun 23 / Jun 30 / Jul 7 / Jul 14, each with a generated cover image, all verified live. Topics: the California Dairies milk-powder cascade (one Salmonella ingredient → 22 downstream Class I records at Griffith/Ghirardelli/PS Seasoning/Legacy Bakehouse), FDA's 25 telehealth GLP-1 letters (built from website copy, no inspection, 502(bb) advertising misbranding), Amazon's ninth warning letter since 2022 (Jun 2026 letter moves the liability theory onto Fulfillment by Amazon), 13 of 64 CGMP letters issued off section 704(a)(4) records requests with no inspection (Revlon's Oxford facility included), and two Class I infant formula recalls from spore-formers rather than Cronobacter. Every figure query-verified against `regulatory_items` before drafting. Blog archive now alternates Tue deep-dive / Fri roundup unbroken Jun 9 – Jul 24. Drafts + source notes: `Documents/blog-backfill/deep-dives/`.
- Found while researching: `regulatory_items` holds a duplicate row for Medica Weight Loss MARCS 728284 (same URL/date, `source_ref` format differs) — warning-letter fetcher needs a dedupe check; it inflates letter counts. Not yet fixed.
- Agent memory notes de-staled (`.koda/memory/`, Koda-local so not in this repo). `quickstart.md` was materially wrong and would have misled any session reading it: it described the killed pilot program as current GTM, claimed "no free tier" when `users.access_level` defaults to `free` with `max_products = 1`, carried superseded $49/$249/+$6 pricing, put Anton on a stopped Pi 5, and its entire Documentation table pointed at `memory-bank/` paths deleted on 2026-07-29. Now reflects shipped reality: self-serve $99/mo + $10/product, 44 intelligence pages, 33 tables, migrations through `011`, no outside customers yet. Also corrected present-tense "Anton runs on a Vultr VPS with Discord" claims in `llm-data-flow.md`, `project-brief.md`, and `tech-stack.md` (it's Proxmox LXC 112 + Slack, currently unreachable), fixed Supabase-is-free-tier in the cost list, and added the verified blog-publish recipe to `clawdbot.md`. All wikilinks and file paths validated.

## 2026-07-29

- UX review round 2: $10/mo additional-product billing implemented (Stripe add-on item, self-releasing on product delete — pricing page promise now real; needs one Stripe test-mode run before trusting); PRA/OMB paperwork notices demoted to muted "Administrative" FYI everywhere (product status, counts, weekly briefing Zone 1); Enforcement Archive section on product pages (brand mentions + same-category ingredient matches, WLs 2021+/recalls 2024+); Resolve/Watch/Not-applicable actions on item full-report pages. Code-reviewed: fixed a delete-raises-your-bill edge, a PostgREST `.or()` injection/crash on comma product names, and locked the search RPC to authenticated callers (migration `011`, applied). (`ae132c3`)
- In-app UX fixes from the July review: AI Search unbroken (missing `match_item_chunks` DB function created — migration `010`, applied to prod; threshold tuned; Search added to nav), product status unified to one lifecycle source (sidebar/portfolio/detail/mobile all agree now), Stripe billing portal button wired into Settings, feed defaults to My Products, honest "last scanned" (pipeline ingest time), mobile header overflow + `&nearr;` entity + ⌘K hydration fixed, stale marketing e2e specs updated to current copy. Findings doc: `Documents/ux-review-app-july-2026.md`. (`ae132c3`)
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
