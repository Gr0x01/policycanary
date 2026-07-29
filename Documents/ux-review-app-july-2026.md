# In-App UX Review — July 29, 2026

Walked the live app (dev server, dev-bypass auth, RB's real data: 5 products) through Products, item detail, Feed, Search, Settings, Onboarding, plus a mobile pass. Findings ordered by severity.

> **Status (same day, round 2):** ALL items addressed. 1–8, 10 fixed in round 1. Round 2: **9** — PRA/OMB notices demoted deterministically (`isAdministrativeItem` in `lifecycle.ts`; no LLM changes) across product status, sidebar counts, and briefing Zone 1; **11** — "$10/mo add product slot" flow (real Stripe add-on billing) + Resolve/Watch/Not-applicable on item pages; **12** — Enforcement Archive section on product pages (brand + same-category ingredient matches). Caveats: the add-slot billing path needs one Stripe test-mode run end-to-end; the archive only reaches WLs 2021+/recalls 2024+, so pre-2021 history (e.g. OxyElite 2013) still needs a deeper backfill if wanted.

## Broken things (bugs)

1. **Search is dead — and lies about why.** The AI search page (`/app/search`) always answers "Not enough regulatory data indexed yet." The truth: 54,153 chunks ARE indexed in `item_chunks`, but the `match_item_chunks` database function was never created in Supabase, and the API silently swallows that error and shows the "no data" message. One migration away from working. The page is also not linked anywhere in the nav — only reachable by typing the URL.

2. **Product status disagrees with itself across surfaces.** The sidebar says Optimum Omega is amber "1 active"; its detail page says green "ALL CLEAR — no active regulatory items." The portfolio bar says "3 need attention" when only 1 product has a live item. Cause: the sidebar counts come from the SQL function `get_live_verdict_counts` while the detail page classifies with the TypeScript `getLifecycleState()` — two different definitions of "active" (different time windows, different deadline handling). The mobile product picker shows a third answer (green dot for the same product the desktop sidebar shows amber). One source of truth is needed — probably move the sidebar counts onto the same lifecycle logic as the detail page.

3. **No way to manage billing.** The header "Billing" link just goes to `/app/settings`, which has no billing section at all. A `BillingButton` component (opens the Stripe portal) exists in the codebase but is never rendered anywhere. A paying customer currently cannot update their card or cancel — that's a churn/compliance problem the moment there's a real customer.

4. **Mobile header overflows.** At phone width (390px) "Billing" and "Sign out" run off the right edge of the screen.

5. **Raw HTML entity on item pages.** The full-report page renders "View on FDA.gov &nearr;" — the arrow entity as literal text.

6. **Hydration error on the search page.** The ⌘K/Ctrl+K keyboard hint is decided client-side, so React re-renders the whole page on load (console error, slight flash).

7. **Local analytics key typo.** `.env.local` has `phc_T10j…` (zero) — the real key is `phc_T1Qj…` (Q). Every local session 404s to PostHog. Production is unaffected (339 pageviews arrived in the last 7 days).

## Quality / trust issues

8. **"Last scanned: 41d ago" reads like the product is dead.** It's actually the timestamp of the last match *verdict*, not the last scan — the pipeline scans daily. For a monitoring product, showing an ever-aging number on quiet products is the opposite of the reassurance it should give ("scanned today, nothing found"). Also `products/page.tsx` fakes `lastScannedAt: new Date()` for the sidebar.

9. **Everything flagged "needs attention" is paperwork noise.** All current and historical matches on RB's 5 products are "Agency Information Collection Activities" notices (Paperwork Reduction Act filings), one even tagged HIGH RELEVANCE. The all-time "My Products" feed contains exactly 2 items — both admin notices. This trains users to ignore alerts. Matching/relevance scoring should demote PRA/OMB administrative notices.

10. **Feed defaults to the unfiltered FDA firehose.** Default view is All types / All time: medical-device rules, cancer-trial guidance, org-chart notices — nothing related to the user's products. Default should be "My Products" (or at least highlight matched items).

11. **Dead ends with no path forward.** "Limit reached (5)" is just a disabled button — no explanation or upgrade path. The item full-report page has no Resolve/Watch/Not-applicable actions (those only exist on the card in the Products view), and its nav highlights "Feed" even when you arrived from Products.

12. **OxyElite Pro shows "All Clear."** A famously FDA-actioned product (2013 DMAA recall) showing green is a credibility risk in any demo — worth deciding whether historical enforcement should surface in product history.

## Verified-fine

Login, onboarding form, settings profile form, and the products two-pane layout on desktop all look clean and on-brand. Empty states and deadline callouts are well designed.
