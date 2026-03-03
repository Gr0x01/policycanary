# Product-Level Regulatory Monitoring: Market Research

**Last Updated:** 2026-03-03
**Maintainer:** RB
**Status:** Research Complete
**Purpose:** Evaluate pivot from segment-level to product-level regulatory monitoring

---

## Executive Summary

**Product-level regulatory monitoring for food/supplement/cosmetics exists in adjacent forms but nobody does exactly what you are describing for FDA-regulated products.** The closest analogues are in chemicals (REACH compliance), consumer electronics (RoHS), and EU food supplements (FoodChain ID, SGS Digicomply). None of these serve U.S. FDA-regulated supplement/cosmetics brands with "enter your product, get alerts when regulations affect it."

**Three key findings:**

1. **The concept is validated by adjacent markets.** Chemicals/electronics have mature product-level compliance tools (VelocityEHS, IntegrityNext, iPoint/Sphera, Assent). EU food/supplements have emerging ones (FoodChain ID Supplements Compliance, SGS Digicomply Nutriwise). But nobody does this for U.S. FDA supplement/cosmetics.

2. **The buyer pool likely EXPANDS, not shrinks.** Product-level monitoring is comprehensible to people who would never buy a "regulatory intelligence platform" -- a founder with 5 supplement SKUs understands "monitor my products" in a way they don't understand "regulatory intelligence for the dietary supplement vertical."

3. **The biggest gap is between static compliance checking (does my formula comply today?) and dynamic regulatory monitoring (will my formula still comply tomorrow?).** Existing tools are snapshots. Nobody provides the continuous monitoring layer that says "the FDA just proposed banning BHA -- here are your 3 products that contain it."

---

## 1. Does Anything Like This Exist?

### 1A. Product-Level Compliance CHECKING (Static -- "Does my product comply today?")

These tools let you enter a product with ingredients and check current compliance. They do NOT monitor for regulatory changes that affect your product over time.

| Tool | How It Works | Market Focus | Pricing | Limitation |
|------|-------------|-------------|---------|------------|
| **SGS Digicomply Nutriwise** | Enter product details + target market, validate ingredients, generate compliance report | EU markets only (Belgium, France, Germany, Italy, UK). Up to 80 countries via ad-hoc projects | Credit-based ("purchase only what you need") | Static check, not ongoing monitoring. EU-focused, not U.S. FDA |
| **FoodChain ID Supplements Compliance** | Enter recipe details (galenic, ingredients, dosage), get instant compliance check + recommendations | EU + national regulations, 3,000+ substances | Enterprise pricing (not public) | Primarily European regulations. Monitoring is separate product |
| **Signify** | AI-driven ingredient check against FDA, EU, UK, and 50+ country regulations. Instant formula verification | Food, cosmetics, supplements, OTC drugs | Not public | Compliance checking, not regulatory change monitoring |
| **Cosmetri (Registrar Corp)** | 40K+ ingredients database, formulation compliance checks | Cosmetics (55+ countries) | Not public | PLM/formulation tool, not regulatory intelligence |
| **Trace One** | Go/no-go assessments on recipes/ingredients with traffic-light compliance indicators (170+ countries) | Food & beverage primarily | Enterprise (serves top 10 dairy, top 7 confectionery) | Enterprise-only, food-focused |
| **PRIMS (The Regulatory Company)** | Raw materials, formulas, compliance checks against EU regulatory data | Cosmetics (EU-focused) | Not public | EU cosmetics only |

**Key insight:** Static compliance checking is a solved problem for EU markets and large enterprises. It is NOT solved for:
- U.S. FDA-specific regulations (supplement DSHEA/cGMP, MoCRA cosmetics, FSMA food)
- Small/mid-size brands (everything above is enterprise-priced or EU-focused)
- Ongoing monitoring (none of these alert you when regulations change)

### 1B. Product-Level Regulatory MONITORING (Dynamic -- "Alert me when regs change for my product")

This is the gap. Tools that continuously monitor regulatory changes and map them back to your specific products.

