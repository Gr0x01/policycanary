# Phase 2B: Enrichment Engine

**Complexity:** High (most critical code) | **Sessions:** 2-3 | **Dependencies:** Phase 2A-1 (needs data in DB)
**Purpose:** Build the LLM enrichment pipeline that transforms raw regulatory data into structured intelligence. This is the core product logic.

### Session Brief

```
TASK: Build the enrichment engine — the LLM pipeline that takes raw
regulatory items and produces structured, product-centric intelligence.

THIS IS THE MOST CRITICAL CODE IN THE PROJECT. Quality here = product quality.

FUNDAMENTAL DESIGN PRINCIPLE — READ THIS FIRST:
  This is a product-centric monitoring tool. The value is:
  "YOUR Marine Collagen Powder is affected" — not "here's what happened in supplements."

  THE TWO MATCHING SIGNAL TYPES:

  1. INGREDIENT-LEVEL SIGNALS ("BHA is banned")
     Vehicle:  regulatory_item_substances → substance_id FK
     Phase 4C: match_type = 'direct_substance'
               joins regulatory_item_substances.substance_id
                  to product_ingredients.substance_id
     Examples: ingredient bans, GRAS revocations, substance restrictions,
               recalls citing specific ingredients

  2. CATEGORY-LEVEL SIGNALS ("all cosmetic facilities must register by July 2026")
     Vehicle:  item_enrichment_tags (tag_dimension × tag_value pairs)
     Phase 4C: match_type = 'category_overlap'
               joins item_enrichment_tags against subscriber product profile
     Examples: GMP rule changes, facility registration deadlines,
               labeling format requirements, category-wide testing requirements
     Key:      affected_ingredients is EMPTY for these items — do not hallucinate

  WHAT item_enrichment_tags MUST COVER (all 4 dimensions, not just product_type):

    tag_dimension='product_type'  → "supplement", "food", "cosmetic"
                                    Maps to subscriber_products.product_type
                                    This IS the product matching key

    tag_dimension='facility_type' → "cosmetic manufacturer", "supplement manufacturer",
                                    "food facility", "importer", "contract manufacturer"
                                    Matches subscribers who operate these facility types

    tag_dimension='claims'        → "structure/function claim", "health claim",
                                    "organic", "non-GMO"
                                    Matches subscribers whose products make these claims

    tag_dimension='regulation'    → "MoCRA", "DSHEA", "FSMA", "CGMP Part 111",
                                    "21 CFR 172", "MoCRA Section 605"
                                    Cross-references for the matching engine

  CRITICAL SEPARATION:
    segment_impacts  → PRESENTATION ONLY. Used for the generic weekly digest
                       and UI filtering. NOT used by the Phase 4C matching engine.
    item_enrichment_tags → MATCHING. This is what Phase 4C queries. Must be
                           populated accurately for every item.

  The enrichment prompt MUST produce item_enrichment_tags across all 4 dimensions.
  Ingredient-level items get tags AND substances.
  Category-level items get tags only — never hallucinate substances.

  Primary outputs that drive matching:
    1. regulatory_action_type   — what is happening (drives email priority)
    2. affected_ingredients     → regulatory_item_substances (ingredient signals)
    3. item_enrichment_tags     → all 4 dimensions (category signals)
    4. deadline                 — is there a compliance date?

  Secondary outputs (digest routing / display / search):
    5. segments/segment_impacts — for generic digest only
    6. affected_product_types   — granular free text for display and AI search
    7. summary, citations, topics — supporting metadata

WHAT TO READ FIRST:
- /memory-bank/architecture/data-schema.md — enrichment tables (Layer 2+3+4)
- /memory-bank/architecture/llm-data-flow.md — full enrichment flow diagram
- /memory-bank/architecture/techStack.md — model reference (DO NOT change)
- /tests/golden/fixtures.ts — the quality target (what enrichment must produce)

ARCHITECTURE:
  Raw regulatory_item → Gemini enrichment → structured outputs → DB
  Then: item_chunks → OpenAI embeddings → vector store

  Two steps:
  1. LLM enrichment (Gemini Flash/Pro → item_enrichments, segment_impacts,
     item_enrichment_tags, regulatory_item_substances, item_citations)
  2. Embedding generation (OpenAI → item_chunks with vectors)

STEP 1: ENRICHMENT PROMPT (src/pipeline/enrichment/prompts.ts)

  THE ENRICHMENT PROMPT IS THE PRODUCT. Spend time on this.

  Single Gemini call per item. Structured output via Zod schema.
  Uses Vercel AI SDK generateObject() with schema.

  Input to the prompt:
  - title
  - raw_content (abstract or full text)
  - item_type
  - cfr_references (if available)
  - issuing_office (if available)
  - action_text (if available)

  Output schema — ORDER MATTERS, it signals priority to the LLM:

  {
    // ── TIER 1: drives product matching and email priority ──────────────────
    regulatory_action_type: enum,
      // What is actually happening. One of:
      // "recall" | "ban_restriction" | "proposed_restriction" | "safety_alert"
      // | "cgmp_violation" | "testing_requirement" | "labeling_change"
      // | "import_violation" | "guidance_update" | "adverse_event_signal"
      // | "administrative"

    affected_ingredients: string[],
      // SPECIFIC substances affected, as they appear on product labels.
      // e.g. ["BHA", "butylated hydroxyanisole", "Red No. 3", "whey protein isolate"]
      // Include BOTH common name AND systematic name when known — both needed for
      // GSRS substance table matching. Empty array if no specific substances.
      // DO NOT hallucinate — if the document doesn't name a substance, leave empty.

    affected_product_types: string[],
      // GRANULAR product types — not just 3 buckets.
      // Good: ["protein powder", "softgel supplement", "food preservative", "topical SPF"]
      // Bad:  ["food", "supplement", "cosmetic"]
      // These are used for pre-filtering BEFORE substance matching.

    deadline: string | null,
      // ISO date of compliance deadline if stated. Null otherwise.

    // ── TIER 2: segment routing (generic digest) ────────────────────────────
    segments: [{
      segment: "supplements" | "cosmetics" | "food",
      relevance: "critical" | "high" | "medium" | "low" | "none",
      impact_summary: string,   // Segment-specific "what this means for you" (1-2 sentences)
      action_items: string[],   // Specific actions with deadlines where possible
      who_affected: string,     // "All supplement manufacturers using X"
    }],
      // Only include segments with relevance != "none".
      // A single item can legitimately affect 0, 1, 2, or all 3 segments.
      // If issuing_office is CDER or CDRH, all segments should be empty.

    // ── TIER 3: supporting metadata ─────────────────────────────────────────
    summary: string,            // 2-4 sentence plain-English summary
    key_regulations: string[],  // ["21 CFR 111.70", "MoCRA Section 605"]
    key_entities: string[],     // Companies, agencies cited
    confidence: number,         // 0-1 self-assessed. Low confidence is OK; overclaiming is not.

    topics: [{
      slug: string,             // Must match existing topic slugs — see controlled vocabulary
      confidence: number
    }],

    citations: [{
      claim_text: string,       // The AI assertion
      quote_text: string,       // EXACT source text supporting it
      source_section: string    // "Background", "Regulatory Text", etc.
    }]
  }

  PROMPT DESIGN GUIDELINES:

  - System prompt: "You are a regulatory affairs expert analyzing FDA documents
    for companies that make food, dietary supplement, and cosmetic products. Your
    primary job is to identify: (1) what specific ingredients or substances are
    affected, (2) what specific product types are affected, and (3) what action
    is required and by when."

  - For affected_ingredients: "List the SPECIFIC ingredients, substances, or
    chemical names directly regulated by this action. Use the names as they
    appear on product labels (e.g., 'BHA' not 'butylated hydroxyanisole' as
    the primary — but list both if you know both). This field is critical for
    matching against subscriber products — precision matters more than breadth.
    Leave empty rather than guess."

  - For affected_product_types: "Be specific. Not 'dietary supplement' but
    'protein powder', 'softgel capsule', 'herbal supplement'. Not 'food' but
    'food preservative', 'ready-to-eat meal', 'infant formula'. This field is
    for DISPLAY and AI search — it is the granular human-readable version."

  - For item_enrichment_tags (THE MATCHING LAYER — must be populated for every item):
    "For EACH of the four dimensions, extract all applicable values:

    product_type: Which of 'supplement', 'food', 'cosmetic' does this affect?
      List every applicable type. This is the primary product-matching key.
      A BHA ban → ['supplement', 'food', 'cosmetic']
      A MoCRA registration deadline → ['cosmetic']
      A CGMP supplement warning letter → ['supplement']

    facility_type: What kind of facility is directly implicated?
      Examples: 'supplement manufacturer', 'cosmetic manufacturer',
      'food facility', 'importer', 'contract manufacturer', 'outsourcing facility'
      Leave empty for items affecting products, not facilities specifically.

    claims: Are specific product claims affected or at issue?
      Examples: 'structure/function claim', 'health claim', 'organic', 'non-GMO'
      Leave empty if no specific claims are implicated.

    regulation: What named regulatory programs or CFR parts apply?
      Examples: 'MoCRA', 'DSHEA', 'FSMA', 'CGMP Part 111', '21 CFR 172'
      Always populate this when CFR references are available.

    These tags drive product matching for category-level regulatory changes
    (GMP rules, facility registration, labeling format requirements).
    Items with no specific ingredients must still have accurate product_type tags."

  - For regulatory_action_type: "Classify the primary regulatory action. A recall
    is a recall. A warning letter about CGMP is a cgmp_violation. A proposed rule
    that would restrict an ingredient is a proposed_restriction. Be accurate —
    this drives how urgently subscribers are notified."

  - For segments: "Only populate for items that directly affect the business
    operations of food manufacturers, dietary supplement manufacturers, or
    cosmetic/personal care product manufacturers. If the issuing office is CDER
    or CDRH, or if the subject is pharmaceutical drugs, medical devices, or
    veterinary products, leave segments empty. A segment entry means 'a company
    making this type of product needs to take action or be aware.'"

  - For citations: "For EVERY claim you make, cite the EXACT text from the
    source document. If you cannot find supporting text, do not make the claim."

  - For action items: "Be specific. Include deadlines, CFR sections to review,
    forms to submit. Not 'review your processes' but 'review identity testing
    SOPs for 21 CFR 111.70(b) compliance by [date].'"

  - For topics: provide the full list of valid topic slugs and say
    "Select ONLY from this list. Do not invent new topics."

  - Flash vs Pro routing: Use Flash for simple items (recalls, RSS alerts,
    adverse event summaries). Use Pro for complex items (proposed rules,
    final rules, warning letters with detailed analysis).

STEP 2: ENRICHMENT PROCESSOR (src/pipeline/enrichment/processor.ts)

  Main enrichment function:
  async function enrichItem(item: RegulatoryItem): Promise<EnrichmentResult>

  a) Determine model: Flash for simple items, Pro for complex
     - Flash: recalls, safety_alerts, press_releases, rss items
     - Pro: rules, proposed_rules, warning_letters, guidance
     - Notices: Flash by default, Pro if abstract > 500 words

  b) Call Gemini via Vercel AI SDK generateObject()
     const { object } = await generateObject({
       model: isComplex ? geminiPro : geminiFlash,
       schema: enrichmentOutputSchema,
       prompt: buildEnrichmentPrompt(item),
     })

  c) Post-process:
     - Verify citations: substring check quote_text in raw_content
       Set quote_verified = true/false on each citation
     - Validate topic slugs against topics table, drop any not in vocabulary
     - RULE-BASED VALIDATORS (run after LLM, before DB write):
       · CDER/CDRH issuing_office → clear segments[] regardless of LLM output
       · CFR Parts 500-599 in cfr_references → animal drugs → clear segments[]
       · item_type = recall AND no affected_ingredients → flag needs_review
       · Any segment claim when issuing_office is a device center → clear segment

  d) Insert results:
     - item_enrichments: summary, key_regulations, key_entities, regulatory_action_type,
       enrichment_model, enrichment_version, confidence, raw_response,
       affected_ingredients, affected_product_types, deadline
     - segment_impacts: one row per segment with relevance != 'none'
       Copy published_date from regulatory_items for denormalization
     - item_citations: one row per citation
     - item_topics: one row per topic tag
     - regulatory_item_substances: one row per affected_ingredient
       (attempt GSRS lookup by name; set match_status accordingly)

  e) Error handling:
     - Invalid structure: log, set processing_status = 'parse_error', skip
     - Rate limited: exponential backoff, retry up to 3 times
     - Never crash the pipeline on a single item failure

STEP 3: EMBEDDING GENERATION (src/pipeline/enrichment/embeddings.ts)

  After enrichment, chunk the item and generate embeddings.

  a) Chunking strategy (section-based):
     - Split raw_content by section headers (if HTML/structured)
     - Each section becomes a chunk
     - Also create chunks from segment_impacts.impact_summary
       (segment-specific chunks get segment_impact_id set)
     - Target chunk size: 500-1000 tokens
     - If a section exceeds 1500 tokens, split at paragraph boundaries

  b) Generate embeddings:
     Use Vercel AI SDK embed() with text-embedding-3-small
     const { embedding } = await embed({
       model: openaiEmbeddings,
       value: chunkText,
     })

     EMBEDDING DIMENSIONS: The schema uses halfvec (not vector). Check the
     actual column type in item_chunks before setting dimensions. If halfvec,
     use 1536d (default). If vector(768), pass dimensions: 768.
     ASK if unclear — wrong dimensions = unusable embeddings.

  c) Insert into item_chunks:
     chunk_index, section_title, content, embedding, token_count

  d) Batch processing: batches of 20-50 to avoid rate limits.

STEP 4: ENRICHMENT RUNNER (src/pipeline/enrichment/runner.ts)

  a) Query unenriched items:
     SELECT * FROM regulatory_items
     WHERE id NOT IN (SELECT item_id FROM item_enrichments)
     AND processing_status = 'ok'
     ORDER BY published_date DESC

  b) Process each item: enrichItem() → generateEmbeddings()

  c) After enrichItem(): call matchItemToProducts(itemId) [Phase 4C]
     The matcher lives in src/pipeline/matching/matcher.ts.

  d) Track progress: log to pipeline_runs with source = 'enrichment'

  e) Support partial runs: unenriched query naturally resumes
  f) Support re-enrichment: parameter for enrichment_version < CURRENT_VERSION

CROSS-REFERENCE INFERENCE LAYER (BUILT — 2026-03-04):
  After LLM extraction, two additional steps in the enrichment pipeline:

  Step 1b: DETERMINISTIC USE-CONTEXT LOOKUP (src/pipeline/enrichment/cross-reference.ts)
    lookupUseContexts(substanceIds, supabase) → Map<substanceId, UseContext[]>
    Queries substance_codes table for resolved substances (similarity >= 0.95).
    All 96 GSRS code systems stored; filtering to 9 relevant systems at query time.
    Maps 9 GSRS code systems → 8 UseContextCategory types:
    - CFR Part 170-189 → food_additive (175-178 → food_contact checked first)
    - CFR Part 73-82 → color_additive
    - CFR Part 310-369 → otc_drug
    - CFR Part 700-740 → cosmetic_ingredient
    - CODEX/JECFA → food_additive (+ functional class from comments)
    - DSLD → supplement_ingredient
    - RXCUI/DRUG BANK/DAILYMED → pharmaceutical (note: GSRS spells "DRUG BANK" with space)
    - EPA PESTICIDE CODE → pesticide
    - Food Contact Sustance Notif, (FCN No.) → food_contact (note: GSRS has typo)
    NOT in GSRS: CIR (cosmetic) — needs separate source.
    Pure TypeScript, no LLM. GSRS codes are ground truth.

  Step 1c: LLM CROSS-SEGMENT INFERENCE (same file)
    inferCrossSegments(output, useContextMap, resolvedSubstances, google) → CrossReferenceOutput | null
    Only fires when use contexts reveal segments BEYOND Step 1's direct extraction.
    Gemini 2.5 Pro with thinking (budget: 4096). Reasons about:
    - Exposure routes (oral vs dermal vs inhalation)
    - Regulatory precedent (FDA historically extends food bans to supplements)
    - Nature of the regulatory action (cancer risk vs labeling change)
    - When NOT to extend (company-specific, labeling-only, import-specific)
    Confidence threshold: >= 0.7. Below that, not included.
    NON-FATAL: if Step 1c fails, item proceeds with direct-only signals.

  signal_source column on segment_impacts and item_enrichment_tags:
    'direct' = from Step 1 LLM extraction
    'cross_reference' = from Step 1c inference
    Additive-only: Step 1c NEVER modifies Step 1's direct extraction.

  Schema: substance_codes table + signal_source columns (migration 002 applied).
  GSRS bootstrap complete: 949K codes, 96 systems, 166K substances with codes.
  Bootstrap captures ALL code systems; filtering at query time in cross-reference.ts.
  Cost: ~$0.02/call, fires on ~20-30% of items.

CRITICAL DECISIONS:
- enrichment_version starts at 1. Bump when prompt/schema changes.
- Re-enrichment inserts new version, keeps old for comparison.
- Flash for high-volume/simple, Pro for complex — routing is automatic.
- Citation verification is best-effort — flag unverified, don't discard.
- Topic slugs MUST match the controlled vocabulary in the topics table.
- Rule-based validators run AFTER LLM output — they override LLM misclassifications.

QUALITY GATE — BEFORE FULL BACKFILL:
  Run the golden fixtures: tests/golden/fixtures.ts
  All 10 items must pass. Negative cases (CDER WLs, device alerts, animal drug rules)
  are the most critical — false positives on these cause wrong product matches.

ACCEPTANCE CRITERIA:
- [ ] Enrichment prompt produces structured output matching the Zod schema
- [ ] regulatory_action_type is populated and accurate for all item types
- [ ] affected_ingredients uses label-friendly names (e.g. "BHA" not just "butylated hydroxyanisole")
- [ ] affected_product_types is granular ("protein powder" not just "dietary supplement")
- [ ] Flash/Pro routing works correctly based on item_type
- [ ] Rule-based validators fire correctly (CDER/CDRH → clear segments)
- [ ] Citation verification checks quote_text against raw_content
- [ ] Topic slugs are validated against the topics table
- [ ] Segment impacts are created for each relevant segment
- [ ] Embeddings are generated at correct dimensions (confirm halfvec vs vector)
- [ ] Section-based chunking works for various content formats
- [ ] Error handling: bad items are flagged, not crashed on
- [ ] Re-enrichment with version bumping works
- [ ] Pipeline can be interrupted and resumed
- [ ] Golden fixtures pass: tests/golden/fixtures.ts (10 items, ingredient-first assertions)

SUBAGENTS:
- During development: test against the 728 existing DB records
- After completion: code-reviewer for prompt injection risks, error handling
- Quality gate: run golden fixtures before any full backfill
```

