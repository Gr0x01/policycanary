# Research & Search Feature — Planning Doc

**Status:** Planning (not building yet)
**Tier:** Monitor+Research ($399/mo)
**Last Updated:** 2026-03-08

---

## What It Is

Agentic regulatory research — not a search engine. An orchestrator model with tools follows the research thread: searches our enriched database, checks ingredient synonyms, pulls CFR sections, cross-references the user's products, and synthesizes a comprehensive analyst-quality answer. The user commissions a research query. The product does the work.

**The pitch:** "Ask a question about FDA enforcement, ingredient regulations, or compliance trends. Policy Canary researches the answer — checking our regulatory database, cross-referencing ingredient synonyms, pulling relevant CFR sections, and connecting findings to your specific products."

**One-liner for marketing:** "Search 20+ years of FDA enforcement data — filtered by what matters to your products."

## Design Principles

- **Premium feel.** People pay $399/mo. No stingy defaults, no metered UX, no "you have X searches remaining."
- **The analyst, not the search engine.** This is a research tool, not a chatbot. Search bar → research result → saved queries. No chat bubbles, no conversational threading.
- **Smart, not restrictive.** Flash bouncer suggests better queries on vague input. Never blocks — user can always "search as-is."
- **Product-first by default.** "My products" lens is ON by default. Users opt out of personalization, not in.
- **Speed is depth.** 3-5 seconds for simple queries (fast path). 10-15 seconds for complex queries (agent loop). The wait is a brand asset — the status trail shows real work being done.
- **Silent abuse protection.** High rate limits in the background. No UI for it. If hit, slow responses rather than hard block.

---

## Architecture: Agentic Search

### Why Agentic, Not Fixed RAG

A fixed RAG pipeline retrieves chunks and summarizes them. That's a newsletter with a search box. An agent follows the research thread — checks synonyms you didn't think of, pulls the actual regulation text, cross-references against your products. That's what a human analyst does. The brand promise is "the analyst in the room." The agent delivers on that promise.

**Market validation:** Harvey AI, CoCounsel/Westlaw, Lexis+ Protege all ship agentic search in production at scale. This is proven, not experimental. Harvey charges $1,200/user/month. CoCounsel Core is $225/user/month. We're at $399/mo — well-positioned.

### Query Flow — Research → Write Pipeline

```
User query
  → Gemini Flash: query quality check (~0.3s)
     → Good query → proceed silently
     → Vague/broad → show suggestions + "Or search as-is" link
  → Gemini Pro (with thinking + tools): RESEARCH phase
     → Reasons about what it needs (thinking mode)
     → Calls tools as needed (1-8 calls typical)
     → Each tool call → Flash formats a status label in parallel → SSE to client
     → When it has enough → outputs structured findings (evidence, sources, reasoning)
  → Claude Sonnet: WRITE phase
     → Receives Pro's structured findings as context
     → Writes the polished research brief (streamed to client)
     → Semi-dynamic sections, confidence calibration, product callouts
  → Return: streamed research brief with inline [1][2][3] citations + source cards
```

### Models & Roles — Three Models, Three Jobs

Same pattern as the email pipeline: Gemini produces intelligence, Sonnet writes the briefing. Each model does one thing well. No context-switching.

| Step | Model | Job | Output |
|------|-------|-----|--------|
| Query quality check | Gemini Flash | Bouncer — evaluate query quality, suggest better queries | Pass/fail + suggestions |
| Research | Gemini Pro (with thinking + tools) | Researcher — call tools, reason about gaps, gather evidence | Structured findings (JSON/rough data) |
| Status formatting | Gemini Flash (parallel) | Format raw tool call metadata into polished status labels | Status events via SSE |
| Research brief | Claude Sonnet | Writer — take Pro's raw findings, write the polished research brief | Streamed markdown brief |

**Why three models?**
- **Pro** is the best researcher. Thinking mode, tool calling, regulatory reasoning. It should focus 100% on gathering thorough evidence — not on writing pretty prose or formatting output.
- **Sonnet** is the best writer. It already writes email briefings from raw intelligence. A research brief is the same job: take structured findings and present them with editorial voice, confidence calibration, product callouts, and clean structure.
- **Flash** handles lightweight parallel work — the bouncer and status labels. Fast, cheap, never in the critical path.

