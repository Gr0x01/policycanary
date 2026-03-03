# Phase 4C: Product Matching Engine

**Complexity:** Medium | **Sessions:** 1 | **Dependencies:** Phase 2B (enrichment with ingredient tagging), Phase 4B (products in DB)
**Purpose:** For every newly enriched regulatory item, score it against each subscriber's product profiles. Store matches for use by the email system (Phase 5).

## Session Brief

```
TASK: Build the product matching engine — matches regulatory items to
subscriber products by ingredient overlap. Called after each enrichment.
Stores matches in product_item_matches for use by the email system.

WHAT TO READ FIRST:
- /memory-bank/architecture/data-schema.md — product_item_matches,
  product_ingredients, item_enrichments tables
- Phase 2B enrichment output — affected_ingredients field
- Phase 4B product onboarding — ingredient_normalized field

WHY THIS MATTERS:
Segments tell us "this affects supplement companies." Products tell us "this
affects YOUR Marine Collagen Powder because it contains whey protein isolate."
The matching engine bridges enrichment data to subscriber products.

CORE FUNCTION: matchItemToProducts(itemId: string)
File: src/pipeline/matching/matcher.ts

  Called from enrichment runner after each item is enriched.

  Algorithm:
  1. Fetch affected_ingredients from item_enrichments WHERE item_id = itemId
     Also fetch affected_product_types for pre-filtering
     Also fetch item relevance from segment_impacts for urgent alert logic
  2. Fetch all subscriber products with their normalized ingredients:
     SELECT sp.id, sp.user_id, sp.product_name, sp.product_type,
            pi.ingredient_normalized
     FROM subscriber_products sp
     JOIN product_ingredients pi ON sp.id = pi.product_id
     WHERE sp.is_active = true
  3. For each subscriber product, compute match score:
     - Normalize affected_ingredients from enrichment (same normalizer as Phase 4B)
     - Count how many of the product's ingredient_normalized values appear
       in the normalized affected_ingredients list
     - match_score = matched_count / max(affected_ingredients.length, 1)
     - match_reasons JSONB: { matched_ingredients: [...], match_type: 'exact' }
  4. Filter: only store matches where match_score > 0.1
  5. Upsert into product_item_matches (on conflict product_id + item_id,
     update match_score and match_reasons)
  6. After inserting matches: check urgent alert trigger (see below)

INGREDIENT NORMALIZER (src/pipeline/matching/normalizer.ts)

  CRITICAL: Must produce the same output as the normalizer used in Phase 4B
  when inserting ingredient_normalized. These are compared directly.

  Normalization steps:
  a) Lowercase
  b) Trim whitespace, strip punctuation except hyphens
  c) Remove common filler words: extract, powder, oil, complex, blend,
     standardized, dried, organic, natural
  d) Common synonym map (expand as needed):
     "vitamin c" = "ascorbic acid" = "l-ascorbic acid"
     "bha" = "butylated hydroxyanisole"
     "bht" = "butylated hydroxytoluene"
     "red no 3" = "red 3" = "erythrosine"
     "red no 40" = "red 40" = "allura red"
     "titanium dioxide" = "ci 77891"
     "retinol" = "vitamin a"

  Export as: normalize(ingredient: string): string
  The normalizer is a pure function — no DB calls, no side effects.

MATCH SCORING DETAILS:

  - Score contribution per matched ingredient: 1.0 / affected_ingredients.length
  - Example: item has 10 affected_ingredients, product matches 2 → score = 0.2
  - Product type pre-filter: if product.product_type (supplement/food/cosmetic)
    does NOT appear in affected_product_types, skip (score = 0, don't store)
  - Threshold: only store matches with final score > 0.1 (at least one hit
    in an item with ≤10 affected ingredients)
  - match_reasons: { matched_ingredients: ["bha", "red no 3"], match_type: "exact" }

URGENT ALERT TRIGGER:

  After inserting matches, for each match where:
  - match_score > 0.5 (strong ingredient match)
  - item relevance = 'critical' (from segment_impacts, any segment)
  Call: sendUrgentAlert(item, subscriber) from the email system (Phase 5)

  This is fire-and-forget — catch errors, log them, do not block enrichment.

INTEGRATION WITH ENRICHMENT RUNNER:

  In src/pipeline/enrichment/runner.ts, after enrichItem() completes:
    await matchItemToProducts(item.id)

  Import matcher from src/pipeline/matching/matcher.ts
  This is the only modification to existing pipeline files.

ACCEPTANCE CRITERIA:
- [ ] matchItemToProducts runs after every enrichment without blocking it
- [ ] Ingredient normalization produces consistent output matching Phase 4B
- [ ] Common synonyms map correctly (bha = butylated hydroxyanisole, etc.)
- [ ] Match scores computed correctly (ratio of matched/total affected)
- [ ] Product type pre-filter works (supplement products skip food-only items)
- [ ] Only matches above 0.1 threshold are stored
- [ ] Urgent alert triggered for critical + high-score matches
- [ ] product_item_matches table is populated correctly after enrichment
- [ ] Errors in matching don't crash the enrichment pipeline

SUBAGENTS:
- After completion: code-reviewer (verify scoring logic, confirm normalizer consistency with Phase 4B)
```

## Files to Create
| File | Description |
|------|-------------|
| `src/pipeline/matching/matcher.ts` | Core matching logic — matchItemToProducts() |
| `src/pipeline/matching/normalizer.ts` | Ingredient name normalization + synonym map |

## Files to Modify
| File | Change |
|------|--------|
| `src/pipeline/enrichment/runner.ts` | Call matchItemToProducts() after each enriched item |

## Gotchas
- **Normalizer consistency is critical.** The same normalizer MUST be used in Phase 4B (ingredient insert) and Phase 4C (match time). If they diverge, no matches will occur. Best practice: extract to `src/lib/products/normalize.ts` and import in both places.
- **match_score is a ratio, not a percentage.** One matching ingredient out of 50 affected = 0.02 (below threshold). One matching ingredient out of 1 affected = 1.0.
- **Urgent alert is fire-and-forget.** Use try/catch + logging. Never let email failures block the enrichment pipeline.
- **Synonym map is a living document.** Start with the most common FDA-regulated ingredients. Add entries as false negatives are found during QA.
- **Empty affected_ingredients.** If enrichment returns an empty array for affected_ingredients, skip matching for that item (no ingredients to match against).
