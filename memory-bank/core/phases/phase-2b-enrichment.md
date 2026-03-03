# Phase 2B: Enrichment Engine

**Complexity:** High (most critical code) | **Sessions:** 2-3 | **Dependencies:** Phase 2A-1 (needs data in DB)
**Purpose:** Build the LLM enrichment pipeline that transforms raw regulatory data into structured intelligence. This is the core product logic.

### Session Brief

```
TASK: Build the enrichment engine — the LLM pipeline that takes raw
regulatory items and produces structured intelligence (summaries, segment
impacts, action items, citations, topic tags, embeddings).

THIS IS THE MOST CRITICAL CODE IN THE PROJECT. The enrichment output IS
the product. Quality here = product quality.

WHAT TO READ FIRST:
- /memory-bank/architecture/data-schema.md — enrichment tables (Layer 2+3)
- /memory-bank/architecture/llm-data-flow.md — full enrichment flow diagram
- /memory-bank/architecture/techStack.md — model reference (DO NOT change)
- /memory-bank/research/data-validation.md — what the raw data looks like

ARCHITECTURE:
  Raw regulatory_item → Gemini enrichment → structured outputs → DB
  Then: item_chunks → OpenAI embeddings → vector store

  Two steps:
  1. LLM enrichment (Gemini Flash/Pro → item_enrichments, segment_impacts,
     item_citations, item_topics)
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

  Requested outputs (as structured JSON via Zod schema):

  {
    summary: string,          // 2-4 sentence plain-English summary
    key_regulations: string[],  // ["21 CFR 111.70", "MoCRA Section 605"]
    key_entities: string[],     // Companies, ingredients, agencies
    confidence: number,         // 0-1 self-assessed
    affected_ingredients: string[],   // e.g. ["BHA", "Red No. 3", "whey protein isolate"]
                                      // Used by Phase 4C matching engine to score subscriber products
    affected_product_types: string[], // e.g. ["dietary supplement", "food additive", "cosmetic"]
                                      // Broad categories for pre-filtering before ingredient match

    segments: [{
      segment: "supplements" | "cosmetics" | "food",
      relevance: "critical" | "high" | "medium" | "low" | "none",
      impact_summary: string,   // Segment-specific "what this means for you"
      action_items: string[],   // Specific actions with deadlines
      who_affected: string,     // "All supplement manufacturers using..."
      deadline: string | null   // ISO date if segment-specific deadline
    }],

    topics: [{
      slug: string,             // Must match existing topic slugs
      confidence: number        // 0-1
    }],

    citations: [{
      claim_text: string,       // The AI assertion
      quote_text: string,       // EXACT source text supporting it
      source_section: string    // "Background", "Regulatory Text", etc.
    }]
  }

  PROMPT DESIGN GUIDELINES:
  - Tell the model: "You are a regulatory affairs expert analyzing FDA
    documents for food, supplement, and cosmetic companies."
  - For segments: "Assess relevance to EACH of the three segments
    independently. A single rule can affect multiple segments differently."
  - For citations: "For EVERY claim you make, cite the EXACT text from
    the source document. If you cannot find supporting text, do not make
    the claim."
  - For action items: "Be specific. Include deadlines, CFR sections to
    review, forms to submit. Not 'review your processes' but 'review
    identity testing SOPs for 21 CFR 111.70(b) compliance by [date].'"
  - For topics: provide the full list of valid topic slugs and say
    "Select ONLY from this list. Do not invent new topics."
  - For affected_ingredients: "List the SPECIFIC ingredients, substances,
    or chemical names that are directly regulated or affected by this action.
    Use ingredient names as commonly listed on supplement/food/cosmetic labels
    (e.g., 'BHA', 'Red No. 3', 'whey protein isolate', 'titanium dioxide').
    This field is used to match subscriber products by ingredient — be precise."
  - For affected_product_types: "List broad product categories affected
    (e.g., 'dietary supplement', 'food additive', 'cosmetic', 'topical').
    Use standard FDA product type terminology."
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

  c) Post-process the response:
     - Verify citations: substring check quote_text in raw_content
       Set quote_verified = true/false on each citation
     - Validate topic slugs against the topics table
       Drop any topics not in the controlled vocabulary
     - Validate segment enums

  d) Insert results:
     - item_enrichments: summary, key_regulations, key_entities,
       enrichment_model, enrichment_version, confidence, raw_response,
       affected_ingredients, affected_product_types
       (These two fields are used by Phase 4C matching engine to score
       subscriber products against regulatory items.)
     - segment_impacts: one row per segment with relevance != 'none'
       Copy published_date from regulatory_items for denormalization
     - item_citations: one row per citation, linked to enrichment_id
       and/or segment_impact_id
     - item_topics: one row per topic tag

  e) Error handling:
     - If Gemini returns invalid structure: log, set processing_status
       = 'parse_error', skip
     - If rate limited: exponential backoff, retry up to 3 times
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
     - Embedding dimension: 768 (model default for text-embedding-3-small
       with dimensions parameter)

     WAIT — text-embedding-3-small default is 1536d. The schema says 768.
     Check techStack.md. It says "text-embedding-3-small" and schema says
     vector(768). You MUST pass dimensions: 768 to get 768d output.
     Or update schema to 1536. ASK THE USER which to use.

     For now: use 768d as the schema specifies. Pass dimensions parameter.

  c) Insert into item_chunks:
     - chunk_index = ordering
     - section_title = header text
     - content = chunk text
     - embedding = vector
     - token_count = approximate count

  d) Batch processing: process embeddings in batches of 20-50 to avoid
     rate limits. OpenAI embedding API supports batch input.

STEP 4: ENRICHMENT RUNNER (src/pipeline/enrichment/runner.ts)

  Orchestrates enrichment for new/updated items:

  a) Query: SELECT * FROM regulatory_items
     WHERE id NOT IN (SELECT item_id FROM item_enrichments)
     AND processing_status = 'ok'
     ORDER BY published_date DESC

  b) Process each item: enrichItem() → generateEmbeddings()

  c.5) After enrichItem() and insertions complete, call matchItemToProducts(itemId)
       (Phase 4C). This scores the newly enriched item against all subscriber
       products. The matcher lives in src/pipeline/matching/matcher.ts.

  c) Track progress: log to pipeline_runs with source = 'enrichment'

  d) Support partial runs: if interrupted, picks up where it left off
     (unenriched items query naturally handles this)

  e) Support re-enrichment: parameter to re-enrich items with
     enrichment_version < CURRENT_VERSION

CRITICAL DECISIONS:
- enrichment_version starts at 1. Bump when prompt/schema changes.
- Re-enrichment inserts new version, keeps old for comparison.
- Flash for high-volume/simple, Pro for complex — routing is automatic.
- Citation verification is best-effort — flag unverified, don't discard.
- Topic slugs MUST match the controlled vocabulary in the topics table.

ACCEPTANCE CRITERIA:
- [ ] Enrichment prompt produces structured output matching the Zod schema
- [ ] Flash/Pro routing works correctly based on item_type
- [ ] Citation verification checks quote_text against raw_content
- [ ] Topic slugs are validated against the topics table
- [ ] Segment impacts are created for each relevant segment
- [ ] Embeddings are generated at 768 dimensions
- [ ] Section-based chunking works for various content formats
- [ ] Segment-specific impact chunks have segment_impact_id set
- [ ] Error handling: bad items are flagged, not crashed on
- [ ] Re-enrichment with version bumping works
- [ ] Pipeline can be interrupted and resumed
- [ ] Enrichment results are high quality (manual spot-check 5-10 items)
- [ ] affected_ingredients and affected_product_types are populated for each item
- [ ] affected_ingredients uses label-friendly names (e.g. "BHA" not "butylated hydroxyanisole")

SUBAGENTS:
- During development: test with real data from Phase 2A-1 fetchers
- After completion: code-reviewer for prompt injection risks, error handling
- Quality check: manually review 5-10 enrichment outputs for accuracy
```