**Why not one model for everything?** Asking Pro to research AND produce a polished brief forces it to switch between "what do I need to find next?" and "how do I present this?" in the same context. Splitting them means Pro's prompt stays clean (research-focused) and Sonnet's prompt stays clean (writing-focused). Better output from both.

**The handoff — structured JSON, not rough text.** Pro outputs findings as a validated JSON schema (Zod). This is the #1 defense against context loss, which causes 79% of multi-model pipeline failures. Sonnet receives typed, structured data — not ambiguous prose it has to interpret.

```typescript
// Pro's output schema (validated with Zod)
{
  query: string,                    // original user query
  findings: {
    summary: string,                // 2-3 sentence direct answer
    confidence: "high" | "medium" | "low",
    confidence_note: string,        // what's sourced fact vs interpretation
  },
  evidence: [{
    item_id: string,
    title: string,
    item_type: string,
    published_date: string,
    cfr_citations: string[],
    relevance: string,              // why this item matters to the query
    outcome: string,                // what happened
  }],
  regulation_text: [{               // from lookup_cfr tool
    cfr_section: string,            // e.g., "21 CFR 111.75(a)(1)"
    text: string,                   // actual regulation text (max 3-4 sentences)
    interpretation: string,         // what it means in practice
  }],
  product_connections: [{           // from get_user_products + reasoning
    product_name: string,
    ingredient_match: string,
    risk_assessment: string,
  }],
  external_sources: [{              // from search_web / fetch_url
    url: string,
    title: string,
    snippet: string,
    source_type: "news" | "government" | "publication",
  }],
  action_items: [{                  // when warranted
    action: string,
    deadline: string | null,
    priority: "high" | "medium" | "low",
  }],
  forward_looking: {                // What to Watch section
    trends: string,
    upcoming_dates: string[],
  },
  gaps: string[],                   // what Pro couldn't find — Sonnet flags these honestly
}
```

Sonnet receives this schema and writes the polished research brief. If Pro flagged gaps, Sonnet acknowledges them honestly ("Data on this specific compound was not available in our database"). This is acceptable because Pro with thinking is thorough — gaps should be rare.

**Same pattern as email pipeline:**
- Email: Gemini enriches items → Sonnet writes the Product Intelligence Briefing
- Research: Pro researches (structured JSON) → Sonnet writes the Research Brief

**Cost per query (3 models):**
- Flash bouncer: ~$0.001
- Flash status labels (3-8 calls): ~$0.003-0.008
- Pro research (thinking + tools): ~$0.05-0.15
- Sonnet brief: ~$0.03-0.08
- **Total: ~$0.08-0.24 per query**
- At 50 queries/day: ~$4-12/day → $120-360/month vs $399/month revenue. Margin still healthy.

### Agent Tools (All 7 Ship at Launch)

Every tool is an API call — no custom scraping infrastructure, no heavy builds.

| Tool | Service | What It Does | The Analyst Moment |
|------|---------|-------------|-------------------|
| `search_regulatory_db` | Supabase | Structured queries on enrichment tags (ingredient, product_category, item_type, regulation) + full-text search (tsvector) over 7,573+ enriched items | "Searched 7,500+ regulatory actions" |
| `get_item_details` | Supabase | Fetch full enrichment for a specific regulatory item | "Read the full analysis" |
| `get_user_products` | Supabase | Pull the user's product profiles, ingredients, categories | "Checked your product profiles" |
| `search_gsrs` | Supabase | Look up substance codes, synonyms, cross-references from 949K codes | "Checked ingredient synonyms — butylated hydroxyanisole, tert-butyl-4-hydroxyanisole" |
| `lookup_cfr` | eCFR API | Fetch specific CFR section text (e.g., 21 CFR 111.75) | "Read 21 CFR 111.75 — identity testing requirements" |
| `search_web` | Brave / Tavily | Search current FDA news, regulations.gov, press releases | "Checked current FDA news" |
| `fetch_url` | ScrapingDog | Fetch and extract content from a specific document URL | "Read the full Federal Register document" |

**Why all 7 at launch:** The brand promise is "the analyst in the room." A real analyst searches databases, checks synonyms, reads the actual regulation, checks current news, and reads primary source documents. Shipping with fewer tools means shipping a lesser analyst. Every tool is a straightforward API call — the build complexity is in the orchestrator and UX, not the tools.

