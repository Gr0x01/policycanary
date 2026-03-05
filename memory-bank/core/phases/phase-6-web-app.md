# Phase 6: Web App

**Complexity:** High | **Sessions:** 3-4 | **Dependencies:** Phase 2C, Phase 4, Phase 4B
**Purpose:** Build the authenticated web application — feed, item detail, enforcement database, AI search, trends, and bookmarks.

### Session Brief

```
TASK: Build the Policy Canary web application — the depth layer for paid
subscribers. Feed, item detail, enforcement database, AI search, trends,
and bookmarks.

WHAT TO READ FIRST:
- /memory-bank/core/projectbrief.md — web app feature list
- /memory-bank/architecture/data-schema.md — query patterns section
- /memory-bank/architecture/llm-data-flow.md — search architecture
- .claude/agents/brand-guardian.md — visual identity for app
- .claude/skills/frontend-design/SKILL.md — design guidelines

THE WEB APP IS THE DEPTH LAYER. Users get intelligence via email, come to
the app when they need to dig deeper. It earns usage naturally — subscriber
gets an email, needs to research something, logs in.

PAGE 1: REGULATORY FEED (src/app/(app)/feed/page.tsx)

  The main page after login. Shows regulatory items relevant to the user's
  products, sorted by date and match score.

  Features:
  - Filter bar: product category filter, item_type filter,
    date range, topic filter
  - Item cards showing: title, published_date, item_type badge,
    action_type badge (color-coded), summary (first 2 lines),
    product category tags, topic tags
  - Click → item detail page
  - Bookmark button on each card
  - Infinite scroll or pagination (50 items per page)
  - "New since last visit" indicator
  - "My Products" tab: shows only items that matched the subscriber's products
    (queries product_item_matches for the user). Default view.
  - "All FDA" tab: general feed filtered by product types in subscriber's portfolio
  - Product match indicator on item cards: "Matches: Marine Collagen Powder (score: 0.8)"

  Default query (My Products tab):
    SELECT ri.*, ie.summary, ie.regulatory_action_type, sp.product_name, pim.match_score
    FROM product_item_matches pim
    JOIN subscriber_products sp ON pim.product_id = sp.id
    JOIN regulatory_items ri ON pim.item_id = ri.id
    JOIN item_enrichments ie ON ri.id = ie.item_id
    WHERE sp.user_id = current_user_id
    ORDER BY pim.match_score DESC, ri.published_date DESC

PAGE 1.5: PRODUCTS (src/app/(app)/products/page.tsx)
  Built in Phase 4B. Linked from sidebar in this phase.
  Navigation item: "Products" in AppSidebar.tsx
  Shows product list, add/remove products, ingredient counts.

PAGE 1.6: PRODUCT DETAIL (src/app/(app)/products/[id]/page.tsx) — stretch goal
  Shows a specific product with all regulatory matches for it.
  Query: all product_item_matches WHERE product_id = $1
  Sections: product info, ingredient list, regulatory matches timeline

PAGE 2: ITEM DETAIL (src/app/(app)/items/[id]/page.tsx)

  Full view of a single regulatory item with all enrichment data.

  Sections:
  a) Header: title, published_date, item_type, source link
  b) Summary: plain-English summary from enrichment
  c) Impact Assessment: enrichment details
     - Action type badge, summary, action_items,
       deadline, cited regulations
  d) Citations: claim → source quote pairs
     - quote_verified indicator
     - Source link for each citation
  e) Related Items: from item_relations table
     - "Supersedes", "Amends", "Related Enforcement"
  f) Topics: topic tags with links to topic-filtered feed
  g) For enforcement items: enforcement_details
     - Company, violations, recall classification, distribution pattern
  h) Raw source link: always visible for verification

  Bookmark button. Share button (copy link).

PAGE 3: ENFORCEMENT DATABASE (src/app/(app)/enforcement/page.tsx)

  Searchable/filterable database of enforcement actions.

  Query: enforcement_details JOIN regulatory_items JOIN item_enrichments

  Features:
  - Table view with sortable columns:
    company_name, item_type (warning_letter/recall/import_alert),
    violation_types, published_date, regulatory_action_type
  - Filters: company search, violation type, product category, date range,
    item_type, recall classification
  - Click → item detail page
  - Export option (CSV) for compliance teams
  - Stats bar at top: total warning letters, recalls, by product category

PAGE 4: AI SEARCH (src/app/(app)/search/page.tsx)

  RAG-powered search: ask a question, get a sourced answer.

  Implementation:
  a) Search input: "What are the labeling requirements for collagen
     supplements?"

  b) Backend (src/app/api/search/route.ts):
     1. Embed the query using text-embedding-3-small (768d)
     2. pgvector similarity search on item_chunks:
        SELECT ic.content, ic.section_title, ri.title, ri.source_url,
               ri.published_date,
               1 - (ic.embedding <=> $1) AS similarity
        FROM item_chunks ic
        JOIN regulatory_items ri ON ic.item_id = ri.id
        WHERE 1 - (ic.embedding <=> $1) > 0.7
        ORDER BY similarity DESC LIMIT 10
     3. Filter by user's product categories (Pro) or all (All Access)
     4. Pass retrieved chunks + query to Claude Sonnet:
        "Answer the following question using ONLY the provided sources.
         Cite each claim with [Source N]. If you cannot answer from the
         sources, say so."
     5. Stream the response back to the client

  c) Frontend:
     - Search input with recent searches
     - Streaming response display
     - Source cards below the answer (clickable → item detail)
     - "Based on X sources from [date range]" disclaimer

  d) pgvector optimization notes:
     - HNSW index must exist (created after Phase 2B loads data)
     - Set probes for IVFFlat if used instead: SET ivfflat.probes = 10
     - For HNSW: ef_search defaults are usually fine
     - Monitor query latency — should be <100ms for 10K chunks

PAGE 5: TRENDS (src/app/(app)/trends/page.tsx)

  Visualization of trend_signals data.

  Features:
  - Category/sector selector
  - Rising topics: cards showing topic_label, item_count, trend_direction,
    period, trend_summary
  - Comparison: current period vs previous period counts
  - Click on a topic → filtered feed showing all items with that topic
  - Bar charts or simple visualizations (keep it simple — no heavy
    charting library unless needed)

PAGE 6: BOOKMARKS (src/app/(app)/bookmarks/page.tsx)

  Simple list of bookmarked items.

  Query: user_bookmarks JOIN regulatory_items JOIN item_enrichments
  Sorted by bookmark date DESC.

  Features:
  - Same item card format as feed
  - Remove bookmark button
  - Empty state: "No bookmarks yet. Bookmark items from the feed."

SHARED COMPONENTS:

  src/components/app/
    AppSidebar.tsx          # Left sidebar navigation
                            # Links: Feed, Products, Enforcement*, Search*, Trends*, Bookmarks
                            # (* = Monitor+Research only)
    ItemCard.tsx            # Regulatory item card (used in feed, bookmarks)
    ActionTypeBadge.tsx     # Color-coded regulatory action type indicator
    CategoryBadge.tsx       # Product category tag
    TopicTag.tsx            # Topic tag with link
    FilterBar.tsx           # Shared filter controls
    SearchInput.tsx         # Search input with streaming support
    CitationBlock.tsx       # Claim + quote + source link
    EnforcementTable.tsx    # Sortable enforcement table
    BookmarkButton.tsx      # Toggle bookmark

API ROUTES:

  src/app/api/search/route.ts    — RAG search endpoint (streaming)
  src/app/api/bookmarks/route.ts — CRUD bookmarks (POST/DELETE)

ACCOUNT SETTINGS:

  Account settings: Show product count + plan limits.
  "You're monitoring X products. Your plan includes 5; you're paying for X extra."

ACCEPTANCE CRITERIA:
- [ ] Feed page loads items matched to user's products
- [ ] All filters work (product category, type, date, topic)
- [ ] Item detail page shows all enrichment data
- [ ] Citations display with verified/unverified indicators
- [ ] Related items show cross-references
- [ ] Enforcement database is searchable and filterable
- [ ] AI search returns sourced answers via streaming
- [ ] Search respects access level (Pro vs All Access)
- [ ] Trends page shows rising topics with context
- [ ] Bookmarks work (add/remove/list)
- [ ] All pages are responsive
- [ ] Navigation between pages is smooth
- [ ] Run `npm run test:e2e` — app navigation tests pass
- [ ] Feed "My Products" tab shows product-matched items with match scores
- [ ] "Products" navigation link is in sidebar
- [ ] Feed works correctly when user has no products (empty state)

SUBAGENTS:
- Before starting: Read frontend-design skill + brand guardian
- For complex UI: use ui-designer for layout decisions
- During implementation: frontend-developer for component architecture
- After: code-reviewer for security (especially search API, SQL injection)
```

