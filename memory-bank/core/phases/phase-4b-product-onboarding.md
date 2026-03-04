# Phase 4B: Product Onboarding

**Complexity:** Medium | **Sessions:** 2-3 | **Dependencies:** Phase 4 (Auth)
**Purpose:** Allow subscribers to add their actual products after signup. Pull structured ingredient data from local DSLD database (supplements). Manual entry for cosmetics/food. Must come before Phase 5 since personalized emails require product profiles.

---

## Session 1: API Routes — DONE (2026-03-05)

**Triple code-reviewed (code-reviewer, backend-architect, code-architect). 3 critical + 6 warning fixes applied.**

### What Shipped

**Types + Queries Module:**
- `src/lib/products/types.ts` — Zod schemas (`CreateProductSchema` with DSLD numeric refinement, `UpdateProductSchema`, `DSLDSearchSchema`), response types
- `src/lib/products/queries.ts` — server-only: DSLD search/detail, user products with ingredient counts, product CRUD helpers, substance resolution via `find_substance_by_name` RPC, DSLD ingredient ingestion

**DSLD Routes:**
- `GET /api/dsld/search?q=...&limit=...` — ILIKE prefix on `product_name`, `market_status = 'On Market'`, 30/min rate limit, auth required (dev bypass)
- `GET /api/dsld/[id]` — 3 parallel queries (product + dsld_ingredients + dsld_other_ingredients), auth required (dev bypass)

**Product Routes:**
- `GET /api/products` — user's active products with ingredient counts
- `POST /api/products` — Zod validation, plan limit check (fast-path 403 + DB trigger 23514 safety net), duplicate check (fast-path 409 + unique index 23505 safety net), DSLD ingredient ingestion with substance resolution
- `GET /api/products/[id]` — ownership check, full product + ingredients
- `PATCH /api/products/[id]` — name/brand only, 10/min rate limit, UUID validation
- `DELETE /api/products/[id]` — soft delete (is_active=false), 10/min rate limit, UUID validation

**Infrastructure:**
- `src/lib/rate-limit.ts` — shared rate limiter (extracted from 3 duplicated inline copies)
- Migration `add_unique_subscriber_products_external` — unique partial index on `(user_id, data_source, external_id) WHERE external_id IS NOT NULL AND is_active = true`
- `AddProductRequest` in `api.ts` derived from Zod schema via `z.infer` (no duplicate interface)

### Key Design Decisions
- **DSLD is local DB, not external API.** 214K products loaded locally (12ms typeahead). External DSLD API was too slow (1.8s/query).
- **Substance resolution thresholds:** `>=0.8` matched, `>=0.5` ambiguous, `<0.5` unmatched. More permissive than enrichment pipeline (0.90) — intentional for user-facing ingredient matching where "ambiguous" is useful in the UI.
- **Ingredient ingestion is non-transactional.** If DSLD ingredient insert fails after product insert, product exists with 0 ingredients + `warning` in response. Acceptable for MVP.
- **Soft delete preserves data.** `is_active=false` keeps ingredient data for historical matching.
- **`updated_at` handled by DB trigger.** Not set manually in route handlers.
- **`product_category_id` deferred.** Removed from `UpdateProductSchema` until migration `005_product_categories` column is applied.

---

## Session 1b: Remaining Backend — PENDING

- [ ] **Ingredient parsing** (`src/lib/products/parse-ingredients.ts`) — Gemini Flash for photo/paste/URL parsing (non-DSLD products: cosmetics, food, manual entry)
- [ ] **Product classification** — Gemini Flash picks `product_type` + `product_category_slug` from controlled vocab
- [ ] **GSRS search utility** (`src/lib/products/gsrs.ts`) — queries local `substances` + `substance_names` tables (pg_trgm) for manual ingredient entry

---

## Session 2: Onboarding Frontend — PENDING

### Components to Build
- `AddProductForm.tsx` — type selector (Supplement/Food/Cosmetic), DSLD typeahead autocomplete, ingredient paste textarea (cosmetics)
- `ProductCard.tsx` — product name, type badge, ingredient count, status indicators (matched/ambiguous/unmatched counts)
- `IngredientConfirmation.tsx` — shows resolved ingredients with match status indicators
- `DSLDAutocomplete.tsx` — debounced search → dropdown results → select to add
- `GSRSAutocomplete.tsx` — manual ingredient search against local substances DB

### Pages
- `/app/products` — replace mock data with real API calls, add "Add Product" flow
- `/app/onboarding` — post-signup page, uses same `AddProductForm` component
- Onboarding routing: post-signup redirect, 0-products banner on feed

### Acceptance Criteria
- [ ] DSLD typeahead search works with <300ms latency
- [ ] Selecting a DSLD product shows ingredient preview with match status
- [ ] Product creation from DSLD populates `product_ingredients` with substance matches
- [ ] Product list shows accurate ingredient counts
- [ ] Plan limit enforced in UI (disable "Add" when at limit, show upgrade CTA)
- [ ] Duplicate detection shows clear error for already-added DSLD products
- [ ] Soft delete works from product list
- [ ] Post-signup onboarding flow guides first product addition
- [ ] 0-products state on feed shows "Add your first product" banner

---

## Deferred
- [ ] USDA FDC integration (food products — free API key from api.nal.usda.gov)
- [ ] Batch/CSV import for 50+ products
- [ ] Per-product Stripe billing updates (Phase 4C)
- [ ] Photo-to-ingredients via Gemini Flash vision