**External services:**
- **Brave Search** or **Tavily** — web search API for `search_web`. Tavily is built for AI/RAG (returns clean extracted content). Evaluate both.
- **ScrapingDog** — handles JS rendering, anti-bot, returns clean HTML for `fetch_url`. Eliminates custom scraping infrastructure.
- **eCFR API** — public, free, well-documented. No auth needed.

### Retrieval Strategy — Structured Metadata + Full-Text Search (No Embeddings)

The enrichment pipeline already tags every regulatory item with rich structured metadata — product categories, ingredients, regulations, substance codes, action items. Pro understands user intent and translates queries into structured database queries against this metadata. No vector embeddings needed.

**Why no embeddings:** With an agentic architecture, the LLM IS the semantic layer. Embeddings are a workaround for when you don't have an intelligent model interpreting the query. Pro understands "BHA in cosmetics" and constructs `{ ingredient: "BHA", product_category: "cosmetics" }` — that's more precise than vector similarity. Full-text search (tsvector) handles keyword fallback.

What we need:
- `fts` (tsvector) column on `regulatory_items` for full-text keyword search
- Structured queries against `item_enrichment_tags` (tag_dimension + tag_value)
- The orchestrator constructs smart queries — tries multiple approaches when first attempt returns thin results

What we DON'T need:
- No `embedding` column on `regulatory_items`
- No embedding backfill (saves OpenAI cost + pipeline complexity)
- No pgvector similarity search
- No hybrid search RPC (RRF)
- No `item_chunks` table

### Circuit Breakers (Non-Negotiable)

Agentic systems can spiral. These limits are hard from day one:

| Guardrail | Value | Rationale |
|-----------|-------|-----------|
| `maxSteps` | 12 | Every tool can fire once (7) + 5 follow-up calls. Covers realistic worst case. Above Harvey AI's range (3-10) but not runaway territory. If a query needs >12 steps, the orchestrator prompt needs tuning — not a higher ceiling. |
| Timeout | 90 seconds | Via Inngest — NOT a Vercel serverless function. Generous for real queries, catches pathological cases. |
| Cost cap | $0.75 per query | ~0.2% of monthly revenue per user. Safety net, not a design constraint. |
| Tool retry | Never retry a failed tool — note the gap, continue | |
| Graceful degradation | If agent path fails, fall back to simple full-text search + Pro synthesis | |

**Why Inngest, not a Vercel function:** Vercel serverless has a 60s timeout. A thorough agentic query with 5-8 tool calls can take 30-90 seconds. Inngest provides long-running execution with observability and retries — same pattern used for daily-ingest and enrich-batch. API route receives query → kicks off Inngest function → streams status events back to client via SSE.

**Why not 20 maxSteps:** Compounding error risk. 98% accuracy per step × 12 steps = 78.5% system accuracy. At 20 steps that drops to 66.8%. More steps = more places to go wrong. Harvey AI caps at 3-10 on complex queries. 12 is generous.

**Error handling:** Tools never throw. They return `{ ok: true, data }` or `{ ok: false, error }`. The orchestrator continues with what it has and flags gaps in the answer. Same as a human analyst — work with what you can get, note what you couldn't find.

### Security

- **`search_web`:** Via Brave Search or Tavily API. Domain allowlist for result filtering — FDA.gov, regulations.gov, federalregister.gov, pubmed.ncbi.nlm.nih.gov.
- **`fetch_url`:** Via ScrapingDog API (handles JS rendering, anti-bot). Domain allowlist enforced before calling. HTTPS only. 64KB response cap. 5s timeout.
- **Prompt injection:** Tool results stay in function call result role (Vercel AI SDK does this by default). Strip obvious injection phrases from retrieved content.
- **Audit trail:** Log every tool call with arguments to a `search_log` table (JSONB).
- **All other tools:** Query-only against own DB via parameterized Supabase client. No injection risk.

### Rate Limiting (Silent)

| Limit | Value | Visible? |
|-------|-------|----------|
| Per minute | 10 | No |
| Per day | 100 | No |
| Per month | 1,000 | No |

If hit: slow responses, don't hard block. No counters, no "remaining" UI.

### Cost Math