| Tool | What It Does | How Close | Why It's Not The Same |
|------|-------------|----------|----------------------|
| **Freyr (freya.intelligence)** | AI-powered regulatory intelligence with Impact Assessment module. "Instantly identify impacted products, outdated label language, and region-specific actions." 100K+ regulations across 200+ markets | **Closest match conceptually** | Pharma/medical devices/cosmetics focus. Enterprise pricing (demo-only). No explicit U.S. FDA supplement focus. Likely $50K+/year |
| **VelocityEHS** | Compares chemicals/ingredients against 100+ regulatory lists. Flags regulated substances. AI-powered ingredient indexing | **Close for chemicals** | Chemical/industrial focus. Not food/supplement/cosmetics |
| **IntegrityNext** | Product-level data collection on restricted substances (REACH, RoHS, TSCA). Automated regulatory framework analysis | **Close for electronics/chemicals** | Supply chain focus. Starting at EUR 9,800/year. Not food/supplement |
| **iPoint/Sphera** | Check product portfolio against REACH/RoHS lists. Continuous monitoring of global regulation updates | **Close for electronics** | Consumer electronics/chemicals. EUR 450/year starting. Not food/supplement |
| **SGS Digicomply (broader platform)** | Customized email alerts for "news, recalls, and food safety updates that impact your product portfolio and markets" | **Conceptually close** | Enterprise pricing. Alert granularity unclear (portfolio-level, not per-product) |
| **Trace One** | "Smart alerts for changes, recalls, and emerging restrictions" affecting formulations | **Conceptually close** | Enterprise-only. Food & beverage only |

**The gap you identified is real:** Nobody takes a specific supplement product (e.g., "Gold Standard Whey, ingredients: whey protein concentrate, cocoa, lecithin, sucralose, acesulfame potassium") and continuously monitors FDA regulatory changes that specifically affect those ingredients, that product category, and that formulation type.

### 1C. Segment-Level Regulatory Monitoring (What You Currently Plan)

| Tool | What It Does |
|------|-------------|
| **Policy Canary (current plan)** | Monitors FDA changes for food/supplement/cosmetics SEGMENTS, delivers intelligence via email |
| **AgencyIQ** | Expert analysis of FDA regulatory developments by vertical ($25K-$75K/year) |
| **Changeflow** | Generic web monitoring of 50+ agencies ($free-paid) |
| **FDA Tracker AI** | Free 483/warning letter tracking (no regulatory change monitoring) |

---

## 2. Who Is the Buyer for Product-Level Monitoring?

### The Buyer Shifts and Expands

**Segment-level monitoring buyer = VP/Director of Regulatory Affairs**
- Sophisticated buyer who understands the regulatory landscape
- Knows they need to monitor the Federal Register
- Currently uses consultants, trade associations, and manual scanning
- Estimated: 2,500-6,000 potential buyers

**Product-level monitoring buyer = BROADER set of roles**

| Role | Company Size | Why They'd Buy Product-Level | Why NOT Segment-Level |
|------|-------------|-----------------------------|-----------------------|
| **VP/Director of Regulatory Affairs** | $10M-$500M | "Show me which of my 50 products are affected by this new rule" -- saves hours of manual cross-referencing | Would also buy segment-level. Product-level is a premium upsell |
| **Quality Director / QA Manager** | $5M-$50M | "I need to know if my formulations comply" -- quality people think in products, not regulatory categories | "Regulatory intelligence" sounds like someone else's job |
| **Founder / CEO** | $500K-$10M | "Tell me if my 5 products are about to become non-compliant" -- existential risk for small brands | Can't afford $299/mo for general regulatory news. Would pay $49-99/mo for "watch my products" |
| **Product Manager / R&D** | $10M-$100M | "What do I need to change in my next formulation?" -- forward-looking product decisions | Not their responsibility to monitor regulatory landscape generally |
| **Operations / Supply Chain** | $20M-$500M | "Which of our 200 SKUs need ingredient substitutions?" -- operational impact | Not who reads regulatory newsletters |
| **Contract Manufacturer** | $20M-$500M | "Which of our 4,000 formulas for 500 clients are affected?" -- massive leverage | Segment-level doesn't help them map to specific client products |

