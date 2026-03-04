# Phase 4B: Product Onboarding

**Complexity:** Medium | **Sessions:** 1-2 | **Dependencies:** Phase 4 (Auth)
**Purpose:** Allow subscribers to add their actual products after signup. Pull structured ingredient data from DSLD (supplements) and USDA FDC (food). Manual entry for cosmetics. Must come before Phase 5 since personalized emails require product profiles.

## Session Brief

```
TASK: Build the product onboarding flow — let subscribers add their actual
products and hydrate those products with ingredient data from external APIs.

WHAT TO READ FIRST:
- /memory-bank/architecture/data-schema.md — subscriber_products,
  product_ingredients, product_item_matches tables (added in Phase 1)
- /memory-bank/architecture/techStack.md — DSLD and USDA FDC API details

WHY THIS MATTERS:
Sectors (food/supplement/cosmetic) are derived from product categories.
Subscribers don't think in sectors — they think in products. "Which of my 47 products contains BHA?"
Product profiles are the foundation of personalized intelligence emails and
the product matching engine (Phase 4C). Without products, email is generic.

POST-SIGNUP ONBOARDING FLOW:
- After account creation, immediately redirect to /app/onboarding
- User is prompted to add their products before reaching the main dashboard
- Require at least 1 product before proceeding to /app/feed
- Onboarding step is skipped on subsequent logins if products exist

STEP 1: DSLD API UTILITY (src/lib/products/dsld.ts)

  NIH Dietary Supplement Label Database — for supplement products.
  This is a product lookup utility, NOT a pipeline fetcher. Called from
  API routes when a subscriber searches for their product.

  Endpoint: GET https://api.ods.od.nih.gov/dsld/v9/products
    ?name={query}    — search by product name
    Returns: products with ingredients, amounts, UNII codes

  Functions to implement:
  a) searchDSLD(query: string): returns product matches with metadata
  b) getDSLDProduct(dsldId: string): returns full product detail with
     ingredients list (ingredient_name, amount, unit, unii_code)
  c) No auth required for DSLD API (public)

  Key fields from DSLD response:
  - dsld_id (product ID in DSLD)
  - product_name, brand_name
  - serving_size, form
  - ingredients[]: { name, amount, unit, unii }

STEP 2: USDA FDC API UTILITY (src/lib/products/fdc.ts)

  USDA FoodData Central — for food products.
  Endpoint: GET https://api.nal.usda.gov/fdc/v1/foods/search
    ?query={name_or_upc}&api_key=USDA_FDC_API_KEY

  Functions:
  a) searchFDC(query: string): returns product matches
  b) getFDCProduct(fdcId: number): full product detail with nutrients/ingredients
  c) Env var: USDA_FDC_API_KEY (free key from api.nal.usda.gov)

  Note: FDC is better for packaged foods, not supplements. Route supplement
  queries to DSLD, food queries to FDC.

STEP 3: COSMETIC INGREDIENT PARSER (in API route or dedicated module)

  Cosmetics don't have a free structured ingredient database.
  Solution: paste-and-parse.

  a) User pastes the ingredient list from their cosmetic product label
  b) Call Gemini Flash with the paste:
     "Parse this cosmetic ingredient list into structured JSON. Each ingredient
      as {name, position_in_list}. Do not add amounts — they're not on labels."
  c) Returns structured ingredient rows → insert into product_ingredients
  d) Cosmetics products: set fdc_id = null, dsld_id = null

STEP 4: PRODUCT API ROUTES (src/app/api/products/route.ts)

  POST /api/products — add a product
  Body: { product_name, product_type: 'supplement'|'food'|'cosmetic',
          dsld_id?, fdc_id?, ingredients_paste? }

  Logic:
  1. Validate user is authenticated
  2. Check plan limits (Monitor: 5 products, Monitor+Research: unlimited)
     Return 403 if limit exceeded
  3. Insert into subscriber_products
  4. Based on product_type:
     - supplement: call getDSLDProduct(dsld_id) → insert ingredient rows
     - food: call getFDCProduct(fdc_id) → insert ingredient rows
     - cosmetic: call Gemini Flash with ingredients_paste → insert rows
  5. Normalize ingredient names at insert: store ingredient_normalized
     (lowercase, stripped punctuation, common synonyms resolved)
  6. Return created product with ingredient count
  7. Trigger Stripe product count update if needed (for per-product billing)

  GET /api/products — list user's products (with ingredient counts)
  DELETE /api/products/[id] — remove a product + its ingredients

STEP 5: PRODUCT MANAGEMENT PAGE (src/app/(app)/products/page.tsx)

  Shows the subscriber's current products + add/remove functionality.

  Sections:
  a) Header: "Your Products" + product count vs plan limit
     "Monitoring 3 of 5 included products"
  b) Product list: ProductCard for each product
     Shows product name, type badge, ingredient count, last match date
  c) Add Product form (AddProductForm.tsx):
     - Type selector: Supplement / Food / Cosmetic
     - Search input (calls DSLD or FDC API based on type)
     - Results list: select to add
     - For cosmetics: textarea to paste ingredient list
  d) Empty state: "Add your first product to get personalized intelligence"

STEP 6: ONBOARDING PAGE (src/app/(app)/onboarding/page.tsx)

  Post-signup page guiding the user through adding their first products.

  Steps:
  1. Welcome: "Let's set up your product monitoring"
  2. Product addition: embedded AddProductForm
  3. "Add another product" option
  4. "Start monitoring" CTA → navigates to /app/feed

  The onboarding page uses the same API routes and components as the
  product management page — don't duplicate logic.

INGREDIENT NORMALIZATION:

  Normalize ingredient names at insert time (in the POST /api/products handler):
  - Lowercase
  - Strip punctuation and special characters
  - Common synonym mapping:
    "vitamin c" → "ascorbic acid"
    "bha" → "butylated hydroxyanisole"
    "red no 3" → "erythrosine"
  - Store as ingredient_normalized
  This normalized field is what Phase 4C matches against.

COMPONENTS:
  src/components/app/ProductCard.tsx
    - Product name, type badge (Supplement/Food/Cosmetic)
    - Ingredient count, last activity
    - Remove button

  src/components/app/AddProductForm.tsx
    - Type selector
    - Search input with debounced API calls to DSLD/FDC
    - Results dropdown
    - Ingredient paste textarea (cosmetics)
    - Add button

ACCEPTANCE CRITERIA:
- [ ] Post-signup redirect to /app/onboarding works
- [ ] User must add at least 1 product before reaching /app/feed
- [ ] DSLD search returns supplement products with ingredients
- [ ] FDC search returns food products with ingredients
- [ ] Cosmetic paste → Gemini Flash → structured ingredients works
- [ ] product_ingredients are inserted with ingredient_normalized populated
- [ ] Product management page shows all user products
- [ ] Plan limits are enforced (5 products for Monitor tier)
- [ ] Remove product removes product + ingredients
- [ ] ProductCard and AddProductForm render correctly
- [ ] Per-product Stripe billing updates when products are added/removed

SUBAGENTS:
- After completion: code-reviewer (auth checks on API routes, plan limit enforcement)
```