### Files to Create
| File | Description |
|------|-------------|
| `src/pipeline/enrichment/prompts.ts` | Enrichment prompt templates + Zod output schema |
| `src/pipeline/enrichment/processor.ts` | Main enrichment function |
| `src/pipeline/enrichment/embeddings.ts` | Chunking + embedding generation |
| `src/pipeline/enrichment/runner.ts` | Orchestration — find unenriched items and process |

### Gotchas
- **Embedding dimensions:** Schema says `vector(768)` but `text-embedding-3-small` defaults to 1536d. MUST pass `dimensions: 768` parameter. If this causes issues, update the schema to 1536 and adjust the migration.
- **Gemini structured output:** `generateObject()` with Zod schema should work but test edge cases. Some items may have minimal content (RSS items with just a title).
- **Citation verification is fuzzy:** LLMs paraphrase quotes. Substring match catches exact quotes; fuzzy match may be needed for paraphrased ones. Start with exact match, flag unverified as lower confidence.
- **Topic slug mismatch:** The LLM might invent topic slugs not in the vocabulary. Filter these out and log them — could be useful for vocabulary expansion later.
- **Rate limits:** Gemini Flash has generous limits but Pro is more restrictive. Backfill should throttle Pro calls.
- **HNSW index:** After loading 1000+ chunks, create the HNSW index: `CREATE INDEX CONCURRENTLY idx_item_chunks_embedding ON item_chunks USING hnsw (embedding vector_cosine_ops);`
