# AI Search Research for Policy Canary
**Last Updated**: 2026-03-08
**Purpose**: Research synthesis for building AI-powered search over enriched FDA regulatory data
**Context**: $399/mo Research tier, solo dev MVP, Supabase + pgvector stack

---

## 1. What Makes Perplexity's Search UX Good (and What to Steal)

### Core Design Principles

**Familiar entry point, powerful output.** Perplexity's input field looks like a Google search bar. Users type keywords or natural language -- no prompt engineering needed. The magic happens in the output, not the input. This lowers the articulation barrier dramatically.

**Sources first, then answer.** Citations appear at the TOP of every response, with inline footnotes [1][2][3] linking claims to sources. This is not decoration -- it is the core trust mechanism. For regulatory intelligence, this is table stakes: users need to verify claims against actual FDA documents.

**Progressive disclosure during processing.** Perplexity found users tolerate wait times when they can see intermediate progress. Their Pro Search shows the plan being executed step-by-step: "Searching for X... Reading 12 sources... Analyzing results..." This transforms waiting from frustrating to engaging.

**Follow-up questions, not dead ends.** Every response includes suggested follow-up queries and "related searches." The conversation is threaded -- context carries forward. This turns a single query into an exploration session.

**Multi-format output.** Text, images, videos, maps -- whatever fits the query. For Policy Canary, this means: don't just return text summaries. Show timelines of enforcement actions, link to original FDA documents, surface related warning letters.

### What to Steal for Policy Canary

1. **Streaming answer with inline citations** -- Show answer tokens streaming in real-time with [1][2][3] footnotes linking to actual regulatory_items records
2. **Source cards at top** -- Before the synthesized answer, show 3-5 source document cards (warning letter title, date, company, link to original)
3. **Suggested follow-ups** -- Generate 2-3 related questions based on the query context ("What other companies received similar warnings?" / "Has this ingredient been flagged before?")
4. **Search plan transparency** -- Show "Searching warning letters... Checking enforcement actions... Cross-referencing ingredients..." as the system works
5. **Thread context** -- Allow follow-up questions that reference previous answers in the conversation

### What to Avoid

- Don't over-design the input. A simple search bar with optional filters (date range, document type, product category) is enough
- Don't hide sources behind expandable sections -- regulatory users NEED to see provenance immediately
- Don't auto-suggest queries before the user has typed anything (noise, not signal)
- Don't stream so fast that citations become unreadable -- pace matters

---

## 2. B2B Legal/Regulatory Search Tools: Features and Pricing

### Westlaw with CoCounsel (Thomson Reuters)

**AI Features (2025-2026):**
- **Deep Research**: Agentic AI that "reasons" through legal questions. Generates multi-step research plans, explains its logic, delivers comprehensive reports grounded in Westlaw content. This is NOT just search -- it is a research agent.
- **Westlaw Advantage** (Aug 2025): Described as the "final" version of Westlaw. Full AI integration across the platform.

**Pricing:**
- Enterprise contracts only, no public pricing
- AI upgrades framed as 30-50% increase over existing contracts
- Typical firm costs: $400K-$900K/year depending on size and negotiation
- Per-seat AI add-ons estimated at $100-300/user/month

**Key UX patterns:**
- Multi-step reasoning displayed to user (not just final answer)
- All AI outputs grounded in their proprietary content database
- Citation validation built into every response

### Lexis+ with Protege (LexisNexis)

**AI Features (Feb 2026 rebrand):**
- **Protege**: Conversational research with Shepard's citation validation
- **Protege General AI**: Toggle between legal-specific AI (grounded in LexisNexis content) and general-purpose models (GPT-5, Claude Sonnet 4, GPT-4o)
- **300+ workflows**: Pre-built task templates (summarize a case, draft a motion, analyze a contract)
- **Document analysis**: Upload up to 300 pages, AI extracts key information
- **Search Term Maps**: Highlights most relevant passages rather than returning full documents

**Pricing:**
- Median cost: ~$17,500/year per firm (for AI features)
- Custom enterprise pricing, no public rate cards
- Typically bundled with base Lexis+ subscription

**Key insight for Policy Canary:** The toggle between domain-specific AI and general AI is interesting. Our users might want "search FDA data specifically" vs "help me understand this regulation in plain English."