### Mid-Size Supplement Company ($5M-$50M) -- Who Pays?

**Primary buyer: The person who wears the "regulatory hat"**

In companies $5M-$20M, this is often:
- The Quality Director (also handles regulatory)
- The founder/CEO (especially if science/formulation background)
- An outsourced regulatory consultant

In companies $20M-$50M, this is typically:
- VP/Director of Regulatory Affairs (dedicated role)
- Quality Director reporting to VP Operations

**Budget authority:**
- VP Reg Affairs at $175K-$250K salary has budget authority for tools under $5K/year
- Quality Directors similarly empowered for quality/compliance tools
- Founders can approve anything

### Small Brands ($500K-$5M) -- Would Product-Level Reach Them?

**Yes, and this is where product-level fundamentally changes the addressable market.**

A founder with 5 supplement SKUs doing $2M/year:
- Will NOT buy a "regulatory intelligence platform" at $299/month -- sounds enterprise, sounds like a nice-to-have
- MIGHT pay $49-99/month for "we watch your 5 products and alert you if anything changes" -- sounds like insurance, sounds like peace of mind
- The mental model shifts from "stay informed about your industry" to "protect your specific products"

**This is the key market expansion opportunity:**
- IBISWorld counts 367 supplement manufacturers, but there are likely 5,000-15,000+ supplement BRAND OWNERS (including private label)
- NIH Dietary Supplement Label Database contains 200,000+ labels
- Advanced Supplements alone is trusted by 1,650+ brands
- The long tail of small brands is enormous and currently unreachable by segment-level tools

---

## 3. What Are People Currently Doing for Product-Level Regulatory Monitoring?

### The Current Workflow (Based on Research)

**Small brands ($500K-$5M):**
1. **Nothing proactive.** They find out about regulatory changes when their contract manufacturer tells them, when they see it on LinkedIn, or when they get a warning letter.
2. **Occasional consultant check-ins.** Pay $125-$450/hour for a consultant to review their products when something big happens (e.g., MoCRA, Red No. 3 ban).
3. **Trade association newsletters.** CRN, NPA, ACI newsletters provide headline-level awareness but zero product-level mapping.
4. **React after the fact.** "Wait, does this affect us?" followed by frantic Googling.

**Mid-size brands ($5M-$50M):**
1. **Manual Federal Register scanning.** The regulatory person reads FDA emails, scans the Federal Register, and mentally maps changes to their product portfolio. This is slow, error-prone, and dependent on one person's knowledge.
2. **Consultant retainers.** Pay $2,000-$10,000/month for a regulatory consultant who covers monitoring as part of broader compliance support. Product-level mapping is still manual.
3. **Internal cross-referencing.** When a new rule is identified, someone manually pulls up the product list, reviews each formulation, and identifies affected products. This can take hours or days for a portfolio of 50+ products.
4. **Trade association webinars/alerts.** Attend CRN/NPA/ACI webinars when big changes happen. Useful for awareness, not for product-specific impact assessment.

**Large brands / contract manufacturers ($50M+):**
1. **Dedicated regulatory team.** 2-10 people whose job includes monitoring. Still largely manual cross-referencing.
2. **Enterprise tools (rare).** Some use SGS Digicomply or FoodChain ID for EU compliance. Almost none have automated U.S. FDA product-level monitoring.
3. **Law firm alerts.** Subscribe to Hogan Lovells, Arnold & Porter, Sidley Austin FDA practice alerts. Good for legal interpretation, zero product-level mapping.

### The Pain Point

**The gap is always in the MAPPING step.**

Everyone can eventually find out about regulatory changes (Federal Register emails, newsletters, LinkedIn, consultants). The painful part is:

"OK, the FDA just proposed banning BHA. Which of my 47 products contain BHA? At what levels? In which product categories? Do I need to reformulate? What's the timeline?"