### Files to Create
| File | Description |
|------|-------------|
| `src/app/(app)/feed/page.tsx` | Main regulatory feed |
| `src/app/(app)/items/[id]/page.tsx` | Item detail page |
| `src/app/(app)/enforcement/page.tsx` | Enforcement database |
| `src/app/(app)/search/page.tsx` | AI search interface |
| `src/app/(app)/trends/page.tsx` | Trend analysis page |
| `src/app/(app)/bookmarks/page.tsx` | Saved items |
| `src/app/api/search/route.ts` | RAG search API (streaming) |
| `src/app/api/bookmarks/route.ts` | Bookmark CRUD API |
| `src/components/app/*.tsx` | 10+ shared app components |

### Gotchas
- **pgvector query performance:** Ensure HNSW index exists before this phase. Without it, similarity search scans the full table. With 10K+ chunks, this is unacceptably slow.
- **Streaming search responses:** Use Vercel AI SDK `streamText()` with the `useChat()` hook on the client. This gives real-time response rendering.
- **Access control:** Product-matched items are user-scoped. General feed items are public. This filtering must happen server-side, not client-side.
- **SQL injection in search/filter:** Use parameterized queries ONLY. Never interpolate user input into SQL.
- **Feed pagination:** Use cursor-based pagination (last item's published_date + id), not OFFSET. OFFSET gets slower as pages increase.
- **Enforcement export:** CSV export should be server-rendered to avoid large client-side data transfers.

### Post-Phase Update: Pre-Email Plumbing (2026-03-06)

Product page enriched as email deep-link destination:

- **URL deep linking** — `?product={uuid}&item={uuid}` on `/app/products`. Server validates UUIDs, client syncs via `replaceState`. Ready for email CTAs.
- **Ingredient highlighting** — fixed from first-ingredient heuristic to actual `substance_id` intersection between regulatory item substances and product ingredients.
- **Portfolio summary header** — centered bar above 3-panel layout with product count/max and status breakdown (need attention, watching, all clear).
- **Product status banner** — per-product stats row: active items, action item total, nearest deadline, ingredients monitored. Only shows when matches > 0.
- **Use context badges** — GSRS code system labels (e.g., "Food Additive (JECFA)") on ingredients via `getIngredientUseCodes()` querying `substance_codes` table.
- **Cross-sector alert flags** — amber "Cross-sector" badge on MatchCards for items with `signal_source = 'cross_reference'` tags.
- **Key files changed**: `queries.ts` (+`getIngredientUseCodes`, `ProductVerdictItem` extended with `substance_ids` + `has_cross_reference`), `[id]/route.ts` (returns `use_codes`), `ProductsLayout.tsx` (URL sync, summary header, substance intersection), `IntelligencePanel.tsx` (status banner, initial expanded item), `ProductContextPanel.tsx` (highlight fix, use context badges), `MatchCard.tsx` (cross-sector badge).

### Post-Phase Update: Lifecycle State System (2026-03-06)

`urgency_score` is **no longer used for display**. It has been replaced by the lifecycle state system:

- **`src/lib/utils/lifecycle.ts`** — pure `getLifecycleState()` classifies items as `urgent | active | grace | archived` from `item_type`, `published_date`, and `deadline`. No DB changes.
- **Feed** defaults to live items only (urgent/active/grace). "Include Archived" toggle pill reveals older items.
- **FeedItemCard** shows lifecycle dots (red=urgent, amber=grace) + `opacity-60` for grace/archived.
- **FeedDetailPanel** shows always-visible lifecycle badge (replaces conditional `urgencyBadge()`).
- **ProductsLayout** splits verdicts into live (`activeMatches`) vs archived (`resolvedHistory`) via `isLiveState()`. Status derived from live verdicts only.
- **MatchCard** maps lifecycle→status (`urgent→action_required`, `active→under_review`, `grace→watch`, `archived→all_clear`).
- **`getProductVerdictCounts()`** uses `get_live_verdict_counts` RPC — lifecycle filtering runs entirely in Postgres. Sidebar badges reflect live verdicts only.
- **`getFeedItems()`** adds `published_date >= now - 120d` SQL floor when `includeArchived=false`, preventing ancient items from being fetched.