| Scenario | Cost | Revenue |
|----------|------|---------|
| Simple query (1 tool call) | ~$0.02 | — |
| Complex query (3-5 tool calls) | ~$0.05-0.15 | — |
| Heavy user (50 queries/day) | ~$2.50-7.50/day → $75-225/month | $399/month |
| Typical user (5-10 queries/day) | ~$3-30/month | $399/month |

Margin is healthy even under heavy use. Be generous.

---

## Search Voice & Tone

**Voice:** Senior analyst responding to a research request. Same analyst as the email, different posture — responsive, not proactive. Reports findings, not opinions.

- **No throat-clearing.** Never "Based on my analysis..." or "Great question." Start with the answer.
- **No first person.** Never "I found 4 results." Always "4 enforcement actions cite BHA-related violations in cosmetics."
- **Calibrate confidence.** "Three of these warning letters specifically cited 21 CFR 111.75(a)(1). The remaining four referenced broader CGMP failures — the causal weight is less clear."
- **Short paragraphs, not bullet lists by default.** Use bullets only for discrete items (companies, citations, dates).
- **End with what to watch.** "No proposed rulemaking on this topic is currently open, but the enforcement pattern suggests the FDA is prioritizing this area."
- **When "My products" lens is on**, explicitly reference user's products: "Of these 7 warning letters, the violations most relevant to your **Marine Collagen Powder** involve..."
- **External vs internal sources:** Always distinguish. Internal sources get standard citation superscripts. External sources get a different treatment + "External source — not in Policy Canary's verified database" label. Never mix invisibly.

---

## UX Design

### Output Format — The Research Brief

The output is a **research brief** — a structured analyst memo, not a chatbot response. Mix of prose, tables, quoted regulation text, and product-specific callouts.

**Output elements Pro can produce:**

| Element | Markdown | When Used |
|---------|----------|-----------|
| Prose paragraphs | Standard text | Analysis, context, confidence calibration |
| Evidence tables | `\| col \| col \|` | Enforcement action lists, citation comparisons, timelines of events |
| Blockquotes | `>` | Quoted regulation text from CFR lookups — max 3-4 sentences, always followed by plain-language interpretation |
| Bullet lists | `- item` | Discrete findings, product connections |
| Numbered action items | `1. **Action**` | Specific actions with deadlines when warranted — same format as email briefings |
| Bold callouts | `**text**` | Product-specific relevance ("**Your Marine Collagen Powder** contains...") |
| Inline citations | `[1][2][3]` | Every factual claim linked to a source |
| Section headings | `### heading` | Semi-dynamic — adapt to query type, not a fixed template |
| Confidence statement | Italicized line | What is sourced fact vs. interpretation — the analyst tells you what she knows cold |

**Section structure — semi-dynamic, not a template:**

Two sections are always present: **Findings** (opener) and **What to Watch** (closer). The middle sections adapt to the query type. Headings should be specific — "Identity Testing Enforcement (2024-2025)" beats generic "Evidence."

| Section | Position | Always Present? | Purpose |
|---------|----------|-----------------|---------|
| **Findings** | 1st | Yes | Direct answer with confidence calibration. Start with the answer, not preamble. |
| **Your Products** | 2nd | When lens is on | Immediate product-level implications. This is the $399/mo moment — why it matters to THEIR products specifically. Bold product names, specific ingredient connections. |
| **Evidence** (dynamic heading) | Middle | When applicable | Supporting detail — enforcement action tables, citation comparisons, timelines. Heading adapts: "Warning Letter History," "Comment Period Status," "GRAS Petition Timeline." |
| **Relevant Regulation** | Middle | When CFR was looked up | Blockquoted regulation text + plain-language interpretation. The product reads the law so they don't have to. Never quote without interpreting. |
| **Action Items** | Near end | When actionable | Numbered, specific, with deadlines in amber when applicable. Same format as email briefings. Not every query has action items — don't force them. |
| **What to Watch** | Last | Yes | Forward-looking: upcoming deadlines (with dates), enforcement trends, proposed rules. Specificity required — "Q2 2026: FDA's pre-rule assessment expected" not just "the FDA is prioritizing this." |

**Confidence calibration** — a brief italicized statement after Findings or between Findings and Your Products:
> *This analysis covers enforcement actions from 2024-2025 (sourced from verified database). Forward-looking assessment of enforcement priorities is interpretive — based on pattern analysis, not official FDA guidance.*

