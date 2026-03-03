---
Last-Updated: 2026-03-04
Maintainer: RB
Status: Active
---

# Technology Stack: Policy Canary

## Core Technologies

Modern web stack optimized for rapid solo development and minimal operational overhead.

### Backend
- **Runtime**: Node.js 18+ (via Next.js API routes)
- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **AI SDK**: Vercel AI SDK (unified interface across multiple LLM providers)
- **Payments**: Stripe (subscriptions, credit-card checkout)

### Frontend
- **Framework**: Next.js 16+ with React 19+
- **State Management**: React Context + useState/useReducer
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components + Lucide React icons
- **Markdown**: `react-markdown` + `remark-gfm` (blog post rendering)
- **Search**: AI search interface (RAG with pgvector)

### Infrastructure
- **Hosting**: Vercel (seamless Next.js integration)
- **Database Hosting**: Supabase (managed Postgres) — **schema live, 25 tables applied**
- **CDN**: Vercel Edge Network (included)
- **Analytics**: PostHog (product analytics)
- **Email**: Resend (chosen)
- **GitHub**: https://github.com/Gr0x01/policycanary

### Data Pipeline
- **Federal Register**: JSON API → parse → enrich with LLM → store
- **FDA.gov**: Structured pages / scraping → parse → enrich → store
- **XML parsing**: **`fast-xml-parser`** — used by the RSS fetcher to parse FDA RSS feeds in Node.js (no DOMParser in Node)
- **Scheduling**: **Inngest** (background jobs, pipeline orchestration, retries)
  - `/api/inngest` route registered in Next.js
  - `INNGEST_SIGNING_KEY` required in env
  - Run dev server: `npx inngest-cli@latest dev`

## LLM Architecture

**Vercel AI SDK** provides a unified interface to swap/combine providers without rewriting code. Three providers, each used for what they're best at:

| Provider | Model | Purpose | Why This Provider |
|----------|-------|---------|-------------------|
| **Google Gemini** | gemini-2.5-flash / gemini-2.5-pro | Data processing: enrichment, summarization, segment classification, topic tagging. Flash for simple classification, Pro for nuanced regulatory analysis. **Pro + thinking (budget: 4096)** also used for cross-reference inference (Step 1c) — reasoning about cross-segment risk transfer. | Cost-effective, large context window. Vercel AI SDK makes it easy to route by complexity. |
| **OpenAI** | text-embedding-3-small | Embeddings for semantic search (pgvector) | Best-in-class embeddings, well-supported in pgvector ecosystem. |
| **Anthropic** | claude-sonnet-4-6 | Writing: email intelligence content, AI search answers, editorial voice | Best writing quality. The intelligence email IS the product — writing quality matters most here. |

**Note on Gemini model selection:** Not everything in the pipeline is simple classification. Extracting accurate action items from a 50-page Federal Register rule requires real comprehension. Use Flash for high-volume/simple tasks (segment tagging, topic classification) and Pro for tasks requiring deeper understanding (impact analysis, action item extraction, cross-reference inference). Pro with thinking (Step 1c) gets a 4096-token thinking budget — the model needs to reason about exposure routes, regulatory precedent, and the nature of the concern before deciding whether to expand to additional segments. Vercel AI SDK makes routing between models trivial.

**DO NOT change model names or providers without explicit authorization.**

### Why Vercel AI SDK
- Unified `generateText()` / `streamText()` / `embed()` API across all three providers
- Switch providers by changing a single model parameter, not rewriting code
- Built-in streaming for AI search responses in the web app
- Structured output (Zod schemas) for consistent enrichment pipeline
- Native Next.js integration (RSC, route handlers, server actions)

## Environment Configuration

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth (Required)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # used in magic link emailRedirectTo; set to https://policycanary.io in Vercel env

# LLM — Multi-provider via Vercel AI SDK (Required)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key    # Data processing / enrichment
OPENAI_API_KEY=your_openai_key                   # Embeddings
ANTHROPIC_API_KEY=your_anthropic_key              # Writing / email content

# Payments (Required for subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Email (Required for digest delivery)
RESEND_API_KEY=your_resend_key  # or POSTMARK_SERVER_TOKEN

# Blog (Clawdbot write path)
BLOG_API_KEY=your_blog_api_key  # X-API-Key header for POST /api/blog

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## LLM Model Reference

**DO NOT change model names without explicit authorization.**

| Model | Provider | Purpose | Cost |
|-------|----------|---------|------|
| gemini-2.5-flash | Google | High-volume: segment tagging, topic classification, simple summarization | ~$0.15/1M input, ~$0.60/1M output (+ thinking) |
| gemini-2.5-pro | Google | Complex: impact analysis, action item extraction, regulatory nuance | ~$1.25/1M input, ~$10/1M output (+ thinking) |
| text-embedding-3-small | OpenAI | Semantic search embeddings (1536d, pgvector) | ~$0.02/1M tokens |
| claude-sonnet-4-6 | Anthropic | Email intelligence writing, AI search synthesis | ~$3/1M input, ~$15/1M output |

**Pricing note:** Gemini costs above are approximate — check current pricing. Models update frequently (Gemini 3.x is already in preview as of March 2026). Vercel AI SDK makes swapping to newer models a one-line change.

### Cost Implications of Multi-Provider
- **Gemini** handles the high-volume work (enrichment pipeline) at the cheapest rate
- **OpenAI embeddings** are a one-time cost per document + incremental for new items
- **Anthropic** is the most expensive per-token but used only for customer-facing writing — lower volume, higher quality bar
- Net effect: most tokens flow through the cheapest provider, premium provider only where quality directly impacts revenue

## Cost Summary

### One-Time (Initial Data Load)

| Component | Estimated Cost |
|-----------|----------------|
| Federal Register backfill (Gemini Flash + Pro enrichment) | ~$5-20 |
| FDA warning letters backfill | ~$5-10 |
| Embeddings (OpenAI) | ~$2-5 |
| Email content generation (Anthropic) | ~$3-8 |
| **Total** | **~$15-38** |

### Ongoing (Monthly)
- Supabase: Free tier → ~$25/mo (as data grows)
- Vercel: Free tier → ~$20/mo (Pro)
- Gemini (daily enrichment): ~$3-8/mo
- OpenAI (embeddings for new items): ~$1-3/mo
- Anthropic (email writing + AI search): ~$5-20/mo (scales with subscribers)
- Stripe: 2.9% + $0.30 per transaction
- **Total: ~$10-75/month** (scales with usage and subscribers)
