# Backfill drafts — 5 deep-dive articles (June – July 2026)

> [!NOTE]
> **All 5 are PUBLISHED** — backdated to the Tuesdays below, each verified live (HTTP 200, cover image rendering) on 2026-07-30. These files are the source drafts, kept for reference.
>
> Each was written from FDA source records already in the Policy Canary database — warning letter text, Enforcement Report entries, and recall reason fields — with every figure verified by query before writing.

**Why these five:** the weekly roundups are complete through July 24, but the deep-dive / SEO track has been empty since `fsvp-warning-letters-2026-importer-enforcement` on **April 28** — 13 open Tuesdays. These fill five of them with the strongest material in the May–July enforcement data.

| # | Article | Published | Category | Live | Draft |
|---|---------|-----------|----------|------|-------|
| 01 | One Salmonella-positive ingredient, 22 downstream Class I recalls — the California Dairies cascade | Tue **Jun 9** | `regulatory_trends` | [live](https://policycanary.io/blog/nonfat-dry-milk-salmonella-recall-cascade-2026) | [draft](01-milk-powder-cascade.md) |
| 02 | FDA sent 25 telehealth companies the same letter on the same day — the violation was website copy | Tue **Jun 23** | `warning_letter_analysis` | [live](https://policycanary.io/blog/fda-telehealth-glp1-warning-letters-june-2026) | [draft](02-telehealth-glp1-letters.md) |
| 03 | FDA has sent Amazon nine warning letters since 2022 — the newest names Fulfillment by Amazon | Tue **Jun 30** | `warning_letter_analysis` | [live](https://policycanary.io/blog/amazon-fda-warning-letters-fulfillment-2026) | [draft](03-amazon-ninth-warning-letter.md) |
| 04 | Revlon got a drug CGMP warning letter without an inspection — how 704(a)(4) works | Tue **Jul 7** | `regulatory_trends` | [live](https://policycanary.io/blog/fda-cgmp-warning-letters-records-requests-2026) | [draft](04-cgmp-without-inspection.md) |
| 05 | Two Class I infant formula recalls in five weeks — and neither was Cronobacter | Tue **Jul 14** | `regulatory_trends` | [live](https://policycanary.io/blog/infant-formula-class-i-recalls-2026-spore-formers) | [draft](05-infant-formula-class-i-recalls.md) |

**Result:** the blog archive now alternates Tuesday deep-dive / Friday roundup unbroken from Jun 9 to Jul 24. Each deep dive follows the roundup that broke its story — the Jun 5 roundup led with the milk-powder cascade, the Jun 9 deep dive expands it; same for telehealth (Jun 19 → Jun 23), Amazon (Jun 26 → Jun 30), and infant formula (Jul 10 → Jul 14).

**Covers:** all five generated with `generate-image.mjs` in a consistent muted slate-and-amber editorial style, no text and no logos, uploaded to the `blog-images` bucket.

All five run 1,100–1,280 words — shorter than the FSVP post (2,128) and inside the voice guide's "under 1,500 unless the topic genuinely demands more." Each names specific companies and products, cites the source document, separates fact from interpretation, and ends with a concrete action item or an explicit "no action required."

## Verified figures

Every number below was confirmed by query against `regulatory_items` before drafting:

- **Cascade:** 3 upstream Class I records (California Dairies, 2,699,198 lbs total) + 22 downstream Class I records across Griffith Foods (3), Ghirardelli (10), PS Seasoning (6), Legacy Bakehouse (3).
- **Telehealth:** 25 distinct companies, all letters dated Jun 8, 2026. (The table holds 26 rows — Medica Weight Loss is a duplicate ingest of MARCS 728284; see note below.)
- **Amazon:** 9 warning letters, Aug 2022 – Jun 2026, all CDER, all unapproved new drugs.
- **CGMP:** 64 CGMP warning letters May 1 – Jul 29; 13 reference a section 704(a)(4) records request.
- **Infant formula:** a2 Platinum 51,202 units (cereulide toxin); Nara Organics 377,610 cans, all lots (*C. botulinum*).

## Two things to flag

**Redactions respected.** The Revlon and Erkul letters redact the excipient and the carcinogenic contaminant under (b)(4). Draft 04 says so and does not guess at either name.

**Pipeline bug found while researching:** `regulatory_items` holds two rows for Medica Weight Loss's MARCS 728284 — same URL, same date, differing only in `source_ref` format (`728284` vs `medica-weight-loss-728284-06082026`). Worth a dedupe check on the warning-letter fetcher; it would inflate any letter-count metric.