This mapping step is:
- **Manual** -- someone has to pull up every product formula
- **Error-prone** -- miss one product and you're non-compliant
- **Time-consuming** -- hours for a mid-size portfolio, days for a contract manufacturer
- **Knowledge-dependent** -- if your regulatory person leaves, the mapping capability leaves with them
- **Repeated** -- every regulatory change requires the same manual process

---

## 4. Contract Manufacturers -- Would Product-Level Work for Them?

### The CMO Opportunity

**Contract manufacturers are the IDEAL buyer for product-level monitoring.** They have the most to gain and the most painful version of the problem.

**Scale of the problem:**
- Vitaquest: 4,000+ custom formulas for 500+ brands
- Advanced Supplements: 1,650+ brand clients
- A typical mid-size CMO: 200-2,000 formulas for 50-200 brands

**What they need:**
When the FDA proposes banning a substance or changing a rule, the CMO needs to:
1. Identify every formula containing the affected ingredient/process
2. Identify every client affected
3. Notify those clients with specific impact assessments
4. Propose reformulation options
5. Update compliance documentation

**This is currently a massive manual process.** A CMO with 2,000 formulas might spend days identifying which ones contain a newly restricted ingredient.

**Product-level monitoring for CMOs would:**
- Automatically map regulatory changes to affected formulas
- Generate client-specific impact reports
- Prioritize by severity (banned vs. restricted vs. labeling change)
- Provide a competitive advantage ("we use automated regulatory monitoring to protect your products")

**What CMOs need that's different from brands:**
- Multi-client dashboard (aggregate view across all clients)
- Client notification workflow (generate alerts to send to specific brand clients)
- Higher formula volume (2,000+ products vs. 5-50 for a brand)
- Liability tracking (who is responsible for compliance -- brand or CMO?)

**Pricing implications for CMOs:**
- A CMO would likely pay significantly more than a brand owner
- Per-formula pricing could be very attractive: $1-5 per formula per month
- A CMO with 500 formulas at $3/formula = $1,500/month -- premium tier
- Value proposition: "What does it cost you when a client's product gets a warning letter because you missed a regulatory change?"

### Estimated CMO Market

| Segment | Count | Formula Volume | Annual Revenue Potential |
|---------|-------|---------------|------------------------|
| Large CMOs ($100M+) | 20-50 | 2,000-10,000 formulas | $6K-$60K/year each |
| Mid CMOs ($20M-$100M) | 50-150 | 500-2,000 formulas | $2K-$10K/year each |
| Small CMOs ($5M-$20M) | 200-500 | 50-500 formulas | $600-$2K/year each |
| **Total** | **270-700** | | **$300K-$5M potential** |

---

## 5. Market Size Implications -- Expand or Shrink?

### Segment-Level Market (Current Plan)

| Segment | Count | Price Point | Potential Revenue |
|---------|-------|-------------|------------------|
| Contract manufacturers | 50-150 | $499/mo | $300K-$900K |
| Mid-size supplement brands ($10M-$50M) | 200-500 | $299/mo | $720K-$1.8M |
| Mid-size cosmetics ($10M-$50M) | 300-800 | $299/mo | $1.1M-$2.9M |
| Small brands ($2M-$10M) | 2,000-4,000 | Free --> Pro | Conversion dependent |
| Consultants | 200-500 | $499/mo | $1.2M-$3M |
| **Total addressable** | **~2,500-6,000** | | **$3.3M-$8.6M** |

### Product-Level Market (Pivot Option)

