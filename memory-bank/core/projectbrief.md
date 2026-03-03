---
Last-Updated: 2026-03-03
Maintainer: RB
Status: Active
---

# Project Brief: Policy Canary

## Overview

**Goal:** Build an AI-powered regulatory monitoring tool that watches FDA changes and tells companies exactly how they affect their **specific products** — by name, by ingredient, with action items.

**Core Value:**
> "The FDA just proposed banning BHA — here are your 3 products that contain it, here's the deadline, here's what to do."

**Positioning:** Policy Canary monitors the FDA for YOUR products. Not "what happened in supplements" — that's a newsletter. We know your Gold Standard Whey contains whey protein isolate, lecithin, and sucralose. When the FDA changes identity testing requirements for whey protein, we tell you immediately, explain what it means for your specific product, and give you action items with deadlines.

**The gap:** Nobody does product-level FDA monitoring for food/supplement/cosmetics. Tools exist for static compliance checking ("does my formula comply today?") but NOT dynamic monitoring ("will my formula still comply tomorrow?"). The market sits between free Federal Register alerts and $50K+/year enterprise platforms. Nobody watches the FDA for YOUR specific products.

**Domain:** policycanary.io

---

## Why Now

- **MoCRA** — biggest expansion of FDA cosmetics authority since 1938, staggered deadlines through 2027, 9,500+ registered facilities. Next major deadline: biennial registration renewal **July 2026**
- **Supplement enforcement surge** — 73% increase in warning letters (H2 2025), 46% increase in CGMP observations (2023→2024), 48% of inspected firms cited
- **CBD compliance cliff** — new federal hemp rules effective **November 2026**, thousands of products become illegal
- **MAHA/Kennedy regulatory chaos** — GRAS reform, food dye bans (Red No. 3 by Jan 2027, all petroleum dyes by end 2027), supplement deregulation signals, FDA restructuring
- **DOGE/FDA cuts** — 3,859 employees lost, foreign inspections down ~50%. Companies must self-monitor
- **State regulatory patchwork exploding** — 140+ food additive bills across 38 states in 2025, Prop 65 enforcement surging (1,385 notices in first 4 months of 2025), NY supplement age restrictions
- **Manual status quo** — the universal pain point is the MAPPING step: "OK, the FDA proposed banning BHA — which of my 47 products contain BHA? At what levels? Do I need to reformulate?" This is manual, error-prone, takes hours, and repeats for every single regulatory change

---

## Competitive Landscape

Detailed research: `/memory-bank/research/competitive-landscape.md` (20+ competitor profiles)
Product-level research: `/memory-bank/research/product-level-monitoring-research.md`

| Lane | Who | What They Do | Why We're Different |
|------|-----|-------------|---------------------|
| Enterprise intelligence | RegASK, AgencyIQ, Cortellis, Redica | $25K-$200K/year, pharma-focused | Different price point, different customer |
| Static compliance checking | Signify, FoodChain ID, SGS Digicomply | "Does my formula comply today?" — snapshot, not monitoring | We do continuous monitoring, not one-time checks |
| Consulting | EAS, Lachman, FDAImports | $125-$450/hour, reactive, no tech | Partners, not competitors |
| Operational compliance | Trustwell, Allera, MasterControl | SOPs, traceability, audit management | Different job — they manage, we monitor |
| Free newsletters | AgencyIQ FDA Today, NutraIngredients | "Here's what happened in supplements" | We tell you what affects YOUR specific products |

**Our lane:** Product-level FDA monitoring. Nobody does this. The closest things are either EU-focused (FoodChain ID, SGS Digicomply), enterprise-priced ($50K+/year like Freyr), or in different industries (chemicals, pharma).

**Key competitive insight:** The gap between static compliance checking ("does my formula comply today?") and dynamic regulatory monitoring ("will my formula still comply tomorrow?") is where the product lives.

---

## Core Product: Product-Level Monitoring

