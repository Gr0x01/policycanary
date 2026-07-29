# Agentic AI Search in B2B Legal/Regulatory/Compliance
**Research Date**: 2026-03-08
**Context**: Policy Canary considering agentic search for $399/mo Research tier

---

## 1. Competitive Landscape: Who Is Doing Agentic Search

### Thomson Reuters CoCounsel / Westlaw Advantage (Aug 2025)
- **Approach**: Full agentic with "Deep Research" — multi-step research plans, iterative retrieval, arguments on both sides, case law analysis
- **Architecture**: Orchestrator decomposes legal questions into research plans, executes across Westlaw + Practical Law content, synthesizes comprehensive reports
- **Differentiator**: Depth of proprietary content (Westlaw case law, Practical Law workflows)
- **Adoption**: 20,000+ law firms, majority of Am Law 100
- **Pricing**: CoCounsel Core starts $225/user/month. Westlaw Advantage is the "final" Westlaw platform
- **Verdict**: AGENTIC, not fixed RAG. Full plan-execute-synthesize loop

### Harvey AI
- **Approach**: ReAct paradigm — interleaved reasoning traces with tool calls
- **Architecture**: 5-stage workflow:
  1. Query understanding & planning
  2. Dynamic tool selection & retrieval
  3. Reasoning & synthesis
  4. Completeness check (loops back to step 2 if gaps found)
  5. Citation-backed response
- **Key metrics**: Tool selection precision improved from ~0 to 0.8-0.9. Complex queries scale from 1-2 to 3-10 retrieval operations
- **Evaluation**: LangSmith + OpenAI Agent SDK OpenTelemetry traces. Tracks hallucination rates, tool recall, retrieval recall, answer quality
- **Pricing**: ~$1,200/lawyer/month base, 20-50 seat minimums, enterprise-only. Expected to climb ~$400-600/yr with Lexis content bundle
- **Verdict**: AGENTIC. Most technically transparent about their approach. ReAct + iterative retrieval