| Segment | Count | Why Accessible | Price Point | Potential Revenue |
|---------|-------|---------------|-------------|------------------|
| Contract manufacturers | 270-700 | Massive formula volumes, clear ROI per formula | $100-$1,500/mo (volume-based) | $500K-$5M |
| Mid-size supplement brands ($10M-$50M) | 200-500 | "Monitor my products" is immediately understandable | $199-$499/mo | $480K-$3M |
| Mid-size cosmetics ($10M-$50M) | 300-800 | MoCRA + product listing = they already have product data | $199-$499/mo | $720K-$4.8M |
| **Small supplement brands ($500K-$10M)** | **5,000-15,000** | **"Watch my 5 products" is a product they'd buy** | **$29-$99/mo** | **$1.7M-$18M** |
| **Small cosmetics brands ($500K-$10M)** | **3,000-8,000** | **MoCRA newly regulated, product listing data exists** | **$29-$99/mo** | **$1M-$9.6M** |
| Consultants | 200-500 | Monitor across client portfolios | $299-$999/mo | $720K-$6M |
| **Total addressable** | **~9,000-25,000+** | | **$5.1M-$46M** |

### The Market EXPANDS Significantly

**Key expansion vectors:**

1. **Small brands become addressable.** The ~5,000-15,000 small supplement brand owners who would never buy a "regulatory intelligence platform" might buy "monitor my 5 products for $49/month." This alone could 3-5x the addressable market.

2. **New buyer personas.** Quality Directors, Product Managers, and founders become buyers -- not just regulatory affairs professionals. This roughly doubles the number of potential contacts per company.

3. **Per-product pricing unlocks CMOs.** A CMO paying per formula is a much larger deal than a flat subscription. A CMO with 2,000 formulas at $3/formula = $6,000/month vs. $499/month flat.

4. **Lower entry point, higher expansion.** $29-49/month for 5 products is an impulse purchase for a small brand. Then they add products. Then they upgrade for deeper analysis.

5. **Self-serve motion becomes viable.** "Enter your products, start monitoring" is a product-led growth motion. "Subscribe to regulatory intelligence for your industry segment" requires more explanation and trust.

### Risk: Potential Market Shrink

The product-level approach could shrink the market IF:
- Companies don't want to enter their product data (privacy/competitive concerns)
- The value of "which of my products are affected" is lower than "what's happening in my industry"
- Technical complexity of mapping regulations to specific ingredients is too high to deliver reliably
- Small brands are not willing to pay anything (not just unwilling to pay $299)

---

## 6. Adjacent Markets -- What Can We Learn?

### 6A. Pharma: Pharmacovigilance and Drug-Level Monitoring

**How it works:** Pharma companies must monitor every marketed drug for safety signals, regulatory changes, and compliance requirements across every country where the drug is sold. This is mandated by law.

**Key tools:**
- **Oracle Argus Safety**: Premier pharmacovigilance database. Per-drug adverse event tracking, regulatory submission automation
- **Cortellis Regulatory Intelligence**: AI-enhanced intelligence across 80+ markets. Per-drug regulatory tracking
- **IQVIA Pharmacovigilance**: End-to-end safety monitoring per product

**What we can learn:**
- Pharma product-level monitoring is MANDATORY (by regulation), not optional. Supplements have no such mandate. The value proposition must be "protect yourself" not "comply with monitoring requirements"
- Pharma tools are enormously expensive ($50K-$500K/year) because the cost of non-compliance is enormous (drug recalls, lawsuits, criminal liability)
- The pharma model of "one product = one regulatory dossier" maps well to supplements but at a smaller scale and lower price point
- Per-product pricing is standard in pharma compliance tools

### 6B. Chemicals: REACH Compliance by Product

**How it works:** EU REACH requires companies to register chemicals, track Substances of Very High Concern (SVHCs), and demonstrate compliance per product/substance. This created an entire product-compliance software industry.

**Key tools:**
- **VelocityEHS**: Compares ingredients against 100+ regulatory lists. AI-powered ingredient indexing. Per-product regulatory reporting
- **IntegrityNext**: Product-level restricted substance tracking (REACH, RoHS, TSCA). Starting at EUR 9,800/year
- **iPoint/Sphera**: Check product portfolio against REACH/RoHS lists. Continuous monitoring. Starting at EUR 450/year
- **kemXpro**: Automatic SVHC Candidate List monitoring. Per-chemical tracking
- **H2 Compliance (element1)**: Real-time regulatory data from ECHA and EPA. Per-substance monitoring
- **GPC Gateway**: Multi-regulation compliance portal with real-time monitoring