### FiscalNote PolicyNote (Closest Regulatory Analog)

**AI Features (2025):**
- Natural language search over legislative/regulatory documents
- Auto-generated summaries for every document
- AI-powered alerts with redesigned UX
- Legislative forecasting (predicts outcomes of bills)
- Detection of "substantively similar" bills across jurisdictions
- MCP server support -- lets AI agents (Claude, GPT, Gemini) access their data

**Pricing:** Enterprise, not publicly disclosed. Estimated $50K-150K/year based on company size.

**Key insight for Policy Canary:** FiscalNote's alert system and "similar document detection" map directly to what we should build. Their MCP server approach is forward-thinking but overkill for MVP.

### Pricing Lessons for Policy Canary ($399/mo Research Tier)

| Platform | Annual Cost | Per-Month Equivalent |
|----------|------------|---------------------|
| Westlaw AI add-on | $100-300/user/mo | $100-300 |
| Lexis+ with Protege | ~$17,500/firm/yr | ~$1,458 |
| FiscalNote | $50K-150K/yr | $4,167-12,500 |
| **Policy Canary Research** | **$4,788/yr** | **$399** |

Our $399/mo is extremely competitive in this space. The key is delivering enough value that regulatory professionals see it as a fraction of what they'd pay for Westlaw/Lexis, with FDA-specific depth those platforms lack.

**What justifies premium pricing in this space:**
1. Authoritative, curated data (not just web scraping)
2. Citation validation / source verification
3. Domain-specific AI that understands regulatory language
4. Alerts and proactive monitoring (saved searches, watchlists)
5. Workflow integration (export to compliance systems, generate reports)

---

## 3. RAG Search Best Practices (2025-2026)

### The Winning Architecture: Three-Stage Pipeline

```
Query --> [Stage 1: Hybrid Retrieval] --> [Stage 2: Reranking] --> [Stage 3: LLM Synthesis]
```

**Stage 1: Hybrid Retrieval (Keyword + Semantic)**
- Combine BM25/full-text search with vector similarity search
- Use Reciprocal Rank Fusion (RRF) to merge results: score = 1/(k + rank)
- Supabase supports this natively via `hybrid_search()` RPC function
- Default weights: roughly equal keyword and semantic, tuned per use case
- This alone gives ~48% improvement over single-method search (Pinecone analysis)

**Stage 2: Reranking**
- Pass top-N hybrid results through a cross-encoder reranker
- Best models (2026): Cohere Rerank, Jina Reranker, BAAI/bge-reranker
- Reranking is the highest-ROI step -- it catches relevance errors from Stage 1
- Retrieve ~20 candidates, rerank, return top 5-8

**Stage 3: LLM Synthesis**
- Feed reranked documents + original query to LLM
- Generate synthesized answer with inline citations
- Include source metadata (document title, date, URL) for verification

### Chunking Strategy for Regulatory Documents

**Recommended approach for FDA documents:**
- **Warning letters**: Page-level chunking (these are typically 1-5 pages, structured)
- **Federal Register rules**: Heading-aware chunking (these have clear section structure)
- **Enforcement reports**: 400-512 tokens with 10-20% overlap (tabular/mixed content)
- **General default**: Recursive character splitting at 400-512 tokens

**Key insight**: Our regulatory items are already structured data (title, summary, content, dates, categories). We may not need traditional chunking at all for the enriched summaries. The chunk IS the enriched item. For full-text FDA documents, heading-aware chunking is best.

**Metadata is critical**: Every chunk must carry its parent document metadata (item_id, document_type, date, product_categories, company_name). Metadata filtering BEFORE vector search dramatically improves relevance and reduces compute.

### Supabase-Specific Implementation

Supabase provides native hybrid search support:
- `tsvector` column + GIN index for full-text search
- `pgvector` extension with HNSW index for semantic search
- Built-in `hybrid_search()` RPC function using RRF
- Embedding model: OpenAI `text-embedding-3-small` (cheap, good enough) or `text-embedding-3-large` at 512 dimensions

**Schema addition needed:**
```sql
ALTER TABLE regulatory_items ADD COLUMN embedding vector(512);
ALTER TABLE regulatory_items ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))) STORED;
CREATE INDEX ON regulatory_items USING gin(fts);
CREATE INDEX ON regulatory_items USING hnsw(embedding vector_ip_ops);
```