**The product knows your actual products.** It knows your Marine Collagen Powder contains marine collagen, vitamin C, and hyaluronic acid. When the FDA changes something that affects marine collagen, you hear about it immediately — with analysis specific to your product.

### How It Works

1. **Onboarding:** Subscriber adds their products. Supplements auto-populate via DSLD (214K products with structured ingredients). Food products via USDA FoodData Central (454K products). Cosmetics via manual entry (paste ingredients, upload label photo). System knows every ingredient in every product.

2. **Monitoring:** Data pipeline ingests FDA regulatory changes (Federal Register, openFDA, warning letters, RSS, state data). Enrichment layer tags each item with affected ingredients, product types, facility types, claims, and regulations.

3. **Matching:** Product-level relevance matching. Each regulatory item is scored against each subscriber's product profiles. "Does this affect any of this subscriber's products, and how?"

4. **Delivery — Two emails:**
   - **Weekly Update** (free + paid) — generic, same for everyone. "Here's what happened at FDA this week." Content marketing piece. Awareness layer.
   - **Product Intelligence Email** (paid only) — custom generated per subscriber. Event-driven: fires immediately when something affects your products. Weekly "all clear" if nothing happened. Organized by YOUR products: "Your Marine Collagen Powder — FDA warning letter cited identity testing failures for marine-sourced collagen. This directly affects your product. 3 action items..."

5. **Web app** (paid) — search, enforcement DB, trends, archive. Personalized to show relevance to your products.

### What Makes This Worth Paying For

A free Federal Register alert tells you: "FDA proposed amendment to identity testing requirements (21 CFR 111)"

Policy Canary tells you: "Your Marine Collagen Powder is affected. The FDA is tightening identity testing for marine-sourced collagen. Three companies received warning letters for this exact issue in the last 12 months. Your lab needs to update testing protocols by Q3. Here's what to change."

**The gap between "what happened" and "what does this mean for MY products" is where the price lives.**

### Product Intelligence Email Structure

**When something affects your products (event-driven, immediate):**
- YOUR PRODUCTS — full analysis per affected product, why it matters, action items with deadlines
- YOUR SEGMENT — brief summaries of other relevant items + links
- ACROSS FDA — one-liner + link for everything else

**When nothing happened (weekly):**
- "All clear — nothing affecting your products this week." (Peace of mind is part of the value.)
- YOUR SEGMENT — anything notable in your space
- ACROSS FDA — one-liners for general FDA activity

---

## What We Are vs. What We're Not

| We Are | We're Not |
|--------|-----------|
| Product-level regulatory monitoring | Segment-level newsletter |
| "What does this mean for YOUR products" | "What happened in supplements" |
| Dynamic monitoring (will you comply tomorrow?) | Static checking (do you comply today?) |
| Email-first, event-driven alerts | App-first SaaS platform |
| Intelligence layer (watch, match, alert) | Operations layer (SOPs, audits, docs) |
| Complement to your consultant | Replacement for your consultant |
| FDA-focused, narrow and deep | Multi-country, broad and shallow |
| Credit card purchase, self-serve | Enterprise sales cycle |

---

## Target Customer

**Primary:** Founders and product owners at small-to-mid supplement, food, and cosmetics brands ($500K-$50M revenue). They think in products, not regulatory categories. "Tell me what affects my 5 products" — not "tell me about supplements."

**Expanded buyer personas (vs. segment-level approach):**

| Role | Why They Buy Product-Level | Company Size |
|------|---------------------------|-------------|
| **Founder / CEO** | "Tell me if my 5 products are about to become non-compliant" — existential risk | $500K-$10M |
| **Quality Director / QA Manager** | Thinks in products, not regulatory categories. Product monitoring IS their job. | $5M-$50M |
| **Product Manager / R&D** | "What do I need to change in my next formulation?" | $10M-$100M |
| **VP Regulatory Affairs** | "Show me which of my 50 products are affected" — saves hours of manual cross-referencing | $10M-$500M |