**What we can learn:**
- **The model is proven.** Companies WILL pay for "check my product against regulatory lists and alert me when those lists change." This is exactly what you're proposing for FDA supplements
- **Per-product/per-substance pricing works.** Chemical compliance tools often charge per substance or per product line
- **The regulatory list is the anchor.** These tools maintain a curated database of restricted/regulated substances and cross-reference user products against it. The FDA equivalent would be: NDI list, GRAS list, banned substances, restricted ingredients, cGMP requirements by product type
- **Enterprise pricing dominates.** Even the cheapest (iPoint at EUR 450/year) is not designed for a 5-product supplement brand. There's room for a more accessible entry point

### 6C. Consumer Electronics: CE/RoHS Product Compliance

**How it works:** Electronics manufacturers must demonstrate per-product compliance with RoHS (restricted substances), CE marking, WEEE (waste), and various regional requirements. Every product has a Declaration of Conformity.

**Key tools:**
- **CDX Platform**: 17,000 companies in 85+ countries. Substance data tracking per product. Supply chain compliance workflows
- **Assent**: Product-level REACH, RoHS, TSCA data collection and management
- **ComplianceGate**: Product compliance documentation and tracking

**What we can learn:**
- **Product-level compliance is the default expectation** in electronics. Nobody would sell an electronics compliance tool that doesn't work per product. The supplement industry is behind
- **Supply chain integration matters.** Electronics tools connect brands to their suppliers for component-level compliance data. The supplement analogy: connecting brands to their ingredient suppliers and contract manufacturers
- **Documentation per product is standard.** Every product has a compliance file. Supplements should have the same (and MoCRA cosmetics now require product listing, creating this data for the first time)

### 6D. EU Food Supplements: The Closest Analogue

**How it works:** EU regulations require per-product compliance for food supplements (different rules per country for ingredients, dosages, health claims, labeling). This created a market for per-product compliance tools.

**Key tools:**
- **FoodChain ID Supplements Compliance**: Enter recipe (galenic, ingredients, dosage), get instant compliance check per country. 3,000+ substances. Health claims and labeling automation
- **SGS Digicomply Nutriwise**: Product-level compliance assessment for 5 EU markets. Credit-based pricing
- **CIKLab**: QC software for supplement manufacturers. Per-batch compliance tracking. RDA dosage verification

**What we can learn:**
- **The EU already has per-product supplement compliance tools.** The U.S. does not (for FDA specifically). This validates the concept
- **Per-country variation creates complexity.** In the U.S., the analogue is per-state regulation (Prop 65, NY age restrictions, state food additive bans). This makes product-level monitoring even more valuable
- **Recipe/formula input is the key interaction.** Users enter their formula, the tool checks it. This is intuitive and directly valuable
- **Static checking is table stakes.** What's missing everywhere is the continuous monitoring layer -- "your formula was compliant yesterday, but today a new proposed rule could change that"

---

## 7. Strategic Implications

### The Hybrid Approach: Not Either/Or

**You don't have to choose between segment-level and product-level.** The optimal approach may be:

**Layer 1: Segment-Level Intelligence (the current plan)**
- What happened in supplements/cosmetics/food this week
- Analysis, context, action items
- Email-first delivery
- This is the AWARENESS layer

**Layer 2: Product-Level Monitoring (the expansion)**
- "Here's what this week's changes mean for YOUR specific products"
- Ingredient-level cross-referencing
- Per-product impact alerts
- This is the PERSONALIZATION layer

**The product-level layer makes the segment-level intelligence dramatically more valuable.** Instead of "the FDA proposed banning BHA" (interesting but abstract), you get "the FDA proposed banning BHA -- your Vanilla Protein Powder and Daily Multivitamin both contain BHA and would need reformulation by [deadline]."

### Implementation Considerations