### LexisNexis Lexis+ with Protege (Feb 2026)
- **Approach**: Multi-agent orchestration with specialized agents
- **Architecture**: Named agent types:
  - Orchestrator Agent (coordinates)
  - Legal Research Agent (decomposes queries, generates answers from Lexis content)
  - Web Search Agent (open web)
  - Customer Document Research Agent (reasons over customer's own docs)
- **Scale**: 300+ pre-built workflows, customizable, "white glove" workflow service
- **Verdict**: AGENTIC. Multi-agent architecture with clear agent specialization

### FiscalNote PolicyNote
- **Approach**: API-first with MCP server for AI agent consumption
- **Architecture**: Not deeply agentic internally — provides structured policy data (Congress, 50 states, 100+ countries) for external agents to consume
- **Key feature**: AI-powered bill comparison, personalized impact summaries
- **Strategy**: Position as the DATA LAYER for other agentic systems, not the agent itself
- **Verdict**: DATA PROVIDER, not agentic search. Interesting positioning — they let others build agents on their data

### Relativity aiR
- **Approach**: Agentic document review (not search)
- **Architecture**: Multi-step reasoning for document coding — analyzes documents, identifies key passages as citations, weighs arguments for/against relevance
- **Scale**: 250+ customers, 1,800+ projects, 3M docs/day throughput
- **Verdict**: AGENTIC but domain-specific (e-discovery/document review, not search)

### Summary Table

| Product | Agentic? | Architecture | Price Point | Target |
|---------|----------|-------------|-------------|--------|
| CoCounsel/Westlaw | Yes | Deep Research orchestrator | $225/user/mo | Law firms |
| Harvey | Yes | ReAct + iterative retrieval | ~$1,200/user/mo | AmLaw firms |
| Lexis+ Protege | Yes | Multi-agent (4 named agents) | Enterprise pricing | Law firms |
| FiscalNote PolicyNote | Data layer | MCP API for external agents | Enterprise API | Policy teams |
| Relativity aiR | Yes (review) | Multi-step doc reasoning | Enterprise | Litigation |
| **Policy Canary** | Proposed | Orchestrator + tools | $399/mo | FDA companies |

---

## 2. State of the Art: Agentic RAG in Production (2025-2026)

### What Works
- **ReAct pattern** is the dominant approach (Harvey, CoCounsel both use it)
- **Iterative retrieval with completeness checking** — the agent decides when it has enough, not a fixed pipeline
- **Specialized agents** beat general-purpose (Lexis has 4 named agent types)
- **Hybrid search** (vector + lexical) is now table stakes, not differentiator
- **Schema validation between agents** (Pydantic/Zod) is critical — catches failures before propagation

### Known Failure Modes
1. **Compounding reliability decay** (Lusser's Law): 98% per-step accuracy across 10 steps = 81.7% system accuracy. With validation boundaries catching 90% of errors: ~98% system accuracy
2. **Retrieval loops**: Agent stuck querying the same thing with slight variations
3. **Cascading hallucinations**: One wrong assumption poisons all downstream steps
4. **Tool call failures**: Wrong parameters, API format changes, silent failures
5. **Runaway costs**: One client's agent loop generated 58 identical responses before anyone noticed the bill. Another agent edited the same comma for 3 hours
6. **Over-retrieval**: Agent retrieves too much when confidence calibration fails
7. **Chunking quality**: 80% of RAG failures trace to chunking decisions, not model quality

### Production Reliability Numbers
- Current production agentic reliability: **60-70%** (enterprise needs 99.99%)
- **40%+ of agentic AI projects** predicted to be canceled by end of 2027
- **90% of agentic RAG projects failed in production in 2024** due to compounding failures
- Per-layer 95% accuracy across 5 layers = only 77% system reliability

### Best Practices for Production
1. **Validation boundaries** between every agent handoff (Zod schemas in our case)
2. **Circuit breakers**: Max iterations, max token budget, max wall-clock time per query
3. **Graceful degradation**: If agentic path fails, fall back to fixed RAG
4. **Best-of-N sampling**: Generate multiple candidates, evaluate before committing
5. **Observability**: Full trace logging (LangSmith, OpenTelemetry) for every tool call
6. **Human-in-the-loop**: For high-stakes outputs, surface confidence signals

---

## 3. Latency Expectations

### The Research
- **Conversational AI**: Users expect 200-500ms response time
- **Simple search**: 1-second delay = 7% conversion drop
- **Complex reasoning**: 30+ seconds is acceptable for "deep research" tasks
- **Perplexity Deep Research**: Completes "most tasks in under 3 minutes" — users accept this
- **ChatGPT Deep Research**: Minutes-long, streamed results

### B2B Professional Context
- B2B users have **higher tolerance for latency** when the output quality justifies it
- **Key insight**: The framing matters. "AI is researching your question" with progressive updates is acceptable. A blank loading spinner for 20 seconds is not
- A short delay is acceptable for complex analysis; even small lags feel disruptive in conversational contexts
- **Pattern from legal AI**: All major players (Harvey, CoCounsel, Lexis) produce research reports, not instant answers — users expect to wait

### Recommendation for Policy Canary
- **Target: 5-15 seconds** for typical regulatory queries (1-3 tool calls)
- **Acceptable: up to 30 seconds** for complex cross-reference queries (5-10 tool calls)
- **Must have**: Streaming status updates showing what the agent is doing
- **Fallback**: If exceeding 30s, surface partial results with option to "keep researching"

---

## 4. Communicating "AI Is Working" — What Works

### Patterns from Major Players
- **Perplexity**: Shows search queries being executed in real-time, sources being found, then streams the answer. Research reports "stream directly into a file"
- **ChatGPT Deep Research**: Shows a thinking/reasoning trace, step labels
- **Harvey**: Likely streams intermediate status (their blog mentions tool calls being visible in evaluation)
- **CoCounsel**: "Explains its logic" — suggests reasoning is visible to users

### What Works in B2B
1. **Step-by-step status labels**: "Searching FDA enforcement actions..." / "Cross-referencing with your products..." / "Analyzing 12 relevant items..."
2. **Source count accumulation**: Show sources found incrementally
3. **Streaming partial results**: Start showing text before the full answer is ready
4. **Time estimates**: "This typically takes 10-20 seconds for complex queries"
5. **Subtle AI indicators**: "Suggested by AI" / "AI-Powered" badges

### What Feels Gimmicky
- Fake typing animations on pre-computed text
- Overly anthropomorphized status ("I'm thinking really hard about this...")
- Progress bars with fake percentages
- Showing raw JSON/tool calls to non-technical users

### Recommendation for Policy Canary
- Stream tool-call status as labeled steps: "Searching regulatory database" -> "Found 8 relevant items" -> "Checking FDA.gov for updates" -> "Synthesizing answer"
- Show actual sources/documents being referenced as they're found
- Keep it professional — no personality, just clarity

---

## 5. Pricing: Does Agentic Justify Premium?

### Evidence That Agentic Commands Higher Prices
- **Harvey at $1,200/user/month** vs CoCounsel at $225/user/month — Harvey's deeper agentic capabilities correlate with 5x price
- **Thomson Reuters** explicitly positions Deep Research as a premium differentiator for Westlaw Advantage (their highest tier)
- **Lexis+ Protege** replaces Lexis+ AI entirely — agentic is the new baseline, not an add-on

### Pricing Models for Agentic AI
- **Hybrid model** (base platform fee + usage metering) is emerging as the standard
- **Per-seat flat rate** still dominates B2B legal (Harvey, CoCounsel, Lexis)
- **Per-resolution** pricing exists (Intercom Fin at $0.99/resolution) but not in legal/compliance
- **Per-query metering** creates anxiety — professionals don't want to think about cost per question

### Policy Canary Pricing Implications
- **$399/mo Research tier** is well-positioned if agentic search is a core differentiator
- At $399/mo, you're ~2x CoCounsel Core but offering a different domain (FDA regulatory vs legal research)
- The value prop is NOT "AI search" — it's "intelligence that monitors + researches for you"
- **Do not meter per-query** at $399/mo — include generous usage in the flat rate
- Consider a daily/monthly query cap as a soft guardrail (e.g., 100 agentic queries/month) rather than per-query billing
- **Cost control**: At ~$0.05-0.15 per agentic query (3-10 tool calls + synthesis), 100 queries/month = $5-15 in LLM costs per customer. Very healthy margin

---

## 6. Risks and Failure Modes for Policy Canary Specifically

### High Risk
1. **Hallucinated regulatory citations**: Worst-case scenario for an FDA intelligence product. Must have citation-backed answers with links to source documents
2. **Stale data presented as current**: If the agent retrieves outdated enforcement actions, users could make bad decisions
3. **Cost spikes from loops**: Without circuit breakers, a single runaway query could cost $5-10 in API calls

### Medium Risk
4. **Inconsistent latency**: Some queries take 3s, others 30s — unpredictable UX
5. **Tool call failures to external APIs**: FDA.gov, Federal Register could be down or rate-limited
6. **Over-retrieval noise**: Agent retrieves 50 items when 5 are relevant, synthesis quality drops

### Low Risk (but monitor)
7. **Model API outages**: Mitigated by fallback to simpler RAG
8. **Prompt injection via user queries**: Users could try to manipulate the agent
9. **Agentic DoS**: Crafted queries that cause infinite loops (needs circuit breakers)

### Mitigation Strategies
- **Hard limits**: Max 10 tool calls per query, 60s wall-clock timeout, $0.50 cost cap per query
- **Validation at every step**: Zod schemas for tool inputs/outputs
- **Citation requirement**: Agent MUST cite source documents — no unsourced claims
- **Graceful degradation**: If agentic fails, return "I found X relevant items but couldn't fully analyze them — here are the raw results"
- **Fallback path**: Simple vector search + LLM summary as backup when agent path fails
- **Observability**: Log every tool call, latency, cost per query for monitoring

---

## 7. Actionable Recommendations for Policy Canary

### Build Strategy
1. **Start with a constrained agentic pattern** — not a fully autonomous agent, but an orchestrator with 3-4 well-defined tools:
   - `search_regulatory_items(query, filters)` — your Supabase vector/full-text search
   - `get_item_details(item_id)` — fetch full enrichment data for a specific item
   - `search_fda_gov(query)` — live FDA.gov search for recent updates
   - `get_subscriber_products(user_id)` — context about what the user cares about

2. **Use Vercel AI SDK's tool calling** — you already have it in your stack. The `streamText` with tools pattern gives you streaming + tool calling out of the box

3. **Implement as a "research mode"** toggle — default search is fast fixed RAG, "deep research" opt-in activates the agentic path with visible status

4. **Circuit breakers from day one** — max 8 tool calls, 45s timeout, $0.30 cost cap per query

5. **Citation-first design** — every claim in the response links to a specific regulatory item in your database or a public URL

### What's Proven vs Experimental
| Aspect | Status | Evidence |
|--------|--------|---------|
| ReAct pattern for search | **Proven** | Harvey, CoCounsel, Lexis all ship it |
| Iterative retrieval with completeness check | **Proven** | Harvey improved precision from 0 to 0.8-0.9 |
| Streaming status updates | **Proven** | Perplexity, ChatGPT, all major players |
| Multi-agent orchestration | **Experimental** | Lexis has it, but reliability compounds |
| Autonomous tool selection | **Semi-proven** | Works with 3-5 tools, unreliable with 10+ |
| Deep research reports (minutes) | **Proven** | Perplexity, ChatGPT, CoCounsel all ship it |
| Per-query cost control | **Proven** | Circuit breakers are standard practice |

### What NOT to Build
- Do NOT build a multi-agent system — single orchestrator + tools is sufficient for your domain
- Do NOT try to compete with Harvey/CoCounsel on legal research depth — your moat is FDA-specific enriched data
- Do NOT make agentic the only search path — fast fixed search must remain available
- Do NOT expose raw tool calls to users — translate to professional status labels

---

## Sources

### Agentic Search Players
- [Thomson Reuters CoCounsel Legal Launch](https://www.lawnext.com/2025/08/thomson-reuters-launches-cocounsel-legal-with-agentic-ai-and-deep-research-capabilities-along-with-a-new-and-final-version-of-westlaw.html)
- [Harvey: How Agentic Search Unlocks Legal Research Intelligence](https://www.harvey.ai/blog/how-agentic-search-unlocks-legal-research-intelligence)
- [Harvey: 3 Principles That Helped Scale Agent Development](https://www.harvey.ai/blog/principles-that-helped-us-scale-agent-development)
- [LexisNexis Launches Lexis+ with Protege](https://www.lawnext.com/2026/02/lexisnexis-launches-lexis-with-protege-replacing-lexis-ai-with-an-end-to-end-workflow-platform.html)
- [FiscalNote PolicyNote API + MCP](https://www.businesswire.com/news/home/20260302813063/en/FiscalNote-Announces-Enhancements-to-PolicyNote-API-Expanding-Access-to-Authoritative-Policy-Intelligence-for-AI-Agents-and-Enterprises)
- [Relativity aiR Agentic AI](https://www.relativity.com/blog/agentic-ai-is-in-the-air/)

### Architecture & Failure Modes
- [O'Reilly: The Hidden Cost of Agentic Failure](https://www.oreilly.com/radar/the-hidden-cost-of-agentic-failure/)
- [Galileo: Hidden Costs of Agentic AI — 40% Project Failure](https://galileo.ai/blog/hidden-cost-of-agentic-ai)
- [Composio: Why AI Agent Pilots Fail in Production](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap)
- [Kore.ai: Seven RAG Engineering Failure Points](https://www.kore.ai/blog/seven-rag-engineering-failure-points)
- [RAG Enterprise Guide 2025](https://datanucleus.dev/rag-and-agentic-ai/what-is-rag-enterprise-guide-2025)
- [Ultimate RAG Blueprint 2025/2026](https://langwatch.ai/blog/the-ultimate-rag-blueprint-everything-you-need-to-know-about-rag-in-2025-2026)

### Pricing
- [CoCounsel Review & Pricing](https://lawyerist.com/reviews/artificial-intelligence-in-law-firms/cocounsel-review-artificial-intelligence-for-lawyers/)
- [Harvey AI Pricing Case Study](https://www.agenticaipricing.com/case-study-harvey-legal-ai-premium-per-seat-pricing-in-law/)
- [Guide to Agentic AI Pricing Models](https://www.getmonetizely.com/articles/the-complete-guide-to-agentic-ai-pricing-models-usage-based-fixed-and-hybrid)
- [Chargebee: 2026 Playbook for Pricing AI Agents](https://www.chargebee.com/blog/pricing-ai-agents-playbook/)

### UX & Latency
- [Perplexity Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)
- [LLM Latency Benchmark 2026](https://research.aimultiple.com/llm-latency-benchmark/)
- [Glean: Latency Effects on User Experience](https://www.glean.com/perspectives/latency-effects-on-user-experience-evaluating-distributed-search-systems)