**When "My Products" lens is off:** "Your Products" section does not appear. Don't force product specificity when the user explicitly asked for unrestricted search.

**What a typical research brief looks like:**

```
### Findings

4 enforcement actions cite BHA-related violations in cosmetics since
January 2024. Three directly reference 21 CFR 700.3, one references
broader CGMP failures where BHA was a secondary concern — the causal
weight is less clear in that case. [1][2][3][4]

*Enforcement data sourced from Policy Canary's verified database.
No proposed rulemaking on BHA is currently open — trend assessment
is interpretive.*

### Your Products

**Your Daily Glow Moisturizer** contains butylated hydroxyanisole (BHA)
as a preservative. The violations in [1] and [2] cite the same use
pattern — BHA as an antioxidant preservative in leave-on cosmetics.
Your product falls squarely within the enforcement scope.

### Warning Letter History (2024-2025)

| Date | Company | Citation | Outcome |
|------|---------|----------|---------|
| 2025-11-14 | Acme Cosmetics | 21 CFR 700.3 | Warning letter [1] |
| 2025-08-22 | GlowLab Inc | 21 CFR 700.3(y) | Warning letter [2] |
| 2025-03-10 | PureSkin Co | 21 CFR 700.3 | Warning letter [3] |
| 2024-09-18 | NaturalBeauty | CGMP (multiple) | Warning letter [4] — BHA secondary |

### Relevant Regulation

> **21 CFR 700.3(y)** — A cosmetic ingredient is considered adulterated
> if it bears or contains any poisonous or deleterious substance which
> may render it injurious to users under the conditions of use...

In practice, BHA has been on FDA's review list since the 2024
reassessment of antioxidant preservatives. The enforcement pattern
suggests the FDA is applying a stricter interpretation of "deleterious
substance" to synthetic antioxidants in leave-on products.

### Action Items

1. **Review BHA concentration levels** in your Daily Glow Moisturizer
   against the thresholds cited in [1] and [2]
2. **Request your contract manufacturer's** preservative efficacy
   testing documentation — all 4 warning letters cited missing or
   inadequate testing records
3. **Monitor the Spring 2026 FDA reassessment** of antioxidant
   preservatives (see What to Watch)

### What to Watch

Q2 2026: FDA's reassessment of antioxidant preservatives in cosmetics
is expected to produce updated guidance. No proposed rule yet, but
the enforcement pattern (4 actions in 14 months) suggests this area
is a priority. The next comment period, if opened, would likely have
a 90-day window.
```

**What we DON'T produce:**
- No charts or graphs — regulatory analysis is text-native. Value is in the analysis and sourcing, not visualization.
- No dashboards or metrics displays
- No raw data dumps — every output is analyzed, not just retrieved

### Results Layout

- **Single column, 720px max-width** (matches blog article layout)
- **Research brief rendered as markdown** (reuse `MarkdownContent` component). Tables, blockquotes, bold callouts, section headings all render naturally.
- **Inline citation superscripts** `[1][2][3]` — IBM Plex Mono, amber, clickable
- **Sources section below the brief** — always visible, not collapsible. Deduplicated by item. Compact cards: status dot, item type badge, title, date, excerpt, "Relevant to: [Product Name]" when matched
- **No side panel for sources.** The brief IS the product — give it full width.
- **Answer metadata:** "Based on [N] regulatory items from [date range]" in mono below brief
- **"Your products mentioned in these results"** — persistent element showing which products appear in source documents

### Flash Bouncer UX

- Suggestion card between search input and results area (neutral, not error-styled)
- "Broad queries return broad results. Here are some sharper angles based on your products:" + 2-3 clickable pills
- "Or search as-is" as secondary text link (amber, small)
- No loading state before suggestions (Flash is ~300ms — no skeleton)
- **Suggestions MUST be personalized** to user's products. Generic suggestions are worse than no bouncer.

### "My Products" Lens

- Persistent toggle below search input: "Focus on my products (5)"
- **ON by default** for users with products
- Matched source cards show "Relevant to: Marine Collagen Powder" in amber semibold
- Toggle off for unrestricted database search

### Streaming UX — Multi-Phase (Agentic)

The status trail is methodology, not a loading state. Each line teaches the user something or confirms a step they'd want done. Must be real — never performative.