**What you'd need to build:**
1. **Product/formula input mechanism**: Users enter their products with ingredient lists
2. **Ingredient database**: Canonical list of supplement/food/cosmetics ingredients mapped to regulatory entities
3. **Regulatory mapping engine**: When a new FDA action mentions an ingredient, substance, or product category, automatically identify which user products are affected
4. **Impact assessment**: Severity scoring per product (banned vs. restricted vs. labeling change vs. monitoring)
5. **Per-product alerts**: Notifications filtered to affected products

**Data advantage:**
- MoCRA requires cosmetics companies to list products and ingredients with FDA. This data exists
- NDI notifications are public and list ingredients
- Warning letters often cite specific ingredients
- Supplement Facts panels are public information (NIH DSLD has 200,000+ labels)

**Technical complexity:**
- Ingredient name normalization is hard (BHA vs. butylated hydroxyanisole vs. E320)
- Regulatory language is ambiguous (does "food additive" include supplement ingredients?)
- Mapping between FDA regulatory language and specific product ingredients requires NLP/AI
- This is hard but exactly the kind of problem LLMs are good at

### Pricing Model Options for Product-Level

| Model | How It Works | Pros | Cons |
|-------|-------------|------|------|
| **Per-product flat fee** | $5-15/product/month | Simple, predictable, scales with portfolio size | May feel expensive for small brands with 1-2 products |
| **Tiered by products** | $49 (5 products), $99 (20 products), $199 (50 products), $499 (unlimited) | Natural upgrade path, covers all segments | Tier boundaries create friction |
| **Base + per-product** | $29/month base + $5/product | Low entry, scales smoothly | More complex to explain |
| **Segment intelligence + product add-on** | $299/mo intelligence + $99/mo product monitoring | Keeps current model, adds premium layer | Two products to explain and sell |

### Recommended Approach

**Phase 1 (MVP -- current 6-day sprints):**
Build segment-level intelligence as planned. This is the awareness layer and establishes credibility.

**Phase 2 (Month 2-3):**
Add product-level monitoring as a feature within the existing product:
- Users can enter products with ingredient lists during onboarding
- When regulatory changes occur, the intelligence email includes a "YOUR PRODUCTS" section
- This becomes the highest-value feature and primary retention driver

**Phase 3 (Month 4-6):**
Introduce product-focused pricing tier:
- Free: Weekly digest (segment-level)
- Starter ($49/mo): Monitor up to 5 products, basic alerts
- Pro ($299/mo): Full intelligence + unlimited product monitoring
- CMO/All Access ($499-$999/mo): Multi-client product monitoring

This approach captures both the segment-level buyer (VP Reg Affairs who wants industry intelligence) AND the product-level buyer (founder who wants to protect their specific products).

---

## 8. Key Competitor Detail

### Companies Closest to Product-Level FDA Supplement/Cosmetics Monitoring

| Company | Product | What They Do | What They Don't Do | Pricing |
|---------|---------|-------------|-------------------|---------|
| **Signify** | Compliance AI Agents | AI ingredient check against FDA + 50 countries. Formula verification. Automated regulatory monitoring scanning global databases | Not FDA regulatory intelligence. Not email-first. Not segment-level analysis | Not public |
| **SGS Digicomply** | Nutriwise + platform | Per-product compliance assessment (EU only for Nutriwise). Global ingredient monitoring alerts | U.S. FDA per-product assessment. Small brand pricing. Email intelligence product | Enterprise (likely $10K+/year) |
| **FoodChain ID** | Supplements Compliance | Per-recipe compliance check (EU + US). 3,000+ substances | Continuous monitoring tied to products. Small brand access | Enterprise (likely $10K+/year) |
| **Freyr (freya.intelligence)** | Impact Assessment | "Identify impacted products, outdated label language, region-specific actions" across 200+ markets | FDA supplement-specific. Small brand pricing | Enterprise (demo only, likely $50K+/year) |
| **Trace One** | Regulatory Compliance | Per-formula go/no-go assessment. Smart alerts for changes. 170+ countries | Small brands. FDA supplement focus | Enterprise |