**High-value:** Contract manufacturers ($20M-$500M) — 200-2,000 formulas for 50-200 brands. When the FDA proposes banning a substance, they must identify every formula containing it and notify every affected client. Currently a massive manual process.

**Open question:** Regulatory consultants. They don't have "products" to monitor. Possible fit as referral partners rather than direct customers. TBD.

**Buying behavior:** Credit card purchase, no procurement process. All tiers under $6K/year.

### Buyer Pool (Product-Level)

Product-level monitoring expands the addressable market significantly by reaching small brands that would never buy "regulatory intelligence."

| Segment | Estimated Count | Likely Tier |
|---------|----------------|-------------|
| Small supplement/cosmetics/food brands ($500K-$5M) | 5,000-15,000+ | Starter |
| Mid-size brands ($5M-$50M) | 500-1,300 | Pro |
| Contract manufacturers | 270-700 | Business |
| Regulatory consultants | 200-500 | TBD |
| **Total realistic buyers** | **~6,000-17,500+** | |

At 2-5% capture: 120-875 paying customers.

---

## Pricing

**Research basis:** `/memory-bank/research/per-product-pricing-research.md`, `/memory-bank/research/product-level-pricing-research.md`, `/research/regulatory-platform-pricing-research.md`

### Model: Base + Per-Product, Two Access Levels

| Level | Base Price | Includes | Per Extra Product | What You Get |
|-------|-----------|----------|-------------------|-------------|
| **Monitor** | $49/mo | 5 products | $6/product/mo | Product intelligence emails (event-driven + weekly all-clear), urgent alerts, product dashboard, weekly update email |
| **Monitor + Research** | $249/mo | 5 products | $6/product/mo | Everything in Monitor + enforcement database, AI search, trend analysis, full regulatory archive |

**Free tier (post-trial):** 1 product, Monitor level only. Weekly update email. Keeps them in the funnel.

### Price Table

| Products | Monitor | Monitor+Research |
|----------|---------|-----------------|
| 5 (base) | $49 | $249 |
| 10 | $79 | $279 |
| 15 | $109 | $309 |
| 25 | $169 | $369 |
| 50 | $319 | $519 |
| 100 | $619 | $819 |

**Product cap:** Self-serve handles up to 100 products. Beyond 100 → "contact us" for custom pricing. 100+ is a different UX problem (email structure, product management, alert grouping) and a different sales conversation.

**Monthly billing only at launch.** Products change — subscribers add and remove products over time. Monthly billing handles this naturally (charge base + current product count each cycle). Stripe metered billing supports this. Annual billing can be added later once retention data exists, offered at a discount as an upsell.

### Why These Numbers

**Monitor at $49/mo:**
- Under $600/year. Less than 1 hour of consultant time. Easy credit card purchase for a small brand founder with 3-5 products.
- One warning letter costs $25,000-$100,000+. $49/mo is insurance that pays for itself if it catches ONE issue.

**Monitor+Research at $249/mo ($200 premium over Monitor):**
- The research platform is the moat — months of accumulated, tagged enforcement data with semantic search and trend analysis. Not a feature toggle, a different product.
- $49 → $249 is a 5.1x multiplier. Consistent with Westlaw (5.9x), LexisNexis (2.8x), FoodDocs (3.0x), Gartner (4-5x).
- A single 483 observation document from Redica costs $289. One month of Research gives unlimited access to a tagged, searchable database. Obvious value.
- Nothing exists in the $100-$500/mo range for searchable FDA food/supplement/cosmetics enforcement data. Below that is free/raw. Above is $25K-$98K/year enterprise. We own this gap.
- Comparable tools: Westlaw Edge $194/mo, FoodDocs Standard $181/mo, YouCompli $300/mo, LexisNexis Enhanced $257/mo.

**$6/product:**
- Scales linearly. No surprises. A 50-product company on Monitor pays $319/mo — still well under a warning letter.
- Same rate for both levels. The access level upgrade is a flat $200/mo regardless of product count. Clean.