### Query Expansion (Underrated Technique)

Before searching, use an LLM to expand the user's query:
- "formaldehyde in cosmetics" --> Also search for: "methylene glycol", "formalin", "DMDM hydantoin" (formaldehyde releasers)
- This is especially valuable for regulatory search where ingredients have multiple names
- We already have substance_codes and GSRS data -- use it for query expansion

### What NOT to Do

- Don't fine-tune embedding models (not worth it for MVP, pre-trained models are good enough)
- Don't build a separate vector database (Supabase pgvector is sufficient for our scale)
- Don't over-chunk -- our enriched items are already summary-length, they ARE the chunks
- Don't skip reranking -- it's the single biggest quality improvement after hybrid search

---

## 4. Proactive Search Features (Push, Not Just Pull)

### Saved Search Alerts (Table Stakes for $399/mo)

**How competitors do it:**
- FiscalNote: AI-powered alerts with keyword filtering, geography, regulatory topics
- Visualping: Monitors regulatory pages, sends email alerts with screenshots of changes
- RegASK: Transforms regulatory alerts into "actionable intelligence in one click"

**What Policy Canary should build:**
1. **Saved searches** -- User saves a query ("titanium dioxide" or "cosmetic warning letters"), gets notified when new matching items appear
2. **Product watchlist alerts** -- Already partially built via subscriber_products. When new regulatory items match a user's products, proactively alert them
3. **Digest frequency control** -- Real-time (email per match), daily digest, weekly digest
4. **"Similar to this" alerts** -- User marks a regulatory item as important, system watches for similar items (by embedding similarity)

### Proactive Intelligence (Differentiator)

**Beyond alerts -- surface patterns users haven't asked about:**
1. **Trend detection** -- "Warning letters mentioning [ingredient X] increased 300% this quarter"
2. **Peer monitoring** -- "A company in your product category received an enforcement action"
3. **Regulatory velocity** -- "The FDA has been unusually active in [category] this month"
4. **Cross-reference surprises** -- "An ingredient in your product was just flagged in a different regulatory context"

**Implementation for MVP:**
- Weekly digest email (already built via Clawdbot) is the vehicle
- Add a "personalized alerts" section to the briefing based on subscriber_products matches
- Saved searches stored in a `saved_searches` table with query + filters + notification preferences
- Cron job checks for new matches daily, batches into digest

### What FiscalNote Does Well (and We Should Learn From)

- **Substantively similar detection**: Their AI identifies when bills/regulations in different jurisdictions address the same issue. Our analog: detect when FDA actions across different product categories share patterns (same ingredient, same violation type, same manufacturer)
- **Forecasting**: They predict legislative outcomes. Our analog (future): predict enforcement trends based on historical patterns
- **API/MCP access**: They let AI agents query their data. Future consideration for us, not MVP

---

## 5. What Makes People LOVE vs Tolerate B2B Search

### The Research Says

**B2B users measure search by commercial outcomes, not delight.** Unlike B2C, B2B search satisfaction comes from:
1. **Did I find what I needed?** (Recall -- not missing relevant results)
2. **How fast?** (Time to answer, not time to first result)
3. **Can I trust it?** (Source authority, citation quality)
4. **Can I act on it?** (Exportable, shareable, integrable into workflows)

### What Separates "Love" from "Tolerate"

| Tolerated Search | Loved Search |
|------------------|-------------|
| Returns documents | Returns answers with sources |
| User must read and synthesize | System synthesizes, user verifies |
| Keyword-dependent (exact terms required) | Understands intent (natural language) |
| Static results | Learning results (improves with use) |
| Results only | Results + context (why this matters) |
| One-shot queries | Conversational, threaded follow-ups |
| Manual monitoring | Proactive alerts when things change |
| Generic ranking | Personalized to user's products/interests |

### Specific Patterns from Algolia's 2025 B2B Report

- 67% of B2B companies now use AI/ML in search (up significantly)
- Site search emerged as the #1 use case for AI in B2B (44%, up 7% YoY)
- Top priorities: meeting rising customer expectations (37%), supporting growth (36%), enhancing experience (34%)
- **Predictive UX** -- proactive recommendations that surface information before users search -- is the emerging frontier