**Phase 1 — Flash check (0-0.3s):** Subtle shimmer on search input border. If bouncer triggers, suggestion card appears immediately.

**Phase 2 — Agent working (0.3-12s):** Status lines appear as each tool completes:
- "Searching 7,500+ regulatory actions for BHA citations..." → "Found 8 relevant items"
- "Checking ingredient synonyms — butylated hydroxyanisole, tert-butyl-4-hydroxyanisole..."
- "Pulling 21 CFR 700.3 — cosmetic ingredient definitions..."
- "Cross-referencing with your product profiles..."

Status lines are in product voice, specific, and informative. They demonstrate competence.

**Phase 3 — Synthesis streaming (variable):** "Synthesizing analysis..." then progressive text render as Pro streams. Cursor at end of text. Sources fade in AFTER streaming completes (staggered, 30ms apart).

**Implementation — two phases over one SSE connection:**

**Research phase (Pro + Flash):**
- Pro calls tools in a loop. Each `onStepFinish` fires a parallel Flash call to format the status label. Status events stream to the client immediately.
- Pro never sees or generates these labels — its context stays research-focused.
- When Pro finishes, it outputs structured findings (evidence gathered, sources, confidence assessments, reasoning).

**Write phase (Sonnet):**
- Status line: "Writing research brief..." (or Flash-formatted equivalent)
- Sonnet receives Pro's structured findings + user's product profiles + the voice/tone guidelines.
- Sonnet writes the research brief via `streamText` — tokens stream to the client as it writes.
- Sources section rendered after streaming completes (staggered fade-in, 30ms apart).

**Why this split works:** Pro's prompt is purely about research strategy and tool use — no formatting instructions, no style guidelines, no section structure. Sonnet's prompt is purely about writing — no tool definitions, no research reasoning. Each model's context is clean and focused.

**Inngest execution:** The full pipeline (Flash bouncer → Pro research → Sonnet write) runs in a single Inngest function. Status events and streamed text piped back to client via SSE — implementation detail (Supabase Realtime, polling, or held connection) TBD during build.

**Hard rule:** Never show a step that didn't actually happen. The status must be real.

### First-Use State

- Search input centered vertically (shifts to top-aligned after first search)
- **Personalized example queries** using user's actual product names/categories
- If no products: generic examples + "Add your products to get personalized results"
- **Recent queries** (last 3) stored in localStorage, shown as ghost pills on return visits
- Placeholder text: "What do you need to know?" — not "Search regulatory intelligence..."

### Search Input

- Slightly taller padding (py-4), subtle inner shadow, faintest amber border on focus
- Feels substantial — this is a premium feature's primary input

### Progressive Elements

- **Copy-to-clipboard** on answers (one click, green check confirmation)
- **"Export PDF" button** — disabled with "Coming soon" tooltip. Signals professional tool.
- **"Research this" action** on feed items — pre-fills search for that item (upsell for Monitor users)
- **Global Cmd+K** — search accessible from any page (post-MVP)

### Not Doing

- **No chat/conversational follow-ups.** Each search is a fresh query. Research tool, not assistant.
- **No first person** in answers or status. The product reports findings.
- **No token counts, model names, or technical metadata** visible to users.
- **No fake progress steps.** Status trail is real or it doesn't appear.
- **No sharing/collaboration** (enterprise upsell, not MVP).

---

## Features

### Core (MVP of Research tier)

- [ ] **Agentic search** — orchestrator with tools, adaptive fast path + agent loop
- [ ] **7 tools at launch** — search_regulatory_db, get_item_details, get_user_products, search_gsrs, lookup_cfr, search_web, fetch_url
- [ ] **Structured retrieval** — metadata queries on enrichment tags + full-text search (tsvector)
- [ ] **Three-model pipeline** — Flash (bouncer + status), Pro (research + tools), Sonnet (write brief)
- [ ] **Flash query bouncer** — quality check with personalized suggestions
- [ ] **"My products" lens** — on by default, reranks by product relevance
- [ ] **Inline citations** — superscript markers linked to source cards
- [ ] **Multi-phase streaming** — status trail + progressive answer render
- [ ] **Circuit breakers** — maxSteps 5, 60s timeout, graceful degradation
- [ ] **Saved searches → alerts** — save a query, get notified on new matches
- [ ] **Confidence calibration** — internal vs external source distinction