### Open Pricing Questions

- Trial model (reverse trial vs standard)
- Whether to offer annual billing at launch or add later (research suggested $199/mo annual as a discount lever for Monitor+Research)
- Per-product rate validation — $6 feels right but needs testing with real buyers

---

## Segments (Backend Only)

Segments are **pipeline plumbing**, not a subscriber-facing concept. They help classify incoming regulatory data. Subscribers never see or choose segments — they just add their products.

### Launch (2026)
| Segment | Pipeline Purpose |
|---------|-----------------|
| **Supplements** | Classify regulatory items affecting dietary supplements (DSHEA, 21 CFR Part 111, NDI) |
| **Cosmetics** | Classify items affecting cosmetics/personal care (MoCRA, facility registration) |
| **Food** | Classify items affecting conventional food/beverages (FSMA, GRAS, food additives) |

### Expansion
| Addition | Timeline | Notes |
|----------|----------|-------|
| **State Compliance Layer** | Month 3-5 | 140+ bills across 38 states, Prop 65. Same pipeline, new data sources. |
| **Pet Food / Animal Supplements** | Month 5-7 | $29B market, 85-95% pipeline reuse. |

### Not Pursuing Under This Brand
- Hemp/CBD (stigma repels core buyers)
- Medical devices (different market, well-funded competitors)
- EU/International (separate product)

---

## Product Onboarding Data Sources

| Product Type | Primary Source | Products Available | Key Data |
|-------------|---------------|-------------------|----------|
| **Supplements** | DSLD (NIH) API | 214,780 (121K on-market) | Structured ingredients with amounts, categories, UNII codes, claims, form, manufacturer. No auth. |
| **Food** | USDA FoodData Central API | 454,596 branded | Ingredients (text), nutrition, UPC barcodes. Free API key. |
| **Cosmetics** | Manual entry | N/A | Paste ingredients, upload label photo, describe. No public product database exists. |

Detailed research: `/memory-bank/architecture/llm-data-flow.md`

---

## Data Sources (Regulatory Pipeline)

Detailed research: `/memory-bank/research/data-sources.md`

### MVP (Free, structured APIs)
| Source | Coverage | Method | Auth |
|--------|----------|--------|------|
| Federal Register API | Rules, proposed rules, notices (1994-present) | REST API, JSON | None |
| openFDA API | Enforcement/recalls, adverse events (2004-present) | REST API, JSON | Free key |
| FDA RSS Feeds | Recalls, safety alerts, press releases (13+ feeds) | RSS polling | None |

### Phase 2 (Auth or scraping)
| Source | Coverage | Method | Auth |
|--------|----------|--------|------|
| FDA Warning Letters | ~3,300 letters, all FDA centers | XLSX export + AJAX scraping | None |
| Regulations.gov | Comment periods, dockets | REST API | Free key |
| FDA Guidance Documents | Draft/final guidance | Web scraping | None |

### Phase 3 — State Compliance Layer
| Source | Coverage | Method | Auth |
|--------|----------|--------|------|
| California OEHHA (Prop 65) | Prop 65 listings, safe harbor levels | Web scraping + API | Varies |
| State legislature tracking | Food additive bans, supplement restrictions | Web scraping / bill tracking APIs | Varies |

---

## Go-to-Market

- **Content marketing:** Blog posts analyzing regulatory trends, LinkedIn thought leadership. The weekly update email (free) IS the content marketing — demonstrates value, builds audience.
- **Homepage product shot:** Show a real personalized product intelligence email. "This is what you'd get for YOUR products." Makes the value immediately tangible.
- **Trial:** Full product experience — add your products, get real intelligence. Converts without requiring a sales call.
- **LinkedIn outreach:** Low volume, high intent — 30-50 targeted conversations
- **Loss aversion narrative:** "One warning letter costs $50,000+. Policy Canary costs $948/year." Also: "The FDA cut 3,859 employees. They're focusing enforcement on the easiest targets. Don't be the easy target."
- **Consultant partnerships:** EAS, FDAImports, Lachman as referral partners
- **Self-serve signup** — this product should sell itself. No forced sales calls.