### Files Created
| File | Description | Status |
|------|-------------|--------|
| `src/pipeline/enrichment/prompts.ts` | Enrichment prompt templates + Zod output schema | Done |
| `src/pipeline/enrichment/processor.ts` | Main enrichment function + rule-based validators + cross-ref integration | Done |
| `src/pipeline/enrichment/cross-reference.ts` | Steps 1b (use-context lookup) + 1c (LLM cross-segment inference) | Done |
| `src/pipeline/enrichment/content-fetch.ts` | Full FDA page content fetching for thin RSS items | Done |
| `src/pipeline/enrichment/embeddings.ts` | Chunking + embedding generation | Done |
| `src/pipeline/enrichment/runner.ts` | Orchestration — content-fetch → enrich → embed per item | Done |

### Schema Note
`item_enrichments` needs a `regulatory_action_type` column (text with CHECK constraint).
Apply migration before running the enrichment pipeline.

### Gotchas
- **Embedding dimensions:** Column is `halfvec` not `vector`. Check the migration before
  setting dimensions. Wrong dimensions = embeddings silently stored wrong.
- **Gemini structured output:** `generateObject()` with Zod schema works but test edge cases.
  RSS items may have only a title + one sentence — the pipeline must handle gracefully.
- **Ingredient extraction vs hallucination:** The pipeline must NOT invent ingredient names.
  If the document doesn't name a substance, `affected_ingredients` stays empty. This is
  preferable to a false match.
- **Citation verification is fuzzy:** LLMs paraphrase. Substring match catches exact quotes;
  flag paraphrased ones as unverified rather than discarding.
- **Topic slug mismatch:** LLM may invent slugs. Filter and log — useful for vocabulary expansion.
- **Rate limits:** Gemini Pro is more restrictive. Backfill should throttle Pro calls.
- **HNSW index:** Create AFTER 1,000+ chunks:
  `CREATE INDEX CONCURRENTLY idx_item_chunks_embedding ON item_chunks USING hnsw (embedding halfvec_cosine_ops);`