### Post-MVP Features

- [ ] **Export** — PDF/CSV of research results
- [ ] **Search history** — persisted (beyond localStorage)
- [ ] **Global Cmd+K** — search from any page
- [ ] **"Research this" on feed items** — pre-fills search, Monitor→Research upsell

### Not Building

- Chat/conversational follow-ups
- Sharing/collaboration (enterprise upsell)
- Trend visualization (needs more data density)
- API access (no demand signal)
- Custom dashboards

---

## Dependencies / Prerequisites

- [ ] **Full historical backfill** — Federal Register (1994-present), openFDA enforcement (2004-present). Warning Letters already complete. Enrich all new items.
- [ ] Add `fts` (tsvector) column to `regulatory_items` (+ GIN index)
- [ ] Build 7 tool functions (search_regulatory_db, get_item_details, get_user_products, search_gsrs, lookup_cfr, search_web, fetch_url)
- [ ] Set up external service accounts (Brave/Tavily, ScrapingDog)
- [ ] Build Inngest function — full pipeline (Flash bouncer → Pro research → Sonnet write)
- [ ] Pro research step — thinking + 7 tools, maxSteps 12, outputs validated JSON schema (Zod)
- [ ] Define `ResearchFindings` Zod schema for Pro→Sonnet handoff
- [ ] Sonnet write step — receives typed findings, streams polished research brief
- [ ] Flash status formatter — parallel calls on each tool completion
- [ ] SSE streaming — status events + brief text piped back to client
- [ ] Refactor `/api/search` route — trigger Inngest, hold SSE connection
- [ ] Unhide search page from nav
- [ ] Research tier gating (access_level check on search route)
- [ ] Saved searches table + alert delivery mechanism
- [ ] `search_log` table for audit trail (JSONB)

---

## Testing Strategy

- **Golden query set:** 15-20 representative queries with expected answer properties (not expected tool paths). Score with a judge model (Flash).
- **Unit test tools, not the agent.** Each tool function is deterministic — test inputs/outputs in isolation.
- **Track tool call sequences in PostHog.** Watch for regressions when prompt changes cause unexpected tool patterns.
- **Same pattern as enrichment golden fixtures** (`tests/golden/fixtures.ts`).

---

## Open Questions

1. **Sonnet for orchestration** — confirmed as best tool caller, but adds Anthropic cost to every query. Worth it for quality? Or try Pro for both orchestration and synthesis?
2. **Saved search alert frequency** — daily digest of new matches? Immediate? Configurable?
3. **Tier name** — "Research" is strengthened by agentic architecture (the product literally does research). Keep it.
4. **Flash bouncer prompt** — what rubric does Flash use? Should it know what data we actually have (item counts per category)?
5. **"My products" lens** — injected into orchestrator context so it informs tool selection? Or only in synthesizer prompt?
6. **Graceful degradation path** — when agent fails, fall back to simple hybrid search + Pro synthesis. How transparent should we be about the fallback?

---

## Competitive Context

| Competitor | Price | Approach |
|-----------|-------|----------|
| **Harvey AI** | ~$1,200/user/month | ReAct orchestrator, iterative retrieval, completeness checking |
| **CoCounsel / Westlaw** | $225/user/month (Core) | "Deep Research" — decomposes questions, iterates across Westlaw content |
| **Lexis+ Protege** | ~$17,500/year/firm | Multi-agent: Orchestrator, Legal Research, Web Search, Customer Doc agents |
| **FiscalNote PolicyNote** | $50K-150K/year | NOT agentic search — ships MCP server for other agents to consume their data |
| **Policy Canary** | $399/month | Agentic search, FDA-specific, product-level personalization. Aggressively low for this market. |

**Key differentiation:** Nobody else maps findings to YOUR specific products. Harvey searches case law. Westlaw searches legal databases. We search FDA enforcement data and connect it to the ingredients in your Marine Collagen Powder. The product lens is the moat.

---

## References

- `memory-bank/development/ai-search-research.md` — initial market research (Perplexity, Westlaw, Lexis, RAG best practices)
- `memory-bank/development/research-agentic-search-2026-03-08.md` — agentic search market research (Harvey, CoCounsel, failure modes, latency expectations)