---

## Validation Strategy

**Consultant validation (cheapest, highest signal):**
- Budget 3-4 hours of consultant time (~$500-$1,200)
- Show sample product intelligence email (personalized to a real product)
- Key question: "If this email landed in your inbox and it was about YOUR products, would you pay for it?"
- If they say yes and name specific clients, there's product-market fit

**Free tier as validation:**
1. Build data pipeline + weekly update email
2. Launch free signup via LinkedIn outreach to 50+ product owners / regulatory professionals
3. Track: do they open? Do they click? Do they ask "can you do this for MY products?"
4. Offer paid trial to engaged free users
5. If nobody engages after 50 free signups, revisit before building more

---

## Success Metrics

| Milestone | Target |
|-----------|--------|
| Month 1 | Data pipeline live, weekly update email shipping, product onboarding working, 10-20 trial signups |
| Month 2 | Product intelligence emails generating, 5-10 paying subscribers |
| Month 3 | Web app live, 15-25 paying subscribers, begin state compliance research |
| Month 5 | State compliance layer, 30-50 subscribers |
| Month 7 | Pet food segment, 50-75 subscribers |

---

## Revenue Projections (Illustrative)

| Scenario | Customers | Avg Monthly | ARR |
|----------|-----------|-------------|-----|
| 100 Monitor (avg 8 products) | 100 | $67 | $80K |
| 50 Monitor+Research (avg 15 products) | 50 | $309 | $185K |
| 10 custom (100+ products) | 10 | ~$1,000 | $120K |
| **Blended (160 customers)** | **160** | **$200** | **$385K** |

Scales with customer acquisition. At 500 customers with similar mix: ~$1.2M ARR.

---

## Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| AI analysis not good enough / hallucinations | **Critical** | Always show source links, citation verification layer, position as "AI-assisted" |
| Product matching accuracy | **Critical** | DSLD provides verified ingredient data. Enrichment tagging must be deep enough for accurate matching. |
| Buyer doesn't exist at product-level | High | Validate with sample emails. Research says the mapping pain is real and universal. |
| Onboarding friction (adding products) | High | DSLD auto-populate for supplements. Make manual entry easy (paste/upload). |
| Solo dev can't maintain pipeline quality | Medium | Start with fewer sources, monitor health, alert on failures |
| Cosmetics product data gap | Medium | No public database. Manual entry fallback. Monitor MoCRA data availability. |
| Distribution / reaching niche audience | Medium | Content marketing + consultant referral network + free weekly email |
| Email deliverability | Medium | Use reputable sender (Resend/Postmark), warm up domain |
| Enterprise competitors move downmarket | Low-Medium | Product-level matching is a different product. Accumulated product profile data is a moat. |

---

## Open Questions

1. **Trial model** — reverse trial (14-day full → downgrade to 1 product) vs standard trial
2. **Consultants** — still a customer (how?), or just referral partners?
3. **Web app personalization** — product-centric default view, or generic enforcement DB?
4. **Data schema revision** — schema needs update for subscriber_products table, product-level matching
5. **Annual billing** — add at launch or defer until retention data exists? Research suggested $199/mo annual for Monitor+Research as discount lever.
6. **Per-product rate validation** — $6/product needs testing with real buyers

---

## Not Building

**Never (out of lane):**
- Compliance management tools (SOPs, audit workflows, document control)
- Formulation or PLM tools
- Label creation or review tools
- FDA registration services
- Consulting services
- Multi-country coverage (under this brand)
- Static compliance checking ("does my formula comply today?" — we do monitoring, not snapshots)

**Not for MVP:**
- Mobile app (responsive web only)
- Enterprise SSO / team management
- Custom report generation
- API access for third parties
- State regulatory layer (Month 3-5 expansion)
- Pet food/animal supplements (Month 5-7 expansion)