## Files to Create
| File | Description |
|------|-------------|
| `src/lib/products/dsld.ts` | DSLD API wrapper — supplement product lookup |
| `src/lib/products/fdc.ts` | USDA FDC API wrapper — food product lookup |
| `src/app/api/products/route.ts` | CRUD product endpoints with plan limit checks |
| `src/app/(app)/products/page.tsx` | Product management page |
| `src/app/(app)/onboarding/page.tsx` | Post-signup onboarding flow |
| `src/components/app/ProductCard.tsx` | Product display card |
| `src/components/app/AddProductForm.tsx` | Product search + addition form |

## Env Vars to Add
| Var | Purpose |
|-----|---------|
| `USDA_FDC_API_KEY` | Free key from api.nal.usda.gov — required for FDC food search |

## Gotchas
- **DSLD is supplement-only.** Route food queries to USDA FDC. Don't use DSLD for food products.
- **USDA FDC API key is free** but must be registered at api.nal.usda.gov. Add USDA_FDC_API_KEY to env vars.
- **Cosmetic ingredient list parsing:** Gemini Flash is used here (not the pipeline Gemini). This is a lightweight one-shot call per cosmetic product.
- **Plan limits are billing-critical.** A Monitor subscriber who exceeds 5 products triggers a per-product charge ($6/product). Enforce this at the API level, not just UI.
- **Ingredient normalization is shared with Phase 4C.** The normalizer logic used at insert time must match the normalizer in Phase 4C's matcher exactly. Consider extracting to `src/lib/products/normalize.ts` shared by both.
- **Onboarding guard:** Middleware or page-level check should redirect unauthenticated users and users with 0 products appropriately.
