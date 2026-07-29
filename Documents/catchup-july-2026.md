# Policy Canary — Catchup (July 2026)

Working document for restarting after the April–July lapse. Status checked live on **July 29, 2026** (database, PostHog, git, homelab).

> [!NOTE]
>
>
> The short version: the automated core never stopped. Data pipeline, enrichment, and weekly emails all ran cleanly the whole time you were gone. What stopped was everything that needed you in the loop — blog, LinkedIn, and the launch push itself. Traffic kept growing anyway.

## What's still running (healthy)

| System                               | Status    | Evidence                                                                           |
| ------------------------------------ | --------- | ---------------------------------------------------------------------------------- |
| Data pipeline (Inngest daily-ingest) | ✅ Running | Items ingested this morning; 84 new in the last 7 days; 13,068 total, all enriched |
| Weekly emails (free + paid)          | ✅ Running | Both campaigns sent every Friday, most recently July 24                            |
| Website (Vercel)                     | ✅ Live    | Serving traffic normally                                                           |
| Supabase                             | ✅ Healthy | Pro plan, pipeline writing daily                                                   |

## What stopped

| System                   | Status                | Detail                                                                                                                           |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Blog                     | 🛑 Silent since May 1 | Last post: weekly roundup for Apr 25–May 1. \~12 weekly roundups + \~2 months of SEO posts missed                                |
| LinkedIn                 | 🛑 Stopped            | Was 2x/week via Cowork drafts — needed you to approve/post                                                                       |
| Anton (reactive agent)   | 🛑 Unreachable        | The whole homelab (10.2.x) times out from this machine — either still packed from the move or this Mac isn't on that network yet |
| Cowork scheduled content | 🛑 Lapsed             | Roundup Fri / SEO Tue / LinkedIn Mon+Wed / leads Mon — all human-in-the-loop, so all paused                                      |

## Where the business stands

* **No outside customers yet.** The 2 accounts in the users table are both yours (rbaten@, gr0x01@). Self-serve Stripe checkout is live and waiting; nobody has come through it.

* **11 active newsletter subscribers.**

* **Traffic is real and growing with zero effort:** ~1,321 unique visitors in the last 30 days, **+15% over the prior month** — all organic, months after content stopped.

* **What's pulling traffic (last 30 days):** the two SEO posts lead — data-integrity warning letters (137 visitors) and the peptide-crackdown post (91) — followed by the programmatic ingredient/regulation pages (potassium bromate, food dye phase-out, PFAS, FSMA 204, supplement GMP…). The homepage is only ~5% of views. **SEO content is the growth engine, and it compounds while you sleep.**

* Interesting: `/login` got 57 visitors last month — worth a look at whether those are subscribers clicking through from the weekly email.

## Where development left off (April)

Status at pause: **product built, code audit done (26/26 fixes), launch prep was the current phase.** The next planned feature was the Research tier ($399/mo, agentic search — plan in `Documents/plans/research-search.md`).

There's finished-but-uncommitted work sitting in the tree from April (last commit was March 31):

* `publish-blog.mjs` — new `--published-at` flag for backdated publishing (upsert via Supabase, then re-POST to revalidate)

* Weekly-roundup + SEO-blog skill docs updated (backdating workflow, new pharma data-integrity keyword cluster)

* `src/lib/analytics.ts` — PostHog flush deferred past the HTTP response via `next/server` `after()` (fixes dropped events in serverless)

* Memory-bank updates through April 17

> [!TIP]
>
>
> This is all coherent, finished work — one commit and the repo is clean again.

## One novel thing worth remembering

The April 11–17 roundup flagged a **first-of-its-kind enforcement signal**: FDA cited a firm (Purolea Cosmetics Lab) for using AI to generate compliance documentation without Quality Unit review. You planned to watch for this pattern recurring in CGMP letters — three months of new warning letters have been ingested since, so there's now data to check.

## Restart checklist

* [x] Commit the April working-tree changes (one clean commit)

* [x] ~~Decide: resume vs backfill the ~12-week gap~~ **DONE 2026-07-29** — full backfill: 12 roundups (May 2 – Jul 24) published backdated to each Friday. Review drafts in `Documents/blog-backfill/`.

* [ ] Repair the drifted `scripts/clawdbot/` content scripts (schema-aligned queries, faster fact-check) before Cowork automation resumes

* [ ] Restart Cowork's scheduled content (SEO Tue is the highest-value slot — it's what drives traffic)

* [ ] Homelab: get back on the network / power it up, then check Anton (`ssh anton@10.2.20.221`)

* [ ] Check the AI-generated-compliance-docs signal against Apr–Jul warning letters — potential standout blog post

* [ ] Look at who's hitting `/login` (email subscribers? then the funnel is warmer than the numbers suggest)

* [ ] Then: the actual launch push — the product has been ready since April; the missing ingredient is users

## Open questions

1. Where does content automation live now — Cowork on this Mac, the homelab once it's back, or fold it into Koda?
2. Is the Research tier still the next feature, or does launch/user acquisition come first?