### The "10x Better" Test for Policy Canary

For our $399/mo Research tier to be loved (not just tolerated), each search interaction should:

1. **Save 30+ minutes** vs manual FDA.gov searching
2. **Surface connections** the user wouldn't have found manually (cross-references, ingredient links, enforcement patterns)
3. **Cite every claim** with links to original FDA documents
4. **Remember context** -- "show me more like this" should work
5. **Proactively warn** -- don't wait for the user to search for bad news about their products

---

## 6. Recommended MVP Build Plan (6-Day Sprint)

### Priority Order (High Impact, Buildable)

**Day 1-2: Hybrid Search Infrastructure**
- Add embedding + fts columns to regulatory_items
- Generate embeddings for all 7,573 enriched items (batch job, ~$2-5 with text-embedding-3-small)
- Create hybrid_search() RPC function in Supabase
- Basic search API route with query + filters

**Day 3-4: Search UX (Perplexity-Inspired)**
- Search bar with optional filters (date range, document type, product category)
- Streaming AI answer with inline citations [1][2][3]
- Source cards showing matched regulatory items (title, date, type, company)
- 2-3 suggested follow-up questions generated per response

**Day 5: Reranking + Query Expansion**
- Add Cohere Rerank (or cheaper alternative) as Stage 2
- Use LLM to expand ingredient queries using our substance_codes data
- Metadata pre-filtering (product category, date range) before vector search

**Day 6: Saved Searches + Alerts Foundation**
- saved_searches table (user_id, query, filters, notification_preference)
- Basic save/manage UI
- Daily cron job to check for new matches
- Email notification for new matches (integrate with existing email infrastructure)

### Technical Stack Decisions

| Component | Choice | Why |
|-----------|--------|-----|
| Embeddings | OpenAI text-embedding-3-small (512d) | Cheap, good enough, Supabase native support |
| Vector store | Supabase pgvector (HNSW) | Already our DB, no new infra |
| Full-text search | PostgreSQL tsvector + GIN | Built into Supabase, zero cost |
| Hybrid merge | RRF via hybrid_search() RPC | Supabase provides this out of the box |
| Reranker | Cohere Rerank API | Best quality/price, simple API |
| LLM for synthesis | Claude Sonnet (via Vercel AI SDK) | Already in our stack |
| Streaming | Vercel AI SDK useChat | Already in our stack |
| Query expansion | Claude Haiku (fast, cheap) | Quick ingredient synonym expansion |

### Cost Estimate Per Search Query

| Step | Cost |
|------|------|
| Embedding query (text-embedding-3-small) | ~$0.00002 |
| Hybrid search (Supabase RPC) | Free (DB compute) |
| Reranking 20 docs (Cohere) | ~$0.002 |
| LLM synthesis (Claude Sonnet, ~1K tokens) | ~$0.01 |
| Query expansion (Claude Haiku) | ~$0.001 |
| **Total per query** | **~$0.013** |

At $399/mo, even 1,000 searches/month costs us ~$13. Massive margin.

---

## 7. Key Takeaways

1. **Citations are not optional.** Every B2B regulatory search product lives or dies by source attribution. Build this from day one.

2. **Hybrid search (keyword + semantic) with reranking is the proven architecture.** Don't skip reranking -- it is the single biggest quality lever after hybrid retrieval.

3. **Our enriched items ARE the chunks.** We don't need complex chunking strategies because our pipeline already produces structured, summary-length enriched items. The chunk is the item.

4. **Proactive > reactive.** The difference between a $99/mo and $399/mo product is that the expensive one tells you things before you ask. Saved searches, product watchlists, trend alerts.

5. **Supabase gives us 80% of the infrastructure for free.** pgvector + tsvector + hybrid_search RPC means no new databases, no new services. Just add columns and indexes.

6. **$399/mo is a steal in this market.** Westlaw charges $100-300/user/mo for AI add-ons alone. FiscalNote is $50K+/year. Our pricing is aggressive -- the product just needs to deliver on depth and specificity for FDA data.

7. **Streaming + transparency = trust.** Show the search plan executing, show sources before the answer, stream the synthesis. Users trust what they can see working.