**The opportunity:** All of these are enterprise-priced, most are EU-focused, and none combine per-product monitoring with the kind of plain-English intelligence analysis you're building. Your differentiation is:
1. U.S. FDA-specific (not trying to cover 170 countries)
2. Affordable ($29-$499/month vs. $10K-$50K/year)
3. Email-first intelligence + product-level monitoring combined
4. Designed for the solo regulatory person, not a 10-person team

---

## Sources

### Product-Level Compliance Tools
- [SGS Digicomply Nutriwise](https://www.digicomply.com/food-supplements-compliance-assessment)
- [SGS Digicomply Global Ingredient Monitor](https://www.digicomply.com/global-ingredient-monitor)
- [FoodChain ID Supplements Compliance](https://www.foodchainid.com/products/supplements-compliance/)
- [Signify Supplement Formula Compliance](https://www.getsignify.com/supplements-formulation)
- [Signify Cosmetics Manufacturing Compliance](https://www.getsignify.com/cosmetics-manufacturing-compliance-software)
- [Trace One Regulatory Compliance](https://www.traceone.com/regulatory-compliance-software)
- [PRIMS Software](https://www.theregulatorycompany.com/prims-software-solution)
- [Cosmetri Product Manager](https://www.registrarcorp.com/software/cosmetri-product-manager/)

### Chemical/Electronics Product Compliance
- [VelocityEHS Regulatory Reporting](https://www.ehs.com/solution/chemical-management/regulatory-reporting/)
- [IntegrityNext Product Compliance](https://www.integritynext.com/product-compliance)
- [iPoint/Sphera REACH Compliance](https://www.ipoint-systems.com/solutions/reach/)
- [Assent Product Compliance](https://www.assent.com/solutions/product-compliance/)
- [CDX Electronics Compliance](https://public.cdxsystem.com/en/web/cdx/electronics)
- [GPC Gateway](https://gpcgateway.com/)
- [H2 Compliance](https://h2compliance.com/element-1/)
- [kemXpro Chemical Compliance](https://www.kemxpro.com/en/chemical-compliance)

### Pharma Regulatory Intelligence
- [Cortellis Regulatory Intelligence](https://clarivate.com/life-sciences-healthcare/research-development/regulatory-compliance-intelligence/regulatory-intelligence-solutions/)
- [IQVIA Pharmacovigilance](https://www.iqvia.com/solutions/safety-regulatory-compliance/safety-and-pharmacovigilance)
- [Freyr/freya.intelligence](https://www.freyafusion.com/products/freya-intelligence)

### Contract Manufacturing
- [Contract Manufacturing Oversight: 2026 FDA Enforcement Data](https://intuitionlabs.ai/articles/contract-manufacturing-oversight-fda-enforcement-2026)
- [Vitaquest Contract Manufacturing](https://vitaquest.com/supplement-contract-manufacturing-services/)
- [Signify Product Compliance Management](https://www.getsignify.com/blog/product-compliance-management-software)

### Market Data
- [NIH Dietary Supplement Label Database (200K+ labels)](https://ods.od.nih.gov/Research/Dietary_Supplement_Label_Database.aspx)
- [IBISWorld Vitamin & Supplement Manufacturing](https://www.ibisworld.com/united-states/industry/vitamin-supplement-manufacturing/490/)
- [Grand View Research U.S. Dietary Supplements Market](https://www.grandviewresearch.com/industry-analysis/us-dietary-supplements-market-report)

### Regulatory Context
- [FDA 2026 Priority Deliverables for Human Foods Program](https://www.hoganlovells.com/en/publications/fda-issues-2026-priority-deliverables-for-the-human-foods-program)
- [Key Regulatory Factors Shaping Dietary Supplement Industry 2026](https://www.skadden.com/insights/publications/2026/01/key-regulatory-and-business-factors)
- [FDA Cosmetics Regulations](https://www.fda.gov/cosmetics/cosmetics-laws-regulations/fda-authority-over-cosmetics-how-cosmetics-are-not-fda-approved-are-fda-regulated)
